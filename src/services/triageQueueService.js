import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export const submitTriageToQueue = async (formData, aiResult) => {
  const currentUser = auth.currentUser;

  return addDoc(collection(db, "triage_queue"), {
    patientUid: currentUser?.uid || "anonymous",
    patientName:
      currentUser?.displayName || currentUser?.email || "Anonymous Patient",
    patientEmail: currentUser?.email || null,
    primarySymptom:
      formData.symptoms.slice(0, 80) +
      (formData.symptoms.length > 80 ? "..." : ""),
    symptomDetails: formData.symptoms,
    ageCategory: formData.ageCategory,
    duration: formData.duration,
    urgency: aiResult.urgency,
    aiAssessment: aiResult.aiAssessment,
    redFlagTriggered: aiResult.redFlagTriggered,
    status: aiResult.urgency === "EMERGENCY" ? "immediate_review" : "pending",
    createdAt: new Date().toISOString(),
    timestamp: serverTimestamp(),
  });
};
