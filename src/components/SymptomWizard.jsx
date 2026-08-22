import React, { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  PhoneCall,
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth, app } from "../services/firebase";

/* ------------------------------------------------------------------ */
/*  SAFETY NET — hard-coded red flags, independent of the AI call.     */
/*  This runs BEFORE and IN ADDITION TO the AI assessment. If the AI   */
/*  fails, hallucinates, or is skipped, this still catches emergencies.*/
/*  Never let an LLM be the only thing standing between a patient      */
/*  describing a stroke and a "routine" queue.                         */
/* ------------------------------------------------------------------ */
const RED_FLAG_PATTERNS = [
  /chest pain/i,
  /can'?t breathe|difficulty breathing|shortness of breath|breathless/i,
  /face (is )?droop|drooping face|slurred speech|can'?t speak/i,
  /arm weakness|one side.*weak|numb(ness)? (down |on )?one side/i,
  /unconscious|unresponsive|passed out|not waking up/i,
  /severe bleeding|bleeding heavily|won'?t stop bleeding/i,
  /seizure|fitting|convulsion/i,
  /overdose|took too many (tablets|pills)/i,
  /suicidal|want to (die|end my life|kill myself)|harm(ing)? myself/i,
  /anaphyla|swelling.*throat|throat.*closing/i,
  /blue lips|turning blue/i,
  /choking/i,
  /severe head injury|head injury.*unconscious/i,
];

const checkRedFlags = (text) => {
  if (!text) return false;
  return RED_FLAG_PATTERNS.some((pattern) => pattern.test(text));
};

/* ------------------------------------------------------------------ */
/*  AI assessment now runs server-side via a Cloud Function            */
/*  (functions/getTriageAssessment). The OpenAI key never reaches      */
/*  the browser, and the red-flag check is re-verified server-side     */
/*  so it can't be bypassed by a tampered client request.               */
/* ------------------------------------------------------------------ */
const functions = getFunctions(app);
const callTriageAssessment = httpsCallable(functions, "getTriageAssessment");

const getAITriageAssessment = async (symptoms, ageCategory, duration) => {
  try {
    const result = await callTriageAssessment({
      symptoms,
      ageCategory,
      duration,
    });
    return result.data; // { urgency, aiAssessment, redFlagTriggered }
  } catch (err) {
    console.error("AI Triage Error:", err);
    // Fail-safe: default to URGENT (never ROUTINE) if the call fails
    return {
      urgency: "URGENT",
      aiAssessment:
        "AI evaluation unavailable. Priority elevated to URGENT for manual review.",
      redFlagTriggered: false,
    };
  }
};

