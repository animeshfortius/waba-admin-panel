const GRAPH_BASE = "https://graph.facebook.com/v21.0";

export async function fetchMetaFlows(wabaId: string, accessToken: string) {
  const url = `${GRAPH_BASE}/${wabaId}/flows?fields=id,name,status,categories,endpoint_uri,json_version,validation_errors`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Failed to fetch Meta WhatsApp Flows");
  }
  return data.data || [];
}

export async function fetchMetaFlowAssets(flowId: string, accessToken: string) {
  const url = `${GRAPH_BASE}/${flowId}/assets`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) return null;
  return data.data?.[0]?.flow_json || null;
}

export async function createOrPublishMetaFlow(params: {
  wabaId: string;
  accessToken: string;
  name: string;
  categories?: string[];
  endpointUri?: string;
  publish?: boolean;
}) {
  const createRes = await fetch(`${GRAPH_BASE}/${params.wabaId}/flows`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: params.name,
      categories: params.categories || ["OTHER"],
      ...(params.endpointUri ? { endpoint_uri: params.endpointUri } : {}),
    }),
  });
  const created = await createRes.json();
  if (!createRes.ok) {
    throw new Error(created?.error?.message || "Failed to create Flow on Meta");
  }

  if (params.publish && created.id) {
    const pubRes = await fetch(`${GRAPH_BASE}/${created.id}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${params.accessToken}` },
    });
    const pubData = await pubRes.json();
    if (!pubRes.ok) {
      throw new Error(pubData?.error?.message || "Flow created but failed to publish");
    }
  }

  return created;
}

export async function fetchMetaQrCodes(phoneNumberId: string, accessToken: string) {
  const url = `${GRAPH_BASE}/${phoneNumberId}/message_qrd_codes?fields=code,prefilled_message,deep_link_url,qr_image_url`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Failed to fetch Meta QR Codes");
  }
  return data.data || [];
}

export async function createMetaQrCode(params: {
  phoneNumberId: string;
  accessToken: string;
  prefilledMessage: string;
  generateQrImage?: "PNG" | "SVG";
}) {
  const res = await fetch(`${GRAPH_BASE}/${params.phoneNumberId}/message_qrd_codes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prefilled_message: params.prefilledMessage,
      generate_qr_image: params.generateQrImage || "PNG",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Failed to create QR Code on Meta");
  }
  return data;
}

export async function sendWhatsAppMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  payload: Record<string, any>;
}) {
  const res = await fetch(`${GRAPH_BASE}/${params.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: params.to,
      ...params.payload,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Failed to send WhatsApp message");
  }
  return data;
}