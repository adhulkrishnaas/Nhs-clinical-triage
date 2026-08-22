import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SafetyBanner from "./components/SafetyBanner";
import Header from "./components/Header";
import SymptomWizard from "./components/SymptomWizard";
import StaffDashboard from "./components/StaffDashboard";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";

export function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-nhs-grey-light">
        <SafetyBanner />
        <Header />
        <main className="flex-grow">
          <Routes>
            {/* Public Patient Intake Route */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <SymptomWizard />
                </ProtectedRoute>
              }
            />
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Clinician Route - Staff Only */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRole="staff">
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
