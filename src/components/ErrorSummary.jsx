import React from "react";
import { AlertTriangle } from "lucide-react";

export const ErrorSummary = ({ error, errorSummaryRef }) => {
  if (!error) return null;

  return (
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
  );
};
