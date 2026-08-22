import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SafetyBanner from "./components/SafetyBanner";
import Header from "./components/Header";
import SymptomWizard from "./components/SymptomWizard";
import StaffDashboard from "./components/StaffDashboard";

export function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-nhs-grey-light">
        <SafetyBanner />
        <Header />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<SymptomWizard />} />
            <Route path="/dashboard" element={<StaffDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
