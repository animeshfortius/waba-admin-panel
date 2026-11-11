import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let accounts: any[] = [];

    // Try fetching from wabaAccount or wabaChannel tables globally to ensure dropdown populates
    try {
      accounts = await (prisma as any).wabaAccount.findMany({
        select: { id: true, userId: true, wabaId: true, phoneNumberId: true, displayPhone: true, displayName: true, accessToken: true, status: true }
      });
    } catch (e) {}

    if (accounts.length === 0) {
      try {
        accounts = await (prisma as any).wabaChannel.findMany({
          select: { id: true, userId: true, wabaId: true, phoneNumberId: true, displayPhone: true, displayName: true, accessToken: true, status: true }
        });
      } catch (e) {}
    }

    const templates = await prisma.whatsAppTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, templates, wabaAccounts: accounts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, wabaId, templateId, metaTemplateId, newCategory } = body;

    let wabaAccount = null;
    try {
      wabaAccount = await (prisma as any).wabaAccount.findFirst({ where: { wabaId } });
    } catch (e) {}

    if (!wabaAccount) {
      try {
        wabaAccount = await (prisma as any).wabaChannel.findFirst({ where: { wabaId } });
      } catch (e) {}
    }

    if (!wabaAccount || !wabaAccount.accessToken) {
      return NextResponse.json({ success: false, error: "WABA Account or Access Token not found in database" }, { status: 404 });
    }

    const cleanWabaId = wabaAccount.wabaId.replace("WABA_", "").trim();
    const token = wabaAccount.accessToken;

    if (action === "APPEAL_CATEGORY" && metaTemplateId && newCategory) {
      const metaRes = await fetch(`https://graph.facebook.com/v21.0/${metaTemplateId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory }),
      });
      const metaData = await metaRes.json();
      if (metaData.error) return NextResponse.json({ success: false, error: metaData.error.message }, { status: 400 });

      const updated = await prisma.whatsAppTemplate.update({
        where: { id: templateId },
        data: { category: newCategory, status: "PENDING" },
      });
      return NextResponse.json({ success: true, message: "Category appeal submitted to Meta!", template: updated });
    }

    if (action === "SYNC_SINGLE" && metaTemplateId) {
      const metaRes = await fetch(`https://graph.facebook.com/v21.0/${metaTemplateId}?fields=id,name,status,category,language,components,rejected_reason`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const metaData = await metaRes.json();
      if (metaData.error) return NextResponse.json({ success: false, error: metaData.error.message }, { status: 400 });

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

    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${cleanWabaId}/message_templates?limit=250`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const metaData = await metaRes.json();
    if (metaData.error) return NextResponse.json({ success: false, error: metaData.error.message }, { status: 400 });

    let syncedCount = 0;
    for (const tpl of (metaData.data || [])) {
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
        },
        create: {
          userId: wabaAccount.userId || userId || "default_user",
          wabaId: wabaAccount.wabaId,
          wabaNumber: wabaAccount.displayPhone || "N/A",
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
        },
      });
      syncedCount++;
    }

    return NextResponse.json({ success: true, message: `${syncedCount} templates retrieved & synced from Meta!` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}