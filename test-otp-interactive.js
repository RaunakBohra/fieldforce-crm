/**
 * Interactive MSG91 OTP Test - Opens browser for manual testing
 * With full console logging
 */

import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Opening browser for MSG91 OTP testing...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  // Log all console messages
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ [Browser] ${text}`);
    } else if (type === 'warning') {
      console.log(`⚠️  [Browser] ${text}`);
    } else if (type === 'log' && (text.includes('MSG91') || text.includes('OTP') || text.includes('widget'))) {
      console.log(`📝 [Browser] ${text}`);
    }
  });

  // Log page errors
  page.on('pageerror', (error) => {
    console.log(`❌ [Page Error] ${error.message}`);
  });

  // Log MSG91 API calls
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('msg91.com') || url.includes('/api/otp')) {
      const status = response.status();
      console.log(`📡 [API] ${status} ${url}`);

      try {
        if (url.includes('msg91.com')) {
          const body = await response.json();
          console.log(`   Response:`, JSON.stringify(body, null, 2));
        }
      } catch (e) {
        // Ignore
      }
    }
  });

  console.log('📱 Opening: http://localhost:5174/signup-otp\n');
  await page.goto('http://localhost:5174/signup-otp', { waitUntil: 'networkidle' });

  console.log('✅ Page loaded!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('  📋 MANUAL TEST INSTRUCTIONS:');
  console.log('');
  console.log('  1. Fill the signup form with:');
  console.log('     • Name: Test User');
  console.log('     • Email: rnkbohra@gmail.com');
  console.log('     • Phone: 919971093202');
  console.log('     • Password: Test123456!');
  console.log('     • Role: Field Rep');
  console.log('');
  console.log('  2. Click "Continue" button');
  console.log('');
  console.log('  3. You will receive SMS OTP on: +91 9971093202');
  console.log('');
  console.log('  4. Enter the 4-digit OTP you receive');
  console.log('');
  console.log('  5. Then you will receive Email OTP on: rnkbohra@gmail.com');
  console.log('');
  console.log('  6. Enter the Email OTP');
  console.log('');
  console.log('  7. Account will be created and you will be redirected!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('⚠️  Browser will stay open - watch this console for logs');
  console.log('    Close the browser window when done testing\n');

  // Wait for MSG91 widget to load
  await page.waitForTimeout(3000);

  // Check if widget loaded
  const widgetLoaded = await page.evaluate(() => {
    return typeof window.sendOtp === 'function';
  });

  if (widgetLoaded) {
    console.log('✅ MSG91 Widget loaded successfully!\n');
  } else {
    console.log('❌ MSG91 Widget NOT loaded - check browser console\n');
  }

  // Keep browser open indefinitely
  await new Promise(() => {});
})();
