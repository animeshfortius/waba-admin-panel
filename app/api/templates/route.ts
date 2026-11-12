import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

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
    let body: any = {};
    try {
      body = await req.json();
    } catch (err) {
      body = {};
    }

    const { userId, wabaId } = body;

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

    const updatedTemplates = await prisma.whatsAppTemplate.findMany({
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}