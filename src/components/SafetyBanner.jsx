import React from "react";
import { AlertTriangle } from "lucide-react";

const SafetyBanner = () => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-nhs-emergency-red text-white px-4 py-3 shadow-md border-b-2 border-nhs-emergency-darkRed"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <AlertTriangle
          className="w-6 h-6 flex-shrink-0 animate-pulse"
          aria-hidden="true"
        />
        <p className="text-sm md:text-base font-bold">
          EMERGENCY NOTICE: If you have severe chest pain, major bleeding, or
          severe difficulty breathing, call 999 immediately.
        </p>
      </div>
    </div>
  );
};

export default SafetyBanner;
