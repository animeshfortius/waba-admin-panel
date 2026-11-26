import { NextRequest, NextResponse } from "next/server";
import { handlePlatformTemplateSend } from "@/lib/meta-template-sender";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

export async function POST(request: NextRequest) {
  const res = await handlePlatformTemplateSend(request, "webengage");
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  return res;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use POST to send WebEngage WhatsApp templates.",
    },
    { status: 405, headers: CORS_HEADERS }
  );
}