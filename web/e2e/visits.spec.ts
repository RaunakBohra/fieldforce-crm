import { test, expect } from '@playwright/test';

test.describe('Visit Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new visit', async ({ page }) => {
    // Navigate to visits page
    await page.click('button:has-text("Visits")');
    await page.waitForURL('/visits');
    
    // Click "Add Visit" button
    await page.click('button:has-text("Add Visit")');
    
    // Fill in visit form
    // Select a contact (assuming there's a select dropdown or autocomplete)
    await page.click('select[name="contactId"]');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Fill visit date (today's date)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="visitDate"]', today);
    
    // Select visit type
    await page.selectOption('select[name="visitType"]', 'FIELD_VISIT');
    
    // Select status
    await page.selectOption('select[name="status"]', 'PLANNED');
    
    // Fill purpose
    await page.fill('textarea[name="purpose"]', 'Product demonstration and sample distribution');
    
    // Fill notes
    await page.fill('textarea[name="notes"]', 'First visit of the month');
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Add Visit")');
    
    // Wait for success
    await page.waitForTimeout(1000);
    
    // Verify visit appears in the list
    await expect(page.getByText('Product demonstration')).toBeVisible();
  });

  test('should update visit status', async ({ page }) => {
    // Navigate to visits page
    await page.click('button:has-text("Visits")');
    await page.waitForURL('/visits');
    
    // Wait for visits to load
    await page.waitForTimeout(1000);
    
    // Click on the first visit's edit button (if available)
    const editButton = page.locator('button:has-text("Edit")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Change status to completed
      await page.selectOption('select[name="status"]', 'COMPLETED');
      
      // Set outcome
      await page.selectOption('select[name="outcome"]', 'SUCCESSFUL');
      
      // Add duration
      await page.fill('input[name="duration"]', '45');
      
      // Save
      await page.click('button[type="submit"]:has-text("Update")');
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Verify status changed
      await expect(page.getByText('COMPLETED')).toBeVisible();
    }
  });

  test('should display visit stats on dashboard', async ({ page }) => {
    // Should already be on dashboard from beforeEach
    await page.goto('/dashboard');
    
    // Verify visit stats card
    await expect(page.getByText('Visits')).toBeVisible();
    
    // Verify stats show numbers
    const visitStatsCard = page.locator('div').filter({ hasText: /^Visits/ }).first();
    await expect(visitStatsCard).toBeVisible();
    
    // Check for planned/completed stats
    await expect(page.getByText(/Planned|This Month/)).toBeVisible();
  });

  test('should navigate between dashboard and visits', async ({ page }) => {
    // Start on dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Navigate to visits
    await page.click('button:has-text("Visits")');
    await page.waitForURL('/visits');
    await expect(page).toHaveURL('/visits');
    
    // Navigate back to dashboard
    await page.click('button:has-text("Dashboard")');
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });
});
