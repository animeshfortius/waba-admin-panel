import { NextRequest, NextResponse } from "next/server";

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
    const body = await request.json().catch(() => ({}));

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