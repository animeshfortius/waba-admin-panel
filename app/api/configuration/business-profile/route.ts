import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, displayName, description, email, address, website, category } = body;

    if (!id) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
    }

    // 1. Channel find karo jisse accessToken aur phoneNumberId mil sake
    const channel = await prisma.wabaAccount.findUnique({
      where: { id },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // 2. Meta Graph API ko call karke Business Profile update karo (Agar mock token nahi hai)
    if (channel.accessToken && !channel.accessToken.startsWith("mock_token") && channel.phoneNumberId) {
      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/v18.0/${channel.phoneNumberId}/whatsapp_business_profile`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${channel.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              about: description || "",
              address: address || "",
              description: description || "",
              email: email || "",
              websites: website ? [website] : [],
              vertical: category || "Other",
            }),
          }
        );
        const metaData = await metaRes.json();
        console.log("Meta BM Profile Sync Response:", metaData);
      } catch (metaErr) {
        console.error("Failed to sync profile with Meta BM:", metaErr);
      }
    }

    // 3. Apne Database me bhi update save kar lo
    const updatedChannel = await prisma.wabaAccount.update({
      where: { id },
      data: {
        displayName,
        description,
        email,
        address,
        website,
        category,
      },
    });

    return NextResponse.json({ success: true, data: updatedChannel });
  } catch (error: any) {
    console.error("Business profile update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}