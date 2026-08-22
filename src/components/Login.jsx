import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { Lock, LogIn, AlertCircle } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate user credentials
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;

      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);
      const userRole = userSnap.exists() ? userSnap.data()?.role : "patient";

      // 3. Dynamic redirection based on role
      navigate(userRole === "staff" ? "/dashboard" : "/");
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-nhs-white border-t-4 border-nhs-blue">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-6 h-6 text-nhs-blue" />
        <h2 className="text-2xl font-bold text-nhs-black">Portal sign in</h2>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-nhs-emergency-red/5 border-l-4 border-nhs-emergency-red p-3 mb-4 flex items-center gap-2 text-xs text-nhs-black"
        >
          <AlertCircle className="w-4 h-4 text-nhs-emergency-red flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-bold text-nhs-black mb-1"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full p-2.5 border-2 border-nhs-grey-mid focus:border-nhs-blue text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-bold text-nhs-black mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 border-2 border-nhs-grey-mid focus:border-nhs-blue text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-nhs-blue hover:bg-nhs-dark-blue text-nhs-white font-bold flex items-center justify-center gap-2 text-sm transition disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" />
          <span>{loading ? "Authenticating..." : "Sign in"}</span>
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-nhs-grey-mid text-center text-xs text-nhs-grey-dark">
        New patient?{" "}
        <Link
          to="/register"
          className="text-nhs-blue font-bold underline hover:text-nhs-dark-blue"
        >
          Create an account here
        </Link>
      </div>
    </div>
  );
};

export default Login;
