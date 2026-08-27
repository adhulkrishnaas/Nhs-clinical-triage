import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WizardProgress } from "../components/WizardProgress";

describe("WizardProgress", () => {
  it("displays the current step and total steps", () => {
    render(<WizardProgress currentStep={1} totalSteps={3} />);

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("displays different step values correctly", () => {
    render(<WizardProgress currentStep={2} totalSteps={5} />);

    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
  });

  it("uses 3 steps by default", () => {
    render(<WizardProgress currentStep={2} />);

    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
  });

  it("sets the progress width based on the current step", () => {
    const { container } = render(
      <WizardProgress currentStep={2} totalSteps={4} />,
    );

    const progressBar = container.querySelector(".transition-all");

    expect(progressBar).toHaveStyle({
      width: "50%",
    });
  });

  it("shows 100% progress on the final step", () => {
    const { container } = render(
      <WizardProgress currentStep={3} totalSteps={3} />,
    );

    const progressBar = container.querySelector(".transition-all");

    expect(progressBar).toHaveStyle({
      width: "100%",
    });
  });

  it("shows approximately 33.33% progress on the first of three steps", () => {
    const { container } = render(
      <WizardProgress currentStep={1} totalSteps={3} />,
    );

    const progressBar = container.querySelector(".transition-all");

    expect(progressBar).toHaveStyle({
      width: "33.33333333333333%",
    });
  });
});
