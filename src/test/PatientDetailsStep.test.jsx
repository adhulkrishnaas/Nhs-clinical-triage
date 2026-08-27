import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PatientDetailsStep } from "../components/PatientDetailsStep";

const defaultFormData = {
  ageCategory: "Adult (18 to 64)",
  duration: "Less than 24 hours",
};

const renderComponent = (overrides = {}) => {
  const props = {
    formData: defaultFormData,
    updateField: vi.fn(),
    onNext: vi.fn(),
    ...overrides,
  };

  render(<PatientDetailsStep {...props} />);

  return props;
};

describe("PatientDetailsStep", () => {
  it("renders the patient details section", () => {
    renderComponent();

    expect(
      screen.getByRole("group", {
        name: "Patient details",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Age bracket")).toBeInTheDocument();

    expect(screen.getByText("Symptom duration")).toBeInTheDocument();
  });

  it("displays the current form values", () => {
    renderComponent();

    expect(
      screen.getByRole("combobox", {
        name: "Age bracket",
      }),
    ).toHaveValue("Adult (18 to 64)");

    expect(
      screen.getByRole("combobox", {
        name: "Symptom duration",
      }),
    ).toHaveValue("Less than 24 hours");
  });

  it("updates the age category when the user selects a different option", async () => {
    const user = userEvent.setup();
    const { updateField } = renderComponent();

    const ageSelect = screen.getByRole("combobox", {
      name: "Age bracket",
    });

    await user.selectOptions(ageSelect, "Child (0 to 17)");

    expect(updateField).toHaveBeenCalledWith("ageCategory", "Child (0 to 17)");
  });

  it("updates the symptom duration when the user selects a different option", async () => {
    const user = userEvent.setup();
    const { updateField } = renderComponent();

    const durationSelect = screen.getByRole("combobox", {
      name: "Symptom duration",
    });

    await user.selectOptions(durationSelect, "1 to 3 days");

    expect(updateField).toHaveBeenCalledWith("duration", "1 to 3 days");
  });

  it("supports all age bracket options", async () => {
    const user = userEvent.setup();
    const { updateField } = renderComponent();

    const ageSelect = screen.getByRole("combobox", {
      name: "Age bracket",
    });

    await user.selectOptions(ageSelect, "Senior (65+)");

    expect(updateField).toHaveBeenCalledWith("ageCategory", "Senior (65+)");
  });

  it("supports all symptom duration options", async () => {
    const user = userEvent.setup();
    const { updateField } = renderComponent();

    const durationSelect = screen.getByRole("combobox", {
      name: "Symptom duration",
    });

    await user.selectOptions(durationSelect, "More than 3 days");

    expect(updateField).toHaveBeenCalledWith("duration", "More than 3 days");
  });

  it("calls onNext when Continue is clicked", async () => {
    const user = userEvent.setup();
    const { onNext } = renderComponent();

    await user.click(
      screen.getByRole("button", {
        name: "Continue",
      }),
    );

    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
