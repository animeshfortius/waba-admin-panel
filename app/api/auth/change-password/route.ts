import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Aapka prisma client path
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Sari fields bharni zaroori hain!" }, { status: 400 });
    }

    // User ko database mein dhoondhein
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User nahi mila!" }, { status: 404 });
    }

    // Current password match check karein
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Current password galat hai!" }, { status: 400 });
    }

    // Naye password ko hash karein
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Database mein password update karein
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Password successfully update ho gaya hai!" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Kuch galat ho gaya, dobara try karein." }, { status: 500 });
  }
}