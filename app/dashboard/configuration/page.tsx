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
      wabaNumber: "15553945963",
      phoneNumberId: "1384456657081014",
      wabaBusinessId: "28402710282733872",
      bspName: "BSP-3",
      messagingLimit: "2000 | TIER_250",
      qualityRating: "HIGH | VERIFIED",
      default: true,
      displayName: "Active-08",
      configDate: "06 Oct 2026 11:53:57 AM",
      webhookUrl: "NA",
      authEnabled: false,
      webhookType: "Default",
    },
  ]);

  // Interactive State Lists for all menus
  const [mediaList, setMediaList] = useState([
    { id: 1, media: "diwali_offer.jpg", url: "https://waba.fortius.in/media/diwali_offer.jpg", wabaNumber: "15553945963", configDate: "12-Oct-2026" },
  ]);
  const [newMediaName, setNewMediaName] = useState("");

  const [contacts, setContacts] = useState([
    { id: 1, number: "919876543210", profileName: "Rahul Sharma", email: "rahul@gmail.com", contactName: "Rahul" },
  ]);
  const [newContactNumber, setNewContactNumber] = useState("");
  const [newContactName, setNewContactName] = useState("");

  const [groups, setGroups] = useState([
    { id: 1, name: "VIP Broadcast Group", totalContacts: 45 },
  ]);
  const [newGroupName, setNewGroupName] = useState("");

  const [blacklist, setBlacklist] = useState([
    { id: 1, number: "919999888777", createdDate: "10-Oct-2026" },
  ]);
  const [newBlacklistNumber, setNewBlacklistNumber] = useState("");

  const [unsubscribers, setUnsubscribers] = useState([
    { id: 1, number: "919000011111", wabaNumber: "15553945963", unsubscribedOn: "11-Oct-2026", messageText: "STOP" }
  ]);

  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookInput, setWebhookInput] = useState("");
  const [enableAuth, setEnableAuth] = useState(false);
  const [webhookType, setWebhookType] = useState("Default");

  const [profileData, setProfileData] = useState({
    displayName: "Active-08",
    category: "Professional Services",
    description: "Professional Business Communication Solutions • WhatsApp Business API",
    email: "info@fortiusinfocom.com",
    channelNumber: "15553945963",
    address: "Lucknow, UP, India",
    website: "https://www.fortiusinfocom.com/",
    profileImage: null as string | null,
  });

  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const openWebhookModal = (channel: any) => {
    setSelectedChannel(channel);
    setWebhookInput(channel.webhookUrl === "NA" ? "" : channel.webhookUrl);
    setEnableAuth(channel.authEnabled || false);
    setWebhookType(channel.webhookType || "Default");
    setShowWebhookModal(true);
  };

  const handleSaveWebhook = () => {
    if (selectedChannel) {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === selectedChannel.id
            ? { ...ch, webhookUrl: webhookInput.trim() === "" ? "NA" : webhookInput, authEnabled: enableAuth, webhookType }
            : ch
        )
      );
    }
    setShowWebhookModal(false);
    alert("Webhook updated successfully!");
  };

  const openBusinessProfile = (channel: any) => {
    setSelectedChannel(channel);
    setActiveSection("business_profile");
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileData((prev) => ({ ...prev, profileImage: imageUrl }));
      alert(`Image "${file.name}" selected successfully!`);
    }
  };

  const handleSaveProfile = () => {
    alert("Business Profile details updated successfully!");
    setActiveSection("waba_channels");
  };

  const handleFacebookSignup = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowFacebookModal(false);
      setChannels((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          wabaNumber: "15557890123",
          phoneNumberId: "1384456657089999",
          wabaBusinessId: "28402710282711111",
          bspName: "BSP-3",
          messagingLimit: "2000 | TIER_250",
          qualityRating: "HIGH | VERIFIED",
          default: false,
          displayName: companyName || "New Channel",
          configDate: new Date().toLocaleString(),
          webhookUrl: "NA",
          authEnabled: false,
          webhookType: "Default",
        },
      ]);
      alert("WhatsApp channel connected successfully!");
      setActiveSection("waba_channels");
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-xs text-gray-400">
            Home ›{" "}
            <span onClick={() => setActiveSection("hub")} className="cursor-pointer hover:text-emerald-600 font-medium">
              Configuration
            </span>{" "}
            {activeSection !== "hub" && `› ${activeSection.replace("_", " ").toUpperCase()}`}
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {activeSection === "hub" && "Configuration"}
            {activeSection === "waba_channels" && "WABA Channels"}
            {activeSection === "business_profile" && "Personal Info"}
            {activeSection === "onboarding" && "Coexistence Onboarding"}
            {activeSection === "media_library" && "Media Library"}
            {activeSection === "contacts" && "WhatsApp Contact"}
            {activeSection === "unsubscribe" && "Unsubscriber Number List"}
            {activeSection === "groups" && "Group List"}
            {activeSection === "blacklist" && "Blacklisted Numbers"}
          </h1>
        </div>

        {activeSection !== "hub" && (
          <button
            onClick={() => setActiveSection("hub")}
            className="border px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <span>⬅</span>
            <span>Back to Hub</span>
          </button>
        )}
      </div>

      {activeSection === "hub" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Channel & Templates Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div onClick={() => setActiveSection("waba_channels")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
                <div className="text-3xl">📡</div>
                <h3 className="font-bold text-sm text-gray-800">Waba Channels</h3>
                <p className="text-[11px] text-gray-400">Easily Connect and manage WABA Channels.</p>
              </div>
              <div onClick={() => setActiveSection("onboarding")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
                <div className="text-3xl">💻</div>
                <h3 className="font-bold text-sm text-gray-800">Coexistence Onboarding</h3>
                <p className="text-[11px] text-gray-400">Onboard WhatsApp Business App users.</p>
              </div>
              <div onClick={() => setActiveSection("media_library")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
                <div className="text-3xl">📼</div>
                <h3 className="font-bold text-sm text-gray-800">Media Library</h3>
                <p className="text-[11px] text-gray-400">Browse and manage media assets.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Contact Manager</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div onClick={() => setActiveSection("contacts")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
                <div className="text-3xl">📱</div>
                <h3 className="font-bold text-sm text-gray-800">WhatsApp Contact</h3>
                <p className="text-[11px] text-gray-400">Manage your Contacts.</p>
              </div>
              <div onClick={() => setActiveSection("unsubscribe")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
                <div className="text-3xl">📗</div>
                <h3 className="font-bold text-sm text-gray-800">Unsubscriber Number List</h3>
                <p className="text-[11px] text-gray-400">View opted-out numbers.</p>
              </div>
              <div onClick={() => setActiveSection("groups")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
                <div className="text-3xl">📲</div>
                <h3 className="font-bold text-sm text-gray-800">Manage Group</h3>
                <p className="text-[11px] text-gray-400">Easily manage your groups here.</p>
              </div>
              <div onClick={() => setActiveSection("blacklist")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
                <div className="text-3xl">🖥️</div>
                <h3 className="font-bold text-sm text-gray-800">Blacklist Numbers</h3>
                <p className="text-[11px] text-gray-400">Manage blocked numbers.</p>
              </div>
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
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b font-bold">
                <tr>
                  <th className="p-3">WABA NUMBER</th>
                  <th className="p-3">PHONE ID</th>
                  <th className="p-3">BSP</th>
                  <th className="p-3">LIMIT</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">WEBHOOK URL</th>
                  <th className="p-3 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {channels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{ch.wabaNumber}</td>
                    <td className="p-3 font-mono">{ch.phoneNumberId}</td>
                    <td className="p-3">{ch.bspName}</td>
                    <td className="p-3">{ch.messagingLimit}</td>
                    <td className="p-3 text-emerald-600 font-bold">{ch.qualityRating}</td>
                    <td className="p-3">
                      <button onClick={() => openWebhookModal(ch)} className="text-emerald-600 underline font-mono cursor-pointer">{ch.webhookUrl}</button>
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => openBusinessProfile(ch)} className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-3 py-1 rounded-lg font-bold cursor-pointer">💼 Profile</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === "media_library" && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800">Media Library Assets</h2>
            <div className="flex gap-2">
              <input type="text" placeholder="Media Name" value={newMediaName} onChange={(e) => setNewMediaName(e.target.value)} className="border px-3 py-1.5 rounded-lg text-xs" />
              <button onClick={() => { if(newMediaName){ setMediaList([...mediaList, { id: mediaList.length+1, media: newMediaName, url: `https://waba.fortius.in/media/${newMediaName}`, wabaNumber: "15553945963", configDate: new Date().toLocaleDateString() }]); setNewMediaName(""); alert("Media added!"); }}} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer">+ Add Media</button>
            </div>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-3">MEDIA NAME</th><th className="p-3">URL</th><th className="p-3">WABA NUMBER</th><th className="p-3">DATE</th></tr>
            </thead>
            <tbody className="divide-y">
              {mediaList.map((m) => (
                <tr key={m.id}><td className="p-3 font-bold text-emerald-700">{m.media}</td><td className="p-3 text-blue-600 underline font-mono">{m.url}</td><td className="p-3 font-mono">{m.wabaNumber}</td><td className="p-3 text-gray-500">{m.configDate}</td></tr>
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
              <input type="text" placeholder="Number (e.g. 9198...)" value={newContactNumber} onChange={(e) => setNewContactNumber(e.target.value)} className="border px-3 py-1.5 rounded-lg text-xs" />
              <input type="text" placeholder="Name" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} className="border px-3 py-1.5 rounded-lg text-xs" />
              <button onClick={() => { if(newContactNumber){ setContacts([...contacts, { id: contacts.length+1, number: newContactNumber, profileName: newContactName || "User", email: "user@gmail.com", contactName: newContactName }]); setNewContactNumber(""); setNewContactName(""); alert("Contact added!"); }}} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer">+ Add Contact</button>
            </div>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-3">MOBILE NUMBER</th><th className="p-3">PROFILE NAME</th><th className="p-3">EMAIL</th><th className="p-3">CONTACT NAME</th></tr>
            </thead>
            <tbody className="divide-y">
              {contacts.map((c) => (
                <tr key={c.id}><td className="p-3 font-bold font-mono">{c.number}</td><td className="p-3">{c.profileName}</td><td className="p-3 text-gray-500">{c.email}</td><td className="p-3 font-semibold">{c.contactName}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "groups" && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800">Contact Groups</h2>
            <div className="flex gap-2">
              <input type="text" placeholder="Group Name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="border px-3 py-1.5 rounded-lg text-xs" />
              <button onClick={() => { if(newGroupName){ setGroups([...groups, { id: groups.length+1, name: newGroupName, totalContacts: 0 }]); setNewGroupName(""); alert("Group created!"); }}} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer">+ Create Group</button>
            </div>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-3">GROUP NAME</th><th className="p-3">TOTAL CONTACTS</th></tr>
            </thead>
            <tbody className="divide-y">
              {groups.map((g) => (
                <tr key={g.id}><td className="p-3 font-bold text-emerald-700">{g.name}</td><td className="p-3 font-semibold">{g.totalContacts}</td></tr>
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
              <input type="text" placeholder="Number to block" value={newBlacklistNumber} onChange={(e) => setNewBlacklistNumber(e.target.value)} className="border px-3 py-1.5 rounded-lg text-xs" />
              <button onClick={() => { if(newBlacklistNumber){ setBlacklist([...blacklist, { id: blacklist.length+1, number: newBlacklistNumber, createdDate: new Date().toLocaleDateString() }]); setNewBlacklistNumber(""); alert("Number blacklisted!"); }}} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer">+ Block Number</button>
            </div>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-3">NUMBER</th><th className="p-3">BLOCKED DATE</th></tr>
            </thead>
            <tbody className="divide-y">
              {blacklist.map((b) => (
                <tr key={b.id}><td className="p-3 font-bold text-red-600 font-mono">{b.number}</td><td className="p-3 text-gray-500">{b.createdDate}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "unsubscribe" && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800">Unsubscriber Number List (STOP Requests)</h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-3">NUMBER</th><th className="p-3">WABA NUMBER</th><th className="p-3">DATE</th><th className="p-3">MESSAGE</th></tr>
            </thead>
            <tbody className="divide-y">
              {unsubscribers.map((u) => (
                <tr key={u.id}><td className="p-3 font-mono font-bold">{u.number}</td><td className="p-3 font-mono">{u.wabaNumber}</td><td className="p-3">{u.unsubscribedOn}</td><td className="p-3 text-red-500 font-bold">{u.messageText}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "onboarding" && (
        <div className="bg-white p-8 rounded-2xl border shadow-sm text-center space-y-3">
          <h2 className="text-base font-bold text-gray-800">Coexistence Onboarding</h2>
          <p className="text-xs text-gray-500">Quickly onboard WhatsApp Business App users without downtime.</p>
        </div>
      )}

      {showFacebookModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-gray-800">Get started with WhatsApp Business API</h3>
            <input type="text" placeholder="Enter company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border rounded-lg p-2.5 text-xs" />
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button onClick={() => setShowFacebookModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
              <button onClick={handleFacebookSignup} disabled={isProcessing} className="bg-[#1877F2] text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer">
                {isProcessing ? "Connecting..." : "Continue with Facebook"}
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