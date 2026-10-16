import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  // Mock ya session se fetch kiya hua user object (Aap apne auth ke mutabiq adjust kar sakte hain)
  const user = {
    name: "Admin",
    role: "SUPER_ADMIN", // ya "RESELLER" ya "USER"
    actualBalance: 0,
    virtualBalance: 0,
    walletBalance: 0,
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {user.role === "SUPER_ADMIN" && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg shadow">
            <h3 className="font-semibold text-green-800">Wallet Balance</h3>
            <p className="text-3xl font-bold text-green-600">Unlimited (∞)</p>
          </div>
        )}

        {user.role === "RESELLER" && (
          <>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow">
              <h3 className="font-semibold text-blue-800">Actual Balance</h3>
              <p className="text-3xl font-bold text-blue-600">₹{user.actualBalance}</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg shadow">
              <h3 className="font-semibold text-purple-800">Virtual Balance</h3>
              <p className="text-3xl font-bold text-purple-600">₹{user.virtualBalance}</p>
            </div>
          </>
        )}

        {user.role === "USER" && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800">Wallet Balance</h3>
            <p className="text-3xl font-bold text-gray-600">₹{user.walletBalance || user.virtualBalance}</p>
          </div>
        )}
      </div>
    </div>
  );
}