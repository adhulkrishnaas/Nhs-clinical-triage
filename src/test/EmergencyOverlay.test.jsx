import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmergencyOverlay } from "../components/EmergencyOverlay";

describe("EmergencyOverlay", () => {
  it("does not render when show is false", () => {
    render(<EmergencyOverlay show={false} onDismiss={vi.fn()} />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("renders the emergency warning when show is true", () => {
    render(<EmergencyOverlay show={true} onDismiss={vi.fn()} />);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Medical Emergency Warning",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Your symptoms suggest you may require immediate emergency care/i,
      ),
    ).toBeInTheDocument();
  });

  it("provides a link to call 999", () => {
    render(<EmergencyOverlay show={true} onDismiss={vi.fn()} />);

    const emergencyLink = screen.getByRole("link", {
      name: "Call 999 Immediately",
    });

    expect(emergencyLink).toHaveAttribute("href", "tel:999");
  });

  it("provides a link to call NHS 111", () => {
    render(<EmergencyOverlay show={true} onDismiss={vi.fn()} />);

    const nhs111Link = screen.getByRole("link", {
      name: "Call NHS 111",
    });

    expect(nhs111Link).toHaveAttribute("href", "tel:111");
  });

  it("calls onDismiss when the continue button is clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(<EmergencyOverlay show={true} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole("button", {
      name: "I understand, continue with submission",
    });

    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not call onDismiss when the overlay is rendered", () => {
    const onDismiss = vi.fn();

    render(<EmergencyOverlay show={true} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
