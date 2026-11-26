import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";

    const cookieNames = [
      "token",
      "auth_token",
      "userId",
      "userRole",
      "tenantId",
    ];

    for (const name of cookieNames) {
      cookieStore.delete(name);
    }

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    for (const name of cookieNames) {
      response.cookies.set(name, "", {
        httpOnly: name !== "userRole",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        secure: isProd,
      });
    }

    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Logout failed" },
      { status: 500 }
    );
  }
}