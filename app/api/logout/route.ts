import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Login page ka URL set karein
  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);
  
  // Server-side se HttpOnly 'userId' cookie ko turant expire/delete kar do
  response.cookies.set("userId", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  return response;
}