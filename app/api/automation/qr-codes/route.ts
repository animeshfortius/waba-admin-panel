import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMetaQrCodes, createMetaQrCode } from "@/lib/metaAutomation";

async function resolvePhoneCredentials(phoneNumberId?: string) {
  const accounts = await prisma.wabaAccount.findMany();
  const matched =
    accounts.find((a: any) => phoneNumberId && a.phoneNumberId === phoneNumberId) || accounts[0];

  const resolvedPhoneId = phoneNumberId || (matched as any)?.phoneNumberId || "";
  const accessToken =
    (matched as any)?.accessToken ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    "";

  return { phoneNumberId: resolvedPhoneId, accessToken };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneParam = searchParams.get("phoneNumberId") || undefined;
    const sync = searchParams.get("sync") === "true";

    const creds = await resolvePhoneCredentials(phoneParam);

    if (sync && creds.phoneNumberId && creds.accessToken) {
      const metaQrs = await fetchMetaQrCodes(creds.phoneNumberId, creds.accessToken);
      for (const q of metaQrs) {
        if (!q.code) continue;
        await prisma.whatsAppQrCode.upsert({
          where: { code: String(q.code) },
          update: {
            phoneNumberId: creds.phoneNumberId,
            prefilledText: q.prefilled_message || "",
            qrImageUrl: q.qr_image_url || null,
            deepLinkUrl: q.deep_link_url || null,
            syncedAt: new Date(),
          },
          create: {
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

    const qrCodes = await prisma.whatsAppQrCode.findMany({
      where: creds.phoneNumberId ? { phoneNumberId: creds.phoneNumberId } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, qrCodes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phoneNumberId, prefilledText, generateQrImg = "PNG" } = body;

    if (!prefilledText || !String(prefilledText).trim()) {
      return NextResponse.json(
        { success: false, error: "Prefilled message is required" },
        { status: 400 }
      );
    }

    const creds = await resolvePhoneCredentials(phoneNumberId);
    if (!creds.phoneNumberId || !creds.accessToken) {
      return NextResponse.json(
        { success: false, error: "Phone Number ID or Meta Access Token missing" },
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
      `https://wa.me/${creds.phoneNumberId}?text=${encodeURIComponent(String(prefilledText).trim())}`;

    const saved = await prisma.whatsAppQrCode.create({
      data: {
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}