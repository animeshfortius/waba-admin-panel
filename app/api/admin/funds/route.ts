import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SUPER_ADMIN_FIXED_BALANCE,
  isResellerRole,
  isSuperAdminRole,
  applyUnifiedResellerBalance,
} from "@/lib/unifiedBalance";

// 1. User ki Transactions and Balances Fetch Karne ke liye (GET)
export async function GET(req: Request) {
  try {
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
                : "Admin Credit Addition"),
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