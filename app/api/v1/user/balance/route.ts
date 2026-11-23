import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";

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

  return NextResponse.json(
    {
      success: true,
      userId: auth.context.userId,
      walletBalance: auth.context.walletBalance,
      currency: "INR",
    },
    { status: 200 }
  );
}