import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const META_GRAPH_VERSION = "v21.0";

// GET: Fetch WABA Channels (with live Meta Display Name) + Agent's Saved Chat Config
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");
    const userId = searchParams.get("userId");

    // Fetch WABA Accounts from DB
    const wabaAccounts = await (prisma as any).wabaAccount
      ?.findMany({
        where: userId ? { userId } : {},
      })
      .catch(() => []);

    // Enrich with latest verified_name from Meta Graph API v21.0 if missing
    const enrichedChannels = await Promise.all(
      (wabaAccounts || []).map(async (acc: any) => {
        let verifiedName = acc.displayName;
        if (!verifiedName && acc.phoneNumberId && acc.accessToken) {
          try {
            const res = await fetch(
              `https://graph.facebook.com/${META_GRAPH_VERSION}/${acc.phoneNumberId}?fields=verified_name,display_phone_number&access_token=${acc.accessToken}`,
              { cache: "no-store" }
            );
            const metaInfo = await res.json();
            if (metaInfo?.verified_name) {
              verifiedName = metaInfo.verified_name;
            }
          } catch {
            // Fallback to existing DB displayName
          }
        }
        return {
          ...acc,
          displayName: verifiedName || "WhatsApp Business",
        };
      })
    );

    let savedConfig = null;
    if (agentId) {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });
      if ((agent as any)?.chatConfig) {
        try {
          savedConfig = JSON.parse((agent as any).chatConfig);
        } catch {
          savedConfig = null;
        }
      }
    }

    return NextResponse.json({
      success: true,
      channels: enrichedChannels,
      config: savedConfig,
    });
  } catch (error: any) {
    console.error("GET /api/agents/chat-config error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Save Welcome Message, Off-Hours Message & Day-wise Operational Hours
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      agentId,
      channel,
      welcomeMsgEnabled,
      welcomeMsgText,
      offHoursMsgEnabled,
      offHoursMsgText,
      operationalHours,
    } = body;

    if (!agentId || !channel) {
      return NextResponse.json(
        { success: false, error: "Channel and Agent selection are required." },
        { status: 400 }
      );
    }

    const configData = JSON.stringify({
      channel,
      welcomeMsgEnabled: Boolean(welcomeMsgEnabled),
      welcomeMsgText: welcomeMsgText || "Welcome!, thanks for visiting.",
      offHoursMsgEnabled: Boolean(offHoursMsgEnabled),
      offHoursMsgText: offHoursMsgText || "We're currently offline.",
      operationalHours,
      updatedAt: new Date().toISOString(),
    });

    await prisma.agent.update({
      where: { id: agentId },
      data: {
        chatConfig: configData,
      } as any,
    });

    return NextResponse.json({
      success: true,
      message: "Agent Chat Message Configuration saved successfully!",
    });
  } catch (error: any) {
    console.error("POST /api/agents/chat-config error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}