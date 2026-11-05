import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, description, address, email, website, category } = body;

    const account = await prisma.wabaAccount.findUnique({ where: { id } });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Meta Graph API Sync
    if (account.accessToken && account.phoneNumberId) {
      try {
        await fetch(
          `https://graph.facebook.com/v18.0/${account.phoneNumberId}/whatsapp_business_profile`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${account.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              about: description,
              address: address,
              email: email,
              websites: website ? [website] : [],
              vertical: category || "OTHER",
            }),
          }
        );
      } catch (metaErr) {
        console.error("Meta Graph API Sync Error:", metaErr);
      }
    }

    // Update in Prisma DB
    const updated = await prisma.wabaAccount.update({
      where: { id },
      data: { description, address, email, website, category },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}