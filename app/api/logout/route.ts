import { NextResponse } from "next/server";

export function GET(request: Request) {
  const loginUrl = "https://waba-admin-panel.onrender.com/login";
  
  // Create redirect response with absolute URL string
  const response = NextResponse.redirect(loginUrl);
  
  // Clear the userId cookie completely
  response.cookies.set("userId", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  return response;
}