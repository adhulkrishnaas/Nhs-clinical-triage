import React from "react";
import { CheckCircle2 } from "lucide-react";

export const SubmissionSuccess = ({ onReset }) => (
  <div className="p-8 text-center space-y-4">
    <CheckCircle2 className="w-14 h-14 text-nhs-urgency-routine mx-auto" />

    <h2 className="text-2xl font-bold text-nhs-black">Assessment Submitted</h2>

    <p className="text-sm text-nhs-grey-dark max-w-md mx-auto">
      Your report is queued for clinical review.
    </p>

    <button
      type="button"
      onClick={onReset}
      className="mt-2 px-6 py-2.5 bg-nhs-blue text-nhs-white font-bold text-sm hover:bg-nhs-dark-blue"
    >
      Start New Assessment
    </button>
  </div>
);
