import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Agar aap cookie-based session use kar rahe hain toh cookie expire/delete kar dein
    cookies().delete("token"); // ya jo bhi cookie name aapne session ke liye rakha ho

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}