export const SymptomWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [emergencyDetected, setEmergencyDetected] = useState(false);
  // If the patient confirms a red-flag match was a false positive (e.g. "family
  // history of X"), they can dismiss the overlay and continue. Re-arms if they
  // keep editing after dismissing, so a genuine later red flag still interrupts.
  const [emergencyDismissed, setEmergencyDismissed] = useState(false);

  const [formData, setFormData] = useState({
    ageCategory: "Adult (18 to 64)",
    duration: "Less than 24 hours",
    symptoms: "",
  });

  const errorSummaryRef = useRef(null);
  const emergencyBannerRef = useRef(null);

  // Re-check red flags live as the patient types, not just on submit —
  // an emergency overlay shown late is an emergency overlay shown too late.
  useEffect(() => {
    setEmergencyDetected(checkRedFlags(formData.symptoms));
    setEmergencyDismissed(false); // any further edit re-arms the check
  }, [formData.symptoms]);

  useEffect(() => {
    if (emergencyDetected && emergencyBannerRef.current) {
      emergencyBannerRef.current.focus();
    }
  }, [emergencyDetected]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!consentGiven) {
      setError("You must confirm you understand this before submitting.");
      errorSummaryRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // aiResult.urgency already has the red flag check applied server-side —
      // this is the source of truth. The client-side checkRedFlags/emergencyDetected
      // above is only for showing the banner instantly as the patient types,
      // it never determines what actually gets stored.
      const aiResult = await getAITriageAssessment(
        formData.symptoms,
        formData.ageCategory,
        formData.duration,
      );

      const finalUrgency = aiResult.urgency;

      await addDoc(collection(db, "triage_queue"), {
        patientUid: auth.currentUser?.uid || "anonymous",
        patientName:
          auth.currentUser?.displayName ||
          auth.currentUser?.email ||
          "Anonymous Patient",
        patientEmail: auth.currentUser?.email || null,
        primarySymptom:
          formData.symptoms.slice(0, 80) +
          (formData.symptoms.length > 80 ? "..." : ""),
        symptomDetails: formData.symptoms,
        ageCategory: formData.ageCategory,
        duration: formData.duration,

        urgency: finalUrgency,
        aiAssessment: aiResult.aiAssessment,
        redFlagTriggered: aiResult.redFlagTriggered,

        status: finalUrgency === "EMERGENCY" ? "immediate_review" : "pending",
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting triage assessment:", err);
      setError(
        "Something went wrong submitting your assessment. Please try again.",
      );
      errorSummaryRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setCurrentStep(1);
    setConsentGiven(false);
    setEmergencyDetected(false);
    setFormData({
      ageCategory: "Adult (18 to 64)",
      duration: "Less than 24 hours",
      symptoms: "",
    });
  };

  /* ---------------------- Emergency overlay (full-screen, blocking) ---------------------- */
  const showEmergencyOverlay = emergencyDetected && !emergencyDismissed;

  const EmergencyOverlay = () =>
    showEmergencyOverlay ? (
      <div
        ref={emergencyBannerRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="emergency-overlay-title"
        className="fixed inset-0 bg-nhs-emergency-red z-50 flex items-center justify-center p-4"
      >
        <div className="bg-nhs-white max-w-md w-full p-6 space-y-4 border-t-[6px] border-nhs-emergency-red">
          <div className="flex gap-3">
            <PhoneCall className="w-8 h-8 text-nhs-emergency-red flex-shrink-0" />
            <h2
              id="emergency-overlay-title"
              className="font-bold text-nhs-emergency-red text-lg"
            >
              This sounds like it could be a medical emergency
            </h2>
          </div>

          <p className="text-sm text-nhs-black">
            Based on what you've described, don't wait for this form to be
            reviewed.
          </p>

          <div className="space-y-2">
            <a
              href="tel:999"
              className="block w-full text-center py-3 bg-nhs-emergency-red text-nhs-white font-bold hover:brightness-90"
            >
              Call 999 now
            </a>
            <a
              href="tel:111"
              className="block w-full text-center py-3 border-2 border-nhs-black text-nhs-black font-bold hover:bg-nhs-grey-light"
            >
              Call 111 for urgent advice
            </a>
          </div>

          <button
            onClick={() => setEmergencyDismissed(true)}
            className="w-full text-center text-xs text-nhs-grey-dark underline pt-2"
          >
            This isn't an emergency, let me continue with the form
          </button>
        </div>
      </div>
    ) : null;

  /* ---------------------- Confirmation screen ---------------------- */
  if (submitted) {
    return (
      <div className="bg-nhs-white border border-nhs-grey-mid max-w-2xl mx-auto my-8">
        <div className="border-t-[6px] border-nhs-urgency-routine p-8 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-nhs-urgency-routine mx-auto" />
          <h2 className="text-2xl font-bold text-nhs-black">
            Assessment submitted
          </h2>
          <p className="text-sm text-nhs-grey-dark max-w-md mx-auto">
            Your symptom report has been added to the clinical review queue. A
            member of the clinical team will review your case and be in touch.
          </p>
          <p className="text-xs text-nhs-grey-dark max-w-md mx-auto">
            If your symptoms get worse while you wait, call 111, or 999 in an
            emergency.
          </p>
          <button
            onClick={resetForm}
            className="mt-2 px-6 py-2.5 bg-nhs-blue text-nhs-white font-bold text-sm hover:bg-nhs-dark-blue"
          >
            Submit another assessment
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------- Wizard ---------------------- */
  const stepLabel = {
    1: "Patient details",
    2: "Symptom details",
    3: "Review and submit",
  }[currentStep];

  return (
    <div className="bg-nhs-white border border-nhs-grey-mid max-w-2xl mx-auto my-8 border-t-[6px] border-t-nhs-blue">
      <EmergencyOverlay />
      <div className="p-6 md:p-8">
        {/* Non-emergency but clinical-safety disclaimer, always visible */}
        <div className="mb-6 bg-nhs-grey-light border border-nhs-grey-mid p-3 text-xs text-nhs-grey-dark">
          This tool helps prioritise your case for clinician review. It does not
          provide a diagnosis. In a medical emergency, always call{" "}
          <strong>999</strong>.
        </div>

        {/* Step indicator */}
        <div className="mb-6 pb-4 border-b border-nhs-grey-mid">
          <p className="text-xs font-bold uppercase tracking-wide text-nhs-grey-dark mb-2">
            Step {currentStep} of 3: {stepLabel}
          </p>
          <div className="w-full bg-nhs-grey-mid h-1.5">
            <div
              className="bg-nhs-blue h-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* NHS.uk-style error summary */}
        {error && (
          <div
            ref={errorSummaryRef}
            tabIndex={-1}
            role="alert"
            className="border-2 border-nhs-emergency-red p-4 mb-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-nhs-emergency-red" />
              <span className="font-bold text-nhs-emergency-red text-sm">
                There is a problem
              </span>
            </div>
            <p className="text-sm text-nhs-black">{error}</p>
          </div>
        )}

        {/* Step 1 */}
        {currentStep === 1 && (
          <fieldset className="space-y-6">
            <legend className="text-xl font-bold text-nhs-black mb-2">
              Patient information
            </legend>

            <div>
              <label
                htmlFor="ageCategory"
                className="block text-sm font-bold text-nhs-black mb-1"
              >
                Age bracket
              </label>
              <select
                id="ageCategory"
                value={formData.ageCategory}
                onChange={(e) => updateField("ageCategory", e.target.value)}
                className="w-full p-3 border-2 border-nhs-grey-dark text-sm"
              >
                <option>Child (0 to 17)</option>
                <option>Adult (18 to 64)</option>
                <option>Senior (65+)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-bold text-nhs-black mb-1"
              >
                How long have you had these symptoms?
              </label>
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) => updateField("duration", e.target.value)}
                className="w-full p-3 border-2 border-nhs-grey-dark text-sm"
              >
                <option>Less than 24 hours</option>
                <option>1 to 3 days</option>
                <option>More than 3 days</option>
              </select>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-nhs-blue text-nhs-white font-bold flex items-center gap-2 hover:bg-nhs-dark-blue text-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </fieldset>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <fieldset className="space-y-6">
            <legend className="text-xl font-bold text-nhs-black mb-2">
              Describe your symptoms
            </legend>

            <div>
              <label
                htmlFor="symptoms"
                className="block text-sm font-bold text-nhs-black mb-1"
              >
                What's happening, and where?
              </label>
              <p id="symptoms-hint" className="text-xs text-nhs-grey-dark mb-2">
                Describe what you're feeling, where it is, and how severe it is.
                Do not include your name or contact details here — we already
                have those on file.
              </p>
              <textarea
                id="symptoms"
                rows="6"
                required
                aria-describedby="symptoms-hint"
                value={formData.symptoms}
                onChange={(e) => updateField("symptoms", e.target.value)}
                placeholder="For example: sharp pain in lower right abdomen since yesterday, worse when I press on it..."
                className="w-full p-3 border-2 border-nhs-grey-dark text-sm"
              />
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 border-2 border-nhs-black text-nhs-black font-bold flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!formData.symptoms.trim()}
                className="px-6 py-2.5 bg-nhs-blue text-nhs-white font-bold flex items-center gap-2 hover:bg-nhs-dark-blue text-sm disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </fieldset>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-nhs-black">
              Check your answers
            </h2>

            <dl className="bg-nhs-grey-light border border-nhs-grey-mid divide-y divide-nhs-grey-mid">
              <div className="p-4">
                <dt className="text-xs font-bold text-nhs-grey-dark uppercase">
                  Age bracket
                </dt>
                <dd className="text-sm text-nhs-black mt-1">
                  {formData.ageCategory}
                </dd>
              </div>
              <div className="p-4">
                <dt className="text-xs font-bold text-nhs-grey-dark uppercase">
                  Duration
                </dt>
                <dd className="text-sm text-nhs-black mt-1">
                  {formData.duration}
                </dd>
              </div>
              <div className="p-4">
                <dt className="text-xs font-bold text-nhs-grey-dark uppercase">
                  Reported symptoms
                </dt>
                <dd className="text-sm text-nhs-black mt-1 whitespace-pre-wrap">
                  {formData.symptoms}
                </dd>
              </div>
            </dl>

            <label className="flex items-start gap-3 text-sm text-nhs-black">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <span>
                I understand this is a triage prioritisation tool, not a
                diagnosis, and that in an emergency I should call 999 rather
                than wait for a response here.
              </span>
            </label>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="px-5 py-2.5 border-2 border-nhs-black text-nhs-black font-bold flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-nhs-urgency-routine text-nhs-white font-bold flex items-center gap-2 hover:brightness-90 text-sm transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit assessment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SymptomWizard;
