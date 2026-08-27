import React from "react";
import { Clock, FileText } from "lucide-react";
import { UrgencyBadge } from "./UrgencyBadge";
import { getBadgeLevel } from "../hooks/useTriageQueue";

export const QueueList = ({ loading, sortedQueue, onOpenReview }) => {
  if (loading) {
    return (
      <div className="p-6 sm:p-8 text-center text-nhs-grey-dark text-sm flex flex-col sm:flex-row items-center justify-center gap-2">
        <Clock className="w-4 h-4 animate-spin text-nhs-blue shrink-0" />
        <span>Connecting to live Firestore stream...</span>
      </div>
    );
  }

  if (sortedQueue.length === 0) {
    return (
      <div className="p-6 sm:p-8 text-center text-nhs-grey-dark bg-nhs-white border border-nhs-grey-mid text-sm">
        No triage cases currently in queue.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      {sortedQueue.map((item) => {
        const badgeLevel = getBadgeLevel(item.urgency);

        const isEmergency =
          badgeLevel === "EMERGENCY" && item.status !== "reviewed";

        return (
          <div
            key={item.id}
            className={`p-4 sm:p-5 bg-nhs-white border flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between transition hover:shadow-md ${
              isEmergency
                ? "border-nhs-emergency-red border-l-4"
                : "border-nhs-grey-mid"
            }`}
          >
            {/* Case information */}
            <div className="space-y-2 min-w-0 sm:max-w-xl">
              {/* Patient + urgency + status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-nhs-black break-words">
                  {item.patientName || "Anonymous Patient"}
                </span>

                <UrgencyBadge level={badgeLevel} />

                <span
                  className={`text-[11px] sm:text-xs px-2 py-1 font-semibold ${
                    item.status === "reviewed"
                      ? "bg-nhs-grey-mid text-nhs-grey-dark"
                      : "bg-nhs-blue/10 text-nhs-blue"
                  }`}
                >
                  {item.status ? item.status.toUpperCase() : "PENDING"}
                </span>
              </div>

              {/* Symptom */}
              <p className="text-xs sm:text-sm text-nhs-grey-dark font-medium line-clamp-2">
                <strong>Symptom:</strong>{" "}
                {item.primarySymptom || item.symptomDetails || "Not provided"}
              </p>

              {/* Patient metadata */}
              {item.ageCategory && (
                <span className="inline-block text-[11px] sm:text-xs text-nhs-grey-dark bg-nhs-grey-light px-2 py-1">
                  {item.ageCategory} • {item.duration}
                </span>
              )}
            </div>

            {/* Review action */}
            <button
              type="button"
              onClick={() => onOpenReview(item)}
              className="w-full sm:w-auto min-h-11 sm:min-h-0 px-4 py-2.5 sm:py-2 bg-nhs-blue hover:bg-nhs-dark-blue text-nhs-white font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />

              <span>
                {item.status === "reviewed" ? "View review" : "Review case"}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
