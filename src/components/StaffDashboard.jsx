import React from "react";
import { UrgencyBadge } from "./UrgencyBadge";
import { ShieldCheck, Clock, Eye } from "lucide-react";

// Static mock data for UI visualization
const MOCK_QUEUE = [
  {
    id: "trg-90812",
    urgency: "EMERGENCY",
    ageCategory: "Adult (18-64)",
    summary: "Severe crush-like chest pain extending to jaw.",
    rawSymptoms:
      "Patient reports sudden onset crushing chest pain 30 mins ago radiating down left arm.",
    signedOff: false,
  },
  {
    id: "trg-84019",
    urgency: "URGENT",
    ageCategory: "Senior (65+)",
    summary: "High fever (39.2C) with persistent dry cough.",
    rawSymptoms:
      "Feeling unwell for 2 days, high temperature, mild confusion noted by family.",
    signedOff: false,
  },
  {
    id: "trg-71204",
    urgency: "ROUTINE",
    ageCategory: "Child (0-17)",
    summary: "Mild localized skin rash on forearm.",
    rawSymptoms:
      "Red spotty rash on lower right arm, no fever, eating and playing normally.",
    signedOff: true,
  },
];

const StaffDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 my-6">
      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-nhs-black">
            Live Clinician Triage Queue
          </h2>
          <p className="text-sm text-nhs-grey-dark">
            Real-time priority-weighted patient review stream
          </p>
        </div>
        <div className="flex items-center gap-2 bg-nhs-blue/10 text-nhs-blue px-3 py-1.5 rounded text-xs font-bold border border-nhs-blue/20">
          <ShieldCheck className="w-4 h-4" />
          <span>DCB0129 Clinical Safety Protocol Active</span>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-nhs-grey-mid">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-nhs-grey-light text-nhs-black border-b border-nhs-grey-mid text-xs font-bold uppercase tracking-wider">
                <th className="p-4">Ref ID</th>
                <th className="p-4">Urgency</th>
                <th className="p-4">Age Bracket</th>
                <th className="p-4">Clinical Reasoning & Symptoms</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nhs-grey-mid text-sm">
              {MOCK_QUEUE.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-nhs-grey-light/50 transition"
                >
                  <td className="p-4 font-mono text-xs font-bold text-nhs-dark-blue">
                    {item.id}
                  </td>
                  <td className="p-4">
                    <UrgencyBadge level={item.urgency} />
                  </td>
                  <td className="p-4 text-nhs-grey-dark font-medium">
                    {item.ageCategory}
                  </td>
                  <td className="p-4 max-w-md">
                    <p className="font-semibold text-nhs-black mb-1">
                      {item.summary}
                    </p>
                    <p className="text-xs text-nhs-grey-dark line-clamp-1">
                      {item.rawSymptoms}
                    </p>
                  </td>
                  <td className="p-4">
                    {item.signedOff ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                        <Clock className="w-3 h-3" /> Awaiting Review
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button className="px-3 py-1.5 bg-nhs-blue hover:bg-nhs-dark-blue text-white text-xs font-bold rounded inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default StaffDashboard;
