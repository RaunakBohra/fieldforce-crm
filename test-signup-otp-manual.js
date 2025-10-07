/**
 * Manual MSG91 OTP Signup Test
 * Opens the signup page in headed mode for manual testing
 */

import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Launching browser in headed mode...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // Slow down by 500ms for better visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  console.log('📱 Opening signup page: http://localhost:5174/signup-otp');
  await page.goto('http://localhost:5174/signup-otp');

  console.log('✅ Page loaded! You can now:');
  console.log('   1. Fill the signup form');
  console.log('   2. Enter phone: 919971093202 (your number)');
  console.log('   3. Enter email: test@example.com');
  console.log('   4. Enter password: Test123456!');
  console.log('   5. Click Continue');
  console.log('   6. Wait for SMS OTP and enter it');
  console.log('   7. Then enter Email OTP');
  console.log('');
  console.log('⚠️  Browser will stay open - close it manually when done');
  console.log('📋 Check the console for any MSG91 widget logs');

  // Keep the script running so browser stays open
  await new Promise(() => {});
})();
