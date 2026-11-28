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

function getUserInitials(name?: string | null, username?: string | null): string {
  const source = String(name || username || "").trim();
  if (!source) return "AN";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase() || "AN";
  }
  return source.slice(0, 2).toUpperCase() || "AN";
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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

    fetch(`/api/admin/branding?domain=${encodeURIComponent(host)}`, {
      cache: "no-store",
      credentials: "include",
    })
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
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
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
      .catch(() => {})
      .finally(() => {
        if (active) setSessionLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  const role = String(currentUser?.role || "USER").toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isWhiteLabel = role === "WHITE_LABEL_RESELLER";
  const isReseller = role === "RESELLER" || isWhiteLabel;
  const canViewActualBalance = isSuperAdmin || isReseller;

  const wl = currentUser?.whiteLabelConfig;
  const hasResellerBranding = Boolean(
    wl?.isActive &&
      (String(wl?.brandName || "").trim() ||
        String(wl?.domain || wl?.customDomain || "").trim())
  );

  useEffect(() => {
    if (!sessionLoaded) return;

    if (pathname?.startsWith("/admin")) {
      if (!isSuperAdmin && !isReseller) {
        router.replace("/");
        return;
      }

      if (isReseller && !isSuperAdmin) {
        const resellerAllowed = [
          "/admin",
          "/admin/transfer",
          "/admin/user-management",
          "/admin/client-list",
          "/admin/client-tree",
          "/admin/branding",
        ];
        const isAllowedPath = resellerAllowed.some(
          (p) => pathname === p || pathname.startsWith(`${p}/`)
        );
        if (!isAllowedPath) {
          router.replace("/");
          return;
        }

        if (
          isWhiteLabel &&
          pathname.startsWith("/admin/user-management") &&
          !hasResellerBranding
        ) {
          router.replace("/admin/branding");
        }
      }
    }
  }, [
    sessionLoaded,
    pathname,
    isSuperAdmin,
    isReseller,
    isWhiteLabel,
    hasResellerBranding,
    router,
  ]);

  const displayName =
    currentUser?.name || currentUser?.username || branding.brandName || "Account";
  const initials = getUserInitials(currentUser?.name, currentUser?.username);

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
                <div className="w-9 h-9 bg-slate-900 text-white font-extrabold rounded-full flex items-center justify-center text-xs shadow-2xs tracking-wider">
                  {initials}
                </div>

                <div className="text-right hidden sm:block">
                  <div className="font-bold text-slate-800 text-xs">
                    {displayName}
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