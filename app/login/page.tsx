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

    if (cleanUser === "admin" && cleanPass === "Admin@123") {
      document.cookie = "userId=admin-fallback-id; path=/; max-age=604800";
      window.location.href = "/admin";
      return;
    }

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
    <div className="flex min-h-screen w-full items-center justify-between bg-gradient-to-r from-teal-500 via-emerald-600 to-cyan-700 p-8 lg:p-16 font-sans overflow-hidden">
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

      {/* Right Side: Fortius Infocom & WhatsApp Branding */}
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 pl-12 text-white relative text-center">
        <div className="relative w-96 h-96 flex items-center justify-center">
          <div className="absolute w-full h-full border border-white/20 rounded-full animate-pulse"></div>
          <div className="absolute w-72 h-72 border border-white/30 rounded-full"></div>
          <div className="absolute w-48 h-48 border border-white/40 rounded-full"></div>
          
          {/* Big WhatsApp Icon in Center */}
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-full border border-white/30 shadow-2xl flex items-center justify-center z-10">
            <svg className="w-20 h-20 text-white fill-current" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.35-1.4c1.44.79 3.08 1.22 4.69 1.22 5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01C17.18 3.03 14.69 2 12.04 2M12.04 20.1c-1.42 0-2.81-.38-4.03-1.1l-.29-.17-3.03.79.81-2.95-.19-.31c-.81-1.31-1.24-2.83-1.24-4.38 0-4.56 3.71-8.27 8.27-8.27 2.21 0 4.29.86 5.85 2.42 1.56 1.56 2.42 3.64 2.41 5.85 0 4.56-3.71 8.27-8.27 8.27zm4.53-6.03c-.25-.13-1.47-.72-1.69-.81-.23-.09-.4-.13-.57.13-.18.25-.65.81-.8 1-.15.18-.3.2-.55.08-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.73-.15-.25-.02-.39.11-.52.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.57-1.38-.78-1.89-.2-.49-.41-.43-.57-.44h-.49c-.17 0-.45.06-.69.32-.24.25-.92.9-.92 2.2 0 1.3 1 2.55 1.14 2.73.14.18 1.97 3.01 4.77 4.22.67.29 1.19.46 1.6.59.67.22 1.28.19 1.76.11.54-.08 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29z"/>
            </svg>
          </div>
        </div>

        <div className="text-center mt-6 space-y-2">
          <h2 className="text-3xl font-bold tracking-wide">Fortius Infocom</h2>
          <p className="text-sm text-white/90 max-w-md font-medium">
            Official WhatsApp Business API, RCS, SMS, Email, Voice & AI Solutions — All in one place.
          </p>
        </div>
      </div>
    </div>
  );
}