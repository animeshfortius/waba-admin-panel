import { NextResponse } from "next/server";

export function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const forwardedHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    reqUrl.protocol.replace(":", "") ||
    "https";

  const cleanHost = forwardedHost.split(",")[0].trim();
  const isLocalHost =
    !cleanHost ||
    cleanHost.startsWith("localhost") ||
    cleanHost.startsWith("127.0.0.1");

  const baseUrl = isLocalHost
    ? process.env.NEXT_PUBLIC_APP_URL || "https://waba-admin-panel.onrender.com"
    : `${forwardedProto}://${cleanHost}`;

  const loginUrl = new URL("/login", baseUrl);
  const response = NextResponse.redirect(loginUrl);

  const isHttps =
    loginUrl.protocol === "https:" || forwardedProto === "https";

  const cookieNames = ["userId", "token", "auth_token", "userRole", "tenantId"];

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      httpOnly: name !== "userRole",
      path: "/",
      sameSite: "lax",
      secure: isHttps,
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}