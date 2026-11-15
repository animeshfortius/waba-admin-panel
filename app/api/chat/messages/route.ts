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
    const body = await req.json();
    const { action, sessionId, messageBody, agentName, messageType = "text" } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    // 1. Save Internal Whisper Note
    if (action === "NOTE") {
      const note = await prisma.chatNote.create({
        data: {
          chatSessionId: sessionId,
          agentName: agentName || "Admin",
          noteBody: messageBody,
        },
      });
      return NextResponse.json({ success: true, note });
    }

    // 2. Send Actual WhatsApp Message via Meta Cloud API
    let wabaMessageId = null;
    try {
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

      if (wabaAccount && wabaAccount.accessToken && wabaAccount.phoneNumberId) {
        const recipientPhone = session.customerPhone.replace(/\D/g, "");
        
        const metaPayload =
          messageType === "template"
            ? {
                messaging_product: "whatsapp",
                to: recipientPhone,
                type: "template",
                template: { 
                  name: messageBody, // Dynamic selected template name
                  language: { code: "en_US" } 
                },
              }
            : {
                messaging_product: "whatsapp",
                to: recipientPhone,
                type: "text",
                text: { body: messageBody },
              };

        const metaRes = await fetch(
          `https://graph.facebook.com/v21.0/${wabaAccount.phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${wabaAccount.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(metaPayload),
          }
        );
        const metaData = await metaRes.json();

        if (metaData.messages?.[0]?.id) {
          wabaMessageId = metaData.messages[0].id;
        } else {
          console.error("Meta API Error Details:", metaData);
        }
      }
    } catch (metaErr) {
      console.error("Meta Cloud API Send Exception:", metaErr);
    }

    // Save outgoing message
    const newMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        senderType: "AGENT",
        senderName: agentName || "Support Agent",
        messageBody: messageType === "template" ? `[Template Sent]: ${messageBody}` : messageBody,
        messageType,
        status: wabaMessageId ? "SENT" : "FAILED",
        wabaMessageId,
      },
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        lastMessage: messageType === "template" ? `Template Sent: ${messageBody}` : messageBody,
        lastMessageAt: new Date(),
        isBotActive: false,
      },
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}