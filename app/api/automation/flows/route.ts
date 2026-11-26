import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  fetchMetaFlows,
  fetchMetaFlowAssets,
  createOrPublishMetaFlow,
} from "@/lib/metaAutomation";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

async function resolveScopedMetaCredentials(
  ownerWhere: Record<string, any>,
  wabaId?: string,
  phoneNumberId?: string
) {
  const accounts = await prisma.wabaAccount.findMany({
    where: ownerWhere,
  });

  if (wabaId || phoneNumberId) {
    const matched = accounts.find(
      (a: any) =>
        (wabaId && a.wabaId === wabaId) ||
        (phoneNumberId &&
          (a.phoneNumberId === phoneNumberId ||
            a.phoneNumberId === `PHONE_${phoneNumberId}` ||
            a.phoneNumberId?.replace("PHONE_", "") === phoneNumberId))
    );

    if (!matched) {
      return {
        authorized: false,
        wabaId: "",
        phoneNumberId: "",
        accessToken: "",
        ownerUserId: null as string | null,
      };
    }

    return {
      authorized: true,
      wabaId: matched.wabaId || wabaId || "",
      phoneNumberId: (matched as any).phoneNumberId || phoneNumberId || "",
      accessToken: String((matched as any).accessToken || "").trim(),
      ownerUserId: (matched as any).userId || null,
    };
  }

  const fallbackAccount = accounts[0] as any;
  return {
    authorized: true,
    wabaId: fallbackAccount?.wabaId || "",
    phoneNumberId: fallbackAccount?.phoneNumberId || "",
    accessToken: String(fallbackAccount?.accessToken || "").trim(),
    ownerUserId: fallbackAccount?.userId || null,
  };
}

export async function GET(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const wabaIdParam = searchParams.get("wabaId") || undefined;
    const phoneNumberIdParam = searchParams.get("phoneNumberId") || undefined;
    const sync = searchParams.get("sync") === "true";

    const ownerWhere = getOwnerWhere(tenant);
    const creds = await resolveScopedMetaCredentials(
      ownerWhere,
      wabaIdParam,
      phoneNumberIdParam
    );

    if (!creds.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Requested WABA/phoneNumberId does not belong to your account",
        },
        { status: 403 }
      );
    }

    const flowOwnerUserId = creds.ownerUserId || tenant.userId;

    if (sync && creds.wabaId && creds.accessToken) {
      const metaFlows = await fetchMetaFlows(creds.wabaId, creds.accessToken);
      for (const mf of metaFlows) {
        let assetJson: string | null = null;
        try {
          assetJson = await fetchMetaFlowAssets(mf.id, creds.accessToken);
        } catch {
          assetJson = null;
        }

        await (prisma.whatsAppFlowRecord as any).upsert({
          where: { metaFlowId: String(mf.id) },
          update: {
            userId: flowOwnerUserId,
            wabaId: creds.wabaId,
            phoneNumberId: creds.phoneNumberId || null,
            name: mf.name || "Untitled Flow",
            categories: JSON.stringify(mf.categories || ["OTHER"]),
            status: mf.status || "DRAFT",
            endpointUri: mf.endpoint_uri || null,
            ...(assetJson ? { flowJson: assetJson } : {}),
            syncedAt: new Date(),
          },
          create: {
            userId: flowOwnerUserId,
            wabaId: creds.wabaId,
            phoneNumberId: creds.phoneNumberId || null,
            metaFlowId: String(mf.id),
            name: mf.name || "Untitled Flow",
            categories: JSON.stringify(mf.categories || ["OTHER"]),
            status: mf.status || "DRAFT",
            endpointUri: mf.endpoint_uri || null,
            flowJson: assetJson,
            syncedAt: new Date(),
          },
        });
      }
    }

    const whereClause: any = {
      ...ownerWhere,
    };
    if (creds.wabaId) {
      whereClause.wabaId = creds.wabaId;
    }

    const flows = await prisma.whatsAppFlowRecord.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, flows });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      wabaId,
      phoneNumberId,
      name,
      categories,
      endpointUri,
      flowJson,
      publish,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, error: "Flow name is required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const creds = await resolveScopedMetaCredentials(
      ownerWhere,
      wabaId,
      phoneNumberId
    );

    if (!creds.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Requested WABA/phoneNumberId does not belong to your account",
        },
        { status: 403 }
      );
    }

    let metaFlowId: string | null = null;
    let status = "DRAFT";

    if (creds.wabaId && creds.accessToken) {
      const created = await createOrPublishMetaFlow({
        wabaId: creds.wabaId,
        accessToken: creds.accessToken,
        name: String(name).trim(),
        categories: Array.isArray(categories) ? categories : ["OTHER"],
        endpointUri: endpointUri || undefined,
        publish: Boolean(publish),
      });
      metaFlowId = String(created.id);
      status = publish ? "PUBLISHED" : "DRAFT";
    }

    const record = await (prisma.whatsAppFlowRecord as any).create({
      data: {
        userId: creds.ownerUserId || tenant.userId,
        wabaId: creds.wabaId || "default_waba",
        phoneNumberId: creds.phoneNumberId || null,
        metaFlowId,
        name: String(name).trim(),
        categories: JSON.stringify(categories || ["OTHER"]),
        status,
        endpointUri: endpointUri || null,
        flowJson: flowJson || null,
      },
    });

    return NextResponse.json({ success: true, flow: record });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}