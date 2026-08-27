import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";

export const URGENCY_RANK = {
  EMERGENCY: 3,
  URGENT: 2,
  ROUTINE: 1,
  PENDING: 0,
};

export const getBadgeLevel = (urgency = "") => {
  const normalized = urgency.toUpperCase();

  if (normalized.includes("EMERGENCY")) return "EMERGENCY";
  if (normalized.includes("HIGH") || normalized.includes("URGENT")) {
    return "URGENT";
  }

  if (
    normalized.includes("LOW") ||
    normalized.includes("MEDIUM") ||
    normalized.includes("ROUTINE")
  ) {
    return "ROUTINE";
  }

  return "PENDING";
};

export const useTriageQueue = (showReviewed = false) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const queueQuery = query(
      collection(db, "triage_queue"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      queueQuery,
      (snapshot) => {
        const cases = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setQueue(cases);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to real-time triage queue:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const visibleQueue = showReviewed
    ? queue
    : queue.filter((item) => item.status !== "reviewed");

  const sortedQueue = [...visibleQueue].sort((a, b) => {
    const aReviewed = a.status === "reviewed";
    const bReviewed = b.status === "reviewed";

    if (aReviewed !== bReviewed) {
      return aReviewed ? 1 : -1;
    }

    const rankDiff =
      URGENCY_RANK[getBadgeLevel(a.urgency)] -
      URGENCY_RANK[getBadgeLevel(b.urgency)];

    if (rankDiff !== 0) {
      return -rankDiff;
    }

    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const pendingCount = queue.filter(
    (item) => item.status !== "reviewed",
  ).length;

  const emergencyPendingCount = queue.filter(
    (item) =>
      item.status !== "reviewed" && getBadgeLevel(item.urgency) === "EMERGENCY",
  ).length;

  return {
    queue,
    sortedQueue,
    loading,
    pendingCount,
    emergencyPendingCount,
  };
};
