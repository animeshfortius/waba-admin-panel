import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = String(process.env.META_APP_SECRET || "").trim();
  if (!appSecret) return true;
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;

  const expectedHex = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const receivedHex = signatureHeader.slice("sha256=".length).trim();

  const expectedBuf = Buffer.from(expectedHex, "hex");
  const receivedBuf = Buffer.from(receivedHex, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken =
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    process.env.WEBHOOK_VERIFY_TOKEN ||
    "fortius_webhook_verify";

  if (mode === "subscribe") {
    if (token === verifyToken && challenge) {
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return NextResponse.json(
      { success: false, error: "Invalid hub.verify_token" },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      endpoint: "/api/v1/meta/webhook",
      status: "active",
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signatureValid = verifyMetaSignature(
    raw,
    request.headers.get("x-hub-signature-256")
  );

  if (!signatureValid) {
    return NextResponse.json(
      { success: false, error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { raw: "non-json body" };
  }

  return NextResponse.json(
    {
      success: true,
      received: true,
      timestamp: new Date().toISOString(),
      payload,
    },
    { status: 200 }
  );
}