import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  URGENCY_RANK,
  getBadgeLevel,
  useTriageQueue,
} from "../hooks/useTriageQueue";

const { mockOnSnapshot, mockCollection, mockOrderBy, mockQuery } = vi.hoisted(
  () => ({
    mockOnSnapshot: vi.fn(),
    mockCollection: vi.fn(),
    mockOrderBy: vi.fn(),
    mockQuery: vi.fn(),
  }),
);

vi.mock("firebase/firestore", () => ({
  collection: mockCollection,
  onSnapshot: mockOnSnapshot,
  orderBy: mockOrderBy,
  query: mockQuery,
}));

vi.mock("../services/firebase", () => ({
  db: {},
}));

describe("getBadgeLevel", () => {
  it("defines the correct urgency ranking", () => {
    expect(URGENCY_RANK).toEqual({
      EMERGENCY: 3,
      URGENT: 2,
      ROUTINE: 1,
      PENDING: 0,
    });
  });

  it("detects emergency urgency", () => {
    expect(getBadgeLevel("EMERGENCY")).toBe("EMERGENCY");
    expect(getBadgeLevel("emergency")).toBe("EMERGENCY");
    expect(getBadgeLevel("High priority emergency")).toBe("EMERGENCY");
  });

  it("detects urgent urgency", () => {
    expect(getBadgeLevel("URGENT")).toBe("URGENT");
    expect(getBadgeLevel("HIGH")).toBe("URGENT");
    expect(getBadgeLevel("High priority")).toBe("URGENT");
  });

  it("detects routine urgency", () => {
    expect(getBadgeLevel("ROUTINE")).toBe("ROUTINE");
    expect(getBadgeLevel("LOW")).toBe("ROUTINE");
    expect(getBadgeLevel("MEDIUM")).toBe("ROUTINE");
  });

  it("returns pending for unknown urgency", () => {
    expect(getBadgeLevel("something else")).toBe("PENDING");
    expect(getBadgeLevel("")).toBe("PENDING");
  });
});

