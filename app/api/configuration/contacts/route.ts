import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { id: "desc" }
    });
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newContact = await prisma.contact.create({
      data: {
        userId: body.userId || "default_user",
        number: body.number,
        profileName: body.name || body.profileName || "User",
        email: body.email || "",
      },
    });
    return NextResponse.json(newContact);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.contact.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}