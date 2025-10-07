/**
 * Weekly Performance Summary Email Template
 */

import { WeeklySummaryData } from '../../services/emailNotificationService';

export function renderWeeklySummaryEmail(data: WeeklySummaryData): string {
  const highlightsHTML = data.highlights
    .map((highlight) => `<li style="margin: 8px 0;">${highlight}</li>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Performance Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #3730a3; color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px;">📊 Your Weekly Performance</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">${data.weekRange}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px 20px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Hi ${data.repName},</p>

              <p style="margin: 0 0 30px 0; font-size: 16px;">Here's your performance summary for the week:</p>

              <!-- Stats Grid -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="width: 33.33%; padding: 15px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <div style="font-size: 36px; font-weight: bold; color: #3730a3; margin-bottom: 5px;">${data.visitsCount}</div>
                    <div style="color: #6b7280; font-size: 14px;">Visits Completed</div>
                  </td>
                  <td style="width: 10px;"></td>
                  <td style="width: 33.33%; padding: 15px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <div style="font-size: 36px; font-weight: bold; color: #3730a3; margin-bottom: 5px;">${data.ordersCount}</div>
                    <div style="color: #6b7280; font-size: 14px;">Orders Placed</div>
                  </td>
                  <td style="width: 10px;"></td>
                  <td style="width: 33.33%; padding: 15px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <div style="font-size: 36px; font-weight: bold; color: #3730a3; margin-bottom: 5px;">₹${data.salesAmount}</div>
                    <div style="color: #6b7280; font-size: 14px;">Total Sales</div>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="width: 33.33%; padding: 15px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <div style="font-size: 36px; font-weight: bold; color: #3730a3; margin-bottom: 5px;">₹${data.paymentsCollected}</div>
                    <div style="color: #6b7280; font-size: 14px;">Payments Collected</div>
                  </td>
                  <td style="width: 10px;"></td>
                  <td style="width: 33.33%; padding: 15px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <div style="font-size: 36px; font-weight: bold; color: #3730a3; margin-bottom: 5px;">${data.contactsAdded}</div>
                    <div style="color: #6b7280; font-size: 14px;">New Contacts</div>
                  </td>
                  <td style="width: 10px;"></td>
                  <td style="width: 33.33%; padding: 15px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <div style="font-size: 36px; font-weight: bold; color: #3730a3; margin-bottom: 5px;">${data.avgVisitDuration}</div>
                    <div style="color: #6b7280; font-size: 14px;">Avg Visit Duration</div>
                  </td>
                </tr>
              </table>

              <!-- Highlights Section -->
              <div style="background-color: #f0fdf4; padding: 20px; margin: 30px 0; border-left: 4px solid #10b981; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #10b981;">🎯 This Week's Highlights</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  ${highlightsHTML}
                </ul>
              </div>

              <!-- Next Week Section -->
              <div style="background-color: #eff6ff; padding: 20px; margin: 30px 0; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #3b82f6;">📅 Next Week's Schedule</h3>
                <p style="margin: 0 0 10px 0;"><strong>${data.upcomingVisitsCount} visits planned</strong></p>
                <p style="margin: 0; color: #6b7280;">${data.upcomingVisitsSummary}</p>
              </div>

              <!-- Action Required Section -->
              <div style="background-color: #fef3c7; padding: 20px; margin: 30px 0; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #f59e0b;">⚠️ Action Required</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li style="margin: 8px 0;"><strong>${data.overduePaymentsCount}</strong> overdue payments to collect</li>
                  <li style="margin: 8px 0;"><strong>${data.pendingOrdersCount}</strong> pending orders to follow up</li>
                  <li style="margin: 8px 0;"><strong>${data.missedVisitsCount}</strong> missed visits to reschedule</li>
                </ul>
              </div>

              <p style="margin: 30px 0 0 0; font-size: 16px;">Keep up the great work! 🚀</p>

              <p style="margin: 20px 0 0 0; font-size: 14px;">
                Best regards,<br>
                ${data.managerName}<br>
                ${data.companyName}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">This is an automated weekly summary from ${data.companyName}</p>
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
