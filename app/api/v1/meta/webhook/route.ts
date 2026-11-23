import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken =
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    process.env.WEBHOOK_VERIFY_TOKEN ||
    "fortius_webhook_verify";

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
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
  let payload: unknown = null;
  try {
    const raw = await request.text();
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