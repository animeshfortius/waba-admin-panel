import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMetaFlows, fetchMetaFlowAssets, createOrPublishMetaFlow } from "@/lib/metaAutomation";

async function resolveMetaCredentials(wabaId?: string, phoneNumberId?: string) {
  const accounts = await prisma.wabaAccount.findMany();
  const matched =
    accounts.find((a: any) => (wabaId && a.wabaId === wabaId) || (phoneNumberId && a.phoneNumberId === phoneNumberId)) ||
    accounts[0];

  const accessToken =
    (matched as any)?.accessToken ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    "";

  return {
    wabaId: wabaId || matched?.wabaId || "",
    phoneNumberId: phoneNumberId || (matched as any)?.phoneNumberId || "",
    accessToken,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const wabaIdParam = searchParams.get("wabaId") || undefined;
    const phoneNumberIdParam = searchParams.get("phoneNumberId") || undefined;
    const sync = searchParams.get("sync") === "true";

    const creds = await resolveMetaCredentials(wabaIdParam, phoneNumberIdParam);

    if (sync && creds.wabaId && creds.accessToken) {
      const metaFlows = await fetchMetaFlows(creds.wabaId, creds.accessToken);
      for (const mf of metaFlows) {
        let assetJson: string | null = null;
        try {
          assetJson = await fetchMetaFlowAssets(mf.id, creds.accessToken);
        } catch {
          assetJson = null;
        }

        await prisma.whatsAppFlowRecord.upsert({
          where: { metaFlowId: String(mf.id) },
          update: {
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

    const flows = await prisma.whatsAppFlowRecord.findMany({
      where: creds.wabaId ? { wabaId: creds.wabaId } : undefined,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, flows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { wabaId, phoneNumberId, name, categories, endpointUri, flowJson, publish } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ success: false, error: "Flow name is required" }, { status: 400 });
    }

    const creds = await resolveMetaCredentials(wabaId, phoneNumberId);
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

    const record = await prisma.whatsAppFlowRecord.create({
      data: {
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}