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
/*  SAFETY NET — Hard-coded red flags                                 */
/* ------------------------------------------------------------------ */
const RED_FLAG_PATTERNS = [
  /\bchest pain\b/i,
  /\b(can'?t breathe|difficulty breathing|shortness of breath|breathless)\b/i,
  /\b(face (is )?droop|drooping face|slurred speech|can'?t speak)\b/i,
  /\b(arm weakness|one side.*weak|numb(ness)? (down |on )?one side)\b/i,
  /\b(unconscious|unresponsive|passed out|not waking up)\b/i,
  /\b(severe bleeding|bleeding heavily|won'?t stop bleeding)\b/i,
  /\b(seizure|fitting|convulsion)\b/i,
  /\b(overdose|took too many (tablets|pills))\b/i,
  /\b(suicidal|want to (die|end my life|kill myself)|harm(ing)? myself)\b/i,
  /\b(anaphyla|swelling.*throat|throat.*closing)\b/i,
  /\b(blue lips|turning blue)\b/i,
  /\bchoking\b/i,
  /\b(severe head injury|head injury.*unconscious)\b/i,
];

const checkRedFlags = (text) => {
  if (!text || text.trim().length < 5) return false;
  return RED_FLAG_PATTERNS.some((pattern) => pattern.test(text));
};

/* ------------------------------------------------------------------ */
/*  AI Triage Service                                                  */
/* ------------------------------------------------------------------ */
const getAITriageAssessment = async (symptoms, ageCategory, duration) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const hasRedFlagMatch = checkRedFlags(symptoms);

  if (!apiKey) {
    console.warn("OpenAI API key missing. Elevating for safety.");
    return {
      urgency: hasRedFlagMatch ? "EMERGENCY" : "URGENT",
      aiAssessment:
        "API key unconfigured. Defaulted to elevated clinical review.",
      redFlagTriggered: hasRedFlagMatch,
    };
  }

  const systemPrompt = `
You are an expert NHS clinical triage AI following NHS 111 guidelines. Evaluate the patient's report.
Respond ONLY with a valid JSON object matching this exact schema:
{
  "urgency": "EMERGENCY" | "URGENT" | "ROUTINE",
  "aiAssessment": "A concise 1-2 sentence clinical summary explaining the evaluation."
}
`;

  const userPrompt = `Age Bracket: ${ageCategory}\nDuration: ${duration}\nReported Details: "${symptoms}"`;

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

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    let finalUrgency = result.urgency || "ROUTINE";
    if (hasRedFlagMatch && finalUrgency !== "EMERGENCY") {
      finalUrgency = "EMERGENCY";
    }

    return {
      urgency: finalUrgency,
      aiAssessment: result.aiAssessment || "AI triage processed.",
      redFlagTriggered: hasRedFlagMatch,
    };
  } catch (err) {
    console.error("AI Triage Error:", err);
    return {
      urgency: hasRedFlagMatch ? "EMERGENCY" : "URGENT",
      aiAssessment: "Evaluation offline. Fallback triage applied.",
      redFlagTriggered: hasRedFlagMatch,
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
  const [emergencyDismissed, setEmergencyDismissed] = useState(false);

  const [formData, setFormData] = useState({
    ageCategory: "Adult (18 to 64)",
    duration: "Less than 24 hours",
    symptoms: "",
  });

  const errorSummaryRef = useRef(null);
  const emergencyBannerRef = useRef(null);

  // Trigger emergency check only when leaving Step 2 or editing stops
  const evaluateEmergency = () => {
    const isRedFlag = checkRedFlags(formData.symptoms);
    setEmergencyDetected(isRedFlag);
    if (isRedFlag) setEmergencyDismissed(false);
  };

  useEffect(() => {
    if (
      emergencyDetected &&
      !emergencyDismissed &&
      emergencyBannerRef.current
    ) {
      emergencyBannerRef.current.focus();
    }
  }, [emergencyDetected, emergencyDismissed]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (currentStep === 2) {
      evaluateEmergency();
    }
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
      const aiResult = await getAITriageAssessment(
        formData.symptoms,
        formData.ageCategory,
        formData.duration,
      );

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
        urgency: aiResult.urgency,
        aiAssessment: aiResult.aiAssessment,
        redFlagTriggered: aiResult.redFlagTriggered,
        status:
          aiResult.urgency === "EMERGENCY" ? "immediate_review" : "pending",
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Submission Error:", err);
      setError(
        "Submission failed. Please check your connection and try again.",
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

  const showEmergencyOverlay = emergencyDetected && !emergencyDismissed;

  return (
    <div className="bg-nhs-white border border-nhs-grey-mid max-w-2xl mx-auto my-8 border-t-[6px] border-t-nhs-blue">
      {showEmergencyOverlay && (
        <div
          ref={emergencyBannerRef}
          tabIndex={-1}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="emergency-title"
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <div className="bg-nhs-white max-w-md w-full p-6 space-y-4 border-t-[6px] border-nhs-emergency-red shadow-2xl">
            <div className="flex gap-3">
              <PhoneCall className="w-8 h-8 text-nhs-emergency-red flex-shrink-0" />
              <h2
                id="emergency-title"
                className="font-bold text-nhs-emergency-red text-lg"
              >
                Medical Emergency Warning
              </h2>
            </div>
            <p className="text-sm text-nhs-black">
              Your symptoms suggest you may require immediate emergency care. Do
              not wait for an online response.
            </p>
            <div className="space-y-2">
              <a
                href="tel:999"
                className="block w-full text-center py-3 bg-nhs-emergency-red text-nhs-white font-bold hover:brightness-90"
              >
                Call 999 Immediately
              </a>
              <a
                href="tel:111"
                className="block w-full text-center py-3 border-2 border-nhs-black text-nhs-black font-bold hover:bg-nhs-grey-light"
              >
                Call NHS 111
              </a>
            </div>
            <button
              onClick={() => setEmergencyDismissed(true)}
              className="w-full text-center text-xs text-nhs-grey-dark underline pt-2 hover:text-nhs-black"
            >
              I understand, continue with submission
            </button>
          </div>
        </div>
      )}

      {submitted ? (
        <div className="p-8 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-nhs-urgency-routine mx-auto" />
          <h2 className="text-2xl font-bold text-nhs-black">
            Assessment Submitted
          </h2>
          <p className="text-sm text-nhs-grey-dark max-w-md mx-auto">
            Your report is queued for clinical review.
          </p>
          <button
            onClick={resetForm}
            className="mt-2 px-6 py-2.5 bg-nhs-blue text-nhs-white font-bold text-sm hover:bg-nhs-dark-blue"
          >
            Start New Assessment
          </button>
        </div>
      ) : (
        <div className="p-6 md:p-8">
          <div className="mb-6 bg-nhs-grey-light border border-nhs-grey-mid p-3 text-xs text-nhs-grey-dark">
            This tool prioritises cases; it does NOT diagnose. In emergencies,
            call <strong>999</strong>.
          </div>

          <div className="mb-6 pb-4 border-b border-nhs-grey-mid">
            <p className="text-xs font-bold uppercase tracking-wide text-nhs-grey-dark mb-2">
              Step {currentStep} of 3
            </p>
            <div className="w-full bg-nhs-grey-mid h-1.5">
              <div
                className="bg-nhs-blue h-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

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
                  Action required
                </span>
              </div>
              <p className="text-sm text-nhs-black">{error}</p>
            </div>
          )}

          {currentStep === 1 && (
            <fieldset className="space-y-6">
              <legend className="text-xl font-bold text-nhs-black mb-2">
                Patient details
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
                  Symptom duration
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

          {currentStep === 2 && (
            <fieldset className="space-y-6">
              <legend className="text-xl font-bold text-nhs-black mb-2">
                Describe symptoms
              </legend>
              <div>
                <label
                  htmlFor="symptoms"
                  className="block text-sm font-bold text-nhs-black mb-1"
                >
                  Primary complaint
                </label>
                <textarea
                  id="symptoms"
                  rows="6"
                  required
                  value={formData.symptoms}
                  onChange={(e) => updateField("symptoms", e.target.value)}
                  onBlur={evaluateEmergency}
                  placeholder="Describe main symptoms..."
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

          {currentStep === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-bold text-nhs-black">
                Review details
              </h2>
              <dl className="bg-nhs-grey-light border border-nhs-grey-mid divide-y divide-nhs-grey-mid">
                <div className="p-4">
                  <dt className="text-xs font-bold text-nhs-grey-dark uppercase">
                    Age
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
                    Symptoms
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
                  I acknowledge this is a triage prioritisation tool, not a
                  diagnosis.
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
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default SymptomWizard;
