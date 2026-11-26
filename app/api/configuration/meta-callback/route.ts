import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-auth";

const META_GRAPH_VERSION = "v21.0";

export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const code = body?.code ? String(body.code).trim() : "";
    const requestedUserId = body?.userId ? String(body.userId).trim() : "";
    const companyName = body?.companyName ? String(body.companyName).trim() : "";

    // Resolve target user strictly within tenant scope
    const targetUserId =
      requestedUserId &&
      (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(requestedUserId))
        ? requestedUserId
        : tenant.userId;

    const appId = String(process.env.NEXT_PUBLIC_META_APP_ID || "").trim();
    const appSecret = String(process.env.META_APP_SECRET || "").trim();

    let wabaId = "WABA_" + Math.floor(100000 + Math.random() * 900000);
    let phoneNumberId =
      "PHONE_ID_" + Math.floor(100000 + Math.random() * 900000);
    let displayPhone = "1555" + Math.floor(1000000 + Math.random() * 9000000);
    let displayName = companyName || "WhatsApp Business";
    let accessToken = "mock_token_" + Date.now();

    if (code && appId && appSecret) {
      const tokenUrl = new URL(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`
      );
      tokenUrl.searchParams.set("client_id", appId);
      tokenUrl.searchParams.set("client_secret", appSecret);
      tokenUrl.searchParams.set("code", code);

      const tokenRes = await fetch(tokenUrl.toString(), {
        method: "GET",
        cache: "no-store",
      });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData?.access_token) {
        return NextResponse.json(
          {
            success: false,
            error:
              tokenData?.error?.message ||
              "Failed to exchange authorization code with Meta",
          },
          { status: 400 }
        );
      }

      accessToken = String(tokenData.access_token).trim();

      try {
        const debugRes = await fetch(
          `https://graph.facebook.com/${META_GRAPH_VERSION}/debug_token?input_token=${encodeURIComponent(
            accessToken
          )}`,
          {
            headers: {
              Authorization: `Bearer ${appId}|${appSecret}`,
            },
            cache: "no-store",
          }
        );
        const debugData = await debugRes.json();
        const granularScopes = debugData?.data?.granular_scopes || [];
        const wabaScope = granularScopes.find(
          (s: any) =>
            s?.scope === "whatsapp_business_management" ||
            s?.scope === "whatsapp_business_messaging"
        );

        if (Array.isArray(wabaScope?.target_ids) && wabaScope.target_ids[0]) {
          wabaId = String(wabaScope.target_ids[0]).trim();
        }

        if (wabaId && !wabaId.startsWith("WABA_")) {
          const phonesRes = await fetch(
            `https://graph.facebook.com/${META_GRAPH_VERSION}/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              cache: "no-store",
            }
          );
          const phonesData = await phonesRes.json();
          const firstPhone = phonesData?.data?.[0];

          if (firstPhone?.id) {
            phoneNumberId = String(firstPhone.id).trim();
          }
          if (firstPhone?.display_phone_number) {
            displayPhone = String(firstPhone.display_phone_number).trim();
          }
          if (!companyName && firstPhone?.verified_name) {
            displayName = String(firstPhone.verified_name).trim();
          }
        }
      } catch (metaFetchErr) {
        console.error("Meta WABA details lookup warning:", metaFetchErr);
      }
    }

    const newChannel = await prisma.wabaAccount.create({
      data: {
        userId: targetUserId,
        wabaId,
        phoneNumberId,
        displayPhone,
        displayName,
        accessToken,
        status: "ACTIVE",
      },
    });

    const { accessToken: _hiddenToken, ...safeChannel } = newChannel as any;

    return NextResponse.json({
      success: true,
      channel: {
        ...safeChannel,
        hasAccessToken: Boolean(newChannel.accessToken),
      },
    });
  } catch (error: any) {
    console.error("Meta callback connect error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to connect Meta channel",
      },
      { status: 500 }
    );
  }
}