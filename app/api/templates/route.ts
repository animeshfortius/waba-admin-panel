import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let accounts: any[] = [];
    let templates: any[] = [];

    // Fetch WabaAccounts globally or by user
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

    // If empty, fetch all active WabaAccounts so dropdown never fails
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
    const { action, userId, wabaId, templateId, metaTemplateId, newCategory, name, language, category, subType, allowCategoryChange, headerType, headerText, bodyText, footerText, buttons, authConfig, carouselCards } = body;

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

      if (allowCategoryChange) {
        metaPayload.allow_category_change = true;
      }

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