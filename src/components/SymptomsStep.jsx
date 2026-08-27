import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const SymptomsStep = ({
  symptoms,
  updateField,
  onBack,
  onNext,
  onBlur,
}) => (
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
        value={symptoms}
        onChange={(e) => updateField("symptoms", e.target.value)}
        onBlur={onBlur}
        placeholder="Describe main symptoms..."
        className="w-full p-3 border-2 border-nhs-grey-dark text-sm"
      />
    </div>

    <div className="flex justify-between pt-2">
      <button
        type="button"
        onClick={onBack}
        className="px-5 py-2.5 border-2 border-nhs-black text-nhs-black font-bold flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!symptoms.trim()}
        className="px-6 py-2.5 bg-nhs-blue text-nhs-white font-bold flex items-center gap-2 hover:bg-nhs-dark-blue text-sm disabled:opacity-50"
      >
        <span>Continue</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </fieldset>
);
