import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("token")?.value || cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, user: null, error: "Unauthorized" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const targetUserId = decoded.userId || decoded.id;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, user: null, error: "Invalid token payload" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    if (targetUserId === "emergency-admin-id") {
      return NextResponse.json(
        {
          success: true,
          user: {
            id: "emergency-admin-id",
            username: "admin",
            name: "Super Admin",
            email: "admin@admin.com",
            role: "SUPER_ADMIN",
            isWhiteLabel: false,
            walletBalance: 0,
            actualBalance: 0,
            virtualBalance: 0,
            whiteLabelConfig: null,
          },
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isWhiteLabel: true,
        walletBalance: true,
        actualBalance: true,
        virtualBalance: true,
        perMsgRate: true,
        utilityRate: true,
        serviceRate: true,
        authRate: true,
        whiteLabelConfig: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, user: null, error: "User not found" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          ...user,
          role: String(user.role || "USER").trim().toUpperCase(),
          walletBalance: Number(user.walletBalance ?? 0),
          actualBalance: Number(user.actualBalance ?? 0),
          virtualBalance: Number(user.virtualBalance ?? 0),
        },
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, user: null, error: "Invalid token or session expired" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }
}