export type AppRole =
  | "SUPER_ADMIN"
  | "WHITE_LABEL_RESELLER"
  | "RESELLER"
  | "USER";

export interface WhiteLabelSummary {
  isActive?: boolean;
  brandName?: string | null;
  domain?: string | null;
  customDomain?: string | null;
}

export function normalizeRole(role?: string | null): AppRole {
  const upper = String(role || "USER").toUpperCase();
  if (upper === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (upper === "WHITE_LABEL_RESELLER") return "WHITE_LABEL_RESELLER";
  if (upper === "RESELLER") return "RESELLER";
  return "USER";
}

export function hasConfiguredBranding(
  config?: WhiteLabelSummary | null
): boolean {
  if (!config) return false;
  const hasBrandName = Boolean(String(config.brandName || "").trim());
  const hasDomain = Boolean(
    String(config.domain || config.customDomain || "").trim()
  );
  return Boolean(config.isActive && (hasBrandName || hasDomain));
}

export function getRolePermissions(
  role?: string | null,
  whiteLabelConfig?: WhiteLabelSummary | null
) {
  const normalized = normalizeRole(role);
  const isSuperAdmin = normalized === "SUPER_ADMIN";
  const isReseller =
    normalized === "RESELLER" || normalized === "WHITE_LABEL_RESELLER";
  const brandingReady = isSuperAdmin || hasConfiguredBranding(whiteLabelConfig);

  return {
    role: normalized,
    isSuperAdmin,
    isReseller,
    isUser: normalized === "USER",
    canAccessFullAdmin: isSuperAdmin,
    canAccessResellerTools: isSuperAdmin || isReseller, // Transfer Funds, User List, Branding
    canCreateUsers: isSuperAdmin || (isReseller && brandingReady),
    brandingReady,
    canViewActualBalance: isSuperAdmin || isReseller,
    canViewVirtualBalance: true,
  };
}