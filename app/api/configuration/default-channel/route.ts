import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    // 1. Sabhi channels ka isDefault false kar do
    await prisma.wabaAccount.updateMany({
      data: { isDefault: false },
    });

    // 2. Selected channel ko true kar do
    const updatedChannel = await prisma.wabaAccount.update({
      where: { id },
      data: { isDefault: true },
    });

    return NextResponse.json({ success: true, data: updatedChannel });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}