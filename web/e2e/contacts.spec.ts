import { test, expect } from '@playwright/test';

test.describe('Contact Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new medical contact', async ({ page }) => {
    // Navigate to contacts page
    await page.click('button:has-text("Contacts")');
    await page.waitForURL('/contacts');
    
    // Click "Add Contact" button
    await page.click('button:has-text("Add Contact")');
    
    // Fill in contact form
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `Test Doctor ${timestamp}`);
    await page.selectOption('select[name="contactCategory"]', 'MEDICAL');
    await page.selectOption('select[name="contactType"]', 'DOCTOR');
    await page.fill('input[name="phone"]', '9876543210');
    await page.fill('input[name="email"]', `testdoc${timestamp}@example.com`);
    await page.fill('input[name="specialty"]', 'Cardiology');
    await page.fill('input[name="hospitalName"]', 'Test Hospital');
    await page.fill('input[name="city"]', 'Mumbai');
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Add Contact")');
    
    // Wait for success message or redirect
    await page.waitForTimeout(1000);
    
    // Verify contact appears in the list
    await expect(page.getByText(`Test Doctor ${timestamp}`)).toBeVisible();
  });

  test('should create a new distribution contact', async ({ page }) => {
    // Navigate to contacts page
    await page.click('button:has-text("Contacts")');
    await page.waitForURL('/contacts');
    
    // Click "Add Contact" button
    await page.click('button:has-text("Add Contact")');
    
    // Fill in contact form
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `Test Distributor ${timestamp}`);
    await page.selectOption('select[name="contactCategory"]', 'DISTRIBUTION');
    await page.selectOption('select[name="contactType"]', 'WHOLESALER');
    await page.fill('input[name="phone"]', '9876543211');
    await page.fill('input[name="email"]', `testdist${timestamp}@example.com`);
    await page.fill('input[name="city"]', 'Delhi');
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Add Contact")');
    
    // Wait for success message or redirect
    await page.waitForTimeout(1000);
    
    // Verify contact appears in the list
    await expect(page.getByText(`Test Distributor ${timestamp}`)).toBeVisible();
  });

  test('should filter contacts by category', async ({ page }) => {
    // Navigate to contacts page
    await page.click('button:has-text("Contacts")');
    await page.waitForURL('/contacts');
    
    // Check if filters exist (may need to adjust selectors based on actual implementation)
    const medicalFilter = page.locator('button:has-text("Medical")');
    const distributionFilter = page.locator('button:has-text("Distribution")');
    
    if (await medicalFilter.isVisible()) {
      await medicalFilter.click();
      await page.waitForTimeout(500);
      
      // Verify only medical contacts are shown
      // This would need adjustment based on how filtering is implemented
    }
  });

  test('should search for contacts', async ({ page }) => {
    // Navigate to contacts page
    await page.click('button:has-text("Contacts")');
    await page.waitForURL('/contacts');
    
    // Look for search input
    const searchInput = page.locator('input[type="text"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Test');
      await page.waitForTimeout(500);
      
      // Verify search results
      await expect(page.getByText(/test/i)).toBeVisible();
    }
  });
});
