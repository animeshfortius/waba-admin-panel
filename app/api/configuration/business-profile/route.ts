import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Meta se live Business Profile fetch karne ke liye GET route
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
    }

    const channel = await prisma.wabaAccount.findUnique({
      where: { id },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    let metaProfile = {
      description: channel.description || "",
      email: channel.email || "",
      address: channel.address || "",
      website: channel.website || "",
      category: channel.category || "Other",
      profilePicture: channel.profilePicture || "",
    };

    // Meta Graph API se live profile fetch karo
    if (channel.accessToken && !channel.accessToken.startsWith("mock_token") && channel.phoneNumberId) {
      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/v18.0/${channel.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,websites,vertical,profile_picture_url`,
          {
            headers: { Authorization: `Bearer ${channel.accessToken}` },
          }
        );
        const metaData = await metaRes.json();
        if (metaData.data && metaData.data.length > 0) {
          const p = metaData.data[0];
          metaProfile = {
            description: p.about || p.description || channel.description || "",
            email: p.email || channel.email || "",
            address: p.address || channel.address || "",
            website: (p.websites && p.websites[0]) || channel.website || "",
            category: p.vertical || channel.category || "Other",
            profilePicture: p.profile_picture_url || channel.profilePicture || "",
          };
        }
      } catch (err) {
        console.error("Error fetching profile from Meta:", err);
      }
    }

    return NextResponse.json({ success: true, data: metaProfile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, displayName, description, email, address, website, category } = body;

    if (!id) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
    }

    const channel = await prisma.wabaAccount.findUnique({
      where: { id },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.accessToken && !channel.accessToken.startsWith("mock_token") && channel.phoneNumberId) {
      try {
        await fetch(
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
      } catch (metaErr) {
        console.error("Failed to sync profile with Meta BM:", metaErr);
      }
    }

    const updatedChannel = await prisma.wabaAccount.update({
      where: { id },
      data: { displayName, description, email, address, website, category },
    });

    return NextResponse.json({ success: true, data: updatedChannel });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}