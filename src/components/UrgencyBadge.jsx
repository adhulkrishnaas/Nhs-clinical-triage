import React from "react";

export const UrgencyBadge = ({ level = "PENDING" }) => {
  const styles = {
    EMERGENCY: "bg-nhs-emergency-red text-white border-nhs-emergency-dark-red",
    URGENT: "bg-nhs-urgency-urgent text-white border-amber-700",
    ROUTINE: "bg-nhs-urgency-routine text-white border-green-800",
    PENDING: "bg-nhs-grey-dark text-white border-gray-600",
  };

  const currentStyle = styles[level] || styles.PENDING;

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-bold tracking-wider uppercase border-l-4 rounded-sm shadow-sm ${currentStyle}`}
    >
      {level}
    </span>
  );
};
