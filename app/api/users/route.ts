import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getTenantContext } from "@/lib/tenant-auth";

const SAFE_USER_INCLUDE = {
  whiteLabelConfig: true,
};

function stripPassword(userObj: any) {
  if (!userObj) return userObj;
  const { password: _pwd, ...safeUser } = userObj;
  return safeUser;
}

function toPrismaRole(rawRole?: string | null): Role {
  const upper = String(rawRole || "USER")
    .toUpperCase()
    .trim();
  if (
    upper === "WHITE_LABEL_RESELLER" ||
    upper === "WHITE_LABEL" ||
    upper === "WHITELABEL"
  ) {
    return Role.WHITE_LABEL_RESELLER;
  }
  if (upper === "RESELLER") {
    return Role.RESELLER;
  }
  if (upper === "SUPER_ADMIN" || upper === "ADMIN") {
    return Role.SUPER_ADMIN;
  }
  return Role.USER;
}

// GET: Fetch scoped users list and whiteLabelConfig (without password hashes)
export async function GET() {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const whereClause: any = {};
    if (!tenant.isSuperAdmin) {
      const allowedIds = Array.from(
        new Set([tenant.userId, ...(tenant.allowedUserIds || [])].filter(Boolean))
      );
      whereClause.OR = [
        { id: { in: allowedIds } },
        { createdById: { in: allowedIds } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: SAFE_USER_INCLUDE,
    });

    return NextResponse.json({
      success: true,
      users: users.map(stripPassword),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST: Create scoped user, generate API key, and configure White-Label settings
export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const isAdminOrReseller =
      tenant.isSuperAdmin ||
      ["RESELLER", "WHITE_LABEL_RESELLER", "SUPER_ADMIN"].includes(
        String(tenant.role || "").toUpperCase()
      );

    if (!isAdminOrReseller) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Insufficient permissions to create users" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const cleanEmail = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    let normalizedRole: Role = toPrismaRole(body?.role);
    if (!tenant.isSuperAdmin && normalizedRole === Role.SUPER_ADMIN) {
      normalizedRole = Role.USER;
    }

    const isWhiteLabel =
      normalizedRole === Role.WHITE_LABEL_RESELLER || Boolean(body?.isWhiteLabel);

    const generatedApiKey = "ft_live_" + crypto.randomBytes(24).toString("hex");
    const rawPassword = body?.password ? String(body.password) : "";
    const hashedPassword = rawPassword ? await bcrypt.hash(rawPassword, 10) : "";

    const requestedCreatorId = body?.createdById
      ? String(body.createdById).trim()
      : "";
    const createdById =
      tenant.isSuperAdmin && requestedCreatorId
        ? requestedCreatorId
        : tenant.userId && tenant.userId !== "emergency-admin-id"
        ? tenant.userId
        : null;

    const newUser = await prisma.user.create({
      data: {
        username: body?.username ? String(body.username).trim() : null,
        name:
          String(body?.name || body?.username || "Fortius User").trim() ||
          "Fortius User",
        email: cleanEmail,
        password: hashedPassword,
        phone: body?.phone ? String(body.phone).trim() : null,
        role: normalizedRole,
        isWhiteLabel,
        createdById,
        expiryDate: body?.expiryDate ? String(body.expiryDate) : null,
        apiKey: generatedApiKey,
      },
    });

    if (isWhiteLabel && body?.customDomain && String(body.customDomain).trim()) {
      const cleanDomain = String(body.customDomain)
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "");

      const brandName =
        String(body?.brandName || "").trim() ||
        newUser.name ||
        newUser.username ||
        cleanDomain;

      await prisma.whiteLabelConfig.upsert({
        where: { userId: newUser.id },
        update: {
          domain: cleanDomain,
          brandName,
          isActive: true,
        },
        create: {
          userId: newUser.id,
          domain: cleanDomain,
          brandName,
          isActive: true,
        },
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: SAFE_USER_INCLUDE,
    });

    return NextResponse.json({
      success: true,
      user: stripPassword(fullUser || newUser),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create user" },
      { status: 500 }
    );
  }
}