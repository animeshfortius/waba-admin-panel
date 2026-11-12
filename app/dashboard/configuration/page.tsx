"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
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
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");

  const [showContactModal, setShowContactModal] = useState(false);
  const [showUploadContactModal, setShowUploadContactModal] = useState(false);
  const [contactData, setContactData] = useState({ name: "", number: "", email: "" });

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  
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

  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [selectedProfileChannel, setSelectedProfileChannel] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    description: "",
    email: "",
    address: "",
    website: "",
    category: "OTHER",
  });
  const [profileImageFile, setProfileImageFile] = useState<any>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: '1405995811146008',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

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

    fetch("/api/configuration/channels")
      .then(res => res.json())
      .then(async (data) => {
        if (Array.isArray(data)) {
          setChannels(data);

          const updatedChannels = await Promise.all(
            data.map(async (acc) => {
              if (!acc.accessToken || acc.accessToken.startsWith("mock_token")) {
                return acc;
              }

              let messagingLimit = acc.messagingLimit;
              let qualityRating = acc.qualityRating;

              const rawWabaId = acc.wabaId || acc.waba_id || "";
              const rawPhoneId = acc.phoneNumberId || acc.phone_number_id || "";
              
              const cleanWabaId = rawWabaId.replace("WABA_", "").trim();
              const cleanPhoneId = rawPhoneId.replace("PHONE_", "").trim();

              try {
                if (cleanWabaId) {
                  const limitRes = await fetch(
                    `https://graph.facebook.com/v26.0/${cleanWabaId}?fields=messaging_limit_tier`,
                    { headers: { Authorization: `Bearer ${acc.accessToken}` } }
                  );
                  const limitData = await limitRes.json();
                  if (limitData && limitData.messaging_limit_tier) {
                    messagingLimit = limitData.messaging_limit_tier;
                  }
                }

                if (cleanPhoneId) {
                  const ratingRes = await fetch(
                    `https://graph.facebook.com/v26.0/${cleanPhoneId}?fields=quality_rating`,
                    { headers: { Authorization: `Bearer ${acc.accessToken}` } }
                  );
                  const ratingData = await ratingRes.json();
                  if (ratingData && ratingData.quality_rating) {
                    qualityRating = ratingData.quality_rating;
                  }
                }
              } catch (err) {
                console.error("Client-side Meta fetch error:", err);
              }

              return {
                ...acc,
                messagingLimit,
                qualityRating,
              };
            })
          );

          setChannels(updatedChannels);
        }
      })
      .catch(() => {});

    // Fetch Media Library using correct /api/media endpoint
    const userId = localStorage.getItem("userId") || "";
    fetch(`/api/media?userId=${userId}`)
      .then(res => res.json())
      .then(data => { if(data.success && Array.isArray(data.media)) setMediaList(data.media); })
      .catch(() => {});

    fetch("/api/configuration/contacts").then(res => res.json()).then(data => { if(Array.isArray(data)) setContacts(data); }).catch(() => {});
    fetch("/api/configuration/blacklist").then(res => res.json()).then(data => { if(Array.isArray(data)) setBlacklist(data); }).catch(() => {});
  }, []);

  const filteredMedia = useMemo(() => {
    if (!mediaSearchQuery.trim()) return mediaList;
    return mediaList.filter(
      (m) =>
        m.mediaName.toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
        m.wabaNumber.toLowerCase().includes(mediaSearchQuery.toLowerCase())
    );
  }, [mediaList, mediaSearchQuery]);

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

  const handleSetDefaultChannel = async (id: string) => {
    try {
      const res = await fetch("/api/configuration/default-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        alert("Default channel updated successfully!");
        window.location.reload();
      } else {
        alert("Failed to set default channel");
      }
    } catch (err) {
      alert("Error updating default channel.");
    }
  };

  const handleUpdateWebhook = async (channel: any) => {
    const newUrl = prompt("Enter new Webhook URL for this channel:", channel.webhookUrl === "NA" ? "" : channel.webhookUrl);
    if (newUrl === null) return;

    try {
      const res = await fetch("/api/configuration/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: channel.id, webhookUrl: newUrl }),
      });

      if (res.ok) {
        alert("Webhook URL updated successfully!");
        window.location.reload();
      } else {
        alert("Failed to update webhook URL.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating webhook URL.");
    }
  };

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
          body: JSON.stringify({ 
            code, 
            website: companyWebsite, 
            name: companyName 
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("WhatsApp channel connected successfully!");
            window.location.reload();
          } else {
            alert("Error: " + (data.error || "Failed to register channel"));
          }
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
        setup: {
          solutionID: '891846553340614'
        },
        featureType: 'whatsapp_business_app_onboarding',
        sessionInfoVersion: 3
      }
    });
  };

  const handleOpenProfileModal = async (channel: any) => {
    setSelectedProfileChannel(channel);
    setOpenActionMenuId(null);
    setProfileImageFile(null);
    setProfileImagePreview("");

    setProfileForm({
      displayName: channel.displayName || channel.displayPhone || "100 App",
      description: channel.description || "",
      email: channel.email || "",
      address: channel.address || "",
      website: channel.website || "",
      category: channel.category || "OTHER",
    });

    if (channel.profilePicture) {
      setProfileImagePreview(channel.profilePicture);
    }

    try {
      const res = await fetch(`/api/configuration/business-profile?id=${channel.id}`);
      const result = await res.json();
      if (result.success && result.data) {
        setProfileForm({
          displayName: channel.displayName || channel.displayPhone || "100 App",
          description: result.data.description || channel.description || "",
          email: result.data.email || channel.email || "",
          address: result.data.address || channel.address || "",
          website: result.data.website || channel.website || "",
          category: result.data.category || channel.category || "OTHER",
        });
        if (result.data.profilePicture) {
          setProfileImagePreview(result.data.profilePicture);
        }
      }
    } catch (err) {
      console.error("Failed to fetch live profile details", err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveBusinessProfile = async () => {
    if (!selectedProfileChannel) return;
    setIsSavingProfile(true);
    try {
      let uploadedLogoUrl = profileImagePreview;

      if (profileImageFile) {
        const formData = new FormData();
        formData.append("file", profileImageFile);
        formData.append("userId", localStorage.getItem("userId") || "emergency_admin_id");
        const uploadRes = await fetch("/api/media", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.media?.url) {
          uploadedLogoUrl = uploadData.media.url;
        }
      }

      const res = await fetch("/api/configuration/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedProfileChannel.id, 
          ...profileForm,
          profilePicture: uploadedLogoUrl 
        }),
      });

      if (res.ok) {
        alert("Business Profile saved successfully!");
        setSelectedProfileChannel(null);
        window.location.reload();
      } else {
        alert("Failed to update profile on Meta");
      }
    } catch (err) {
      alert("Error saving business profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 w-full p-4 text-xs font-sans">
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

      {/* WABA CHANNELS TABLE */}
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
                  <th className="p-3 whitespace-nowrap">WABA NUMBER</th>
                  <th className="p-3 whitespace-nowrap">PHONENUMBER ID</th>
                  <th className="p-3 whitespace-nowrap">WABA BUSINESSID</th>
                  <th className="p-3 whitespace-nowrap">MESSAGING LIMIT</th>
                  <th className="p-3 whitespace-nowrap">QUALITY RATING</th>
                  <th className="p-3 whitespace-nowrap">DEFAULT</th>
                  <th className="p-3 whitespace-nowrap">DISPLAY NAME</th>
                  <th className="p-3 whitespace-nowrap">CONFIGURE DATE</th>
                  <th className="p-3 whitespace-nowrap">WEBHOOK URL</th>
                  <th className="p-3 whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700 font-medium">
                {channels.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-gray-400">
                      No WABA channels found. Click "+ Register New WhatsApp" to connect your number.
                    </td>
                  </tr>
                ) : (
                  channels.map((ch) => (
                    <tr key={ch.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800 font-mono">{ch.displayPhone || ch.display_phone_number}</td>
                      <td className="p-3 font-mono text-gray-600">{ch.phoneNumberId || ch.phone_number_id}</td>
                      <td className="p-3 font-mono text-gray-600">{ch.wabaId || ch.waba_id}</td>
                      <td className="p-3 text-emerald-600 font-bold whitespace-nowrap">
                        ✔ {ch.messagingLimit || "Fetching..."}
                      </td>
                      <td className="p-3 whitespace-nowrap font-semibold text-slate-700">
                        ✔ {ch.qualityRating || "Fetching..."}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleSetDefaultChannel(ch.id)}
                          className={`${ch.isDefault ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'} px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer`}
                        >
                          {ch.isDefault ? "Default ★" : "Set Default"}
                        </button>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{ch.displayName || "100 App"}</td>
                      <td className="p-3 text-gray-500 whitespace-nowrap">
                        {new Date(ch.createdAt || Date.now()).toLocaleString()}
                      </td>
                      <td 
                        onClick={() => handleUpdateWebhook(ch)}
                        className="p-3 text-emerald-600 underline cursor-pointer hover:text-emerald-800 font-mono"
                        title="Click to edit Webhook URL"
                      >
                        {ch.webhookUrl || "NA"}
                      </td>
                      <td className="p-3 relative">
                        <button
                          onClick={() => setOpenActionMenuId(openActionMenuId === ch.id ? null : ch.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 font-bold text-slate-700 text-sm cursor-pointer"
                        >
                          ⋮
                        </button>
                        {openActionMenuId === ch.id && (
                          <div className="absolute right-3 top-10 bg-white border rounded-xl shadow-lg z-30 w-40 p-1">
                            <button
                              onClick={() => handleOpenProfileModal(ch)}
                              className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs hover:bg-slate-50 rounded-lg text-slate-700 font-semibold cursor-pointer"
                            >
                              <span>✏️</span> Business Profile
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MEDIA LIBRARY TAB */}
      {activeSection === "media_library" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-800">Media Library</h2>
              <p className="text-[11px] text-gray-400">Manage your templates and campaign media assets</p>
            </div>
            <button 
              onClick={() => setShowMediaModal(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer transition"
            >
              + Add Media
            </button>
          </div>

          {/* Meta Policy Banner */}
          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3.5 rounded-xl flex items-center space-x-3 text-[11px]">
            <span>ℹ️</span>
            <span>
              As per Meta WhatsApp media retention policies, only media files from the last 30 days are available in the Media Library. Older media is automatically deleted.
            </span>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between">
            <input
              type="text"
              placeholder="Filter Records by name or WABA number..."
              value={mediaSearchQuery}
              onChange={(e) => setMediaSearchQuery(e.target.value)}
              className="w-full max-w-sm border rounded-xl p-2 bg-gray-50 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
            />
            <span className="text-gray-500 font-bold text-[11px]">Total: {filteredMedia.length} record(s)</span>
          </div>

          {/* Media Table */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-gray-500 font-bold text-[11px]">
                  <th className="p-4">MEDIA</th>
                  <th className="p-4">URL</th>
                  <th className="p-4">WADANUMBER</th>
                  <th className="p-4">EXPIRES IN</th>
                  <th className="p-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMedia.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400 font-medium">
                      No media files found. Click "+ Add Media" to upload your first file.
                    </td>
                  </tr>
                ) : (
                  filteredMedia.map((m: any) => {
                    const expiryDate = new Date(m.expiresAt || Date.now());
                    const diffTime = expiryDate.getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isExpired = diffDays <= 0;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60">
                        <td className="p-4 flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0">
                            {m.fileType === "image" || m.url?.startsWith("data:image") ? (
                              <img src={m.url} alt={m.mediaName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 uppercase">{m.fileType || "doc"}</span>
                            )}
                          </div>
                          <span className="font-bold text-gray-800 truncate max-w-xs">{m.mediaName}</span>
                        </td>
                        <td className="p-4 font-mono text-blue-600 truncate max-w-xs">
                          <a href={m.url} target="_blank" rel="noreferrer" className="hover:underline">🔗 File URL</a>
                        </td>
                        <td className="p-4 font-mono font-semibold text-gray-600">{m.wabaNumber}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full font-bold text-[10px] inline-block ${isExpired ? "bg-red-100 text-red-700 border border-red-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300"}`}>
                            {isExpired ? "Expired" : `${diffDays} days left`}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(m.url);
                              alert("🔗 URL copied to clipboard!");
                            }}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 cursor-pointer shadow-xs"
                            title="Copy URL"
                          >
                            📋
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm("Are you sure you want to delete this media?")) return;
                              await fetch(`/api/media?id=${m.id}`, { method: "DELETE" });
                              setMediaList((prev) => prev.filter((item) => item.id !== m.id));
                            }}
                            className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 cursor-pointer shadow-xs"
                            title="Delete Media"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MEDIA UPLOAD MODAL (FIXED WITH FormData & /api/media) */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Upload Media File</h3>
              <button onClick={() => setShowMediaModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 text-xs mb-1">SELECT FILE (IMAGE / VIDEO / PDF) *</label>
                <input 
                  type="file" 
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={(e) => setMediaFile(e.target.files?.[0])} 
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setShowMediaModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
              <button 
                onClick={async () => {
                  if(!mediaFile) return alert("Please select a file first!");
                  
                  const formData = new FormData();
                  formData.append("file", mediaFile);
                  formData.append("userId", localStorage.getItem("userId") || "emergency_admin_id");
                  formData.append("wabaNumber", "All");

                  try {
                    const res = await fetch("/api/media", {
                      method: "POST",
                      body: formData,
                    });
                    const data = await res.json();
                    if(data.success) { 
                      alert("✅ Media uploaded successfully!"); 
                      setShowMediaModal(false);
                      setMediaFile(null);
                      window.location.reload(); 
                    } else {
                      alert("❌ Upload failed: " + data.error);
                    }
                  } catch(err) {
                    alert("❌ Network error during upload.");
                  }
                }} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold cursor-pointer shadow"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTHER SECTIONS (Contacts, Groups, Blacklist, etc.) remain as-is */}
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

      {/* Facebook Signup Modal */}
      {showFacebookModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-gray-800">Get started with WhatsApp's Business API</h2>
              <button onClick={() => setShowFacebookModal(false)} className="text-gray-400 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-gray-700 w-36">Company Website:</label>
                <input type="text" placeholder="Company Website" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="border rounded-lg px-3 py-2 w-full sm:w-80 bg-white" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-gray-700 w-36">Company Name:</label>
                <input type="text" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="border rounded-lg px-3 py-2 w-full sm:w-80 bg-white" />
              </div>
            </div>
            <div className="flex justify-start items-center space-x-3 pt-3 border-t">
              <button onClick={handleFacebookSignup} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer text-xs">Continue with Facebook</button>
              <button onClick={() => setShowFacebookModal(false)} className="bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer text-xs">Cancel</button>
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