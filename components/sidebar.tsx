"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Wallet, 
  Settings, 
  Radio,
  ShieldAlert 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState("USER");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.role) {
          setUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  // Reseller aur Admin ke liye Admin Panel / Clients ka access rahega, Normal User ke liye nahi
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "RESELLER", "USER"] },
    { name: "Admin Panel", href: "/admin", icon: ShieldAlert, roles: ["SUPER_ADMIN", "RESELLER"] },
    { name: "Clients", href: "/clients", icon: Users, roles: ["SUPER_ADMIN", "RESELLER"] },
    { name: "WABA Accounts", href: "/waba", icon: Radio, roles: ["SUPER_ADMIN", "RESELLER", "USER"] },
    { name: "Broadcasts", href: "/broadcasts", icon: MessageSquare, roles: ["SUPER_ADMIN", "RESELLER", "USER"] },
    { name: "Wallet & Billing", href: "/billing", icon: Wallet, roles: ["SUPER_ADMIN", "RESELLER", "USER"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN", "RESELLER", "USER"] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-slate-800">
          <div className="bg-emerald-500 p-2 rounded-lg text-slate-950 font-bold">WA</div>
          <span className="font-bold text-lg tracking-wide">WABA Panel</span>
        </div>

        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/dashboard" 
              ? pathname === "/dashboard" 
              : pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-emerald-600 text-white font-bold shadow-md" 
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

      <div className="border-t border-slate-800 pt-4 px-2 flex flex-col gap-3">
        <LogoutButton />
        
        <div className="text-xs text-slate-500">
          WABA SaaS Platform v1.0
        </div>
      </div>
    </aside>
  );
}