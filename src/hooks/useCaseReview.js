import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export const useCaseReview = () => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [clinicianNotes, setClinicianNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openReview = (item) => {
    setSelectedCase(item);
    setClinicianNotes(item.clinicianNotes || "");
  };

  const closeReview = () => {
    setSelectedCase(null);
    setClinicianNotes("");
  };

  const saveReview = async (newStatus) => {
    if (!selectedCase) return false;

    setSubmitting(true);

    try {
      const caseRef = doc(db, "triage_queue", selectedCase.id);

      await updateDoc(caseRef, {
        status: newStatus,
        clinicianNotes,
        reviewedBy: auth.currentUser?.email || "Clinician",
        reviewedAt: new Date().toISOString(),
      });

      closeReview();
      return true;
    } catch (error) {
      console.error("Error saving review to Firestore:", error);
      alert("Failed to update case review status.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    selectedCase,
    clinicianNotes,
    submitting,
    setClinicianNotes,
    openReview,
    closeReview,
    saveReview,
  };
};
