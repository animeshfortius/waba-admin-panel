import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function cleanDomainInput(input?: string | null): string {
  if (!input) return "";
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

// 1. GET: Fetch White-Label branding by userId, domain, or list all configs
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const domain = cleanDomainInput(searchParams.get("domain"));

    if (userId) {
      const config = await prisma.whiteLabelConfig.findUnique({
        where: { userId },
        include: {
          user: {
            select: { id: true, name: true, username: true, email: true, role: true },
          },
        },
      });
      return NextResponse.json({ success: true, config });
    }

    if (domain) {
      const config = await prisma.whiteLabelConfig.findFirst({
        where: { domain: { equals: domain, mode: "insensitive" } },
        include: {
          user: {
            select: { id: true, name: true, username: true, email: true, role: true },
          },
        },
      });
      return NextResponse.json({ success: true, config });
    }

    const configs = await prisma.whiteLabelConfig.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({ success: true, configs });
  } catch (error: any) {
    console.error("Error fetching white-label branding:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load branding settings" },
      { status: 500 }
    );
  }
}

// 2. POST: Create or update White-Label domain & branding config
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      domain,
      brandName,
      logoUrl,
      faviconUrl,
      primaryColor,
      supportEmail,
      supportPhone,
      serverIp,
      sslStatus,
      isActive,
    } = body;

    const normalizedDomain = cleanDomainInput(domain);

    if (!normalizedDomain) {
      return NextResponse.json(
        { success: false, error: "Valid custom domain is required" },
        { status: 400 }
      );
    }

    let targetUserId = userId;
    if (!targetUserId) {
      const firstAdminOrReseller = await prisma.user.findFirst({
        where: { role: { in: ["SUPER_ADMIN", "WHITE_LABEL_RESELLER", "RESELLER"] } },
        select: { id: true },
      });
      targetUserId = firstAdminOrReseller?.id;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Target reseller/admin userId is required" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Target user not found" },
        { status: 404 }
      );
    }

    const existingByDomain = await prisma.whiteLabelConfig.findUnique({
      where: { domain: normalizedDomain },
    });
    if (existingByDomain && existingByDomain.userId !== targetUserId) {
      return NextResponse.json(
        { success: false, error: "This domain is already assigned to another reseller" },
        { status: 409 }
      );
    }

    const activeFlag = isActive !== undefined ? Boolean(isActive) : true;

    const savedConfig = await prisma.$transaction(async (tx) => {
      if (targetUser.role !== "SUPER_ADMIN") {
        await tx.user.update({
          where: { id: targetUserId },
          data: {
            role: "WHITE_LABEL_RESELLER",
            isWhiteLabel: true,
          },
        });
      }

      return tx.whiteLabelConfig.upsert({
        where: { userId: targetUserId },
        update: {
          domain: normalizedDomain,
          brandName: (brandName || targetUser.name || "Partner Portal").trim(),
          logoUrl: logoUrl !== undefined ? logoUrl : undefined,
          faviconUrl: faviconUrl !== undefined ? faviconUrl : undefined,
          primaryColor: primaryColor || "#059669",
          supportEmail: supportEmail !== undefined ? supportEmail : undefined,
          supportPhone: supportPhone !== undefined ? supportPhone : undefined,
          serverIp: serverIp || "171.50.181.171",
          sslStatus: sslStatus || "PENDING",
          isActive: activeFlag,
        },
        create: {
          userId: targetUserId,
          domain: normalizedDomain,
          brandName: (brandName || targetUser.name || "Partner Portal").trim(),
          logoUrl: logoUrl || null,
          faviconUrl: faviconUrl || null,
          primaryColor: primaryColor || "#059669",
          supportEmail: supportEmail || targetUser.email || null,
          supportPhone: supportPhone || targetUser.phone || null,
          serverIp: serverIp || "171.50.181.171",
          sslStatus: sslStatus || "PENDING",
          isActive: activeFlag,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "White-Label domain & branding saved successfully!",
      config: savedConfig,
    });
  } catch (error: any) {
    console.error("Error saving white-label branding:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save branding settings" },
      { status: 500 }
    );
  }
}

// 3. DELETE: Remove White-Label config by userId or domain
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const domain = cleanDomainInput(searchParams.get("domain"));

    if (!userId && !domain) {
      return NextResponse.json(
        { success: false, error: "userId or domain is required" },
        { status: 400 }
      );
    }

    if (userId) {
      await prisma.whiteLabelConfig.deleteMany({ where: { userId } });
    } else if (domain) {
      await prisma.whiteLabelConfig.deleteMany({
        where: { domain: { equals: domain, mode: "insensitive" } },
      });
    }

    return NextResponse.json({
      success: true,
      message: "White-Label branding configuration removed",
    });
  } catch (error: any) {
    console.error("Error deleting white-label branding:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete branding settings" },
      { status: 500 }
    );
  }
}