"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("USER");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.role) {
          setRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  const isUser = role === "USER";

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 font-sans">
      <div className="p-5 font-bold text-xl text-white flex items-center space-x-2 border-b border-slate-800">
        <span className="bg-emerald-600 text-white px-2 py-1 rounded text-sm font-extrabold">WA</span>
        <span>WABA Panel</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto text-sm font-medium">
        {/* Common Dashboard */}
        <Link
          href="/dashboard"
          className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
            pathname === "/dashboard" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span>🏠</span>
          <span>Dashboard</span>
        </Link>

        {/* WhatsApp Core Features for Users */}
        <Link
          href="/templates"
          className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
            pathname === "/templates" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span>📄</span>
          <span>Manage Template</span>
        </Link>

        <Link
          href="/campaigns"
          className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
            pathname === "/campaigns" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span>📢</span>
          <span>Campaigns & Broadcast</span>
        </Link>

        <Link
          href="/agents"
          className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
            pathname === "/agents" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span>👥</span>
          <span>Agents & Contacts</span>
        </Link>

        <Link
          href="/automation"
          className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
            pathname === "/automation" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span>⚡</span>
          <span>Automation & Chatbot</span>
        </Link>

        <Link
          href="/reports"
          className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
            pathname === "/reports" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span>📊</span>
          <span>Delivery Reports</span>
        </Link>

        <Link
          href="/api-docs"
          className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
            pathname === "/api-docs" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span>🔌</span>
          <span>API Keys & Docs</span>
        </Link>

        {/* Admin/Reseller Only Links */}
        {!isUser && (
          <div className="pt-4 border-t border-slate-800 space-y-1.5">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Admin Management</p>
            <Link
              href="/admin"
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                pathname.startsWith("/admin") ? "bg-purple-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span>🛠️</span>
              <span>Admin Panel</span>
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        WABA SaaS Platform v1.0
      </div>
    </aside>
  );
}