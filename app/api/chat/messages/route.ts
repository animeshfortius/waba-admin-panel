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

    let wabaAccount = null;
    if (session.channel) {
      const cleanChannel = session.channel.replace(/\D/g, "");
      wabaAccount = await prisma.wabaAccount.findFirst({
        where: {
          OR: [
            { phoneNumberId: session.channel },
            { displayPhone: { contains: cleanChannel.slice(-10) } },
          ],
        },
      });
    }
    if (!wabaAccount) {
      wabaAccount = await prisma.wabaAccount.findFirst();
    }

    let wabaMessageId = null;
    let displayBody = messageBody;
    let finalMsgType = messageType;
    let savedMediaUrl: string | null = null;

    if (wabaAccount && wabaAccount.accessToken && wabaAccount.phoneNumberId) {
      const recipientPhone = session.customerPhone.replace(/\D/g, "");
      let metaPayload: any = null;

      try {
        if (mediaFile && mediaFile.size > 0) {
          // Fast upload payload handling
          const metaUploadForm = new FormData();
          metaUploadForm.append("messaging_product", "whatsapp");
          metaUploadForm.append("file", mediaFile, mediaFile.name);

          // Optimized timeout controller for ultra-fast dispatch (15s limit)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const uploadRes = await fetch(
            `https://graph.facebook.com/v21.0/${wabaAccount.phoneNumberId}/media`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${wabaAccount.accessToken}` },
              body: metaUploadForm,
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);
          const uploadData = await uploadRes.json();

          if (!uploadData.id) {
            return NextResponse.json({
              success: false,
              error: "Meta Media Upload Failed: " + JSON.stringify(uploadData.error || uploadData),
            }, { status: 500 });
          }

          const mime = mediaFile.type;
          const isImage = mime.startsWith("image/");
          const isVideo = mime.startsWith("video/");
          const waMediaType = isImage ? "image" : isVideo ? "video" : "document";
          finalMsgType = waMediaType;

          // Save Media ID URL for proxy rendering
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

          displayBody = `📎 [${waMediaType.toUpperCase()}: ${mediaFile.name}]${messageBody.trim() ? " - " + messageBody.trim() : ""}`;
        } else if (messageType === "template") {
          metaPayload = {
            messaging_product: "whatsapp",
            to: recipientPhone,
            type: "template",
            template: { name: messageBody, language: { code: "en_US" } },
          };
          displayBody = `[Template Sent]: ${messageBody}`;
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
        const sendTimeoutId = setTimeout(() => sendController.abort(), 10000);

        const metaRes = await fetch(
          `https://graph.facebook.com/v21.0/${wabaAccount.phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${wabaAccount.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(metaPayload),
            signal: sendController.signal,
          }
        );
        clearTimeout(sendTimeoutId);
        const metaData = await metaRes.json();

        if (metaData.messages?.[0]?.id) {
          wabaMessageId = metaData.messages[0].id;
        }
      } catch (metaErr: any) {
        console.error("Meta API Speed Error:", metaErr);
      }
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        senderType: "AGENT",
        senderName: agentName,
        messageBody: displayBody,
        messageType: finalMsgType,
        mediaUrl: savedMediaUrl,
        status: wabaMessageId ? "SENT" : "FAILED",
        wabaMessageId,
      },
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        lastMessage: displayBody,
        lastMessageAt: new Date(),
        isBotActive: false,
      },
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.log("Messages API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
