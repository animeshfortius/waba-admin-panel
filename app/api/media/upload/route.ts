import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const rawFile = formData.get("file");
    const rawWabaId = formData.get("wabaId");

    if (!rawFile || !(rawFile instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No valid file provided" },
        { status: 400 }
      );
    }

    const channelParam =
      typeof rawWabaId === "string" && rawWabaId.trim().length > 0
        ? rawWabaId.trim()
        : "";
    const cleanChannel = channelParam.replace(/^PHONE_/i, "").replace(/^\+/, "").trim();

    const accounts = await prisma.wabaAccount.findMany();

    const wabaAccount =
      accounts.find((acc: any) => {
        const accId = String(acc.id || "").trim();
        const accWaba = String(acc.wabaId || "").trim();
        const accPhoneId = String(acc.phoneNumberId || "").replace(/^PHONE_/i, "").trim();
        const accPhone = String(acc.displayPhone || "").replace(/^\+/, "").trim();

        return (
          (channelParam &&
            (accId === channelParam ||
              accWaba === channelParam ||
              String(acc.phoneNumberId || "").trim() === channelParam)) ||
          (cleanChannel &&
            (accId === cleanChannel ||
              accWaba === cleanChannel ||
              accPhoneId === cleanChannel ||
              accPhone === cleanChannel))
        );
      }) ||
      accounts.find((acc: any) => acc.isDefault) ||
      accounts[0] ||
      null;

    const cleanPhoneId = String(wabaAccount?.phoneNumberId || "")
      .replace(/^PHONE_/i, "")
      .trim();
    const accessToken = String(
      wabaAccount?.accessToken || process.env.META_ACCESS_TOKEN || ""
    ).trim();

    if (!cleanPhoneId || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "WABA credentials not found in database.",
        },
        { status: 404 }
      );
    }

    const fileBuffer = Buffer.from(await rawFile.arrayBuffer());
    const blob = new Blob([fileBuffer], {
      type: rawFile.type || "application/octet-stream",
    });

    const metaFormData = new FormData();
    metaFormData.append("messaging_product", "whatsapp");
    metaFormData.append("type", rawFile.type || "application/octet-stream");
    metaFormData.append("file", blob, rawFile.name || "upload");

    const uploadRes = await fetch(
      `https://graph.facebook.com/v23.0/${encodeURIComponent(cleanPhoneId)}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: metaFormData,
      }
    );

    const uploadData = await uploadRes.json().catch(() => ({}));

    if (uploadRes.ok && uploadData && uploadData.id) {
      return NextResponse.json({
        success: true,
        mediaId: uploadData.id,
        fileName: rawFile.name,
        mimeType: rawFile.type || "application/octet-stream",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          uploadData?.error?.message ||
          "Failed to upload media to Meta Graph API",
        metaError: uploadData?.error || null,
      },
      { status: uploadRes.status >= 400 ? uploadRes.status : 400 }
    );
  } catch (error: unknown) {
    console.error("Media Upload Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}