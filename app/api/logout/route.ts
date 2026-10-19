import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "https://waba-admin-panel.onrender.com"));
  
  // Clear the userId cookie completely
  response.cookies.set("userId", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0), // Expire instantly
  });

  return response;
}