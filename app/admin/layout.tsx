import Sidebar from "@/components/sidebar";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <span>🏠</span> Dashboard
              </Link>
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs">
                ACTUAL: ₹1,234,567,890.00
              </div>
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs">
                VIRTUAL: ₹1,234,567,890.00
              </div>
            </div>

            {/* Profile Info (Clickable Link to Profile Page) */}
            <Link
              href="/Client/MyProfile/Index"
              className="flex items-center gap-3 border-l pl-4 cursor-pointer hover:opacity-80 transition"
            >
              <div className="w-9 h-9 bg-slate-900 text-white font-extrabold rounded-full flex items-center justify-center text-xs shadow tracking-wider">
                FI
              </div>

              <div className="text-right">
                <div className="font-bold text-gray-800 text-xs">Fortius Infocom</div>
                <div className="text-[10px] text-gray-400 capitalize">Admin Panel</div>
              </div>
            </Link>

            <div className="border-l pl-3 ml-1">
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Main Admin Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}