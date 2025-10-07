import { test, expect } from '@playwright/test';

/**
 * E2E Test: MSG91 OTP Signup Flow
 *
 * Tests the complete signup flow with MSG91 OTP verification:
 * 1. Fill signup form
 * 2. Send phone OTP
 * 3. Verify phone OTP
 * 4. Send email OTP
 * 5. Verify email OTP
 * 6. Account creation
 * 7. Auto-login and redirect to dashboard
 */

test.describe('MSG91 OTP Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to OTP signup page
    await page.goto('http://localhost:5174/signup-otp');

    // Wait for MSG91 widget to load
    await page.waitForFunction(() => {
      return typeof (window as any).sendOtp === 'function';
    }, { timeout: 10000 });
  });

  test('should complete full signup flow with phone and email OTP', async ({ page }) => {
    const testUser = {
      name: 'E2E Test User',
      email: 'rnkbohra@gmail.com',
      phone: '9971093202',
      password: 'Test123456!',
    };

    // Step 1: Fill signup form
    await test.step('Fill signup form', async () => {
      await page.fill('input[type="text"]', testUser.name);
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="tel"]', testUser.phone);
      await page.fill('input[type="password"]', testUser.password);
      await page.selectOption('select', 'FIELD_REP');

      // Take screenshot
      await page.screenshot({ path: 'test-results/01-form-filled.png' });

      // Submit form
      await page.click('button[type="submit"]');
    });

    // Step 2: Phone OTP screen
    await test.step('Send phone OTP', async () => {
      // Wait for phone OTP screen
      await expect(page.locator('text=Verify Phone Number')).toBeVisible({ timeout: 5000 });
      await expect(page.locator(`text=+91${testUser.phone}`)).toBeVisible();

      // Take screenshot
      await page.screenshot({ path: 'test-results/02-phone-otp-screen.png' });

      // Click "Send OTP to Phone" button
      await page.click('button:has-text("Send OTP to Phone")');

      // Wait for OTP to be sent (loading state)
      await expect(page.locator('button:has-text("Sending")')).toBeVisible({ timeout: 2000 });

      // Wait for send to complete
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'test-results/03-phone-otp-sent.png' });
    });

    // Step 3: Enter phone OTP (manual step - pause for user input)
    await test.step('Verify phone OTP (manual)', async () => {
      console.log('\n📱 ═══════════════════════════════════════');
      console.log('   MANUAL STEP: Enter Phone OTP');
      console.log('   Check your phone for SMS OTP');
      console.log('   Enter the 4-digit OTP in the browser');
      console.log('═══════════════════════════════════════\n');

      // Wait for user to enter OTP and click verify (5 minutes max)
      const phoneVerified = await page.waitForSelector(
        'text=Phone verified successfully',
        { timeout: 300000 } // 5 minutes
      );

      expect(phoneVerified).toBeTruthy();
      await page.screenshot({ path: 'test-results/04-phone-verified.png' });
    });

    // Step 4: Email OTP screen
    await test.step('Send email OTP', async () => {
      // Wait for email OTP screen
      await expect(page.locator('text=Verify Email Address')).toBeVisible({ timeout: 5000 });
      await expect(page.locator(`text=${testUser.email}`)).toBeVisible();

      await page.screenshot({ path: 'test-results/05-email-otp-screen.png' });

      // Click "Send OTP to Email" button
      await page.click('button:has-text("Send OTP to Email")');

      // Wait for OTP to be sent
      await expect(page.locator('button:has-text("Sending")')).toBeVisible({ timeout: 2000 });

      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'test-results/06-email-otp-sent.png' });
    });

    // Step 5: Enter email OTP (manual step - pause for user input)
    await test.step('Verify email OTP (manual)', async () => {
      console.log('\n📧 ═══════════════════════════════════════');
      console.log('   MANUAL STEP: Enter Email OTP');
      console.log('   Check your email for OTP');
      console.log('   Enter the 4-digit OTP in the browser');
      console.log('═══════════════════════════════════════\n');

      // Wait for account creation or success screen (5 minutes max)
      const accountCreated = await page.waitForSelector(
        'text=Account Created!',
        { timeout: 300000 } // 5 minutes
      );

      expect(accountCreated).toBeTruthy();
      await page.screenshot({ path: 'test-results/07-account-created.png' });
    });

    // Step 6: Verify redirect to dashboard
    await test.step('Verify auto-login and redirect', async () => {
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      // Verify we're on dashboard
      expect(page.url()).toContain('/dashboard');

      // Verify token is stored
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();

      await page.screenshot({ path: 'test-results/08-dashboard.png' });
    });
  });

  test('should show validation errors for invalid form data', async ({ page }) => {
    await test.step('Test empty form submission', async () => {
      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator('text=All fields are required')).toBeVisible({ timeout: 3000 });
    });

    await test.step('Test short password', async () => {
      await page.fill('input[type="text"]', 'Test User');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="tel"]', '9999999999');
      await page.fill('input[type="password"]', 'short');

      await page.click('button[type="submit"]');

      // Should show password error
      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible({ timeout: 3000 });
    });

    await test.step('Test invalid phone number', async () => {
      await page.fill('input[type="text"]', 'Test User');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="tel"]', '123'); // Too short
      await page.fill('input[type="password"]', 'Test123456!');

      await page.click('button[type="submit"]');

      // Should show phone error
      await expect(page.locator('text=Please enter a valid phone number')).toBeVisible({ timeout: 3000 });
    });
  });

  test('should handle OTP verification errors gracefully', async ({ page }) => {
    const testUser = {
      name: 'Error Test User',
      email: 'test@example.com',
      phone: '9999999999',
      password: 'Test123456!',
    };

    // Fill and submit form
    await page.fill('input[type="text"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="tel"]', testUser.phone);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for phone OTP screen
    await expect(page.locator('text=Verify Phone Number')).toBeVisible({ timeout: 5000 });

    // Send OTP
    await page.click('button:has-text("Send OTP to Phone")');
    await page.waitForTimeout(3000);

    // Enter invalid OTP
    await test.step('Test invalid OTP', async () => {
      await page.fill('input[placeholder="1234"]', '0000');

      // Verify button should be disabled until 4 digits entered
      const verifyButton = page.locator('button:has-text("Verify Phone OTP")');
      await expect(verifyButton).toBeEnabled();

      // Click verify
      await verifyButton.click();

      // Should show error (might take a moment for MSG91 to respond)
      const errorMessage = page.locator('.bg-danger-50');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      await page.screenshot({ path: 'test-results/error-invalid-otp.png' });
    });
  });

  test('should allow resending OTP', async ({ page }) => {
    const testUser = {
      name: 'Resend Test User',
      email: 'test@example.com',
      phone: '9999999999',
      password: 'Test123456!',
    };

    // Fill and submit form
    await page.fill('input[type="text"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="tel"]', testUser.phone);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for phone OTP screen
    await expect(page.locator('text=Verify Phone Number')).toBeVisible({ timeout: 5000 });

    // Send OTP first time
    await page.click('button:has-text("Send OTP to Phone")');
    await page.waitForTimeout(3000);

    // Click resend (which is actually the same "Send OTP to Phone" button again)
    await test.step('Resend OTP', async () => {
      await page.click('button:has-text("Send OTP to Phone")');

      // Should show loading state
      await expect(page.locator('button:has-text("Sending")')).toBeVisible({ timeout: 2000 });

      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'test-results/resend-otp.png' });
    });
  });

  test('should navigate back to login page', async ({ page }) => {
    // Find and click login link
    const loginLink = page.locator('button:has-text("Log in")');
    await expect(loginLink).toBeVisible();

    await loginLink.click();

    // Should navigate to login page
    await page.waitForURL('**/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('should load MSG91 widget successfully', async ({ page }) => {
    // Verify MSG91 script is loaded
    const msg91Script = await page.locator('script[src*="verify.msg91.com"]').count();
    expect(msg91Script).toBeGreaterThan(0);

    // Verify window methods are exposed
    const methodsExposed = await page.evaluate(() => {
      return {
        sendOtp: typeof (window as any).sendOtp === 'function',
        verifyOtp: typeof (window as any).verifyOtp === 'function',
        retryOtp: typeof (window as any).retryOtp === 'function',
      };
    });

    expect(methodsExposed.sendOtp).toBe(true);
    expect(methodsExposed.verifyOtp).toBe(true);
    expect(methodsExposed.retryOtp).toBe(true);
  });
});

