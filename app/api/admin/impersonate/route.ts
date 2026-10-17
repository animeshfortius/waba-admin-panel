import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Target User ID is required" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "Target User not found" },
        { status: 404 }
      );
    }

    // Response with redirect path to dashboard
    const response = NextResponse.json({
      success: true,
      message: `Logged in as ${targetUser.name}`,
      redirectUrl: "/dashboard",
    });

    // Set impersonate session cookie
    response.cookies.set("impersonatedUserId", targetUser.id, {
      httpOnly: true,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Error impersonating user:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}