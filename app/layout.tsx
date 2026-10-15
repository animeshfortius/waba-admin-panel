import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WABA Admin & SaaS Panel",
  description: "Multi-tenant WhatsApp Business API Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              <Link href="/" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg bg-emerald-600 text-white">
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
                {/* Direct Link to Admin */}
                <a href="/admin" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition flex items-center space-x-1.5 cursor-pointer">
                  <span>🛠️</span>
                  <span>Admin</span>
                </a>

                {/* Wallet Balance Widget */}
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-lg text-sm font-semibold flex items-center space-x-1.5">
                  <span>💰 Wallet:</span>
                  <span>₹24,500</span>
                </div>

                {/* Right Profile Section */}
                <Link href="/profile" className="flex items-center space-x-3 pl-4 border-l border-gray-200 hover:opacity-80 transition cursor-pointer">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">Fortius Infocom</p>
                    <p className="text-xs text-emerald-600 font-medium">Admin Panel</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow">
                    FI
                  </div>
                </Link>
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