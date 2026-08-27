import React from "react";
import { ArrowRight } from "lucide-react";

export const PatientDetailsStep = ({ formData, updateField, onNext }) => (
  <fieldset className="space-y-6">
    <legend className="text-xl font-bold text-nhs-black mb-2">
      Patient details
    </legend>

    <div>
      <label
        htmlFor="ageCategory"
        className="block text-sm font-bold text-nhs-black mb-1"
      >
        Age bracket
      </label>

      <select
        id="ageCategory"
        value={formData.ageCategory}
        onChange={(e) => updateField("ageCategory", e.target.value)}
        className="w-full p-3 border-2 border-nhs-grey-dark text-sm"
      >
        <option>Child (0 to 17)</option>
        <option>Adult (18 to 64)</option>
        <option>Senior (65+)</option>
      </select>
    </div>

    <div>
      <label
        htmlFor="duration"
        className="block text-sm font-bold text-nhs-black mb-1"
      >
        Symptom duration
      </label>

      <select
        id="duration"
        value={formData.duration}
        onChange={(e) => updateField("duration", e.target.value)}
        className="w-full p-3 border-2 border-nhs-grey-dark text-sm"
      >
        <option>Less than 24 hours</option>
        <option>1 to 3 days</option>
        <option>More than 3 days</option>
      </select>
    </div>

    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={onNext}
        className="px-6 py-2.5 bg-nhs-blue text-nhs-white font-bold flex items-center gap-2 hover:bg-nhs-dark-blue text-sm"
      >
        <span>Continue</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </fieldset>
);
