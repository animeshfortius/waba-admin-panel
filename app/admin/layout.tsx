"use client";

import Sidebar from "@/components/sidebar";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface BrandingInfo {
  isWhiteLabel?: boolean;
  brandName?: string;
  logoUrl?: string | null;
  serverIp?: string;
}

interface WhiteLabelConfigInfo {
  isActive?: boolean;
  brandName?: string | null;
  domain?: string | null;
  customDomain?: string | null;
}

interface CurrentUserInfo {
  username?: string;
  name?: string;
  role?: string;
  actualBalance?: number;
  virtualBalance?: number;
  walletBalance?: number;
  whiteLabelConfig?: WhiteLabelConfigInfo | null;
}

function formatINR(amount?: number): string {
  const num = Number(amount ?? 0);
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [branding, setBranding] = useState<BrandingInfo>({
    isWhiteLabel: false,
    brandName: "Fortius Infocom",
    logoUrl: null,
    serverIp: "171.50.181.171",
  });
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    if (!host || host === "localhost" || host === "127.0.0.1") return;

    fetch(`/api/admin/branding?domain=${encodeURIComponent(host)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.config?.isActive) {
          setBranding({
            isWhiteLabel: true,
            brandName: data.config.brandName || "Partner Portal",
            logoUrl: data.config.logoUrl || null,
            serverIp: data.config.serverIp || "171.50.181.171",
          });
        }
      })
      .catch(() => {
        // Keep default Fortius Infocom branding on lookup failure
      });
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.user) {
          setCurrentUser({
            ...data.user,
            role: String(data.user.role || "USER").toUpperCase(),
          });
        }
      })
      .catch(() => {
        // Ignore if session endpoint not ready
      })
      .finally(() => {
        if (active) setSessionLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const role = String(currentUser?.role || "USER").toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isReseller = role === "RESELLER" || role === "WHITE_LABEL_RESELLER";
  const canViewActualBalance = isSuperAdmin || isReseller;

  const wl = currentUser?.whiteLabelConfig;
  const hasResellerBranding = Boolean(
    wl?.isActive &&
      (String(wl?.brandName || "").trim() ||
        String(wl?.domain || wl?.customDomain || "").trim())
  );
  const canManageUsers = isSuperAdmin || (isReseller && hasResellerBranding);

  useEffect(() => {
    if (!sessionLoaded) return;

    if (pathname?.startsWith("/admin")) {
      // Normal USER ko kisi bhi /admin route par nahi jaane dena
      if (!isSuperAdmin && !isReseller) {
        router.replace("/");
        return;
      }

      // Reseller ko sirf reseller tools par allow karein
      if (isReseller) {
        const resellerAllowed = [
          "/admin/transfer",
          "/admin/user-management",
          "/admin/branding",
          "/admin/white-label",
        ];
        const isAllowedPath = resellerAllowed.some((p) => pathname.startsWith(p));
        if (!isAllowedPath) {
          router.replace("/");
          return;
        }

        // Bina site branding ke user-management par jaane par branding page par bhejein
        if (pathname.startsWith("/admin/user-management") && !hasResellerBranding) {
          router.replace("/admin/branding");
          return;
        }
      }
    }
  }, [sessionLoaded, pathname, isSuperAdmin, isReseller, hasResellerBranding, router]);

  const brandTitle = branding.brandName || "Fortius Infocom";
  const initials =
    brandTitle
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "FI";

  const actualDisplay = formatINR(currentUser?.actualBalance);
  const virtualDisplay = formatINR(currentUser?.virtualBalance);

  return (
    <div className="flex min-h-screen bg-slate-50/90 text-xs font-sans text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 px-6 py-3 flex justify-between items-center shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 border border-slate-200/70 px-3 py-1.5 rounded-lg font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              IP: {branding.serverIp || "171.50.181.171"}
            </span>
            {branding.isWhiteLabel && (
              <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                White-Label Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5">
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition"
                >
                  <span>⚙️</span> Admin
                </Link>
              )}

              {isReseller && (
                <>
                  <Link
                    href="/admin/branding"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition"
                  >
                    <span>🎨</span> Site Branding
                  </Link>

                  {canManageUsers ? (
                    <Link
                      href="/admin/user-management"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition"
                    >
                      <span>👥</span> Manage Users
                    </Link>
                  ) : (
                    <span
                      title="Configure and activate your Site Branding first to create users"
                      className="bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-not-allowed select-none"
                    >
                      <span>🔒</span> Manage Users
                    </span>
                  )}

                  <Link
                    href="/admin/transfer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition"
                  >
                    <span>💸</span> Transfer Funds
                  </Link>
                </>
              )}

              {canViewActualBalance && (
                <div className="bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-[11px] shadow-2xs hidden sm:block">
                  ACTUAL: {actualDisplay}
                </div>
              )}

              <div className="bg-sky-50/90 border border-sky-200/80 text-sky-800 px-3 py-1.5 rounded-xl font-bold text-[11px] shadow-2xs hidden sm:block">
                VIRTUAL: {virtualDisplay}
              </div>
            </div>

            <div className="relative border-l border-slate-200 pl-4" ref={dropdownRef}>
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition select-none"
              >
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt={brandTitle}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-9 h-9 bg-slate-900 text-white font-extrabold rounded-full flex items-center justify-center text-xs shadow-2xs tracking-wider">
                    {initials}
                  </div>
                )}

                <div className="text-right hidden sm:block">
                  <div className="font-bold text-slate-800 text-xs">
                    {currentUser?.name || currentUser?.username || brandTitle}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {role.replace(/_/g, " ").toLowerCase()}
                  </div>
                </div>
              </div>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
                  <Link
                    href="/Client/MyProfile/Index"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                  >
                    <span>👤</span> My Profile
                  </Link>

                  <Link
                    href="/change-password"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                  >
                    <span>🔑</span> Change Password
                  </Link>

                  <div className="border-t border-slate-100 my-1"></div>

                  <div className="px-2">
                    <LogoutButton />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}