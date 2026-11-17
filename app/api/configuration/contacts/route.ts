import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch all saved contacts
export async function GET() {
  try {
    const contacts = await prisma.whatsappContact.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add single contact or bulk array from CSV
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Handle Bulk Array Import from CSV
    if (Array.isArray(body)) {
      let count = 0;
      for (const item of body) {
        if (item.number) {
          await prisma.whatsappContact.upsert({
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

    // Handle Single Contact Add
    const { number, profileName, email, contactName } = body;
    if (!number) {
      return NextResponse.json({ success: false, error: "Mobile number is required" }, { status: 400 });
    }

    const contact = await prisma.whatsappContact.upsert({
      where: { number },
      update: { profileName, email, contactName },
      create: { number, profileName, email, contactName },
    });

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    console.error("Contacts POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove contact by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Contact ID required" }, { status: 400 });
    }

    await prisma.whatsappContact.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Contact deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}