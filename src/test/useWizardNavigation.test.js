import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWizardNavigation } from "../hooks/useWizardNavigation";

describe("useWizardNavigation", () => {
  it("starts at step 1", () => {
    const { result } = renderHook(() => useWizardNavigation());

    expect(result.current.currentStep).toBe(1);
  });

  it("moves to the next step", () => {
    const { result } = renderHook(() => useWizardNavigation());

    act(() => {
      result.current.goNext();
    });

    expect(result.current.currentStep).toBe(2);
  });

  it("moves back to the previous step", () => {
    const { result } = renderHook(() => useWizardNavigation());

    act(() => {
      result.current.goNext();
      result.current.goBack();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it("does not go beyond the final step", () => {
    const { result } = renderHook(() => useWizardNavigation(3));

    act(() => {
      result.current.goNext();
      result.current.goNext();
      result.current.goNext();
      result.current.goNext();
    });

    expect(result.current.currentStep).toBe(3);
  });

  it("does not go below step 1", () => {
    const { result } = renderHook(() => useWizardNavigation());

    act(() => {
      result.current.goBack();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it("resets the wizard to step 1", () => {
    const { result } = renderHook(() => useWizardNavigation(5));

    act(() => {
      result.current.goNext();
      result.current.goNext();
    });

    expect(result.current.currentStep).toBe(3);

    act(() => {
      result.current.resetWizard();
    });

    expect(result.current.currentStep).toBe(1);
  });
});
