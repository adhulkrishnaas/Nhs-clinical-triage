import React from "react";

import { EmergencyOverlay } from "./EmergencyOverlay";
import { ErrorSummary } from "./ErrorSummary";
import { SubmissionSuccess } from "./SubmissionSuccess";
import { WizardProgress } from "./WizardProgress";

import { PatientDetailsStep } from "./PatientDetailsStep";
import { SymptomsStep } from "./SymptomsStep";
import { ReviewStep } from "./ReviewStep";

import { useEmergencyDetection } from "../hooks/useEmergencyDetection";
import { useSymptomForm } from "../hooks/useSymptomForm";
import { useTriageSubmission } from "../hooks/useTriageSubmission";
import { useWizardNavigation } from "../hooks/useWizardNavigation";

export const SymptomWizard = () => {
  const { formData, consentGiven, setConsentGiven, updateField, resetForm } =
    useSymptomForm();

  const { currentStep, goNext, goBack, resetWizard } = useWizardNavigation(3);

  const {
    emergencyDetected,
    emergencyDismissed,
    evaluateEmergency,
    dismissEmergency,
    emergencyBannerRef,
  } = useEmergencyDetection(formData.symptoms);

  const {
    submitting,
    submitted,
    error,
    errorSummaryRef,
    submitTriage,
    resetSubmission,
  } = useTriageSubmission();

  const handleNext = (event) => {
    event?.preventDefault();

    if (currentStep === 2) {
      evaluateEmergency();
    }

    goNext();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await submitTriage({
      formData,
      consentGiven,
    });
  };

  const handleReset = () => {
    resetForm();
    resetWizard();
    resetSubmission();
  };

  const showEmergencyOverlay = emergencyDetected && !emergencyDismissed;

  return (
    <div className="bg-nhs-white border border-nhs-grey-mid max-w-2xl mx-auto my-8 border-t-[6px] border-t-nhs-blue">
      <EmergencyOverlay
        ref={emergencyBannerRef}
        show={showEmergencyOverlay}
        onDismiss={dismissEmergency}
      />

      {submitted ? (
        <SubmissionSuccess onReset={handleReset} />
      ) : (
        <div className="p-6 md:p-8">
          <div className="mb-6 bg-nhs-grey-light border border-nhs-grey-mid p-3 text-xs text-nhs-grey-dark">
            This tool prioritises cases; it does NOT diagnose. In emergencies,
            call <strong>999</strong>.
          </div>

          <WizardProgress currentStep={currentStep} />

          <ErrorSummary error={error} errorSummaryRef={errorSummaryRef} />

          {currentStep === 1 && (
            <PatientDetailsStep
              formData={formData}
              updateField={updateField}
              onNext={handleNext}
            />
          )}

          {currentStep === 2 && (
            <SymptomsStep
              symptoms={formData.symptoms}
              updateField={updateField}
              onBack={goBack}
              onNext={handleNext}
              onBlur={evaluateEmergency}
            />
          )}

          {currentStep === 3 && (
            <ReviewStep
              formData={formData}
              consentGiven={consentGiven}
              setConsentGiven={setConsentGiven}
              submitting={submitting}
              onBack={goBack}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SymptomWizard;
