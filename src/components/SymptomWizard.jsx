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
import { db, auth } from "../services/firebase";

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
/*  AI assessment — should be moved server-side (Cloud Function).      */
/*  Calling OpenAI directly from the browser exposes your API key to   */
/*  anyone who opens devtools. Kept here only so the demo still runs;  */
/*  see comment at call site below.                                    */
/* ------------------------------------------------------------------ */
const getAITriageAssessment = async (symptoms, ageCategory, duration) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(
      "OpenAI API key missing. Defaulting to URGENT for manual review.",
    );
    return {
      urgency: "URGENT",
      aiAssessment:
        "AI evaluation unavailable. Flagged for manual clinical review.",
    };
  }

  const systemPrompt = `
You are a clinical triage support tool. You do NOT diagnose. You assess reported
symptoms and assign a priority band so a human clinician reviews the case in the
right order. Respond ONLY with valid JSON matching:
{
  "urgency": "EMERGENCY" | "URGENT" | "ROUTINE",
  "aiAssessment": "A concise 1-2 sentence, non-diagnostic summary for the reviewing clinician."
}

Urgency rules:
- EMERGENCY: any life-threatening presentation (chest pain, breathing difficulty, stroke signs, unconsciousness, severe bleeding, suicidal ideation).
- URGENT: acute conditions needing rapid review (high persistent fever, severe pain, suspected fracture, active but non-severe bleeding).
- ROUTINE: mild, self-limiting symptoms.

If uncertain, err toward the higher urgency band.
  `;

  const userPrompt = `
Patient age bracket: ${ageCategory}
Symptom duration: ${duration}
Reported symptoms: "${symptoms}"
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI HTTP Error: ${response.status}`);

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      urgency: result.urgency || "URGENT",
      aiAssessment: result.aiAssessment || "AI triage processed.",
    };
  } catch (err) {
    console.error("AI Triage Error:", err);
    // Fail-safe: default to URGENT (never ROUTINE) if the call fails
    return {
      urgency: "URGENT",
      aiAssessment:
        "AI evaluation unavailable. Priority elevated to URGENT for manual review.",
    };
  }
};

const URGENCY_LEVELS = { EMERGENCY: 3, URGENT: 2, ROUTINE: 1 };

/** Combine keyword red-flag detection with the AI's own band, always taking the higher (more urgent) of the two. */
const resolveFinalUrgency = (aiUrgency, redFlagHit) => {
  if (redFlagHit) return "EMERGENCY";
  return aiUrgency;
};

