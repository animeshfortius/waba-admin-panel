import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

function toPrismaRole(rawRole?: string | null): Role {
  const upper = String(rawRole || "USER").toUpperCase().trim();
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

// GET: Sabhi users ki list aur whiteLabelConfig fetch karne ke liye
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        whiteLabelConfig: true,
      },
    });
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST: Naya user create karne, API key generate karne, aur White-Label config jodne ke liye
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const creatorIdFromCookie = cookieStore.get("userId")?.value || null;

    const generatedApiKey = "ft_live_" + crypto.randomBytes(24).toString("hex");
    const hashedPassword = body.password
      ? await bcrypt.hash(String(body.password), 10)
      : "";

    const normalizedRole: Role = toPrismaRole(body.role);
    const isWhiteLabel =
      normalizedRole === Role.WHITE_LABEL_RESELLER || Boolean(body.isWhiteLabel);

    const createdById =
      body.createdById ||
      (creatorIdFromCookie && creatorIdFromCookie !== "emergency-admin-id"
        ? creatorIdFromCookie
        : null);

    const newUser = await prisma.user.create({
      data: {
        username: body.username || null,
        name: body.name || body.username || "Fortius User",
        email: body.email,
        password: hashedPassword,
        phone: body.phone || null,
        role: normalizedRole,
        isWhiteLabel,
        createdById,
        expiryDate: body.expiryDate ? String(body.expiryDate) : null,
        apiKey: generatedApiKey,
      },
    });

    // Agar White-Label Reseller hai aur customDomain / brandName diya gaya hai toh WhiteLabelConfig create/update karein
    if (isWhiteLabel && body.customDomain && String(body.customDomain).trim()) {
      const cleanDomain = String(body.customDomain)
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "");

      await prisma.whiteLabelConfig.upsert({
        where: { userId: newUser.id },
        update: {
          domain: cleanDomain,
          brandName:
            String(body.brandName || "").trim() ||
            newUser.name ||
            newUser.username ||
            cleanDomain,
          isActive: true,
        },
        create: {
          userId: newUser.id,
          domain: cleanDomain,
          brandName:
            String(body.brandName || "").trim() ||
            newUser.name ||
            newUser.username ||
            cleanDomain,
          isActive: true,
        },
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: { whiteLabelConfig: true },
    });

    return NextResponse.json({ success: true, user: fullUser || newUser });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}