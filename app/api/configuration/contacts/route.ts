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
    const userId = "admin_user";

    if (Array.isArray(body)) {
      let count = 0;
      for (const item of body) {
        if (item.number) {
          const existing = await prisma.whatsAppContact.findFirst({
            where: { number: item.number, userId },
          });
          if (existing) {
            await prisma.whatsAppContact.update({
              where: { id: existing.id },
              data: {
                profileName: item.profileName || "",
                email: item.email || "",
                contactName: item.contactName || "",
              },
            });
          } else {
            await prisma.whatsAppContact.create({
              data: {
                number: item.number,
                profileName: item.profileName || "",
                email: item.email || "",
                contactName: item.contactName || "",
                userId,
              },
            });
          }
          count++;
        }
      }
      return NextResponse.json({ success: true, count });
    }

    const { number, profileName, email, contactName } = body;
    if (!number) {
      return NextResponse.json({ success: false, error: "Mobile number is required" }, { status: 400 });
    }

    const existing = await prisma.whatsAppContact.findFirst({
      where: { number, userId },
    });

    let contact;
    if (existing) {
      contact = await prisma.whatsAppContact.update({
        where: { id: existing.id },
        data: { profileName, email, contactName },
      });
    } else {
      contact = await prisma.whatsAppContact.create({
        data: { number, profileName, email, contactName, userId },
      });
    }

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, number, profileName, contactName, email } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Contact ID required" }, { status: 400 });
    }

    if (!number || !String(number).trim()) {
      return NextResponse.json({ success: false, error: "Mobile number is required" }, { status: 400 });
    }

    const contact = await prisma.whatsAppContact.update({
      where: { id },
      data: {
        number: String(number).trim(),
        profileName: profileName ?? "",
        contactName: contactName ?? "",
        email: email ?? "",
      },
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