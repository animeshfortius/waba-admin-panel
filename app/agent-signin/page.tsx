"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AgentSigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter username/email and password!");
      return;
    }

    try {
      const res = await fetch("/api/auth/agent-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("currentAgent", JSON.stringify(data.agent));
        alert("✅ Agent Login Successful!");
        router.push("/dashboard/live-agent?agentMode=true");
      } else {
        alert(`❌ Login failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("❌ Network error during agent login.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 p-4 font-sans text-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 border">
        <div>
          <div className="text-gray-400 font-mono text-[11px] mb-1">waba-admin-panel.onrender.com/agent-signin</div>
          <h2 className="text-2xl font-extrabold text-gray-800">Agent Sign In</h2>
          <p className="text-gray-400 text-[11px] mt-0.5">Enter your credentials to access your live agent workspace.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Username / Email</label>
            <input
              type="text"
              placeholder="Enter your agent name or email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-xl p-3 bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600 font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl p-3 bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600 font-mono"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition cursor-pointer text-sm"
          >
            Sign In as Agent
          </button>
        </form>

        <div className="text-center text-gray-400 text-[11px]">
          WABA SaaS Platform | Secure Agent Portal
        </div>
      </div>
    </div>
  );
}