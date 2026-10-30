import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Agar userId nahi milti, toh database se pehla available user ya admin utha lo (testing ke liye)
    let user;
    if (userId) {
      user = await (prisma as any).user.findUnique({
        where: { id: userId },
      });
    } else {
      user = await (prisma as any).user.findFirst();
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Agar user ke paas API key nahi hai, toh automatic generate karke save kar dein
    if (!user.apiKey) {
      const generatedKey = "waba_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user = await (prisma as any).user.update({
        where: { id: user.id },
        data: { apiKey: generatedKey },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}