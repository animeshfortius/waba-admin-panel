"use client";

import { useState, useEffect, Suspense } from "react";
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

  // States
  const [channels, setChannels] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);

  // Modal States
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaName, setMediaName] = useState("");
  const [mediaChannel, setMediaChannel] = useState("");

  const [showContactModal, setShowContactModal] = useState(false);
  const [showUploadContactModal, setShowUploadContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", number: "", email: "" });

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");

  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistInput, setBlacklistInput] = useState("");

  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch data on load
  useEffect(() => {
    fetch("/api/configuration/channels").then(res => res.json()).then(data => { if(Array.isArray(data)) setChannels(data); }).catch(() => {});
    fetch("/api/configuration/media").then(res => res.json()).then(data => { if(Array.isArray(data)) setMediaList(data); }).catch(() => {});
    fetch("/api/configuration/contacts").then(res => res.json()).then(data => { if(Array.isArray(data)) setContacts(data); }).catch(() => {});
    fetch("/api/configuration/groups").then(res => res.json()).then(data => { if(Array.isArray(data)) setGroups(data); }).catch(() => {});
    fetch("/api/configuration/blacklist").then(res => res.json()).then(data => { if(Array.isArray(data)) setBlacklist(data); }).catch(() => {});
  }, []);

  // Handlers
  const handleAddMedia = async () => {
    if(!mediaName) return alert("Please enter media name");
    const res = await fetch("/api/configuration/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaName, mediaUrl: `https://waba.fortius.in/media/${mediaName}`, wabaNumber: mediaChannel || "15553945963" })
    });
    if(res.ok) {
      alert("Media uploaded successfully!");
      window.location.reload();
    }
  };

  const handleAddContact = async () => {
    if(!contactForm.number) return alert("Enter mobile number");
    const res = await fetch("/api/configuration/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactForm)
    });
    if(res.ok) {
      alert("Contact saved successfully!");
      window.location.reload();
    }
  };

  const handleAddGroup = async () => {
    if(!groupName) return alert("Enter group name");
    const res = await fetch("/api/configuration/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupName, totalContacts: 0 })
    });
    if(res.ok) {
      alert("Group created successfully!");
      window.location.reload();
    }
  };

  const handleAddBlacklist = async () => {
    if(!blacklistInput) return alert("Enter number");
    const res = await fetch("/api/configuration/blacklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: blacklistInput })
    });
    if(res.ok) {
      alert("Number blacklisted successfully!");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 text-xs font-sans">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-gray-400">
            Home ›{" "}
            <span onClick={() => setActiveSection("hub")} className="cursor-pointer hover:text-emerald-600 font-medium">
              Configuration
            </span>{" "}
            {activeSection !== "hub" && `› ${activeSection.replace("_", " ").toUpperCase()}`}
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
          <button onClick={() => setActiveSection("hub")} className="border px-3.5 py-1.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 cursor-pointer shadow-sm">
            ⬅ Back to Hub
          </button>
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
              <p className="text-[11px] text-gray-400">Manage blocked numbers and Excel uploads.</p>
            </div>
          </div>
        </div>
      )}

      {activeSection === "onboarding" && (
        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6 text-center">
          <h2 className="text-lg font-bold text-gray-800">WhatsApp Coexistence</h2>
          <p className="text-xs text-gray-500">Connect your WhatsApp Business App number with Cloud API seamlessly.</p>
          <button onClick={() => setShowFacebookModal(true)} className="bg-[#1877F2] text-white font-bold px-6 py-3 rounded-xl cursor-pointer">
            Connect WhatsApp with Facebook
          </button>
        </div>
      )}

      {activeSection === "media_library" && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800">Media Library Assets</h2>
            <button onClick={() => setShowMediaModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">+ Add Media</button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-3">MEDIA NAME</th><th className="p-3">URL</th><th className="p-3">WABA NUMBER</th><th className="p-3">ACTION</th></tr>
            </thead>
            <tbody className="divide-y">
              {mediaList.map((m: any) => (
                <tr key={m.id}>
                  <td className="p-3 font-bold text-emerald-700">{m.mediaName}</td>
                  <td className="p-3 text-blue-600 font-mono">{m.mediaUrl}</td>
                  <td className="p-3 font-mono">{m.wabaNumber}</td>
                  <td className="p-3"><button onClick={async () => { await fetch(`/api/configuration/media?id=${m.id}`, { method: "DELETE" }); window.location.reload(); }} className="text-red-500 font-bold cursor-pointer">🗑️ Delete</button></td>
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
            <div className="flex gap-2">
              <button onClick={() => setShowContactModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">+ Add Contact</button>
              <button onClick={() => setShowUploadContactModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">📤 Upload Contacts</button>
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-3">MOBILE NUMBER</th><th className="p-3">PROFILE NAME</th><th className="p-3">EMAIL</th><th className="p-3">ACTION</th></tr>
            </thead>
            <tbody className="divide-y">
              {contacts.map((c: any) => (
                <tr key={c.id}>
                  <td className="p-3 font-bold font-mono">{c.number}</td>
                  <td className="p-3">{c.profileName}</td>
                  <td className="p-3 text-gray-500">{c.email}</td>
                  <td className="p-3"><button onClick={async () => { await fetch(`/api/configuration/contacts?id=${c.id}`, { method: "DELETE" }); window.location.reload(); }} className="text-red-500 font-bold cursor-pointer">🗑️ Delete</button></td>
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
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-3">GROUP NAME</th><th className="p-3">TOTAL CONTACTS</th><th className="p-3">ACTIONS (Manage, Import, Export, Edit, Delete)</th></tr>
            </thead>
            <tbody className="divide-y">
              {groups.map((g: any) => (
                <tr key={g.id}>
                  <td className="p-3 font-bold text-emerald-700">{g.groupName}</td>
                  <td className="p-3 font-semibold">{g.totalContacts}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => alert(`Managing group: ${g.groupName}`)} className="bg-slate-100 border px-2 py-1 rounded cursor-pointer">⚙️ Manage</button>
                    <button onClick={() => alert(`Importing contacts to ${g.groupName}`)} className="bg-blue-50 text-blue-600 border px-2 py-1 rounded cursor-pointer">📥 Import</button>
                    <button onClick={() => alert(`Exporting ${g.groupName} data`)} className="bg-emerald-50 text-emerald-600 border px-2 py-1 rounded cursor-pointer">📤 Export</button>
                    <button onClick={() => alert(`Editing ${g.groupName}`)} className="bg-amber-50 text-amber-600 border px-2 py-1 rounded cursor-pointer">✏️ Edit</button>
                    <button onClick={async () => { await fetch(`/api/configuration/groups?id=${g.id}`, { method: "DELETE" }); window.location.reload(); }} className="bg-red-50 text-red-600 border px-2 py-1 rounded cursor-pointer">🗑️ Delete</button>
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
            <div className="flex gap-2">
              <button onClick={() => setShowBlacklistModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">+ Block Number</button>
              <button onClick={() => alert("Upload Excel modal opened")} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">📤 Upload Excel</button>
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-3">NUMBER</th><th className="p-3">CREATED DATE</th><th className="p-3">ACTION</th></tr>
            </thead>
            <tbody className="divide-y">
              {blacklist.map((b: any) => (
                <tr key={b.id}>
                  <td className="p-3 font-bold text-red-600 font-mono">{b.number}</td>
                  <td className="p-3 text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="p-3"><button onClick={async () => { await fetch(`/api/configuration/blacklist?id=${b.id}`, { method: "DELETE" }); window.location.reload(); }} className="text-red-500 font-bold cursor-pointer">🗑️ Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Media Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-sm">Upload Media</h3>
            <select value={mediaChannel} onChange={(e) => setMediaChannel(e.target.value)} className="w-full border p-2 rounded-lg text-xs">
              <option value="">-- Select Channel --</option>
              <option value="15553945963">15553945963</option>
            </select>
            <input type="text" placeholder="Media File Name (e.g. banner.jpg)" value={mediaName} onChange={(e) => setMediaName(e.target.value)} className="w-full border p-2 rounded-lg text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowMediaModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={handleAddMedia} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3">
            <h3 className="font-bold text-sm">Add WhatsApp Contact</h3>
            <input type="text" placeholder="Contact Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="w-full border p-2 rounded-lg text-xs" />
            <input type="text" placeholder="Mobile Number" value={contactForm.number} onChange={(e) => setContactForm({ ...contactForm, number: e.target.value })} className="w-full border p-2 rounded-lg text-xs" />
            <input type="email" placeholder="Email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="w-full border p-2 rounded-lg text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowContactModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={handleAddContact} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-sm">Add Group</h3>
            <input type="text" placeholder="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full border p-2 rounded-lg text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowGroupModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={handleAddGroup} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Blacklist Modal */}
      {showBlacklistModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-sm">Block Number</h3>
            <input type="text" placeholder="Enter Mobile Number" value={blacklistInput} onChange={(e) => setBlacklistInput(e.target.value)} className="w-full border p-2 rounded-lg text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowBlacklistModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={handleAddBlacklist} className="bg-red-600 text-white px-4 py-1.5 rounded-lg font-bold">Block</button>
            </div>
          </div>
        </div>
      )}

      {showFacebookModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-gray-800">WhatsApp Coexistence Onboarding</h3>
            <p className="text-xs text-gray-500">Connecting via Meta Embedded Signup...</p>
            <button onClick={() => { setShowFacebookModal(false); alert("Coexistence Connected!"); }} className="bg-[#1877F2] text-white font-bold px-5 py-2.5 rounded-xl">
              Complete Facebook Signup
            </button>
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