import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";

export const generateInvoiceHTML = (order: Order): string => {
  const formattedDate = order.createdAt?.seconds
    ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-IN");

  const itemsHtml = (order.items || [])
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 12px 16px; text-align: center; color: #4B5563; font-size: 13px;">${idx + 1}</td>
        <td style="padding: 12px 16px; color: #111827; font-size: 13px; font-weight: 600;">
          ${item.productName}
          <div style="font-size: 11px; color: #6B7280; font-weight: normal; margin-top: 2px;">
            Size: ${item.size} | Color: ${item.color}
          </div>
        </td>
        <td style="padding: 12px 16px; text-align: center; color: #111827; font-size: 13px;">${item.quantity}</td>
        <td style="padding: 12px 16px; text-align: right; color: #111827; font-size: 13px;">₹${(item.discountPrice ?? item.price).toLocaleString("en-IN")}</td>
        <td style="padding: 12px 16px; text-align: right; color: #111827; font-size: 13px; font-weight: 600;">₹${((item.discountPrice ?? item.price) * item.quantity).toLocaleString("en-IN")}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice - ${order.orderNumber}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1A1A1A; margin: 0; padding: 40px; background: #ffffff; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #E5E7EB; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .brand-title { font-family: Georgia, serif; font-size: 28px; font-weight: bold; color: #1F2A44; margin: 0; }
          .brand-tagline { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #C97B7B; margin-top: 4px; }
          .invoice-title { font-size: 24px; font-weight: bold; color: #1F2A44; text-align: right; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
          .invoice-meta { font-size: 12px; color: #4B5563; text-align: right; margin-top: 6px; }
          .details-grid { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .details-box { width: 48%; vertical-align: top; background: #F9FAFB; padding: 16px; border-radius: 8px; border: 1px solid #F3F4F6; }
          .details-heading { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1F2A44; margin-bottom: 8px; }
          .details-text { font-size: 13px; color: #374151; line-height: 1.6; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th { background: #1F2A44; color: #ffffff; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 12px 16px; text-align: left; }
          .summary-table { width: 300px; margin-left: auto; border-collapse: collapse; }
          .summary-table td { padding: 8px 12px; font-size: 13px; color: #4B5563; }
          .summary-table .total-row td { border-top: 2px solid #1F2A44; font-size: 16px; font-weight: bold; color: #1F2A44; padding-top: 12px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
          .badge-paid { background: #DEF7EC; color: #03543F; }
          .badge-cod { background: #FEF08A; color: #854D0E; }
          .footer-note { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; font-size: 12px; color: #9CA3AF; }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; box-shadow: none; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="max-width: 800px; margin: 0 auto 20px auto; text-align: right;">
          <button onclick="window.print()" style="background: #1F2A44; color: #ffffff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div class="invoice-box">
          <table class="header-table">
            <tr>
              <td>
                <div class="brand-title">YUMI DXB <span style="font-style: italic; color: #C97B7B;">Fashion</span></div>
                <div class="brand-tagline">Where Comfort Meets Elegance</div>
                <div style="font-size: 12px; color: #6B7280; margin-top: 6px;">
                  Mangaluru, Karnataka, India | Contact: support@yumidxb.com
                </div>
              </td>
              <td>
                <div class="invoice-title">TAX INVOICE</div>
                <div class="invoice-meta">
                  <strong>Invoice #:</strong> INV-${order.orderNumber.replace(/[^0-9]/g, "")}<br/>
                  <strong>Order #:</strong> ${order.orderNumber}<br/>
                  <strong>Date:</strong> ${formattedDate}
                </div>
              </td>
            </tr>
          </table>

          <table class="details-grid">
            <tr>
              <td class="details-box">
                <div class="details-heading">Billed &amp; Shipped To</div>
                <div class="details-text">
                  <strong>${order.shippingAddress?.fullName || order.userName}</strong><br/>
                  ${order.shippingAddress?.addressLine1 || ""}<br/>
                  ${order.shippingAddress?.addressLine2 ? order.shippingAddress.addressLine2 + "<br/>" : ""}
                  ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.pincode || ""}<br/>
                  Phone: ${order.userPhone || order.shippingAddress?.phone || "N/A"}<br/>
                  Email: ${order.userEmail}
                </div>
              </td>
              <td style="width: 4%;"></td>
              <td class="details-box">
                <div class="details-heading">Payment Information</div>
                <div class="details-text">
                  <strong>Payment Method:</strong> ${order.paymentMethod === "online" ? "Online Payment (Razorpay)" : "Cash on Delivery (COD)"}<br/>
                  <strong>Payment Status:</strong> 
                  <span class="badge ${order.paymentStatus === "paid" ? "badge-paid" : "badge-cod"}">
                    ${(order.paymentStatus || "pending").toUpperCase()}
                  </span><br/>
                  ${order.paymentReference ? `<strong>Payment Reference:</strong> ${order.paymentReference}<br/>` : ""}
                  <strong>Order Status:</strong> ${(order.status || "confirmed").toUpperCase()}
                </div>
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th>Item Description</th>
                <th style="width: 60px; text-align: center;">Qty</th>
                <th style="width: 100px; text-align: right;">Unit Price</th>
                <th style="width: 100px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right; font-weight: 600;">₹${order.subtotal.toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td>Shipping Fee</td>
              <td style="text-align: right;">${order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee.toLocaleString("en-IN")}`}</td>
            </tr>
            ${order.discount > 0 ? `
              <tr>
                <td>Discount</td>
                <td style="text-align: right; color: #DC2626;">-₹${order.discount.toLocaleString("en-IN")}</td>
              </tr>
            ` : ""}
            <tr class="total-row">
              <td>Grand Total</td>
              <td style="text-align: right;">₹${order.total.toLocaleString("en-IN")}</td>
            </tr>
          </table>

          <div class="footer-note">
            <p>Thank you for choosing YUMI DXB Fashion. All items are hand-selected with care.</p>
            <p style="font-size: 11px; margin-top: 4px;">For returns or inquiries, visit support@yumidxb.com or track your order in your customer account.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const downloadInvoicePDF = (order: Order) => {
  const htmlContent = generateInvoiceHTML(order);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  }
};
