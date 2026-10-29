"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 font-sans">
      <div className="p-5 font-bold text-xl text-white flex items-center space-x-2 border-b border-slate-800">
        <span className="bg-emerald-600 text-white px-2 py-1 rounded text-sm font-extrabold">WA</span>
        <span>WABA Panel</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto text-sm font-medium">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
            pathname === "/dashboard" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span>🏠</span>
          <span>Dashboard</span>
        </Link>

        {/* WhatsApp Core Features mapped correctly under /dashboard/ */}
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
          <span>Agents & Contacts</span>
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
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        WABA SaaS Platform v1.0
      </div>
    </aside>
  );
}