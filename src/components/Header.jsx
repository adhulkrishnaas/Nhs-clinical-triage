import React from "react";
import { Link, useLocation } from "react-router-dom";

export const Header = () => {
  const location = useLocation();

  return (
    <header className="bg-nhs-blue text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white text-nhs-blue font-extrabold text-2xl px-3 py-1 rounded tracking-tighter">
            NHS
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight">
            Clinical Decision Support Portal
          </span>
        </div>
        <nav className="flex gap-4 text-sm font-medium">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded transition ${location.pathname === "/" ? "bg-nhs-dark-blue font-bold" : "hover:bg-nhs-dark-blue/50"}`}
          >
            Patient Intake
          </Link>
          <Link
            to="/dashboard"
            className={`px-3 py-1.5 rounded transition ${location.pathname === "/dashboard" ? "bg-nhs-dark-blue font-bold" : "hover:bg-nhs-dark-blue/50"}`}
          >
            Staff Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
};
