/**
 * Order Confirmation Email Template
 */

import { OrderEmailData } from '../../services/emailNotificationService';

export function renderOrderConfirmationEmail(data: OrderEmailData): string {
  const itemsHTML = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">₹${item.unitPrice}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">₹${item.totalPrice}</td>
      </tr>
    `
    )
    .join('');

  const paymentStatusBadge =
    data.paymentStatus === 'PAID'
      ? '<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">PAID</span>'
      : data.paymentStatus === 'PARTIALLY_PAID'
      ? '<span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">PARTIALLY PAID</span>'
      : '<span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">UNPAID</span>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #3730a3; color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Order Confirmation</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Order #${data.orderNumber}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px 20px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Dear ${data.contactName},</p>

              <p style="margin: 0 0 20px 0; font-size: 16px;">Thank you for your order! We've received your order and it's being processed.</p>

              <!-- Order Details Box -->
              <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-left: 4px solid #3730a3; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #3730a3;">Order Details</h3>
                <p style="margin: 5px 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
                <p style="margin: 5px 0;"><strong>Order Date:</strong> ${data.orderDate}</p>
                <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${paymentStatusBadge}</p>
                <p style="margin: 5px 0;"><strong>Delivery Address:</strong><br>${data.deliveryAddress}</p>
              </div>

              <!-- Order Items Table -->
              <h3 style="margin: 30px 0 15px 0; font-size: 18px;">Order Items</h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Product</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Quantity</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Price</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
                <tfoot>
                  <tr style="background-color: #f9fafb;">
                    <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600;">Total Amount:</td>
                    <td style="padding: 12px; font-size: 20px; font-weight: bold; color: #3730a3;">₹${data.totalAmount}</td>
                  </tr>
                </tfoot>
              </table>

              ${data.notes ? `<p style="margin: 20px 0; font-size: 14px;"><strong>Notes:</strong> ${data.notes}</p>` : ''}

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.orderUrl}" style="display: inline-block; background-color: #3730a3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Order Details</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">This is an automated message from ${data.companyName}</p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">For queries, contact your field representative: ${data.repName} - ${data.repPhone}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
