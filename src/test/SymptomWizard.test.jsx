import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SymptomWizard } from "../components/SymptomWizard";

const {
  mockUseSymptomForm,
  mockUseWizardNavigation,
  mockUseEmergencyDetection,
  mockUseTriageSubmission,
} = vi.hoisted(() => ({
  mockUseSymptomForm: vi.fn(),
  mockUseWizardNavigation: vi.fn(),
  mockUseEmergencyDetection: vi.fn(),
  mockUseTriageSubmission: vi.fn(),
}));

vi.mock("../hooks/useSymptomForm", () => ({
  useSymptomForm: mockUseSymptomForm,
}));

vi.mock("../hooks/useWizardNavigation", () => ({
  useWizardNavigation: mockUseWizardNavigation,
}));

vi.mock("../hooks/useEmergencyDetection", () => ({
  useEmergencyDetection: mockUseEmergencyDetection,
}));

vi.mock("../hooks/useTriageSubmission", () => ({
  useTriageSubmission: mockUseTriageSubmission,
}));

vi.mock("../components/EmergencyOverlay", () => ({
  EmergencyOverlay: ({ show, onDismiss }) =>
    show ? (
      <div role="alertdialog">
        <h2>Medical Emergency Warning</h2>

        <button type="button" onClick={onDismiss}>
          Dismiss Emergency
        </button>
      </div>
    ) : null,
}));

vi.mock("../components/ErrorSummary", () => ({
  ErrorSummary: ({ error }) => (error ? <div role="alert">{error}</div> : null),
}));

vi.mock("../components/SubmissionSuccess", () => ({
  SubmissionSuccess: ({ onReset }) => (
    <div>
      <h2>Assessment Submitted</h2>

      <button type="button" onClick={onReset}>
        Start New Assessment
      </button>
    </div>
  ),
}));

vi.mock("../components/WizardProgress", () => ({
  WizardProgress: ({ currentStep, totalSteps = 3 }) => (
    <div>
      Step {currentStep} of {totalSteps}
    </div>
  ),
}));

vi.mock("../components/PatientDetailsStep", () => ({
  PatientDetailsStep: ({ onNext }) => (
    <div>
      <h2>Patient details</h2>

      <button type="button" onClick={onNext}>
        Continue
      </button>
    </div>
  ),
}));

vi.mock("../components/SymptomsStep", () => ({
  SymptomsStep: ({ onBack, onNext, onBlur }) => (
    <div>
      <h2>Describe symptoms</h2>

      <button type="button" onClick={onBack}>
        Back
      </button>

      <button type="button" onClick={onNext}>
        Continue
      </button>

      <button type="button" onClick={onBlur}>
        Evaluate symptoms
      </button>
    </div>
  ),
}));

vi.mock("../components/ReviewStep", () => ({
  ReviewStep: ({
    consentGiven,
    setConsentGiven,
    onBack,
    onSubmit,
    submitting,
  }) => (
    <form onSubmit={onSubmit}>
      <h2>Review details</h2>

      <input
        type="checkbox"
        checked={consentGiven}
        onChange={(event) => setConsentGiven(event.target.checked)}
        aria-label="Consent"
      />

      <button type="button" onClick={onBack}>
        Back
      </button>

      <button type="submit" disabled={submitting}>
        Submit Report
      </button>
    </form>
  ),
}));

const defaultFormData = {
  ageCategory: "Adult (18 to 64)",
  duration: "Less than 24 hours",
  symptoms: "",
};

const setupMocks = ({
  currentStep = 1,
  emergencyDetected = false,
  emergencyDismissed = false,
  submitted = false,
  submitting = false,
  error = null,
} = {}) => {
  const formActions = {
    formData: defaultFormData,
    consentGiven: false,
    setConsentGiven: vi.fn(),
    updateField: vi.fn(),
    resetForm: vi.fn(),
  };

  const navigationActions = {
    currentStep,
    goNext: vi.fn(),
    goBack: vi.fn(),
    resetWizard: vi.fn(),
  };

  const emergencyActions = {
    emergencyDetected,
    emergencyDismissed,
    evaluateEmergency: vi.fn(),
    dismissEmergency: vi.fn(),
    emergencyBannerRef: { current: null },
  };

  const submissionActions = {
    submitting,
    submitted,
    error,
    errorSummaryRef: { current: null },
    submitTriage: vi.fn().mockResolvedValue(undefined),
    resetSubmission: vi.fn(),
  };

  mockUseSymptomForm.mockReturnValue(formActions);
  mockUseWizardNavigation.mockReturnValue(navigationActions);
  mockUseEmergencyDetection.mockReturnValue(emergencyActions);
  mockUseTriageSubmission.mockReturnValue(submissionActions);

  return {
    formActions,
    navigationActions,
    emergencyActions,
    submissionActions,
  };
};

