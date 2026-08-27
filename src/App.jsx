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
      <div className="min-h-screen w-full overflow-x-hidden bg-nhs-grey-light font-sans flex flex-col">
        {/* Global safety banner */}
        <SafetyBanner />

        {/* Global NHS-style header */}
        <Header />

        {/* Main content area */}
        <main id="main-content" className="flex-1 w-full min-w-0">
          <div className="container mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
            <Routes>
              {/* Patient Route */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <SymptomWizard />
                  </ProtectedRoute>
                }
              />

              {/* Clinician Route */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRole="staff">
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
