"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👁️ Show/Hide State
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Login API logic yahan aayegi
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans text-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-gray-800">WABA Admin Panel</h2>
          <p className="text-gray-400 text-[11px]">Sign in with your username</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-center font-medium">
            {error}
          </div>
        )}

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
                type={showPassword ? "text" : "password"} // Dynamic type toggle
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-xl shadow cursor-pointer text-xs transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}