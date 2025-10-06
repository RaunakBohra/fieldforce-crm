import { test, expect } from '@playwright/test';

test.describe('Verify UI/UX Improvements', () => {
  test('Capture improved desktop dashboard', async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    // Wait for dashboard with longer timeout
    await page.waitForURL('/dashboard', { timeout: 60000 });
    await page.waitForTimeout(2000); // Wait for all data to load

    // Capture full page
    await page.screenshot({
      path: 'test-results/improved-desktop-dashboard.png',
      fullPage: true
    });

    // Capture header
    const nav = page.locator('nav[role="navigation"]');
    await nav.screenshot({
      path: 'test-results/improved-desktop-header.png'
    });

    console.log('✅ Desktop screenshots captured');
  });

  test('Capture improved mobile view', async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('/dashboard', { timeout: 60000 });
    await page.waitForTimeout(2000);

    // Capture with menu closed
    await page.screenshot({
      path: 'test-results/improved-mobile-dashboard-closed.png',
      fullPage: true
    });

    // Open menu
    await page.click('button[aria-label="Toggle menu"]');
    await page.waitForTimeout(500);

    // Capture with menu open
    await page.screenshot({
      path: 'test-results/improved-mobile-dashboard-open.png',
      fullPage: true
    });

    console.log('✅ Mobile screenshots captured');
  });
});
