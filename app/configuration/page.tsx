"use client";

import { useState } from "react";

export default function ConfigPage() {
  const [activeSection, setActiveSection] = useState<
    | "hub"
    | "waba_channels"
    | "onboarding"
    | "media_library"
    | "contacts"
    | "unsubscribe"
    | "groups"
    | "blacklist"
    | "channel_settings"
  >("hub");

  // Initial Clean WABA Channels Table
  const [channels, setChannels] = useState([
    {
      id: 1,
      number: "15553945963",
      phoneId: "1055489258",
      wabaId: "987654321",
      bspName: "Primary BSP",
      msgLimit: "1K / day",
      quality: "High",
      default: "Yes",
      displayName: "Fortius Official",
      configDate: "12-Oct-2026 12:00",
      webhookUrl: "https://waba.fortius.in/webhook/1",
    },
  ]);

  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. MEDIA LIBRARY STATE
  const [mediaList, setMediaList] = useState([
    {
      id: 1,
      media: "diwali_offer.jpg",
      url: "https://waba.fortius.in/media/diwali_offer.jpg",
      wabaNumber: "15553945963",
      configDate: "12-Oct-2026",
    },
  ]);
  const [showUploadMediaModal, setShowUploadMediaModal] = useState(false);
  const [newMediaName, setNewMediaName] = useState("");

  // 2. WHATSAPP CONTACTS STATE
  const [contacts, setContacts] = useState([
    {
      id: 1,
      number: "919876543210",
      profileName: "Rahul Sharma",
      email: "rahul@gmail.com",
      contactName: "Rahul",
    },
  ]);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContact, setNewContact] = useState({
    number: "",
    profileName: "",
    email: "",
    contactName: "",
  });

  // 3. UNSUBSCRIBE NUMBERS STATE
  const [unsubscribers, setUnsubscribers] = useState([
    {
      id: 1,
      number: "919000011111",
      wabaNumber: "15553945963",
      unsubscribedOn: "11-Oct-2026",
      messageText: "STOP",
    },
  ]);

  // 4. MANAGE GROUPS STATE
  const [groups, setGroups] = useState([
    { id: 1, name: "VIP Broadcast Group", totalContacts: 45 },
  ]);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // 5. BLACKLIST NUMBERS STATE
  const [blacklist, setBlacklist] = useState([
    { id: 1, number: "919999888777", createdDate: "10-Oct-2026" },
  ]);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistInput, setBlacklistInput] = useState("");

  // GENERIC IMPORT / EXPORT / DOWNLOAD SAMPLE HANDLERS
  const handleDownloadSample = (sectionName: string) => {
    alert(`Downloading sample CSV/Excel template for ${sectionName}...`);
  };

  const handleExportData = (sectionName: string) => {
    alert(`Exporting ${sectionName} data to Excel file...`);
  };

  const handleImportFile = (sectionName: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv, .xlsx, .xls";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        alert(`Successfully imported ${file.name} into ${sectionName}!`);
      }
    };
    input.click();
  };

  // CONTROLLED FACEBOOK SIGNUP WITH REALISTIC TIMED DIALOG
  const handleFacebookSignup = () => {
    setIsProcessing(true);

    const fbPopup = window.open(
      "https://www.facebook.com/v18.0/dialog/oauth?client_id=meta_waba_app&redirect_uri=https://waba.fortius.in/facebook/callback&scope=whatsapp_business_management",
      "FacebookLogin",
      "width=600,height=700,top=100,left=200"
    );

    // Simulated authentic onboard delay
    setTimeout(() => {
      if (fbPopup && !fbPopup.closed) {
        fbPopup.close();
      }

      setIsProcessing(false);
      setShowFacebookModal(false);
      
      alert("Facebook Embedded Signup completed! Connecting channel...");
      setActiveSection("waba_channels");
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2">
      {/* Top Header & Breadcrumb */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-xs text-gray-400">
            Home › Configuration{" "}
            {activeSection !== "hub" &&
              `› ${activeSection.replace("_", " ").toUpperCase()}`}
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {activeSection === "hub" && "Configuration"}
            {activeSection === "waba_channels" && "WABA Channels Management"}
            {activeSection === "onboarding" && "Coexistence Onboarding"}
            {activeSection === "media_library" && "Media Library"}
            {activeSection === "contacts" && "WhatsApp Contact"}
            {activeSection === "unsubscribe" && "Unsubscriber Number List"}
            {activeSection === "groups" && "Group List"}
            {activeSection === "blacklist" && "Blacklisted Numbers"}
            {activeSection === "channel_settings" &&
              `Channel Settings: +${selectedChannel?.number}`}
          </h1>
        </div>

        {activeSection !== "hub" && (
          <button
            onClick={() =>
              setActiveSection(
                activeSection === "channel_settings" ? "waba_channels" : "hub"
              )
            }
            className="border px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center space-x-1.5 shadow-sm"
          >
            <span>⬅</span>
            <span>
              {activeSection === "channel_settings"
                ? "Back to Channels"
                : "Back to Hub"}
            </span>
          </button>
        )}
      </div>

      {/* 1. CONFIGURATION HUB MAIN GRID */}
      {activeSection === "hub" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
              Channel & Templates Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div
                onClick={() => setActiveSection("waba_channels")}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-3xl group-hover:scale-110 transition duration-200">
                  📡
                </div>
                <h3 className="font-bold text-sm text-gray-800">
                  Waba Channels
                </h3>
                <p className="text-[11px] text-gray-400">
                  Easily Connect and manage WABA Channels.
                </p>
              </div>

              <div
                onClick={() => setActiveSection("onboarding")}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-3xl group-hover:scale-110 transition duration-200">
                  💻
                </div>
                <h3 className="font-bold text-sm text-gray-800">
                  Coexistence Onboarding
                </h3>
                <p className="text-[11px] text-gray-400">
                  Easily Onboard WhatsApp Business App users.
                </p>
              </div>

              <div
                onClick={() => setActiveSection("media_library")}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-3xl group-hover:scale-110 transition duration-200">
                  📼
                </div>
                <h3 className="font-bold text-sm text-gray-800">
                  Media Library
                </h3>
                <p className="text-[11px] text-gray-400">
                  Browse media library assets.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
              Contact Manager
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div
                onClick={() => setActiveSection("contacts")}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-3xl group-hover:scale-110 transition duration-200">
                  📱
                </div>
                <h3 className="font-bold text-sm text-gray-800">
                  WhatsApp Contact
                </h3>
                <p className="text-[11px] text-gray-400">
                  Manage your Contacts.
                </p>
              </div>

              <div
                onClick={() => setActiveSection("unsubscribe")}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-3xl group-hover:scale-110 transition duration-200">
                  📗
                </div>
                <h3 className="font-bold text-sm text-gray-800">
                  Unsubscriber Number List
                </h3>
                <p className="text-[11px] text-gray-400">
                  View and manage unsubscribed numbers.
                </p>
              </div>

              <div
                onClick={() => setActiveSection("groups")}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-3xl group-hover:scale-110 transition duration-200">
                  📲
                </div>
                <h3 className="font-bold text-sm text-gray-800">Manage Group</h3>
                <p className="text-[11px] text-gray-400">
                  Easily manage your groups here.
                </p>
              </div>

              <div
                onClick={() => setActiveSection("blacklist")}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-3xl group-hover:scale-110 transition duration-200">
                  🖥️
                </div>
                <h3 className="font-bold text-sm text-gray-800">
                  Blacklist Numbers
                </h3>
                <p className="text-[11px] text-gray-400">
                  Manage your blacklist for better control.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. WABA CHANNELS SCREEN */}
      {activeSection === "waba_channels" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <button
              onClick={() => setShowFacebookModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center space-x-1.5"
            >
              <span>+</span>
              <span>Engine New Whatsapp</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Phone Number ID</th>
                    <th className="p-4">WABA ID</th>
                    <th className="p-4">BSP Name</th>
                    <th className="p-4">Messaging Limit</th>
                    <th className="p-4">Quality Rating</th>
                    <th className="p-4">Default</th>
                    <th className="p-4">Display Name</th>
                    <th className="p-4">Configure Date</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {channels.map((ch) => (
                    <tr key={ch.id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono font-bold text-gray-800">
                        +{ch.number}
                      </td>
                      <td className="p-4 font-mono text-gray-500">
                        {ch.phoneId}
                      </td>
                      <td className="p-4 font-mono text-gray-500">
                        {ch.wabaId}
                      </td>
                      <td className="p-4 font-bold text-emerald-700">
                        {ch.bspName}
                      </td>
                      <td className="p-4 font-mono">{ch.msgLimit}</td>
                      <td className="p-4 font-bold text-emerald-600">
                        {ch.quality}
                      </td>
                      <td className="p-4">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                          {ch.default}
                        </span>
                      </td>
                      <td className="p-4 font-bold">{ch.displayName}</td>
                      <td className="p-4 font-mono text-gray-500">
                        {ch.configDate}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedChannel(ch);
                            setActiveSection("channel_settings");
                          }}
                          className="bg-emerald-50 text-emerald-700 p-2 rounded-lg hover:bg-emerald-100 font-bold shadow-sm"
                        >
                          ⚙️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. MEDIA LIBRARY SCREEN WITH IMPORT, EXPORT & DOWNLOAD SAMPLE */}
      {activeSection === "media_library" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex space-x-2">
              <button
                onClick={() => handleImportFile("Media Library")}
                className="bg-gray-100 border text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                📥 Import
              </button>
              <button
                onClick={() => handleExportData("Media Library")}
                className="bg-gray-100 border text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                📤 Export
              </button>
              <button
                onClick={() => handleDownloadSample("Media Library")}
                className="border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50"
              >
                💾 Download Sample
              </button>
            </div>
            <button
              onClick={() => setShowUploadMediaModal(true)}
              className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
            >
              + Add Media
            </button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                  <th className="p-4">Media</th>
                  <th className="p-4">URL</th>
                  <th className="p-4">WABA Number</th>
                  <th className="p-4">Config Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mediaList.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-800">{m.media}</td>
                    <td className="p-4 font-mono text-blue-600 truncate max-w-xs">
                      {m.url}
                    </td>
                    <td className="p-4 font-mono">{m.wabaNumber}</td>
                    <td className="p-4">{m.configDate}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() =>
                          setMediaList(mediaList.filter((x) => x.id !== m.id))
                        }
                        className="text-red-500 font-bold hover:bg-red-50 p-1.5 rounded-lg"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. WHATSAPP CONTACTS SCREEN WITH IMPORT, EXPORT & SAMPLE */}
      {activeSection === "contacts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex space-x-2">
              <button
                onClick={() => handleImportFile("WhatsApp Contacts")}
                className="bg-gray-100 border text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                📥 Import Contacts
              </button>
              <button
                onClick={() => handleExportData("WhatsApp Contacts")}
                className="bg-gray-100 border text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                📤 Export Contacts
              </button>
              <button
                onClick={() => handleDownloadSample("WhatsApp Contacts")}
                className="border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50"
              >
                💾 Download Sample
              </button>
            </div>
            <button
              onClick={() => setShowAddContactModal(true)}
              className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
            >
              + Add Contact
            </button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Profile Name</th>
                  <th className="p-4">Email ID</th>
                  <th className="p-4">Contact Name</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono font-bold text-gray-800">
                      +{c.number}
                    </td>
                    <td className="p-4 font-bold">{c.profileName}</td>
                    <td className="p-4 text-gray-500">{c.email}</td>
                    <td className="p-4">{c.contactName}</td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() =>
                          setContacts(contacts.filter((x) => x.id !== c.id))
                        }
                        className="text-red-500 font-bold hover:bg-red-50 p-1.5 rounded-lg"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. UNSUBSCRIBER NUMBER LIST WITH IMPORT/EXPORT/SAMPLE */}
      {activeSection === "unsubscribe" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex space-x-2">
              <button
                onClick={() => handleImportFile("Unsubscriber Numbers")}
                className="bg-gray-100 border text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                📥 Import List
              </button>
              <button
                onClick={() => handleExportData("Unsubscriber Numbers")}
                className="bg-gray-100 border text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                📤 Export List
              </button>
              <button
                onClick={() => handleDownloadSample("Unsubscriber Numbers")}
                className="border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50"
              >
                💾 Download Sample
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                  <th className="p-4">Number</th>
                  <th className="p-4">WABA Number</th>
                  <th className="p-4">Unsubscribed On</th>
                  <th className="p-4">Message Text</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unsubscribers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono font-bold text-red-600">
                      +{u.number}
                    </td>
                    <td className="p-4 font-mono">{u.wabaNumber}</td>
                    <td className="p-4">{u.unsubscribedOn}</td>
                    <td className="p-4 font-mono bg-gray-50 px-2 py-1 rounded">
                      {u.messageText}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MANAGE GROUP SCREEN WITH IMPORT, EXPORT, DOWNLOAD SAMPLE & DELETE */}
      {activeSection === "groups" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex space-x-2">
              <button
                onClick={() => handleImportFile("Groups")}
                className="bg-gray-100 border text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                📥 Import Groups
              </button>
              <button
                onClick={() => handleExportData("Groups")}
                className="bg-gray-100 border text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                📤 Export Groups
              </button>
              <button
                onClick={() => handleDownloadSample("Groups")}
                className="border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50"
              >
                💾 Download Sample
              </button>
            </div>
            <button
              onClick={() => setShowAddGroupModal(true)}
              className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
            >
              + Create Group
            </button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                  <th className="p-4">Group Name</th>
                  <th className="p-4">Total Contacts</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groups.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-800">{g.name}</td>
                    <td className="p-4 font-mono font-bold text-emerald-700">
                      {g.totalContacts}
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => handleImportFile(`Group: ${g.name}`)}
                        className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100"
                      >
                        📥 Import
                      </button>
                      <button
                        onClick={() => handleExportData(`Group: ${g.name}`)}
                        className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100"
                      >
                        📤 Export
                      </button>
                      <button
                        onClick={() =>
                          setGroups(groups.filter((x) => x.id !== g.id))
                        }
                        className="text-red-500 font-bold hover:bg-red-50 p-1.5 rounded-lg"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. BLACKLIST NUMBERS SCREEN WITH IMPORT, EXPORT & SAMPLE */}
      {activeSection === "blacklist" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex space-x-2">
              <button
                onClick={() => handleImportFile("Blacklist Numbers")}
                className="bg-gray-100 border text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                📥 Import File
              </button>
              <button
                onClick={() => handleExportData("Blacklist Numbers")}
                className="bg-gray-100 border text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                📤 Export File
              </button>
              <button
                onClick={() => handleDownloadSample("Blacklist Numbers")}
                className="border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50"
              >
                💾 Download Sample
              </button>
            </div>
            <button
              onClick={() => setShowBlacklistModal(true)}
              className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
            >
              + Block Number
            </button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                  <th className="p-4">Blocked Number</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {blacklist.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono font-bold text-red-600">
                      +{b.number}
                    </td>
                    <td className="p-4">{b.createdDate}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() =>
                          setBlacklist(blacklist.filter((x) => x.id !== b.id))
                        }
                        className="text-emerald-600 font-bold hover:bg-emerald-50 px-3 py-1 rounded-lg"
                      >
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMBEDDED FACEBOOK SIGNUP MODAL WITH AUTHENTIC DIALOG DURATION */}
      {showFacebookModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-800">
                Get started with WhatsApp Business API
              </h3>
              <button
                onClick={() => setShowFacebookModal(false)}
                className="text-gray-400"
                disabled={isProcessing}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-left">
              <label className="block font-semibold text-gray-600">
                Company Name (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter company name (optional)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                disabled={isProcessing}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setShowFacebookModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleFacebookSignup}
                disabled={isProcessing}
                className="bg-[#1877F2] hover:bg-[#165fe6] text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow flex items-center space-x-2 disabled:opacity-50"
              >
                <span>🌐</span>
                <span>
                  {isProcessing
                    ? "Connecting Meta Business..."
                    : "Continue with Facebook"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}