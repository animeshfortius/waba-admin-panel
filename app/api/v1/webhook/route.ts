import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
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

// Meta Webhook Verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken =
    process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token && verifyToken && token === verifyToken) {
    return new NextResponse(challenge || "", { status: 200 });
  }

  return NextResponse.json(
    { success: false, error: "Webhook verification failed" },
    { status: 403 }
  );
}

// Incoming / Test Webhook Event Handler (POST)
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureValid = verifyMetaSignature(
      rawBody,
      request.headers.get("x-hub-signature-256")
    );

    if (!signatureValid) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    let body: unknown = {};
    if (rawBody.trim()) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid JSON webhook payload" },
          { status: 400 }
        );
      }
    }

    console.log("Incoming / Test Webhook Payload:", JSON.stringify(body));

    return NextResponse.json(
      {
        success: true,
        message: "Webhook event received",
        receivedAt: new Date().toISOString(),
        payload: body,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process webhook payload",
      },
      { status: 400 }
    );
  }
}