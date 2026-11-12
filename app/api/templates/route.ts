import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");

    // 🔥 MASTER FIX: If sync/retrieve is requested via GET or query param, sync immediately
    if (action === "SYNC" || action === "RETRIEVE" || action === "SYNC_TEMPLATES" || searchParams.has("sync")) {
      const whereClause: any = {};
      if (userId && userId !== "undefined" && userId !== "null" && userId !== "emergency_admin_id") {
        whereClause.userId = userId;
      }

      let accounts = await prisma.wabaAccount.findMany({ where: whereClause });
      if (!accounts || accounts.length === 0) {
        accounts = await prisma.wabaAccount.findMany();
      }

      let syncedCount = 0;
      for (const acc of accounts) {
        if (!acc.accessToken) continue;
        const cleanWabaId = acc.wabaId.replace("WABA_", "").trim();

        try {
          const metaRes = await fetch(
            `https://graph.facebook.com/v21.0/${cleanWabaId}/message_templates?limit=250`,
            {
              headers: { Authorization: `Bearer ${acc.accessToken}` },
            }
          );
          const metaData = await metaRes.json();

          if (metaData.data && Array.isArray(metaData.data)) {
            for (const tpl of metaData.data) {
              const headerComp = tpl.components?.find((c: any) => c.type === "HEADER");
              const bodyComp = tpl.components?.find((c: any) => c.type === "BODY");
              const footerComp = tpl.components?.find((c: any) => c.type === "FOOTER");
              const buttonsComp = tpl.components?.find((c: any) => c.type === "BUTTONS");

              const existing = await prisma.whatsAppTemplate.findFirst({
                where: {
                  wabaId: acc.wabaId,
                  OR: [{ metaTemplateId: tpl.id }, { name: tpl.name, language: tpl.language }],
                },
              });

              const templatePayload = {
                userId: acc.userId || userId || "default_user",
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
                  data: templatePayload,
                });
              } else {
                await prisma.whatsAppTemplate.create({
                  data: templatePayload,
                });
              }
              syncedCount++;
            }
          }
        } catch (syncErr) {
          console.error(`Sync error for WABA ${acc.wabaId}:`, syncErr);
        }
      }
    }

    let accounts: any[] = [];
    let templates: any[] = [];

    try {
      if (userId && userId !== "undefined" && userId !== "null" && userId !== "emergency_admin_id") {
        accounts = await prisma.wabaAccount.findMany({
          where: { userId },
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
      }
    } catch (e) {
      console.error("User specific fetch error:", e);
    }

    if (accounts.length === 0) {
      try {
        accounts = await prisma.wabaAccount.findMany({
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
      } catch (e) {
        console.error("Global WabaAccount fetch error:", e);
      }
    }

    try {
      templates = await prisma.whatsAppTemplate.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch (e) {
      console.error("Template fetch error:", e);
    }

    return NextResponse.json({
      success: true,
      templates,
      wabaAccounts: accounts,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      wabaAccounts: [],
      templates: [],
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, wabaId, name, language, category, headerType, headerText, bodyText, footerText, buttons } = body;

    // 🔥 Support uppercase, lowercase, and alternative sync action keys
    if (action === "SYNC" || action === "RETRIEVE" || action === "SYNC_TEMPLATES" || action === "sync" || action === "retrieve") {
      const whereClause: any = {};
      if (wabaId && wabaId !== "ALL") whereClause.wabaId = wabaId;
      else if (userId) whereClause.userId = userId;

      let accounts = await prisma.wabaAccount.findMany({ where: whereClause });
      if (!accounts || accounts.length === 0) {
        accounts = await prisma.wabaAccount.findMany();
      }

      if (!accounts || accounts.length === 0) {
        return NextResponse.json({ success: false, error: "No onboarded WABA accounts found to sync" }, { status: 404 });
      }

      let syncedCount = 0;
      for (const acc of accounts) {
        if (!acc.accessToken) continue;
        const cleanWabaId = acc.wabaId.replace("WABA_", "").trim();

        try {
          const metaRes = await fetch(
            `https://graph.facebook.com/v21.0/${cleanWabaId}/message_templates?limit=250`,
            {
              headers: { Authorization: `Bearer ${acc.accessToken}` },
            }
          );
          const metaData = await metaRes.json();

          if (metaData.data && Array.isArray(metaData.data)) {
            for (const tpl of metaData.data) {
              const headerComp = tpl.components?.find((c: any) => c.type === "HEADER");
              const bodyComp = tpl.components?.find((c: any) => c.type === "BODY");
              const footerComp = tpl.components?.find((c: any) => c.type === "FOOTER");
              const buttonsComp = tpl.components?.find((c: any) => c.type === "BUTTONS");

              const existing = await prisma.whatsAppTemplate.findFirst({
                where: {
                  wabaId: acc.wabaId,
                  OR: [{ metaTemplateId: tpl.id }, { name: tpl.name, language: tpl.language }],
                },
              });

              const templatePayload = {
                userId: acc.userId || userId || "default_user",
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
                  data: templatePayload,
                });
              } else {
                await prisma.whatsAppTemplate.create({
                  data: templatePayload,
                });
              }
              syncedCount++;
            }
          }
        } catch (syncErr) {
          console.error(`Sync error for WABA ${acc.wabaId}:`, syncErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Synced ${syncedCount} templates from Meta successfully!`,
        syncedCount,
      });
    }

    let wabaAccount = await prisma.wabaAccount.findFirst({
      where: wabaId ? { wabaId } : {},
    });

    if (!wabaAccount || !wabaAccount.accessToken) {
      return NextResponse.json(
        { success: false, error: "Active WABA Account or Access Token not found in database" },
        { status: 404 }
      );
    }

    const cleanWabaId = wabaAccount.wabaId.replace("WABA_", "").trim();
    const token = wabaAccount.accessToken;

    if (!action) {
      const components: any[] = [];

      if (headerType && headerType !== "NONE") {
        if (headerType === "TEXT" && headerText) {
          components.push({ type: "HEADER", format: "TEXT", text: headerText });
        } else if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType)) {
          components.push({ type: "HEADER", format: headerType });
        }
      }

      if (bodyText) {
        components.push({ type: "BODY", text: bodyText });
      }

      if (footerText) {
        components.push({ type: "FOOTER", text: footerText });
      }

      if (buttons && buttons.length > 0) {
        components.push({ type: "BUTTONS", buttons: buttons });
      }

      const metaPayload: any = {
        name: name.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_"),
        language: language || "en_US",
        category: category || "MARKETING",
        components,
      };

      const metaRes = await fetch(
        `https://graph.facebook.com/v21.0/${cleanWabaId}/message_templates`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(metaPayload),
        }
      );
      const metaData = await metaRes.json();

      if (metaData.error) {
        return NextResponse.json({ success: false, error: metaData.error.message }, { status: 400 });
      }

      const savedTemplate = await prisma.whatsAppTemplate.create({
        data: {
          userId: wabaAccount.userId || userId || "default_user",
          wabaId: wabaAccount.wabaId,
          wabaNumber: wabaAccount.displayPhone,
          metaTemplateId: metaData.id,
          name: metaPayload.name,
          language: metaPayload.language,
          category: metaPayload.category,
          status: metaData.status || "PENDING",
          headerType: headerType || "NONE",
          headerText: headerText || null,
          bodyText,
          footerText: footerText || null,
          buttons: buttons || [],
          components: components,
        },
      });

      return NextResponse.json({ success: true, message: "Template created & submitted to Meta!", template: savedTemplate });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}