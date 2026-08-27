import React from "react";
import { ShieldAlert } from "lucide-react";

export const QueueHeader = ({
  emergencyPendingCount,
  pendingCount,
  showReviewed,
  onToggleReviewed,
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-nhs-grey-mid">
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-nhs-black">
        Live clinician triage queue
      </h1>
      <p className="text-sm text-nhs-grey-dark">
        Real-time patient symptom assessments
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      {emergencyPendingCount > 0 && (
        <span className="bg-nhs-emergency-red text-nhs-white font-bold px-3 py-1 text-xs flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          {emergencyPendingCount} emergency
        </span>
      )}

      <span className="bg-nhs-grey-light text-nhs-black font-bold px-3 py-1 text-xs flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-nhs-urgency-routine animate-pulse" />
        Live feed ({pendingCount} pending)
      </span>

      <button
        type="button"
        onClick={onToggleReviewed}
        className="px-3 py-1 border-2 border-nhs-grey-mid text-nhs-black text-xs font-bold hover:border-nhs-blue"
      >
        {showReviewed ? "Hide reviewed" : "Show reviewed"}
      </button>
    </div>
  </div>
);
