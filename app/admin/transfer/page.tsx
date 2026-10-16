"use client";

import { useState } from "react";

export default function TransferPage() {
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [balanceType, setBalanceType] = useState("VIRTUAL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
          amount: parseFloat(amount),
          balanceType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Transfer successful!");
        setReceiverId("");
        setAmount("");
      } else {
        setMessage(data.error || "Transfer failed");
      }
    } catch (err) {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-lg shadow mt-10">
      <h1 className="text-xl font-bold mb-4">Transfer Balance</h1>
      {message && <p className="mb-4 text-sm font-medium text-blue-600">{message}</p>}
      
      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Receiver ID</label>
          <input
            type="text"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Balance Type</label>
          <select
            value={balanceType}
            onChange={(e) => setBalanceType(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="VIRTUAL">Virtual Balance</option>
            <option value="ACTUAL">Actual Balance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Processing..." : "Send Transfer"}
        </button>
      </form>
    </div>
  );
}