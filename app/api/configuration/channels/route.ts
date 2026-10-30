import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const channels = await prisma.wabaAccount.findMany({
      orderBy: { id: "desc" }
    });
    return NextResponse.json(channels);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newChannel = await prisma.wabaAccount.create({
      data: {
        userId: body.userId || "default_user",
        wabaId: body.wabaId || "28402710282733872",
        phoneNumberId: body.phoneNumberId || "1384456657081014",
        displayPhone: body.displayPhone || "15553945963",
        accessToken: body.accessToken || "mock_token_12345",
        status: body.status || "ACTIVE"
      },
    });
    return NextResponse.json(newChannel);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}