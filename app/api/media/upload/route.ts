import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

const META_GRAPH_VERSION = "v23.0";

export async function POST(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const rawFile = formData.get("file");
    const rawWabaId = formData.get("wabaId");
    const requestedUserId = String(formData.get("userId") || "").trim();

    if (!rawFile || !(rawFile instanceof File) || rawFile.size === 0) {
      return NextResponse.json(
        { success: false, error: "No valid file provided" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const scopedWhere: any = { ...ownerWhere };

    if (
      requestedUserId &&
      requestedUserId !== "ALL" &&
      requestedUserId !== "undefined" &&
      requestedUserId !== "null"
    ) {
      if (
        !tenant.isSuperAdmin &&
        !tenant.allowedUserIds?.includes(requestedUserId)
      ) {
        return NextResponse.json(
          { success: false, error: "Access denied for requested user" },
          { status: 403 }
        );
      }
      scopedWhere.userId = requestedUserId;
    }

    const channelParam =
      typeof rawWabaId === "string" && rawWabaId.trim().length > 0
        ? rawWabaId.trim()
        : "";
    const cleanChannel = channelParam
      .replace(/^PHONE_/i, "")
      .replace(/^\+/, "")
      .trim();

    const accounts = await prisma.wabaAccount.findMany({
      where: scopedWhere,
      orderBy: { createdAt: "desc" },
    });

    const wabaAccount =
      accounts.find((acc: any) => {
        const accId = String(acc.id || "").trim();
        const accWaba = String(acc.wabaId || "").trim();
        const accPhoneId = String(acc.phoneNumberId || "")
          .replace(/^PHONE_/i, "")
          .trim();
        const accPhone = String(acc.displayPhone || "")
          .replace(/^\+/, "")
          .trim();

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
    const accessToken = String(wabaAccount?.accessToken || "").trim();

    if (!wabaAccount || !cleanPhoneId || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Scoped WABA credentials not found.",
        },
        { status: 404 }
      );
    }

    const fileBuffer = Buffer.from(await rawFile.arrayBuffer());
    const mimeType = rawFile.type || "application/octet-stream";
    const blob = new Blob([fileBuffer], { type: mimeType });

    const metaFormData = new FormData();
    metaFormData.append("messaging_product", "whatsapp");
    metaFormData.append("type", mimeType);
    metaFormData.append("file", blob, rawFile.name || "upload");

    const uploadRes = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(
        cleanPhoneId
      )}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: metaFormData,
        cache: "no-store",
      }
    );

    const uploadData = await uploadRes.json().catch(() => ({}));

    if (uploadRes.ok && uploadData && uploadData.id) {
      return NextResponse.json({
        success: true,
        mediaId: uploadData.id,
        fileName: rawFile.name,
        mimeType,
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