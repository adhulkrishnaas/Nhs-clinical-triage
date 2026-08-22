import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import SymptomWizard from "./components/SymptomWizard";
import StaffDashboard from "./components/StaffDashboard";
import SafetyBanner from "./components/SafetyBanner";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-nhs-grey-light flex flex-col font-sans">
        {/* Global NHS Header rendered on all pages */}
        <SafetyBanner />
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
          <Routes>
            {/* Patient Route - Default landing page for authenticated patients */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <SymptomWizard />
                </ProtectedRoute>
              }
            />

            {/* Clinician Route - Strictly protected for staff role */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRole="staff">
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />

            {/* Shared Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
