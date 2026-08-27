import React from "react";

export const WizardProgress = ({ currentStep, totalSteps = 3 }) => (
  <div className="mb-6 pb-4 border-b border-nhs-grey-mid">
    <p className="text-xs font-bold uppercase tracking-wide text-nhs-grey-dark mb-2">
      Step {currentStep} of {totalSteps}
    </p>

    <div className="w-full bg-nhs-grey-mid h-1.5">
      <div
        className="bg-nhs-blue h-full transition-all duration-300"
        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
      />
    </div>
  </div>
);
