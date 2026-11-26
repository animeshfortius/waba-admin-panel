import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("token")?.value ||
      cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const rawId = decoded?.userId || decoded?.id;
    const userId = rawId ? String(rawId).trim() : "";

    if (userId && userId !== "emergency-admin-id") {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          walletBalance: true,
        },
      });

      if (dbUser) {
        return NextResponse.json({ user: dbUser });
      }
    }

    if (
      userId === "emergency-admin-id" ||
      String(decoded?.role || "").toUpperCase() === "SUPER_ADMIN"
    ) {
      return NextResponse.json({
        user: {
          id: userId || "emergency-admin-id",
          username: decoded?.username || "admin",
          email: decoded?.email || "info@fortiusinfocom.com",
          role: "SUPER_ADMIN",
          walletBalance: 0,
        },
      });
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid token or session expired" },
      { status: 401 }
    );
  }
}