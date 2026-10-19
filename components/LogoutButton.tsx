"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 1. Clear local/session storage
      localStorage.clear();
      sessionStorage.clear();

      // 2. Clear the userId cookie immediately on client-side
      document.cookie = "userId=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      // 3. Optional: Call backend logout API if it exists
      await fetch("/api/auth/logout", {
        method: "POST",
      }).catch(() => {}); // Ignore error if api doesn't exist

      // 4. Force hard redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
    >
      🚪 Logout
    </button>
  );
}