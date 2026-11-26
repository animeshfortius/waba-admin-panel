import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-auth";

const META_GRAPH_VERSION = "v26.0";

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
    let {
      code,
      wabaId,
      phoneNumberId,
      displayPhone,
      name,
      website,
      accessToken,
      userId,
    } = body;

    const requestedOwnerId = userId ? String(userId).trim() : "";
    const targetOwnerId =
      requestedOwnerId &&
      (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(requestedOwnerId))
        ? requestedOwnerId
        : tenant.userId;

    const appId = String(
      process.env.NEXT_PUBLIC_META_APP_ID || "1405995811146008"
    ).trim();
    const appSecret = String(process.env.META_APP_SECRET || "").trim();
    const smartpingAuthKey = String(
      process.env.SMARTPING_AUTH_KEY || ""
    ).trim();

    // 1. Token Exchange & Auto Fetch IDs
    if (code && appId && appSecret) {
      try {
        const tokenParams = new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          code: String(code).trim(),
          redirect_uri: "",
        });
        const tokenUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token?${tokenParams.toString()}`;
        const tokenRes = await fetch(tokenUrl, { cache: "no-store" });
        const tokenData = await tokenRes.json();

        if (tokenData.access_token) {
          accessToken = String(tokenData.access_token).trim();

          if (!wabaId) {
            const debugParams = new URLSearchParams({
              input_token: accessToken,
              access_token: `${appId}|${appSecret}`,
            });
            const debugUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/debug_token?${debugParams.toString()}`;
            const debugRes = await fetch(debugUrl, { cache: "no-store" });
            const debugData = await debugRes.json();

            if (debugData.data && debugData.data.granular_scopes) {
              const wabaScope = debugData.data.granular_scopes.find(
                (s: any) => s.scope === "whatsapp_business_management"
              );
              if (
                wabaScope &&
                wabaScope.target_ids &&
                wabaScope.target_ids.length > 0
              ) {
                wabaId = wabaScope.target_ids[0];
              }
            }
          }

          if (!wabaId) {
            const meParams = new URLSearchParams({
              access_token: accessToken,
            });
            const meUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/me/whatsapp_business_accounts?${meParams.toString()}`;
            const meRes = await fetch(meUrl, { cache: "no-store" });
            const meData = await meRes.json();
            if (meData.data && meData.data.length > 0) {
              wabaId = meData.data[0].id;
              name = meData.data[0].name || name;
            }
          }

          if (wabaId && !phoneNumberId) {
            const phoneParams = new URLSearchParams({
              access_token: accessToken,
            });
            const phoneUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${wabaId}/phone_numbers?${phoneParams.toString()}`;
            const phoneRes = await fetch(phoneUrl, { cache: "no-store" });
            const phoneData = await phoneRes.json();
            if (phoneData.data && phoneData.data.length > 0) {
              phoneNumberId = phoneData.data[0].id;
              displayPhone =
                phoneData.data[0].display_phone_number || displayPhone;
              name = phoneData.data[0].verified_name || name;
            }
          }
        }
      } catch (err) {
        console.error("Auto fetch error:", err);
      }
    }

    const cleanWabaId = wabaId ? String(wabaId).replace("WABA_", "").trim() : "";
    const cleanPhoneId = phoneNumberId
      ? String(phoneNumberId).replace("PHONE_", "").trim()
      : "";

    if (!cleanWabaId || !cleanPhoneId) {
      return NextResponse.json(
        {
          error:
            "Meta se real WABA ID / Phone ID automatic fetch nahi ho payi. Please try again.",
        },
        { status: 400 }
      );
    }

    // Prevent non-admin from claiming/overwriting a WABA owned by another tenant
    const existingWaba = await prisma.wabaAccount.findUnique({
      where: { wabaId: cleanWabaId },
    });

    if (
      existingWaba &&
      !tenant.isSuperAdmin &&
      !tenant.allowedUserIds?.includes(existingWaba.userId)
    ) {
      return NextResponse.json(
        { error: "This WABA ID is already bound to another account" },
        { status: 403 }
      );
    }

    // 2. AUTOMATED APIS: Phone Registration, Webhook Auto-Subscribe & Smartping Credit Line Attach
    if (cleanPhoneId && accessToken) {
      try {
        const registerUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanPhoneId}/register`;
        await fetch(registerUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            pin: "123456",
          }),
        });

        const subscribeUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanWabaId}/subscribed_apps`;
        const subRes = await fetch(subscribeUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        const subData = await subRes.json();
        console.log("Auto-Subscribe Webhook Response:", subData);

        if (smartpingAuthKey) {
          const cleanPhone = displayPhone
            ? String(displayPhone).replace(/[^0-9]/g, "")
            : cleanPhoneId;
          const smartpingParams = new URLSearchParams({
            wabaId: cleanWabaId,
            wabaNumber: cleanPhone,
          });
          const smartpingUrl = `https://wabalens.smartping.io/MetaAPI/metapp/api/v1/wabas/attach?${smartpingParams.toString()}`;

          await fetch(smartpingUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${smartpingAuthKey}`,
              "Content-Type": "application/json",
            },
          });
        }
      } catch (apiErr) {
        console.error("Automated API execution error:", apiErr);
      }
    }

    // 2.1 Fetch Live Messaging Limit & Quality Rating from Meta
    let liveMessagingLimit = "TIER_NOT_FOUND";
    let liveQualityRating = "UNKNOWN";
    try {
      if (accessToken && cleanWabaId) {
        const limitRes = await fetch(
          `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanWabaId}?fields=messaging_limit_tier`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          }
        );
        const limitData = await limitRes.json();
        if (limitData.messaging_limit_tier) {
          liveMessagingLimit = limitData.messaging_limit_tier;
        }
      }
      if (accessToken && cleanPhoneId) {
        const ratingRes = await fetch(
          `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanPhoneId}?fields=quality_rating`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          }
        );
        const ratingData = await ratingRes.json();
        if (ratingData.quality_rating) {
          liveQualityRating = ratingData.quality_rating;
        }
      }
    } catch (fetchErr) {
      console.error("Error fetching live tier/rating on register:", fetchErr);
    }

    const finalOwnerId = existingWaba?.userId || targetOwnerId;
    const tokenToStore = String(accessToken || code || "").trim();

    // 3. Save to Database via Upsert bound strictly to scoped owner
    const newAccount = await prisma.wabaAccount.upsert({
      where: { wabaId: cleanWabaId },
      update: {
        userId: finalOwnerId,
        phoneNumberId: cleanPhoneId,
        displayPhone: displayPhone ? String(displayPhone).trim() : "",
        accessToken: tokenToStore,
        displayName: name ? String(name).trim() : "FORTIUS TELECOM",
        website: website ? String(website).trim() : "",
        status: "ACTIVE",
        messagingLimit: liveMessagingLimit,
        qualityRating: liveQualityRating,
      },
      create: {
        userId: finalOwnerId,
        wabaId: cleanWabaId,
        phoneNumberId: cleanPhoneId,
        displayPhone: displayPhone ? String(displayPhone).trim() : "",
        accessToken: tokenToStore,
        displayName: name ? String(name).trim() : "FORTIUS TELECOM",
        website: website ? String(website).trim() : "",
        status: "ACTIVE",
        messagingLimit: liveMessagingLimit,
        qualityRating: liveQualityRating,
      },
    });

    const { accessToken: _hiddenToken, ...safeAccount } = newAccount as any;

    return NextResponse.json({
      success: true,
      data: {
        ...safeAccount,
        hasAccessToken: Boolean(newAccount.accessToken),
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}