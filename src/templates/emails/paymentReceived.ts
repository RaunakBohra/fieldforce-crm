/**
 * Payment Received Email Template
 */

import { PaymentEmailData } from '../../services/emailNotificationService';

export function renderPaymentReceivedEmail(data: PaymentEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #10b981; color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">✓ Payment Received</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Payment ID: ${data.paymentNumber}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px 20px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Dear ${data.contactName},</p>

              <p style="margin: 0 0 20px 0; font-size: 16px;">We have successfully received your payment. Thank you!</p>

              <!-- Amount Display -->
              <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 48px; font-weight: bold; color: #10b981;">₹${data.amount}</div>
              </div>

              <!-- Payment Details Box -->
              <div style="background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981; border: 1px solid #e5e7eb; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #10b981;">Payment Details</h3>
                <p style="margin: 5px 0;"><strong>Payment ID:</strong> ${data.paymentNumber}</p>
                <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${data.paymentDate}</p>
                <p style="margin: 5px 0;"><strong>Payment Mode:</strong> ${data.paymentMode}</p>
                ${data.transactionRef ? `<p style="margin: 5px 0;"><strong>Transaction Reference:</strong> ${data.transactionRef}</p>` : ''}
                ${data.orderNumber ? `<p style="margin: 5px 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>` : ''}
              </div>

              <!-- Account Summary Box -->
              <div style="background-color: #f0fdf4; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #10b981;">Account Summary</h3>
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Total Outstanding:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">₹${data.totalOutstanding}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Amount Paid:</strong></td>
                    <td style="padding: 5px 0; text-align: right; color: #10b981; font-weight: 600;">- ₹${data.amount}</td>
                  </tr>
                  <tr style="border-top: 2px solid #d1fae5;">
                    <td style="padding: 10px 0; font-size: 18px;"><strong>Remaining Balance:</strong></td>
                    <td style="padding: 10px 0; text-align: right; font-size: 18px; font-weight: bold; color: #10b981;">₹${data.remainingBalance}</td>
                  </tr>
                </table>
              </div>

              <p style="margin: 20px 0; font-size: 14px; color: #6b7280;">A receipt has been generated and is available for download in your account.</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">This is an automated message from ${data.companyName}</p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">For queries, contact: ${data.repName} - ${data.repPhone}</p>
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
