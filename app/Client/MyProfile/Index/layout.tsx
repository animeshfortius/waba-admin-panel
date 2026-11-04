import Sidebar from "@/components/sidebar";
import Link from "next/link";

export default function ClientProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}