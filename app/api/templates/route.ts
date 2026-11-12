import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");

    // 🔥 NEW: Fetch only reclassified / reviewable templates from Meta
    if (action === "GET_RECLASSIFIED") {
      let accounts = await prisma.wabaAccount.findMany();
      if (userId && userId !== "undefined") {
        accounts = await prisma.wabaAccount.findMany({ where: { userId } });
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
              // Meta returns status like 'REJECTED', 'PENDING', or category updates
              if (tpl.status === "REJECTED" || tpl.category_update || tpl.previous_category) {
                reviewableTemplates.push({
                  wabaId: acc.wabaId,
                  wabaNumber: acc.displayPhone,
                  metaTemplateId: tpl.id,
                  name: tpl.name,
                  language: tpl.language,
                  category: tpl.category,
                  previousCategory: tpl.previous_category || "UTILITY",
                  status: tpl.status,
                  canReview: true,
                });
              }
            }
          }
        } catch (err) {
          console.error("Error fetching reclassified templates:", err);
        }
      }

      return NextResponse.json({
        success: true,
        reviewableTemplates,
      });
    }

    // Standard GET accounts & templates
    let accounts: any[] = [];
    let templates: any[] = [];

    if (userId && userId !== "undefined" && userId !== "null") {
      accounts = await prisma.wabaAccount.findMany({ where: { userId } });
    }
    if (accounts.length === 0) {
      accounts = await prisma.wabaAccount.findMany();
    }

    templates = await prisma.whatsAppTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      templates,
      wabaAccounts: accounts,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, wabaId, templateId, metaTemplateId, newCategory } = body;

    // =========================================================================
    // 🔥 REQUEST CATEGORY REVIEW DIRECTLY TO META
    // =========================================================================
    if (action === "REQUEST_CATEGORY_REVIEW") {
      let targetTemplate = null;
      if (templateId) {
        targetTemplate = await prisma.whatsAppTemplate.findUnique({ where: { id: templateId } });
      }

      let accounts = await prisma.wabaAccount.findMany();
      if (targetTemplate) {
        accounts = await prisma.wabaAccount.findMany({ where: { wabaId: targetTemplate.wabaId } });
      } else if (wabaId && wabaId !== "ALL") {
        accounts = await prisma.wabaAccount.findMany({ where: { wabaId } });
      }

      if (!accounts || accounts.length === 0) {
        return NextResponse.json({ success: false, error: "No WABA account found" }, { status: 404 });
      }

      let requestedCount = 0;
      const metaTplId = metaTemplateId || targetTemplate?.metaTemplateId;
      const token = accounts[0].accessToken;

      if (!metaTplId) {
        return NextResponse.json({ success: false, error: "Meta Template ID is required for review request" }, { status: 400 });
      }

      // Send review/category appeal POST request to Meta graph API
      const metaRes = await fetch(`https://graph.facebook.com/v21.0/${metaTplId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: newCategory || "UTILITY",
        }),
      });
      const metaData = await metaRes.json();

      if (metaData.error) {
        return NextResponse.json({ success: false, error: metaData.error.message }, { status: 400 });
      }

      // Update database status to IN_REVIEW
      if (targetTemplate) {
        await prisma.whatsAppTemplate.update({
          where: { id: targetTemplate.id },
          data: { status: "IN_REVIEW", category: newCategory || "UTILITY" },
        });
      } else {
        await prisma.whatsAppTemplate.updateMany({
          where: { metaTemplateId: metaTplId },
          data: { status: "IN_REVIEW", category: newCategory || "UTILITY" },
        });
      }

      const updatedTemplates = await prisma.whatsAppTemplate.findMany({
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        message: "Successfully submitted template for Meta category review! Status changed to IN_REVIEW.",
        templates: updatedTemplates,
        data: updatedTemplates,
      });
    }

    // =========================================================================
    // 🔥 HANDLE SYNC SINGLE TEMPLATE STATUS
    // =========================================================================
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

    // =========================================================================
    // 🔥 HANDLE RETRIEVE ALL (SYNC ALL)
    // =========================================================================
    let accountsToSync = await prisma.wabaAccount.findMany();
    let syncedCount = 0;

    for (const acc of accountsToSync) {
      if (!acc.accessToken) continue;
      const cleanWabaId = acc.wabaId.replace("WABA_", "").trim();

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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}