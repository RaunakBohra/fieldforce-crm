import { test, expect } from '@playwright/test';

test.describe('Medical CRM Demo - Teal/Amber Theme', () => {
  test('View Login Page with Teal Theme', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForSelector('h1');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    
    // Verify teal theme elements are present
    await expect(page.locator('h1')).toContainText('Field Force CRM');
    
    // Keep page open for 5 seconds to view
    await page.waitForTimeout(5000);
  });

  test('View Signup Page with Teal Theme', async ({ page }) => {
    await page.goto('/signup');
    
    // Wait for page to load
    await page.waitForSelector('h1');
    
    // Take screenshot
    await page.screenshot({ path: 'signup-page.png', fullPage: true });
    
    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Field Force CRM');
    
    // Keep page open for 5 seconds to view
    await page.waitForTimeout(5000);
  });

  test('Complete Login Flow', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test1234!');
    
    // Keep form filled for 3 seconds to view
    await page.waitForTimeout(3000);
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'dashboard-page.png', fullPage: true });
    
    // Verify we're on dashboard
    await expect(page.locator('h2')).toContainText('Welcome');
    
    // Keep dashboard open for 5 seconds to view
    await page.waitForTimeout(5000);
  });
});
