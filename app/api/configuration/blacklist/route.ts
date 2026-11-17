import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch all blacklisted numbers
export async function GET() {
  try {
    const blacklist = await prisma.blacklistedNumber.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(blacklist);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Block single number or bulk array from CSV
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Handle Bulk Array Import from CSV
    if (Array.isArray(body)) {
      let count = 0;
      for (const item of body) {
        if (item.number) {
          await prisma.blacklistedNumber.upsert({
            where: { number: item.number },
            update: {},
            create: { number: item.number },
          });
          count++;
        }
      }
      return NextResponse.json({ success: true, count });
    }

    // Handle Single Number Block
    const { number } = body;
    if (!number) {
      return NextResponse.json({ success: false, error: "Number is required" }, { status: 400 });
    }

    const blocked = await prisma.blacklistedNumber.upsert({
      where: { number },
      update: {},
      create: { number },
    });

    return NextResponse.json({ success: true, blocked });
  } catch (error: any) {
    console.error("Blacklist POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Unblock number by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
    }

    await prisma.blacklistedNumber.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Number unblocked successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}