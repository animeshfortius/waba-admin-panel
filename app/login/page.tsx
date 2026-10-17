"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isResetMode, setIsResetMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(data.redirectUrl || "/dashboard");
      } else {
        setError(data.message || "Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg("Password reset successfully! Logging you in...");
        setTimeout(() => {
          router.push(data.redirectUrl || "/dashboard");
        }, 1500);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      console.error("Reset error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans text-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-gray-800">WABA Admin Panel</h2>
          <p className="text-gray-400 text-[11px]">
            {isResetMode ? "Reset Password for Admin / Reseller / User" : "Sign in with your username"}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-3 rounded-xl text-center font-medium">
            {successMsg}
          </div>
        )}

        {!isResetMode ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block font-semibold text-gray-600">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full border rounded-xl p-3 bg-gray-50 focus:outline-none focus:bg-white text-xs"
                required
              />
            </div>

            <div className="space-y-1 relative">
              <label className="block font-semibold text-gray-600">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full border rounded-xl p-3 pr-10 bg-gray-50 focus:outline-none focus:bg-white text-xs font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer text-sm"
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-xl shadow cursor-pointer text-xs transition disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(true);
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                Forgot Password / Reset Password?
              </button>
            </div>
          </form>
        ) : (
          /* RESET PASSWORD FORM */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="block font-semibold text-gray-600">Username / Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full border rounded-xl p-3 bg-gray-50 focus:outline-none focus:bg-white text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-gray-600">New Password</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full border rounded-xl p-3 bg-gray-50 focus:outline-none focus:bg-white text-xs font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl shadow cursor-pointer text-xs transition disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset & Login"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-gray-500 font-semibold hover:underline cursor-pointer"
              >
                ⬅ Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}