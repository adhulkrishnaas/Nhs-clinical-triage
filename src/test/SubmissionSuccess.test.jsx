import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubmissionSuccess } from "../components/SubmissionSuccess";

describe("SubmissionSuccess", () => {
  it("renders the submission success message", () => {
    render(<SubmissionSuccess onReset={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        name: "Assessment Submitted",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Your report is queued for clinical review."),
    ).toBeInTheDocument();
  });

  it("renders the Start New Assessment button", () => {
    render(<SubmissionSuccess onReset={vi.fn()} />);

    expect(
      screen.getByRole("button", {
        name: "Start New Assessment",
      }),
    ).toBeInTheDocument();
  });

  it("calls onReset when Start New Assessment is clicked", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(<SubmissionSuccess onReset={onReset} />);

    await user.click(
      screen.getByRole("button", {
        name: "Start New Assessment",
      }),
    );

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("does not call onReset when the component is rendered", () => {
    const onReset = vi.fn();

    render(<SubmissionSuccess onReset={onReset} />);

    expect(onReset).not.toHaveBeenCalled();
  });
});
