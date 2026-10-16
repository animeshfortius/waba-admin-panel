import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Next.js ke latest versions ke liye 'await cookies()' use karna zaroori hai
    const cookieStore = await cookies();
    
    // Cookie delete karein
    cookieStore.delete("token"); 

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}