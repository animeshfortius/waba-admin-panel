"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ResellerAccount {
  id: string;
  name?: string | null;
  username?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  whiteLabelConfig?: any;
}

interface NotificationSettingsState {
  notifyCustomerViaEmail: boolean;
  notifyCustomerViaSms: boolean;
  notifyMeViaEmail: boolean;
  sendPasswordViaSms: boolean;
  lowBalanceAlertNotification: boolean;
  defaultWalletBalance: string;
  defaultValidityMonths: string;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsState = {
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

export default function SiteBrandingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "domain" | "branding" | "notification" | "smtp"
  >("domain");

  const [accounts, setAccounts] = useState<ResellerAccount[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#059669");
  const [domain, setDomain] = useState("");
  const [serverIp, setServerIp] = useState("171.50.181.171");
  const [sslStatus, setSslStatus] = useState("PENDING");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [notifSettings, setNotifSettings] = useState<NotificationSettingsState>(
    DEFAULT_NOTIFICATION_SETTINGS
  );

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");

  const roleUpper = String(currentUser?.role || "").trim().toUpperCase();
  const isSuperAdmin = roleUpper === "SUPER_ADMIN";
  const canUseBranding =
    isSuperAdmin ||
    roleUpper === "WHITE_LABEL_RESELLER" ||
    roleUpper === "RESELLER";

  const applyConfig = useCallback((cfg: any, fallbackUser?: any) => {
    setBrandName(
      cfg?.brandName || fallbackUser?.name || fallbackUser?.username || ""
    );
    setLogoUrl(cfg?.logoUrl || "");
    setFaviconUrl(cfg?.faviconUrl || "");
    setPrimaryColor(cfg?.primaryColor || "#059669");
    setDomain(cfg?.domain || "");
    setServerIp(cfg?.serverIp || "171.50.181.171");
    setSslStatus(cfg?.sslStatus || "PENDING");
    setSupportEmail(cfg?.supportEmail || fallbackUser?.email || "");
    setSupportPhone(cfg?.supportPhone || fallbackUser?.phone || "");
    setIsActive(cfg?.isActive ?? true);

    const nCfg = cfg?.notificationConfig || cfg || {};
    setNotifSettings({
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
            String(nCfg.defaultWalletBalance) !== ""
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

    const sCfg = cfg?.smtpConfig || {};
    setSmtpHost(sCfg.host || "");
    setSmtpPort(sCfg.port ? String(sCfg.port) : "587");
    setSmtpUser(sCfg.user || "");
    setSmtpPass(sCfg.pass || "");
    setSmtpFromEmail(sCfg.fromEmail || cfg?.supportEmail || "");
  }, []);

  const loadBrandingByUserId = useCallback(
    async (userId: string, fallbackUser?: any) => {
      if (!userId) return;
      try {
        const res = await fetch(
          `/api/admin/branding?userId=${encodeURIComponent(userId)}`,
          { cache: "no-store", credentials: "include" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && data?.config) {
          applyConfig(data.config, fallbackUser);
        } else {
          applyConfig(fallbackUser?.whiteLabelConfig || null, fallbackUser);
        }
      } catch (err) {
        console.error("Error loading branding:", err);
      }
    },
    [applyConfig]
  );

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser || !canUseBranding) return;

    if (!isSuperAdmin) {
      setSelectedUserId(currentUser.id);
      loadBrandingByUserId(currentUser.id, currentUser);
      return;
    }

    fetch("/api/admin/users", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list: ResellerAccount[] = Array.isArray(data?.users)
          ? data.users
          : [];
        const resellersOnly = list.filter((u) => {
          const r = String(u.role || "").toUpperCase();
          return r === "WHITE_LABEL_RESELLER" || r === "RESELLER";
        });
        setAccounts(resellersOnly);

        if (resellersOnly.length > 0) {
          setSelectedUserId(resellersOnly[0].id);
          loadBrandingByUserId(resellersOnly[0].id, resellersOnly[0]);
        } else {
          setSelectedUserId(currentUser.id);
          loadBrandingByUserId(currentUser.id, currentUser);
        }
      })
      .catch(() => {});
  }, [currentUser, canUseBranding, isSuperAdmin, loadBrandingByUserId]);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUseBranding) return;

