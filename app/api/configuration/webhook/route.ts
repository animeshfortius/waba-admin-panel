import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { id, webhookUrl } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
    }

    const updatedChannel = await prisma.wabaAccount.update({
      where: { id },
      data: { webhookUrl: webhookUrl || "NA" },
    });

    return NextResponse.json({ success: true, data: updatedChannel });
  } catch (error: any) {
    console.error("Webhook update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update webhook" }, { status: 500 });
  }
}