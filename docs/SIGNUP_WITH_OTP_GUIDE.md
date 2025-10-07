# Signup with MSG91 OTP Verification Guide

**Date:** October 7, 2025
**Status:** ✅ Implementation Ready
**Widget Type:** MSG91 OTP Widget (SMS + Email)

---

## 🎯 Recommended Approach

### **Option 1: Verify BEFORE Signup** ✅ (BEST)

**Signup Flow:**
```
1. User fills form (name, email, phone, password)
                ↓
2. Send SMS OTP to phone (MSG91 widget)
                ↓
3. Verify phone OTP
                ↓
4. Send Email OTP (MSG91 widget)
                ↓
5. Verify email OTP
                ↓
6. Create user account in database
                ↓
7. Generate JWT token
                ↓
8. Auto-login user → Dashboard
```

**Benefits:**
- ✅ Only verified users in database
- ✅ No fake/spam accounts
- ✅ Better data quality
- ✅ Prevents account creation abuse
- ✅ User can't access app without verification
- ✅ Clean user table (no unverified rows)

**When to Use:**
- B2B applications (like Field Force CRM)
- High-quality data requirement
- Want to prevent spam signups
- Premium/paid services

---

### **Option 2: Verify AFTER Signup** (Alternative)

**Signup Flow:**
```
1. User fills form
                ↓
2. Create account (status: unverified)
                ↓
3. Auto-login with limited access
                ↓
4. Show OTP verification screen
                ↓
5. Send OTP (phone/email)
                ↓
6. Verify OTP
                ↓
7. Mark account as verified
                ↓
8. Grant full access
```

**Benefits:**
- ✅ Faster initial signup
- ✅ Lower bounce rate
- ✅ Can send reminder emails
- ✅ User can verify later

**Drawbacks:**
- ❌ Unverified accounts in database
- ❌ Need cleanup job for old unverified accounts
- ❌ More complex state management
- ❌ Need to handle partial access states

**When to Use:**
- B2C applications
- Want higher conversion rates
- Email-first verification (can verify later)
- Social/community apps

---

## 📝 Implementation Details (Option 1)

### Step 1: Get MSG91 Widget Credentials

1. **Login to MSG91:** https://control.msg91.com
2. **Navigate to:** OTP → Widgets
3. **Find your widget** (the one that supports SMS + Email)
4. **Copy these values:**
   - **Widget ID** (e.g., `356a6266466b383439343231`)
   - **Widget Token** (e.g., `471688TMGuH2UG268de1f57P1`)

### Step 2: Update SignupWithOTP Component

**File:** `web/src/pages/SignupWithOTP.tsx` (already created)

**Replace placeholders:**
```typescript
// Line 57-58
widgetId: 'YOUR_WIDGET_ID',        // ⚠️ Replace with your actual Widget ID
tokenAuth: 'YOUR_WIDGET_TOKEN',    // ⚠️ Replace with your actual Widget Token
```

### Step 3: Add Route to App.tsx

```typescript
// Add import
const SignupWithOTP = lazy(() => import('./pages/SignupWithOTP').then(m => ({ default: m.SignupWithOTP })));

// Add route (in public routes section)
<Route path="/signup-otp" element={<SignupWithOTP />} />
```

### Step 4: Update Login Page Link

Change signup link to point to new OTP signup:

```typescript
// In Login.tsx
<Link to="/signup-otp">Create account</Link>
```

---

## 🔧 MSG91 Widget Configuration

### Required Settings in Dashboard

1. **Widget Type:** OTP
2. **Channels Enabled:**
   - ☑️ SMS (Primary)
   - ☑️ Email (Secondary)
3. **OTP Settings:**
   - Length: 4 or 6 digits (4 recommended for SMS, 6 for email)
   - Expiry: 5 minutes
   - Resend: 30 seconds cooldown
4. **CAPTCHA:** Enabled (prevents abuse)
5. **Domain Restriction:** Add your domains
   - `localhost:5173` (development)
   - `https://your-production-domain.com`

### Widget Initialization (Frontend)

```typescript
(window as any).initSendOTP({
  widgetId: 'YOUR_WIDGET_ID',
  tokenAuth: 'YOUR_WIDGET_TOKEN',
  exposeMethods: true,           // Expose sendOtp, verifyOtp methods
  success: (data) => {
    // Called after successful OTP verification
    const accessToken = data.message;
    // Verify token server-side
  },
  failure: (error) => {
    // Handle error
    console.error('OTP failed:', error);
  },
});
```

### Widget Methods

**1. Send OTP:**
```javascript
window.sendOtp(
  'identifier',      // Phone (919999999999) or Email (user@example.com)
  successCallback,
  failureCallback
);
```

**2. Verify OTP:**
```javascript
window.verifyOtp(
  'otp',            // 4 or 6 digit OTP
  successCallback,
  failureCallback
);
```

**3. Resend OTP:**
```javascript
window.retryOtp(
  'channel',        // 'voice', 'text', or null for default
  successCallback,
  failureCallback
);
```