export const SymptomWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [emergencyDetected, setEmergencyDetected] = useState(false);

  const [formData, setFormData] = useState({
    ageCategory: "Adult (18 to 64)",
    duration: "Less than 24 hours",
    symptoms: "",
  });

  const errorSummaryRef = useRef(null);
  const emergencyBannerRef = useRef(null);

  // Re-check red flags live as the patient types, not just on submit —
  // an emergency banner shown late is an emergency banner shown too late.
  useEffect(() => {
    setEmergencyDetected(checkRedFlags(formData.symptoms));
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
      const redFlagHit = checkRedFlags(formData.symptoms);

      // NOTE ON PRODUCTION USE: this call currently goes straight from the
      // browser to OpenAI, which exposes your API key. Route this through a
      // Firebase Cloud Function (or similar backend) that holds the key
      // server-side and forwards only the minimum needed fields.
      const aiResult = await getAITriageAssessment(
        formData.symptoms,
        formData.ageCategory,
        formData.duration,
      );

      const finalUrgency = resolveFinalUrgency(aiResult.urgency, redFlagHit);

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
        redFlagTriggered: redFlagHit,

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

  /* ---------------------- Emergency banner (always visible if triggered) ---------------------- */
  const EmergencyBanner = () =>
    emergencyDetected ? (
      <div
        ref={emergencyBannerRef}
        tabIndex={-1}
        role="alert"
        className="mb-6 border-l-[6px] border-[#d5281b] bg-[#fdf2f2] p-4"
      >
        <div className="flex gap-3">
          <PhoneCall className="w-6 h-6 text-[#d5281b] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[#d5281b] text-base mb-1">
              This sounds like it could be a medical emergency
            </p>
            <p className="text-sm text-[#3d3d3d] mb-2">
              Based on what you've described, do not wait for this form to be
              reviewed.
            </p>
            <ul className="text-sm text-[#3d3d3d] list-disc list-inside space-y-1">
              <li>
                Call <strong>999</strong> now, or go to your nearest A&amp;E, if
                this is life-threatening.
              </li>
              <li>
                Call <strong>111</strong> or visit 111.nhs.uk if you're unsure
                and need urgent advice.
              </li>
            </ul>
          </div>
        </div>
      </div>
    ) : null;

  /* ---------------------- Confirmation screen ---------------------- */
  if (submitted) {
    return (
      <div className="bg-white border border-[#d8dde0] max-w-2xl mx-auto my-8">
        <div className="border-t-[6px] border-[#007f3b] p-8 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-[#007f3b] mx-auto" />
          <h2 className="text-2xl font-bold text-[#212b32]">
            Assessment submitted
          </h2>
          <p className="text-sm text-[#4c6272] max-w-md mx-auto">
            Your symptom report has been added to the clinical review queue. A
            member of the clinical team will review your case and be in touch.
          </p>
          <p className="text-xs text-[#4c6272] max-w-md mx-auto">
            If your symptoms get worse while you wait, call 111, or 999 in an
            emergency.
          </p>
          <button
            onClick={resetForm}
            className="mt-2 px-6 py-2.5 bg-[#005eb8] text-white font-bold text-sm hover:bg-[#003087] focus:outline focus:outline-[3px] focus:outline-[#ffeb3b] focus:outline-offset-2"
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
    <div className="bg-white border border-[#d8dde0] max-w-2xl mx-auto my-8 border-t-[6px] border-t-[#005eb8]">
      <div className="p-6 md:p-8">
        {/* Non-emergency but clinical-safety disclaimer, always visible */}
        <div className="mb-6 bg-[#f0f4f5] border border-[#d8dde0] p-3 text-xs text-[#4c6272]">
          This tool helps prioritise your case for clinician review. It does not
          provide a diagnosis. In a medical emergency, always call{" "}
          <strong>999</strong>.
        </div>

        <EmergencyBanner />

        {/* Step indicator */}
        <div className="mb-6 pb-4 border-b border-[#d8dde0]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#4c6272] mb-2">
            Step {currentStep} of 3: {stepLabel}
          </p>
          <div className="w-full bg-[#d8dde0] h-1.5">
            <div
              className="bg-[#005eb8] h-full transition-all duration-300"
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
            className="border-2 border-[#d5281b] p-4 mb-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-[#d5281b]" />
              <span className="font-bold text-[#d5281b] text-sm">
                There is a problem
              </span>
            </div>
            <p className="text-sm text-[#212b32]">{error}</p>
          </div>
        )}

        {/* Step 1 */}
        {currentStep === 1 && (
          <fieldset className="space-y-6">
            <legend className="text-xl font-bold text-[#212b32] mb-2">
              Patient information
            </legend>

            <div>
              <label
                htmlFor="ageCategory"
                className="block text-sm font-bold text-[#212b32] mb-1"
              >
                Age bracket
              </label>
              <select
                id="ageCategory"
                value={formData.ageCategory}
                onChange={(e) => updateField("ageCategory", e.target.value)}
                className="w-full p-3 border-2 border-[#4c6272] text-sm focus:outline focus:outline-[3px] focus:outline-[#ffeb3b] focus:outline-offset-0"
              >
                <option>Child (0 to 17)</option>
                <option>Adult (18 to 64)</option>
                <option>Senior (65+)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-bold text-[#212b32] mb-1"
              >
                How long have you had these symptoms?
              </label>
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) => updateField("duration", e.target.value)}
                className="w-full p-3 border-2 border-[#4c6272] text-sm focus:outline focus:outline-[3px] focus:outline-[#ffeb3b] focus:outline-offset-0"
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
                className="px-6 py-2.5 bg-[#005eb8] text-white font-bold flex items-center gap-2 hover:bg-[#003087] text-sm focus:outline focus:outline-[3px] focus:outline-[#ffeb3b] focus:outline-offset-2"
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
            <legend className="text-xl font-bold text-[#212b32] mb-2">
              Describe your symptoms
            </legend>

            <div>
              <label
                htmlFor="symptoms"
                className="block text-sm font-bold text-[#212b32] mb-1"
              >
                What's happening, and where?
              </label>
              <p id="symptoms-hint" className="text-xs text-[#4c6272] mb-2">
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
                className="w-full p-3 border-2 border-[#4c6272] text-sm focus:outline focus:outline-[3px] focus:outline-[#ffeb3b] focus:outline-offset-0"
              />
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 border-2 border-[#212b32] text-[#212b32] font-bold flex items-center gap-2 text-sm focus:outline focus:outline-[3px] focus:outline-[#ffeb3b] focus:outline-offset-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!formData.symptoms.trim()}
                className="px-6 py-2.5 bg-[#005eb8] text-white font-bold flex items-center gap-2 hover:bg-[#003087] text-sm disabled:opacity-50 focus:outline focus:outline-[3px] focus:outline-[#ffeb3b] focus:outline-offset-2"
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
            <h2 className="text-xl font-bold text-[#212b32]">
              Check your answers
            </h2>

            <dl className="bg-[#f0f4f5] border border-[#d8dde0] divide-y divide-[#d8dde0]">
              <div className="p-4">
                <dt className="text-xs font-bold text-[#4c6272] uppercase">
                  Age bracket
                </dt>
                <dd className="text-sm text-[#212b32] mt-1">
                  {formData.ageCategory}
                </dd>
              </div>
              <div className="p-4">
                <dt className="text-xs font-bold text-[#4c6272] uppercase">
                  Duration
                </dt>
                <dd className="text-sm text-[#212b32] mt-1">
                  {formData.duration}
                </dd>
              </div>
              <div className="p-4">
                <dt className="text-xs font-bold text-[#4c6272] uppercase">
                  Reported symptoms
                </dt>
                <dd className="text-sm text-[#212b32] mt-1 whitespace-pre-wrap">
                  {formData.symptoms}
                </dd>
              </div>
            </dl>

            <label className="flex items-start gap-3 text-sm text-[#212b32]">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-4 h-4 focus:outline focus:outline-[3px] focus:outline-[#ffeb3b]"
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
                className="px-5 py-2.5 border-2 border-[#212b32] text-[#212b32] font-bold flex items-center gap-2 text-sm disabled:opacity-50 focus:outline focus:outline-[3px] focus:outline-[#ffeb3b] focus:outline-offset-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-[#007f3b] text-white font-bold flex items-center gap-2 hover:bg-[#00602c] text-sm transition disabled:opacity-50 focus:outline focus:outline-[3px] focus:outline-[#ffeb3b] focus:outline-offset-2"
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
