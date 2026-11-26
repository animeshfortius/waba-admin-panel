import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMetaQrCodes, createMetaQrCode } from "@/lib/metaAutomation";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

async function resolveScopedPhoneCredentials(
  ownerWhere: Record<string, any>,
  phoneNumberId?: string
) {
  const accounts = await prisma.wabaAccount.findMany({
    where: ownerWhere,
  });

  const cleanRequestedPhoneId = String(phoneNumberId || "")
    .replace("PHONE_", "")
    .trim();

  if (cleanRequestedPhoneId) {
    const matched = accounts.find((a: any) => {
      const cleanAccPhoneId = String(a.phoneNumberId || "")
        .replace("PHONE_", "")
        .trim();
      return (
        a.phoneNumberId === phoneNumberId ||
        a.phoneNumberId === cleanRequestedPhoneId ||
        cleanAccPhoneId === cleanRequestedPhoneId
      );
    });

    if (!matched) {
      return {
        authorized: false,
        phoneNumberId: "",
        accessToken: "",
        ownerUserId: null as string | null,
      };
    }

    return {
      authorized: true,
      phoneNumberId: String((matched as any).phoneNumberId || "")
        .replace("PHONE_", "")
        .trim(),
      accessToken: String((matched as any).accessToken || "").trim(),
      ownerUserId: (matched as any).userId || null,
    };
  }

  const fallbackAccount = accounts[0] as any;
  return {
    authorized: true,
    phoneNumberId: String(fallbackAccount?.phoneNumberId || "")
      .replace("PHONE_", "")
      .trim(),
    accessToken: String(fallbackAccount?.accessToken || "").trim(),
    ownerUserId: fallbackAccount?.userId || null,
  };
}

export async function GET(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const phoneParam = searchParams.get("phoneNumberId") || undefined;
    const sync = searchParams.get("sync") === "true";

    const ownerWhere = getOwnerWhere(tenant);
    const creds = await resolveScopedPhoneCredentials(ownerWhere, phoneParam);

    if (!creds.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Requested phoneNumberId does not belong to your account",
        },
        { status: 403 }
      );
    }

    const qrOwnerUserId = creds.ownerUserId || tenant.userId;

    if (sync && creds.phoneNumberId && creds.accessToken) {
      const metaQrs = await fetchMetaQrCodes(
        creds.phoneNumberId,
        creds.accessToken
      );
      for (const q of metaQrs) {
        if (!q.code) continue;
        await (prisma.whatsAppQrCode as any).upsert({
          where: { code: String(q.code) },
          update: {
            userId: qrOwnerUserId,
            phoneNumberId: creds.phoneNumberId,
            prefilledText: q.prefilled_message || "",
            qrImageUrl: q.qr_image_url || null,
            deepLinkUrl: q.deep_link_url || null,
            syncedAt: new Date(),
          },
          create: {
            userId: qrOwnerUserId,
            phoneNumberId: creds.phoneNumberId,
            code: String(q.code),
            prefilledText: q.prefilled_message || "",
            qrImageUrl: q.qr_image_url || null,
            deepLinkUrl: q.deep_link_url || null,
            syncedAt: new Date(),
          },
        });
      }
    }

    const whereClause: any = {
      ...ownerWhere,
    };
    if (creds.phoneNumberId) {
      whereClause.phoneNumberId = creds.phoneNumberId;
    }

    const qrCodes = await prisma.whatsAppQrCode.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, qrCodes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { phoneNumberId, prefilledText, generateQrImg = "PNG" } = body;

    if (!prefilledText || !String(prefilledText).trim()) {
      return NextResponse.json(
        { success: false, error: "Prefilled message is required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const creds = await resolveScopedPhoneCredentials(
      ownerWhere,
      phoneNumberId
    );

    if (!creds.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Requested phoneNumberId does not belong to your account",
        },
        { status: 403 }
      );
    }

    if (!creds.phoneNumberId || !creds.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone Number ID or Meta Access Token missing",
        },
        { status: 400 }
      );
    }

    const created = await createMetaQrCode({
      phoneNumberId: creds.phoneNumberId,
      accessToken: creds.accessToken,
      prefilledMessage: String(prefilledText).trim(),
      generateQrImage: generateQrImg === "SVG" ? "SVG" : "PNG",
    });

    const deepLink =
      created.deep_link_url ||
      `https://wa.me/${creds.phoneNumberId}?text=${encodeURIComponent(
        String(prefilledText).trim()
      )}`;

    const saved = await (prisma.whatsAppQrCode as any).create({
      data: {
        userId: creds.ownerUserId || tenant.userId,
        phoneNumberId: creds.phoneNumberId,
        code: created.code ? String(created.code) : `QR_${Date.now()}`,
        prefilledText: String(prefilledText).trim(),
        generateQrImg: generateQrImg === "SVG" ? "SVG" : "PNG",
        qrImageUrl: created.qr_image_url || null,
        deepLinkUrl: deepLink,
      },
    });

    return NextResponse.json({ success: true, qrCode: saved });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}