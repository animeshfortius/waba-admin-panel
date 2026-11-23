import { NextRequest } from "next/server";
import { handlePlatformTemplateSend } from "@/lib/meta-template-sender";

export async function POST(request: NextRequest) {
  return handlePlatformTemplateSend(request, "webengage");
}