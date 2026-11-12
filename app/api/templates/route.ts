import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");

    if (action === "GET_RECLASSIFIED") {
      let accounts = await prisma.wabaAccount.findMany();
      if (userId && userId !== "undefined" && userId !== "null" && userId !== "emergency_admin_id") {
        const filtered = accounts.filter((acc) => acc.userId === userId);
        if (filtered.length > 0) accounts = filtered;
      }

      let reviewableTemplates: any[] = [];

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
              if (tpl.status === "REJECTED" || tpl.category_update || tpl.previous_category || tpl.status === "FLAGGED") {
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

    let accounts: any[] = [];
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

    let templates: any[] = [];
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
    console.error("GET Templates Route Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      wabaAccounts: [],
      templates: [],
      reviewableTemplates: [],
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (err) {
      body = {};
    }

    const { action, templateId } = body;

    if (action === "SYNC_SINGLE") {
      if (!templateId) {
        return NextResponse.json({ success: false, error: "Template ID missing" }, { status: 400 });
      }

      const targetTemplate = await prisma.whatsAppTemplate.findUnique({ where: { id: templateId } });
      if (!targetTemplate) {
        return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
      }

      const wabaAccount = await prisma.wabaAccount.findFirst({ where: { wabaId: targetTemplate.wabaId } });
      if (!wabaAccount || !wabaAccount.accessToken) {
        return NextResponse.json({ success: false, error: "Access token not found" }, { status: 404 });
      }

      const metaRes = await fetch(`https://graph.facebook.com/v21.0/${targetTemplate.metaTemplateId}`, {
        headers: { Authorization: `Bearer ${wabaAccount.accessToken}` },
      });
      const metaData = await metaRes.json();

      if (metaData.error) {
        return NextResponse.json({ success: false, error: metaData.error.message }, { status: 400 });
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

    let accountsToSync = await prisma.wabaAccount.findMany();
    let syncedCount = 0;

    for (const acc of accountsToSync) {
      if (!acc.accessToken) continue;
      const cleanWabaId = acc.wabaId.replace("WABA_", "").trim();

      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/v21.0/${cleanWabaId}/message_templates?limit=250`,
          { headers: { Authorization: `Bearer ${acc.accessToken}` } }
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

            const payload = {
              userId: acc.userId || "default_user",
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
              await prisma.whatsAppTemplate.update({ where: { id: existing.id }, data: payload });
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

    const updatedTemplates = await prisma.whatsAppTemplate.findMany({ orderBy: { createdAt: "desc" } });

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} templates from Meta successfully!`,
      syncedCount,
      templates: updatedTemplates,
      data: updatedTemplates,
    });
  } catch (error: any) {
    console.error("POST Templates Route Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}