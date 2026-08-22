import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { LogOut, User } from "lucide-react";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <>
      {/* Skip link for keyboard/screen reader users - NHS.uk pattern */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:bg-nhs-white focus-visible:text-nhs-black focus-visible:px-4 focus-visible:py-2 focus-visible:font-bold"
      >
        Skip to main content
      </a>

      <header className="bg-nhs-blue text-nhs-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Organisation name / service name stack, NHS.uk pattern */}
          <Link to="/" className="flex flex-col leading-tight hover:opacity-90">
            <span className="text-xs font-medium tracking-wide text-nhs-grey-mid uppercase">
              Clinical triage demo
            </span>
            <span className="text-lg md:text-xl font-bold tracking-tight">
              CareFlow Triage
            </span>
          </Link>

          <nav
            aria-label="Account"
            className="flex items-center gap-2 md:gap-4 text-sm font-medium"
          >
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 border-2 border-nhs-white text-nhs-white hover:bg-nhs-dark-blue flex items-center gap-1.5 transition text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            ) : (
              <Link
                to="/login"
                aria-current={
                  location.pathname === "/login" ? "page" : undefined
                }
                className={`px-3 py-1.5 flex items-center gap-1 transition ${
                  location.pathname === "/login"
                    ? "bg-nhs-dark-blue font-bold"
                    : "hover:bg-nhs-dark-blue/60"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign in</span>
              </Link>
            )}
          </nav>
        </div>
      </header>
      {/* Portfolio disclaimer strip - always visible, not dismissible */}
      <div className="bg-nhs-black text-nhs-white text-xs text-center py-1 px-4">
        Portfolio demo project. Not affiliated with, endorsed by, or connected
        to the NHS.
      </div>
    </>
  );
};

export default Header;
