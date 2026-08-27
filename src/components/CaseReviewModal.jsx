import React from "react";
import { CheckCircle, ShieldAlert, X } from "lucide-react";
import { UrgencyBadge } from "./UrgencyBadge";
import { getBadgeLevel } from "../hooks/useTriageQueue";

export const CaseReviewModal = ({
  selectedCase,
  clinicianNotes,
  submitting,
  onNotesChange,
  onClose,
  onSave,
}) => {
  if (!selectedCase) return null;

  return (
    <div className="fixed inset-0 bg-nhs-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-nhs-white w-full sm:max-w-xl p-4 sm:p-6 shadow-xl space-y-4 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-lg sm:rounded-none">
        <div className="flex items-center justify-between pb-3 border-b border-nhs-grey-mid">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-5 h-5 text-nhs-blue flex-shrink-0" />
            <h3 className="text-lg font-bold text-nhs-black truncate">
              Triage case details
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-nhs-grey-dark hover:text-nhs-black flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-nhs-grey-light p-3 text-xs space-y-1">
          <p className="break-words">
            <strong>Patient:</strong> {selectedCase.patientName} (
            {selectedCase.patientEmail})
          </p>

          <p>
            <strong>Age category:</strong> {selectedCase.ageCategory || "N/A"}
          </p>

          <p>
            <strong>Symptom duration:</strong> {selectedCase.duration || "N/A"}
          </p>

          <p>
            <strong>Submitted:</strong>{" "}
            {selectedCase.createdAt
              ? new Date(selectedCase.createdAt).toLocaleString()
              : "N/A"}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-nhs-black mb-1">
            Assessed urgency level
          </label>
          <UrgencyBadge level={getBadgeLevel(selectedCase.urgency)} />
        </div>

        {selectedCase.aiAssessment && (
          <div>
            <label className="block text-xs font-bold text-nhs-black mb-1">
              AI clinical reasoning
            </label>
            <p className="text-xs bg-nhs-blue/5 p-2.5 border border-nhs-blue/20 text-nhs-black font-medium break-words">
              {selectedCase.aiAssessment}
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-nhs-black mb-1">
            Reported symptoms
          </label>
          <p className="text-sm bg-nhs-grey-light p-3 border border-nhs-grey-mid text-nhs-grey-dark break-words">
            {selectedCase.symptomDetails ||
              selectedCase.primarySymptom ||
              "No detailed symptoms provided."}
          </p>
        </div>

        <div>
          <label
            htmlFor="clinicianNotes"
            className="block text-xs font-bold text-nhs-black mb-1"
          >
            Clinician notes & action plan
          </label>

          <textarea
            id="clinicianNotes"
            rows={3}
            value={clinicianNotes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Enter clinical review observations, prescriptions, or referral instructions..."
            className="w-full p-2.5 border-2 border-nhs-grey-mid text-xs focus:border-nhs-blue"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-nhs-grey-mid">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-nhs-grey-light hover:bg-nhs-grey-mid text-nhs-black text-xs font-bold"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => onSave("reviewed")}
            className="w-full sm:w-auto px-4 py-2 bg-nhs-urgency-routine hover:brightness-90 text-nhs-white text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{submitting ? "Saving..." : "Mark as reviewed"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
