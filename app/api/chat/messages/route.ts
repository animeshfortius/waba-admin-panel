import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: "asc" },
    });

    const notes = await prisma.chatNote.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, messages, notes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const action = (formData.get("action") as string) || "SEND";
    const sessionId = formData.get("sessionId") as string;
    const messageBody = (formData.get("messageBody") as string) || "";
    const agentName = (formData.get("agentName") as string) || "Admin Agent";
    const messageType = (formData.get("messageType") as string) || "text";
    const templateLanguage = (formData.get("templateLanguage") as string) || "";
    const mediaFile = formData.get("mediaFile") as File | null;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    if (action === "NOTE") {
      const note = await prisma.chatNote.create({
        data: { chatSessionId: sessionId, agentName, noteBody: messageBody },
      });
      return NextResponse.json({ success: true, note });
    }

    // Resolve matching WABA Account accurately
    let wabaAccount = null;
    if (session.channel) {
      const rawChannel = String(session.channel).trim();
      const cleanChannel = rawChannel.replace(/\D/g, "");
      wabaAccount = await prisma.wabaAccount.findFirst({
        where: {
          OR: [
            { phoneNumberId: rawChannel },
            { wabaId: rawChannel },
            { displayPhone: rawChannel },
            ...(cleanChannel.length >= 10
              ? [{ displayPhone: { contains: cleanChannel.slice(-10) } }]
              : []),
          ],
        },
      });
    }
    if (!wabaAccount) {
      wabaAccount =
        (await prisma.wabaAccount.findFirst({ where: { isDefault: true } })) ||
        (await prisma.wabaAccount.findFirst());
    }

    const resolvedToken = (
      wabaAccount?.accessToken ||
      process.env.META_ACCESS_TOKEN ||
      ""
    ).trim();

    if (!wabaAccount || !resolvedToken || !wabaAccount.phoneNumberId) {
      return NextResponse.json(
        { success: false, error: "WABA Phone Number ID or Access Token not found." },
        { status: 404 }
      );
    }

    const ownerUserId =
      session.userId && session.userId !== "admin"
        ? session.userId
        : wabaAccount.userId || "admin";
    const cleanPhoneId = wabaAccount.phoneNumberId.replace("PHONE_", "").trim();
    const channelNumber = wabaAccount.displayPhone || session.channel || wabaAccount.wabaId;
    const recipientPhone = session.customerPhone.replace(/\D/g, "");

    let wabaMessageId: string | null = null;
    let displayBody = messageBody;
    let finalMsgType = messageType;
    let savedMediaUrl: string | null = null;
    let metaErrorMessage: string | null = null;
    let resolvedTemplateName = "Direct_Chat";

    try {
      let metaPayload: any = null;

      if (mediaFile && mediaFile.size > 0) {
        const metaUploadForm = new FormData();
        metaUploadForm.append("messaging_product", "whatsapp");
        metaUploadForm.append("file", mediaFile, mediaFile.name);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const uploadRes = await fetch(
          `https://graph.facebook.com/v21.0/${cleanPhoneId}/media`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${resolvedToken}` },
            body: metaUploadForm,
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
        const uploadData = await uploadRes.json();

        if (!uploadData.id) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Meta Media Upload Failed: " +
                (uploadData.error?.message || JSON.stringify(uploadData)),
            },
            { status: 400 }
          );
        }

        const mime = mediaFile.type;
        const isImage = mime.startsWith("image/");
        const isVideo = mime.startsWith("video/");
        const waMediaType = isImage ? "image" : isVideo ? "video" : "document";
        finalMsgType = waMediaType;
        savedMediaUrl = `https://graph.facebook.com/v21.0/${uploadData.id}`;

        metaPayload = {
          messaging_product: "whatsapp",
          to: recipientPhone,
          type: waMediaType,
          [waMediaType]: {
            id: uploadData.id,
            ...(messageBody.trim() ? { caption: messageBody.trim() } : {}),
            ...(waMediaType === "document" ? { filename: mediaFile.name } : {}),
          },
        };

        displayBody = `📎 [${waMediaType.toUpperCase()}: ${mediaFile.name}]${
          messageBody.trim() ? " - " + messageBody.trim() : ""
        }`;
      } else if (messageType === "template") {
        resolvedTemplateName = messageBody.trim();
        const dbTemplate =
          (await prisma.whatsAppTemplate.findFirst({
            where: {
              name: resolvedTemplateName,
              OR: [{ wabaId: wabaAccount.wabaId }, { wabaId: cleanPhoneId }],
            },
          })) ||
          (await prisma.whatsAppTemplate.findFirst({
            where: { name: resolvedTemplateName },
          }));

        const resolvedLang = templateLanguage || dbTemplate?.language || "en_US";
        const components: any[] = [];

        const headerType = (dbTemplate as any)?.headerType?.toUpperCase() || "NONE";
        if (headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT") {
          const mediaKey =
            headerType === "VIDEO" ? "video" : headerType === "DOCUMENT" ? "document" : "image";
          let mediaLink = (dbTemplate as any)?.headerMediaUrl;
          if (!mediaLink || !mediaLink.startsWith("http")) {
            mediaLink =
              headerType === "VIDEO"
                ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                : headerType === "DOCUMENT"
                ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                : "https://images.unsplash.com/photo-1526947425960-945c6e72858f";
          }
          components.push({
            type: "header",
            parameters: [{ type: mediaKey, [mediaKey]: { link: mediaLink } }],
          });
        }

        const bodyText = dbTemplate?.bodyText || "";
        const varMatches = bodyText.match(/\{\{\d+\}\}/g);
        if (varMatches && varMatches.length > 0) {
          const uniqueVars = Array.from(new Set(varMatches));
          const customerFallbackName = session.customerName || "Customer";
          components.push({
            type: "body",
            parameters: uniqueVars.map((_, idx) => ({
              type: "text",
              text: idx === 0 ? customerFallbackName : "Details",
            })),
          });
        }

        metaPayload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhone,
          type: "template",
          template: {
            name: resolvedTemplateName,
            language: { code: resolvedLang },
            ...(components.length > 0 ? { components } : {}),
          },
        };
        displayBody = `[Template Sent]: ${resolvedTemplateName}`;
      } else {
        metaPayload = {
          messaging_product: "whatsapp",
          to: recipientPhone,
          type: "text",
          text: { body: messageBody },
        };
        finalMsgType = "text";
      }

      const sendController = new AbortController();
      const sendTimeoutId = setTimeout(() => sendController.abort(), 12000);

      const metaRes = await fetch(
        `https://graph.facebook.com/v21.0/${cleanPhoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resolvedToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(metaPayload),
          signal: sendController.signal,
        }
      );
      clearTimeout(sendTimeoutId);
      const metaData = await metaRes.json();

      if (metaRes.ok && metaData.messages?.[0]?.id) {
        wabaMessageId = metaData.messages[0].id;
      } else {
        metaErrorMessage =
          metaData.error?.message || "Meta rejected the message (check 24h window or template).";
      }
    } catch (metaErr: any) {
      console.error("Meta API Error:", metaErr);
      metaErrorMessage = metaErr.message || "Network timeout while contacting Meta API.";
    }

    const sentAt = new Date();
    const msgStatus = wabaMessageId ? "SENT" : "FAILED";

    const newMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        senderType: "AGENT",
        senderName: agentName,
        messageBody: displayBody,
        messageType: finalMsgType,
        mediaUrl: savedMediaUrl,
        status: msgStatus,
        wabaMessageId,
      },
    });

    // Track message in CampaignLog with cost = 0 so webhook bills on DELIVERED and refunds on FAILED
    if (wabaMessageId) {
      try {
        await prisma.campaignLog.create({
          data: {
            userId: ownerUserId,
            campaignName: "Live_Agent_Chat",
            templateName: messageType === "template" ? resolvedTemplateName : "Chat_Message",
            channel: channelNumber,
            recipient: recipientPhone,
            status: "SENT",
            messageId: wabaMessageId,
            cost: 0,
            errorDetails: "N/A",
            sentAt,
            deliveredAt: null,
            readAt: null,
          },
        });
      } catch (logErr: any) {
        console.error("Chat CampaignLog create error:", logErr.message);
      }
    }

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        lastMessage: displayBody,
        lastMessageAt: sentAt,
        isBotActive: false,
      },
    });

    if (!wabaMessageId) {
      return NextResponse.json(
        {
          success: false,
          error: metaErrorMessage || "Message failed to send via Meta API.",
          message: newMessage,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.log("Messages API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}