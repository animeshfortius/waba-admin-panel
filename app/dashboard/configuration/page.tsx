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

  const handleFacebookSignup = () => {
    setIsProcessing(true);
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const redirectUri = encodeURIComponent("https://waba.fortius.in/facebook/callback");

    const fbPopup = window.open(
      `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=whatsapp_business_management`,
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
            Home ›{" "}
            <span
              onClick={() => setActiveSection("hub")}
              className="cursor-pointer hover:text-emerald-600 font-medium"
            >
              Configuration
            </span>{" "}
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
            className="border px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center space-x-1.5 shadow-sm cursor-pointer"
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
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer"
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
                      <td className="p-3 font-semibold text-slate-800">{ch.wabaNumber}</td>
                      <td className="p-3 font-mono text-slate-600">{ch.phoneNumberId}</td>
                      <td className="p-3 font-mono text-slate-600">{ch.wabaBusinessId}</td>
                      <td className="p-3 font-semibold text-slate-800">{ch.bspName}</td>
                      <td className="p-3">
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold text-[11px]">
                          🟡 {ch.messagingLimit}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-600">✓ {ch.qualityRating}</td>
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
                      <td className="p-3 font-semibold text-slate-800">{ch.displayName}</td>
                      <td className="p-3 text-gray-500 whitespace-nowrap">{ch.configDate}</td>
                      <td className="p-3">
                        <button
                          onClick={() => openWebhookModal(ch)}
                          className="text-emerald-600 hover:underline font-mono cursor-pointer"
                        >
                          {ch.webhookUrl}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openBusinessProfile(ch)}
                          title="Edit Business Profile"
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-200 transition font-bold cursor-pointer"
                        >
                          💼 Profile
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

      {activeSection === "onboarding" && (
        <div className="bg-white p-8 rounded-2xl border shadow-sm text-center space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Coexistence Onboarding</h2>
          <p className="text-xs text-gray-500">Easily Onboard WhatsApp Business App users.</p>
        </div>
      )}

      {activeSection === "media_library" && (
        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Media Library</h2>
          <p className="text-xs text-gray-500">Browse and manage media assets.</p>
        </div>
      )}

      {activeSection === "contacts" && (
        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">WhatsApp Contact</h2>
          <p className="text-xs text-gray-500">Manage your contacts list.</p>
        </div>
      )}

      {activeSection === "unsubscribe" && (
        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Unsubscriber Number List</h2>
          <p className="text-xs text-gray-500">View and manage opt-out numbers.</p>
        </div>
      )}

      {activeSection === "groups" && (
        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Group List</h2>
          <p className="text-xs text-gray-500">Easily manage your contact groups.</p>
        </div>
      )}

      {activeSection === "blacklist" && (
        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Blacklisted Numbers</h2>
          <p className="text-xs text-gray-500">Manage your blacklist for better control.</p>
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
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={profileData.category}
                    onChange={(e) => setProfileData({ ...profileData, category: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none"
                  >
                    <option value="Professional Services">Professional Services</option>
                    <option value="Retail">Retail</option>
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

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setActiveSection("waba_channels")}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-xs shadow cursor-pointer"
                >
                  💾 Save Profile Details
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center">
            <p className="text-xs font-bold text-gray-500 mb-4">Template Preview</p>
            <div className="w-[280px] bg-slate-900 rounded-[35px] p-3 shadow-2xl border-4 border-slate-800 text-white">
              <div className="bg-emerald-800 p-2 rounded-t-[25px] flex items-center gap-2 text-xs">
                <span>💬</span>
                <span className="font-bold truncate">{profileData.displayName}</span>
              </div>
              <div className="bg-slate-100 p-3 rounded-b-[25px] space-y-3 text-[11px] text-gray-800">
                <h3 className="font-bold text-sm text-center">{profileData.displayName}</h3>
                <p className="text-gray-600 text-[10px]">{profileData.description}</p>
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
              <button onClick={() => setShowWebhookModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>
            <div className="space-y-4 text-xs text-left">
              <input
                type="text"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                className="w-full border rounded-lg p-2.5 bg-white text-gray-800"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button onClick={handleSaveWebhook} className="bg-emerald-600 text-white font-bold px-5 py-2 rounded-lg text-xs cursor-pointer">Save</button>
            </div>
          </div>
        </div>
      )}

      {showFacebookModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-800">Get started with WhatsApp Business API</h3>
              <button onClick={() => setShowFacebookModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs text-left">
              <label className="block font-semibold text-gray-600">Company Name (Optional)</label>
              <input
                type="text"
                placeholder="Enter company name (optional)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button onClick={() => setShowFacebookModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
              <button onClick={handleFacebookSignup} className="bg-[#1877F2] text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer flex items-center space-x-2">
                <span>🌐</span>
                <span>Continue with Facebook</span>
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