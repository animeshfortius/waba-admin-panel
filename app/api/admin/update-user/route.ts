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

function cleanDomainInput(input?: string | null): string {
  if (!input) return "";
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      name,
      username,
      email,
      phone,
      role,
      expiryDate,
      password,
      whatsappApiEnabled,
      chatbotEnabled,
      secureReporting,
      internationalAccount,
      customDomain,
      brandName,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, role: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;

    const effectiveRole = role !== undefined ? normalizeRole(role) : normalizeRole(existingUser.role);

    if (role !== undefined) {
      updateData.role = effectiveRole;
      updateData.isWhiteLabel = effectiveRole === "WHITE_LABEL_RESELLER";
    }

    if (whatsappApiEnabled !== undefined) updateData.whatsappApiEnabled = whatsappApiEnabled;
    if (chatbotEnabled !== undefined) updateData.chatbotEnabled = chatbotEnabled;
    if (secureReporting !== undefined) updateData.secureReporting = secureReporting;
    if (internationalAccount !== undefined) updateData.internationalAccount = internationalAccount;

    if (password) {
      updateData.password = await bcrypt.hash(String(password), 10);
    }

    const normalizedDomain = cleanDomainInput(customDomain);
    if (normalizedDomain) {
      updateData.isWhiteLabel = true;
      if (effectiveRole !== "SUPER_ADMIN") {
        updateData.role = "WHITE_LABEL_RESELLER";
      }
      await prisma.whiteLabelConfig.upsert({
        where: { userId },
        update: {
          domain: normalizedDomain,
          ...(brandName ? { brandName: String(brandName).trim() } : {}),
          isActive: true,
        },
        create: {
          userId,
          domain: normalizedDomain,
          brandName:
            String(brandName || "").trim() ||
            name ||
            username ||
            existingUser.name ||
            existingUser.username ||
            normalizedDomain,
          isActive: true,
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { whiteLabelConfig: true },
    });

    return NextResponse.json({
      success: true,
      message: "User details and WhatsApp settings updated successfully in database!",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}