---

## 🔐 Backend Token Verification

### Why Verify Token Server-Side?

**Security Reasons:**
1. Client can manipulate frontend JavaScript
2. Need to ensure OTP was actually verified by MSG91
3. Prevents fake verification attempts
4. Creates audit trail

### Token Verification Flow

```typescript
// Frontend sends access token to backend
const response = await fetch('/api/otp/verify-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ accessToken: token }),
});

// Backend verifies with MSG91
// POST https://control.msg91.com/api/v5/widget/verifyAccessToken
// {
//   "authkey": "YOUR_AUTH_KEY",
//   "access-token": "JWT_TOKEN_FROM_WIDGET"
// }

// MSG91 Response:
// {
//   "type": "success",
//   "data": {
//     "mobile": "919999999999",
//     "verified": true
//   }
// }
```

**Already Implemented:**
- ✅ Route: `POST /api/otp/verify-token`
- ✅ Service: `MSG91OTPService.verifyAccessToken()`
- ✅ Validation: Returns mobile/email + verification status

---

## 📱 User Experience Flow

### Screen 1: Signup Form
```
┌─────────────────────────────────┐
│  Create Account                 │
├─────────────────────────────────┤
│  Full Name:  [____________]     │
│  Email:      [____________]     │
│  Phone:      [____________]     │
│  Password:   [____________]     │
│  Role:       [Field Rep ▼]     │
│                                 │
│  [Continue to Verification]     │
│                                 │
│  Already have account? Log in   │
└─────────────────────────────────┘
```

### Screen 2: Phone OTP
```
┌─────────────────────────────────┐
│  Verify Phone Number            │
├─────────────────────────────────┤
│  📱 OTP sent to +919999999999   │
│     Please check your SMS       │
│                                 │
│  Enter 4-digit OTP:             │
│         [  1  2  3  4  ]        │
│                                 │
│  [Verify Phone]                 │
│  [Resend OTP]                   │
└─────────────────────────────────┘
```

### Screen 3: Email OTP
```
┌─────────────────────────────────┐
│  Verify Email Address           │
├─────────────────────────────────┤
│  ✅ Phone verified successfully │
│                                 │
│  📧 OTP sent to user@email.com  │
│     Check inbox (and spam)      │
│                                 │
│  Enter 4-digit OTP:             │
│         [  1  2  3  4  ]        │
│                                 │
│  [Verify Email & Create]        │
│  [Resend OTP]                   │
└─────────────────────────────────┘
```

### Screen 4: Success
```
┌─────────────────────────────────┐
│                                 │
│           ✓                     │
│     Account Created!            │
│                                 │
│   Redirecting to dashboard...   │
│                                 │
└─────────────────────────────────┘
```

---

## 🎨 UI/UX Best Practices

### 1. Auto-send OTP
Don't make user click "Send OTP" button - auto-send when they land on OTP screen.

```typescript
useEffect(() => {
  if (step === 'otp-phone') {
    handleSendPhoneOTP();
  }
}, [step]);
```

### 2. Auto-focus OTP Input
Focus OTP input field automatically for better UX.

```tsx
<input autoFocus />
```

### 3. Show Verified Status
Display checkmark when phone is verified before moving to email OTP.

```tsx
<div className="bg-success-50 border border-success-200 ...">
  ✅ Phone verified successfully
</div>
```

### 4. Clear Error Messages
Show specific errors (not just "Failed"):
- "Invalid OTP. Please try again."
- "OTP expired. Request a new one."
- "Too many attempts. Try again in 5 minutes."

### 5. Resend Cooldown
Show countdown timer for resend button:
```tsx
{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
```

### 6. Show Phone/Email Clearly
Display the number/email where OTP was sent (partially masked for security).

```tsx
OTP sent to +91****99999
OTP sent to u***@example.com
```

---

## 🧪 Testing Guide

### Local Testing

1. **Start backend:**
   ```bash
   cd /Users/raunakbohra/Desktop/medical-CRM
   npm run dev
   ```

2. **Start frontend:**
   ```bash
   cd web
   npm run dev
   ```

3. **Navigate to:**
   ```
   http://localhost:5173/signup-otp
   ```

4. **Test flow:**
   - Fill signup form
   - Enter your real phone number
   - Check SMS for OTP
   - Enter OTP
   - Check email for OTP
   - Enter email OTP
   - Verify account creation
   - Check auto-login to dashboard

### Production Testing

1. **Deploy with widget credentials:**
   - Update Widget ID and Token in component
   - Ensure domain is whitelisted in MSG91

2. **Test from different devices:**
   - Mobile (iOS/Android)
   - Desktop browsers
   - Different networks

3. **Monitor MSG91 Dashboard:**
   - Check delivery reports
   - Verify OTP success rate
   - Monitor credits usage

---

## 💰 Cost Estimation

### MSG91 OTP Pricing

**Per Signup (Phone + Email OTP):**
- SMS OTP: ₹0.20
- Email OTP: Free (or ₹0.10 if over free tier)
- **Total per signup:** ~₹0.20 to ₹0.30

