"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface ClientRow {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  role: string;
  createdById?: string | null;
  customDomain?: string | null;
  actualBalance: number;
  virtualBalance: number;
  createdAt?: string | null;
  expiryDate?: string | null;
  status: string;
}

function formatDateDisplay(val?: string | null, fallback = "N/A"): string {
  if (!val) return fallback;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isResellerRole(role?: string): boolean {
  const r = String(role || "").toUpperCase();
  return r === "RESELLER" || r === "WHITE_LABEL_RESELLER";
}

export default function ClientListPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    const fallbackRole =
      localStorage.getItem("userRole") ||
      localStorage.getItem("adminRole") ||
      "SUPER_ADMIN";
    const fallbackId =
      localStorage.getItem("userId") || localStorage.getItem("adminId") || "";

    setCurrentUserRole(fallbackRole);
    setCurrentUserId(fallbackId);

    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.id) setCurrentUserId(data.user.id);
          if (data.user.role)
            setCurrentUserRole(String(data.user.role).toUpperCase());
        }
      })
      .catch(() => {});

    fetch("/api/admin/users", { cache: "no-store", credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const userList = data.users || (Array.isArray(data) ? data : []);
        if (Array.isArray(userList)) {
          const formattedClients: ClientRow[] = userList.map((u: any) => ({
            id: u.id,
            clientName: u.name || u.username || "N/A",
            phone: u.phone || "N/A",
            email: u.email || "N/A",
            role: String(u.role || "USER").toUpperCase(),
            createdById: u.createdById || null,
            customDomain: u.whiteLabelConfig?.domain || null,
            actualBalance: Number(u.actualBalance ?? 0),
            virtualBalance: Number(u.virtualBalance ?? 0),
            createdAt: u.createdAt || null,
            expiryDate: u.expiryDate || null,
            status: u.status || "Active",
          }));
          setClients(formattedClients);
        }
      })
      .catch((err) => {
        console.error("Error fetching users for client list:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const normalizedRole = String(currentUserRole || "").toUpperCase();
  const isSuperAdminViewer = normalizedRole === "SUPER_ADMIN";

  const visibleClients = useMemo(() => {
    return clients.filter((c) => {
      if (!isSuperAdminViewer && c.role === "SUPER_ADMIN") {
        return false;
      }

      if (isResellerRole(normalizedRole) && currentUserId) {
        const isOwned =
          c.createdById === currentUserId || c.id === currentUserId;
        if (!isOwned) return false;
      }

      if (roleFilter !== "ALL" && c.role !== roleFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          c.clientName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.customDomain && c.customDomain.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [
    clients,
    normalizedRole,
    isSuperAdminViewer,
    currentUserId,
    roleFilter,
    searchTerm,
  ]);

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Kya aap sach mein is account ko permanently delete karna chahte hain?"
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          requesterId: currentUserId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success !== false) {
        alert(data.message || "User account deleted successfully.");
        setClients((prev) => prev.filter((c) => c.id !== userId));
      } else {
        alert(
          data.error ||
            data.message ||
            "Aapke paas delete karne ki permission nahi hai."
        );
      }
    } catch (err) {
      console.error("Delete request failed:", err);
      alert("Server se connect nahi ho paya.");
    }
  };

  const canDelete =
    currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 text-xs font-sans">
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="text-[11px] text-slate-400 font-medium">
            Admin Home › Client List
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Client List Management
          </h1>
        </div>
        <Link
          href="/admin"
          className="border border-slate-200 px-3.5 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-50 shadow-2xs bg-white transition"
        >
          ⬅ Back to Admin Hub
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="font-bold text-slate-700 flex items-center gap-2">
            <span>🎛️ Filter Records</span>
            <span className="text-slate-400 font-normal">
              (Showing: {visibleClients.length} / Total: {clients.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, phone, domain..."
              className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs focus:outline-none focus:border-emerald-500 min-w-[220px]"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Roles</option>
              {isSuperAdminViewer && (
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              )}
              <option value="WHITE_LABEL_RESELLER">WHITE_LABEL_RESELLER</option>
              <option value="RESELLER">RESELLER</option>
              <option value="USER">USER</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            Database se records load ho rahe hain...
          </div>
        ) : visibleClients.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Koi user record nahi mila.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200/80 font-bold text-[10px]">
                  <th className="p-3.5">USER NAME</th>
                  <th className="p-3.5">MOBILE NUMBER</th>
                  <th className="p-3.5">EMAIL ID</th>
                  <th className="p-3.5">ROLE / PLAN</th>
                  <th className="p-3.5">BALANCES (ACTUAL / VIRTUAL)</th>
                  <th className="p-3.5">STATUS</th>
                  <th className="p-3.5">REGISTRATION DATE</th>
                  <th className="p-3.5">EXPIRY DATE</th>
                  {canDelete && <th className="p-3.5 text-center">ACTION</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleClients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">
                        {c.clientName}
                      </div>
                      {c.customDomain && (
                        <div className="text-[10px] font-mono text-indigo-600">
                          {c.customDomain}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {c.phone !== "N/A"
                        ? `+${c.phone.replace(/^\+/, "")}`
                        : "N/A"}
                    </td>
                    <td className="p-3.5 text-slate-600">{c.email}</td>
                    <td className="p-3.5 font-semibold">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                        {c.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] leading-relaxed">
                      <div className="text-emerald-700 font-semibold">
                        A: ₹{c.actualBalance.toFixed(2)}
                      </div>
                      <div className="text-sky-700 font-semibold">
                        V: ₹{c.virtualBalance.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                        ✔ {c.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {formatDateDisplay(c.createdAt)}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {formatDateDisplay(c.expiryDate)}
                    </td>
                    {canDelete && (
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(c.id)}
                          className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition shadow-2xs cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}