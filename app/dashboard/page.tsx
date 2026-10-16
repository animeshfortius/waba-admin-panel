// Example Dashboard Balance Display Logic
{user.role === "SUPER_ADMIN" && (
  <div className="card">
    <h3>Wallet Balance</h3>
    <p className="text-2xl font-bold text-green-600">Unlimited (∞)</p>
  </div>
)}

{user.role === "RESELLER" && (
  <div className="grid grid-cols-2 gap-4">
    <div className="card">
      <h3>Actual Balance</h3>
      <p className="text-2xl font-bold">₹{user.actualBalance}</p>
    </div>
    <div className="card">
      <h3>Virtual Balance</h3>
      <p className="text-2xl font-bold">₹{user.virtualBalance}</p>
    </div>
  </div>
)}

{user.role === "USER" && (
  <div className="card">
    <h3>Wallet Balance</h3>
    <p className="text-2xl font-bold">₹{user.virtualBalance}</p> {/* ya walletBalance */}
  </div>
)}