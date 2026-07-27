import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(bodyText)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error("Invalid Razorpay webhook signature");
        return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;

    if (event === "payment.captured") {
      const paymentEntity = payload.payload?.payment?.entity;
      console.log(`Razorpay Webhook: Payment ${paymentEntity?.id} captured for order ${paymentEntity?.order_id}`);
    } else if (event === "payment.failed") {
      const paymentEntity = payload.payload?.payment?.entity;
      console.log(`Razorpay Webhook: Payment ${paymentEntity?.id} failed for order ${paymentEntity?.order_id}`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
