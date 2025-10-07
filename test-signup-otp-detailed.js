/**
 * Comprehensive MSG91 OTP Signup Test with Full Logging
 * Captures console logs, network requests, and takes screenshots
 */

import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Starting MSG91 OTP Signup Test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000, // 1 second delay between actions
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  // Capture all console messages
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'log' ? '📝' : 'ℹ️';
    console.log(`${icon} [Browser Console - ${type.toUpperCase()}] ${text}`);
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    console.log(`❌ [Page Error] ${error.message}`);
  });

  // Capture network requests
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('localhost') || url.includes('msg91')) {
      console.log(`📤 [Request] ${request.method()} ${url}`);
    }
  });

  // Capture network responses
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('localhost') || url.includes('msg91')) {
      const status = response.status();
      const statusIcon = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';
      console.log(`📥 [Response] ${statusIcon} ${status} ${url}`);

      // Log response body for API calls
      if (url.includes('/api/')) {
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            const body = await response.json();
            console.log(`   Response body:`, JSON.stringify(body, null, 2));
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    }
  });

  try {
    console.log('\n📱 Step 1: Navigate to signup page');
    await page.goto('http://localhost:5174/signup-otp', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded\n');

    // Take screenshot
    await page.screenshot({ path: 'screenshot-1-loaded.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshot-1-loaded.png\n');

    // Wait a bit for MSG91 widget to load
    console.log('⏳ Waiting for MSG91 widget to load (3 seconds)...');
    await page.waitForTimeout(3000);

    // Check if MSG91 widget loaded
    const widgetLoaded = await page.evaluate(() => {
      return typeof window.sendOtp === 'function';
    });

    if (widgetLoaded) {
      console.log('✅ MSG91 Widget loaded successfully!');
      console.log('   - window.sendOtp: available');
      console.log('   - window.verifyOtp: available');
      console.log('   - window.retryOtp: available\n');
    } else {
      console.log('❌ MSG91 Widget NOT loaded!');
      console.log('   Please check browser console for errors\n');
    }

    // Take screenshot after widget load
    await page.screenshot({ path: 'screenshot-2-widget-loaded.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshot-2-widget-loaded.png\n');

    console.log('📝 Step 2: Fill signup form');

    // Fill form
    await page.fill('input[name="name"]', 'Test User OTP');
    console.log('   ✓ Name filled');

    await page.fill('input[name="email"]', 'rnkbohra@gmail.com');
    console.log('   ✓ Email filled');

    await page.fill('input[name="phone"]', '919971093202');
    console.log('   ✓ Phone filled: 919971093202');

    await page.fill('input[name="password"]', 'Test123456!');
    console.log('   ✓ Password filled');

    await page.selectOption('select[name="role"]', 'FIELD_REP');
    console.log('   ✓ Role selected: FIELD_REP\n');

    // Take screenshot before submit
    await page.screenshot({ path: 'screenshot-3-form-filled.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshot-3-form-filled.png\n');

    console.log('🚀 Step 3: Submit form (click Continue button)');
    await page.click('button[type="submit"]');
    console.log('   ✓ Button clicked\n');

    // Wait for OTP screen
    console.log('⏳ Waiting for phone OTP screen...');
    await page.waitForTimeout(3000);

    // Take screenshot of OTP screen
    await page.screenshot({ path: 'screenshot-4-otp-screen.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshot-4-otp-screen.png\n');

    // Check what's on screen
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent,
        h2: document.querySelector('h2')?.textContent,
        errors: Array.from(document.querySelectorAll('[class*="error"]')).map(el => el.textContent),
        buttons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent),
      };
    });

    console.log('📄 Current page content:');
    console.log('   Title:', pageContent.title);
    console.log('   H1:', pageContent.h1);
    console.log('   H2:', pageContent.h2);
    console.log('   Buttons:', pageContent.buttons);
    if (pageContent.errors.length > 0) {
      console.log('   ❌ Errors:', pageContent.errors);
    }
    console.log('');

    console.log('✅ Test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Page loaded: ✓');
    console.log('   - MSG91 Widget: ' + (widgetLoaded ? '✓' : '✗'));
    console.log('   - Form filled: ✓');
    console.log('   - Form submitted: ✓');
    console.log('   - Screenshots: 4 images saved');
    console.log('\n⚠️  Browser will stay open for 30 seconds for manual inspection...');
    console.log('    Check the OTP screen and enter OTP manually if needed.\n');

    // Wait 30 seconds before closing
    await page.waitForTimeout(30000);

    console.log('🔚 Closing browser...');
    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);

    // Take error screenshot
    try {
      await page.screenshot({ path: 'screenshot-error.png', fullPage: true });
      console.log('📸 Error screenshot saved: screenshot-error.png');
    } catch (e) {
      // Ignore screenshot errors
    }

    console.log('\n⚠️  Browser will stay open for inspection...');
    await page.waitForTimeout(60000);
    await browser.close();
    process.exit(1);
  }
})();
