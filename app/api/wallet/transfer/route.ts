import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { senderId, receiverId, amount, balanceType } = await req.json(); // balanceType: 'ACTUAL' or 'VIRTUAL'

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });

    if (!sender || !receiver) {
      return NextResponse.json({ error: "Sender or Receiver not found" }, { status: 404 });
    }

    // 1. Agar Sender SUPER_ADMIN nahi hai, tabhi uske account se balance katega
    if (sender.role !== "SUPER_ADMIN") {
      if (balanceType === "ACTUAL" && sender.actualBalance < amount) {
        return NextResponse.json({ error: "Insufficient Actual Balance" }, { status: 400 });
      }
      if (balanceType === "VIRTUAL" && sender.virtualBalance < amount) {
        return NextResponse.json({ error: "Insufficient Virtual Balance" }, { status: 400 });
      }

      // Sender ka balance deduct karein
      await prisma.user.update({
        where: { id: senderId },
        data: {
          actualBalance: balanceType === "ACTUAL" ? sender.actualBalance - amount : sender.actualBalance,
          virtualBalance: balanceType === "VIRTUAL" ? sender.virtualBalance - amount : sender.virtualBalance,
        },
      });
    }

    // 2. Receiver ko balance assign karein
    if (receiver.role === "RESELLER") {
      // Reseller ko Actual ya Virtual dono mil sakte hain
      await prisma.user.update({
        where: { id: receiverId },
        data: {
          actualBalance: balanceType === "ACTUAL" ? receiver.actualBalance + amount : receiver.actualBalance,
          virtualBalance: balanceType === "VIRTUAL" ? receiver.virtualBalance + amount : receiver.virtualBalance,
        },
      });
    } else if (receiver.role === "USER") {
      // User ko sirf Virtual balance milega (aur wahi uska walletBalance ban jayega)
      await prisma.user.update({
        where: { id: receiverId },
        data: {
          virtualBalance: receiver.virtualBalance + amount,
          walletBalance: receiver.walletBalance + amount, 
        },
      });
    }

    return NextResponse.json({ message: "Balance transferred successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}