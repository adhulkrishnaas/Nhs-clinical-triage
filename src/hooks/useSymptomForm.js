import { useState } from "react";

export const INITIAL_FORM_DATA = {
  ageCategory: "Adult (18 to 64)",
  duration: "Less than 24 hours",
  symptoms: "",
};

export const useSymptomForm = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [consentGiven, setConsentGiven] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setConsentGiven(false);
  };

  return {
    formData,
    consentGiven,
    setConsentGiven,
    updateField,
    resetForm,
  };
};
