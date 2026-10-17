import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Database se user aur uske saare WalletTransactions fetch karna
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
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

    return NextResponse.json({
      success: true,
      actualBalance: user.actualBalance,
      virtualBalance: user.virtualBalance,
      walletBalance: user.walletBalance,
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
        { success: false, message: "Valid userId and positive amount are required" },
        { status: 400 }
      );
    }

    // User check karna
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Balance update object prepare karna
    const isActual = creditType === "Actual";
    const updateBalanceData: any = {};

    if (isActual) {
      updateBalanceData.actualBalance = existingUser.actualBalance + numAmount;
      updateBalanceData.walletBalance = existingUser.walletBalance + numAmount;
    } else {
      updateBalanceData.virtualBalance = existingUser.virtualBalance + numAmount;
    }

    // Atomic transaction: User balance update karo aur WalletTransaction log entry banao
    const [updatedUser, newTransaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: updateBalanceData,
      }),
      prisma.walletTransaction.create({
        data: {
          userId,
          amount: numAmount,
          type: creditType === "Actual" ? "Actual Balance" : "Virtual / Oversell",
          description: remarks || "Admin Credit Addition",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Fund transferred successfully!",
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