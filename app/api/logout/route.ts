import { NextResponse } from "next/server";

export function GET(request: Request) {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);

  const isHttps =
    loginUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";

  const cookieNames = ["userId", "token", "auth_token"];

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: isHttps,
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}