describe("SymptomWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it("starts on the patient details step", () => {
    render(<SymptomWizard />);

    expect(
      screen.getByRole("heading", {
        name: "Patient details",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("moves from patient details to the next step", async () => {
    const user = userEvent.setup();

    const { navigationActions } = setupMocks({
      currentStep: 1,
    });

    render(<SymptomWizard />);

    await user.click(
      screen.getByRole("button", {
        name: "Continue",
      }),
    );

    expect(navigationActions.goNext).toHaveBeenCalledTimes(1);
  });

  it("evaluates emergency symptoms before moving from step 2", async () => {
    const user = userEvent.setup();

    const { navigationActions, emergencyActions } = setupMocks({
      currentStep: 2,
    });

    render(<SymptomWizard />);

    await user.click(
      screen.getByRole("button", {
        name: "Continue",
      }),
    );

    expect(emergencyActions.evaluateEmergency).toHaveBeenCalledTimes(1);

    expect(navigationActions.goNext).toHaveBeenCalledTimes(1);
  });

  it("allows navigation back from the symptoms step", async () => {
    const user = userEvent.setup();

    const { navigationActions } = setupMocks({
      currentStep: 2,
    });

    render(<SymptomWizard />);

    await user.click(
      screen.getByRole("button", {
        name: "Back",
      }),
    );

    expect(navigationActions.goBack).toHaveBeenCalledTimes(1);
  });

  it("allows navigation back from the review step", async () => {
    const user = userEvent.setup();

    const { navigationActions } = setupMocks({
      currentStep: 3,
    });

    render(<SymptomWizard />);

    await user.click(
      screen.getByRole("button", {
        name: "Back",
      }),
    );

    expect(navigationActions.goBack).toHaveBeenCalledTimes(1);
  });

  it("submits the triage data from the review step", async () => {
    const user = userEvent.setup();

    const { submissionActions, formActions } = setupMocks({
      currentStep: 3,
    });

    render(<SymptomWizard />);

    await user.click(
      screen.getByRole("button", {
        name: "Submit Report",
      }),
    );

    expect(submissionActions.submitTriage).toHaveBeenCalledWith({
      formData: formActions.formData,
      consentGiven: formActions.consentGiven,
    });
  });

  it("shows the emergency overlay when an emergency is detected", () => {
    setupMocks({
      currentStep: 2,
      emergencyDetected: true,
      emergencyDismissed: false,
    });

    render(<SymptomWizard />);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Medical Emergency Warning",
      }),
    ).toBeInTheDocument();
  });

  it("does not show the emergency overlay after it has been dismissed", () => {
    setupMocks({
      currentStep: 2,
      emergencyDetected: true,
      emergencyDismissed: true,
    });

    render(<SymptomWizard />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("dismisses the emergency overlay", async () => {
    const user = userEvent.setup();

    const { emergencyActions } = setupMocks({
      currentStep: 2,
      emergencyDetected: true,
      emergencyDismissed: false,
    });

    render(<SymptomWizard />);

    await user.click(
      screen.getByRole("button", {
        name: "Dismiss Emergency",
      }),
    );

    expect(emergencyActions.dismissEmergency).toHaveBeenCalledTimes(1);
  });

  it("shows the error summary when submission fails", () => {
    setupMocks({
      currentStep: 3,
      error: "Unable to submit your assessment.",
    });

    render(<SymptomWizard />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to submit your assessment.",
    );
  });

  it("shows the submission success screen after submission", () => {
    setupMocks({
      submitted: true,
    });

    render(<SymptomWizard />);

    expect(
      screen.getByRole("heading", {
        name: "Assessment Submitted",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Start New Assessment",
      }),
    ).toBeInTheDocument();
  });

  it("resets the wizard when starting a new assessment", async () => {
    const user = userEvent.setup();

    const { formActions, navigationActions, submissionActions } = setupMocks({
      submitted: true,
    });

    render(<SymptomWizard />);

    await user.click(
      screen.getByRole("button", {
        name: "Start New Assessment",
      }),
    );

    expect(formActions.resetForm).toHaveBeenCalledTimes(1);

    expect(navigationActions.resetWizard).toHaveBeenCalledTimes(1);

    expect(submissionActions.resetSubmission).toHaveBeenCalledTimes(1);
  });

  it("passes the consent state to the review step", () => {
    setupMocks({
      currentStep: 3,
    });

    render(<SymptomWizard />);

    expect(
      screen.getByRole("checkbox", {
        name: "Consent",
      }),
    ).not.toBeChecked();
  });

  it("updates consent when the user checks the consent box", async () => {
    const user = userEvent.setup();

    const { formActions } = setupMocks({
      currentStep: 3,
    });

    render(<SymptomWizard />);

    await user.click(
      screen.getByRole("checkbox", {
        name: "Consent",
      }),
    );

    expect(formActions.setConsentGiven).toHaveBeenCalledWith(true);
  });

  it("passes the submitting state to the review step", () => {
    setupMocks({
      currentStep: 3,
      submitting: true,
    });

    render(<SymptomWizard />);

    expect(
      screen.getByRole("button", {
        name: "Submit Report",
      }),
    ).toBeDisabled();
  });
});
