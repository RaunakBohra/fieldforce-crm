# Email/SMS Notification Templates

**Version:** 1.0
**Date:** 2025-10-07
**MSG91 Integration:** Ready
**Status:** Template Design Phase

---

## 📋 Notification Strategy

### Notification Priorities

**Critical (Must Send):**
1. Order confirmations
2. Payment received confirmations
3. Payment overdue reminders
4. Visit reminders (day before)

**Important (Should Send):**
5. Visit completion summary
6. Order status updates
7. Weekly activity summary (to field reps)
8. Monthly performance reports (to managers)

**Nice-to-Have:**
9. Product launch announcements
10. Territory assignment notifications
11. Daily visit schedule

---

## 1. Order Confirmation (SMS + Email)

### SMS Template (160 chars max)
```
Hi {contact_name},
Your order #{order_number} for ₹{total_amount} has been placed successfully.
Payment: {payment_status}
Thank you!
- {company_name}
```

**Variables:**
- `{contact_name}` - Contact's name (Dr. Sharma)
- `{order_number}` - Order number (ORD-20251007-001)
- `{total_amount}` - Total amount (25,000)
- `{payment_status}` - PAID / PARTIALLY_PAID / UNPAID
- `{company_name}` - Your company name

**Example:**
```
Hi Dr. Sharma,
Your order #ORD-20251007-001 for ₹25,000 has been placed successfully.
Payment: UNPAID
Thank you!
- MedPharm Ltd
```

