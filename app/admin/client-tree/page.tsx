"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ClientTreePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.users);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching users for tree view:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 text-xs">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
        <div>
          <div className="text-gray-400">Admin Home › Client Tree</div>
          <h1 className="text-xl font-bold text-gray-800">
            Client Tree View Hierarchy
          </h1>
        </div>
        <Link
          href="/admin"
          className="border px-3.5 py-1.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 shadow-sm bg-white"
        >
          ⬅ Back to Admin Hub
        </Link>
      </div>

      {/* Main Tree Card */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-sm text-gray-800">
            Database Hierarchy View
          </h3>
          <span className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-lg border">
            Root Node: Super Admin
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">
            Loading Tree Hierarchy from Database...
          </div>
        ) : (
          <div className="space-y-4 pl-2">
            {/* Root Admin Node */}
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md space-y-1">
              <div className="font-bold flex items-center space-x-2">
                <span>👑</span>
                <span>Fortius Infocom (Root Super Admin)</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Total Database Accounts: {users.length}
              </div>
            </div>

            {/* Tree Branch Line */}
            <div className="pl-6 space-y-3 border-l-2 border-emerald-500/40 ml-4">
              {users.length === 0 ? (
                <div className="p-4 text-gray-400 bg-gray-50 rounded-xl border">
                  No users found in database.
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white p-4 rounded-xl border shadow-xs hover:shadow-md transition space-y-2 relative"
                  >
                    {/* Horizontal Connector Line */}
                    <div className="absolute -left-6 top-6 w-6 h-0.5 bg-emerald-500/40"></div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">
                          {user.role === "SUPER_ADMIN"
                            ? "👑"
                            : user.role === "RESELLER"
                            ? "🏢"
                            : "👤"}
                        </span>
                        <span className="font-bold text-gray-800 text-sm">
                          {user.name}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {user.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        ID: {user.id.substring(0, 8)}...
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-lg border">
                      <div>
                        <span className="font-semibold text-gray-700">Email:</span>{" "}
                        {user.email}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Phone:</span>{" "}
                        {user.phone ? `+${user.phone}` : "N/A"}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Created:</span>{" "}
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}