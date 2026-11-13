import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const wabaId = formData.get("wabaId") as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const wabaAccount = await prisma.wabaAccount.findFirst({
      where: wabaId ? { wabaId } : {},
    });

    if (!wabaAccount || !wabaAccount.accessToken || !wabaAccount.phoneNumberId) {
      return NextResponse.json({ success: false, error: "WABA credentials not found in database." }, { status: 404 });
    }

    const cleanPhoneId = wabaAccount.phoneNumberId.replace("PHONE_", "").trim();
    const accessToken = wabaAccount.accessToken.trim();

    const metaFormData = new FormData();
    metaFormData.append("file", file);
    metaFormData.append("messaging_product", "whatsapp");

    const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${cleanPhoneId}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: metaFormData,
    });

    const uploadData = await uploadRes.json();

    if (uploadRes.ok && uploadData && uploadData.id) {
      return NextResponse.json({
        success: true,
        mediaId: uploadData.id,
        fileName: file.name,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: uploadData.error?.message || "Failed to upload media to Meta Graph API",
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Media Upload Route Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}