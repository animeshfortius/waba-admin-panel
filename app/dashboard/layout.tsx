"use client";

import Sidebar from "@/components/sidebar";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  return (
    <div className="flex min-h-screen bg-gray-50 text-xs font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-xs relative">
          <div className="text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-mono">
            IP: 171.50.181.171
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Top Admin Button */}
              <Link
                href="/admin"
                className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <span>⚙️</span> Admin
              </Link>

              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs hidden sm:block">
                ACTUAL: ₹1,234,567,890.00
              </div>
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs hidden sm:block">
                VIRTUAL: ₹1,234,567,890.00
              </div>
            </div>

            {/* Profile Dropdown Container */}
            <div className="relative border-l pl-4" ref={dropdownRef}>
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition select-none"
              >
                <div className="w-9 h-9 bg-slate-900 text-white font-extrabold rounded-full flex items-center justify-center text-xs shadow tracking-wider">
                  FI
                </div>

                <div className="text-right hidden sm:block">
                  <div className="font-bold text-gray-800 text-xs">Fortius Infocom</div>
                  <div className="text-[10px] text-gray-400 capitalize">Admin Panel</div>
                </div>
              </div>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
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

                  <div className="px-2">
                    <LogoutButton />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}