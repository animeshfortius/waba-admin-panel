"use client";

import Sidebar from "@/components/sidebar";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthUser {
  id: string;
  username: string;
  name?: string;
  email?: string;
  role: string;
  isWhiteLabel?: boolean;
  actualBalance?: number;
  virtualBalance?: number;
  walletBalance?: number;
}

function formatINR(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [agentData, setAgentData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [profilePic, setProfilePic] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          const normalizedRole = String(data.user.role || "USER")
            .trim()
            .toUpperCase();
          setCurrentUser({
            ...data.user,
            role: normalizedRole,
          });
        }
      })
      .catch((err) => console.error("Error fetching current user:", err));

    fetch("/api/client/profile", { cache: "no-store", credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user && data.user.image) {
          setProfilePic(data.user.image);
        }
      })
      .catch((err) => console.error("Error fetching header profile:", err));

    const agentStr = localStorage.getItem("currentAgent");
    if (agentStr) {
      try {
        const parsedAgent = JSON.parse(agentStr);
        setAgentData(parsedAgent);

        const allowedPaths = ["/dashboard/chat"];
        if (parsedAgent.sendTemplate) allowedPaths.push("/dashboard/templates");
        if (parsedAgent.sendCampaign) allowedPaths.push("/dashboard/campaigns");

        const isAllowed = allowedPaths.some((path) => pathname.startsWith(path));
        if (!isAllowed) {
          router.push("/dashboard/chat");
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setAgentData(null);
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pathname, router]);

  const role = String(currentUser?.role || "USER").trim().toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isReseller =
    role === "RESELLER" ||
    role === "WHITE_LABEL_RESELLER" ||
    Boolean(currentUser?.isWhiteLabel);

  const actualBal = Number(currentUser?.actualBalance ?? 0);
  const virtualBal = Number(currentUser?.virtualBalance ?? 0);

  const displayName =
    currentUser?.name || currentUser?.username || "Fortius Infocom";
  const initials = displayName.substring(0, 2).toUpperCase() || "FI";

  const panelLabel = isSuperAdmin
    ? "Super Admin Panel"
    : isReseller
    ? "Reseller Panel"
    : "User Panel";

  return (
    <div className="flex min-h-screen bg-gray-50 text-xs font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-xs relative">
          <div className="text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-mono">
            IP: 171.50.181.171
          </div>

          <div className="flex items-center gap-4">
            {!agentData && currentUser && (
              <div className="flex items-center gap-3">
                {isSuperAdmin && (
                  <Link
                    href="/admin"
                    className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <span>⚙️</span> Admin
                  </Link>
                )}

                {(isSuperAdmin || isReseller) && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs hidden sm:block font-mono">
                    ACTUAL: {formatINR(actualBal)}
                  </div>
                )}

                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs hidden sm:block font-mono">
                  VIRTUAL: {formatINR(virtualBal)}
                </div>
              </div>
            )}

            {/* Profile Dropdown Container */}
            <div className="relative border-l pl-4" ref={dropdownRef}>
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition select-none"
              >
                {agentData ? (
                  <div className="w-9 h-9 bg-slate-900 text-white font-extrabold rounded-full flex items-center justify-center text-xs shadow tracking-wider">
                    {agentData.name.substring(0, 2).toUpperCase()}
                  </div>
                ) : profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover shadow border"
                  />
                ) : (
                  <div className="w-9 h-9 bg-slate-900 text-white font-extrabold rounded-full flex items-center justify-center text-xs shadow tracking-wider">
                    {initials}
                  </div>
                )}

                <div className="text-right hidden sm:block">
                  <div className="font-bold text-gray-800 text-xs">
                    {agentData ? agentData.name : displayName}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {agentData ? "Live Agent" : panelLabel}
                  </div>
                </div>
              </div>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
                  {!agentData && (
                    <>
                      <Link
                        href="/Client/MyProfile/Index"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
                      >
                        <span>👤</span> My Profile
                      </Link>

                      <Link
                        href="/change-password"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
                      >
                        <span>🔑</span> Change Password
                      </Link>

                      <div className="border-t border-gray-100 my-1"></div>
                    </>
                  )}

                  <div className="px-2">
                    <LogoutButton />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}