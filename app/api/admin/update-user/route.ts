import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      userId, 
      name, 
      email, 
      phone, 
      role, 
      expiryDate, 
      password,
      whatsappApiEnabled,
      chatbotEnabled,
      secureReporting,
      internationalAccount
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;

    // 🟢 WhatsApp Account Settings Toggles
    if (whatsappApiEnabled !== undefined) updateData.whatsappApiEnabled = whatsappApiEnabled;
    if (chatbotEnabled !== undefined) updateData.chatbotEnabled = chatbotEnabled;
    if (secureReporting !== undefined) updateData.secureReporting = secureReporting;
    if (internationalAccount !== undefined) updateData.internationalAccount = internationalAccount;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "User details and WhatsApp settings updated successfully in database!",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}