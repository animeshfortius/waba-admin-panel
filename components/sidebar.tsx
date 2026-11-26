"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarBranding {
  brandName?: string;
  logoUrl?: string | null;
  primaryColor?: string;
}

interface WhiteLabelConfigInfo {
  isActive?: boolean;
  brandName?: string | null;
  domain?: string | null;
  customDomain?: string | null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [agentData, setAgentData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [whiteLabelConfig, setWhiteLabelConfig] =
    useState<WhiteLabelConfigInfo | null>(null);
  const [branding, setBranding] = useState<SidebarBranding>({
    brandName: "Fortius Infocom",
    logoUrl: null,
    primaryColor: "#059669",
  });

  useEffect(() => {
    const agent = localStorage.getItem("currentAgent");
    if (agent) {
      setIsAgentMode(true);
      try {
        const parsed = JSON.parse(agent);
        setAgentData(parsed);
      } catch (e) {
        console.error("Failed to parse agent data", e);
      }
    } else {
      setIsAgentMode(false);
      setAgentData(null);
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    if (!host || host === "localhost" || host === "127.0.0.1") return;

    fetch(`/api/admin/branding?domain=${encodeURIComponent(host)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.config?.isActive) {
          setBranding({
            brandName: data.config.brandName || "Partner Portal",
            logoUrl: data.config.logoUrl || null,
            primaryColor: data.config.primaryColor || "#059669",
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUserRole(String(data.user.role || "USER").toUpperCase());
          setWhiteLabelConfig(data.user.whiteLabelConfig || null);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isReseller =
    userRole === "WHITE_LABEL_RESELLER" || userRole === "RESELLER";

  const hasResellerBranding = Boolean(
    whiteLabelConfig?.isActive &&
      (String(whiteLabelConfig?.brandName || "").trim() ||
        String(
          whiteLabelConfig?.domain || whiteLabelConfig?.customDomain || ""
        ).trim())
  );

  const headerTitle = isAgentMode
    ? "Agent Portal"
    : branding.brandName || "WABA Panel";

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 font-sans min-h-screen">
      <div className="space-y-1">
        <div className="p-5 font-bold text-lg text-white flex items-center space-x-2.5 border-b border-slate-800">
          {branding.logoUrl && !isAgentMode ? (
            <img
              src={branding.logoUrl}
              alt={headerTitle}
              className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
            />
          ) : (
            <span className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-extrabold shrink-0">
              WA
            </span>
          )}
          <span className="truncate">{headerTitle}</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto text-sm font-medium">
          {isAgentMode ? (
            /* AGENT VIEW: Live Chat + Strictly Ticked Permissions Only */
            <>
              <Link
                href="/dashboard/chat"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname.includes("/dashboard/chat")
                    ? "bg-emerald-600 text-white font-bold"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>💬</span>
                <span>Live Chat</span>
              </Link>

              {agentData?.sendTemplate === true && (
                <Link
                  href="/dashboard/templates"
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                    pathname.includes("/dashboard/templates")
                      ? "bg-emerald-600 text-white font-bold"
                      : "hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <span>📄</span>
                  <span>Manage Template</span>
                </Link>
              )}

              {agentData?.sendCampaign === true && (
                <Link
                  href="/dashboard/campaigns"
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                    pathname.includes("/dashboard/campaigns")
                      ? "bg-emerald-600 text-white font-bold"
                      : "hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <span>📢</span>
                  <span>Campaigns & Broadcast</span>
                </Link>
              )}

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
            /* ROLE-BASED VIEW: SUPER_ADMIN / RESELLER / USER */
            <>
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                    pathname.startsWith("/admin")
                      ? "bg-indigo-600 text-white font-bold"
                      : "hover:bg-slate-800 text-indigo-300"
                  }`}
                >
                  <span>🛡️</span>
                  <span>Admin Panel</span>
                </Link>
              )}

              {isReseller && (
                <div className="pb-2 mb-2 border-b border-slate-800 space-y-1">
                  <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Reseller Controls
                  </div>

                  <Link
                    href="/admin/branding"
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                      pathname.startsWith("/admin/branding")
                        ? "bg-amber-600 text-white font-bold"
                        : "hover:bg-slate-800 text-amber-300"
                    }`}
                  >
                    <span>🎨</span>
                    <span>Site Branding</span>
                  </Link>

                  {hasResellerBranding ? (
                    <Link
                      href="/admin/user-management"
                      className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                        pathname.startsWith("/admin/user-management")
                          ? "bg-indigo-600 text-white font-bold"
                          : "hover:bg-slate-800 text-indigo-300"
                      }`}
                    >
                      <span>👥</span>
                      <span>Manage Users</span>
                    </Link>
                  ) : (
                    <div
                      title="Activate Site Branding first to create users"
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg text-slate-500 bg-slate-800/40 cursor-not-allowed select-none"
                    >
                      <span className="flex items-center space-x-3">
                        <span>🔒</span>
                        <span>Manage Users</span>
                      </span>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-400">
                        Branding Req.
                      </span>
                    </div>
                  )}

                  <Link
                    href="/admin/transfer"
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                      pathname.startsWith("/admin/transfer")
                        ? "bg-emerald-600 text-white font-bold"
                        : "hover:bg-slate-800 text-emerald-300"
                    }`}
                  >
                    <span>💸</span>
                    <span>Transfer Funds</span>
                  </Link>
                </div>
              )}

              <Link
                href="/dashboard"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard"
                    ? "bg-emerald-600 text-white font-bold"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>🏠</span>
                <span>Dashboard</span>
              </Link>

              <Link
                href="/dashboard/templates"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/templates"
                    ? "bg-emerald-600 text-white font-bold"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>📄</span>
                <span>Manage Template</span>
              </Link>

              <Link
                href="/dashboard/campaigns"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/campaigns"
                    ? "bg-emerald-600 text-white font-bold"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>📢</span>
                <span>Campaigns & Broadcast</span>
              </Link>

              <Link
                href="/dashboard/agents"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/agents"
                    ? "bg-emerald-600 text-white font-bold"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>👥</span>
                <span>Agents</span>
              </Link>

              <Link
                href="/dashboard/automation"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/automation"
                    ? "bg-emerald-600 text-white font-bold"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>⚡</span>
                <span>Automation & Chatbot</span>
              </Link>

              <Link
                href="/dashboard/reports"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/reports"
                    ? "bg-emerald-600 text-white font-bold"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>📊</span>
                <span>Reports</span>
              </Link>

              <Link
                href="/dashboard/chat"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/chat"
                    ? "bg-emerald-600 text-white font-bold"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>💬</span>
                <span>Live Chat</span>
              </Link>

              <Link
                href="/dashboard/api-docs"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/api-docs"
                    ? "bg-emerald-600 text-white font-bold"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span>🔌</span>
                <span>API Keys & Docs</span>
              </Link>

              <Link
                href="/dashboard/configuration"
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === "/dashboard/configuration"
                    ? "bg-emerald-600 text-white font-bold"
                    : "hover:bg-slate-800 text-slate-300"
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