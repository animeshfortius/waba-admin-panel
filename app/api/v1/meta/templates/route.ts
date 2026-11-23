import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";

type TemplateButtonInput = {
  type?: string;
  text?: string;
  value?: string;
  url?: string;
  phone_number?: string;
  example?: string[];
};

function buildMetaComponentsFromBody(body: Record<string, unknown>) {
  if (Array.isArray(body.components) && body.components.length > 0) {
    return body.components;
  }

  const category = String(body.category || "UTILITY")
    .trim()
    .toUpperCase();
  const components: Array<Record<string, unknown>> = [];
  const headerType = String(body.headerType || "NONE").toUpperCase();
  const headerText = String(body.headerText || "").trim();
  const mediaUrl = String(body.mediaUrl || "").trim();
  const rawBodyText = String(body.bodyText || "").trim();
  const bodyText =
    category === "AUTHENTICATION" &&
    (!rawBodyText || rawBodyText.includes("welcome to our service"))
      ? "{{1}} is your verification code."
      : rawBodyText;
  const footerText = String(body.footerText || "").trim();
  const variableSamples = Array.isArray(body.variableSamples)
    ? body.variableSamples.map((v) => String(v ?? ""))
    : [];
  const buttonsInput = Array.isArray(body.buttons)
    ? (body.buttons as TemplateButtonInput[])
    : [];

  if (category !== "AUTHENTICATION") {
    if (headerType === "TEXT" && headerText) {
      const headerComp: Record<string, unknown> = {
        type: "HEADER",
        format: "TEXT",
        text: headerText,
      };
      const headerVars = headerText.match(/\{\{\d+\}\}/g);
      if (headerVars && headerVars.length > 0) {
        headerComp.example = {
          header_text: headerVars.map((_, i) => `SampleHeader${i + 1}`),
        };
      }
      components.push(headerComp);
    } else if (
      headerType === "IMAGE" ||
      headerType === "VIDEO" ||
      headerType === "DOCUMENT"
    ) {
      const headerComp: Record<string, unknown> = {
        type: "HEADER",
        format: headerType,
      };
      if (mediaUrl) {
        headerComp.example = {
          header_handle: [mediaUrl],
        };
      }
      components.push(headerComp);
    } else if (headerType === "LOCATION") {
      components.push({
        type: "HEADER",
        format: "LOCATION",
      });
    }
  }

  const bodyComp: Record<string, unknown> = {
    type: "BODY",
    text: bodyText,
  };
  const bodyVarMatches = bodyText.match(/\{\{\d+\}\}/g);
  if (bodyVarMatches && bodyVarMatches.length > 0) {
    const samples = bodyVarMatches.map((_, idx) => {
      const val = (variableSamples[idx] || "").trim();
      if (val) return val;
      return category === "AUTHENTICATION" ? "123456" : `Sample${idx + 1}`;
    });
    bodyComp.example = {
      body_text: [samples],
    };
  }
  components.push(bodyComp);

  if (category !== "AUTHENTICATION" && footerText) {
    components.push({
      type: "FOOTER",
      text: footerText,
    });
  }

  if (buttonsInput.length > 0) {
    const metaButtons = buttonsInput
      .filter((b) => String(b?.text || "").trim())
      .map((b) => {
        const rawType = String(b.type || "QUICK_REPLY").toUpperCase();
        const text = String(b.text || "").trim();
        const value = String(b.value || b.url || b.phone_number || "").trim();

        if (rawType === "URL" || rawType === "VISIT WEBSITE") {
          const btn: Record<string, unknown> = {
            type: "URL",
            text,
            url: value || "https://example.com/{{1}}",
          };
          if ((value || "").includes("{{1}}")) {
            btn.example = [b.example?.[0] || "https://example.com/offer"];
          }
          return btn;
        }

        if (rawType === "PHONE_NUMBER" || rawType === "CALL PHONE NUMBER") {
          return {
            type: "PHONE_NUMBER",
            text,
            phone_number: value || "+919876543210",
          };
        }

        if (rawType === "COPY_CODE" || rawType === "COPY OFFER CODE") {
          return {
            type: "COPY_CODE",
            text,
            example: [value || "123456"],
          };
        }

        return {
          type: "QUICK_REPLY",
          text,
        };
      });

    if (metaButtons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: metaButtons,
      });
    }
  }

  return components;
}

export async function GET(request: NextRequest) {
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
    const metaToken =
      auth.context.metaAccessToken || process.env.META_ACCESS_TOKEN;
    const wabaId = auth.context.wabaId || process.env.META_WABA_ID;

    if (!metaToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Meta access token not configured for this channel/user",
        },
        { status: 400 }
      );
    }

    if (!wabaId) {
      return NextResponse.json(
        {
          success: false,
          error: "WABA ID not configured for this channel/user",
        },
        { status: 400 }
      );
    }

    const graphVersion = "v21.0";
    const metaResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
        wabaId
      )}/message_templates`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
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
            : "Failed to fetch Meta templates",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") {
          if (
            key === "components" ||
            key === "variableSamples" ||
            key === "buttons" ||
            key === "authConfig" ||
            key === "carouselCards"
          ) {
            try {
              body[key] = JSON.parse(value);
            } catch {
              body[key] = value;
            }
          } else {
            body[key] = value;
          }
        } else if (value && typeof value === "object" && "name" in value) {
          body.mediaFileName = (value as File).name;
          body.mediaMimeType = (value as File).type;
        }
      }
    } else {
      body = (await request.json()) as Record<string, unknown>;
    }

    const metaToken =
      auth.context.metaAccessToken || process.env.META_ACCESS_TOKEN;
    const wabaId = String(
      body?.wabaId || auth.context.wabaId || process.env.META_WABA_ID || ""
    ).trim();

    if (!metaToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Meta access token not configured for this channel/user",
        },
        { status: 400 }
      );
    }

    if (!wabaId) {
      return NextResponse.json(
        {
          success: false,
          error: "WABA ID not configured for this channel/user",
        },
        { status: 400 }
      );
    }

    const name = String(body?.name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");
    const language = String(body?.language || "en_US").trim();
    const category = String(body?.category || "UTILITY")
      .trim()
      .toUpperCase();
    const rawBodyText = String(body?.bodyText || "").trim();
    const bodyText =
      category === "AUTHENTICATION" &&
      (!rawBodyText || rawBodyText.includes("welcome to our service"))
        ? "{{1}} is your verification code."
        : rawBodyText;

    if (!name || !bodyText) {
      return NextResponse.json(
        {
          success: false,
          error: "Template 'name' and 'bodyText' are required",
        },
        { status: 400 }
      );
    }

    const metaPayload: Record<string, unknown> = {
      name,
      language,
      category,
      components: buildMetaComponentsFromBody({
        ...body,
        category,
        bodyText,
      }),
    };

    if (typeof body?.allowCategoryChange === "boolean") {
      metaPayload.allow_category_change = body.allowCategoryChange;
    }

    const graphVersion = "v21.0";
    const metaResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
        wabaId
      )}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metaPayload),
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
            : "Failed to create Meta template",
      },
      { status: 500 }
    );
  }
}