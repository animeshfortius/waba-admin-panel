"use client";

import Sidebar from "@/components/sidebar";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setWalletBalance(data.user.walletBalance || 0);
        }
      })
      .catch((err) => console.error("Error fetching user session:", err));
  }, []);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <div className="flex min-h-screen bg-gray-50 text-xs font-sans">
      {/* Sidebar Component */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-xs">
          <div className="text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-mono">
            IP: 171.50.181.171
          </div>

          <div className="flex items-center gap-4">
            {/* SUPER_ADMIN Specific Balances & Admin Button */}
            {isSuperAdmin ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <span>⚙️</span> Admin
                </Link>
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs">
                  ACTUAL: ₹1,234,567,890.00
                </div>
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs">
                  VIRTUAL: ₹1,234,567,890.00
                </div>
              </div>
            ) : (
              /* Single Wallet Balance for Normal Users */
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-1.5 rounded-xl font-bold text-xs shadow-xs">
                Wallet Balance: ₹{walletBalance.toFixed(2)}
              </div>
            )}

            {/* Dynamic User Profile Info & Logout */}
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="w-9 h-9 bg-emerald-600 text-white font-bold rounded-full flex items-center justify-center text-sm shadow">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-xs">
                  {user?.username || "Loading..."}
                </div>
                <div className="text-[10px] text-gray-400 capitalize">
                  {isSuperAdmin 
                    ? "Admin Panel" 
                    : user?.role === "RESELLER" 
                    ? "Reseller Account" 
                    : "User Account"}
                </div>
              </div>

              {/* Logout Option */}
              <div className="border-l pl-3 ml-1">
                <LogoutButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}