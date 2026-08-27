import { useEffect, useRef, useState } from "react";

const RED_FLAG_PATTERNS = [
  /\bchest pain\b/i,
  /\b(can'?t breathe|difficulty breathing|shortness of breath|breathless)\b/i,
  /\b(face (is )?droop|drooping face|slurred speech|speech is slurred|slurred speech|can'?t speak)\b/i,
  /\b(arm weakness|one side.*weak|numb(ness)? (down |on )?one side)\b/i,
  /\b(unconscious|unresponsive|passed out|not waking up)\b/i,
  /\b(severe bleeding|bleeding heavily|won'?t stop bleeding)\b/i,
  /\b(seizure|fitting|convulsion)\b/i,
  /\b(overdose|took too many (tablets|pills))\b/i,
  /\b(suicidal|want to (die|end my life|kill myself)|harm(ing)? myself)\b/i,
  /\b(anaphyla|swelling.*throat|throat.*closing)\b/i,
  /\b(blue lips|turning blue)\b/i,
  /\bchoking\b/i,
  /\b(severe head injury|head injury.*unconscious)\b/i,
];

export const checkRedFlags = (text) => {
  if (!text || text.trim().length < 5) return false;
  return RED_FLAG_PATTERNS.some((pattern) => pattern.test(text));
};

export const useEmergencyDetection = (symptoms) => {
  const [emergencyDetected, setEmergencyDetected] = useState(false);
  const [emergencyDismissed, setEmergencyDismissed] = useState(false);
  const emergencyBannerRef = useRef(null);

  const evaluateEmergency = () => {
    const isRedFlag = checkRedFlags(symptoms);

    setEmergencyDetected(isRedFlag);

    if (isRedFlag) {
      setEmergencyDismissed(false);
    }

    return isRedFlag;
  };

  const dismissEmergency = () => {
    setEmergencyDismissed(true);
  };

  useEffect(() => {
    if (
      emergencyDetected &&
      !emergencyDismissed &&
      emergencyBannerRef.current
    ) {
      emergencyBannerRef.current.focus();
    }
  }, [emergencyDetected, emergencyDismissed]);

  return {
    emergencyDetected,
    emergencyDismissed,
    evaluateEmergency,
    dismissEmergency,
    emergencyBannerRef,
  };
};
