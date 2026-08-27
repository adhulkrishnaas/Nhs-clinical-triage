import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCaseReview } from "../hooks/useCaseReview";

const { mockDoc, mockUpdateDoc, mockAuth, mockDb } = vi.hoisted(() => ({
  mockDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockAuth: {
    currentUser: {
      email: "doctor@example.com",
    },
  },
  mockDb: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: mockDoc,
  updateDoc: mockUpdateDoc,
}));

vi.mock("../services/firebase", () => ({
  auth: mockAuth,
  db: mockDb,
}));

describe("useCaseReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth.currentUser = {
      email: "doctor@example.com",
    };

    mockDoc.mockReturnValue("mockCaseRef");
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it("starts with the correct initial state", () => {
    const { result } = renderHook(() => useCaseReview());

    expect(result.current.selectedCase).toBe(null);
    expect(result.current.clinicianNotes).toBe("");
    expect(result.current.submitting).toBe(false);
  });

  it("opens a case for review", () => {
    const { result } = renderHook(() => useCaseReview());

    const patientCase = {
      id: "case-123",
      patientName: "John Smith",
      clinicianNotes: "Previous notes",
    };

    act(() => {
      result.current.openReview(patientCase);
    });

    expect(result.current.selectedCase).toEqual(patientCase);
    expect(result.current.clinicianNotes).toBe("Previous notes");
  });

  it("uses empty notes when the case has no existing notes", () => {
    const { result } = renderHook(() => useCaseReview());

    const patientCase = {
      id: "case-123",
      patientName: "John Smith",
    };

    act(() => {
      result.current.openReview(patientCase);
    });

    expect(result.current.selectedCase).toEqual(patientCase);
    expect(result.current.clinicianNotes).toBe("");
  });

  it("updates clinician notes", () => {
    const { result } = renderHook(() => useCaseReview());

    act(() => {
      result.current.setClinicianNotes("Patient requires further assessment.");
    });

    expect(result.current.clinicianNotes).toBe(
      "Patient requires further assessment.",
    );
  });

  it("closes the review and resets the notes", () => {
    const { result } = renderHook(() => useCaseReview());

    act(() => {
      result.current.openReview({
        id: "case-123",
        clinicianNotes: "Existing notes",
      });
    });

    act(() => {
      result.current.closeReview();
    });

    expect(result.current.selectedCase).toBe(null);
    expect(result.current.clinicianNotes).toBe("");
  });

  it("returns false when saving without a selected case", async () => {
    const { result } = renderHook(() => useCaseReview());

    let saveResult;

    await act(async () => {
      saveResult = await result.current.saveReview("reviewed");
    });

    expect(saveResult).toBe(false);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
    expect(result.current.submitting).toBe(false);
  });

  it("saves the review to Firestore", async () => {
    const { result } = renderHook(() => useCaseReview());

    act(() => {
      result.current.openReview({
        id: "case-123",
      });

      result.current.setClinicianNotes("Patient reviewed. Follow-up required.");
    });

    let saveResult;

    await act(async () => {
      saveResult = await result.current.saveReview("reviewed");
    });

    expect(saveResult).toBe(true);

    expect(mockDoc).toHaveBeenCalledWith(mockDb, "triage_queue", "case-123");

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      "mockCaseRef",
      expect.objectContaining({
        status: "reviewed",
        clinicianNotes: "Patient reviewed. Follow-up required.",
        reviewedBy: "doctor@example.com",
      }),
    );
  });

  it("uses Clinician when there is no authenticated user", async () => {
    mockAuth.currentUser = null;

    const { result } = renderHook(() => useCaseReview());

    act(() => {
      result.current.openReview({
        id: "case-123",
      });
    });

    await act(async () => {
      await result.current.saveReview("reviewed");
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      "mockCaseRef",
      expect.objectContaining({
        reviewedBy: "Clinician",
      }),
    );
  });

  it("includes a reviewed timestamp when saving", async () => {
    const { result } = renderHook(() => useCaseReview());

    act(() => {
      result.current.openReview({
        id: "case-123",
      });
    });

    await act(async () => {
      await result.current.saveReview("reviewed");
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      "mockCaseRef",
      expect.objectContaining({
        reviewedAt: expect.any(String),
      }),
    );
  });

  it("closes the review after a successful save", async () => {
    const { result } = renderHook(() => useCaseReview());

    act(() => {
      result.current.openReview({
        id: "case-123",
        clinicianNotes: "Notes",
      });
    });

    await act(async () => {
      await result.current.saveReview("reviewed");
    });

    expect(result.current.selectedCase).toBe(null);
    expect(result.current.clinicianNotes).toBe("");
    expect(result.current.submitting).toBe(false);
  });

  it("returns false when Firestore update fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    mockUpdateDoc.mockRejectedValue(new Error("Firestore unavailable"));

    const { result } = renderHook(() => useCaseReview());

    act(() => {
      result.current.openReview({
        id: "case-123",
      });
    });

    let saveResult;

    await act(async () => {
      saveResult = await result.current.saveReview("reviewed");
    });

    expect(saveResult).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      "Failed to update case review status.",
    );
    expect(result.current.submitting).toBe(false);

    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
