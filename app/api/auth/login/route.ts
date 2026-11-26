import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { resolveTenantBranding } from "@/lib/tenantBranding";

const JWT_SECRET =
  process.env.JWT_SECRET || "fortius-super-secret-waba-key-2026";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    let authUser: any = null;
    let assignedRole = "USER";

    // Emergency Super Admin check: prefer real DB SUPER_ADMIN if present, else fallback
    if (username.toLowerCase() === "admin" && password === "Admin@123") {
      const dbSuperAdmin = await prisma.user.findFirst({
        where: {
          role: { in: [Role.SUPER_ADMIN] },
        },
        include: {
          whiteLabelConfig: true,
        },
      });

      if (dbSuperAdmin) {
        authUser = dbSuperAdmin;
        assignedRole = "SUPER_ADMIN";
      } else {
        assignedRole = "SUPER_ADMIN";
        authUser = {
          id: "emergency-admin-id",
          username: "admin",
          name: "Super Admin",
          email: "admin@admin.com",
          role: "SUPER_ADMIN",
          parentId: null,
          isWhiteLabel: false,
          whiteLabelConfig: null,
          actualBalance: 0,
          virtualBalance: 0,
          walletBalance: 0,
        };
      }
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

      if (
        (user as any).status &&
        ["SUSPENDED", "INACTIVE", "BLOCKED"].includes(
          String((user as any).status).toUpperCase()
        )
      ) {
        return NextResponse.json(
          { success: false, message: "Account is inactive or suspended" },
          { status: 403 }
        );
      }

      if (
        (user as any).expiryDate &&
        new Date((user as any).expiryDate).getTime() < Date.now()
      ) {
        return NextResponse.json(
          { success: false, message: "Account validity has expired" },
          { status: 403 }
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
      assignedRole = String(user.role || "USER").trim().toUpperCase();
    }

    const hostHeader = req.headers.get("host");
    const branding = await resolveTenantBranding(hostHeader);
    const isWhiteLabel =
      assignedRole === "WHITE_LABEL_RESELLER" || Boolean(authUser.isWhiteLabel);

    const parentId =
      authUser.parentId ?? authUser.resellerId ?? authUser.createdById ?? null;

    const token = jwt.sign(
      {
        userId: authUser.id,
        role: assignedRole,
        parentId,
        isWhiteLabel,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const isProd = process.env.NODE_ENV === "production";

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: authUser.id,
        username: authUser.username,
        name: authUser.name || authUser.username,
        email: authUser.email,
        role: assignedRole,
        parentId,
        isWhiteLabel,
        whiteLabelConfig: authUser.whiteLabelConfig || null,
        actualBalance: Number(authUser.actualBalance ?? 0),
        virtualBalance: Number(authUser.virtualBalance ?? 0),
        walletBalance: Number(authUser.walletBalance ?? 0),
      },
      branding,
    });

    const cookieOpts = {
      sameSite: "lax" as const,
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      secure: isProd,
    };

    response.cookies.set("token", token, { ...cookieOpts, httpOnly: true });
    response.cookies.set("userId", String(authUser.id), {
      ...cookieOpts,
      httpOnly: true,
    });
    response.cookies.set("userRole", assignedRole, {
      ...cookieOpts,
      httpOnly: false,
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