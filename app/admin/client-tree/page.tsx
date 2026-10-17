"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ClientListPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        // Response format handle karna (data.users ya direct array)
        const userList = data.users || (Array.isArray(data) ? data : []);
        
        if (userList) {
          const formattedClients = userList.map((u: any) => ({
            id: u.id,
            clientName: u.name || "N/A",
            phone: u.phone || "N/A",
            email: u.email || "N/A",
            plan: u.role || "USER",
            createdAt: u.createdAt
              ? new Date(u.createdAt).toLocaleDateString()
              : "10-Oct-2026",
          }));
          setClients(formattedClients);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching users for client list:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 text-xs">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
        <div>
          <div className="text-gray-400">Admin Home › Client List</div>
          <h1 className="text-xl font-bold text-gray-800">
            Client List Management
          </h1>
        </div>
        <Link
          href="/admin"
          className="border px-3.5 py-1.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 shadow-sm bg-white"
        >
          ⬅ Back to Admin Hub
        </Link>
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-3 bg-gray-50 border-b font-bold text-gray-600 flex justify-between items-center">
          <span>🎛️ Filter Records</span>
          <span className="text-gray-400 font-normal">
            Total Users: {clients.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">
            Database se records load ho rahe hain...
          </div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Koi user record nahi mila.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase border-b font-bold text-[10px]">
                <th className="p-3.5">USER NAME</th>
                <th className="p-3.5">MOBILE NUMBER</th>
                <th className="p-3.5">EMAIL ID</th>
                <th className="p-3.5">ROLE / PLAN</th>
                <th className="p-3.5">STATUS</th>
                <th className="p-3.5">REGISTRATION DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-3.5 font-bold text-gray-800">
                    {c.clientName}
                  </td>
                  <td className="p-3.5 font-mono">
                    {c.phone !== "N/A" ? `+${c.phone}` : "N/A"}
                  </td>
                  <td className="p-3.5 text-gray-600">{c.email}</td>
                  <td className="p-3.5 font-semibold">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      {c.plan}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✔ Active
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-gray-500">
                    {c.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}