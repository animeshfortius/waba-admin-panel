import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const contacts = await prisma.whatsAppContact.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      let count = 0;
      for (const item of body) {
        if (item.number) {
          await prisma.whatsAppContact.upsert({
            where: { number: item.number },
            update: {
              profileName: item.profileName || "",
              email: item.email || "",
              contactName: item.contactName || "",
            },
            create: {
              number: item.number,
              profileName: item.profileName || "",
              email: item.email || "",
              contactName: item.contactName || "",
            },
          });
          count++;
        }
      }
      return NextResponse.json({ success: true, count });
    }

    const { number, profileName, email, contactName } = body;
    if (!number) {
      return NextResponse.json({ success: false, error: "Mobile number is required" }, { status: 400 });
    }

    const contact = await prisma.whatsAppContact.upsert({
      where: { number },
      update: { profileName, email, contactName },
      create: { number, profileName, email, contactName },
    });

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Contact ID required" }, { status: 400 });
    }

    await prisma.whatsAppContact.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Contact deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}