import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, recipientEmail, recipientName, orderNumber, items, total, shippingAddress, paymentMethod, paymentStatus, contactMessage } = body;

    if (!type || !recipientEmail) {
      return NextResponse.json(
        { success: false, error: "Missing required mail parameters (type, recipientEmail)" },
        { status: 400 }
      );
    }

    // SMTP Configuration
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER || process.env.BUSINESS_EMAIL || "nikhilchandra1818@gmail.com";
    const smtpPass = process.env.SMTP_PASS || "";

    // Create Transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpPass
        ? {
            user: smtpUser,
            pass: smtpPass,
          }
        : undefined,
    });

    let subject = "";
    let htmlContent = "";

    if (type === "order_confirmation") {
      subject = `Order Confirmation #${orderNumber} – YUMI DXB Fashion`;
      
      const itemsListHtml = (items || [])
        .map(
          (item: any) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eeeeee;">
              <strong>${item.productName}</strong><br/>
              <span style="font-size: 12px; color: #666666;">Size: ${item.size} | Qty: ${item.quantity}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right;">
              ₹${((item.discountPrice ?? item.price) * item.quantity).toLocaleString("en-IN")}
            </td>
          </tr>`
        )
        .join("");

      htmlContent = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F7F3EE; padding: 24px; color: #1A1A1A;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid rgba(26,26,26,0.1);">
            <h1 style="font-family: Georgia, serif; color: #1F2A44; margin: 0; font-size: 28px;">YUMI DXB <span style="font-style: italic; color: #C97B7B;">Fashion</span></h1>
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #6B6B6B; margin-top: 4px;">Where Comfort Meets Elegance</p>
          </div>

          <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; margin-top: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
            <h2 style="font-family: Georgia, serif; color: #1F2A44; margin-top: 0;">Thank you for your order, ${recipientName || "Valued Customer"}!</h2>
            <p style="font-size: 14px; color: #444444; line-height: 1.6;">
              We have received your order <strong>#${orderNumber}</strong>. Our artisans in Mangaluru are carefully preparing your creations.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
              <thead>
                <tr style="background-color: #F7F3EE; text-align: left;">
                  <th style="padding: 10px; font-size: 12px; text-transform: uppercase; color: #1F2A44;">Item</th>
                  <th style="padding: 10px; font-size: 12px; text-transform: uppercase; color: #1F2A44; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsListHtml}
              </tbody>
            </table>

            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #1F2A44; font-size: 16px; font-weight: bold; text-align: right; color: #1F2A44;">
              Total Amount: ₹${Number(total || 0).toLocaleString("en-IN")}
            </div>

            <div style="margin-top: 24px; padding: 16px; background-color: #F7F3EE; border-radius: 6px; font-size: 13px; color: #555555;">
              <strong style="color: #1F2A44;">Delivery Address:</strong><br/>
              ${shippingAddress ? `${shippingAddress.fullName}, ${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}` : "Standard Shipping"}<br/>
              <strong>Payment Method:</strong> ${paymentMethod === "online" ? "Online Payment (Razorpay - PAID)" : "Cash on Delivery (COD)"}
            </div>
          </div>

          <div style="text-align: center; padding-top: 24px; font-size: 12px; color: #888888;">
            <p>© ${new Date().getFullYear()} YUMI DXB Fashion. All rights reserved.<br/>Mangaluru, Karnataka, India</p>
          </div>
        </div>
      `;
    } else if (type === "contact_inquiry") {
      subject = `Message Received – YUMI DXB Support`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F7F3EE; padding: 24px; color: #1A1A1A;">
          <h2 style="color: #1F2A44;">Hello ${recipientName || "there"},</h2>
          <p>Thank you for contacting YUMI DXB Fashion. We have received your message:</p>
          <blockquote style="background: #ffffff; padding: 15px; border-left: 4px solid #C97B7B; margin: 15px 0;">
            "${contactMessage}"
          </blockquote>
          <p>Our customer care team will get back to you within 24 hours.</p>
        </div>
      `;
    }

    // Send Mail (with graceful error handling if SMTP credentials aren't active)
    if (smtpPass) {
      await transporter.sendMail({
        from: `"YUMI DXB Fashion" <${smtpUser}>`,
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
      });
      console.log(`Email successfully dispatched to ${recipientEmail}`);
    } else {
      console.log(`[Mail Simulation Mode] Email prepared for ${recipientEmail}: ${subject}`);
    }

    return NextResponse.json({
      success: true,
      message: "Email processed successfully",
    });
  } catch (error: any) {
    console.error("Error in mail API route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process email" },
      { status: 500 }
    );
  }
}
