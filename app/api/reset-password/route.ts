import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-auth";

function isAuthorizedReset(request: Request, tenant: any): boolean {
  if (tenant?.isSuperAdmin) return true;

  const resetSecret = String(process.env.ADMIN_RESET_SECRET || "").trim();
  if (!resetSecret) return false;

  const authHeader = String(request.headers.get("authorization") || "").trim();
  const customHeader = String(
    request.headers.get("x-admin-reset-secret") || ""
  ).trim();
  const { searchParams } = new URL(request.url);
  const querySecret = String(searchParams.get("secret") || "").trim();

  return (
    authHeader === `Bearer ${resetSecret}` ||
    customHeader === resetSecret ||
    querySecret === resetSecret
  );
}

export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!isAuthorizedReset(request, tenant)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Super Admin or valid reset secret required",
        },
        { status: 403 }
      );
    }

    const nextPassword = String(process.env.SEED_ADMIN_PASSWORD || "").trim();
    if (!nextPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "SEED_ADMIN_PASSWORD environment variable is not configured",
        },
        { status: 400 }
      );
    }

    let admin = await prisma.user.findFirst({
      where: {
        OR: [{ username: "admin" }, { role: "SUPER_ADMIN" }],
      },
    });

    if (admin) {
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: {
          username: "admin",
          password: nextPassword,
          role: "SUPER_ADMIN",
        },
      });
    } else {
      admin = await prisma.user.create({
        data: {
          name: "Super Admin",
          username: "admin",
          email: "info@fortiusinfocom.com",
          password: nextPassword,
          role: "SUPER_ADMIN",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Admin account updated successfully",
      adminUser: admin.username,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to reset admin" },
      { status: 500 }
    );
  }
}