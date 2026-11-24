import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ALLOWED_ROLES = ["SUPER_ADMIN", "WHITE_LABEL_RESELLER", "RESELLER", "USER"] as const;

function normalizeRole(rawRole?: string | null): (typeof ALLOWED_ROLES)[number] {
  const upper = String(rawRole || "USER").toUpperCase().trim();
  if (upper === "WHITE_LABEL_RESELLER" || upper === "WHITE_LABEL" || upper === "WHITELABEL") {
    return "WHITE_LABEL_RESELLER";
  }
  if (upper === "RESELLER") return "RESELLER";
  if (upper === "SUPER_ADMIN" || upper === "ADMIN") return "SUPER_ADMIN";
  return "USER";
}

// 1. GET: Fetch all users with hierarchy & white-label config
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isWhiteLabel: true,
        expiryDate: true,
        walletBalance: true,
        actualBalance: true,
        virtualBalance: true,
        perMsgRate: true,
        utilityRate: true,
        serviceRate: true,
        authRate: true,
        whatsappApiEnabled: true,
        chatbotEnabled: true,
        secureReporting: true,
        internationalAccount: true,
        createdById: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true, username: true, role: true },
        },
        whiteLabelConfig: true,
      },
    });

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 2. POST: Create a new User, Reseller, or White-Label Reseller
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      username,
      name,
      email,
      password,
      role,
      phone,
      expiryDate,
      createdById,
      customDomain,
      brandName,
    } = body;

    const finalUsername = String(username || name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!finalUsername || !cleanEmail || !password) {
      return NextResponse.json(
        { success: false, error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: finalUsername }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const assignedRole = normalizeRole(role);
    const isWhiteLabel = assignedRole === "WHITE_LABEL_RESELLER";

    // Default parent creator: explicit createdById or first SUPER_ADMIN if available
    let parentId: string | null = createdById || null;
    if (!parentId) {
      const superAdmin = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
        select: { id: true },
      });
      parentId = superAdmin?.id || null;
    }

    const cleanDomain = String(customDomain || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/^www\./, "");

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username: finalUsername,
          name: String(name || finalUsername).trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: assignedRole,
          isWhiteLabel,
          phone: phone ? String(phone).trim() : "",
          expiryDate: expiryDate ? String(expiryDate) : null,
          createdById: parentId,
        },
      });

      if (isWhiteLabel && cleanDomain) {
        await tx.whiteLabelConfig.create({
          data: {
            userId: created.id,
            domain: cleanDomain,
            brandName: String(brandName || created.name || finalUsername).trim(),
            supportEmail: cleanEmail,
            supportPhone: phone ? String(phone).trim() : null,
            sslStatus: "PENDING",
            isActive: true,
          },
        });
      }

      return created;
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isWhiteLabel: newUser.isWhiteLabel,
      },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}