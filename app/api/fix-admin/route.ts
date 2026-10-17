import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { username: "admin" },
    });

    let adminUser;
    if (existingAdmin) {
      // Update existing admin password to Admin@123
      adminUser = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: "Admin@123",
          role: "SUPER_ADMIN",
        },
      });
    } else {
      // Create fresh admin if not found
      adminUser = await prisma.user.create({
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
      message: "Admin account forcefully reset! Username: admin, Password: Admin@123",
      user: adminUser.username,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}