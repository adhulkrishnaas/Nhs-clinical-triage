import React, { useState } from "react";
import { QueueHeader } from "./QueueHeader";
import { QueueList } from "./QueueList";
import { CaseReviewModal } from "./CaseReviewModal";
import { useTriageQueue } from "../hooks/useTriageQueue";
import { useCaseReview } from "../hooks/useCaseReview";

const StaffDashboard = () => {
  const [showReviewed, setShowReviewed] = useState(false);

  const { sortedQueue, loading, pendingCount, emergencyPendingCount } =
    useTriageQueue(showReviewed);

  const {
    selectedCase,
    clinicianNotes,
    submitting,
    setClinicianNotes,
    openReview,
    closeReview,
    saveReview,
  } = useCaseReview();

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <QueueHeader
        emergencyPendingCount={emergencyPendingCount}
        pendingCount={pendingCount}
        showReviewed={showReviewed}
        onToggleReviewed={() => setShowReviewed((previous) => !previous)}
      />

      <QueueList
        loading={loading}
        sortedQueue={sortedQueue}
        onOpenReview={openReview}
      />

      <CaseReviewModal
        selectedCase={selectedCase}
        clinicianNotes={clinicianNotes}
        submitting={submitting}
        onNotesChange={setClinicianNotes}
        onClose={closeReview}
        onSave={saveReview}
      />
    </div>
  );
};

export default StaffDashboard;