test.describe('MSG91 OTP Signup - UI/UX Tests', () => {
  test('should have proper page title and headings', async ({ page }) => {
    await page.goto('http://localhost:5174/signup-otp');

    // Check heading
    await expect(page.locator('h1:has-text("Create Account")')).toBeVisible();
    await expect(page.locator('text=Join Field Force CRM')).toBeVisible();
  });

  test('should display proper step titles', async ({ page }) => {
    await page.goto('http://localhost:5174/signup-otp');

    const testUser = {
      name: 'UI Test User',
      email: 'test@example.com',
      phone: '9999999999',
      password: 'Test123456!',
    };

    // Initial: "Create Account"
    await expect(page.locator('h1:has-text("Create Account")')).toBeVisible();

    // Fill and submit
    await page.fill('input[type="text"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="tel"]', testUser.phone);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Should show "Verify Phone Number"
    await expect(page.locator('h1:has-text("Verify Phone Number")')).toBeVisible({ timeout: 5000 });
  });

  test('should use correct color scheme (indigo/pink theme)', async ({ page }) => {
    await page.goto('http://localhost:5174/signup-otp');

    // Check for primary button (should have bg-primary-600)
    const submitButton = page.locator('button[type="submit"]');
    const buttonClasses = await submitButton.getAttribute('class');

    expect(buttonClasses).toContain('btn-primary');
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:5174/signup-otp');

    // Form should still be visible and usable
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await page.screenshot({ path: 'test-results/mobile-view.png' });
  });
});
