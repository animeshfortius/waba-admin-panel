import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

function normalizeContactNumber(rawNumber: unknown): string {
  let cleaned = String(rawNumber ?? "").replace(/\D/g, "").trim();
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

export async function GET() {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const contacts = await prisma.whatsAppContact.findMany({
      where: ownerWhere,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (Array.isArray(body)) {
      let count = 0;
      for (const item of body) {
        const cleanNumber = normalizeContactNumber(item?.number);
        if (!cleanNumber) continue;

        const itemOwnerId =
          item?.userId &&
          (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(item.userId))
            ? item.userId
            : tenant.userId;

        const existing = await prisma.whatsAppContact.findFirst({
          where: { number: cleanNumber, userId: itemOwnerId },
        });

        if (existing) {
          await prisma.whatsAppContact.update({
            where: { id: existing.id },
            data: {
              profileName:
                item.profileName !== undefined
                  ? String(item.profileName).trim()
                  : existing.profileName,
              email:
                item.email !== undefined
                  ? String(item.email).trim()
                  : existing.email,
              contactName:
                item.contactName !== undefined
                  ? String(item.contactName).trim()
                  : existing.contactName,
            },
          });
        } else {
          await prisma.whatsAppContact.create({
            data: {
              number: cleanNumber,
              profileName: item.profileName ? String(item.profileName).trim() : "",
              email: item.email ? String(item.email).trim() : "",
              contactName: item.contactName ? String(item.contactName).trim() : "",
              userId: itemOwnerId,
            },
          });
        }
        count++;
      }
      return NextResponse.json({ success: true, count });
    }

    const { number, profileName, email, contactName, userId } = body;
    const cleanNumber = normalizeContactNumber(number);
    if (!cleanNumber) {
      return NextResponse.json(
        { success: false, error: "Valid mobile number is required" },
        { status: 400 }
      );
    }

    const targetOwnerId =
      userId &&
      (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(userId))
        ? userId
        : tenant.userId;

    const existing = await prisma.whatsAppContact.findFirst({
      where: { number: cleanNumber, userId: targetOwnerId },
    });

    let contact;
    if (existing) {
      contact = await prisma.whatsAppContact.update({
        where: { id: existing.id },
        data: {
          profileName:
            profileName !== undefined
              ? String(profileName).trim()
              : existing.profileName,
          email: email !== undefined ? String(email).trim() : existing.email,
          contactName:
            contactName !== undefined
              ? String(contactName).trim()
              : existing.contactName,
        },
      });
    } else {
      contact = await prisma.whatsAppContact.create({
        data: {
          number: cleanNumber,
          profileName: profileName ? String(profileName).trim() : "",
          email: email ? String(email).trim() : "",
          contactName: contactName ? String(contactName).trim() : "",
          userId: targetOwnerId,
        },
      });
    }

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = String(body?.id || "").trim();
    const { number, profileName, contactName, email } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Contact ID required" },
        { status: 400 }
      );
    }

    const cleanNumber = normalizeContactNumber(number);
    if (!cleanNumber) {
      return NextResponse.json(
        { success: false, error: "Valid mobile number is required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const existing = await prisma.whatsAppContact.findFirst({
      where: { id, ...ownerWhere },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Contact not found or access denied" },
        { status: 404 }
      );
    }

    const contact = await prisma.whatsAppContact.update({
      where: { id: existing.id },
      data: {
        number: cleanNumber,
        profileName:
          profileName !== undefined
            ? String(profileName).trim()
            : existing.profileName,
        contactName:
          contactName !== undefined
            ? String(contactName).trim()
            : existing.contactName,
        email: email !== undefined ? String(email).trim() : existing.email,
      },
    });

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Contact ID required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const existing = await prisma.whatsAppContact.findFirst({
      where: { id, ...ownerWhere },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Contact not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.whatsAppContact.delete({ where: { id: existing.id } });

    return NextResponse.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}