describe("useTriageQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCollection.mockReturnValue("mockCollection");
    mockOrderBy.mockReturnValue("mockOrderBy");
    mockQuery.mockReturnValue("mockQuery");

    mockOnSnapshot.mockImplementation(() => vi.fn());
  });

  it("starts in a loading state", () => {
    const { result } = renderHook(() => useTriageQueue());

    expect(result.current.loading).toBe(true);
    expect(result.current.queue).toEqual([]);
    expect(result.current.pendingCount).toBe(0);
    expect(result.current.emergencyPendingCount).toBe(0);
  });

  it("subscribes to the triage queue", () => {
    renderHook(() => useTriageQueue());

    expect(mockCollection).toHaveBeenCalledWith({}, "triage_queue");

    expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");

    expect(mockQuery).toHaveBeenCalledWith("mockCollection", "mockOrderBy");

    expect(mockOnSnapshot).toHaveBeenCalled();
  });

  it("loads cases from Firestore", () => {
    let snapshotCallback;

    mockOnSnapshot.mockImplementation((query, onSuccess) => {
      snapshotCallback = onSuccess;
      return vi.fn();
    });

    const { result } = renderHook(() => useTriageQueue());

    const snapshot = {
      docs: [
        {
          id: "case-1",
          data: () => ({
            patientName: "John",
            urgency: "EMERGENCY",
            status: "pending",
            createdAt: "2026-08-27T10:00:00Z",
          }),
        },
      ],
    };

    act(() => {
      snapshotCallback(snapshot);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0]).toEqual({
      id: "case-1",
      patientName: "John",
      urgency: "EMERGENCY",
      status: "pending",
      createdAt: "2026-08-27T10:00:00Z",
    });
  });

  it("counts pending cases correctly", () => {
    let snapshotCallback;

    mockOnSnapshot.mockImplementation((query, onSuccess) => {
      snapshotCallback = onSuccess;
      return vi.fn();
    });

    const { result } = renderHook(() => useTriageQueue());

    act(() => {
      snapshotCallback({
        docs: [
          {
            id: "1",
            data: () => ({
              urgency: "EMERGENCY",
              status: "pending",
              createdAt: "2026-08-27T10:00:00Z",
            }),
          },
          {
            id: "2",
            data: () => ({
              urgency: "URGENT",
              status: "pending",
              createdAt: "2026-08-27T09:00:00Z",
            }),
          },
          {
            id: "3",
            data: () => ({
              urgency: "ROUTINE",
              status: "reviewed",
              createdAt: "2026-08-27T08:00:00Z",
            }),
          },
        ],
      });
    });

    expect(result.current.pendingCount).toBe(2);
    expect(result.current.emergencyPendingCount).toBe(1);
  });

  it("hides reviewed cases by default", () => {
    let snapshotCallback;

    mockOnSnapshot.mockImplementation((query, onSuccess) => {
      snapshotCallback = onSuccess;
      return vi.fn();
    });

    const { result } = renderHook(() => useTriageQueue());

    act(() => {
      snapshotCallback({
        docs: [
          {
            id: "pending",
            data: () => ({
              urgency: "URGENT",
              status: "pending",
              createdAt: "2026-08-27T10:00:00Z",
            }),
          },
          {
            id: "reviewed",
            data: () => ({
              urgency: "EMERGENCY",
              status: "reviewed",
              createdAt: "2026-08-27T09:00:00Z",
            }),
          },
        ],
      });
    });

    expect(result.current.sortedQueue).toHaveLength(1);
    expect(result.current.sortedQueue[0].id).toBe("pending");
  });

  it("shows reviewed cases when requested", () => {
    let snapshotCallback;

    mockOnSnapshot.mockImplementation((query, onSuccess) => {
      snapshotCallback = onSuccess;
      return vi.fn();
    });

    const { result } = renderHook(() => useTriageQueue(true));

    act(() => {
      snapshotCallback({
        docs: [
          {
            id: "pending",
            data: () => ({
              urgency: "URGENT",
              status: "pending",
              createdAt: "2026-08-27T10:00:00Z",
            }),
          },
          {
            id: "reviewed",
            data: () => ({
              urgency: "ROUTINE",
              status: "reviewed",
              createdAt: "2026-08-27T09:00:00Z",
            }),
          },
        ],
      });
    });

    expect(result.current.sortedQueue).toHaveLength(2);
  });

  it("sorts emergency cases before urgent and routine cases", () => {
    let snapshotCallback;

    mockOnSnapshot.mockImplementation((query, onSuccess) => {
      snapshotCallback = onSuccess;
      return vi.fn();
    });

    const { result } = renderHook(() => useTriageQueue());

    act(() => {
      snapshotCallback({
        docs: [
          {
            id: "routine",
            data: () => ({
              urgency: "ROUTINE",
              status: "pending",
              createdAt: "2026-08-27T08:00:00Z",
            }),
          },
          {
            id: "emergency",
            data: () => ({
              urgency: "EMERGENCY",
              status: "pending",
              createdAt: "2026-08-27T10:00:00Z",
            }),
          },
          {
            id: "urgent",
            data: () => ({
              urgency: "URGENT",
              status: "pending",
              createdAt: "2026-08-27T09:00:00Z",
            }),
          },
        ],
      });
    });

    expect(result.current.sortedQueue.map((item) => item.id)).toEqual([
      "emergency",
      "urgent",
      "routine",
    ]);
  });

  it("puts older cases first when urgency is the same", () => {
    let snapshotCallback;

    mockOnSnapshot.mockImplementation((query, onSuccess) => {
      snapshotCallback = onSuccess;
      return vi.fn();
    });

    const { result } = renderHook(() => useTriageQueue());

    act(() => {
      snapshotCallback({
        docs: [
          {
            id: "newer",
            data: () => ({
              urgency: "URGENT",
              status: "pending",
              createdAt: "2026-08-27T10:00:00Z",
            }),
          },
          {
            id: "older",
            data: () => ({
              urgency: "URGENT",
              status: "pending",
              createdAt: "2026-08-27T08:00:00Z",
            }),
          },
        ],
      });
    });

    expect(result.current.sortedQueue.map((item) => item.id)).toEqual([
      "older",
      "newer",
    ]);
  });

  it("sets loading to false when Firestore reports an error", () => {
    let errorCallback;

    mockOnSnapshot.mockImplementation((query, onSuccess, onError) => {
      errorCallback = onError;
      return vi.fn();
    });

    const { result } = renderHook(() => useTriageQueue());

    act(() => {
      errorCallback(new Error("Firestore unavailable"));
    });

    expect(result.current.loading).toBe(false);
  });

  it("unsubscribes from Firestore when the hook unmounts", () => {
    const unsubscribe = vi.fn();

    mockOnSnapshot.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useTriageQueue());

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
