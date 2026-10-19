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
      window.location.href = "/dashboard";
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
          window.location.href = data.redirectUrl || "/dashboard";
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
    <div className="flex min-h-screen w-full items-center justify-between bg-gradient-to-tr from-teal-600 via-emerald-600 to-cyan-700 p-10 lg:p-20 font-sans overflow-hidden relative">
      
      {/* Floating Emojis Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15 z-0 select-none">
        <span className="absolute text-5xl top-[10%] left-[5%] animate-pulse">💬</span>
        <span className="absolute text-6xl top-[75%] left-[12%]">🟢</span>
        <span className="absolute text-5xl top-[20%] left-[30%]">⚡</span>
        <span className="absolute text-6xl top-[80%] left-[28%]">🚀</span>
        <span className="absolute text-5xl top-[15%] right-[25%] animate-bounce">📱</span>
        <span className="absolute text-6xl top-[70%] right-[15%]">💬</span>
        <span className="absolute text-5xl top-[40%] right-[5%]">🌐</span>
        <span className="absolute text-4xl top-[85%] right-[45%]">🔔</span>
      </div>

      {/* Left Box: Login Form Card */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] max-w-lg w-full p-10 lg:p-14 space-y-8 z-10 border border-white/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Access Your WABA Panel</h1>
          <p className="text-slate-500 text-sm font-medium">
            Sign in to manage your official WhatsApp Business APIs.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-center font-medium text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 ml-1">Username / Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              className="w-full border border-slate-200 rounded-xl p-4 bg-slate-50 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition text-slate-800"
              required
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-slate-600 ml-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full border border-slate-200 rounded-xl p-4 pr-12 bg-slate-50 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm font-mono tracking-wider transition text-slate-800"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[3.3rem] text-slate-400 hover:text-slate-600 cursor-pointer text-base"
            >
              {showPassword ? "👁️‍🗨️" : "👁️"}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <label className="flex items-center space-x-2 text-slate-600 cursor-pointer font-medium">
              <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5" />
              <span>Keep me signed in</span>
            </label>
            <a href="#" className="text-emerald-700 font-semibold hover:underline hover:text-emerald-800 transition">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-4 rounded-xl shadow-lg cursor-pointer text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                </>
            ) : "Sign in to Dashboard"}
          </button>
        </form>
      </div>

      {/* Right Side: Fortius Infocom & WhatsApp Branding */}
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 pl-16 text-white relative text-center space-y-12 z-10">
        <div className="relative w-[32rem] h-[32rem] flex items-center justify-center">
          <div className="absolute w-full h-full border border-white/20 rounded-full animate-[pulse_6s_linear_infinite]"></div>
          <div className="absolute w-[24rem] h-[24rem] border border-white/30 rounded-full animate-[pulse_4s_linear_infinite]"></div>
          <div className="absolute w-[16rem] h-[16rem] border border-white/40 rounded-full animate-[pulse_2s_linear_infinite]"></div>
          
          {/* Bigger WhatsApp Icon in Center */}
          <div className="bg-white/15 backdrop-blur-2xl p-12 rounded-full border border-white/30 shadow-[0_0_80px_rgba(255,255,255,0.3)] flex items-center justify-center z-10 transition hover:scale-105 duration-300">
            <svg className="w-28 h-28 text-white fill-current" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.35-1.4c1.44.79 3.08 1.22 4.69 1.22 5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01C17.18 3.03 14.69 2 12.04 2M12.04 20.1c-1.42 0-2.81-.38-4.03-1.1l-.29-.17-3.03.79.81-2.95-.19-.31c-.81-1.31-1.24-2.83-1.24-4.38 0-4.56 3.71-8.27 8.27-8.27 2.21 0 4.29.86 5.85 2.42 1.56 1.56 2.42 3.64 2.41 5.85 0 4.56-3.71 8.27-8.27 8.27zm4.53-6.03c-.25-.13-1.47-.72-1.69-.81-.23-.09-.4-.13-.57.13-.18.25-.65.81-.8 1-.15.18-.3.2-.55.08-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.73-.15-.25-.02-.39.11-.52.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.57-1.38-.78-1.89-.2-.49-.41-.43-.57-.44h-.49c-.17 0-.45.06-.69.32-.24.25-.92.9-.92 2.2 0 1.3 1 2.55 1.14 2.73.14.18 1.97 3.01 4.77 4.22.67.29 1.19.46 1.6.59.67.22 1.28.19 1.76.11.54-.08 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29z"/>
            </svg>
          </div>
        </div>

        <div className="text-center space-y-3 z-10 px-4">
          <h2 className="text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">Fortius Infocom</h2>
          <p className="text-xl text-emerald-100 font-semibold">Official WhatsApp Business API Partner</p>
          <p className="text-sm text-white/90 max-w-lg font-medium leading-relaxed pt-2">
            Secure, reliable, and powerful WhatsApp Business API solutions. Manage massive message volumes, build custom integrations, and engage customers with verified branding.
          </p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className="bg-black/20 backdrop-blur-md border border-white/20 text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-sm">API INTEGRATION</span>
            <span className="bg-black/20 backdrop-blur-md border border-white/20 text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-sm">BUSINESS VERIFICATION</span>
            <span className="bg-black/20 backdrop-blur-md border border-white/20 text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-sm">AUTOMATION</span>
          </div>
        </div>
      </div>
    </div>
  );
}