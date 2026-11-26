import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const META_GRAPH_VERSION = "v21.0";

function isSuperAdminContext(ctx: unknown): boolean {
  const c = ctx as { isSuperAdmin?: unknown; role?: unknown } | null | undefined;
  return Boolean(c?.isSuperAdmin) || String(c?.role || "").toUpperCase() === "SUPER_ADMIN";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return NextResponse.json(
      {
        success: false,
        error: auth.error,
      },
      { status: auth.status }
    );
  }

  try {
    const { id } = await context.params;
    const templateId = decodeURIComponent(String(id || "")).trim();

    if (!templateId) {
      return NextResponse.json(
        {
          success: false,
          error: "Template ID is required",
        },
        { status: 400 }
      );
    }

    const metaToken = String(auth.context.metaAccessToken || "").trim();

    if (!metaToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Meta access token not configured for this channel/user",
        },
        { status: 400 }
      );
    }

    const localTemplate = await prisma.whatsAppTemplate.findFirst({
      where: {
        OR: [{ metaTemplateId: templateId }, { id: templateId }],
      },
      select: { id: true, userId: true, metaTemplateId: true },
    });

    if (
      localTemplate &&
      !isSuperAdminContext(auth.context) &&
      localTemplate.userId &&
      localTemplate.userId !== auth.context.userId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Template does not belong to this API account",
        },
        { status: 403 }
      );
    }

    const graphTargetId = String(
      localTemplate?.metaTemplateId || templateId
    ).trim();

    const metaResponse = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(
        graphTargetId
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${metaToken}`,
        },
        cache: "no-store",
      }
    );

    const metaData = await metaResponse.json().catch(() => ({}));

    return NextResponse.json(
      {
        success: metaResponse.ok,
        metaStatus: metaResponse.status,
        data: metaData,
      },
      { status: metaResponse.status }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch template by ID",
      },
      { status: 500 }
    );
  }
}