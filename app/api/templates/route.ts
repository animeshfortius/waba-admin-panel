import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch user's templates & onboarded WABA accounts safely with fallback
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let accounts: any[] = [];
    let templates: any[] = [];

    // 1. Safely fetch WabaAccounts (try with userId first, then fallback to global fetch if empty/error)
    try {
      if (userId && userId !== "emergency_admin_id" && userId !== "undefined") {
        accounts = await prisma.wabaAccount.findMany({
          where: { userId, status: "ACTIVE" },
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
      console.error("WabaAccount user filter query error:", e);
    }

    // Fallback: If no accounts found with userId, fetch all active WABA accounts globally
    if (accounts.length === 0) {
      try {
        accounts = await prisma.wabaAccount.findMany({
          where: { status: "ACTIVE" },
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

    // 2. Safely fetch templates
    try {
      templates = await prisma.whatsAppTemplate.findMany({
        where: userId && userId !== "emergency_admin_id" ? { userId } : {},
        orderBy: { createdAt: "desc" },
      });
    } catch (e) {
      templates = await prisma.whatsAppTemplate.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      success: true,
      templates,
      wabaAccounts: accounts,
    });
  } catch (error: any) {
    console.error("Templates API GET Error:", error.message);
    // Return empty array instead of 500 so UI dropdown doesn't crash
    return NextResponse.json({
      success: true,
      templates: [],
      wabaAccounts: [],
      error: error.message,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, wabaId, templateId, metaTemplateId, newCategory } = body;

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

    if (action === "APPEAL_CATEGORY" && metaTemplateId && newCategory) {
      const metaRes = await fetch(
        `https://graph.facebook.com/v21.0/${metaTemplateId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ category: newCategory }),
        }
      );
      const metaData = await metaRes.json();

      if (metaData.error) {
        return NextResponse.json({ success: false, error: metaData.error.message }, { status: 400 });
      }

      const updated = await prisma.whatsAppTemplate.update({
        where: { id: templateId },
        data: {
          category: newCategory,
          status: "PENDING",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Category appeal submitted successfully to Meta!",
        template: updated,
      });
    }

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