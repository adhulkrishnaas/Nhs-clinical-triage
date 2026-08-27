import React from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export const ReviewStep = ({
  formData,
  consentGiven,
  setConsentGiven,
  submitting,
  onBack,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <h2 className="text-xl font-bold text-nhs-black">Review details</h2>

    <dl className="bg-nhs-grey-light border border-nhs-grey-mid divide-y divide-nhs-grey-mid">
      <div className="p-4">
        <dt className="text-xs font-bold text-nhs-grey-dark uppercase">Age</dt>
        <dd className="text-sm text-nhs-black mt-1">{formData.ageCategory}</dd>
      </div>

      <div className="p-4">
        <dt className="text-xs font-bold text-nhs-grey-dark uppercase">
          Duration
        </dt>
        <dd className="text-sm text-nhs-black mt-1">{formData.duration}</dd>
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
        I acknowledge this is a triage prioritisation tool, not a diagnosis.
      </span>
    </label>

    <div className="flex justify-between pt-2">
      <button
        type="button"
        onClick={onBack}
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
);
