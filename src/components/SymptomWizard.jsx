import React, { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../services/firebase";

// Helper function to handle OpenAI Triage Evaluation
const getAITriageAssessment = async (symptoms, ageCategory, duration) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("OpenAI API key missing. Defaulting to ROUTINE triage.");
    return {
      urgency: "ROUTINE",
      aiAssessment: "API key missing. Defaulting to routine manual review.",
    };
  }

  const systemPrompt = `
You are an expert NHS clinical triage AI. Evaluate the following patient symptom report.
Respond ONLY with a valid JSON object matching this exact schema:
{
  "urgency": "EMERGENCY" | "URGENT" | "ROUTINE",
  "aiAssessment": "A concise 1-2 sentence clinical summary explaining the evaluation."
}

Urgency Rules:
- "EMERGENCY": Severe/life-threatening symptoms like chest pain, severe breathing difficulty, stroke signs, or sudden loss of consciousness.
- "URGENT": Acute conditions requiring rapid attention like high persistent fever, severe pain, active bleeding, or suspected fracture.
- "ROUTINE": Mild cold/flu symptoms, minor rashes, localized low-grade pain, or non-urgent general queries.
  `;

  const userPrompt = `
Patient Age Bracket: ${ageCategory}
Symptom Duration: ${duration}
Reported Symptoms: "${symptoms}"
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

    if (!response.ok) {
      throw new Error(`OpenAI HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      urgency: result.urgency || "ROUTINE",
      aiAssessment: result.aiAssessment || "AI triage processed successfully.",
    };
  } catch (err) {
    console.error("AI Triage Error:", err);
    // Fail-safe: Default to URGENT if API call fails so clinicians inspect immediately
    return {
      urgency: "URGENT",
      aiAssessment:
        "AI evaluation unavailable. Priority elevated to URGENT for manual review.",
    };
  }
};

export const SymptomWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    ageCategory: "Adult (18-64)",
    duration: "Less than 24 hours",
    symptoms: "",
  });

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
    setSubmitting(true);
    setError(null);

    try {
      // 1. Run OpenAI dynamic triage assessment
      const aiResult = await getAITriageAssessment(
        formData.symptoms,
        formData.ageCategory,
        formData.duration,
      );

      // 2. Save assessment + AI results directly to Firestore
      await addDoc(collection(db, "triage_queue"), {
        patientUid: auth.currentUser?.uid || "anonymous",
        patientName:
          auth.currentUser?.displayName ||
          auth.currentUser?.email ||
          "Anonymous Patient",
        patientEmail: auth.currentUser?.email || "patient@example.com",
        primarySymptom:
          formData.symptoms.slice(0, 80) +
          (formData.symptoms.length > 80 ? "..." : ""),
        symptomDetails: formData.symptoms,
        ageCategory: formData.ageCategory,
        duration: formData.duration,

        // AI Dynamic Values
        urgency: aiResult.urgency,
        aiAssessment: aiResult.aiAssessment,

        status: "pending",
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting triage assessment:", err);
      setError(
        "Failed to submit assessment. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md border-t-4 border-green-600 max-w-2xl mx-auto my-8 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
        <h2 className="text-2xl font-bold text-nhs-black">
          Assessment Submitted
        </h2>
        <p className="text-sm text-nhs-grey-dark">
          Your symptom report has been logged into the live clinician triage
          queue. A member of the clinical team will review your case shortly.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setCurrentStep(1);
            setFormData({
              ageCategory: "Adult (18-64)",
              duration: "Less than 24 hours",
              symptoms: "",
            });
          }}
          className="mt-4 px-6 py-2 bg-nhs-blue text-white font-bold rounded text-sm hover:bg-nhs-dark-blue transition"
        >
          Submit Another Assessment
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md border-t-4 border-nhs-blue max-w-2xl mx-auto my-8">
      {/* Step Indicator Header */}
      <div className="mb-6 border-b border-nhs-grey-mid pb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-nhs-grey-dark">
            Step {currentStep} of 3
          </span>
          <span className="text-xs font-bold text-nhs-blue">
            {currentStep === 1 && "Patient Details"}
            {currentStep === 2 && "Symptom Details"}
            {currentStep === 3 && "Review & Submit"}
          </span>
        </div>
        <div className="w-full bg-nhs-grey-mid h-2 rounded-full overflow-hidden">
          <div
            className="bg-nhs-blue h-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded mb-4 flex items-center gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Age Category & Duration */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-nhs-black">
            1. Patient Information
          </h2>
          <div>
            <label className="block text-sm font-bold text-nhs-black mb-2">
              Age Bracket
            </label>
            <select
              value={formData.ageCategory}
              onChange={(e) => updateField("ageCategory", e.target.value)}
              className="w-full p-3 border border-nhs-grey-mid rounded focus:border-nhs-blue text-sm"
            >
              <option>Child (0-17)</option>
              <option>Adult (18-64)</option>
              <option>Senior (65+)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-nhs-black mb-2">
              Symptom Duration
            </label>
            <select
              value={formData.duration}
              onChange={(e) => updateField("duration", e.target.value)}
              className="w-full p-3 border border-nhs-grey-mid rounded focus:border-nhs-blue text-sm"
            >
              <option>Less than 24 hours</option>
              <option>1 to 3 days</option>
              <option>More than 3 days</option>
            </select>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-nhs-blue text-white font-bold rounded flex items-center gap-2 hover:bg-nhs-dark-blue text-sm"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Symptom Description */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-nhs-black">
            2. Describe Your Symptoms
          </h2>
          <div>
            <label className="block text-sm font-bold text-nhs-black mb-2">
              Primary Medical Concern
            </label>
            <textarea
              rows="5"
              required
              value={formData.symptoms}
              onChange={(e) => updateField("symptoms", e.target.value)}
              placeholder="Describe what you are feeling, where the discomfort is, and any other relevant symptoms..."
              className="w-full p-3 border border-nhs-grey-mid rounded text-sm focus:border-nhs-blue"
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-2.5 border border-nhs-grey-dark text-nhs-black font-bold rounded flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!formData.symptoms.trim()}
              className="px-6 py-2.5 bg-nhs-blue text-white font-bold rounded flex items-center gap-2 hover:bg-nhs-dark-blue text-sm disabled:opacity-50"
            >
              <span>Review Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Final Submission */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-bold text-nhs-black">
            3. Review Submission
          </h2>
          <div className="bg-nhs-grey-light p-4 rounded border border-nhs-grey-mid space-y-3">
            <div>
              <span className="text-xs font-bold text-nhs-grey-dark block">
                Age Group
              </span>
              <p className="text-sm font-semibold text-nhs-black">
                {formData.ageCategory}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-nhs-grey-dark block">
                Duration
              </span>
              <p className="text-sm font-semibold text-nhs-black">
                {formData.duration}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-nhs-grey-dark block">
                Reported Symptoms
              </span>
              <p className="text-sm text-nhs-black">{formData.symptoms}</p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="px-5 py-2.5 border border-nhs-grey-dark text-nhs-black font-bold rounded flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-green-700 text-white font-bold rounded flex items-center gap-2 hover:bg-green-800 text-sm transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <Sparkles className="w-4 h-4 animate-pulse text-yellow-300" />
                  <span>AI Triaging & Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Triage Assessment</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SymptomWizard;
