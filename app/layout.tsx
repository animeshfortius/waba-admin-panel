"use client";

import LogoutButton from "@/components/LogoutButton";
import { Inter } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Check if current page is login page
  const isLoginPage = pathname === "/login";

  // Agar Login Page hai, toh Bina Sidebar / Header ke clean view dikhao
  if (isLoginPage) {
    return (
      <html lang="en">
        <body className={`${inter.className} bg-gray-50 text-gray-900`}>
          {children}
        </body>
      </html>
    );
  }

  // Baki saare pages (Dashboard, Admin, etc.) par Sidebar & Header dikhao
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <div className="flex h-screen overflow-hidden">
          
          {/* Left Sidebar */}
          <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
            <div className="p-5 font-bold text-xl text-white flex items-center space-x-2 border-b border-slate-800">
              <span className="bg-emerald-600 text-white px-2 py-1 rounded text-sm">WA</span>
              <span>WABA Panel</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto text-sm font-medium">
              <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg bg-emerald-600 text-white">
                <span>🏠</span>
                <span>Dashboard</span>
              </Link>
              <Link href="/templates" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 transition">
                <span>📄</span>
                <span>Manage Template</span>
              </Link>
              <Link href="/campaigns" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 transition">
                <span>📢</span>
                <span>Campaign</span>
              </Link>
              <Link href="/agents" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 transition">
                <span>👥</span>
                <span>Agent</span>
              </Link>
              <Link href="/automation" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 transition">
                <span>⚡</span>
                <span>Automation</span>
              </Link>
              <Link href="/reports" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 transition">
                <span>📊</span>
                <span>Report</span>
              </Link>
              <Link href="/api-docs" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 transition">
                <span>🔌</span>
                <span>API</span>
              </Link>
              <Link href="/configuration" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 transition">
                <span>⚙️</span>
                <span>Configuration</span>
              </Link>
            </nav>

            <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
              WABA SaaS Platform v1.0
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            
            {/* Top Navbar */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md border">
                  📍 IP: 171.50.181.171
                </span>
              </div>

              <div className="flex items-center space-x-6">
                <a href="/admin" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition flex items-center space-x-1.5 cursor-pointer">
                  <span>🛠️</span>
                  <span>Admin</span>
                </a>

                {/* Updated Double Balance Box (Actual Upper, Virtual Lower) */}
                <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-xl flex flex-col text-right shadow-sm justify-center">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-gray-500 text-[10px] uppercase">Actual:</span>
                    <span className="font-bold text-emerald-700 font-mono text-xs">₹1,234,567,890.00</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs border-t border-emerald-200/80 pt-0.5 mt-0.5">
                    <span className="font-semibold text-gray-500 text-[10px] uppercase">Virtual:</span>
                    <span className="font-bold text-purple-700 font-mono text-xs">Unlimited (∞)</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                  <Link href="/profile" className="flex items-center space-x-3 hover:opacity-80 transition cursor-pointer">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">Fortius Infocom</p>
                      <p className="text-xs text-emerald-600 font-medium">Admin Panel</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow">
                      FI
                    </div>
                  </Link>

                  <LogoutButton />
                </div>
              </div>
            </header>

            {/* Page View Container */}
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
              {children}
            </main>

          </div>
        </div>
      </body>
    </html>
  );
}