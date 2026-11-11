import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch user's templates & onboarded WABA accounts from DB
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Build query filters gracefully (if userId is missing, fetch active WABAs globally so dropdown never fails)
    const wabaWhere: any = { status: "ACTIVE" };
    const templateWhere: any = {};

    if (userId) {
      wabaWhere.userId = userId;
      templateWhere.userId = userId;
    }

    const [templates, wabaAccounts] = await Promise.all([
      prisma.whatsAppTemplate.findMany({
        where: templateWhere,
        orderBy: { createdAt: "desc" },
      }),
      prisma.wabaAccount.findMany({
        where: wabaWhere,
        select: {
          id: true,
          userId: true,
          wabaId: true,
          phoneNumberId: true,
          displayPhone: true,
          displayName: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true, templates, wabaAccounts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Retrieve ALL templates from Meta OR Sync a single template status
export async function POST(req: Request) {
  try {
    const { action, userId, wabaId, templateId, metaTemplateId } = await req.json();

    const wabaAccount = await prisma.wabaAccount.findFirst({
      where: userId ? { userId, wabaId } : { wabaId },
    });

    if (!wabaAccount || !wabaAccount.accessToken) {
      return NextResponse.json(
        { success: false, error: "Active WABA Account or Access Token not found" },
        { status: 404 }
      );
    }

    const cleanWabaId = wabaAccount.wabaId.replace("WABA_", "").trim();
    const token = wabaAccount.accessToken;

    // Action 1: Sync Single Template Status from Meta
    if (action === "SYNC_SINGLE" && metaTemplateId) {
      const metaRes = await fetch(
        `https://graph.facebook.com/v21.0/${metaTemplateId}?fields=id,name,status,category,language,components,rejected_reason`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const metaData = await metaRes.json();

      if (metaData.error) {
        return NextResponse.json({ success: false, error: metaData.error.message }, { status: 400 });
      }

      const bodyComp = metaData.components?.find((c: any) => c.type === "BODY");
      const updated = await prisma.whatsAppTemplate.update({
        where: { id: templateId },
        data: {
          status: metaData.status,
          category: metaData.category,
          bodyText: bodyComp?.text || undefined,
          components: metaData.components,
          rejectedReason: metaData.rejected_reason || null,
        },
      });

      return NextResponse.json({ success: true, message: "Template synced with Meta!", template: updated });
    }

    // Action 2: Retrieve ALL Templates for this WABA from Meta
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${cleanWabaId}/message_templates?limit=250`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const metaData = await metaRes.json();

    if (metaData.error) {
      return NextResponse.json({ success: false, error: metaData.error.message }, { status: 400 });
    }

    const fetchedTemplates = metaData.data || [];
    let syncedCount = 0;

    for (const tpl of fetchedTemplates) {
      const headerComp = tpl.components?.find((c: any) => c.type === "HEADER");
      const bodyComp = tpl.components?.find((c: any) => c.type === "BODY");
      const footerComp = tpl.components?.find((c: any) => c.type === "FOOTER");
      const buttonsComp = tpl.components?.find((c: any) => c.type === "BUTTONS");

      await prisma.whatsAppTemplate.upsert({
        where: { metaTemplateId: tpl.id },
        update: {
          status: tpl.status,
          category: tpl.category,
          language: tpl.language,
          headerType: headerComp?.format || "NONE",
          headerText: headerComp?.text || null,
          bodyText: bodyComp?.text || "",
          footerText: footerComp?.text || null,
          buttons: buttonsComp?.buttons || [],
          components: tpl.components,
          rejectedReason: tpl.rejected_reason || null,
        },
        create: {
          userId: wabaAccount.userId || userId || "default_user",
          wabaId: wabaAccount.wabaId,
          wabaNumber: wabaAccount.displayPhone,
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
          components: tpl.components,
          rejectedReason: tpl.rejected_reason || null,
        },
      });
      syncedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${syncedCount} templates retrieved & synced from Meta!`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}