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

    const wabaId =
      typeof rawWabaId === "string" && rawWabaId.trim().length > 0
        ? rawWabaId.trim()
        : undefined;

    const wabaAccount = await prisma.wabaAccount.findFirst({
      where: wabaId ? { wabaId } : {},
    });

    if (
      !wabaAccount ||
      !wabaAccount.accessToken ||
      !wabaAccount.phoneNumberId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "WABA credentials not found in database.",
        },
        { status: 404 }
      );
    }

    const cleanPhoneId = wabaAccount.phoneNumberId.replace("PHONE_", "").trim();
    const accessToken = wabaAccount.accessToken.trim();

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