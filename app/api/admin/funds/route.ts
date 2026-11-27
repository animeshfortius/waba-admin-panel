import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import {
  SUPER_ADMIN_FIXED_BALANCE,
  isResellerRole,
  isSuperAdminRole,
  applyUnifiedResellerBalance,
} from "@/lib/unifiedBalance";

const JWT_SECRET =
  process.env.JWT_SECRET || "fortius-super-secret-waba-key-2026";

type ActorRole =
  | "SUPER_ADMIN"
  | "WHITE_LABEL_RESELLER"
  | "RESELLER"
  | "USER";

function normalizeActorRole(rawRole?: string | null): ActorRole {
  const upper = String(rawRole || "USER").trim().toUpperCase();
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
    cookieStore.get("token")?.value ||
    cookieStore.get("waba_token")?.value ||
    cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const actorId = decoded?.userId || decoded?.id || decoded?.sub;
    if (!actorId) return null;

    if (actorId === "emergency-admin-id") {
      return { id: "emergency-admin-id", role: "SUPER_ADMIN" as ActorRole };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true },
    });

    if (!dbUser) return null;

    return { id: dbUser.id, role: normalizeActorRole(dbUser.role) };
  } catch {
    return null;
  }
}

// 1. User ki Transactions and Balances Fetch Karne ke liye (GET)
export async function GET(req: Request) {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const isSuperAdminActor = actor.role === "SUPER_ADMIN";
    const isResellerActor =
      actor.role === "RESELLER" || actor.role === "WHITE_LABEL_RESELLER";

    if (!isSuperAdminActor && !isResellerActor) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        createdById: true,
        actualBalance: true,
        virtualBalance: true,
        walletBalance: true,
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (
      !isSuperAdminActor &&
      (isSuperAdminRole(user.role) || user.createdById !== actor.id)
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden: User outside your account scope" },
        { status: 403 }
      );
    }

    const isSuperAdmin = isSuperAdminRole(user.role);

    return NextResponse.json({
      success: true,
      actualBalance: isSuperAdmin
        ? SUPER_ADMIN_FIXED_BALANCE
        : user.actualBalance,
      virtualBalance: isSuperAdmin
        ? SUPER_ADMIN_FIXED_BALANCE
        : user.virtualBalance,
      walletBalance: isSuperAdmin
        ? SUPER_ADMIN_FIXED_BALANCE
        : user.walletBalance,
      transactions: user.transactions,
    });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 2. Fund Transfer Karne aur Database update karne ke liye (POST)
export async function POST(req: Request) {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const isSuperAdminActor = actor.role === "SUPER_ADMIN";
    const isResellerActor =
      actor.role === "RESELLER" || actor.role === "WHITE_LABEL_RESELLER";

    if (!isSuperAdminActor && !isResellerActor) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, amount, creditType, remarks } = body;

    const numAmount = parseFloat(amount);
    if (!userId || isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid userId and positive amount are required",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (
      !isSuperAdminActor &&
      (isSuperAdminRole(existingUser.role) ||
        existingUser.createdById !== actor.id)
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden: User outside your account scope" },
        { status: 403 }
      );
    }

    const isTargetSuperAdmin = isSuperAdminRole(existingUser.role);
    const isTargetReseller = isResellerRole(existingUser.role);
    const isActual = creditType === "Actual";

    const [updatedUser, newTransaction] = await prisma.$transaction(
      async (tx) => {
        let nextUser;

        // Super Admin balance stays fixed at 123456789 and never mutates
        if (isTargetSuperAdmin) {
          nextUser = await tx.user.update({
            where: { id: userId },
            data: {
              actualBalance: SUPER_ADMIN_FIXED_BALANCE,
              virtualBalance: SUPER_ADMIN_FIXED_BALANCE,
              walletBalance: SUPER_ADMIN_FIXED_BALANCE,
            },
          });
        } else if (isTargetReseller) {
          // Reseller / Sub-Reseller: Actual aur Virtual dono mein same amount add
          nextUser = await applyUnifiedResellerBalance({
            tx,
            userId,
            amount: numAmount,
            direction: "CREDIT",
          });
        } else {
          // Regular USER: purana behavior
          const updateBalanceData: any = {};
          if (isActual) {
            updateBalanceData.actualBalance =
              Number(existingUser.actualBalance || 0) + numAmount;
            updateBalanceData.walletBalance =
              Number(existingUser.walletBalance || 0) + numAmount;
          } else {
            updateBalanceData.virtualBalance =
              Number(existingUser.virtualBalance || 0) + numAmount;
          }

          nextUser = await tx.user.update({
            where: { id: userId },
            data: updateBalanceData,
          });
        }

        const createdTx = await tx.walletTransaction.create({
          data: {
            userId,
            amount: numAmount,
            type: isTargetReseller
              ? "Unified Reseller Recharge (Actual + Virtual)"
              : isActual
              ? "Actual Balance"
              : "Virtual / Oversell",
            balanceType: isTargetReseller
              ? "BOTH"
              : isActual
              ? "ACTUAL"
              : "VIRTUAL",
            description:
              remarks ||
              (isTargetReseller
                ? `Unified ₹${numAmount} credited to both Actual & Virtual balance`
                : isSuperAdminActor
                ? "Admin Credit Addition"
                : "Reseller Credit Addition"),
          },
        });

        return [nextUser, createdTx];
      }
    );

    return NextResponse.json({
      success: true,
      message: isTargetReseller
        ? `₹${numAmount.toFixed(2)} credited to both Actual & Virtual balance!`
        : "Fund transferred successfully!",
      user: updatedUser,
      transaction: newTransaction,
    });
  } catch (error: any) {
    console.error("Error in fund transfer:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}