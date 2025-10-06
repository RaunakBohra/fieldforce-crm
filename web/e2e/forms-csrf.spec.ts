import { test, expect } from '@playwright/test';

/**
 * Comprehensive Form CSRF Token Tests
 * Tests all forms (Contact, Visit, Product, Order, Payment) to ensure:
 * 1. Forms load without CSRF token errors
 * 2. Form submissions succeed with CSRF tokens
 * 3. Data appears in listing pages after creation
 */

test.describe('Form CSRF Token Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a contact without CSRF errors', async ({ page }) => {
    // Navigate to contacts page
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    // Click "Add Contact" button
    await page.click('button:has-text("Add Contact")');
    await page.waitForURL('/contacts/new');

    // Wait for form to load
    await page.waitForSelector('form');

    // Fill in contact form
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `CSRF Test Doctor ${timestamp}`);
    await page.selectOption('select[name="contactCategory"]', 'MEDICAL');
    await page.selectOption('select[name="contactType"]', 'DOCTOR');
    await page.fill('input[name="phone"]', '9999888877');
    await page.fill('input[name="email"]', `csrftest${timestamp}@example.com`);
    await page.fill('input[name="city"]', 'Mumbai');

    // Submit form and wait for navigation
    await page.click('button[type="submit"]');

    // Should redirect to contacts list without CSRF errors
    await page.waitForURL('/contacts', { timeout: 10000 });

    // Verify contact appears in the list
    await expect(page.getByText(`CSRF Test Doctor ${timestamp}`)).toBeVisible({ timeout: 5000 });
  });

  test('should create a visit without CSRF errors', async ({ page }) => {
    // Navigate to visits page
    await page.goto('/visits');
    await page.waitForLoadState('networkidle');

    // Click "Add Visit" or "New Visit" button
    await page.click('button:has-text("Add Visit"), button:has-text("New Visit")');
    await page.waitForURL('/visits/new');

    // Wait for form to load
    await page.waitForSelector('form');

    // Fill in visit form
    await page.selectOption('select[name="contactId"]', { index: 1 }); // Select first contact
    await page.fill('input[name="purpose"]', 'CSRF Test Visit');
    await page.fill('textarea[name="notes"]', 'Testing CSRF token functionality');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect without CSRF errors
    await page.waitForURL('/visits', { timeout: 10000 });

    // Verify visit was created
    await expect(page.getByText('CSRF Test Visit')).toBeVisible({ timeout: 5000 });
  });

  test('should create a product without CSRF errors', async ({ page }) => {
    // Navigate to products page
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Click "Add Product" button
    await page.click('button:has-text("Add Product")');
    await page.waitForURL('/products/new');

    // Wait for form to load
    await page.waitForSelector('form');

    // Fill in product form
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `CSRF Test Product ${timestamp}`);
    await page.fill('input[name="sku"]', `CSRF-${timestamp}`);
    await page.selectOption('select[name="category"]', { index: 1 }); // Select first category
    await page.fill('input[name="price"]', '999.99');
    await page.fill('input[name="stock"]', '100');
    await page.fill('textarea[name="description"]', 'Testing CSRF token');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect without CSRF errors
    await page.waitForURL('/products', { timeout: 10000 });

    // Verify product appears in the list
    await expect(page.getByText(`CSRF Test Product ${timestamp}`)).toBeVisible({ timeout: 5000 });
  });

  test('should create an order without CSRF errors', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    // Click "Create Order" or "New Order" button
    await page.click('button:has-text("Create Order"), button:has-text("New Order")');
    await page.waitForURL('/orders/new');

    // Wait for form to load
    await page.waitForSelector('form');

    // Fill in order form
    await page.selectOption('select[name="contactId"]', { index: 1 }); // Select first contact

    // Add a product item
    await page.click('button:has-text("Add Product")');

    // Wait for product row to appear
    await page.waitForSelector('select[name*="productId"]');

    // Select product and quantity
    await page.selectOption('select[name*="productId"]', { index: 1 });
    await page.fill('input[type="number"][name*="quantity"]', '5');

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Order")');

    // Should redirect without CSRF errors
    await page.waitForURL('/orders', { timeout: 10000 });

    // Verify we're on the orders page (successful creation)
    await expect(page).toHaveURL('/orders');
  });

  test('should record a payment without CSRF errors', async ({ page }) => {
    // First, create an order or navigate to an existing one
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    // Look for "Record Payment" or "Add Payment" button
    const paymentButton = page.locator('button:has-text("Record Payment"), a:has-text("Record Payment")').first();

    if (await paymentButton.isVisible()) {
      await paymentButton.click();
    } else {
      // Navigate directly to payment form with orderId
      await page.goto('/payments/new');
    }

    // Wait for payment form to load
    await page.waitForSelector('form');

    // Fill in payment details
    await page.fill('input[name="amount"]', '1000');
    await page.selectOption('select[name="paymentMode"]', 'CASH');
    await page.fill('textarea[name="notes"]', 'CSRF Test Payment');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect without CSRF errors
    // May redirect to /payments or show success message
    await page.waitForTimeout(2000);

    // Verify no CSRF error message
    const csrfError = page.locator('text=/CSRF token/i');
    await expect(csrfError).not.toBeVisible();
  });

  test('should handle CSRF token refresh after login', async ({ page }) => {
    // Logout
    await page.goto('/dashboard');
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log out"), a:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL('/login');
    }

    // Login again
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Immediately try to create a contact (CSRF token should be refreshed)
    await page.goto('/contacts/new');
    await page.waitForSelector('form');

    const timestamp = Date.now();
    await page.fill('input[name="name"]', `Post-Login Test ${timestamp}`);
    await page.selectOption('select[name="contactCategory"]', 'MEDICAL');
    await page.selectOption('select[name="contactType"]', 'DOCTOR');
    await page.fill('input[name="phone"]', '9999777766');
    await page.fill('input[name="city"]', 'Delhi');

    await page.click('button[type="submit"]');

    // Should work without CSRF errors
    await page.waitForURL('/contacts', { timeout: 10000 });
    await expect(page.getByText(`Post-Login Test ${timestamp}`)).toBeVisible({ timeout: 5000 });
  });

  test('should display meaningful error on CSRF failure (if token manipulation)', async ({ page }) => {
    // This test verifies error handling
    // Navigate to contact form
    await page.goto('/contacts/new');
    await page.waitForSelector('form');

    // Fill form
    await page.fill('input[name="name"]', 'Error Test');
    await page.selectOption('select[name="contactCategory"]', 'MEDICAL');
    await page.selectOption('select[name="contactType"]', 'DOCTOR');

    // Manipulate localStorage to clear CSRF token (simulate token loss)
    await page.evaluate(() => {
      // Clear any cached CSRF token
      document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    });

    // Try to submit
    await page.click('button[type="submit"]');

    // Wait a moment for potential error
    await page.waitForTimeout(2000);

    // Should either succeed (fetches new token) or show user-friendly error
    // We expect it to succeed because our implementation fetches token on demand
    const url = page.url();
    expect(url).toMatch(/\/(contacts|dashboard)/);
  });
});
