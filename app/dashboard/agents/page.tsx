"use client";

import { useState, useEffect } from "react";

const ALL_COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "United States / Canada", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+7", country: "Russia / Kazakhstan", flag: "🇷🇺" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+98", country: "Iran", flag: "🇮🇷" },
  { code: "+964", country: "Iraq", flag: "🇮🇶" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+51", country: "Peru", flag: "🇵🇪" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [userIdVal, setUserIdVal] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editId) {
      const suggestedId = val.toLowerCase().replace(/\s+/g, "_");
      setUserIdVal(suggestedId);
      setEmail(`${suggestedId}@fortius.in`);
    }
  };

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !userIdVal || !email) {
      alert("Agent Name, User ID, and Email are required!");
      return;
    }

    try {
      const url = "/api/agents";
      const method = editId ? "PATCH" : "POST";
      const fullPhone = `${countryCode} ${phone}`;
      const body = editId 
        ? { agentId: editId, name, userId: userIdVal, email, phone: fullPhone, expiryDate }
        : { name, userId: userIdVal, password: password || "agent123", email, phone: fullPhone, expiryDate };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        setName(""); setUserIdVal(""); setPassword(""); setPhone(""); setEmail(""); setExpiryDate(""); setEditId(null);
        fetchAgents();
      } else {
        alert(data.error || "Failed to save agent");
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleToggle = async (agentId: string, field: string, currentValue: boolean) => {
    setAgents((prev) =>
      prev.map((ag) => (ag.id === agentId ? { ...ag, [field]: !currentValue } : ag))
    );

    try {
      await fetch("/api/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, [field]: !currentValue }),
      });
    } catch (err) {
      console.error("Failed to update permission", err);
      fetchAgents();
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      const res = await fetch(`/api/agents?id=${agentId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAgents((prev) => prev.filter((ag) => ag.id !== agentId));
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleLoginAs = async (agent: any) => {
    try {
      const res = await fetch("/api/agents/login-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("currentAgent", JSON.stringify(data.agent));
        window.location.href = "/dashboard/chat?agentMode=true";
      } else {
        alert(data.error || "Failed to login as agent");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCountries = ALL_COUNTRY_CODES.filter(
    (c) => c.country.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)
  );

  return (
    <div className="p-6 space-y-6 font-sans text-xs">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Agent List</h1>
          <p className="text-gray-400">WhatsApp &gt; Agent List</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl font-bold text-xs shadow-xs hidden sm:block">
            ⚠️ Maximum 5 agents can be created.
          </div>
          <button
            onClick={() => {
              setEditId(null);
              setName(""); setUserIdVal(""); setPassword(""); setPhone(""); setEmail(""); setExpiryDate("");
              setShowModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow"
          >
            + Add Agent
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <div className="p-4 border-b font-bold text-gray-700 text-sm">Filter Records</div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 font-bold uppercase text-[10px]">
              <th className="p-4">Name</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Registration Date</th>
              <th className="p-4">Account Expiry</th>
              <th className="p-4">Permissions & Access</th>
              <th className="p-4 text-center">Actions</th>
              <th className="p-4 text-center">Agent Tools</th>
              <th className="p-4 text-right">Login As</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">
                  {loading ? "Loading agents..." : "No agents found."}
                </td>
              </tr>
            ) : (
              agents.map((ag) => (
                <tr key={ag.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900 text-sm">
                    {ag.name}
                    <div className="text-[10px] text-gray-400 font-mono">ID: {ag.userId}</div>
                  </td>
                  <td className="p-4 text-gray-600">
                    <div>📞 {ag.phone || "N/A"}</div>
                    <div className="text-[10px] text-gray-400">✉️ {ag.email}</div>
                  </td>
                  <td className="p-4 text-gray-500">
                    {ag.createdAt ? new Date(ag.createdAt).toLocaleString() : "16 Nov 2026"}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-800">
                      {ag.expiryDate ? new Date(ag.expiryDate).toLocaleDateString() : "30/10/2026"}
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[9px]">
                      ACTIVE
                    </span>
                  </td>
                  <td className="p-4 space-y-1.5">
                    <label className="flex items-center justify-between cursor-pointer max-w-[170px] bg-gray-50 px-2.5 py-1 rounded-lg border">
                      <span className="font-medium text-gray-700">All Channels Access</span>
                      <input
                        type="checkbox"
                        checked={ag.allChannelAccess ?? true}
                        onChange={() => handleToggle(ag.id, "allChannelAccess", ag.allChannelAccess ?? true)}
                        className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer max-w-[170px] bg-gray-50 px-2.5 py-1 rounded-lg border">
                      <span className="font-medium text-gray-700">Send Templates</span>
                      <input
                        type="checkbox"
                        checked={ag.sendTemplate ?? false}
                        onChange={() => handleToggle(ag.id, "sendTemplate", ag.sendTemplate ?? false)}
                        className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer max-w-[170px] bg-gray-50 px-2.5 py-1 rounded-lg border">
                      <span className="font-medium text-gray-700">Send Campaigns</span>
                      <input
                        type="checkbox"
                        checked={ag.sendCampaign ?? false}
                        onChange={() => handleToggle(ag.id, "sendCampaign", ag.sendCampaign ?? false)}
                        className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                      />
                    </label>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditId(ag.id);
                          setName(ag.name);
                          setUserIdVal(ag.userId || "");
                          setEmail(ag.email || "");
                          setPhone(ag.phone || "");
                          setExpiryDate(ag.expiryDate ? ag.expiryDate.split("T")[0] : "");
                          setShowModal(true);
                        }}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition"
                        title="Edit Agent"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(ag.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition"
                        title="Delete Agent"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="p-1.5 bg-gray-100 rounded-lg cursor-pointer" title="Configuration">⚙️</span>
                      <span className="p-1.5 bg-gray-100 rounded-lg cursor-pointer" title="Assign Channels">👤</span>
                      <span className="p-1.5 bg-gray-100 rounded-lg cursor-pointer" title="Analytics">📊</span>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleLoginAs(ag)}
                      className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold px-3 py-1.5 rounded-xl transition cursor-pointer border border-emerald-200"
                    >
                      🔓 Login
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD AGENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">Add Agent</h3>
              <button onClick={() => setShowModal(false)} className="font-bold text-gray-400 hover:text-black cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter agent Name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">User ID (For Login)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. testagent"
                  value={userIdVal}
                  onChange={(e) => setUserIdVal(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500 font-mono text-emerald-700 font-bold"
                />
              </div>

              {!editId && (
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter the password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Number with Searchable Country Code Dropdown */}
              <div>
                <label className="block font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="flex relative">
                  <div 
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="flex items-center gap-1 bg-gray-100 border border-r-0 rounded-l-xl px-3 py-2 text-gray-700 font-medium cursor-pointer select-none min-w-[90px]"
                  >
                    <span>{ALL_COUNTRY_CODES.find(c => c.code === countryCode)?.flag || "🇮🇳"}</span>
                    <span>{countryCode}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">▼</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Enter the mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border rounded-r-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500 font-mono"
                  />

                  {/* Searchable Country Code Dropdown */}
                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-2 space-y-1">
                      <input
                        type="text"
                        placeholder="Search country or code..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 focus:outline-none focus:border-emerald-500 mb-1"
                        autoFocus
                      />
                      {filteredCountries.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setCountryCode(item.code);
                            setShowCountryDropdown(false);
                            setCountrySearch("");
                          }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 cursor-pointer text-xs rounded-lg"
                        >
                          <span>{item.flag}</span>
                          <span className="font-medium text-gray-800 truncate">{item.country}</span>
                          <span className="text-gray-400 ml-auto font-mono">{item.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">EmailId</label>
                <input
                  type="email"
                  required
                  placeholder="Enter the email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Account Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}