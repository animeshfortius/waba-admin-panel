import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const tab = searchParams.get("tab") || "campaign";

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID missing" }, { status: 400 });
    }

    // 🟢 Fetch all onboarded WABA accounts for this user (or global if admin)
    let wabaAccounts = await prisma.wabaAccount.findMany({
      select: { wabaId: true, displayPhone: true, displayName: true, userId: true }
    });

    if (userId !== "admin" && userId !== "emergency_admin_id") {
      const filtered = wabaAccounts.filter(acc => acc.userId === userId);
      if (filtered.length > 0) wabaAccounts = filtered;
    }

    // Fetch actual templates/campaigns
    const templates = await prisma.whatsAppTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    const campaignReports = templates.map((tpl, index) => ({
      id: tpl.id || index + 1,
      date: tpl.createdAt.toISOString().replace("T", " ").substring(0, 16),
      campaignInfo: `Campaign_${tpl.name}`,
      templateInfo: `${tpl.category}: ${tpl.name}`,
      channel: tpl.wabaNumber || wabaAccounts[0]?.displayPhone || "N/A",
      scheduledInfo: "Instant",
      isJourney: "No",
      cost: tpl.category === "MARKETING" ? "0.804" : "0.155",
      totalCount: 1,
      error: tpl.status === "REJECTED" ? "Template Rejected by Meta" : "-",
      status: tpl.status === "APPROVED" ? "Completed" : tpl.status,
    }));

    return NextResponse.json({
      success: true,
      data: campaignReports,
      wabaAccounts, // 🟢 Send dynamic onboarded channels to frontend
      stats: {
        total: campaignReports.length,
        sent: campaignReports.filter(c => c.status === "Completed").length,
        delivered: campaignReports.length,
        read: campaignReports.length,
        failed: campaignReports.filter(c => c.status === "REJECTED").length,
      }
    });
  } catch (error: any) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ success: false, error: error.message, data: [], wabaAccounts: [] }, { status: 500 });
  }
}