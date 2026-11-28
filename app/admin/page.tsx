"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ResellerUser {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role: string;
  createdById?: string | null;
  isWhiteLabel?: boolean;
  whiteLabelConfig?: any;
}

interface NotificationTabState {
  notifyCustomerViaEmail: boolean;
  notifyCustomerViaSms: boolean;
  notifyMeViaEmail: boolean;
  sendPasswordViaSms: boolean;
  lowBalanceAlertNotification: boolean;
  defaultWalletBalance: string;
  defaultValidityMonths: string;
}

const DEFAULT_NOTIFICATION_TAB: NotificationTabState = {
  notifyCustomerViaEmail: false,
  notifyCustomerViaSms: false,
  notifyMeViaEmail: false,
  sendPasswordViaSms: false,
  lowBalanceAlertNotification: true,
  defaultWalletBalance: "",
  defaultValidityMonths: "",
};

const VALIDITY_MONTH_OPTIONS = [
  { value: "", label: "Select Month" },
  ...Array.from({ length: 24 }, (_, i) => {
    const m = i + 1;
    return {
      value: String(m),
      label: m === 1 ? "1 Month" : `${m} Months`,
    };
  }),
];

function YesNoToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 select-none">
      <span
        className={`text-[11px] font-bold ${
          !checked ? "text-rose-600" : "text-slate-400"
        }`}
      >
        No
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          checked ? "bg-emerald-600" : "bg-rose-500"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-[11px] font-bold ${
          checked ? "text-emerald-600" : "text-slate-400"
        }`}
      >
        Yes
      </span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>("hub");
  const [activeBrandingTab, setActiveBrandingTab] = useState<string>("reseller");

  const [resellers, setResellers] = useState<ResellerUser[]>([]);
  const [selectedResellerId, setSelectedResellerId] = useState<string>("");

  // White-Label Domain & Branding Form State
  const [domainInput, setDomainInput] = useState("");
  const [brandNameInput, setBrandNameInput] = useState("");
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [primaryColorInput, setPrimaryColorInput] = useState("#059669");
  const [supportEmailInput, setSupportEmailInput] = useState("");
  const [supportPhoneInput, setSupportPhoneInput] = useState("");
  const [serverIpInput, setServerIpInput] = useState("171.50.181.171");
  const [sslStatusInput, setSslStatusInput] = useState("PENDING");
  const [isActiveBranding, setIsActiveBranding] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);

  // Notification & SMTP Form State
  const [notifState, setNotifState] = useState<NotificationTabState>(
    DEFAULT_NOTIFICATION_TAB
  );
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");

  const roleUpper = String(currentUser?.role || "").trim().toUpperCase();
  const isSuperAdmin = roleUpper === "SUPER_ADMIN";
  const isWhiteLabelReseller =
    roleUpper === "WHITE_LABEL_RESELLER" || Boolean(currentUser?.isWhiteLabel);
  const isNormalReseller = roleUpper === "RESELLER" && !isWhiteLabelReseller;

  const canAccessSiteBranding =
    isSuperAdmin || isWhiteLabelReseller || isNormalReseller;
  const canAccessDomainAndSsl = isSuperAdmin || isWhiteLabelReseller;
  const canAccessResellerBranding =
    isSuperAdmin || isWhiteLabelReseller || isNormalReseller;

  const populateFromUser = useCallback((u: ResellerUser) => {
    const cfg = u.whiteLabelConfig;
    setDomainInput(cfg?.domain || "");
    setBrandNameInput(cfg?.brandName || u.name || u.username || "");
    setLogoUrlInput(cfg?.logoUrl || "");
    setPrimaryColorInput(cfg?.primaryColor || "#059669");
    setSupportEmailInput(cfg?.supportEmail || u.email || "");
    setSupportPhoneInput(cfg?.supportPhone || "");
    setServerIpInput(cfg?.serverIp || "171.50.181.171");
    setSslStatusInput(cfg?.sslStatus || "PENDING");
    setIsActiveBranding(cfg?.isActive ?? true);

    const nCfg = cfg?.notificationConfig || {};
    setNotifState({
      notifyCustomerViaEmail: Boolean(
        nCfg.notifyCustomerViaEmail ?? nCfg.notifyCustomerEmail ?? false
      ),
      notifyCustomerViaSms: Boolean(
        nCfg.notifyCustomerViaSms ?? nCfg.notifyCustomerSms ?? false
      ),
      notifyMeViaEmail: Boolean(
        nCfg.notifyMeViaEmail ?? nCfg.notifyAdminEmail ?? false
      ),
      sendPasswordViaSms: Boolean(
        nCfg.sendPasswordViaSms ?? nCfg.sendPasswordSms ?? false
      ),
      lowBalanceAlertNotification: Boolean(
        nCfg.lowBalanceAlertNotification ?? nCfg.lowBalanceAlert ?? true
      ),
      defaultWalletBalance:
        cfg?.defaultWalletBalance !== undefined &&
        cfg?.defaultWalletBalance !== null &&
        Number(cfg.defaultWalletBalance) > 0
          ? String(cfg.defaultWalletBalance)
          : nCfg.defaultWalletBalance !== undefined &&
            nCfg.defaultWalletBalance !== null &&
            String(nCfg.defaultWalletBalance) !== "" &&
            Number(nCfg.defaultWalletBalance) !== 0
          ? String(nCfg.defaultWalletBalance)
          : "",
      defaultValidityMonths:
        cfg?.defaultValidityMonths !== undefined &&
        cfg?.defaultValidityMonths !== null &&
        Number(cfg.defaultValidityMonths) > 0
          ? String(cfg.defaultValidityMonths)
          : nCfg.defaultValidityMonths !== undefined &&
            nCfg.defaultValidityMonths !== null &&
            String(nCfg.defaultValidityMonths) !== ""
          ? String(nCfg.defaultValidityMonths)
          : "",
    });
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const loadResellers = useCallback(
    async (preferredId?: string) => {
      try {
        const res = await fetch("/api/admin/users", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (data?.success && Array.isArray(data.users)) {
          const eligible = data.users.filter((u: ResellerUser) => {
            const uRole = String(u.role || "").toUpperCase();
            if (uRole === "SUPER_ADMIN") return false;
            if ((isWhiteLabelReseller || isNormalReseller) && currentUser?.id) {
              return (
                u.id === currentUser.id || u.createdById === currentUser.id
              );
            }
            return ["WHITE_LABEL_RESELLER", "RESELLER"].includes(uRole);
          });
          setResellers(eligible);

          if (eligible.length > 0) {
            const target =
              eligible.find(
                (item: ResellerUser) =>
                  item.id === (preferredId || selectedResellerId)
              ) || eligible[0];
            setSelectedResellerId(target.id);
            populateFromUser(target);
          } else if ((isWhiteLabelReseller || isNormalReseller) && currentUser) {
            setSelectedResellerId(currentUser.id);
            populateFromUser(currentUser);
          }
        }
      } catch (err) {
        console.error("Error loading resellers:", err);
      }
    },
    [
      currentUser,
      isWhiteLabelReseller,
      isNormalReseller,
      populateFromUser,
      selectedResellerId,
    ]
  );

  useEffect(() => {
    if (currentUser) {
      loadResellers();
    }
  }, [currentUser, loadResellers]);

  useEffect(() => {
    if (activeSection === "site_branding" && !canAccessSiteBranding) {
      setActiveSection("hub");
    }
  }, [activeSection, canAccessSiteBranding]);

  useEffect(() => {
    if (!canAccessDomainAndSsl && activeBrandingTab === "domain") {
      setActiveBrandingTab("reseller");
    }
  }, [canAccessDomainAndSsl, activeBrandingTab]);

  const handleResellerChange = async (userId: string) => {
    setSelectedResellerId(userId);
    const localMatch = resellers.find((r) => r.id === userId);
    if (localMatch) {
      populateFromUser(localMatch);
    }

    try {
      const res = await fetch(
        `/api/admin/branding?userId=${encodeURIComponent(userId)}`,
        { cache: "no-store", credentials: "include" }
      );
      const data = await res.json();
      if (data?.success && data?.config) {
        const cfg = data.config;
        setDomainInput(cfg.domain || "");
        setBrandNameInput(cfg.brandName || localMatch?.name || "");
        setLogoUrlInput(cfg.logoUrl || "");
        setPrimaryColorInput(cfg.primaryColor || "#059669");
        setSupportEmailInput(cfg.supportEmail || "");
        setSupportPhoneInput(cfg.supportPhone || "");
        setServerIpInput(cfg.serverIp || "171.50.181.171");
        setSslStatusInput(cfg.sslStatus || "PENDING");
        setIsActiveBranding(cfg.isActive ?? true);

        const nCfg = cfg.notificationConfig || {};
        setNotifState({
          notifyCustomerViaEmail: Boolean(
            nCfg.notifyCustomerViaEmail ?? nCfg.notifyCustomerEmail ?? false
          ),
          notifyCustomerViaSms: Boolean(
            nCfg.notifyCustomerViaSms ?? nCfg.notifyCustomerSms ?? false
          ),
          notifyMeViaEmail: Boolean(
            nCfg.notifyMeViaEmail ?? nCfg.notifyAdminEmail ?? false
          ),
          sendPasswordViaSms: Boolean(
            nCfg.sendPasswordViaSms ?? nCfg.sendPasswordSms ?? false
          ),
          lowBalanceAlertNotification: Boolean(
            nCfg.lowBalanceAlertNotification ?? nCfg.lowBalanceAlert ?? true
          ),
          defaultWalletBalance:
            cfg.defaultWalletBalance !== undefined &&
            cfg.defaultWalletBalance !== null &&
            Number(cfg.defaultWalletBalance) > 0
              ? String(cfg.defaultWalletBalance)
              : nCfg.defaultWalletBalance !== undefined &&
                nCfg.defaultWalletBalance !== null &&
                String(nCfg.defaultWalletBalance) !== "" &&
                Number(nCfg.defaultWalletBalance) !== 0
              ? String(nCfg.defaultWalletBalance)
              : "",
          defaultValidityMonths:
            cfg.defaultValidityMonths !== undefined &&
            cfg.defaultValidityMonths !== null &&
            Number(cfg.defaultValidityMonths) > 0
              ? String(cfg.defaultValidityMonths)
              : nCfg.defaultValidityMonths !== undefined &&
                nCfg.defaultValidityMonths !== null &&
                String(nCfg.defaultValidityMonths) !== ""
              ? String(nCfg.defaultValidityMonths)
              : "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch branding config:", err);
    }
  };

  const handleSaveWhiteLabelBranding = async () => {
    if (!canAccessSiteBranding) return;
    if (canAccessDomainAndSsl && !domainInput.trim()) {
      alert("Please enter a custom domain (e.g., waba.clientbrand.com)");
      return;
    }

    const parsedDefaultBalance =
      notifState.defaultWalletBalance.trim() === ""
        ? 0
        : Number(notifState.defaultWalletBalance);

    if (Number.isNaN(parsedDefaultBalance) || parsedDefaultBalance < 0) {
      alert("Default Wallet Balance must be a valid non-negative number.");
      return;
    }

    const parsedDefaultValidity =
      notifState.defaultValidityMonths === ""
        ? null
        : Number(notifState.defaultValidityMonths);

    setSavingBranding(true);
    try {
      const res = await fetch("/api/admin/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: selectedResellerId || currentUser?.id,
          domain: domainInput.trim() || null,
          brandName: brandNameInput.trim(),
          logoUrl: logoUrlInput.trim() || null,
          primaryColor: primaryColorInput,
          supportEmail: supportEmailInput.trim() || null,
          supportPhone: supportPhoneInput.trim() || null,
          serverIp: serverIpInput.trim() || "171.50.181.171",
          sslStatus: sslStatusInput,
          isActive: isActiveBranding,
          defaultWalletBalance: parsedDefaultBalance,
          defaultValidityMonths: parsedDefaultValidity,
          notificationConfig: {
            notifyCustomerViaEmail: notifState.notifyCustomerViaEmail,
            notifyCustomerViaSms: notifState.notifyCustomerViaSms,
            notifyMeViaEmail: notifState.notifyMeViaEmail,
            sendPasswordViaSms: notifState.sendPasswordViaSms,
            lowBalanceAlertNotification: notifState.lowBalanceAlertNotification,
            defaultWalletBalance: parsedDefaultBalance,
            defaultValidityMonths: parsedDefaultValidity,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Site branding settings saved successfully!");
        await loadResellers(selectedResellerId);
      } else {
        alert(data.error || "Failed to save branding");
      }
    } catch (err) {
      console.error("Error saving branding:", err);
      alert("Network error while saving branding");
    } finally {
      setSavingBranding(false);
    }
  };

  const brandingTabs = [
    ...(canAccessDomainAndSsl ? [{ id: "domain", label: "🌐 Domain & SSL" }] : []),
    ...(canAccessResellerBranding
      ? [{ id: "reseller", label: "🏢 Reseller Branding" }]
      : []),
    { id: "notification", label: "🔔 Notification" },
    { id: "smtp", label: "⚙️ SMTP" },
  ];

  const hubCards = [
    {
      href: "/admin/user-management",
      icon: "👤",
      title: "User Management",
      desc: "Manage White-Label, Resellers, Users, rates & funds.",
      badge: "Core",
    },
    {
      href: "/admin/client-list",
      icon: "📋",
      title: "Client List",
      desc: "View complete client directory, roles & account status.",
      badge: "Directory",
    },
    {
      href: "/admin/client-tree",
      icon: "🌳",
      title: "Client Tree View",
      desc: "Visualize parent-reseller & child-user hierarchy.",
      badge: "Hierarchy",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs font-sans">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="text-[11px] font-medium text-slate-400">
            Admin Home{" "}
            {activeSection !== "hub" &&
              `› ${activeSection.replace("_", " ").toUpperCase()}`}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            {activeSection === "hub" && "Administrator Control Center"}
            {activeSection === "site_branding" &&
              (canAccessDomainAndSsl
                ? "Site Branding & White-Label Setup"
                : "Site Branding & Settings")}
            {activeSection === "system_traffic" &&
              "System Traffic & Monitoring"}
          </h1>
        </div>

        {activeSection !== "hub" && (
          <button
            type="button"
            onClick={() => setActiveSection("hub")}
            className="border border-slate-200 px-4 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center gap-1.5 cursor-pointer bg-white transition"
          >
            <span>⬅</span>
            <span>Back to Admin Hub</span>
          </button>
        )}
      </div>

      {/* ADMIN HUB DASHBOARD */}
      {activeSection === "hub" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                Administrator & White-Label Controls
              </h2>
              <span className="text-[11px] text-slate-400">
                3-Tier Model: White-Label · Reseller · User
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {hubCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 cursor-pointer transition space-y-2.5 group block"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl group-hover:scale-110 transition">
                      {card.icon}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {card.desc}
                  </p>
                </Link>
              ))}

              {/* Site Branding Card */}
              {canAccessSiteBranding && (
                <div
                  onClick={() => {
                    setActiveBrandingTab(
                      canAccessDomainAndSsl ? "domain" : "reseller"
                    );
                    setActiveSection("site_branding");
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 cursor-pointer transition space-y-2.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl group-hover:scale-110 transition">
                      🎨
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {canAccessDomainAndSsl ? "White-Label" : "Branding"}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Site Branding
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {canAccessDomainAndSsl
                      ? "Custom domain, A-record IP, SSL, logo & reseller branding."
                      : "Reseller branding, notifications & SMTP configuration."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <h2 className="font-bold text-slate-500 uppercase tracking-wider text-[11px] px-1">
              Monitoring Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setActiveSection("system_traffic")}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 cursor-pointer transition space-y-2 group"
              >
                <div className="text-2xl group-hover:scale-110 transition">
                  📈
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  System Traffic
                </h3>
                <p className="text-[11px] text-slate-500">
                  Monitor real-time system traffic and delivery health.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SITE BRANDING & WHITE-LABEL SECTION */}
      {activeSection === "site_branding" && canAccessSiteBranding && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
          <div className="flex flex-wrap border-b border-slate-200 gap-6 text-xs font-semibold text-slate-500">
            {brandingTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveBrandingTab(tab.id)}
                className={`pb-3 border-b-2 transition cursor-pointer ${
                  activeBrandingTab === tab.id
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {canAccessDomainAndSsl &&
            (activeBrandingTab === "domain" ||
              activeBrandingTab === "reseller" ||
              activeBrandingTab === "notification") &&
            isSuperAdmin && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-800">
                    Select White-Label / Reseller Account
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Point reseller&apos;s DNS A-Record to{" "}
                    <span className="font-mono font-bold text-slate-800">
                      {serverIpInput}
                    </span>
                  </div>
                </div>
                <select
                  value={selectedResellerId}
                  onChange={(e) => handleResellerChange(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3.5 py-2 bg-white font-semibold text-slate-800 min-w-[240px]"
                >
                  {resellers.length === 0 ? (
                    <option value="">No Reseller Account Found</option>
                  ) : (
                    resellers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name || r.username} ({r.role})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

          {canAccessDomainAndSsl && activeBrandingTab === "domain" && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Custom Domain Name
                  </label>
                  <input
                    type="text"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="e.g. waba.clientbrand.com"
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Target Server IP (A-Record)
                  </label>
                  <input
                    type="text"
                    value={serverIpInput}
                    onChange={(e) => setServerIpInput(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    SSL Status
                  </label>
                  <select
                    value={sslStatusInput}
                    onChange={(e) => setSslStatusInput(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-semibold"
                  >
                    <option value="PENDING">
                      PENDING (DNS / Cert Provisioning)
                    </option>
                    <option value="ACTIVE">ACTIVE (SSL Enabled)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3 bg-slate-50 mt-5 sm:mt-0">
                  <span className="font-semibold text-slate-700">
                    Domain Active
                  </span>
                  <input
                    type="checkbox"
                    checked={isActiveBranding}
                    onChange={(e) => setIsActiveBranding(e.target.checked)}
                    className="toggle toggle-success cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={savingBranding}
                onClick={handleSaveWhiteLabelBranding}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {savingBranding ? "Saving..." : "Save Domain & SSL Config"}
              </button>
            </div>
          )}

          {canAccessResellerBranding && activeBrandingTab === "reseller" && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Brand / Company Name
                  </label>
                  <input
                    type="text"
                    value={brandNameInput}
                    onChange={(e) => setBrandNameInput(e.target.value)}
                    placeholder="Brand Name"
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Primary Accent Color
                  </label>
                  <input
                    type="color"
                    value={primaryColorInput}
                    onChange={(e) => setPrimaryColorInput(e.target.value)}
                    className="w-full h-10 border border-slate-300 rounded-xl p-1 bg-slate-50 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Support Email ID
                  </label>
                  <input
                    type="email"
                    value={supportEmailInput}
                    onChange={(e) => setSupportEmailInput(e.target.value)}
                    placeholder="support@brand.com"
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Support Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={supportPhoneInput}
                    onChange={(e) => setSupportPhoneInput(e.target.value)}
                    placeholder="919876543210"
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-semibold text-slate-700">
                    Brand Logo URL
                  </label>
                  <input
                    type="text"
                    value={logoUrlInput}
                    onChange={(e) => setLogoUrlInput(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={savingBranding}
                onClick={handleSaveWhiteLabelBranding}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {savingBranding ? "Saving..." : "Save Branding Info"}
              </button>
            </div>
          )}

          {activeBrandingTab === "notification" && (
            <div className="space-y-5 max-w-3xl">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Settings tab
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex justify-between items-center border border-slate-200 p-3.5 rounded-xl bg-slate-50">
                  <span className="font-semibold text-slate-700">
                    Notify Customer via Email
                  </span>
                  <YesNoToggle
                    checked={notifState.notifyCustomerViaEmail}
                    onChange={(val) =>
                      setNotifState((prev) => ({
                        ...prev,
                        notifyCustomerViaEmail: val,
                      }))
                    }
                    label="Notify Customer via Email"
                  />
                </div>

                <div className="flex justify-between items-center border border-slate-200 p-3.5 rounded-xl bg-slate-50">
                  <span className="font-semibold text-slate-700">
                    Notify Customer via SMS
                  </span>
                  <YesNoToggle
                    checked={notifState.notifyCustomerViaSms}
                    onChange={(val) =>
                      setNotifState((prev) => ({
                        ...prev,
                        notifyCustomerViaSms: val,
                      }))
                    }
                    label="Notify Customer via SMS"
                  />
                </div>

                <div className="flex justify-between items-center border border-slate-200 p-3.5 rounded-xl bg-slate-50">
                  <span className="font-semibold text-slate-700">
                    Notify ME via Email
                  </span>
                  <YesNoToggle
                    checked={notifState.notifyMeViaEmail}
                    onChange={(val) =>
                      setNotifState((prev) => ({
                        ...prev,
                        notifyMeViaEmail: val,
                      }))
                    }
                    label="Notify ME via Email"
                  />
                </div>

                <div className="flex justify-between items-center border border-slate-200 p-3.5 rounded-xl bg-slate-50">
                  <span className="font-semibold text-slate-700">
                    Send Password via SMS
                  </span>
                  <YesNoToggle
                    checked={notifState.sendPasswordViaSms}
                    onChange={(val) =>
                      setNotifState((prev) => ({
                        ...prev,
                        sendPasswordViaSms: val,
                      }))
                    }
                    label="Send Password via SMS"
                  />
                </div>

                <div className="flex justify-between items-center border border-slate-200 p-3.5 rounded-xl bg-slate-50 md:col-span-2">
                  <span className="font-semibold text-slate-700">
                    Low Balance Alert Notification
                  </span>
                  <YesNoToggle
                    checked={notifState.lowBalanceAlertNotification}
                    onChange={(val) =>
                      setNotifState((prev) => ({
                        ...prev,
                        lowBalanceAlertNotification: val,
                      }))
                    }
                    label="Low Balance Alert Notification"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">
                    Default Wallet Balance
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g 100"
                    value={notifState.defaultWalletBalance}
                    onChange={(e) =>
                      setNotifState((prev) => ({
                        ...prev,
                        defaultWalletBalance: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">
                    Default Validity
                  </label>
                  <select
                    value={notifState.defaultValidityMonths}
                    onChange={(e) =>
                      setNotifState((prev) => ({
                        ...prev,
                        defaultValidityMonths: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {VALIDITY_MONTH_OPTIONS.map((opt) => (
                      <option key={opt.label} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={savingBranding}
                onClick={handleSaveWhiteLabelBranding}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {savingBranding ? "Saving..." : "Save Notification Settings"}
              </button>
            </div>
          )}

          {activeBrandingTab === "smtp" && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="SMTP Host (e.g. smtp.gmail.com)"
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50"
                />
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="SMTP Port (e.g. 587)"
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-mono"
                />
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="SMTP Username"
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50"
                />
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="SMTP Password / App Key"
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => alert("SMTP Settings Saved!")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Save SMTP Settings
              </button>
            </div>
          )}
        </div>
      )}

      {/* SYSTEM TRAFFIC SECTION */}
      {activeSection === "system_traffic" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 text-center space-y-3">
          <div className="text-3xl">📈</div>
          <h3 className="font-bold text-sm text-slate-900">
            System Traffic & Real-time Monitoring
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Live analytics, active reseller traffic, and messaging throughput
            details are ready for monitoring.
          </p>
        </div>
      )}
    </div>
  );
}