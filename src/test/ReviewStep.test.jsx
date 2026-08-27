import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewStep } from "../components/ReviewStep";

const defaultFormData = {
  ageCategory: "Adult (18 to 64)",
  duration: "1 to 3 days",
  symptoms: "I have had a headache for two days.",
};

const renderComponent = (overrides = {}) => {
  const props = {
    formData: defaultFormData,
    consentGiven: false,
    setConsentGiven: vi.fn(),
    submitting: false,
    onBack: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    ...overrides,
  };

  render(<ReviewStep {...props} />);

  return props;
};

describe("ReviewStep", () => {
  it("renders the review details heading", () => {
    renderComponent();

    expect(
      screen.getByRole("heading", {
        name: "Review details",
      }),
    ).toBeInTheDocument();
  });

  it("displays the patient age", () => {
    renderComponent();

    expect(screen.getByText("Adult (18 to 64)")).toBeInTheDocument();
  });

  it("displays the symptom duration", () => {
    renderComponent();

    expect(screen.getByText("1 to 3 days")).toBeInTheDocument();
  });

  it("displays the symptoms", () => {
    renderComponent();

    expect(
      screen.getByText("I have had a headache for two days."),
    ).toBeInTheDocument();
  });

  it("reflects the current consent state", () => {
    renderComponent({
      consentGiven: true,
    });

    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).toBeChecked();
  });

  it("calls setConsentGiven when consent is changed", async () => {
    const user = userEvent.setup();
    const { setConsentGiven } = renderComponent();

    const checkbox = screen.getByRole("checkbox");

    await user.click(checkbox);

    expect(setConsentGiven).toHaveBeenCalledWith(true);
  });

  it("calls onBack when Back is clicked", async () => {
    const user = userEvent.setup();
    const { onBack } = renderComponent();

    await user.click(
      screen.getByRole("button", {
        name: "Back",
      }),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit when the form is submitted", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderComponent();

    await user.click(
      screen.getByRole("button", {
        name: "Submit Report",
      }),
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables Back while submitting", () => {
    renderComponent({
      submitting: true,
    });

    expect(
      screen.getByRole("button", {
        name: "Back",
      }),
    ).toBeDisabled();
  });

  it("disables Submit Report while submitting", () => {
    renderComponent({
      submitting: true,
    });

    expect(
      screen.getByRole("button", {
        name: /Submitting/i,
      }),
    ).toBeDisabled();
  });

  it("shows the submitting state while submitting", () => {
    renderComponent({
      submitting: true,
    });

    expect(screen.getByText("Submitting...")).toBeInTheDocument();

    expect(screen.queryByText("Submit Report")).not.toBeInTheDocument();
  });

  it("shows Submit Report when not submitting", () => {
    renderComponent({
      submitting: false,
    });

    expect(
      screen.getByRole("button", {
        name: "Submit Report",
      }),
    ).toBeInTheDocument();

    expect(screen.queryByText("Submitting...")).not.toBeInTheDocument();
  });
});
