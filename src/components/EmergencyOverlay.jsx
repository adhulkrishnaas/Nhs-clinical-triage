import React, { forwardRef } from "react";
import { PhoneCall } from "lucide-react";

export const EmergencyOverlay = forwardRef(({ show, onDismiss }, ref) => {
  if (!show) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergency-title"
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div className="bg-nhs-white max-w-md w-full p-6 space-y-4 border-t-[6px] border-nhs-emergency-red shadow-2xl">
        <div className="flex gap-3">
          <PhoneCall className="w-8 h-8 text-nhs-emergency-red flex-shrink-0" />

          <h2
            id="emergency-title"
            className="font-bold text-nhs-emergency-red text-lg"
          >
            Medical Emergency Warning
          </h2>
        </div>

        <p className="text-sm text-nhs-black">
          Your symptoms suggest you may require immediate emergency care. Do not
          wait for an online response.
        </p>

        <div className="space-y-2">
          <a
            href="tel:999"
            className="block w-full text-center py-3 bg-nhs-emergency-red text-nhs-white font-bold hover:brightness-90"
          >
            Call 999 Immediately
          </a>

          <a
            href="tel:111"
            className="block w-full text-center py-3 border-2 border-nhs-black text-nhs-black font-bold hover:bg-nhs-grey-light"
          >
            Call NHS 111
          </a>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full text-center text-xs text-nhs-grey-dark underline pt-2 hover:text-nhs-black"
        >
          I understand, continue with submission
        </button>
      </div>
    </div>
  );
});

EmergencyOverlay.displayName = "EmergencyOverlay";
