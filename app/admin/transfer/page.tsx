// Transfer Form JSX Example
<form onSubmit={handleTransfer} className="space-y-4">
  <div>
    <label>Select Receiver</label>
    {/* Receiver dropdown list */}
  </div>

  {/* Balance Type Dropdown (Actual ya Virtual) */}
  <div>
    <label>Balance Type</label>
    <select name="balanceType" className="border p-2 rounded w-full">
      <option value="VIRTUAL">Virtual Balance</option>
      <option value="ACTUAL">Actual Balance</option>
    </select>
  </div>

  <div>
    <label>Amount</label>
    <input type="number" name="amount" placeholder="Enter amount" className="border p-2 rounded w-full" />
  </div>

  <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full">
    Transfer Balance
  </button>
</form>