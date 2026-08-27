import React from "react";
import { ShieldAlert } from "lucide-react";

export const QueueHeader = ({
  emergencyPendingCount,
  pendingCount,
  showReviewed,
  onToggleReviewed,
}) => (
  <div className="flex flex-col gap-4 pb-4 border-b border-nhs-grey-mid">
    {/* Header content */}
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-nhs-black">
        Live clinician triage queue
      </h1>

      <p className="text-sm text-nhs-grey-dark mt-1">
        Real-time patient symptom assessments
      </p>
    </div>

    {/* Queue controls */}
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-2">
        {emergencyPendingCount > 0 && (
          <span className="bg-nhs-emergency-red text-nhs-white font-bold px-3 py-2 text-xs flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>
              {emergencyPendingCount}{" "}
              {emergencyPendingCount === 1 ? "emergency" : "emergencies"}
            </span>
          </span>
        )}

        <span className="bg-nhs-grey-light text-nhs-black font-bold px-3 py-2 text-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-nhs-urgency-routine animate-pulse shrink-0" />
          <span>Live feed ({pendingCount} pending)</span>
        </span>
      </div>

      {/* Reviewed toggle */}
      <button
        type="button"
        onClick={onToggleReviewed}
        className="w-full sm:w-auto px-4 py-2.5 border-2 border-nhs-grey-mid text-nhs-black text-xs font-bold hover:border-nhs-blue hover:bg-nhs-grey-light transition-colors"
      >
        {showReviewed ? "Hide reviewed" : "Show reviewed"}
      </button>
    </div>
  </div>
);
