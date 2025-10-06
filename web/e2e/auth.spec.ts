import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Verify user name is displayed
    await expect(page.getByText('Welcome, Production Test User!')).toBeVisible();
    
    // Verify dashboard stats are loaded
    await expect(page.getByText('Contacts')).toBeVisible();
    await expect(page.getByText('Visits')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form with wrong password
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should still be on login page
    await expect(page).toHaveURL('/login');
    
    // Error message should be visible
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Click logout button
    await page.click('button:has-text("Logout")');
    
    // Should be redirected to login
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });
});
