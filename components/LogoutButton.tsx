"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}

    try {
      await fetch("/api/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
    } catch (e) {}

    window.location.replace("/login");
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