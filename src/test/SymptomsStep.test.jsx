import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SymptomsStep } from "../components/SymptomsStep";

const renderComponent = (overrides = {}) => {
  const props = {
    symptoms: "",
    updateField: vi.fn(),
    onBack: vi.fn(),
    onNext: vi.fn(),
    onBlur: vi.fn(),
    ...overrides,
  };

  render(<SymptomsStep {...props} />);

  return props;
};

describe("SymptomsStep", () => {
  it("renders the symptoms section", () => {
    renderComponent();

    expect(
      screen.getByRole("group", {
        name: "Describe symptoms",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Primary complaint")).toBeInTheDocument();
  });

  it("displays the existing symptoms", () => {
    renderComponent({
      symptoms: "I have had a severe headache for two days",
    });

    expect(screen.getByLabelText("Primary complaint")).toHaveValue(
      "I have had a severe headache for two days",
    );
  });

  it("updates symptoms when the textarea changes", () => {
    const { updateField } = renderComponent();

    const textarea = screen.getByLabelText("Primary complaint");

    fireEvent.change(textarea, {
      target: {
        value: "I have a cough",
      },
    });

    expect(updateField).toHaveBeenCalledWith("symptoms", "I have a cough");
  });

  it("calls onBlur when the symptoms field loses focus", async () => {
    const user = userEvent.setup();
    const { onBlur } = renderComponent({
      symptoms: "I have a headache",
    });

    const textarea = screen.getByLabelText("Primary complaint");

    await user.click(textarea);
    await user.tab();

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("disables Continue when symptoms are empty", () => {
    renderComponent({
      symptoms: "",
    });

    expect(
      screen.getByRole("button", {
        name: "Continue",
      }),
    ).toBeDisabled();
  });

  it("disables Continue when symptoms contain only whitespace", () => {
    renderComponent({
      symptoms: "   ",
    });

    expect(
      screen.getByRole("button", {
        name: "Continue",
      }),
    ).toBeDisabled();
  });

  it("enables Continue when symptoms contain text", () => {
    renderComponent({
      symptoms: "I have a headache",
    });

    expect(
      screen.getByRole("button", {
        name: "Continue",
      }),
    ).toBeEnabled();
  });

  it("calls onNext when Continue is clicked", async () => {
    const user = userEvent.setup();
    const { onNext } = renderComponent({
      symptoms: "I have a headache",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Continue",
      }),
    );

    expect(onNext).toHaveBeenCalledTimes(1);
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
});
