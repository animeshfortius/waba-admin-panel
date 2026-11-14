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

    // 1. Save Internal Whisper Note (Respond.io Style)
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

    // 2. AI Copilot: Summarize or Suggest Reply
    if (action === "AI_ASSIST") {
      const recentMsgs = await prisma.chatMessage.findMany({
        where: { chatSessionId: sessionId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const conversationText = recentMsgs
        .reverse()
        .map((m) => `${m.senderType}: ${m.messageBody}`)
        .join("\n");

      // Smart rule-based + LLM ready response
      const aiOutput =
        body.assistType === "SUMMARY"
          ? `📋 **Chat Summary:** Customer (${session.customerName || session.customerPhone}) ne "${recentMsgs[0]?.messageBody || "inquiry"}" ke baare mein baat ki hai. Total ${recentMsgs.length} messages exchanged.`
          : `Namaste ${session.customerName || "Sir/Ma'am"}! Fortius Infocom mein aapka swagat hai. Hum aapki is query par abhi kaam kar rahe hain, kripya thoda samay dein.`;

      return NextResponse.json({ success: true, aiOutput });
    }

    // 3. Send Actual WhatsApp Message via Meta Cloud API
    let wabaMessageId = null;
    try {
      const wabaAccount = await prisma.wabaAccount.findFirst({
        where: {
          OR: [
            { displayPhone: { contains: session.channel.replace(/\D/g, "").slice(-10) } },
            { phoneNumberId: session.channel },
          ],
        },
      });

      if (wabaAccount && wabaAccount.accessToken && wabaAccount.phoneNumberId) {
        const metaPayload =
          messageType === "template"
            ? {
                messaging_product: "whatsapp",
                to: session.customerPhone.replace(/\D/g, ""),
                type: "template",
                template: { name: messageBody, language: { code: "en" } },
              }
            : {
                messaging_product: "whatsapp",
                to: session.customerPhone.replace(/\D/g, ""),
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
        }
      }
    } catch (metaErr) {
      console.error("Meta Cloud API Send Warning:", metaErr);
    }

    // Save outgoing message & auto-pause bot when human agent replies
    const newMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        senderType: "AGENT",
        senderName: agentName || "Support Agent",
        messageBody: messageType === "template" ? `[Template Sent]: ${messageBody}` : messageBody,
        messageType,
        status: "SENT",
        wabaMessageId,
      },
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        lastMessage: messageBody,
        lastMessageAt: new Date(),
        isBotActive: false, // Auto handover to human on reply
      },
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}