**Monthly Cost (Example):**
- 1000 signups/month = ₹200-300
- 5000 signups/month = ₹1000-1500

**Compare to:**
- AWS SNS SMS: $0.02/SMS = ₹1.60 per OTP
- Twilio SMS: $0.0075/SMS = ₹0.60 per OTP

**MSG91 is cheapest for India! 🎉**

---

## 🔒 Security Considerations

### 1. Rate Limiting
Implement rate limiting on OTP endpoints to prevent abuse.

**Already implemented:**
- 100 requests/min per IP (via rateLimiter middleware)

**Additional recommendations:**
- Max 3 OTP attempts per phone/email per hour
- Lockout after 5 failed verification attempts

### 2. Phone/Email Validation
Validate format before sending OTP.

```typescript
// Phone validation
const phoneRegex = /^[1-9]\d{9,14}$/;
if (!phoneRegex.test(phone)) {
  return error('Invalid phone number');
}

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return error('Invalid email address');
}
```

### 3. Token Expiry
MSG91 access tokens expire after verification. Don't store them permanently.

### 4. CAPTCHA
MSG91 widget has built-in CAPTCHA. Ensure it's enabled in dashboard.

### 5. Domain Restriction
Add domain whitelist in MSG91 dashboard to prevent unauthorized usage.

---

## 🐛 Troubleshooting

### Issue: OTP Widget Not Loading

**Solutions:**
1. Check browser console for script errors
2. Verify Widget ID and Token are correct
3. Check domain is whitelisted in MSG91
4. Clear browser cache
5. Try incognito mode

### Issue: OTP Not Received

**Solutions:**
1. Check MSG91 account has credits
2. Verify phone number format (with country code)
3. Check MSG91 dashboard logs
4. Ensure not in DND hours (9 PM - 9 AM India)
5. Try resend with voice option

### Issue: OTP Verification Fails

**Solutions:**
1. Check OTP hasn't expired (default: 5 minutes)
2. Ensure OTP length matches (4 or 6 digits)
3. Use latest OTP (previous ones invalidated)
4. Check backend logs for token verification errors

### Issue: Token Verification Fails

**Solutions:**
1. Verify `MSG91_AUTH_KEY` is set correctly
2. Check backend /api/otp/verify-token endpoint
3. Ensure access token is passed correctly
4. Check MSG91 API status

---

## 📊 Monitoring & Analytics

### Metrics to Track

1. **Signup Funnel:**
   - Form filled: 100%
   - Phone OTP sent: 95%
   - Phone verified: 85%
   - Email OTP sent: 85%
   - Email verified: 75%
   - Account created: 75%

2. **OTP Performance:**
   - Average OTP delivery time
   - OTP verification success rate
   - Resend OTP rate
   - Failed verification rate

3. **Costs:**
   - SMS OTP count
   - Email OTP count
   - Total monthly spend
   - Cost per acquired user

### MSG91 Dashboard

**Reports Available:**
- SMS delivery reports
- Email delivery reports
- OTP success/failure rates
- Geographic distribution
- Hour-by-hour usage

**Access:** https://control.msg91.com → Reports

---

## ✅ Checklist

### Pre-Deployment
- [ ] Widget ID and Token configured
- [ ] Domain whitelisted in MSG91
- [ ] MSG91 account has credits
- [ ] Backend API endpoints tested
- [ ] Frontend component tested locally
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Success messages configured

### Post-Deployment
- [ ] Test signup flow end-to-end
- [ ] Verify OTP delivery (SMS + Email)
- [ ] Check database for user records
- [ ] Monitor MSG91 dashboard
- [ ] Set up alerts for failures
- [ ] Track conversion rates
- [ ] Gather user feedback

---

## 🚀 Next Steps

### Immediate
1. Get Widget ID and Token from MSG91 dashboard
2. Update SignupWithOTP.tsx with credentials
3. Add route to App.tsx
4. Test locally with your phone/email
5. Deploy to staging

### Future Enhancements
- [ ] Add WhatsApp OTP option
- [ ] Add Voice OTP for accessibility
- [ ] Implement "Skip for now" option (Option 2 flow)
- [ ] Add social login (Google, Facebook)
- [ ] Save OTP preferences (SMS vs Email)
- [ ] Add biometric verification (mobile apps)

---

## 📚 Related Documentation

- [MSG91 Integration Guide](./MSG91_INTEGRATION.md)
- [MSG91 OTP API Docs](https://docs.msg91.com/otp/sendotp)
- [Kabir Mandir OTP Implementation](../../kabir-mandir/MSG91_OTP_INTEGRATION_GUIDE.md)
- [Authentication Documentation](../02-guidelines/DEVELOPMENT_GUIDELINES.md#authentication)

---

**Document Version:** 1.0.0
**Last Updated:** October 7, 2025
**Author:** Field Force CRM Development Team
**Status:** ✅ Implementation Ready
