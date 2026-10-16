"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 1. Client-side storage clear karein
      localStorage.clear();
      sessionStorage.clear();

      // 2. Server-side session/cookie delete karne ke liye API call karein
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // 3. Login page par redirect karein
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
    >
      🚪 Logout
    </button>
  );
}