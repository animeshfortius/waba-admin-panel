import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const JWT_SECRET =
  process.env.JWT_SECRET || "fortius-super-secret-waba-key-2026";

const ALLOWED_ROLES = [
  "SUPER_ADMIN",
  "WHITE_LABEL_RESELLER",
  "RESELLER",
  "USER",
] as const;

function normalizeRole(
  rawRole?: string | null
): (typeof ALLOWED_ROLES)[number] {
  const upper = String(rawRole || "USER").toUpperCase().trim();
  if (
    upper === "WHITE_LABEL_RESELLER" ||
    upper === "WHITE_LABEL" ||
    upper === "WHITELABEL"
  ) {
    return "WHITE_LABEL_RESELLER";
  }
  if (upper === "RESELLER") return "RESELLER";
  if (upper === "SUPER_ADMIN" || upper === "ADMIN") return "SUPER_ADMIN";
  return "USER";
}

async function getAuthenticatedActor() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("token")?.value || cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const actorId = decoded.userId || decoded.id;
    if (!actorId) return null;

    if (actorId === "emergency-admin-id") {
      return {
        id: "emergency-admin-id",
        role: "SUPER_ADMIN" as const,
        whiteLabelConfig: null,
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: actorId },
      select: {
        id: true,
        role: true,
        whiteLabelConfig: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      role: normalizeRole(user.role),
      whiteLabelConfig: user.whiteLabelConfig,
    };
  } catch {
    return null;
  }
}

// 1. GET: Fetch users scoped by role (SUPER_ADMIN sees all; RESELLER sees own users)
export async function GET() {
  try {
    const actor = await getAuthenticatedActor();

    if (!actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (actor.role === "USER") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Users cannot access user list" },
        { status: 403 }
      );
    }

    const isSuperAdmin = actor.role === "SUPER_ADMIN";

    const users = await prisma.user.findMany({
      where: isSuperAdmin ? undefined : { createdById: actor.id },
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
    const actor = await getAuthenticatedActor();

    if (!actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (actor.role === "USER") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Users cannot create accounts" },
        { status: 403 }
      );
    }

    const isSuperAdmin = actor.role === "SUPER_ADMIN";
    const isReseller =
      actor.role === "RESELLER" || actor.role === "WHITE_LABEL_RESELLER";

    // Reseller site branding lock check
    if (isReseller) {
      const wl = actor.whiteLabelConfig;
      const hasBranding = Boolean(
        wl?.isActive &&
          (String(wl?.brandName || "").trim() ||
            String(wl?.domain || "").trim())
      );

      if (!hasBranding) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Site Branding required: Please configure and activate your Brand Name and Domain before creating users.",
          },
          { status: 403 }
        );
      }
    }

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
        {
          success: false,
          error: "Username, email, and password are required",
        },
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
        {
          success: false,
          error: "User with this email or username already exists",
        },
        { status: 400 }
      );
    }

    let assignedRole = normalizeRole(role);

    // Resellers cannot create SUPER_ADMIN or WHITE_LABEL_RESELLER accounts
    if (isReseller) {
      if (assignedRole === "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Forbidden role assignment" },
          { status: 403 }
        );
      }
      if (
        actor.role === "RESELLER" &&
        assignedRole === "WHITE_LABEL_RESELLER"
      ) {
        assignedRole = "USER";
      }
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const isWhiteLabel = assignedRole === "WHITE_LABEL_RESELLER";

    // Parent creator assignment: Resellers are always set as parent of their created users
    let parentId: string | null = null;
    if (isReseller) {
      parentId = actor.id;
    } else if (isSuperAdmin) {
      if (createdById) {
        parentId = String(createdById);
      } else if (actor.id !== "emergency-admin-id") {
        parentId = actor.id;
      } else {
        const superAdmin = await prisma.user.findFirst({
          where: { role: "SUPER_ADMIN" },
          select: { id: true },
        });
        parentId = superAdmin?.id || null;
      }
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