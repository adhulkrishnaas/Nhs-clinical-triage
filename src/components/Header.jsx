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
      {/* Skip link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:bg-nhs-white focus-visible:text-nhs-black focus-visible:px-4 focus-visible:py-2 focus-visible:font-bold"
      >
        Skip to main content
      </a>

      <header className="bg-nhs-blue text-nhs-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            {/* Organisation / service name */}
            <Link
              to="/"
              className="flex flex-col leading-tight min-w-0 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-nhs-white focus-visible:ring-offset-2 focus-visible:ring-offset-nhs-blue"
            >
              <span className="text-[10px] sm:text-xs font-medium tracking-wide text-nhs-grey-mid uppercase truncate">
                Clinical triage demo
              </span>

              <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight truncate">
                CareFlow Triage
              </span>
            </Link>

            {/* Account navigation */}
            <nav aria-label="Account" className="flex items-center shrink-0">
              {currentUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-10 px-3 sm:px-4 py-2 border-2 border-nhs-white text-nhs-white hover:bg-nhs-dark-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-nhs-white focus-visible:ring-offset-2 focus-visible:ring-offset-nhs-blue flex items-center justify-center gap-1.5 transition text-xs sm:text-sm font-bold"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign out</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  aria-current={
                    location.pathname === "/login" ? "page" : undefined
                  }
                  className={`min-h-10 px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 transition text-xs sm:text-sm ${
                    location.pathname === "/login"
                      ? "bg-nhs-dark-blue font-bold"
                      : "hover:bg-nhs-dark-blue/60"
                  } focus:outline-none focus-visible:ring-2 focus-visible:ring-nhs-white focus-visible:ring-offset-2 focus-visible:ring-offset-nhs-blue`}
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign in</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Portfolio disclaimer */}
      <div className="bg-nhs-black text-nhs-white text-[11px] sm:text-xs text-center leading-relaxed py-2 px-4">
        <span className="block max-w-4xl mx-auto">
          Portfolio demo project. Not affiliated with, endorsed by, or connected
          to the NHS.
        </span>
      </div>
    </>
  );
};

export default Header;
