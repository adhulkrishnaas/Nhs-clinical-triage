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
    <header className="bg-nhs-blue text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="bg-white text-nhs-blue font-extrabold text-2xl px-3 py-1 rounded tracking-tighter hover:opacity-90"
          >
            NHS
          </Link>
          <span className="text-lg md:text-xl font-bold tracking-tight hidden sm:inline">
            Clinical Decision Support Portal
          </span>
        </div>

        <nav className="flex items-center gap-2 md:gap-4 text-sm font-medium">
          {currentUser ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-nhs-emergency-red hover:bg-nhs-emergency-dark-red text-white rounded flex items-center gap-1.5 transition text-xs font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className={`px-3 py-1.5 rounded flex items-center gap-1 transition ${location.pathname === "/login" ? "bg-nhs-dark-blue font-bold" : "hover:bg-nhs-dark-blue/50"}`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
export default Header;
