import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { UrgencyBadge } from "./UrgencyBadge";
import { FileText, X, ShieldAlert, CheckCircle, Clock } from "lucide-react";

// Higher number = higher priority = sorts first
const URGENCY_RANK = { EMERGENCY: 3, URGENT: 2, ROUTINE: 1, PENDING: 0 };

const StaffDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [clinicianNotes, setClinicianNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Reviewed cases are never deleted (audit trail / clinical safety record),
  // just hidden from the active queue view by default.
  const [showReviewed, setShowReviewed] = useState(false);

  // 1. Listen for real-time updates from the triage_queue collection
  useEffect(() => {
    const q = query(
      collection(db, "triage_queue"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cases = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setQueue(cases);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to real-time triage queue:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // 2. Map database urgency strings to UrgencyBadge levels.
  // This reflects the CLINICAL urgency only — review status is shown
  // separately (see the status pill below) and must never override it.
  // A reviewed emergency case is still an emergency case.
  const getBadgeLevel = (urgency = "") => {
    const normalized = urgency.toUpperCase();
    if (normalized.includes("EMERGENCY")) return "EMERGENCY";
    if (normalized.includes("HIGH") || normalized.includes("URGENT"))
      return "URGENT";
    if (
      normalized.includes("LOW") ||
      normalized.includes("MEDIUM") ||
      normalized.includes("ROUTINE")
    )
      return "ROUTINE";
    return "PENDING";
  };

  // 3. Sort so the most urgent, still-pending cases always float to the top.
  // Within the same urgency tier, oldest submission first (FIFO) so a case
  // doesn't wait indefinitely just because newer same-tier cases keep arriving.
  // Reviewed cases always sort to the bottom, regardless of urgency.
  const visibleQueue = showReviewed
    ? queue
    : queue.filter((q) => q.status !== "reviewed");

  const sortedQueue = [...visibleQueue].sort((a, b) => {
    const aReviewed = a.status === "reviewed";
    const bReviewed = b.status === "reviewed";
    if (aReviewed !== bReviewed) return aReviewed ? 1 : -1;

    const rankDiff =
      URGENCY_RANK[getBadgeLevel(a.urgency)] -
      URGENCY_RANK[getBadgeLevel(b.urgency)];
    if (rankDiff !== 0) return -rankDiff; // higher rank first

    return new Date(a.createdAt) - new Date(b.createdAt); // oldest first within tier
  });

  const handleOpenReview = (item) => {
    setSelectedCase(item);
    setClinicianNotes(item.clinicianNotes || "");
  };

  const handleSaveReview = async (newStatus) => {
    if (!selectedCase) return;
    setSubmitting(true);

    try {
      const caseRef = doc(db, "triage_queue", selectedCase.id);
      await updateDoc(caseRef, {
        status: newStatus,
        clinicianNotes: clinicianNotes,
        reviewedBy: auth.currentUser?.email || "Clinician",
        reviewedAt: new Date().toISOString(),
      });

      setSelectedCase(null);
      setClinicianNotes("");
    } catch (err) {
      console.error("Error saving review to Firestore:", err);
      alert("Failed to update case review status.");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = queue.filter((q) => q.status !== "reviewed").length;
  const emergencyPendingCount = queue.filter(
    (q) => q.status !== "reviewed" && getBadgeLevel(q.urgency) === "EMERGENCY",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-nhs-grey-mid">
        <div>
          <h1 className="text-2xl font-bold text-nhs-black">
            Live clinician triage queue
          </h1>
          <p className="text-sm text-nhs-grey-dark">
            Real-time patient symptom assessments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {emergencyPendingCount > 0 && (
            <span className="bg-nhs-emergency-red text-nhs-white font-bold px-3 py-1 text-xs flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              {emergencyPendingCount} emergency
            </span>
          )}
          <span className="bg-nhs-grey-light text-nhs-black font-bold px-3 py-1 text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-nhs-urgency-routine animate-pulse" />
            Live feed ({pendingCount} pending)
          </span>
          <button
            onClick={() => setShowReviewed((prev) => !prev)}
            className="px-3 py-1 border-2 border-nhs-grey-mid text-nhs-black text-xs font-bold hover:border-nhs-blue"
          >
            {showReviewed ? "Hide reviewed" : "Show reviewed"}
          </button>
        </div>
      </div>

      {/* Main Queue List — sorted by urgency, not just recency */}
      {loading ? (
        <div className="p-8 text-center text-nhs-grey-dark text-sm flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 animate-spin text-nhs-blue" />
          <span>Connecting to live Firestore stream...</span>
        </div>
      ) : sortedQueue.length === 0 ? (
        <div className="p-8 text-center text-nhs-grey-dark bg-nhs-white border border-nhs-grey-mid">
          No triage cases currently in queue.
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedQueue.map((item) => {
            const badgeLevel = getBadgeLevel(item.urgency);
            const isEmergency =
              badgeLevel === "EMERGENCY" && item.status !== "reviewed";
            return (
              <div
                key={item.id}
                className={`p-4 bg-nhs-white border flex items-center justify-between transition hover:shadow-md ${
                  isEmergency
                    ? "border-nhs-emergency-red border-l-4"
                    : "border-nhs-grey-mid"
                }`}
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-nhs-black">
                      {item.patientName || "Anonymous Patient"}
                    </span>

                    <UrgencyBadge level={badgeLevel} />

                    <span
                      className={`text-xs px-2 py-0.5 font-semibold ${
                        item.status === "reviewed"
                          ? "bg-nhs-grey-mid text-nhs-grey-dark"
                          : "bg-nhs-blue/10 text-nhs-blue"
                      }`}
                    >
                      {item.status ? item.status.toUpperCase() : "PENDING"}
                    </span>
                  </div>

                  <p className="text-xs text-nhs-grey-dark font-medium line-clamp-1">
                    <strong>Symptom:</strong>{" "}
                    {item.primarySymptom || item.symptomDetails}
                  </p>

                  {item.ageCategory && (
                    <span className="inline-block text-[11px] text-nhs-grey-dark bg-nhs-grey-light px-2 py-0.5">
                      {item.ageCategory} • {item.duration}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleOpenReview(item)}
                  className="px-4 py-2 bg-nhs-blue hover:bg-nhs-dark-blue text-nhs-white font-bold text-xs transition flex items-center gap-1.5 flex-shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {item.status === "reviewed" ? "View review" : "Review case"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CLINICIAN REVIEW MODAL --- */}
      {selectedCase && (
        <div className="fixed inset-0 bg-nhs-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-nhs-white max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-nhs-grey-mid">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-nhs-blue" />
                <h3 className="text-lg font-bold text-nhs-black">
                  Triage case details
                </h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                aria-label="Close"
                className="text-nhs-grey-dark hover:text-nhs-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-nhs-grey-light p-3 text-xs space-y-1">
              <p>
                <strong>Patient:</strong> {selectedCase.patientName} (
                {selectedCase.patientEmail})
              </p>
              <p>
                <strong>Age category:</strong>{" "}
                {selectedCase.ageCategory || "N/A"}
              </p>
              <p>
                <strong>Symptom duration:</strong>{" "}
                {selectedCase.duration || "N/A"}
              </p>
              <p>
                <strong>Submitted:</strong>{" "}
                {selectedCase.createdAt
                  ? new Date(selectedCase.createdAt).toLocaleString()
                  : "N/A"}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-nhs-black mb-1">
                Assessed urgency level
              </label>
              <UrgencyBadge level={getBadgeLevel(selectedCase.urgency)} />
            </div>

            {selectedCase.aiAssessment && (
              <div>
                <label className="block text-xs font-bold text-nhs-black mb-1">
                  AI clinical reasoning
                </label>
                <p className="text-xs bg-nhs-blue/5 p-2.5 border border-nhs-blue/20 text-nhs-black font-medium">
                  {selectedCase.aiAssessment}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-nhs-black mb-1">
                Reported symptoms
              </label>
              <p className="text-sm bg-nhs-grey-light p-3 border border-nhs-grey-mid text-nhs-grey-dark">
                {selectedCase.symptomDetails ||
                  selectedCase.primarySymptom ||
                  "No detailed symptoms provided."}
              </p>
            </div>

            <div>
              <label
                htmlFor="clinicianNotes"
                className="block text-xs font-bold text-nhs-black mb-1"
              >
                Clinician notes & action plan
              </label>
              <textarea
                id="clinicianNotes"
                rows={3}
                value={clinicianNotes}
                onChange={(e) => setClinicianNotes(e.target.value)}
                placeholder="Enter clinical review observations, prescriptions, or referral instructions..."
                className="w-full p-2.5 border-2 border-nhs-grey-mid text-xs focus:border-nhs-blue"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-nhs-grey-mid">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 bg-nhs-grey-light hover:bg-nhs-grey-mid text-nhs-black text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={() => handleSaveReview("reviewed")}
                className="px-4 py-2 bg-nhs-urgency-routine hover:brightness-90 text-nhs-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{submitting ? "Saving..." : "Mark as reviewed"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
