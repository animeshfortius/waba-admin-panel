import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    const cookieNames = ["token", "auth_token", "userId", "userRole"];
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
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}