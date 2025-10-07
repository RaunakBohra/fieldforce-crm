/**
 * Fully Automated MSG91 OTP Signup Test
 * This will programmatically fill the form and trigger OTP
 */

import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Starting Automated MSG91 OTP Signup Test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000, // Slow down to see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  // Log console messages
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('MSG91') || text.includes('OTP') || text.includes('widget') || text.includes('✅')) {
      console.log(`📝 [Browser] ${text}`);
    }
  });

  // Log MSG91 API calls
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('msg91.com')) {
      console.log(`📡 [MSG91] ${response.status()} ${url.split('?')[0]}`);
    }
  });

  try {
    console.log('📱 Step 1: Navigate to signup page');
    await page.goto('http://localhost:5174/signup-otp', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded\n');

    // Wait for MSG91 widget
    console.log('⏳ Waiting for MSG91 widget...');
    await page.waitForTimeout(3000);

    const widgetLoaded = await page.evaluate(() => typeof window.sendOtp === 'function');
    console.log(widgetLoaded ? '✅ MSG91 Widget loaded\n' : '❌ MSG91 Widget NOT loaded\n');

    console.log('📝 Step 2: Looking for form fields...');

    // Take screenshot of initial state
    await page.screenshot({ path: 'auto-1-initial.png' });
    console.log('📸 Screenshot: auto-1-initial.png');

    // Try to find form fields with different selectors
    const nameField = await page.locator('input[placeholder*="name" i], input[type="text"]:first-of-type').first();
    const emailField = await page.locator('input[type="email"], input[placeholder*="email" i]').first();
    const phoneField = await page.locator('input[type="tel"], input[placeholder*="phone" i]').first();
    const passwordField = await page.locator('input[type="password"]').first();
    const roleSelect = await page.locator('select').first();

    console.log('✅ Form fields found\n');

    console.log('📝 Step 3: Filling form...');
    await nameField.fill('Test User OTP Auto');
    console.log('   ✓ Name filled');

    await emailField.fill('rnkbohra@gmail.com');
    console.log('   ✓ Email: rnkbohra@gmail.com');

    await phoneField.fill('919971093202');
    console.log('   ✓ Phone: 919971093202');

    await passwordField.fill('Test123456!');
    console.log('   ✓ Password filled');

    await roleSelect.selectOption({ index: 0 });
    console.log('   ✓ Role selected\n');

    // Take screenshot of filled form
    await page.screenshot({ path: 'auto-2-filled.png' });
    console.log('📸 Screenshot: auto-2-filled.png\n');

    console.log('🚀 Step 4: Submitting form (clicking Continue)...');
    const submitButton = await page.locator('button[type="submit"], button:has-text("Continue")').first();
    await submitButton.click();
    console.log('✅ Form submitted\n');

    // Wait for OTP screen or response
    console.log('⏳ Waiting for OTP screen or response...');
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'auto-3-after-submit.png' });
    console.log('📸 Screenshot: auto-3-after-submit.png\n');

    // Check what happened
    const pageText = await page.evaluate(() => document.body.innerText);

    if (pageText.includes('OTP') || pageText.includes('verify')) {
      console.log('✅ SUCCESS! OTP screen appeared!');
      console.log('📱 Check your phone (+91 9971093202) for SMS OTP');
      console.log('📧 Check your email (rnkbohra@gmail.com) for Email OTP\n');
    } else if (pageText.includes('error') || pageText.includes('Error')) {
      console.log('❌ Error occurred. Check screenshot auto-3-after-submit.png');
      console.log('   Page text:', pageText.substring(0, 200));
    } else {
      console.log('⚠️  Unknown state. Page text:', pageText.substring(0, 200));
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('  ⏸️  Browser paused for manual OTP entry');
    console.log('  Enter the OTP in the browser when you receive it');
    console.log('  Browser will stay open for 5 minutes');
    console.log('═══════════════════════════════════════════════\n');

    // Keep browser open for 5 minutes for manual OTP entry
    await page.waitForTimeout(300000);

    console.log('🔚 Closing browser...');
    await browser.close();

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'auto-error.png' });
    console.log('📸 Error screenshot: auto-error.png');

    console.log('\n⏸️  Browser staying open for inspection...');
    await page.waitForTimeout(60000);
    await browser.close();
    process.exit(1);
  }
})();
