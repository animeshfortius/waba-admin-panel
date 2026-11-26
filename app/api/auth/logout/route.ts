import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAMES = [
  "token",
  "waba_token",
  "auth_token",
  "userId",
  "userRole",
  "tenantId",
];

async function clearAuthCookies() {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  for (const name of COOKIE_NAMES) {
    try {
      cookieStore.delete(name);
    } catch (e) {}
  }

  return { isProd };
}

function attachClearedCookies(res: NextResponse, isProd: boolean) {
  for (const name of COOKIE_NAMES) {
    res.cookies.set(name, "", {
      httpOnly: name !== "userRole",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure: isProd,
    });
  }
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  return res;
}

export async function POST() {
  try {
    const { isProd } = await clearAuthCookies();
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
    return attachClearedCookies(response, isProd);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Logout failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { isProd } = await clearAuthCookies();
    const forwardedHost =
      req.headers.get("x-forwarded-host") || req.headers.get("host");
    const forwardedProto = req.headers.get("x-forwarded-proto") || "https";

    const targetUrl =
      forwardedHost && !forwardedHost.includes("localhost")
        ? `${forwardedProto}://${forwardedHost}/login`
        : new URL("/login", req.url).toString();

    const response = NextResponse.redirect(targetUrl);
    return attachClearedCookies(response, isProd);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Logout failed" },
      { status: 500 }
    );
  }
}