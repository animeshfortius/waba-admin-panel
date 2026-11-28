"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ResellerAccount {
  id: string;
  name?: string | null;
  username?: string | null;
  email: string;
  role: string;
  whiteLabelConfig?: {
    brandName?: string | null;
    logoUrl?: string | null;
    domain?: string | null;
    serverIp?: string | null;
    sslStatus?: string | null;
    supportEmail?: string | null;
    supportPhone?: string | null;
    isActive?: boolean | null;
  } | null;
}

export default function SiteBrandingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accounts, setAccounts] = useState<ResellerAccount[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [domain, setDomain] = useState("");
  const [serverIp, setServerIp] = useState("171.50.181.171");
  const [sslStatus, setSslStatus] = useState("PENDING");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [isActive, setIsActive] = useState(true);

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
    setDomain(cfg?.domain || "");
    setServerIp(cfg?.serverIp || "171.50.181.171");
    setSslStatus(cfg?.sslStatus || "PENDING");
    setSupportEmail(cfg?.supportEmail || fallbackUser?.email || "");
    setSupportPhone(cfg?.supportPhone || fallbackUser?.phone || "");
    setIsActive(cfg?.isActive ?? true);
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
          domain: domain.trim() || null,
          serverIp: serverIp.trim() || "171.50.181.171",
          sslStatus,
          supportEmail: supportEmail.trim() || null,
          supportPhone: supportPhone.trim() || null,
          isActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Site branding saved successfully!");
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
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-slate-200/80 text-xs text-slate-500">
        Loading branding settings...
      </div>
    );
  }

  if (!canUseBranding) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-slate-200/80 text-xs space-y-3">
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
    <div className="max-w-4xl mx-auto space-y-6 text-xs font-sans">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="text-[11px] text-slate-400 font-medium">
            Reseller & White-Label › Site Branding
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Site Branding
          </h1>
        </div>

        <Link
          href="/admin"
          className="border border-slate-200 px-4 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-50 bg-white transition"
        >
          ⬅ Back
        </Link>
      </div>

      <form
        onSubmit={handleSaveBranding}
        className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5"
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

          <div className="space-y-1 sm:col-span-2">
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
        </div>

        <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3.5 bg-slate-50">
          <span className="font-semibold text-slate-700">
            Branding Active
          </span>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="toggle toggle-success cursor-pointer"
          />
        </div>

        <div className="flex justify-end pt-2">
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