"use client";

import { useState } from "react";

export default function ConfigPage() {
  const [activeSection, setActiveSection] = useState<
    | "hub"
    | "waba_channels"
    | "business_profile"
    | "onboarding"
    | "media_library"
    | "contacts"
    | "unsubscribe"
    | "groups"
    | "blacklist"
  >("hub");

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

  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  
  // Webhook Modal States
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookInput, setWebhookInput] = useState("");
  const [enableAuth, setEnableAuth] = useState(false);
  const [webhookType, setWebhookType] = useState("Default");

  // Business Profile Form State
  const [profileData, setProfileData] = useState({
    displayName: "Active-08",
    category: "Professional Services",
    description:
      "Professional Business Communication Solutions • WhatsApp Business API • Bulk SMS & RCS • Voice, IVR & Toll-Free Solutions • Chatbot & Business Automation • API & Customer Communication Solutions. Smart Communication. Reliable Technology.",
    email: "info@fortiusinfocom.com",
    channelNumber: "15553945963",
    address: "Lucknow, UP, India",
    website: "https://www.fortiusinfocom.com/",
    profileImage: null as string | null,
  });

  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [mediaList, setMediaList] = useState([
    {
      id: 1,
      media: "diwali_offer.jpg",
      url: "https://waba.fortius.in/media/diwali_offer.jpg",
      wabaNumber: "15553945963",
      configDate: "12-Oct-2026",
    },
  ]);

  const [contacts, setContacts] = useState([
    {
      id: 1,
      number: "919876543210",
      profileName: "Rahul Sharma",
      email: "rahul@gmail.com",
      contactName: "Rahul",
    },
  ]);

  const [unsubscribers, setUnsubscribers] = useState([
    {
      id: 1,
      number: "919000011111",
      wabaNumber: "15553945963",
      unsubscribedOn: "11-Oct-2026",
      messageText: "STOP",
    },
  ]);

  const [groups, setGroups] = useState([
    { id: 1, name: "VIP Broadcast Group", totalContacts: 45 },
  ]);

  const [blacklist, setBlacklist] = useState([
    { id: 1, number: "919999888777", createdDate: "10-Oct-2026" },
  ]);

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
            ? {
                ...ch,
                webhookUrl: webhookInput.trim() === "" ? "NA" : webhookInput,
                authEnabled: enableAuth,
                webhookType,
              }
            : ch
        )
      );
    }
    setShowWebhookModal(false);
  };

  const openBusinessProfile = (channel: any) => {
    setSelectedChannel(channel);
    setProfileData((prev) => ({
      ...prev,
      displayName: channel.displayName || "Active-08",
      channelNumber: channel.wabaNumber || "15553945963",
    }));
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
    if (selectedChannel) {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === selectedChannel.id
            ? { ...ch, displayName: profileData.displayName }
            : ch
        )
      );
    }
    alert("Business Profile details updated successfully!");
    setActiveSection("waba_channels");
  };

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

  const handleFacebookSignup = () => {
    setIsProcessing(true);
    const fbPopup = window.open(
      "https://www.facebook.com/v18.0/dialog/oauth?client_id=meta_waba_app&redirect_uri=https://waba.fortius.in/facebook/callback&scope=whatsapp_business_management",
      "FacebookLogin",
      "width=600,height=700,top=100,left=200"
    );

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
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-xs text-gray-400">
            Home › Configuration{" "}
            {activeSection !== "hub" &&
              `› ${activeSection.replace("_", " ").toUpperCase()}`}
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
            onClick={() =>
              setActiveSection(
                activeSection === "business_profile" ? "waba_channels" : "hub"
              )
            }
            className="border px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center space-x-1.5 shadow-sm"
          >
            <span>⬅</span>
            <span>
              {activeSection === "business_profile"
                ? "Back to Channels"
                : "Back to Hub"}
            </span>
          </button>
        )}
      </div>

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
                <h3 className="font-bold text-sm text-gray-800">Waba Channels</h3>
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
                <h3 className="font-bold text-sm text-gray-800">Coexistence Onboarding</h3>
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
                <h3 className="font-bold text-sm text-gray-800">Media Library</h3>
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
                <h3 className="font-bold text-sm text-gray-800">WhatsApp Contact</h3>
                <p className="text-[11px] text-gray-400">Manage your Contacts.</p>
              </div>

              <div
                onClick={() => setActiveSection("unsubscribe")}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-3xl group-hover:scale-110 transition duration-200">
                  📗
                </div>
                <h3 className="font-bold text-sm text-gray-800">Unsubscriber Number List</h3>
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
                <h3 className="font-bold text-sm text-gray-800">Blacklist Numbers</h3>
                <p className="text-[11px] text-gray-400">
                  Manage your blacklist for better control.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === "waba_channels" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <button
              onClick={() => setShowFacebookModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center space-x-1.5"
            >
              <span>+</span>
              <span>Register New WhatsApp</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b uppercase tracking-wider text-[11px]">
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
                    <th className="p-3 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {channels.map((ch) => (
                    <tr key={ch.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold text-slate-800">
                        {ch.wabaNumber}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {ch.phoneNumberId}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {ch.wabaBusinessId}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {ch.bspName}
                      </td>
                      <td className="p-3">
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold text-[11px]">
                          🟡 {ch.messagingLimit}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-600">
                        ✓ {ch.qualityRating}
                      </td>
                      <td className="p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer gap-1">
                          <input
                            type="radio"
                            name="defaultWaba"
                            defaultChecked={ch.default}
                            className="text-emerald-600 h-3.5 w-3.5"
                          />
                          <span className="text-[11px] text-gray-500">
                            {ch.default ? "Default" : "Set Default"}
                          </span>
                        </label>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {ch.displayName}
                      </td>
                      <td className="p-3 text-gray-500 whitespace-nowrap">
                        {ch.configDate}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => openWebhookModal(ch)}
                          className="text-emerald-600 hover:underline font-mono"
                        >
                          {ch.webhookUrl}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openBusinessProfile(ch)}
                          title="Edit Business Profile"
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-200 transition font-bold"
                        >
                          💼 Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
              <span>Showing 1 to {channels.length} of {channels.length} records</span>
            </div>
          </div>
        </div>
      )}

      {activeSection === "business_profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-800">Personal Info</h2>
                <p className="text-xs text-gray-400">Update your photo and personal details here</p>
              </div>

              {/* Functional Click to Upload Box */}
              <label className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-2 hover:border-emerald-500 transition cursor-pointer block bg-gray-50/50">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <div className="mx-auto w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                  ☁️
                </div>
                <p className="text-xs font-bold text-gray-700">Click to upload</p>
                <p className="text-[11px] text-gray-400">or drag and drop an image here</p>
                <p className="text-[10px] text-gray-400">PNG, JPG up to 10MB. At least 400px wide and 400px tall is recommended.</p>
                {profileData.profileImage && (
                  <p className="text-xs font-bold text-emerald-600 pt-2">✓ Image Selected Successfully!</p>
                )}
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    disabled
                    className="w-full border rounded-lg p-2.5 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Display Name can't be edited</p>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={profileData.category}
                    onChange={(e) => setProfileData({ ...profileData, category: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none"
                  >
                    <option value="Professional Services">Professional Services</option>
                    <option value="Retail">Retail & Shopping</option>
                    <option value="Finance">Finance & Banking</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs">Description</label>
                <textarea
                  rows={4}
                  value={profileData.description}
                  onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                  className="w-full border rounded-lg p-2.5 bg-white text-xs text-gray-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-800">Contact Info</h2>
                <p className="text-xs text-gray-400">Manage your address and contact details here</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Channel Number</label>
                  <input
                    type="text"
                    value={profileData.channelNumber}
                    disabled
                    className="w-full border rounded-lg p-2.5 bg-gray-100 text-gray-500 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-gray-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full border rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none"
                />
              </div>

              <div className="text-xs">
                <label className="block font-bold text-gray-700 mb-1">Website</label>
                <input
                  type="text"
                  value={profileData.website}
                  onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                  className="w-full border rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setActiveSection("waba_channels")}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-xs shadow"
                >
                  💾 Save Profile Details
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center">
            <p className="text-xs font-bold text-gray-500 mb-4">Template Preview</p>
            <div className="w-[280px] bg-slate-900 rounded-[35px] p-3 shadow-2xl border-4 border-slate-800">
              <div className="bg-emerald-800 text-white p-2 rounded-t-[25px] flex items-center gap-2 text-xs">
                <span>💬</span>
                <span className="font-bold truncate">{profileData.displayName}</span>
              </div>
              <div className="bg-slate-100 p-3 rounded-b-[25px] space-y-3 text-[11px] text-gray-800">
                <div className="text-center space-y-1">
                  <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg shadow overflow-hidden">
                    {profileData.profileImage ? (
                      <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      "FI"
                    )}
                  </div>
                  <h3 className="font-bold text-sm">{profileData.displayName}</h3>
                </div>

                <div className="bg-white p-2.5 rounded-xl space-y-2 shadow-sm text-[10px]">
                  <p className="text-gray-600 leading-snug">{profileData.description}</p>
                  <div className="border-t pt-2 space-y-1 text-gray-500">
                    <p>📂 {profileData.category}</p>
                    <p>📍 {profileData.address}</p>
                    <p>✉️ {profileData.email}</p>
                    <p className="text-emerald-600 truncate">🌐 {profileData.website}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWebhookModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">Update Webhook URL</h3>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-left">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Webhook URL</label>
                <input
                  type="text"
                  placeholder="https://yourdomain.com/webhook"
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableAuth"
                  checked={enableAuth}
                  onChange={(e) => setEnableAuth(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="enableAuth" className="font-medium text-gray-600">
                  Enable Authorization
                </label>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select User Webhook Type</label>
                <select
                  value={webhookType}
                  onChange={(e) => setWebhookType(e.target.value)}
                  className="w-full border border-emerald-500 rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none"
                >
                  <option value="Default">Default</option>
                  <option value="Moengage">Moengage</option>
                  <option value="CleverTap">CleverTap</option>
                  <option value="WebEngage">WebEngage</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setShowWebhookModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWebhook}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-xs shadow"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
                <span>{isProcessing ? "Connecting..." : "Continue with Facebook"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}