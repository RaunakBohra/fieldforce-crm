import { test, expect } from '@playwright/test';

/**
 * E2E Authentication Tests
 * Tests complete user flow: signup → login → protected routes → logout
 */

// Generate unique test user for each run
const timestamp = Date.now();
const testUser = {
  email: `e2e-test-${timestamp}@test.com`,
  password: 'Test123!@#',
  name: 'E2E Test User',
  phone: '9876543210',
};

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display login page by default', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h2')).toContainText('Field Force CRM');
    await expect(page.locator('p')).toContainText('Sign in to your account');
  });

  test('should successfully sign up a new user', async ({ page, context }) => {
    console.log('🧪 Testing signup flow with:', testUser.email);

    await page.goto('/signup');

    // Verify we're on signup page
    await expect(page.locator('h2')).toContainText('Field Force CRM');
    await expect(page.locator('p')).toContainText('Create your account');

    // Fill signup form
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="phone"]', testUser.phone);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);

    // Enable request logging
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('📤 Request:', request.method(), request.url());
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        console.log('📥 Response:', status, response.url());
        if (status >= 400) {
          const body = await response.text().catch(() => '(unable to read body)');
          console.log('❌ Error body:', body);
        }
      }
    });

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Wait for redirect to dashboard (may take a moment due to backend processing)
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Verify we're on dashboard
    await expect(page.locator('h1')).toContainText('Field Force CRM');
    await expect(page.locator('h2')).toContainText(`Welcome, ${testUser.name}!`);

    // Verify user details are displayed
    await expect(page.getByText(testUser.email)).toBeVisible();
    await expect(page.getByText(testUser.phone)).toBeVisible();

    // Verify token is stored
    const cookies = await context.cookies();
    const localStorage = await page.evaluate(() => {
      return {
        token: window.localStorage.getItem('token'),
      };
    });

    console.log('✅ Token stored in localStorage:', !!localStorage.token);
    expect(localStorage.token).toBeTruthy();
  });

  test('should show validation error for weak password', async ({ page }) => {
    console.log('🧪 Testing password validation');

    await page.goto('/signup');

    // Fill form with weak password
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'weak@test.com');
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('.text-red-600')).toContainText('Password must be at least 8 characters');
  });

  test('should show error for password mismatch', async ({ page }) => {
    console.log('🧪 Testing password mismatch validation');

    await page.goto('/signup');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'mismatch@test.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Different123!@#');

    await page.click('button[type="submit"]');

    // Frontend validation should catch this before API call
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('.text-red-600')).toContainText('Passwords do not match');
  });

  test('should login with existing user credentials', async ({ page }) => {
    console.log('🧪 Testing login flow with:', testUser.email);

    await page.goto('/login');

    // Fill login form
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    // Enable request logging
    page.on('response', async response => {
      if (response.url().includes('/api/auth/login')) {
        console.log('📥 Login response:', response.status());
        if (response.status() >= 400) {
          const body = await response.text().catch(() => '(unable to read body)');
          console.log('❌ Login error:', body);
        }
      }
    });

    // Submit login
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Verify dashboard loaded
    await expect(page.locator('h2')).toContainText(`Welcome, ${testUser.name}!`);

    console.log('✅ Login successful');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    console.log('🧪 Testing invalid login credentials');

    await page.goto('/login');

    await page.fill('input[type="email"]', 'nonexistent@test.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');

    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('.text-red-600')).toContainText(/Invalid credentials|Login failed/);
  });

  test('should protect dashboard from unauthenticated access', async ({ page }) => {
    console.log('🧪 Testing protected route access');

    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    console.log('✅ Protected route properly redirected');
  });

  test('should logout and clear session', async ({ page }) => {
    console.log('🧪 Testing logout flow');

    // First, login
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Verify token exists
    let localStorage = await page.evaluate(() => window.localStorage.getItem('token'));
    expect(localStorage).toBeTruthy();
    console.log('✅ User logged in, token exists');

    // Click logout button
    const logoutButton = page.locator('button', { hasText: 'Logout' });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 5000 });

    // Verify token is cleared
    localStorage = await page.evaluate(() => window.localStorage.getItem('token'));
    expect(localStorage).toBeFalsy();
    console.log('✅ Logout successful, token cleared');
  });

  test('should display user stats on dashboard', async ({ page }) => {
    console.log('🧪 Testing dashboard stats display');

    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Verify stats cards
    await expect(page.getByText('Contacts')).toBeVisible();
    await expect(page.getByText('Visits')).toBeVisible();
    await expect(page.getByText('Orders')).toBeVisible();

    // Verify "Coming soon" messages
    await expect(page.getByText('Coming in Day 2')).toBeVisible();
    await expect(page.getByText('Coming in Day 3')).toBeVisible();
    await expect(page.getByText('Coming in Day 4')).toBeVisible();

    console.log('✅ Dashboard stats displayed correctly');
  });
});
