"use client";

import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

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

const SUPER_ADMIN_FIXED_BALANCE = 123456789;

function formatINR(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Header() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [profilePic, setProfilePic] = useState("");

  const syncSessionAndBalances = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });
      if (!meRes.ok) return;

      const meData = await meRes.json();
      if (!meData?.success || !meData?.user) return;

      const normalizedRole = String(meData.user.role || "USER")
        .trim()
        .toUpperCase();
      const isSuper = normalizedRole === "SUPER_ADMIN";
      const isRes =
        normalizedRole === "RESELLER" ||
        normalizedRole === "WHITE_LABEL_RESELLER" ||
        Boolean(meData.user.isWhiteLabel);

      let actualBal = isSuper
        ? SUPER_ADMIN_FIXED_BALANCE
        : Number(meData.user.actualBalance ?? 0);
      let virtualBal = isSuper
        ? SUPER_ADMIN_FIXED_BALANCE
        : Number(meData.user.virtualBalance ?? 0);
      let walletBal = isSuper
        ? SUPER_ADMIN_FIXED_BALANCE
        : Number(meData.user.walletBalance ?? virtualBal);

      // Ensure live reseller balances from /api/admin/funds when available
      if (!isSuper && isRes && meData.user.id) {
        try {
          const fundsRes = await fetch(
            `/api/admin/funds?userId=${encodeURIComponent(String(meData.user.id))}`,
            { cache: "no-store", credentials: "include" }
          );
          if (fundsRes.ok) {
            const fundsData = await fundsRes.json();
            if (fundsData?.success) {
              if (fundsData.actualBalance !== undefined) {
                actualBal = Number(fundsData.actualBalance);
              }
              if (fundsData.virtualBalance !== undefined) {
                virtualBal = Number(fundsData.virtualBalance);
              }
              if (fundsData.walletBalance !== undefined) {
                walletBal = Number(fundsData.walletBalance);
              }
            }
          }
        } catch {
          // Fallback to /api/auth/me values
        }
      }

      setCurrentUser({
        ...meData.user,
        role: normalizedRole,
        actualBalance: actualBal,
        virtualBalance: virtualBal,
        walletBalance: walletBal,
      });
    } catch (err) {
      console.error("Error fetching header user:", err);
    }
  }, []);

  useEffect(() => {
    syncSessionAndBalances();
  }, [pathname, syncSessionAndBalances]);

  useEffect(() => {
    fetch("/api/client/profile", { cache: "no-store", credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user && data.user.image) {
          setProfilePic(data.user.image);
        }
      })
      .catch((err) => console.error("Error fetching header profile:", err));
  }, []);

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

  const role = String(currentUser?.role || "USER").trim().toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isReseller =
    !isSuperAdmin &&
    (role === "RESELLER" ||
      role === "WHITE_LABEL_RESELLER" ||
      Boolean(currentUser?.isWhiteLabel));

  const actualBal = isSuperAdmin
    ? SUPER_ADMIN_FIXED_BALANCE
    : Number(currentUser?.actualBalance ?? 0);
  const virtualBal = isSuperAdmin
    ? SUPER_ADMIN_FIXED_BALANCE
    : Number(currentUser?.virtualBalance ?? 0);
  const walletBal = isSuperAdmin
    ? SUPER_ADMIN_FIXED_BALANCE
    : Number(currentUser?.walletBalance ?? currentUser?.virtualBalance ?? 0);

  const displayName =
    currentUser?.name || currentUser?.username || "Account";
  const initials = displayName.substring(0, 2).toUpperCase() || "AC";

  const panelLabel = isSuperAdmin
    ? "Super Admin Panel"
    : isReseller
    ? "Reseller Panel"
    : "User Panel";

  return (
    <header className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-xs relative">
      <div className="text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-mono">
        IP: 171.50.181.171
      </div>

      <div className="flex items-center gap-4">
        {currentUser && (
          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <Link
                href="/admin"
                className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <span>⚙️</span> Admin
              </Link>
            )}

            {isSuperAdmin || isReseller ? (
              <>
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs hidden sm:block font-mono">
                  ACTUAL: {formatINR(actualBal)}
                </div>
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs hidden sm:block font-mono">
                  VIRTUAL: {formatINR(virtualBal)}
                </div>
              </>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs hidden sm:block font-mono">
                WALLET BALANCE: {formatINR(walletBal)}
              </div>
            )}
          </div>
        )}

        {/* Profile Dropdown Container */}
        <div className="relative border-l pl-4" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition select-none"
          >
            {profilePic ? (
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
                {displayName}
              </div>
              <div className="text-[10px] text-gray-400 capitalize">
                {panelLabel}
              </div>
            </div>
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
              <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Account
              </div>

              <Link
                href="/Client/MyProfile/Index"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
              >
                <span>👤</span> My Profile
              </Link>

              <Link
                href="/Client/ChangePassword/Index"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
              >
                <span>🔑</span> Change Password
              </Link>

              <Link
                href="#"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs text-red-600 hover:bg-gray-50 transition"
              >
                <span>🌐</span> System Support
              </Link>

              <div className="border-t border-gray-100 my-1"></div>

              <div className="px-2">
                <LogoutButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}