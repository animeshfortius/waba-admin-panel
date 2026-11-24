import { prisma } from "@/lib/prisma";

export interface TenantBranding {
  isWhiteLabel: boolean;
  ownerId: string | null;
  domain: string;
  brandName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  supportEmail: string | null;
  supportPhone: string | null;
  serverIp: string;
  sslStatus: string;
}

const DEFAULT_BRANDING: TenantBranding = {
  isWhiteLabel: false,
  ownerId: null,
  domain: "default",
  brandName: "Fortius Infocom",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#059669",
  supportEmail: null,
  supportPhone: null,
  serverIp: "171.50.181.171",
  sslStatus: "ACTIVE",
};

export function normalizeHost(hostHeader?: string | null): string {
  if (!hostHeader) return "";
  return hostHeader
    .split(":")[0]
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

export async function resolveTenantBranding(hostHeader?: string | null): Promise<TenantBranding> {
  const cleanHost = normalizeHost(hostHeader);
  if (!cleanHost) {
    return DEFAULT_BRANDING;
  }

  try {
    const config = await prisma.whiteLabelConfig.findFirst({
      where: {
        isActive: true,
        domain: {
          equals: cleanHost,
          mode: "insensitive",
        },
      },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!config) {
      return {
        ...DEFAULT_BRANDING,
        domain: cleanHost,
      };
    }

    return {
      isWhiteLabel: true,
      ownerId: config.userId,
      domain: config.domain,
      brandName: config.brandName || "Partner Portal",
      logoUrl: config.logoUrl || null,
      faviconUrl: config.faviconUrl || null,
      primaryColor: config.primaryColor || "#059669",
      supportEmail: config.supportEmail || null,
      supportPhone: config.supportPhone || null,
      serverIp: config.serverIp || "171.50.181.171",
      sslStatus: config.sslStatus || "PENDING",
    };
  } catch (error) {
    console.error("Error resolving tenant branding:", error);
    return {
      ...DEFAULT_BRANDING,
      domain: cleanHost,
    };
  }
}