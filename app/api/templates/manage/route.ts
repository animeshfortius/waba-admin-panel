import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let action, userId, wabaId, name, language, category, headerType, headerText, bodyText, footerText;
    let buttons: any[] = [];
    let variableSamples: string[] = [];
    let metaTemplateId, templateId, newCategory;
    let mediaFileBuffer: Buffer | null = null;
    let mediaFileName = "sample.jpg";
    let mediaFileType = "image/jpeg";

    // Properly parse Multipart FormData from frontend
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      action = formData.get("action")?.toString();
      userId = formData.get("userId")?.toString();
      wabaId = formData.get("wabaId")?.toString();
      name = formData.get("name")?.toString();
      language = formData.get("language")?.toString();
      category = formData.get("category")?.toString();
      headerType = formData.get("headerType")?.toString();
      headerText = formData.get("headerText")?.toString();
      bodyText = formData.get("bodyText")?.toString();
      footerText = formData.get("footerText")?.toString();
      metaTemplateId = formData.get("metaTemplateId")?.toString();
      templateId = formData.get("templateId")?.toString();
      newCategory = formData.get("newCategory")?.toString();

      const varSamplesStr = formData.get("variableSamples")?.toString();
      variableSamples = varSamplesStr ? JSON.parse(varSamplesStr) : [];

      const buttonsStr = formData.get("buttons")?.toString();
      buttons = buttonsStr ? JSON.parse(buttonsStr) : [];

      const file = formData.get("mediaFile") as File | null;
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const arrayBuffer = await file.arrayBuffer();
        mediaFileBuffer = Buffer.from(arrayBuffer);
        mediaFileName = file.name || "media_file";
        mediaFileType = file.type || "application/octet-stream";
      }
    } else {
      const body = await req.json();
      ({
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
        variableSamples,
        metaTemplateId,
        templateId,
        newCategory,
      } = body);
    }

    let wabaAccount = await prisma.wabaAccount.findFirst({
      where: userId ? { userId, wabaId } : { wabaId },
    });

    if (!wabaAccount) {
      wabaAccount = await prisma.wabaAccount.findFirst({ where: { wabaId } });
    }

    if (!wabaAccount || !wabaAccount.accessToken) {
      return NextResponse.json({ success: false, error: "WABA Account not configured properly" }, { status: 404 });
    }

    const cleanWabaId = wabaAccount.wabaId.replace("WABA_", "").trim();
    const token = wabaAccount.accessToken;

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
        body: JSON.stringify({ category: newCategory || "UTILITY" }),
      });

      const appealData = await appealRes.json();
      if (appealData.error) {
        return NextResponse.json({ success: false, error: appealData.error.message }, { status: 400 });
      }

      try {
        await prisma.whatsAppTemplate.update({
          where: { id: templateId },
          data: { category: newCategory || "UTILITY", status: "PENDING" },
        });
      } catch (dbErr) {
        console.error("DB update warning:", dbErr);
      }

      return NextResponse.json({ success: true, message: `Category change request submitted to Meta!` });
    }

    // Build Components for Meta with robust sample handles
    const components: any[] = [];
    const upperHeader = (headerType || "NONE").toUpperCase();

    if (upperHeader !== "NONE") {
      if (upperHeader === "TEXT" && headerText) {
        components.push({ type: "HEADER", format: "TEXT", text: headerText });
      } else if (upperHeader === "IMAGE" || upperHeader === "VIDEO" || upperHeader === "DOCUMENT") {
        let sampleHandle = "https://images.unsplash.com/photo-1526947425960-945c6e72858f";
        if (upperHeader === "VIDEO") {
          sampleHandle = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
        } else if (upperHeader === "DOCUMENT") {
          sampleHandle = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        }

        components.push({
          type: "HEADER",
          format: upperHeader,
          example: { header_handle: [sampleHandle] },
        });
      } else {
        components.push({ type: "HEADER", format: upperHeader });
      }
    }

    if (!bodyText) {
      return NextResponse.json({ success: false, error: "Message body text cannot be empty" }, { status: 400 });
    }

    const bodyComponent: any = {
      type: "BODY",
      text: bodyText,
    };

    if (variableSamples && Array.isArray(variableSamples) && variableSamples.length > 0) {
      bodyComponent.example = {
        body_text: [variableSamples],
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

    const formattedName = (name || "template").toLowerCase().trim().replace(/[^a-z0-9_]/g, "_");

    const createRes = await fetch(`https://graph.facebook.com/v21.0/${cleanWabaId}/message_templates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formattedName,
        language: language || "en_US",
        category: category || "MARKETING",
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

    let savedTemplate = null;
    try {
      savedTemplate = await prisma.whatsAppTemplate.create({
        data: {
          userId: wabaAccount.userId || userId || "default_user",
          wabaId: wabaAccount.wabaId,
          wabaNumber: wabaAccount.displayPhone,
          metaTemplateId: createData.id,
          name: formattedName,
          language: language || "en_US",
          category: createData.category || category,
          status: createData.status || "PENDING",
          headerType: upperHeader,
          headerText: headerText || null,
          bodyText,
          footerText: footerText || null,
          buttons: buttons || [],
          components,
        },
      });
    } catch (dbError) {
      console.error("Database save warning (Meta template created successfully):", dbError);
    }

    return NextResponse.json({
      success: true,
      message: "Template submitted to Meta successfully!",
      template: savedTemplate || { id: createData.id, name: formattedName, status: "PENDING" },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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

    try {
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
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Template updated on Meta!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");
    const userId = searchParams.get("userId");

    if (!templateId) {
      return NextResponse.json({ success: false, error: "Missing templateId parameter" }, { status: 400 });
    }

    const template = await prisma.whatsAppTemplate.findUnique({ where: { id: templateId } }).catch(() => null);
    if (!template) {
      return NextResponse.json({ success: true, message: "Template removed." });
    }

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

    try {
      await prisma.whatsAppTemplate.delete({ where: { id: templateId } });
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Template deleted from Meta & Panel!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}