/**
 * Payment Overdue Reminder Email Template
 */

import { PaymentReminderData } from '../../services/emailNotificationService';

export function renderPaymentReminderEmail(data: PaymentReminderData): string {
  const urgencyClass = data.urgencyLevel === 'urgent' ? 'urgent' : 'reminder';
  const backgroundColor = data.urgencyLevel === 'urgent' ? '#fee2e2' : '#fef3c7';
  const borderColor = data.urgencyLevel === 'urgent' ? '#ef4444' : '#f59e0b';
  const headerColor = data.urgencyLevel === 'urgent' ? '#dc2626' : '#f59e0b';

  const urgencyMessage =
    data.urgencyLevel === 'urgent'
      ? '<p style="margin: 0 0 20px 0; font-size: 16px; color: #dc2626; font-weight: 600;">⚠️ This is an urgent reminder. Immediate payment is required to avoid service disruption.</p>'
      : data.urgencyLevel === 'followup'
      ? '<p style="margin: 0 0 20px 0; font-size: 16px;">This is a follow-up reminder regarding your pending payment.</p>'
      : '<p style="margin: 0 0 20px 0; font-size: 16px;">This is a friendly reminder regarding your pending payment.</p>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${headerColor}; color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Payment Reminder</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Order #${data.orderNumber}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px 20px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Dear ${data.contactName},</p>

              ${urgencyMessage}

              <!-- Payment Due Box -->
              <div style="background-color: ${backgroundColor}; padding: 20px; margin: 20px 0; border-left: 4px solid ${borderColor}; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${borderColor};">Payment Due</h3>
                <p style="margin: 5px 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
                <p style="margin: 5px 0;"><strong>Order Date:</strong> ${data.orderDate}</p>
                <p style="margin: 5px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>
                <p style="margin: 5px 0;"><strong>Days Overdue:</strong> <span style="color: ${borderColor}; font-weight: 600;">${data.daysOverdue} days</span></p>
                <div style="margin-top: 15px; text-align: center;">
                  <p style="font-size: 28px; color: #dc2626; font-weight: bold; margin: 0;">Amount Due: ₹${data.overdueAmount}</p>
                </div>
              </div>

              <p style="margin: 20px 0; font-size: 16px;">We kindly request you to arrange the payment at your earliest convenience. If you have already made the payment, please disregard this reminder.</p>

              <!-- Payment Options -->
              <h3 style="margin: 30px 0 15px 0; font-size: 18px;">Payment Options:</h3>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <ul style="margin: 0; padding-left: 20px;">
                  <li style="margin: 8px 0;"><strong>Bank Transfer:</strong> ${data.bankDetails}</li>
                  <li style="margin: 8px 0;"><strong>UPI:</strong> ${data.upiId}</li>
                  <li style="margin: 8px 0;"><strong>Cash:</strong> Contact ${data.repName}</li>
                  <li style="margin: 8px 0;"><strong>Cheque:</strong> Payable to ${data.companyName}</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.paymentUrl}" style="display: inline-block; background-color: #3730a3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Make Payment</a>
              </div>

              <!-- Contact Info -->
              <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px;">If you have any questions or need assistance, please contact your representative:</p>
                <p style="margin: 0; font-size: 14px;">
                  <strong>${data.repName}</strong><br>
                  Phone: ${data.repPhone}<br>
                  Email: ${data.repEmail}
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">This is an automated reminder from ${data.companyName}</p>
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
