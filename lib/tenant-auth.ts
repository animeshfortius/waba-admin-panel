import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    "fortius-super-secret-waba-key-2026"
);

export type AppRole =
  | "SUPER_ADMIN"
  | "WHITE_LABEL_RESELLER"
  | "RESELLER"
  | "USER";

export interface TenantContext {
  userId: string;
  role: AppRole;
  isSuperAdmin: boolean;
  isReseller: boolean;
  isWhiteLabel: boolean;
  allowedUserIds: string[] | null; // null = global access (SUPER_ADMIN)
  branding: {
    brandName: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string;
  };
}

export async function getTenantContext(): Promise<TenantContext | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("waba_token")?.value ||
      cookieStore.get("token")?.value ||
      cookieStore.get("auth_token")?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const rawUserId = String(
      payload.userId || payload.id || payload.sub || ""
    ).trim();
    if (!rawUserId) return null;

    if (rawUserId === "emergency-admin-id") {
      return {
        userId: "emergency-admin-id",
        role: "SUPER_ADMIN",
        isSuperAdmin: true,
        isReseller: false,
        isWhiteLabel: false,
        allowedUserIds: null,
        branding: {
          brandName: "Fortius Infocom",
          logoUrl: null,
          faviconUrl: null,
          primaryColor: "#059669",
        },
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: rawUserId },
      include: {
        whiteLabelConfig: true,
        childUsers: { select: { id: true } },
        createdBy: {
          include: { whiteLabelConfig: true },
        },
      },
    });

    if (!user) return null;

    const normalizedRole = String(user.role || "USER")
      .trim()
      .toUpperCase() as AppRole;

    const isSuperAdmin = normalizedRole === "SUPER_ADMIN";
    const isWhiteLabel =
      normalizedRole === "WHITE_LABEL_RESELLER" || Boolean(user.isWhiteLabel);
    const isReseller =
      normalizedRole === "RESELLER" ||
      normalizedRole === "WHITE_LABEL_RESELLER" ||
      Boolean(user.isWhiteLabel);

    let allowedUserIds: string[] | null = [user.id];
    if (isSuperAdmin) {
      allowedUserIds = null;
    } else if (isReseller) {
      const childIds = (user.childUsers || []).map((c) => c.id);
      allowedUserIds = [user.id, ...childIds];
    }

    const activeWL =
      (user.whiteLabelConfig?.isActive ? user.whiteLabelConfig : null) ||
      (user.createdBy?.whiteLabelConfig?.isActive
        ? user.createdBy.whiteLabelConfig
        : null);

    const branding = {
      brandName:
        activeWL?.brandName || (isSuperAdmin ? "Fortius Infocom" : "WABA Cloud"),
      logoUrl: activeWL?.logoUrl || null,
      faviconUrl: activeWL?.faviconUrl || null,
      primaryColor: activeWL?.primaryColor || "#059669",
    };

    return {
      userId: user.id,
      role: normalizedRole,
      isSuperAdmin,
      isReseller,
      isWhiteLabel,
      allowedUserIds,
      branding,
    };
  } catch (err) {
    console.error("getTenantContext error:", err);
    return null;
  }
}

export function getOwnerWhere(tenant: TenantContext): Record<string, any> {
  if (!tenant.allowedUserIds) return {};
  return { userId: { in: tenant.allowedUserIds } };
}