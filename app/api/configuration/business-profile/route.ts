import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

const META_VERSION = "v21.0";

export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const channel = await prisma.wabaAccount.findFirst({
      where: { id, ...ownerWhere },
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found or access denied" },
        { status: 404 }
      );
    }

    let metaProfile = {
      displayName: channel.displayName || "",
      description: channel.description || "",
      email: channel.email || "",
      address: channel.address || "",
      website: channel.website || "",
      category: channel.category || "OTHER",
      profilePicture: channel.profilePicture || "",
    };

    if (
      channel.accessToken &&
      !channel.accessToken.startsWith("mock_token") &&
      channel.phoneNumberId
    ) {
      try {
        const cleanPhoneId = channel.phoneNumberId.replace("PHONE_", "").trim();
        const metaRes = await fetch(
          `https://graph.facebook.com/${META_VERSION}/${cleanPhoneId}/whatsapp_business_profile?fields=about,address,description,email,websites,vertical,profile_picture_url`,
          {
            headers: { Authorization: `Bearer ${channel.accessToken.trim()}` },
            cache: "no-store",
          }
        );
        const metaData = await metaRes.json();

        const p = metaData?.data?.[0] || metaData;
        if (p && !p.error) {
          metaProfile = {
            displayName: channel.displayName || "",
            description:
              p.about || p.description || channel.description || "",
            email: p.email || channel.email || "",
            address: p.address || channel.address || "",
            website:
              (Array.isArray(p.websites) ? p.websites[0] : p.websites) ||
              channel.website ||
              "",
            category: p.vertical || channel.category || "OTHER",
            profilePicture:
              p.profile_picture_url || channel.profilePicture || "",
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
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = String(body?.id || "").trim();
    const {
      displayName,
      description,
      email,
      address,
      website,
      category,
      profilePicture,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const channel = await prisma.wabaAccount.findFirst({
      where: { id, ...ownerWhere },
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found or access denied" },
        { status: 404 }
      );
    }

    const nextDescription =
      description !== undefined ? description : channel.description || "";
    const nextEmail = email !== undefined ? email : channel.email || "";
    const nextAddress = address !== undefined ? address : channel.address || "";
    const nextWebsite = website !== undefined ? website : channel.website || "";
    const nextCategory = category || channel.category || "OTHER";
    const nextProfilePicture =
      profilePicture !== undefined
        ? profilePicture
        : channel.profilePicture || "";

    let metaSyncSuccess = false;
    let metaErrorResponse = null;

    if (
      channel.accessToken &&
      !channel.accessToken.startsWith("mock_token") &&
      channel.phoneNumberId
    ) {
      try {
        const cleanPhoneId = channel.phoneNumberId.replace("PHONE_", "").trim();

        let formattedVertical = String(nextCategory)
          .trim()
          .toUpperCase();
        if (
          formattedVertical.includes("HOTEL") ||
          formattedVertical.includes("LODGING")
        ) {
          formattedVertical = "HOTEL";
        } else if (
          formattedVertical.includes("PROFESSIONAL") ||
          formattedVertical.includes("SERVICE")
        ) {
          formattedVertical = "PROF_SERVICES";
        } else if (!formattedVertical) {
          formattedVertical = "OTHER";
        }

        const payload: any = {
          messaging_product: "whatsapp",
          about: nextDescription || "Professional Business Communication",
          address: nextAddress || "",
          description: nextDescription || "",
          email: nextEmail || "",
          websites: nextWebsite ? [nextWebsite] : [],
          vertical: formattedVertical,
        };

        if (nextProfilePicture) {
          payload.profile_picture_url = nextProfilePicture;
        }

        const metaRes = await fetch(
          `https://graph.facebook.com/${META_VERSION}/${cleanPhoneId}/whatsapp_business_profile`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${channel.accessToken.trim()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const metaResult = await metaRes.json();
        if (metaRes.ok && metaResult.success) {
          metaSyncSuccess = true;
        } else {
          metaErrorResponse = metaResult;
          console.error("Meta Profile Sync Error:", metaResult);
        }
      } catch (metaErr) {
        console.error("Meta Profile Sync Exception:", metaErr);
      }
    }

    const updatedChannel = await prisma.wabaAccount.update({
      where: { id: channel.id },
      data: {
        displayName: displayName || channel.displayName,
        description: nextDescription,
        email: nextEmail,
        address: nextAddress,
        website: nextWebsite,
        category: nextCategory,
        profilePicture: nextProfilePicture,
      },
    });

    return NextResponse.json({
      success: true,
      metaSynced: metaSyncSuccess,
      metaError: metaErrorResponse,
      data: updatedChannel,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}