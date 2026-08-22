import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // 2. Create User Profile in Firestore with role = 'patient'
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        role: "patient",
        createdAt: new Date().toISOString(),
      });

      // 3. Redirect to Patient Intake Wizard
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-lg shadow border-t-4 border-nhs-blue">
      <h2 className="text-2xl font-bold text-nhs-black mb-2">
        Patient Account Registration
      </h2>
      <p className="text-sm text-nhs-grey-dark mb-6">
        Create an account to submit and track your clinical assessments.
      </p>

      {error && (
        <div className="p-3 bg-red-50 text-red-800 text-xs rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-nhs-black mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2.5 border border-nhs-grey-mid rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-nhs-black mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 border border-nhs-grey-mid rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-nhs-black mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 border border-nhs-grey-mid rounded text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-nhs-blue text-white font-bold rounded hover:bg-nhs-dark-blue text-sm"
        >
          {loading ? "Creating Account..." : "Register as Patient"}
        </button>
      </form>
    </div>
  );
};
export default Register;
