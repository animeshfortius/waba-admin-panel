import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      displayName: channel.displayName || "",
      description: channel.description || "",
      email: channel.email || "",
      address: channel.address || "",
      website: channel.website || "",
      category: channel.category || "PROFESSIONAL_SERVICES",
      profilePicture: channel.profilePicture || "",
    };

    if (channel.accessToken && !channel.accessToken.startsWith("mock_token") && channel.phoneNumberId) {
      try {
        const cleanPhoneId = channel.phoneNumberId.replace("PHONE_", "").trim();
        const metaRes = await fetch(
          `https://graph.facebook.com/v26.0/${cleanPhoneId}/whatsapp_business_profile?fields=about,address,description,email,websites,vertical,profile_picture_url`,
          {
            headers: { Authorization: `Bearer ${channel.accessToken}` },
          }
        );
        const metaData = await metaRes.json();
        
        // Meta returns profile data in data array or directly
        const p = metaData?.data?.[0] || metaData;
        if (p) {
          metaProfile = {
            displayName: channel.displayName || "",
            description: p.about || p.description || channel.description || "",
            email: p.email || channel.email || "",
            address: p.address || channel.address || "",
            website: (Array.isArray(p.websites) ? p.websites[0] : p.websites) || channel.website || "",
            category: p.vertical || channel.category || "PROFESSIONAL_SERVICES",
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
    const { id, displayName, description, email, address, website, category, profilePicture } = body;

    if (!id) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
    }

    const channel = await prisma.wabaAccount.findUnique({
      where: { id },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    let metaSyncSuccess = false;
    let metaErrorResponse = null;

    if (channel.accessToken && !channel.accessToken.startsWith("mock_token") && channel.phoneNumberId) {
      try {
        const cleanPhoneId = channel.phoneNumberId.replace("PHONE_", "").trim();
        
        // Payload for Meta v26.0
        const payload: any = {
          messaging_product: "whatsapp",
          about: description || "Professional Business Communication",
          address: address || "",
          description: description || "",
          email: email || "",
          websites: website ? [website] : [],
          vertical: category || "PROFESSIONAL_SERVICES",
        };

        if (profilePicture) {
          payload.profile_picture_url = profilePicture;
        }

        const metaRes = await fetch(
          `https://graph.facebook.com/v26.0/${cleanPhoneId}/whatsapp_business_profile`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${channel.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const metaResult = await metaRes.json();
        if (metaRes.ok) {
          metaSyncSuccess = true;
        } else {
          metaErrorResponse = metaResult;
          console.error("Meta Profile Sync Error:", metaResult);
        }
      } catch (metaErr) {
        console.error("Meta Profile Sync Exception:", metaErr);
      }
    }

    // Update in database including category & profile picture
    const updatedChannel = await prisma.wabaAccount.update({
      where: { id },
      data: { 
        displayName: displayName || channel.displayName, 
        description, 
        email, 
        address, 
        website, 
        category: category || channel.category,
        profilePicture: profilePicture || channel.profilePicture 
      },
    });

    return NextResponse.json({ 
      success: true, 
      metaSynced: metaSyncSuccess, 
      metaError: metaErrorResponse,
      data: updatedChannel 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}