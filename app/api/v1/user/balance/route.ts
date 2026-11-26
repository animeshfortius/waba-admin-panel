import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return NextResponse.json(
      {
        success: false,
        error: auth.error,
      },
      { status: auth.status }
    );
  }

  try {
    let balance = Number(auth.context.walletBalance ?? 0);

    if (auth.context.userId && auth.context.userId !== "emergency-admin-id") {
      const dbUser = await prisma.user.findUnique({
        where: { id: auth.context.userId },
        select: { walletBalance: true },
      });
      if (dbUser && typeof dbUser.walletBalance === "number") {
        balance = Number(dbUser.walletBalance);
      }
    }

    if (!Number.isFinite(balance)) {
      balance = 0;
    }

    return NextResponse.json(
      {
        success: true,
        userId: auth.context.userId,
        walletBalance: balance,
        currency: "INR",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch wallet balance",
      },
      { status: 500 }
    );
  }
}