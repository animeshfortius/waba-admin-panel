"use client";

import { useState, useEffect } from "react";

export default function ClientListPage() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const formattedClients = data.users.map((u: any) => ({
            id: u.id,
            clientName: u.name,
            phone: u.phone || "N/A",
            email: u.email,
            plan: u.role || "USER",
            status: "Active",
          }));
          setClients(formattedClients);
        }
      })
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 text-xs">
      <div className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Client List Management</h1>
        <a
          href="/admin"
          className="border px-3.5 py-1.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 shadow-sm bg-white"
        >
          ⬅ Back to Admin Hub
        </a>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-3 bg-gray-50 border-b font-bold text-gray-600">
          🎛️ Filter Records
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase border-b font-bold text-[10px]">
              <th className="p-3.5">USER NAME</th>
              <th className="p-3.5">MOBILE NUMBER</th>
              <th className="p-3.5">EMAIL ID</th>
              <th className="p-3.5">IS ACTIVE</th>
              <th className="p-3.5">REGISTRATION DATE</th>
              <th className="p-3.5">EXPIRY DATE</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-3.5 font-bold">{c.clientName}</td>
                <td className="p-3.5 font-mono">+{c.phone}</td>
                <td className="p-3.5">{c.email}</td>
                <td className="p-3.5">
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    ✔
                  </span>
                </td>
                <td className="p-3.5 font-mono">10-Oct-2026</td>
                <td className="p-3.5 font-mono">30-Oct-2026</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}