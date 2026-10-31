import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID missing" }, { status: 400 });
    }

    // Agar emergency admin login hai
    if (userId === "emergency-admin-id") {
      return NextResponse.json({
        success: true,
        user: {
          id: "emergency-admin-id",
          username: "admin",
          name: "Fortius Admin",
          email: "admin@admin.com",
          role: "SUPER_ADMIN",
          phone: "9999999999",
          apiKey: "waba_emergency_admin_key_12345",
          expiryDate: "2030-12-31T00:00:00.000Z"
        }
      });
    }

    // Normal Database User
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Agar user ke paas API key nahi hai, toh automatic generate karke save kar do
    if (!user.apiKey) {
      const generatedKey = "waba_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { apiKey: generatedKey },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}