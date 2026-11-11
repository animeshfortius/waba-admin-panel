import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Create Template OR Request Category Change (Utility Appeal)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      action, 
      userId, 
      wabaId, 
      name, 
      language, 
      category, 
      headerType, 
      headerText, 
      bodyText, 
      footerText, 
      buttons, 
      variableSamples, // 👈 Added to receive sample values for variables from frontend
      metaTemplateId, 
      templateId, 
      newCategory 
    } = body;

    let wabaAccount = await prisma.wabaAccount.findFirst({
      where: userId ? { userId, wabaId } : { wabaId },
    });

    if (!wabaAccount) {
      wabaAccount = await prisma.wabaAccount.findFirst({
        where: { wabaId },
      });
    }

    if (!wabaAccount || !wabaAccount.accessToken) {
      return NextResponse.json({ success: false, error: "WABA Account not configured properly" }, { status: 404 });
    }

    const cleanWabaId = wabaAccount.wabaId.replace("WABA_", "").trim();
    const token = wabaAccount.accessToken;

    // 🟢 ACTION: Request Category Update / Appeal (Marketing -> Utility)
    if (action === "APPEAL_CATEGORY") {
      if (!metaTemplateId) {
        return NextResponse.json({ success: false, error: "Meta Template ID missing" }, { status: 400 });
      }

      const appealRes = await fetch(`https://graph.facebook.com/v21.0/${metaTemplateId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: newCategory || "UTILITY",
        }),
      });

      const appealData = await appealRes.json();
      if (appealData.error) {
        return NextResponse.json({ success: false, error: appealData.error.message }, { status: 400 });
      }

      await prisma.whatsAppTemplate.update({
        where: { id: templateId },
        data: {
          category: newCategory || "UTILITY",
          status: "PENDING",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Category change request to ${newCategory || "UTILITY"} submitted to Meta!`,
      });
    }

    // 🟢 ACTION: Create New Template on Meta
    const components: any[] = [];

    if (headerType && headerType !== "NONE") {
      if (headerType === "TEXT" && headerText) {
        components.push({ type: "HEADER", format: "TEXT", text: headerText });
      } else if (headerType === "IMAGE") {
        components.push({
          type: "HEADER",
          format: "IMAGE",
          example: {
            header_handle: [
              "https://images.unsplash.com/photo-1526947425960-945c6e72858f"
            ]
          }
        });
      } else if (headerType === "VIDEO") {
        components.push({
          type: "HEADER",
          format: "VIDEO",
          example: {
            header_handle: [
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            ]
          }
        });
      } else if (headerType === "DOCUMENT") {
        components.push({
          type: "HEADER",
          format: "DOCUMENT",
          example: {
            header_handle: [
              "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            ]
          }
        });
      } else {
        components.push({ type: "HEADER", format: headerType });
      }
    }

    // Construct Body Component with required variable sample values for Meta
    const bodyComponent: any = {
      type: "BODY",
      text: bodyText,
    };

    if (variableSamples && Array.isArray(variableSamples) && variableSamples.length > 0) {
      bodyComponent.example = {
        body_text: [variableSamples]
      };
    }

    components.push(bodyComponent);

    if (footerText) {
      components.push({ type: "FOOTER", text: footerText });
    }

    if (buttons && buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: buttons.map((b: any) => {
          if (b.type === "URL") return { type: "URL", text: b.text, url: b.value };
          if (b.type === "PHONE_NUMBER") return { type: "PHONE_NUMBER", text: b.text, phone_number: b.value };
          if (b.type === "COPY_CODE") return { type: "COPY_CODE", example: b.value || "123456" };
          return { type: "QUICK_REPLY", text: b.text };
        }),
      });
    }

    const formattedName = name.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_");

    const createRes = await fetch(`https://graph.facebook.com/v21.0/${cleanWabaId}/message_templates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formattedName,
        language,
        category,
        components,
      }),
    });

    const createData = await createRes.json();

    if (createData.error) {
      return NextResponse.json(
        { success: false, error: createData.error.error_user_msg || createData.error.message },
        { status: 400 }
      );
    }

    const savedTemplate = await prisma.whatsAppTemplate.create({
      data: {
        userId: wabaAccount.userId || userId || "default_user",
        wabaId: wabaAccount.wabaId,
        wabaNumber: wabaAccount.displayPhone,
        metaTemplateId: createData.id,
        name: formattedName,
        language,
        category: createData.category || category,
        status: createData.status || "PENDING",
        headerType: headerType || "NONE",
        headerText: headerText || null,
        bodyText,
        footerText: footerText || null,
        buttons: buttons || [],
        components,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Template submitted to Meta successfully!",
      template: savedTemplate,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Edit Existing Template on Meta
export async function PUT(req: Request) {
  try {
    const { templateId, metaTemplateId, userId, wabaId, headerType, headerText, bodyText, footerText, buttons } = await req.json();

    let wabaAccount = await prisma.wabaAccount.findFirst({ where: userId ? { userId, wabaId } : { wabaId } });
    if (!wabaAccount) {
      wabaAccount = await prisma.wabaAccount.findFirst({ where: { wabaId } });
    }
    if (!wabaAccount) return NextResponse.json({ success: false, error: "WABA Account not found" }, { status: 404 });

    const components: any[] = [];
    if (headerType && headerType !== "NONE" && headerText) {
      components.push({ type: "HEADER", format: "TEXT", text: headerText });
    }
    components.push({ type: "BODY", text: bodyText });
    if (footerText) components.push({ type: "FOOTER", text: footerText });
    if (buttons && buttons.length > 0) {
      components.push({ type: "BUTTONS", buttons });
    }

    const editRes = await fetch(`https://graph.facebook.com/v21.0/${metaTemplateId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${wabaAccount.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ components }),
    });

    const editData = await editRes.json();
    if (editData.error) {
      return NextResponse.json({ success: false, error: editData.error.message }, { status: 400 });
    }

    await prisma.whatsAppTemplate.update({
      where: { id: templateId },
      data: {
        headerType,
        headerText,
        bodyText,
        footerText,
        buttons,
        components,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, message: "Template updated on Meta!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete Template from Meta & Local DB
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");
    const userId = searchParams.get("userId");

    if (!templateId) {
      return NextResponse.json({ success: false, error: "Missing templateId parameter" }, { status: 400 });
    }

    const template = await prisma.whatsAppTemplate.findUnique({ where: { id: templateId } });
    if (!template) return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });

    let wabaAccount = await prisma.wabaAccount.findFirst({
      where: userId ? { userId, wabaId: template.wabaId } : { wabaId: template.wabaId },
    });
    if (!wabaAccount) {
      wabaAccount = await prisma.wabaAccount.findFirst({
        where: { wabaId: template.wabaId },
      });
    }

    if (wabaAccount && template.name) {
      const cleanWabaId = wabaAccount.wabaId.replace("WABA_", "").trim();
      await fetch(
        `https://graph.facebook.com/v21.0/${cleanWabaId}/message_templates?name=${template.name}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${wabaAccount.accessToken}` },
        }
      );
    }

    await prisma.whatsAppTemplate.delete({ where: { id: templateId } });

    return NextResponse.json({ success: true, message: "Template deleted from Meta & Panel!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}