### Email Template (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3730a3; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
    .order-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3730a3; }
    .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .items-table th { background: #f3f4f6; padding: 10px; text-align: left; }
    .items-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .total { font-size: 18px; font-weight: bold; color: #3730a3; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    .button { background: #3730a3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmation</h1>
      <p>Order #{order_number}</p>
    </div>

    <div class="content">
      <p>Dear {contact_name},</p>

      <p>Thank you for your order! We've received your order and it's being processed.</p>

      <div class="order-details">
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> #{order_number}</p>
        <p><strong>Order Date:</strong> {order_date}</p>
        <p><strong>Payment Status:</strong> {payment_status}</p>
        <p><strong>Delivery Address:</strong><br>{delivery_address}</p>
      </div>

      <h3>Order Items</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {order_items}
          <!-- Example row:
          <tr>
            <td>Paracetamol 500mg</td>
            <td>100 units</td>
            <td>₹50.00</td>
            <td>₹5,000.00</td>
          </tr>
          -->
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right;"><strong>Total Amount:</strong></td>
            <td class="total">₹{total_amount}</td>
          </tr>
        </tfoot>
      </table>

      <p><strong>Notes:</strong> {notes}</p>

      <a href="{order_url}" class="button">View Order Details</a>
    </div>

    <div class="footer">
      <p>This is an automated message from {company_name}</p>
      <p>For queries, contact your field representative: {rep_name} - {rep_phone}</p>
    </div>
  </div>
</body>
</html>
```

---

## 2. Payment Received Confirmation (SMS + Email)

### SMS Template
```
Hi {contact_name},
Payment of ₹{amount} received successfully.
Payment ID: {payment_number}
Mode: {payment_mode}
Balance: ₹{balance}
Thank you!
- {company_name}
```

**Example:**
```
Hi Dr. Sharma,
Payment of ₹15,000 received successfully.
Payment ID: PAY-20251007-001
Mode: BANK_TRANSFER
Balance: ₹10,000
Thank you!
- MedPharm Ltd
```

### Email Template (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
    .payment-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #10b981; }
    .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Payment Received</h1>
      <p>Payment ID: {payment_number}</p>
    </div>

    <div class="content">
      <p>Dear {contact_name},</p>

      <p>We have successfully received your payment. Thank you!</p>

      <div class="amount">₹{amount}</div>

      <div class="payment-box">
        <h3>Payment Details</h3>
        <p><strong>Payment ID:</strong> {payment_number}</p>
        <p><strong>Payment Date:</strong> {payment_date}</p>
        <p><strong>Payment Mode:</strong> {payment_mode}</p>
        <p><strong>Transaction Reference:</strong> {transaction_ref}</p>
        {order_link}
        <!-- If linked to order:
        <p><strong>Order Number:</strong> #{order_number}</p>
        -->
      </div>

      <div class="payment-box">
        <h3>Account Summary</h3>
        <p><strong>Total Outstanding:</strong> ₹{total_outstanding}</p>
        <p><strong>Amount Paid:</strong> ₹{amount}</p>
        <p><strong>Remaining Balance:</strong> ₹{remaining_balance}</p>
      </div>

      <p>A receipt has been generated and is available for download.</p>
    </div>

    <div class="footer">
      <p>This is an automated message from {company_name}</p>
      <p>For queries, contact: {rep_name} - {rep_phone}</p>
    </div>
  </div>
</body>
</html>
```

---

## 3. Payment Overdue Reminder (SMS + Email)

### SMS Template - Polite Reminder
```
Dear {contact_name},
Gentle reminder: Payment of ₹{overdue_amount} is overdue by {days_overdue} days.
Order: #{order_number}
Please arrange payment at your earliest convenience.
- {company_name}
```

**Example:**
```
Dear Dr. Sharma,
Gentle reminder: Payment of ₹25,000 is overdue by 7 days.
Order: #ORD-20250930-001
Please arrange payment at your earliest convenience.
- MedPharm Ltd
```

### SMS Template - Urgent Reminder (30+ days)
```
URGENT: Dear {contact_name},
Payment of ₹{overdue_amount} is overdue by {days_overdue} days.
Order: #{order_number}
Immediate payment required. Contact {rep_name}: {rep_phone}
- {company_name}
```

### Email Template (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
    .reminder-box { background: #fef3c7; padding: 20px; margin: 15px 0; border-left: 4px solid #f59e0b; }
    .urgent { background: #fee2e2; border-left: 4px solid #ef4444; }
    .button { background: #3730a3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Reminder</h1>
      <p>Order #{order_number}</p>
    </div>

    <div class="content">
      <p>Dear {contact_name},</p>

      <p>This is a friendly reminder regarding your pending payment.</p>

      <div class="reminder-box {urgency_class}">
        <h3>Payment Due</h3>
        <p><strong>Order Number:</strong> #{order_number}</p>
        <p><strong>Order Date:</strong> {order_date}</p>
        <p><strong>Due Date:</strong> {due_date}</p>
        <p><strong>Days Overdue:</strong> {days_overdue} days</p>
        <p style="font-size: 20px; color: #dc2626; font-weight: bold;">
          Amount Due: ₹{overdue_amount}
        </p>
      </div>

      <p>We kindly request you to arrange the payment at your earliest convenience. If you have already made the payment, please disregard this reminder.</p>

      <h3>Payment Options:</h3>
      <ul>
        <li><strong>Bank Transfer:</strong> {bank_details}</li>
        <li><strong>UPI:</strong> {upi_id}</li>
        <li><strong>Cash:</strong> Contact {rep_name}</li>
        <li><strong>Cheque:</strong> Payable to {company_name}</li>
      </ul>

      <a href="{payment_url}" class="button">Make Payment</a>

      <p>If you have any questions or need assistance, please contact your representative:</p>
      <p><strong>{rep_name}</strong><br>
      Phone: {rep_phone}<br>
      Email: {rep_email}</p>
    </div>

    <div class="footer">
      <p>This is an automated reminder from {company_name}</p>
    </div>
  </div>
</body>
</html>
```

---

## 4. Visit Reminder (SMS) - Day Before

### SMS Template
```
Hi {contact_name},
Reminder: {rep_name} will visit you tomorrow ({visit_date}) at {visit_time}.
Location: {location}
Looking forward to meeting you!
- {company_name}
```

**Example:**
```
Hi Dr. Sharma,
Reminder: Ravi Kumar will visit you tomorrow (08 Oct 2025) at 10:00 AM.
Location: City Hospital, Delhi
Looking forward to meeting you!
- MedPharm Ltd
```

---

## 5. Visit Completion Summary (SMS)

### SMS Template
```
Hi {contact_name},
Thank you for the meeting today! Visit completed at {visit_time}.
{order_summary}
Next visit: {next_visit_date}
- {rep_name}, {company_name}
```

**Example:**
```
Hi Dr. Sharma,
Thank you for the meeting today! Visit completed at 11:30 AM.
Order placed: ₹25,000
Next visit: 15 Oct 2025
- Ravi Kumar, MedPharm Ltd
```

---

## 6. Order Status Update (SMS)

### SMS Template - Dispatched
```
Hi {contact_name},
Good news! Your order #{order_number} has been dispatched.
Expected delivery: {delivery_date}
Track: {tracking_url}
- {company_name}
```

### SMS Template - Delivered
```
Hi {contact_name},
Your order #{order_number} has been delivered successfully.
Please confirm receipt with {rep_name}.
Thank you!
- {company_name}
```

### SMS Template - Cancelled
```
Hi {contact_name},
Order #{order_number} has been cancelled as requested.
Reason: {cancel_reason}
Questions? Call {rep_name}: {rep_phone}
- {company_name}
```

---

## 7. Weekly Activity Summary (Email to Field Reps)

### Email Template (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { background: #3730a3; color: white; padding: 20px; text-align: center; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: white; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-radius: 8px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #3730a3; }
    .stat-label { color: #6b7280; font-size: 14px; }
    .section { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Your Weekly Performance</h1>
      <p>{week_range}</p>
    </div>

    <p>Hi {rep_name},</p>

    <p>Here's your performance summary for the week:</p>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">{visits_count}</div>
        <div class="stat-label">Visits Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{orders_count}</div>
        <div class="stat-label">Orders Placed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">₹{sales_amount}</div>
        <div class="stat-label">Total Sales</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">₹{payments_collected}</div>
        <div class="stat-label">Payments Collected</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{contacts_added}</div>
        <div class="stat-label">New Contacts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{avg_visit_duration}</div>
        <div class="stat-label">Avg Visit Duration</div>
      </div>
    </div>

    <div class="section">
      <h3>🎯 This Week's Highlights</h3>
      <ul>
        <li>{highlight_1}</li>
        <li>{highlight_2}</li>
        <li>{highlight_3}</li>
      </ul>
    </div>

    <div class="section">
      <h3>📅 Next Week's Schedule</h3>
      <p><strong>{upcoming_visits_count} visits planned</strong></p>
      <p>{upcoming_visits_summary}</p>
    </div>

    <div class="section">
      <h3>⚠️ Action Required</h3>
      <ul>
        <li><strong>{overdue_payments_count}</strong> overdue payments to collect</li>
        <li><strong>{pending_orders_count}</strong> pending orders to follow up</li>
        <li><strong>{missed_visits_count}</strong> missed visits to reschedule</li>
      </ul>
    </div>

    <p>Keep up the great work! 🚀</p>

    <p>Best regards,<br>{manager_name}<br>{company_name}</p>
  </div>
</body>
</html>
```

---

## 8. Monthly Performance Report (Email to Managers)

### Email Template (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: #1e3a8a; color: white; padding: 30px; text-align: center; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
    .summary-card { background: white; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-radius: 8px; }
    .big-number { font-size: 36px; font-weight: bold; color: #1e3a8a; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th { background: #f3f4f6; padding: 12px; text-align: left; }
    .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .section { margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📈 Monthly Performance Report</h1>
      <p>{month_year}</p>
    </div>

    <p>Dear {manager_name},</p>

    <p>Here's the performance summary for your team:</p>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="big-number">{total_visits}</div>
        <div>Total Visits</div>
      </div>
      <div class="summary-card">
        <div class="big-number">{total_orders}</div>
        <div>Orders Placed</div>
      </div>
      <div class="summary-card">
        <div class="big-number">₹{total_sales}</div>
        <div>Total Sales</div>
      </div>
      <div class="summary-card">
        <div class="big-number">₹{collections}</div>
        <div>Collections</div>
      </div>
    </div>

    <div class="section">
      <h3>🏆 Top Performers</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Field Rep</th>
            <th>Visits</th>
            <th>Orders</th>
            <th>Sales Amount</th>
          </tr>
        </thead>
        <tbody>
          {top_performers_rows}
          <!-- Example:
          <tr>
            <td>1</td>
            <td>Ravi Kumar</td>
            <td>45</td>
            <td>38</td>
            <td>₹5,50,000</td>
          </tr>
          -->
        </tbody>
      </table>
    </div>

    <div class="section">
      <h3>📊 Territory Performance</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Territory</th>
            <th>Field Reps</th>
            <th>Total Visits</th>
            <th>Total Sales</th>
            <th>Growth</th>
          </tr>
        </thead>
        <tbody>
          {territory_performance_rows}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h3>💰 Outstanding Payments</h3>
      <p><strong>Total Outstanding:</strong> ₹{total_outstanding}</p>
      <p><strong>Overdue (>30 days):</strong> ₹{overdue_30_days}</p>
      <p><strong>Collection Rate:</strong> {collection_rate}%</p>
    </div>

    <div class="section">
      <h3>📉 Areas Needing Attention</h3>
      <ul>
        <li>{concern_1}</li>
        <li>{concern_2}</li>
        <li>{concern_3}</li>
      </ul>
    </div>

    <p>Detailed report attached as PDF.</p>

    <p>Best regards,<br>CRM System<br>{company_name}</p>
  </div>
</body>
</html>
```

---

## 9. Product Launch Announcement (SMS + Email)

### SMS Template
```
New Product Alert! 🎉
{product_name} now available.
Price: ₹{price} | {key_feature}
Contact {rep_name}: {rep_phone} to order.
- {company_name}
```

**Example:**
```
New Product Alert! 🎉
Azithromycin 500mg now available.
Price: ₹150/strip | WHO-GMP Certified
Contact Ravi Kumar: 9876543210 to order.
- MedPharm Ltd
```

### Email Template (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .product-image { width: 100%; max-width: 400px; margin: 20px auto; display: block; }
    .feature-box { background: #f0fdf4; padding: 15px; margin: 10px 0; border-left: 4px solid #10b981; }
    .cta-button { background: #3730a3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 New Product Launch</h1>
      <h2>{product_name}</h2>
    </div>

    <img src="{product_image_url}" class="product-image" alt="{product_name}">

    <p>Dear {contact_name},</p>

    <p>We're excited to introduce our latest addition to our product portfolio:</p>

    <h2 style="color: #3730a3;">{product_name}</h2>

    <div class="feature-box">
      <h3>Key Features:</h3>
      <ul>
        <li>{feature_1}</li>
        <li>{feature_2}</li>
        <li>{feature_3}</li>
      </ul>
    </div>

    <div class="feature-box">
      <h3>Pricing & Availability:</h3>
      <p><strong>MRP:</strong> ₹{price}</p>
      <p><strong>Pack Size:</strong> {pack_size}</p>
      <p><strong>Availability:</strong> {availability}</p>
      <p><strong>Special Launch Offer:</strong> {offer_details}</p>
    </div>

    <p><strong>Why Choose This Product?</strong></p>
    <p>{value_proposition}</p>

    <center>
      <a href="{order_url}" class="cta-button">Place Your Order Now</a>
    </center>

    <p>For more information or to place an order, contact:</p>
    <p><strong>{rep_name}</strong><br>
    Phone: {rep_phone}<br>
    Email: {rep_email}</p>

    <p>Best regards,<br>{company_name}</p>
  </div>
</body>
</html>
```

---

## 10. Daily Visit Schedule (SMS to Field Reps)

### SMS Template - Morning
```
Good morning {rep_name}!
Today's visits: {visit_count}
{visit_1_time} - {contact_1_name} ({location_1})
{visit_2_time} - {contact_2_name} ({location_2})
...
Have a productive day! 💼
```

**Example:**
```
Good morning Ravi!
Today's visits: 3
10:00 AM - Dr. Sharma (City Hospital)
02:00 PM - Dr. Patel (Green Clinic)
04:30 PM - Dr. Gupta (Apollo Center)
Have a productive day! 💼
```

---

## 11. Territory Assignment Notification (Email)

### Email Template (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3730a3; color: white; padding: 20px; text-align: center; }
    .territory-box { background: #f9fafb; padding: 20px; margin: 20px 0; border-left: 4px solid #3730a3; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗺️ Territory Assignment</h1>
    </div>

    <p>Dear {rep_name},</p>

    <p>You have been assigned to a new territory:</p>

    <div class="territory-box">
      <h3>{territory_name} ({territory_code})</h3>
      <p><strong>Coverage Area:</strong> {coverage_area}</p>
      <p><strong>Total Contacts:</strong> {contact_count}</p>
      <p><strong>Active Orders:</strong> {order_count}</p>
      <p><strong>Effective Date:</strong> {effective_date}</p>
    </div>

    <h3>Your Territory Includes:</h3>
    <ul>
      <li><strong>Cities:</strong> {cities}</li>
      <li><strong>Hospitals:</strong> {hospital_count}</li>
      <li><strong>Clinics:</strong> {clinic_count}</li>
      <li><strong>Pharmacies:</strong> {pharmacy_count}</li>
    </ul>

    <p>Please log in to the CRM to view your complete contact list and scheduled visits.</p>

    <p>If you have any questions, please contact your manager: {manager_name}</p>

    <p>Best regards,<br>{company_name}</p>
  </div>
</body>
</html>
```

---

## Implementation Priority

### Phase 1 - Critical (Week 1)
1. ✅ Order Confirmation (SMS + Email)
2. ✅ Payment Received (SMS + Email)
3. ✅ Payment Overdue Reminder (SMS + Email)

### Phase 2 - Important (Week 2)
4. ✅ Visit Reminder (SMS)
5. ✅ Visit Completion (SMS)
6. ✅ Order Status Updates (SMS)

### Phase 3 - Nice-to-Have (Week 3)
7. ✅ Weekly Summary (Email to Reps)
8. ✅ Monthly Report (Email to Managers)
9. ✅ Product Launch (SMS + Email)

### Phase 4 - Optional (Week 4)
10. ✅ Daily Schedule (SMS)
11. ✅ Territory Assignment (Email)

---

## Technical Implementation Notes

### MSG91 API Integration
- **SMS API:** `https://control.msg91.com/api/v5/flow/`
- **Email API:** `https://control.msg91.com/api/v5/email/send`
- **Authentication:** Already configured in production

### Template Variables
All templates use `{variable_name}` syntax which should be replaced with actual data before sending.

### Character Limits
- **SMS:** 160 characters (standard), 306 characters (Unicode)
- **Email Subject:** 50-70 characters recommended
- **Email Body:** No strict limit

### Delivery Timing
- **Order Confirmation:** Immediate (within 1 minute)
- **Payment Confirmation:** Immediate
- **Payment Reminders:**
  - Polite: 7 days after due date
  - Follow-up: 15 days after due date
  - Urgent: 30 days after due date
- **Visit Reminders:** 1 day before (9 AM)
- **Daily Schedule:** Every morning at 7 AM
- **Weekly Summary:** Every Monday at 8 AM
- **Monthly Report:** 1st of each month at 9 AM

### Personalization
All templates should:
- Use recipient's name
- Include relevant details
- Have clear call-to-action
- Maintain brand tone (professional, friendly)
- Be mobile-friendly

---

## Testing Checklist

Before production deployment:
- [ ] Test all SMS templates with real phone numbers
- [ ] Test all email templates in multiple email clients (Gmail, Outlook, Apple Mail)
- [ ] Verify all dynamic variables are replaced correctly
- [ ] Check character limits don't get exceeded
- [ ] Test unsubscribe functionality
- [ ] Verify delivery receipts are logged
- [ ] Test failure scenarios (invalid phone/email)
- [ ] Check spam score for emails
- [ ] Verify links work correctly
- [ ] Test with different timezones

---

**Next Step:** Implement notification service and integrate with existing controllers.
