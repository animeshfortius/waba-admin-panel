"use data"; // agar Next.js app router hai toh "use client" use hota hai
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Super Admin Bypass with Cookie
    if (cleanUser === "admin" && cleanPass === "Admin@123") {
      document.cookie = "userId=admin-fallback-id; path=/; max-age=604800";
      window.location.href = "/admin";
      return;
    }

    // Standard API Login
    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: cleanUser, password: cleanPass }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          window.location.href = data.redirectUrl || "/admin";
        } else {
          setError(data.message || "Invalid username or password");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Login error:", err);
        setError("Connection failed. Please try again.");
        setLoading(false);
      });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-between bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-600 p-8 lg:p-16 font-sans">
      {/* Left Box: Login Form Card */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 lg:p-10 space-y-6 z-10">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-400">https://waba.fortius.in.net</p>
          <h1 className="text-2xl font-bold text-gray-800">Sign in</h1>
          <p className="text-gray-400 text-xs">
            Don't have an account yet?{" "}
            <span className="text-emerald-600 font-semibold cursor-pointer hover:underline">
              Register here!
            </span>
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-center font-medium text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full border border-gray-200 rounded-xl p-3.5 bg-gray-50 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs transition"
              required
            />
          </div>

          <div className="space-y-1 relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border border-gray-200 rounded-xl p-3.5 pr-10 bg-gray-50 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-mono transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer text-sm"
            >
              {showPassword ? "👁️‍🗨️" : "👁️"}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <label className="flex items-center space-x-2 text-gray-600 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4" />
              <span>Keep me signed in</span>
            </label>
            <a href="#" className="text-emerald-600 font-medium hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold p-3.5 rounded-xl shadow-lg cursor-pointer text-xs transition disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign in"}
          </button>
        </form>
      </div>

      {/* Right Side: Graphic / Branding */}
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 pl-12 text-white relative">
        <div className="relative w-96 h-96 flex items-center justify-center">
          {/* Circular Orbit Rings Simulation */}
          <div className="absolute w-full h-full border border-white/20 rounded-full animate-spin-slow"></div>
          <div className="absolute w-72 h-72 border border-white/30 rounded-full"></div>
          <div className="absolute w-48 h-48 border border-white/40 rounded-full"></div>
          
          {/* Center Profile Image Placeholder / Graphic */}
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-full border border-white/30 shadow-2xl flex items-center justify-center">
            <span className="text-6xl">💬</span>
          </div>
        </div>
        <div className="text-center mt-6 space-y-2">
          <h2 className="text-2xl font-bold tracking-wide">Omni C</h2>
          <p className="text-sm text-white/80 max-w-sm">
            Omni connects WhatsApp, SMS, RCS, Email, Voice & AI — all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}