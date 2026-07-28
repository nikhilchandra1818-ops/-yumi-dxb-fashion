import nodemailer from "nodemailer";

export interface TransactionalEmailData {
  type: "welcome" | "order_confirmation" | "contact_inquiry";
  recipientEmail: string;
  recipientName?: string;
  orderNumber?: string;
  items?: any[];
  subtotal?: number;
  shippingFee?: number;
  total?: number;
  shippingAddress?: any;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentReference?: string;
  contactMessage?: string;
}

export async function sendTransactionalEmail(data: TransactionalEmailData) {
  const {
    type,
    recipientEmail,
    recipientName,
    orderNumber,
    items,
    subtotal,
    shippingFee,
    total,
    shippingAddress,
    paymentMethod,
    paymentStatus,
    paymentReference,
    contactMessage,
  } = data;

  if (!type || !recipientEmail) {
    throw new Error("Missing required email parameters (type, recipientEmail)");
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

  // 1. WELCOME EMAIL
  if (type === "welcome") {
    subject = `Welcome to YUMI DXB Fashion, ${recipientName || "Valued Customer"}! ✨`;
    htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F7F3EE; padding: 30px; color: #1A1A1A;">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid rgba(26,26,26,0.1);">
          <h1 style="font-family: Georgia, serif; color: #1F2A44; margin: 0; font-size: 30px;">YUMI DXB <span style="font-style: italic; color: #C97B7B;">Fashion</span></h1>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #6B6B6B; margin-top: 6px;">Where Comfort Meets Elegance</p>
        </div>

        <div style="background-color: #ffffff; padding: 28px; border-radius: 12px; margin-top: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
          <h2 style="font-family: Georgia, serif; color: #1F2A44; margin-top: 0; font-size: 22px;">Welcome to our family, ${recipientName || "there"}!</h2>
          <p style="font-size: 14px; color: #444444; line-height: 1.7;">
            Thank you for registering an account with <strong>YUMI DXB Fashion</strong>. Founded by two sisters in Mangaluru, our atelier crafts every Kaftan, Abaya, Co-ord, and Nightwear set with love, hand-selected fabrics, and uncompromised comfort.
          </p>
          
          <div style="margin: 24px 0; padding: 20px; background-color: #F7F3EE; border-radius: 8px; border-left: 4px solid #C97B7B;">
            <h4 style="margin: 0 0 8px 0; color: #1F2A44; font-size: 14px;">What you can do with your account:</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #555555; line-height: 1.6;">
              <li>Track live orders from our atelier to your doorstep.</li>
              <li>Download official tax invoices for any purchase.</li>
              <li>Save your delivery addresses for 1-click checkout.</li>
              <li>Use your personal AI Style &amp; Drape Assistant.</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 28px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://yumi-dxb-fashion-ten.vercel.app"}/collections" 
               style="background-color: #1F2A44; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
              Explore New Collection
            </a>
          </div>
        </div>

        <div style="text-align: center; padding-top: 24px; font-size: 11px; color: #888888; line-height: 1.5;">
          <p>© ${new Date().getFullYear()} YUMI DXB Fashion. All rights reserved.<br/>Mangaluru, Karnataka, India | Contact: support@yumidxb.com</p>
        </div>
      </div>
    `;
  }
  // 2. ORDER CONFIRMATION & EMBEDDED OFFICIAL TAX INVOICE
  else if (type === "order_confirmation") {
    subject = `Official Tax Invoice & Order Confirmation #${orderNumber} – YUMI DXB`;

    const formattedDate = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const itemsListHtml = (items || [])
      .map(
        (item: any, idx: number) => `
        <tr style="border-bottom: 1px solid #EEEEEE;">
          <td style="padding: 12px 8px; text-align: center; color: #666666; font-size: 12px;">${idx + 1}</td>
          <td style="padding: 12px 8px; font-size: 13px; color: #111111;">
            <strong>${item.productName}</strong><br/>
            <span style="font-size: 11px; color: #666666;">Size: ${item.size} | Color: ${item.color || "Default"}</span>
          </td>
          <td style="padding: 12px 8px; text-align: center; font-size: 13px; color: #111111;">${item.quantity}</td>
          <td style="padding: 12px 8px; text-align: right; font-size: 13px; color: #111111;">₹${(item.discountPrice ?? item.price).toLocaleString("en-IN")}</td>
          <td style="padding: 12px 8px; text-align: right; font-size: 13px; font-weight: bold; color: #1F2A44;">₹${((item.discountPrice ?? item.price) * item.quantity).toLocaleString("en-IN")}</td>
        </tr>`
      )
      .join("");

    const addressText = shippingAddress
      ? `${shippingAddress.fullName}<br/>${shippingAddress.addressLine1}${shippingAddress.addressLine2 ? `, ${shippingAddress.addressLine2}` : ""}<br/>${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}<br/>Phone: ${shippingAddress.phone}`
      : "Standard Customer Shipping Address";

    htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #F7F3EE; padding: 24px; color: #1A1A1A;">
        
        <div style="background-color: #ffffff; padding: 28px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border-bottom: 2px solid #1F2A44; padding-bottom: 16px;">
            <tr>
              <td style="vertical-align: top;">
                <h1 style="font-family: Georgia, serif; color: #1F2A44; margin: 0; font-size: 26px;">YUMI DXB <span style="font-style: italic; color: #C97B7B;">Fashion</span></h1>
                <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #C97B7B; margin-top: 4px; font-weight: bold;">Where Comfort Meets Elegance</p>
                <p style="font-size: 11px; color: #666666; margin-top: 4px; line-height: 1.4;">
                  Atelier Mangaluru, Karnataka, India<br/>Support: support@yumidxb.com
                </p>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <h2 style="font-size: 20px; font-weight: bold; color: #1F2A44; margin: 0; text-transform: uppercase; letter-spacing: 1px;">TAX INVOICE</h2>
                <p style="font-size: 12px; color: #555555; margin-top: 6px; line-height: 1.5;">
                  <strong>Invoice #:</strong> INV-${(orderNumber || "").replace(/[^0-9]/g, "")}<br/>
                  <strong>Order #:</strong> ${orderNumber}<br/>
                  <strong>Date:</strong> ${formattedDate}
                </p>
              </td>
            </tr>
          </table>

          <h3 style="font-family: Georgia, serif; color: #1F2A44; margin-top: 0;">Thank you for your order, ${recipientName || "Valued Customer"}!</h3>
          <p style="font-size: 13px; color: #444444; line-height: 1.6;">
            Your order <strong>#${orderNumber}</strong> has been confirmed! Below is your official tax invoice and order summary.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
            <tr>
              <td style="width: 48%; vertical-align: top; background: #F9FAFB; padding: 14px; border-radius: 8px; border: 1px solid #E5E7EB;">
                <strong style="color: #1F2A44; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Billed &amp; Shipped To:</strong>
                <div style="color: #444444; line-height: 1.5;">${addressText}</div>
              </td>
              <td style="width: 4%;"></td>
              <td style="width: 48%; vertical-align: top; background: #F9FAFB; padding: 14px; border-radius: 8px; border: 1px solid #E5E7EB;">
                <strong style="color: #1F2A44; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Payment Summary:</strong>
                <div style="color: #444444; line-height: 1.5;">
                  <strong>Method:</strong> ${paymentMethod === "online" ? "Online Payment (Razorpay)" : "Cash on Delivery (COD)"}<br/>
                  <strong>Payment Status:</strong> <span style="background: #DEF7EC; color: #03543F; font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: bold;">${(paymentStatus || "confirmed").toUpperCase()}</span><br/>
                  ${paymentReference ? `<strong>Reference ID:</strong> ${paymentReference}<br/>` : ""}
                  <strong>Delivery:</strong> 5-7 Business Days
                </div>
              </td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px;">
            <thead>
              <tr style="background-color: #1F2A44; color: #ffffff; text-align: left;">
                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; text-align: center;">#</th>
                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase;">Item Description</th>
                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; text-align: center;">Qty</th>
                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; text-align: right;">Unit Price</th>
                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
          </table>

          <table style="width: 260px; margin-left: auto; border-collapse: collapse; margin-top: 16px; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #666666;">Subtotal:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #111111;">₹${Number(subtotal || total || 0).toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666666;">Shipping Fee:</td>
              <td style="padding: 6px 0; text-align: right; color: #111111;">${shippingFee === 0 ? "FREE" : `₹${Number(shippingFee || 0).toLocaleString("en-IN")}`}</td>
            </tr>
            <tr style="border-top: 2px solid #1F2A44; font-size: 16px; font-weight: bold;">
              <td style="padding: 10px 0; color: #1F2A44;">Grand Total:</td>
              <td style="padding: 10px 0; text-align: right; color: #1F2A44;">₹${Number(total || 0).toLocaleString("en-IN")}</td>
            </tr>
          </table>

          <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #EEEEEE; text-align: center; font-size: 12px; color: #777777;">
            <p>You can also log into your <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://yumi-dxb-fashion-ten.vercel.app"}/account" style="color: #C97B7B; font-weight: bold; text-decoration: underline;">Customer Account</a> anytime to view live delivery tracking or print PDF invoices.</p>
          </div>
        </div>

        <div style="text-align: center; padding-top: 20px; font-size: 11px; color: #888888;">
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

  // Send Mail (or log simulation if pass is not configured)
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

  return { success: true, message: "Email sent" };
}
