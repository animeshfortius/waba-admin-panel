import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

const META_GRAPH_VERSION = "v21.0";

export async function GET(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId")?.trim() || "";
    const action = searchParams.get("action")?.trim() || "";

    const ownerWhere = getOwnerWhere(tenant);

    // Scope WABA accounts strictly to tenant hierarchy
    let accounts = await prisma.wabaAccount.findMany({
      where: ownerWhere,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        wabaId: true,
        phoneNumberId: true,
        displayPhone: true,
        displayName: true,
        accessToken: true,
      },
    });

    if (
      requestedUserId &&
      requestedUserId !== "undefined" &&
      requestedUserId !== "null" &&
      requestedUserId !== "emergency_admin_id"
    ) {
      if (tenant.isSuperAdmin) {
        const filtered = accounts.filter((acc) => acc.userId === requestedUserId);
        if (filtered.length > 0) accounts = filtered;
      } else if (tenant.allowedUserIds?.includes(requestedUserId)) {
        accounts = accounts.filter((acc) => acc.userId === requestedUserId);
      }
    }

    if (action === "GET_RECLASSIFIED") {
      const reviewableTemplates: any[] = [];

      for (const acc of accounts) {
        const token = String(acc.accessToken || "").trim();
        if (!token || token.startsWith("mock_token")) continue;
        const cleanWabaId = String(acc.wabaId || "")
          .replace(/^WABA_/i, "")
          .trim();
        if (!cleanWabaId) continue;

        try {
          const metaRes = await fetch(
            `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(
              cleanWabaId
            )}/message_templates?limit=250`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            }
          );
          const metaData = await metaRes.json().catch(() => ({}));

          if (metaRes.ok && Array.isArray(metaData.data)) {
            for (const tpl of metaData.data) {
              if (
                tpl.status === "REJECTED" ||
                tpl.category_update ||
                tpl.previous_category ||
                tpl.status === "FLAGGED"
              ) {
                reviewableTemplates.push({
                  wabaId: acc.wabaId,
                  wabaNumber: acc.displayPhone || "N/A",
                  metaTemplateId: tpl.id,
                  name: tpl.name,
                  language: tpl.language || "en_US",
                  category: tpl.category,
                  previousCategory: tpl.previous_category || "UTILITY",
                  status: tpl.status,
                });
              }
            }
          }
        } catch (metaErr) {
          console.error(`Meta fetch error for WABA ${acc.wabaId}:`, metaErr);
        }
      }

      return NextResponse.json({
        success: true,
        reviewableTemplates,
      });
    }

    const scopedWabaIds = accounts.map((acc) => acc.wabaId).filter(Boolean);
    const templateWhere: any = {
      ...ownerWhere,
      ...(scopedWabaIds.length > 0 && !tenant.isSuperAdmin
        ? { wabaId: { in: scopedWabaIds } }
        : accounts.length === 0 && !tenant.isSuperAdmin
        ? { wabaId: "__NONE__" }
        : {}),
    };

    let templates: any[] = [];
    try {
      templates = await prisma.whatsAppTemplate.findMany({
        where: templateWhere,
        orderBy: { createdAt: "desc" },
      });
    } catch (e) {
      console.error("Template fetch error:", e);
    }

    let userRates = {
      marketing: 0.8046,
      utility: 0.155,
      authentication: 0.155,
      service: 0.155,
    };

    try {
      const rateTargetUserId =
        requestedUserId &&
        requestedUserId !== "undefined" &&
        requestedUserId !== "null" &&
        (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(requestedUserId))
          ? requestedUserId
          : tenant.userId;

      const dbUser = await prisma.user.findUnique({
        where: { id: rateTargetUserId },
      });

      if (dbUser) {
        userRates = {
          marketing: Number(dbUser.perMsgRate ?? 0.8046),
          utility: Number(dbUser.utilityRate ?? 0.155),
          authentication: Number(dbUser.authRate ?? 0.155),
          service: Number(dbUser.serviceRate ?? 0.155),
        };
      }
    } catch (rateErr) {
      console.error("Error fetching user pricing rates:", rateErr);
    }

    const safeAccounts = accounts.map(({ accessToken: _t, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      templates,
      wabaAccounts: safeAccounts,
      userRates,
    });
  } catch (error: any) {
    console.error("GET Templates Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch templates",
        wabaAccounts: [],
        templates: [],
        reviewableTemplates: [],
        userRates: {
          marketing: 0.8046,
          utility: 0.155,
          authentication: 0.155,
          service: 0.155,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { action, templateId } = body;
    const ownerWhere = getOwnerWhere(tenant);

    if (action === "SYNC_SINGLE") {
      if (!templateId) {
        return NextResponse.json(
          { success: false, error: "Template ID missing" },
          { status: 400 }
        );
      }

      const targetTemplate = await prisma.whatsAppTemplate.findFirst({
        where: { id: String(templateId).trim(), ...ownerWhere },
      });
      if (!targetTemplate) {
        return NextResponse.json(
          { success: false, error: "Template not found or access denied" },
          { status: 404 }
        );
      }

      const wabaAccount = await prisma.wabaAccount.findFirst({
        where: { wabaId: targetTemplate.wabaId, ...ownerWhere },
      });
      const token = String(wabaAccount?.accessToken || "").trim();
      if (!wabaAccount || !token) {
        return NextResponse.json(
          { success: false, error: "Access token not found" },
          { status: 404 }
        );
      }

      const metaTemplateId = String(targetTemplate.metaTemplateId || "").trim();
      if (!metaTemplateId) {
        return NextResponse.json(
          {
            success: false,
            error: "Meta Template ID not found; run full template sync instead",
          },
          { status: 400 }
        );
      }

      const metaRes = await fetch(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(
          metaTemplateId
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      const metaData = await metaRes.json().catch(() => ({}));

      if (!metaRes.ok || metaData.error) {
        return NextResponse.json(
          {
            success: false,
            error: metaData?.error?.message || "Failed to sync template from Meta",
          },
          { status: 400 }
        );
      }

      const updatedTemplate = await prisma.whatsAppTemplate.update({
        where: { id: targetTemplate.id },
        data: {
          status: metaData.status || targetTemplate.status,
          category: metaData.category || targetTemplate.category,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Template synced successfully!",
        template: updatedTemplate,
      });
    }

    const accountsToSync = await prisma.wabaAccount.findMany({
      where: ownerWhere,
      orderBy: { createdAt: "asc" },
    });
    let syncedCount = 0;

    for (const acc of accountsToSync) {
      const token = String(acc.accessToken || "").trim();
      if (!token || token.startsWith("mock_token")) continue;
      const cleanWabaId = String(acc.wabaId || "")
        .replace(/^WABA_/i, "")
        .trim();
      if (!cleanWabaId) continue;

      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(
            cleanWabaId
          )}/message_templates?limit=250`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );
        const metaData = await metaRes.json().catch(() => ({}));

        if (metaRes.ok && Array.isArray(metaData.data)) {
          for (const tpl of metaData.data) {
            const headerComp = tpl.components?.find(
              (c: any) => c.type === "HEADER"
            );
            const bodyComp = tpl.components?.find((c: any) => c.type === "BODY");
            const footerComp = tpl.components?.find(
              (c: any) => c.type === "FOOTER"
            );
            const buttonsComp = tpl.components?.find(
              (c: any) => c.type === "BUTTONS"
            );

            const existing = await prisma.whatsAppTemplate.findFirst({
              where: {
                wabaId: acc.wabaId,
                OR: [
                  { metaTemplateId: tpl.id },
                  { name: tpl.name, language: tpl.language },
                ],
              },
            });

            const payload = {
              userId: acc.userId || tenant.userId,
              wabaId: acc.wabaId,
              wabaNumber: acc.displayPhone,
              metaTemplateId: tpl.id,
              name: tpl.name,
              language: tpl.language,
              category: tpl.category,
              status: tpl.status,
              headerType: headerComp?.format || "NONE",
              headerText: headerComp?.text || null,
              bodyText: bodyComp?.text || "",
              footerText: footerComp?.text || null,
              buttons: buttonsComp?.buttons || [],
              components: tpl.components || [],
            };

            if (existing) {
              await prisma.whatsAppTemplate.update({
                where: { id: existing.id },
                data: payload,
              });
            } else {
              await prisma.whatsAppTemplate.create({ data: payload });
            }
            syncedCount++;
          }
        }
      } catch (syncErr) {
        console.error(`Sync error for WABA ${acc.wabaId}:`, syncErr);
      }
    }

    const scopedWabaIds = accountsToSync.map((a) => a.wabaId).filter(Boolean);
    const updatedTemplates = await prisma.whatsAppTemplate.findMany({
      where: {
        ...ownerWhere,
        ...(scopedWabaIds.length > 0 && !tenant.isSuperAdmin
          ? { wabaId: { in: scopedWabaIds } }
          : accountsToSync.length === 0 && !tenant.isSuperAdmin
          ? { wabaId: "__NONE__" }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} templates from Meta successfully!`,
      syncedCount,
      templates: updatedTemplates,
      data: updatedTemplates,
    });
  } catch (error: any) {
    console.error("POST Templates Route Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to sync templates" },
      { status: 500 }
    );
  }
}