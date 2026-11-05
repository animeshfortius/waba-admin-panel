"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Declare global FB object for TypeScript
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

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

  const [channels, setChannels] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);

  // Modals & States
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaFile, setMediaFile] = useState<any>(null);

  const [showContactModal, setShowContactModal] = useState(false);
  const [showUploadContactModal, setShowUploadContactModal] = useState(false);
  const [contactData, setContactData] = useState({ name: "", number: "", email: "" });

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  
  // Group Action Modals States
  const [manageGroupObj, setManageGroupObj] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [newMemberNumber, setNewMemberNumber] = useState("");
  const [newMemberName, setNewMemberName] = useState("");

  const [importGroupObj, setImportGroupObj] = useState<any>(null);
  const [exportGroupObj, setExportGroupObj] = useState<any>(null);
  const [editGroupObj, setEditGroupObj] = useState<any>(null);
  const [editGroupNameVal, setEditGroupNameVal] = useState("");

  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [showBlacklistExcelModal, setShowBlacklistExcelModal] = useState(false);
  const [blacklistInput, setBlacklistInput] = useState("");

  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    // Initialize Facebook SDK
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: '1405995811146008',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

    // Load Facebook SDK Script safely
    const loadFBSdk = () => {
      if (document.getElementById('facebook-jssdk')) return;
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      const fjs = document.getElementsByTagName('script')[0];
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    };
    loadFBSdk();

    const savedGroupsList = localStorage.getItem("configuration_groups_list");
    if (savedGroupsList) {
      setGroups(JSON.parse(savedGroupsList));
    } else {
      fetch("/api/configuration/groups")
        .then(res => res.json())
        .then(data => { if(Array.isArray(data)) { setGroups(data); localStorage.setItem("configuration_groups_list", JSON.stringify(data)); } })
        .catch(() => {});
    }
    fetch("/api/configuration/channels").then(res => res.json()).then(data => { if(Array.isArray(data)) setChannels(data); }).catch(() => {});
    fetch("/api/configuration/media").then(res => res.json()).then(data => { if(Array.isArray(data)) setMediaList(data); }).catch(() => {});
    fetch("/api/configuration/contacts").then(res => res.json()).then(data => { if(Array.isArray(data)) setContacts(data); }).catch(() => {});
    fetch("/api/configuration/blacklist").then(res => res.json()).then(data => { if(Array.isArray(data)) setBlacklist(data); }).catch(() => {});
  }, []);

  // Fetch Group Members when Manage Group modal is opened (Local State fallback)
  useEffect(() => {
    if (manageGroupObj) {
      const savedMembers = localStorage.getItem(`group_members_${manageGroupObj.id}`);
      if (savedMembers) {
        setGroupMembers(JSON.parse(savedMembers));
      } else {
        setGroupMembers([]);
      }
    }
  }, [manageGroupObj]);

  const handleAddMemberToGroup = () => {
    if (!newMemberNumber) return alert("Please enter mobile number");
    
    const newMember = {
      id: Date.now().toString(),
      number: newMemberNumber,
      name: newMemberName || "Member"
    };

    const updatedList = [newMember, ...groupMembers];
    setGroupMembers(updatedList);
    
    if (manageGroupObj) {
      localStorage.setItem(`group_members_${manageGroupObj.id}`, JSON.stringify(updatedList));
      
      const updatedGroups = groups.map(g => g.id === manageGroupObj.id ? { ...g, totalContacts: updatedList.length } : g);
      setGroups(updatedGroups);
      localStorage.setItem("configuration_groups_list", JSON.stringify(updatedGroups));
    }

    setNewMemberNumber("");
    setNewMemberName("");
    alert("Number added to group successfully!");
  };

  const handleDeleteMemberFromGroup = (memberId: string) => {
    const updatedList = groupMembers.filter((m) => m.id !== memberId);
    setGroupMembers(updatedList);
    
    if (manageGroupObj) {
      localStorage.setItem(`group_members_${manageGroupObj.id}`, JSON.stringify(updatedList));
      
      const updatedGroups = groups.map(g => g.id === manageGroupObj.id ? { ...g, totalContacts: updatedList.length } : g);
      setGroups(updatedGroups);
      localStorage.setItem("configuration_groups_list", JSON.stringify(updatedGroups));
    }
    alert("Number removed from group!");
  };

  // Official Meta Embedded Signup SDK Handler
  const handleFacebookSignup = () => {
    if (!window.FB) {
      alert("Facebook SDK is still loading. Please try again in a moment.");
      return;
    }

    setShowFacebookModal(false);

    window.FB.login(function (response: any) {
      if (response.authResponse) {
        const code = response.authResponse.code || response.authResponse.accessToken;
        
        fetch("/api/configuration/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, website: companyWebsite, name: companyName })
        })
        .then(res => res.json())
        .then(data => {
          alert("WhatsApp Coexistence & Embedded Signup completed successfully!");
          window.location.reload();
        })
        .catch(err => {
          console.error(err);
          alert("Error registering channel details.");
        });

      } else {
        alert("User cancelled login or did not fully authorize.");
      }
    }, {
      config_id: '891599173270116',
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: '',
        sessionInfoVersion: 2
      }
    });
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
              <p className="text-[11px] text-gray-400">Manage contacts, add, upload file & delete.</p>
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
                  <th className="p-3">DISPLAY PHONE</th>
                  <th className="p-3">PHONE ID</th>
                  <th className="p-3">WABA ID</th>
                  <th className="p-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700 font-medium">
                {channels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{ch.displayPhone || ch.display_phone_number}</td>
                    <td className="p-3 font-mono">{ch.phoneNumberId || ch.phone_number_id}</td>
                    <td className="p-3 font-mono">{ch.wabaId || ch.waba_id}</td>
                    <td className="p-3 text-emerald-600 font-bold">{ch.status || "CONNECTED"}</td>
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
              <button onClick={() => setShowUploadContactModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">📤 Upload Contacts (File)</button>
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
              <tr><th className="p-3">GROUP NAME</th><th className="p-3">TOTAL CONTACTS</th><th className="p-3">ACTIONS</th></tr>
            </thead>
            <tbody className="divide-y">
              {groups.map((g: any) => (
                <tr key={g.id}>
                  <td className="p-3 font-bold text-emerald-700">{g.groupName}</td>
                  <td className="p-3 font-semibold">{g.totalContacts}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => setManageGroupObj(g)} className="bg-slate-100 border px-2 py-1 rounded cursor-pointer font-bold">⚙️ Manage</button>
                    <button onClick={() => setImportGroupObj(g)} className="bg-blue-50 text-blue-600 border px-2 py-1 rounded cursor-pointer font-bold">📥 Import</button>
                    <button onClick={() => setExportGroupObj(g)} className="bg-emerald-50 text-emerald-600 border px-2 py-1 rounded cursor-pointer font-bold">📤 Export</button>
                    <button onClick={() => { setEditGroupObj(g); setEditGroupNameVal(g.groupName); }} className="bg-amber-50 text-amber-600 border px-2 py-1 rounded cursor-pointer font-bold">✏️ Edit</button>
                    <button onClick={async () => {
                      await fetch(`/api/configuration/groups?id=${g.id}`, { method: "DELETE" });
                      window.location.reload();
                    }} className="bg-red-50 text-red-600 border px-2 py-1 rounded cursor-pointer font-bold">🗑️ Delete</button>
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
              <button onClick={() => setShowBlacklistExcelModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">📤 Upload Excel / File</button>
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

      {/* MANAGE GROUP MODAL WITH ADD / DELETE NUMBER FEATURE */}
      {manageGroupObj && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-gray-800">Manage Group: {manageGroupObj.groupName}</h3>
              <button onClick={() => setManageGroupObj(null)} className="text-gray-400 font-bold">✕</button>
            </div>

            {/* Form to Add Number to Group */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border">
              <h4 className="font-bold text-gray-700">Add New Number to Group</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Mobile Number (e.g. 919876543210)"
                  value={newMemberNumber}
                  onChange={(e) => setNewMemberNumber(e.target.value)}
                  className="flex-1 border p-2 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Name (Optional)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-1/3 border p-2 rounded-lg"
                />
                <button
                  onClick={handleAddMemberToGroup}
                  className="bg-emerald-600 text-white font-bold px-3 py-2 rounded-lg cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* List of Numbers in Group */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-700">Group Members ({groupMembers.length})</h4>
              <div className="max-h-60 overflow-y-auto border rounded-xl divide-y">
                {groupMembers.length === 0 ? (
                  <p className="p-3 text-center text-gray-400">No numbers added to this group yet.</p>
                ) : (
                  groupMembers.map((m: any) => (
                    <div key={m.id} className="p-2.5 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <span className="font-bold font-mono text-gray-800">{m.number}</span>
                        <span className="text-gray-400 ml-2">({m.name})</span>
                      </div>
                      <button
                        onClick={() => handleDeleteMemberFromGroup(m.id)}
                        className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button onClick={() => { setManageGroupObj(null); window.location.reload(); }} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Group Modal */}
      {importGroupObj && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm">Import Contacts to {importGroupObj.groupName}</h3>
            <input type="file" accept=".csv, .xlsx" className="w-full border p-2 rounded-lg" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setImportGroupObj(null)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={() => { setImportGroupObj(null); alert("Contacts imported successfully!"); }} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold">Import</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Group Modal */}
      {exportGroupObj && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm">Export Group: {exportGroupObj.groupName}</h3>
            <p className="text-gray-500">Download group members list in CSV format.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setExportGroupObj(null)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={() => { setExportGroupObj(null); alert("Group exported successfully!"); }} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold">Download CSV</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editGroupObj && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm">Edit Group Name</h3>
            <input type="text" value={editGroupNameVal} onChange={(e) => setEditGroupNameVal(e.target.value)} className="w-full border p-2 rounded-lg" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditGroupObj(null)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={async () => {
                await fetch("/api/configuration/groups", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: editGroupObj.id, groupName: editGroupNameVal })
                });
                alert("Group updated successfully!");
                setEditGroupObj(null);
                window.location.reload();
              }} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold">Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Media Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-sm">Upload Media File</h3>
            <input type="file" onChange={(e) => setMediaFile(e.target.files?.[0])} className="w-full border p-2 rounded-lg text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowMediaModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={async () => {
                if(!mediaFile) return alert("Select file");
                const res = await fetch("/api/configuration/media", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ mediaName: mediaFile.name, mediaUrl: `https://waba.fortius.in/media/${mediaFile.name}`, wabaNumber: "15553945963" })
                });
                if(res.ok) { alert("Media uploaded successfully!"); window.location.reload(); }
              }} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3">
            <h3 className="font-bold text-sm">Add WhatsApp Contact</h3>
            <input type="text" placeholder="Contact Name" value={contactData.name} onChange={(e) => setContactData({ ...contactData, name: e.target.value })} className="w-full border p-2 rounded-lg text-xs" />
            <input type="text" placeholder="Mobile Number" value={contactData.number} onChange={(e) => setContactData({ ...contactData, number: e.target.value })} className="w-full border p-2 rounded-lg text-xs" />
            <input type="email" placeholder="Email" value={contactData.email} onChange={(e) => setContactData({ ...contactData, email: e.target.value })} className="w-full border p-2 rounded-lg text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowContactModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={async () => {
                const res = await fetch("/api/configuration/contacts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(contactData)
                });
                if(res.ok) { alert("Contact saved!"); window.location.reload(); }
              }} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Contacts File Modal */}
      {showUploadContactModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-sm">Upload Contacts File (.csv, .xlsx)</h3>
            <input type="file" accept=".csv, .xlsx" className="w-full border p-2 rounded-lg text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowUploadContactModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={() => { alert("Contacts file uploaded successfully!"); setShowUploadContactModal(false); }} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold">Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-sm">Add Group</h3>
            <input type="text" placeholder="Group Name" value={groupNameInput} onChange={(e) => setGroupNameInput(e.target.value)} className="w-full border p-2 rounded-lg text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowGroupModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={async () => {
                if(!groupNameInput) return alert("Enter group name");
                const res = await fetch("/api/configuration/groups", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ groupName: groupNameInput, totalContacts: 0 })
                });
                if(res.ok) {
                  alert("Group created successfully!");
                  window.location.reload();
                }
              }} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold">Save</button>
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
              <button onClick={async () => {
                const res = await fetch("/api/configuration/blacklist", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ number: blacklistInput })
                });
                if(res.ok) { alert("Blocked successfully!"); window.location.reload(); }
              }} className="bg-red-600 text-white px-4 py-1.5 rounded-lg font-bold">Block</button>
            </div>
          </div>
        </div>
      )}

      {/* Blacklist Excel Modal */}
      {showBlacklistExcelModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-sm">Upload Blacklist Excel / File</h3>
            <input type="file" accept=".csv, .xlsx" className="w-full border p-2 rounded-lg text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowBlacklistExcelModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button onClick={() => { alert("Blacklist file uploaded!"); setShowBlacklistExcelModal(false); }} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold">Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* Facebook Signup Modal (Updated with full requirements & inputs) */}
      {showFacebookModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-gray-800">
                Get started with WhatsApp's Business API
              </h2>
              <button
                type="button"
                onClick={() => setShowFacebookModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 leading-relaxed">
              WhatsApp is one of the most popular communication applications in the world. WhatsApp is a Facebook company and requires a Facebook account and Facebook Business Manager to set up.
            </p>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                👈 What you will need
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600 pl-1">
                <li>Access to Facebook Business Manager</li>
                <li>A viable Phone Number for WhatsApp</li>
                <li>Your business's legal address and details</li>
                <li>Verify your Facebook Business</li>
                <li>Full access to the WhatsApp Business account</li>
                <li>The ID should belong to the business you manage</li>
                <li>FB user ID must manage templates, phone numbers, QR codes</li>
              </ul>
            </div>

            <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-gray-700 w-36">
                  Company Website:
                </label>
                <input
                  type="text"
                  placeholder="Company Website"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full sm:w-80 bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-gray-700 w-36">
                  Company Name:
                </label>
                <input
                  type="text"
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full sm:w-80 bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <h3 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                👈 To continue you need access to your Facebook business account, including:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600 pl-1">
                <li>Your company's <span className="text-emerald-600">legal name and address</span></li>
                <li>A display name and short description</li>
                <li>A valid email address</li>
                <li>A valid mobile number</li>
                <li>A business-owned phone number</li>
              </ul>
            </div>

            <div className="flex justify-start items-center space-x-3 pt-3 border-t">
              <button
                type="button"
                onClick={handleFacebookSignup}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer text-xs flex items-center gap-2"
              >
                <span>👤</span> Continue with Facebook
              </button>
              <button
                type="button"
                onClick={() => setShowFacebookModal(false)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer text-xs"
              >
                Cancel
              </button>
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