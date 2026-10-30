"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ConfigContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("tab") || "hub";

  const setActiveSection = (section: string) => {
    if (section === "hub") {
      router.push("/dashboard/configuration");
    } else {
      router.push(`/dashboard/configuration?tab=${section}`);
    }
  };

  const [channels, setChannels] = useState([
    {
      id: 1,
      wabaNumber: "17114127744",
      phoneNumberId: "1403660482826321",
      wabaBusinessId: "1415443266878597",
      bspName: "BSP-3",
      messagingLimit: "2000 | TIER_250",
      qualityRating: "HIGH | VERIFIED",
      default: true,
      displayName: "Arvind Seth",
      configDate: "19 Oct 2026 11:32:15 AM",
      webhookUrl: "NA",
    },
  ]);

  const [mediaList, setMediaList] = useState([
    { id: 1, media: "diwali_banner.jpg", url: "https://waba.fortius.in/media/diwali.jpg", wabaNumber: "15553945963", date: "12-Oct-2026" }
  ]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaFile, setMediaFile] = useState<any>(null);

  const [contacts, setContacts] = useState([
    { id: 1, number: "919876543210", profileName: "Rahul Sharma", email: "rahul@gmail.com", contactName: "Rahul" }
  ]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactData, setContactData] = useState({ name: "", number: "", email: "" });

  const [groups, setGroups] = useState([
    { id: 1, name: "VIP Broadcast Group", totalContacts: 45 }
  ]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");

  const [blacklist, setBlacklist] = useState([
    { id: 1, number: "919999888777", date: "10-Oct-2026" }
  ]);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistInput, setBlacklistInput] = useState("");

  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFacebookSignup = async () => {
    setIsProcessing(true);
    try {
      // Call backend API to save WabaAccount to PostgreSQL database[cite: 1]
      const res = await fetch("/api/configuration/meta-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "meta_auth_code_mock", companyName })
      });
      const data = await res.json();
      if (res.ok) {
        alert("WhatsApp Channel & Coexistence registered & saved to database successfully! 🚀");
        window.location.reload();
      }
    } catch (err) {
      alert("Error connecting channel");
    } finally {
      setIsProcessing(false);
      setShowFacebookModal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 text-xs font-sans">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-gray-400">
            Home › <span onClick={() => setActiveSection("hub")} className="cursor-pointer hover:text-emerald-600 font-medium">Configuration</span> {activeSection !== "hub" && `› ${activeSection.replace("_", " ").toUpperCase()}`}
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {activeSection === "hub" && "Configuration"}
            {activeSection === "waba_channels" && "WABA Channels"}
            {activeSection === "onboarding" && "WhatsApp Coexistence Onboarding"}
            {activeSection === "media_library" && "Media Library"}
            {activeSection === "contacts" && "WhatsApp Contacts"}
            {activeSection === "groups" && "Group List"}
            {activeSection === "blacklist" && "Blacklisted Numbers"}
          </h1>
        </div>
        {activeSection !== "hub" && (
          <button onClick={() => setActiveSection("hub")} className="border px-3.5 py-1.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 cursor-pointer shadow-sm">⬅ Back to Hub</button>
        )}
      </div>

      {activeSection === "hub" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div onClick={() => setActiveSection("waba_channels")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
              <div className="text-3xl">📡</div>
              <h3 className="font-bold text-sm text-gray-800">Waba Channels</h3>
              <p className="text-[11px] text-gray-400">Manage WABA Channels.</p>
            </div>
            <div onClick={() => setActiveSection("onboarding")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
              <div className="text-3xl">💻</div>
              <h3 className="font-bold text-sm text-gray-800">WhatsApp Coexistence Onboarding</h3>
              <p className="text-[11px] text-gray-400">Onboard WhatsApp Business App users.</p>
            </div>
            <div onClick={() => setActiveSection("media_library")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
              <div className="text-3xl">📼</div>
              <h3 className="font-bold text-sm text-gray-800">Media Library</h3>
              <p className="text-[11px] text-gray-400">Browse and manage media assets.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3">
            <div onClick={() => setActiveSection("contacts")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
              <div className="text-3xl">📱</div>
              <h3 className="font-bold text-sm text-gray-800">WhatsApp Contacts</h3>
              <p className="text-[11px] text-gray-400">Manage contacts, add, upload & delete.</p>
            </div>
            <div onClick={() => setActiveSection("groups")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
              <div className="text-3xl">📲</div>
              <h3 className="font-bold text-sm text-gray-800">Manage Group</h3>
              <p className="text-[11px] text-gray-400">Manage, Import, Export, Edit, Delete groups.</p>
            </div>
            <div onClick={() => setActiveSection("blacklist")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
              <div className="text-3xl">🖥️</div>
              <h3 className="font-bold text-sm text-gray-800">Blacklist Numbers</h3>
              <p className="text-[11px] text-gray-400">Manage blocked numbers.</p>
            </div>
          </div>
        </div>
      )}

      {activeSection === "waba_channels" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <button onClick={() => setShowFacebookModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer">
              + Register New WhatsApp
            </button>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b uppercase text-[11px]">
                  <th className="p-3">WABA NUMBER</th>
                  <th className="p-3">PHONENUMBER ID</th>
                  <th className="p-3">WABA BUSINESSID</th>
                  <th className="p-3">BSP NAME</th>
                  <th className="p-3">MESSAGING LIMIT</th>
                  <th className="p-3">QUALITY RATING</th>
                  <th className="p-3 text-center">DEFAULT</th>
                  <th className="p-3">DISPLAY NAME</th>
                  <th className="p-3">CONFIGUREDATE</th>
                  <th className="p-3">WEBHOOK URL</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700 font-medium">
                {channels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{ch.wabaNumber}</td>
                    <td className="p-3 font-mono">{ch.phoneNumberId}</td>
                    <td className="p-3 font-mono">{ch.wabaBusinessId}</td>
                    <td className="p-3 font-semibold">{ch.bspName}</td>
                    <td className="p-3"><span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">{ch.messagingLimit}</span></td>
                    <td className="p-3 text-emerald-600 font-bold">✓ {ch.qualityRating}</td>
                    <td className="p-3 text-center"><input type="radio" defaultChecked={ch.default} name="defaultChannel" /></td>
                    <td className="p-3 font-semibold">{ch.displayName}</td>
                    <td className="p-3 text-gray-500">{ch.configDate}</td>
                    <td className="p-3 font-mono text-emerald-600">{ch.webhookUrl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === "onboarding" && (
        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6 text-center">
          <h2 className="text-lg font-bold text-gray-800">WhatsApp Coexistence Onboarding</h2>
          <p className="text-xs text-gray-500">Connect your existing WhatsApp Business App number with Cloud API instantly via Facebook Embedded Signup.</p>
          <button onClick={() => setShowFacebookModal(true)} className="bg-[#1877F2] text-white font-bold px-6 py-3 rounded-xl cursor-pointer">
            Connect WhatsApp with Facebook
          </button>
        </div>
      )}

      {activeSection === "media_library" && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800">Media Library</h2>
            <button onClick={() => setShowMediaModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">+ Add Media</button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b font-bold">
              <tr><th className="p-3">MEDIA</th><th className="p-3">URL</th><th className="p-3">WABA NUMBER</th><th className="p-3">DATE</th><th className="p-3">ACTION</th></tr>
            </thead>
            <tbody className="divide-y">
              {mediaList.map((m) => (
                <tr key={m.id}>
                  <td className="p-3 font-bold text-emerald-700">{m.media}</td>
                  <td className="p-3 text-blue-600 font-mono">{m.url}</td>
                  <td className="p-3 font-mono">{m.wabaNumber}</td>
                  <td className="p-3 text-gray-500">{m.date}</td>
                  <td className="p-3"><button onClick={() => setMediaList(mediaList.filter(item => item.id !== m.id))} className="text-red-500 font-bold cursor-pointer">🗑️ Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "contacts" && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800">WhatsApp Contacts</h2>
            <button onClick={() => setShowContactModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">+ Add Contact</button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b font-bold">
              <tr><th className="p-3">MOBILE NUMBER</th><th className="p-3">PROFILE NAME</th><th className="p-3">EMAIL ID</th><th className="p-3">CONTACT NAME</th><th className="p-3">ACTION</th></tr>
            </thead>
            <tbody className="divide-y">
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td className="p-3 font-bold font-mono">{c.number}</td>
                  <td className="p-3">{c.profileName}</td>
                  <td className="p-3 text-gray-500">{c.email}</td>
                  <td className="p-3 font-semibold">{c.contactName}</td>
                  <td className="p-3"><button onClick={() => setContacts(contacts.filter(item => item.id !== c.id))} className="text-red-500 font-bold cursor-pointer">🗑️ Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "groups" && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800">Group List</h2>
            <button onClick={() => setShowGroupModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">+ Add Group</button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b font-bold">
              <tr><th className="p-3">GROUP NAME</th><th className="p-3">TOTAL CONTACTS</th><th className="p-3">ACTIONS</th></tr>
            </thead>
            <tbody className="divide-y">
              {groups.map((g) => (
                <tr key={g.id}>
                  <td className="p-3 font-bold text-emerald-700">{g.name}</td>
                  <td className="p-3 font-semibold">{g.totalContacts}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => alert(`Manage group: ${g.name}`)} className="bg-slate-100 border px-2 py-1 rounded cursor-pointer font-bold">⚙️ Manage</button>
                    <button onClick={() => alert(`Import contacts to ${g.name}`)} className="bg-blue-50 text-blue-600 border px-2 py-1 rounded cursor-pointer font-bold">📥 Import</button>
                    <button onClick={() => alert(`Export ${g.name}`)} className="bg-emerald-50 text-emerald-600 border px-2 py-1 rounded cursor-pointer font-bold">📤 Export</button>
                    <button onClick={() => { const newName = window.prompt("Edit Group Name:", g.name); if(newName) setGroups(groups.map(item => item.id === g.id ? {...item, name: newName} : item)); }} className="bg-amber-50 text-amber-600 border px-2 py-1 rounded cursor-pointer font-bold">✏️ Edit</button>
                    <button onClick={() => setGroups(groups.filter(item => item.id !== g.id))} className="bg-red-50 text-red-600 border px-2 py-1 rounded cursor-pointer font-bold">🗑️ Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "blacklist" && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800">Blacklisted Numbers</h2>
            <button onClick={() => setShowBlacklistModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">+ Block Number</button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b font-bold">
              <tr><th className="p-3">NUMBER</th><th className="p-3">CREATED DATE</th><th className="p-3">ACTION</th></tr>
            </thead>
            <tbody className="divide-y">
              {blacklist.map((b) => (
                <tr key={b.id}>
                  <td className="p-3 font-bold text-red-600 font-mono">{b.number}</td>
                  <td className="p-3 text-gray-500">{b.date}</td>
                  <td className="p-3"><button onClick={() => setBlacklist(blacklist.filter(item => item.id !== b.id))} className="text-red-500 font-bold cursor-pointer">🗑️ Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Facebook Signup Modal (Meta Embedded & Coexistence) */}
      {showFacebookModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-800">Get started with WhatsApp's Business API</h3>
              <button onClick={() => setShowFacebookModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-gray-500 text-[11px]">Connect via Meta Embedded Signup. This will register your number or migrate your Coexistence WhatsApp Business App to Cloud API.</p>
              <label className="block font-semibold text-gray-600">Company Name</label>
              <input type="text" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50" />
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button onClick={() => setShowFacebookModal(false)} className="px-4 py-2 border rounded-lg font-semibold">Cancel</button>
              <button onClick={handleFacebookSignup} disabled={isProcessing} className="bg-[#1877F2] text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer">
                {isProcessing ? "Connecting to Meta..." : "Continue with Facebook"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Upload Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-gray-800">Upload Media</h3>
            <input type="file" onChange={(e) => setMediaFile(e.target.files?.[0])} className="w-full border p-2 rounded-lg" />
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setShowMediaModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={() => { if(mediaFile) { setMediaList([...mediaList, { id: mediaList.length+1, media: mediaFile.name, url: `https://waba.fortius.in/media/${mediaFile.name}`, wabaNumber: "15553945963", date: new Date().toLocaleDateString() }]); setShowMediaModal(false); alert("Media uploaded!"); } }} className="bg-emerald-600 text-white font-bold px-4 py-1.5 rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-gray-800">Add WhatsApp Contact</h3>
            <input type="text" placeholder="Contact Name" value={contactData.name} onChange={(e) => setContactData({...contactData, name: e.target.value})} className="w-full border p-2 rounded-lg" />
            <input type="text" placeholder="Mobile Number" value={contactData.number} onChange={(e) => setContactData({...contactData, number: e.target.value})} className="w-full border p-2 rounded-lg" />
            <input type="email" placeholder="Email" value={contactData.email} onChange={(e) => setContactData({...contactData, email: e.target.value})} className="w-full border p-2 rounded-lg" />
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setShowContactModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={() => { if(contactData.number) { setContacts([...contacts, { id: contacts.length+1, number: contactData.number, profileName: contactData.name, email: contactData.email, contactName: contactData.name }]); setShowContactModal(false); setContactData({name:"", number:"", email:""}); alert("Contact added!"); } }} className="bg-emerald-600 text-white font-bold px-4 py-1.5 rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-gray-800">Add Group</h3>
            <input type="text" placeholder="Enter Group Name" value={groupNameInput} onChange={(e) => setGroupNameInput(e.target.value)} className="w-full border p-2 rounded-lg" />
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setShowGroupModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={() => { if(groupNameInput) { setGroups([...groups, { id: groups.length+1, name: groupNameInput, totalContacts: 0 }]); setShowGroupModal(false); setGroupNameInput(""); alert("Group created!"); } }} className="bg-emerald-600 text-white font-bold px-4 py-1.5 rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Blacklist Modal */}
      {showBlacklistModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-gray-800">Block Number</h3>
            <input type="text" placeholder="Enter Mobile Number" value={blacklistInput} onChange={(e) => setBlacklistInput(e.target.value)} className="w-full border p-2 rounded-lg" />
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setShowBlacklistModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={() => { if(blacklistInput) { setBlacklist([...blacklist, { id: blacklist.length+1, number: blacklistInput, date: new Date().toLocaleDateString() }]); setShowBlacklistModal(false); setBlacklistInput(""); alert("Number blacklisted!"); } }} className="bg-red-600 text-white font-bold px-4 py-1.5 rounded-lg">Block</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfigPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading Configuration...</div>}>
      <ConfigContent />
    </Suspense>
  );
}