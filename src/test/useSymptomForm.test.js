import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSymptomForm, INITIAL_FORM_DATA } from "../hooks/useSymptomForm";

describe("useSymptomForm", () => {
  it("starts with the correct default form values", () => {
    const { result } = renderHook(() => useSymptomForm());

    expect(result.current.formData).toEqual(INITIAL_FORM_DATA);
    expect(result.current.consentGiven).toBe(false);
  });

  it("updates a form field", () => {
    const { result } = renderHook(() => useSymptomForm());

    act(() => {
      result.current.updateField("symptoms", "I have had a cough for two days");
    });

    expect(result.current.formData.symptoms).toBe(
      "I have had a cough for two days",
    );
  });

  it("updates different fields independently", () => {
    const { result } = renderHook(() => useSymptomForm());

    act(() => {
      result.current.updateField("ageCategory", "Senior (65+)");
      result.current.updateField("duration", "1 to 3 days");
    });

    expect(result.current.formData.ageCategory).toBe("Senior (65+)");
    expect(result.current.formData.duration).toBe("1 to 3 days");
    expect(result.current.formData.symptoms).toBe("");
  });

  it("allows consent to be given", () => {
    const { result } = renderHook(() => useSymptomForm());

    act(() => {
      result.current.setConsentGiven(true);
    });

    expect(result.current.consentGiven).toBe(true);
  });

  it("resets the form to its initial state", () => {
    const { result } = renderHook(() => useSymptomForm());

    act(() => {
      result.current.updateField("symptoms", "I have chest pain");
      result.current.updateField("ageCategory", "Senior (65+)");
      result.current.setConsentGiven(true);
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual(INITIAL_FORM_DATA);
    expect(result.current.consentGiven).toBe(false);
  });
});