    if (!brandName.trim()) {
      alert("Please enter a Brand Name.");
      return;
    }

    const parsedDefaultBalance =
      notifSettings.defaultWalletBalance.trim() === ""
        ? 0
        : Number(notifSettings.defaultWalletBalance);

    if (Number.isNaN(parsedDefaultBalance) || parsedDefaultBalance < 0) {
      alert("Default Wallet Balance must be a valid non-negative number.");
      return;
    }

    const parsedDefaultValidity =
      notifSettings.defaultValidityMonths === ""
        ? null
        : Number(notifSettings.defaultValidityMonths);

    setSaving(true);
    try {
      const targetUserId = isSuperAdmin
        ? selectedUserId || currentUser?.id
        : currentUser?.id;

      const res = await fetch("/api/admin/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: targetUserId,
          brandName: brandName.trim(),
          logoUrl: logoUrl.trim() || null,
          faviconUrl: faviconUrl.trim() || null,
          primaryColor: primaryColor.trim() || "#059669",
          domain: domain.trim() || null,
          serverIp: serverIp.trim() || "171.50.181.171",
          sslStatus,
          supportEmail: supportEmail.trim() || null,
          supportPhone: supportPhone.trim() || null,
          isActive,
          defaultWalletBalance: parsedDefaultBalance,
          defaultValidityMonths: parsedDefaultValidity,
          notificationConfig: {
            notifyCustomerViaEmail: notifSettings.notifyCustomerViaEmail,
            notifyCustomerViaSms: notifSettings.notifyCustomerViaSms,
            notifyMeViaEmail: notifSettings.notifyMeViaEmail,
            sendPasswordViaSms: notifSettings.sendPasswordViaSms,
            lowBalanceAlertNotification:
              notifSettings.lowBalanceAlertNotification,
            defaultWalletBalance: parsedDefaultBalance,
            defaultValidityMonths: parsedDefaultValidity,
          },
          smtpConfig: {
            host: smtpHost.trim() || null,
            port: Number(smtpPort || 587),
            user: smtpUser.trim() || null,
            pass: smtpPass || null,
            fromEmail: smtpFromEmail.trim() || null,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Site branding & notification settings saved successfully!");
        if (data.config) {
          applyConfig(data.config);
        }
      } else {
        alert(data.error || data.message || "Failed to save site branding.");
      }
    } catch (err) {
      console.error("Save branding error:", err);
      alert("Network error while saving branding.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl border border-slate-200/80 text-xs text-slate-500">
        Loading branding settings...
      </div>
    );
  }

  if (!canUseBranding) {
    return (
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl border border-slate-200/80 text-xs space-y-3">
        <h1 className="text-base font-bold text-slate-900">Site Branding</h1>
        <p className="text-slate-500">
          This page is restricted to Resellers, White-Label Resellers, and Admins.
        </p>
        <Link
          href="/"
          className="inline-block bg-slate-900 text-white px-4 py-2 rounded-xl font-bold"
        >
          Go Back
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-xs font-sans">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="text-[11px] text-slate-400 font-medium">
            Admin Home › Site Branding & White-Label Setup
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Site Branding & White-Label Setup
          </h1>
        </div>

        <Link
          href="/admin"
          className="border border-slate-200 px-4 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-50 bg-white transition"
        >
          ⬅ Back to Admin Hub
        </Link>
      </div>

      <form
        onSubmit={handleSaveBranding}
        className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6"
      >
        {isSuperAdmin && accounts.length > 0 && (
          <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <label className="block font-semibold text-slate-700">
              Select Reseller / White-Label Account
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedUserId(id);
                const found = accounts.find((a) => a.id === id);
                loadBrandingByUserId(id, found);
              }}
              className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-semibold text-slate-800"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name || acc.username} ({acc.email}) — {acc.role}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap border-b border-slate-200 gap-6 font-semibold text-slate-500">
          {[
            { id: "domain", label: "🌐 Domain & SSL" },
            { id: "branding", label: "🏢 Reseller Branding" },
            { id: "notification", label: "🔔 Notification" },
            { id: "smtp", label: "✉️ SMTP" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`pb-3 border-b-2 transition cursor-pointer ${
                activeSection === tab.id
                  ? "border-emerald-600 text-emerald-700 font-bold"
                  : "border-transparent hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSection === "domain" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Enter brand name"
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Custom Domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. waba.clientbrand.com"
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Server IP (A-Record)
                </label>
                <input
                  type="text"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  SSL Status
                </label>
                <select
                  value={sslStatus}
                  onChange={(e) => setSslStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-semibold"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACTIVE">ACTIVE</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3.5 bg-slate-50">
              <span className="font-semibold text-slate-700">
                Branding Active
              </span>
              <YesNoToggle
                checked={isActive}
                onChange={setIsActive}
                label="Branding Active"
              />
            </div>
          </div>
        )}

        {activeSection === "branding" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Logo URL
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Favicon URL
              </label>
              <input
                type="text"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="https://example.com/favicon.ico"
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@brand.com"
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Support Phone
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="919876543210"
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Primary Color
              </label>
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-mono"
              />
            </div>
          </div>
        )}

        {activeSection === "notification" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">
                Settings tab
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Default Wallet Balance and Default Validity automatically apply
                when creating new child users under this account.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <span className="font-semibold text-slate-700">
                  Notify Customer via Email
                </span>
                <YesNoToggle
                  checked={notifSettings.notifyCustomerViaEmail}
                  onChange={(val) =>
                    setNotifSettings((prev) => ({
                      ...prev,
                      notifyCustomerViaEmail: val,
                    }))
                  }
                  label="Notify Customer via Email"
                />
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <span className="font-semibold text-slate-700">
                  Notify Customer via SMS
                </span>
                <YesNoToggle
                  checked={notifSettings.notifyCustomerViaSms}
                  onChange={(val) =>
                    setNotifSettings((prev) => ({
                      ...prev,
                      notifyCustomerViaSms: val,
                    }))
                  }
                  label="Notify Customer via SMS"
                />
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <span className="font-semibold text-slate-700">
                  Notify ME via Email
                </span>
                <YesNoToggle
                  checked={notifSettings.notifyMeViaEmail}
                  onChange={(val) =>
                    setNotifSettings((prev) => ({
                      ...prev,
                      notifyMeViaEmail: val,
                    }))
                  }
                  label="Notify ME via Email"
                />
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <span className="font-semibold text-slate-700">
                  Send Password via SMS
                </span>
                <YesNoToggle
                  checked={notifSettings.sendPasswordViaSms}
                  onChange={(val) =>
                    setNotifSettings((prev) => ({
                      ...prev,
                      sendPasswordViaSms: val,
                    }))
                  }
                  label="Send Password via SMS"
                />
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-slate-100 md:col-span-2">
                <span className="font-semibold text-slate-700">
                  Low Balance Alert Notification
                </span>
                <YesNoToggle
                  checked={notifSettings.lowBalanceAlertNotification}
                  onChange={(val) =>
                    setNotifSettings((prev) => ({
                      ...prev,
                      lowBalanceAlertNotification: val,
                    }))
                  }
                  label="Low Balance Alert Notification"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block font-semibold text-slate-700">
                  Default Wallet Balance
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g 100"
                  value={notifSettings.defaultWalletBalance}
                  onChange={(e) =>
                    setNotifSettings((prev) => ({
                      ...prev,
                      defaultWalletBalance: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block font-semibold text-slate-700">
                  Default Validity
                </label>
                <select
                  value={notifSettings.defaultValidityMonths}
                  onChange={(e) =>
                    setNotifSettings((prev) => ({
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
          </div>
        )}

        {activeSection === "smtp" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                SMTP Host
              </label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.example.com"
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                SMTP Port
              </label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                SMTP Username
              </label>
              <input
                type="text"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="user@example.com"
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                SMTP Password
              </label>
              <input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-mono"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block font-semibold text-slate-700">
                From Email
              </label>
              <input
                type="email"
                value={smtpFromEmail}
                onChange={(e) => setSmtpFromEmail(e.target.value)}
                placeholder="noreply@brand.com"
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Branding"}
          </button>
        </div>
      </form>
    </div>
  );
}