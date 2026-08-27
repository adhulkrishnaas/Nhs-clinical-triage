import { describe, expect, it } from "vitest";
import { checkRedFlags } from "../hooks/useEmergencyDetection";

describe("checkRedFlags", () => {
  it("detects chest pain as an emergency", () => {
    expect(checkRedFlags("I have severe chest pain")).toBe(true);
  });

  it("detects difficulty breathing as an emergency", () => {
    expect(checkRedFlags("I am having difficulty breathing")).toBe(true);
  });

  it("detects slurred speech as an emergency", () => {
    expect(checkRedFlags("My speech is slurred")).toBe(true);
  });

  it("does not flag ordinary symptoms", () => {
    expect(checkRedFlags("I have had a mild cough for two days")).toBe(false);
  });

  it("returns false for empty symptoms", () => {
    expect(checkRedFlags("")).toBe(false);
  });
});
