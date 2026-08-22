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

const StaffDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [clinicianNotes, setClinicianNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    // Clean up listener when component unmounts
    return () => unsubscribe();
  }, []);

  // 2. Map database urgency strings to UrgencyBadge levels
  const getBadgeLevel = (urgency = "", status = "") => {
    if (status === "reviewed") return "PENDING";

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

  // 3. Open the Review Modal for a selected case
  const handleOpenReview = (item) => {
    setSelectedCase(item);
    setClinicianNotes(item.clinicianNotes || "");
  };

  // 4. Save review decision back to Firestore
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-nhs-grey-mid">
        <div>
          <h1 className="text-2xl font-bold text-nhs-black">
            Live Clinician Triage Queue
          </h1>
          <p className="text-sm text-nhs-grey-dark">
            Real-time patient symptom assessments
          </p>
        </div>
        <span className="bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          Live Feed ({pendingCount} Pending)
        </span>
      </div>

      {/* Main Queue List */}
      {loading ? (
        <div className="p-8 text-center text-nhs-grey-dark text-sm flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 animate-spin text-nhs-blue" />
          <span>Connecting to live Firestore stream...</span>
        </div>
      ) : queue.length === 0 ? (
        <div className="p-8 text-center text-nhs-grey-dark bg-white rounded-lg border border-nhs-grey-mid">
          No triage cases currently in queue.
        </div>
      ) : (
        <div className="grid gap-4">
          {queue.map((item) => {
            const badgeLevel = getBadgeLevel(item.urgency, item.status);
            return (
              <div
                key={item.id}
                className="p-4 bg-white rounded-lg shadow-sm border border-nhs-grey-mid flex items-center justify-between transition hover:shadow-md"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-nhs-black">
                      {item.patientName || "Anonymous Patient"}
                    </span>

                    {/* Urgency Badge Component */}
                    <UrgencyBadge level={badgeLevel} />

                    {/* Status Badge */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        item.status === "reviewed"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-blue-50 text-nhs-blue"
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
                    <span className="inline-block text-[11px] text-nhs-grey-dark bg-nhs-grey-light px-2 py-0.5 rounded">
                      {item.ageCategory} • {item.duration}
                    </span>
                  )}
                </div>

                {/* Review Action Button */}
                <button
                  onClick={() => handleOpenReview(item)}
                  className="px-4 py-2 bg-nhs-blue hover:bg-nhs-dark-blue text-white font-bold text-xs rounded transition flex items-center gap-1.5 flex-shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {item.status === "reviewed" ? "View Review" : "Review Case"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CLINICIAN REVIEW MODAL --- */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-nhs-grey-mid">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-nhs-blue" />
                <h3 className="text-lg font-bold text-nhs-black">
                  Triage Case Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Case Summary */}
            <div className="bg-nhs-grey-light p-3 rounded text-xs space-y-1">
              <p>
                <strong>Patient:</strong> {selectedCase.patientName} (
                {selectedCase.patientEmail})
              </p>
              <p>
                <strong>Age Category:</strong>{" "}
                {selectedCase.ageCategory || "N/A"}
              </p>
              <p>
                <strong>Symptom Duration:</strong>{" "}
                {selectedCase.duration || "N/A"}
              </p>
              <p>
                <strong>Submitted:</strong>{" "}
                {selectedCase.createdAt
                  ? new Date(selectedCase.createdAt).toLocaleString()
                  : "N/A"}
              </p>
            </div>

            {/* Urgency Badge inside Modal */}
            <div>
              <label className="block text-xs font-bold text-nhs-black mb-1">
                Assessed Urgency Level
              </label>
              <UrgencyBadge
                level={getBadgeLevel(selectedCase.urgency, selectedCase.status)}
              />
            </div>

            {/* AI Assessment / Reason */}
            {selectedCase.aiAssessment && (
              <div>
                <label className="block text-xs font-bold text-nhs-black mb-1">
                  AI Clinical Reasoning
                </label>
                <p className="text-xs bg-blue-50 p-2.5 rounded border border-blue-200 text-nhs-blue font-medium">
                  {selectedCase.aiAssessment}
                </p>
              </div>
            )}

            {/* Patient Reported Symptoms */}
            <div>
              <label className="block text-xs font-bold text-nhs-black mb-1">
                Reported Symptoms
              </label>
              <p className="text-sm bg-gray-50 p-3 rounded border border-nhs-grey-mid text-nhs-grey-dark">
                {selectedCase.symptomDetails ||
                  selectedCase.primarySymptom ||
                  "No detailed symptoms provided."}
              </p>
            </div>

            {/* Clinician Notes Input */}
            <div>
              <label className="block text-xs font-bold text-nhs-black mb-1">
                Clinician Notes & Action Plan
              </label>
              <textarea
                rows={3}
                value={clinicianNotes}
                onChange={(e) => setClinicianNotes(e.target.value)}
                placeholder="Enter clinical review observations, prescriptions, or referral instructions..."
                className="w-full p-2.5 border border-nhs-grey-mid rounded text-xs focus:border-nhs-blue"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-nhs-grey-mid">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={() => handleSaveReview("reviewed")}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{submitting ? "Saving..." : "Mark as Reviewed"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StaffDashboard;
