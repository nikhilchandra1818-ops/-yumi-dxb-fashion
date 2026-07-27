import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getCollection, where } from "@/lib/firebase/firestore";
import { Product } from "@/types";
import { generateOrderNumber } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cartItems, email } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    // 1. Calculate amount on server-side to prevent tampering
    let serverSubtotal = 0;

    // Fetch product details from Firestore to verify prices
    const productIds = cartItems.map((item: any) => item.productId);
    const activeProducts = await getCollection<Product>("products", [
      where("isActive", "==", true),
      where("isArchived", "==", false),
    ]);

    for (const item of cartItems) {
      const dbProduct = activeProducts.find((p) => p.id === item.productId);
      const unitPrice = dbProduct
        ? dbProduct.discountPrice && dbProduct.discountPrice < dbProduct.price
          ? dbProduct.discountPrice
          : dbProduct.price
        : item.discountPrice && item.discountPrice < item.price
        ? item.discountPrice
        : item.price;

      serverSubtotal += unitPrice * item.quantity;
    }

    // Free shipping threshold = Rs 1500 (or default 100)
    const shippingFee = serverSubtotal >= 1500 ? 0 : 100;
    const totalAmount = serverSubtotal + shippingFee;
    const amountInPaise = Math.round(totalAmount * 100);
    const orderNumber = generateOrderNumber();

    // 2. Initialize Razorpay Instance
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // 3. Create Order on Razorpay
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${orderNumber.replace(/[^a-zA-Z0-9_]/g, "_")}`,
      notes: {
        orderNumber,
        email: email || "",
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: keyId,
      orderNumber,
      calculatedTotal: totalAmount,
      shippingFee,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
