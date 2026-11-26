"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}

    window.location.href = "/api/logout";
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer disabled:opacity-50"
    >
      🚪 {loggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}