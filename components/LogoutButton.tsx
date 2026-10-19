"use client";

export default function LogoutButton() {
  const handleLogout = () => {
    // 1. Sabhi possible cookies (`userId` aur purani `token`) ko turant expire karein
    document.cookie = "userId=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    // 2. Local & Session storage clear karein
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}

    // 3. Bina kisi delay ke direct login page par hard redirect karein
    window.location.replace("/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
    >
      🚪 Logout
    </button>
  );
}