import { NextResponse } from "next/server";

export function GET(request: Request) {
  // Render ke internal port 10000 se bachne ke liye direct production URL use karein
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://waba-admin-panel.onrender.com";
  const response = NextResponse.redirect(new URL("/login", baseUrl));
  
  // Clear the userId cookie completely
  response.cookies.set("userId", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  return response;
}