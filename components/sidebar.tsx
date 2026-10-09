"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Wallet, 
  Settings, 
  Radio 
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "WABA Accounts", href: "/waba", icon: Radio },
  { name: "Broadcasts", href: "/broadcasts", icon: MessageSquare },
  { name: "Wallet & Billing", href: "/billing", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-slate-800">
          <div className="bg-emerald-500 p-2 rounded-lg text-slate-950 font-bold">WA</div>
          <span className="font-bold text-lg tracking-wide">WABA Admin</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-emerald-600 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 pt-4 px-2 text-xs text-slate-500">
        WABA SaaS Platform v1.0
      </div>
    </aside>
  );
}