import React from "react";
import { AlertTriangle } from "lucide-react";

const SafetyBanner = () => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-nhs-emergency-red text-white px-4 py-3 sm:py-3.5 shadow-md border-b-2 border-nhs-emergency-darkRed"
    >
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-center gap-2.5 sm:gap-3">
        <AlertTriangle
          className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 mt-0.5 sm:mt-0 animate-pulse"
          aria-hidden="true"
        />

        <p className="text-xs sm:text-sm md:text-base font-bold leading-relaxed text-left sm:text-center">
          <span className="font-extrabold">EMERGENCY NOTICE:</span> If you have
          severe chest pain, major bleeding, or severe difficulty breathing,
          call 999 immediately.
        </p>
      </div>
    </div>
  );
};

export default SafetyBanner;
