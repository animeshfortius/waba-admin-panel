import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { resolveTenantBranding } from "@/lib/tenantBranding";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body.username?.trim();
    const password = body.password?.trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    let authUser: any = null;
    let assignedRole = "USER";

    // Emergency Super Admin login
    if (username.toLowerCase() === "admin" && password === "Admin@123") {
      assignedRole = "SUPER_ADMIN";
      authUser = {
        id: "emergency-admin-id",
        username: "admin",
        name: "Super Admin",
        email: "admin@admin.com",
        role: "SUPER_ADMIN",
        isWhiteLabel: false,
        actualBalance: 0,
        virtualBalance: 0,
        walletBalance: 0,
      };
    } else {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: username, mode: "insensitive" } },
            { email: { equals: username, mode: "insensitive" } },
          ],
        },
        include: {
          whiteLabelConfig: true,
        },
      });

      if (!user || !user.password) {
        return NextResponse.json(
          { success: false, message: "Invalid username or password" },
          { status: 401 }
        );
      }

      const looksHashed =
        user.password.startsWith("$2a$") ||
        user.password.startsWith("$2b$") ||
        user.password.startsWith("$2y$");

      const passwordMatches = looksHashed
        ? await bcrypt.compare(password, user.password)
        : user.password === password;

      if (!passwordMatches) {
        return NextResponse.json(
          { success: false, message: "Invalid username or password" },
          { status: 401 }
        );
      }

      authUser = user;
      assignedRole = String(user.role || "USER").toUpperCase();
    }

    const hostHeader = req.headers.get("host");
    const branding = await resolveTenantBranding(hostHeader);
    const isWhiteLabel =
      assignedRole === "WHITE_LABEL_RESELLER" || Boolean(authUser.isWhiteLabel);

    const token = jwt.sign(
      {
        userId: authUser.id,
        role: assignedRole,
        isWhiteLabel,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: authUser.id,
        username: authUser.username,
        name: authUser.name || authUser.username,
        email: authUser.email,
        role: assignedRole,
        isWhiteLabel,
        whiteLabelConfig: authUser.whiteLabelConfig || null,
        actualBalance: Number(authUser.actualBalance ?? 0),
        virtualBalance: Number(authUser.virtualBalance ?? 0),
        walletBalance: Number(authUser.walletBalance ?? 0),
      },
      branding,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set("userId", authUser.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set("userRole", assignedRole, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}