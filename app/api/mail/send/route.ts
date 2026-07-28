import { NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/lib/utils/sendEmail";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await sendTransactionalEmail(body);
    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error in mail API route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process email" },
      { status: 500 }
    );
  }
}
