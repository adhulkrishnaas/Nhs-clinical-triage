import { useState } from "react";

export const useWizardNavigation = (totalSteps = 3) => {
  const [currentStep, setCurrentStep] = useState(1);

  const goNext = () => {
    setCurrentStep((step) => Math.min(step + 1, totalSteps));
  };

  const goBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const resetWizard = () => {
    setCurrentStep(1);
  };

  return {
    currentStep,
    goNext,
    goBack,
    resetWizard,
  };
};
