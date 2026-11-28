import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET =
  process.env.JWT_SECRET || "fortius-super-secret-waba-key-2026";

const SUPER_ADMIN_FIXED_BALANCE = 123456789;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("token")?.value ||
      cookieStore.get("waba_token")?.value ||
      cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, user: null, error: "Unauthorized" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const targetUserId = decoded.userId || decoded.id || decoded.sub;

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
            parentId: null,
            isWhiteLabel: false,
            walletBalance: SUPER_ADMIN_FIXED_BALANCE,
            actualBalance: SUPER_ADMIN_FIXED_BALANCE,
            virtualBalance: SUPER_ADMIN_FIXED_BALANCE,
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
        expiryDate: true,
        createdById: true,
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

    if (user.expiryDate && new Date(user.expiryDate).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, user: null, error: "Account validity has expired" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const parentId = user.createdById ?? null;
    const normalizedRole = String(user.role || "USER").trim().toUpperCase();
    const isSuperAdmin = normalizedRole === "SUPER_ADMIN";
    const rawWallet = Number(user.walletBalance ?? user.actualBalance ?? 0);
    const rawVirtual = Number(user.virtualBalance ?? 0);

    const effectiveWalletBalance = isSuperAdmin
      ? SUPER_ADMIN_FIXED_BALANCE
      : normalizedRole === "USER"
      ? Number((rawWallet + rawVirtual).toFixed(2))
      : Number(rawWallet.toFixed(2));

    return NextResponse.json(
      {
        success: true,
        user: {
          ...user,
          parentId,
          role: normalizedRole,
          walletBalance: effectiveWalletBalance,
          actualBalance: isSuperAdmin
            ? SUPER_ADMIN_FIXED_BALANCE
            : Number((user.actualBalance ?? 0).toFixed(2)),
          virtualBalance: isSuperAdmin
            ? SUPER_ADMIN_FIXED_BALANCE
            : normalizedRole === "USER"
            ? 0
            : Number(rawVirtual.toFixed(2)),
        },
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { success: false, user: null, error: "Invalid token or session expired" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }
}