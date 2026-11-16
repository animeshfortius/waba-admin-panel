"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [agentData, setAgentData] = useState<any>(null);

  useEffect(() => {
    const agent = localStorage.getItem("currentAgent");
    const isAgentUrl = window.location.search.includes("agentMode=true") || pathname.includes("live-agent");
    if (agent || isAgentUrl) {
      setIsAgentMode(true);
      if (agent) {
        try {
          setAgentData(JSON.parse(agent));
        } catch (e) {
          console.error("Failed to parse agent data", e);
        }
      }
    }
  }, [pathname]);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 font-sans min-h-screen">
      <div className="space-y-1">
        <div className="p-5 font-bold text-xl text-white flex items-center space-x-2 border-b border-slate-800">
          <span className="bg-emerald-600 text-white px-2 py-1 rounded text-sm font-extrabold">WA</span>
          <span>{isAgentMode ? "Agent Portal" : "WABA Panel"}</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto text-sm font-medium">
          {isAgentMode ? (
            /* AGENT VIEW: Only Agent Workspace & Logout */
            <>
              <Link
                href="/dashboard/live-agent?agentMode=true"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname.includes("live-agent") ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>🎧</span>
                <span>Agent Workspace</span>
              </Link>

              <button
                onClick={() => {
                  localStorage.removeItem("currentAgent");
                  window.location.href = "/agent-signin";
                }}
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-red-500/20 text-red-400 font-bold transition mt-6 cursor-pointer"
              >
                <span>🚪</span>
                <span>Agent Logout</span>
              </button>
            </>
          ) : (
            /* ADMIN VIEW: Full Menus */
            <>
              <Link
                href="/dashboard"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>🏠</span>
                <span>Dashboard</span>
              </Link>

              <Link
                href="/dashboard/templates"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/templates" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>📄</span>
                <span>Manage Template</span>
              </Link>

              <Link
                href="/dashboard/campaigns"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/campaigns" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>📢</span>
                <span>Campaigns & Broadcast</span>
              </Link>

              <Link
                href="/dashboard/agents"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/agents" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>👥</span>
                <span>Agents</span>
              </Link>

              <Link
                href="/dashboard/automation"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/automation" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>⚡</span>
                <span>Automation & Chatbot</span>
              </Link>

              <Link
                href="/dashboard/reports"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/reports" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>📊</span>
                <span>Reports</span>
              </Link>

              <Link
                href="/dashboard/chat"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/chat" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>💬</span>
                <span>Live Chat</span>
              </Link>

              <Link
                href="/dashboard/api-docs"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/api-docs" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>🔌</span>
                <span>API Keys & Docs</span>
              </Link>

              <Link
                href="/dashboard/configuration"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/configuration" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>⚙️</span>
                <span>Configuration</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        {isAgentMode && agentData && (
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs space-y-0.5">
            <div className="text-emerald-400 font-bold">Agent Account:</div>
            <div className="text-white font-mono truncate">{agentData.name}</div>
            <div className="text-slate-400 text-[10px] truncate">{agentData.email}</div>
          </div>
        )}
        <div className="text-xs text-slate-500 text-center">
          WABA SaaS Platform v1.0
        </div>
      </div>
    </aside>
  );
}