import { useRef, useState } from "react";
import { getAITriageAssessment } from "../services/traigeService";
import { submitTriageToQueue } from "../services/triageQueueService";

export const useTriageSubmission = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const errorSummaryRef = useRef(null);

  const submitTriage = async ({ formData, consentGiven }) => {
    if (!consentGiven) {
      const message = "You must confirm you understand this before submitting.";

      setError(message);
      errorSummaryRef.current?.focus();

      return false;
    }

    setSubmitting(true);
    setError(null);

    try {
      const aiResult = await getAITriageAssessment(
        formData.symptoms,
        formData.ageCategory,
        formData.duration,
      );

      await submitTriageToQueue(formData, aiResult);

      setSubmitted(true);
      return true;
    } catch (err) {
      console.error("Submission Error:", err);

      setError(
        "Submission failed. Please check your connection and try again.",
      );

      errorSummaryRef.current?.focus();

      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const resetSubmission = () => {
    setSubmitted(false);
    setError(null);
  };

  return {
    submitting,
    submitted,
    error,
    errorSummaryRef,
    submitTriage,
    resetSubmission,
  };
};
