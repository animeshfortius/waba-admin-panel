import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
          password: "Admin@123",
          role: "SUPER_ADMIN",
        },
      });
    } else {
      admin = await prisma.user.create({
        data: {
          name: "Super Admin",
          username: "admin",
          email: "admin@waba.com",
          password: "Admin@123",
          role: "SUPER_ADMIN",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Admin password successfully reset to Admin@123!",
      adminUser: admin.username,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}