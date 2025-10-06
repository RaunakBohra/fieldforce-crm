import { test, expect } from '@playwright/test';

test.describe('UI/UX Analysis - Header, Menu, and Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Desktop - Header and Navigation Analysis', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for navigation to be visible
    await page.waitForSelector('nav[role="navigation"]');

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/ui-analysis/desktop-full-page.png',
      fullPage: true
    });

    // Take header-only screenshot
    const header = page.locator('nav[role="navigation"]');
    await header.screenshot({
      path: 'test-results/ui-analysis/desktop-header.png'
    });

    // Analyze navigation items
    const navButtons = page.locator('nav[role="navigation"] button');
    const navCount = await navButtons.count();
    console.log(`Desktop Navigation: ${navCount} items found`);

    // Check for overflow
    const navBar = page.locator('nav[role="navigation"] .flex.space-x-2');
    const navBox = await navBar.boundingBox();
    console.log('Desktop Nav Bar Width:', navBox?.width);

    // Take dashboard content screenshot
    await page.screenshot({
      path: 'test-results/ui-analysis/desktop-dashboard.png'
    });
  });

  test('Tablet - Header and Navigation Analysis', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.waitForSelector('nav[role="navigation"]');

    await page.screenshot({
      path: 'test-results/ui-analysis/tablet-full-page.png',
      fullPage: true
    });

    const header = page.locator('nav[role="navigation"]');
    await header.screenshot({
      path: 'test-results/ui-analysis/tablet-header.png'
    });
  });

  test('Mobile - Header and Menu Analysis', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.waitForSelector('nav[role="navigation"]');

    // Screenshot of closed menu
    await page.screenshot({
      path: 'test-results/ui-analysis/mobile-menu-closed.png',
      fullPage: true
    });

    // Open mobile menu
    await page.click('button[aria-label="Toggle menu"]');
    await page.waitForTimeout(300); // Wait for animation

    // Screenshot of open menu
    await page.screenshot({
      path: 'test-results/ui-analysis/mobile-menu-open.png',
      fullPage: true
    });

    // Analyze menu items
    const mobileMenuItems = page.locator('.md\\:hidden button');
    const mobileCount = await mobileMenuItems.count();
    console.log(`Mobile Menu: ${mobileCount} items found`);

    // Check menu height
    const mobileMenu = page.locator('.md\\:hidden .space-y-1');
    const menuBox = await mobileMenu.boundingBox();
    console.log('Mobile Menu Height:', menuBox?.height);
  });

  test('Dashboard Layout Analysis - Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for dashboard to load
    await page.waitForSelector('text=Quick Actions');
    await page.waitForSelector('text=Today\'s Metrics');

    // Screenshot sections
    const quickActions = page.locator('section:has(h2:text("Quick Actions"))');
    await quickActions.screenshot({
      path: 'test-results/ui-analysis/desktop-quick-actions.png'
    });

    const metrics = page.locator('section:has(h2:text("Today\'s Metrics"))');
    await metrics.screenshot({
      path: 'test-results/ui-analysis/desktop-metrics.png'
    });

    // Check spacing and layout
    const pageContent = page.locator('.max-w-7xl');
    const contentBox = await pageContent.boundingBox();
    console.log('Dashboard Content Width:', contentBox?.width);
  });

  test('Dashboard Layout Analysis - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.waitForSelector('text=Quick Actions');

    // Screenshot Quick Actions on mobile
    const quickActions = page.locator('section:has(h2:text("Quick Actions"))');
    await quickActions.screenshot({
      path: 'test-results/ui-analysis/mobile-quick-actions.png'
    });

    // Screenshot metrics on mobile
    const metrics = page.locator('section:has(h2:text("Today\'s Metrics"))');
    await metrics.screenshot({
      path: 'test-results/ui-analysis/mobile-metrics.png'
    });

    // Full page screenshot
    await page.screenshot({
      path: 'test-results/ui-analysis/mobile-dashboard-full.png',
      fullPage: true
    });
  });

  test('Navigation Interaction Analysis', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Hover over navigation items
    const navItems = page.locator('nav[role="navigation"] .hidden.md\\:flex button');

    for (let i = 0; i < Math.min(3, await navItems.count()); i++) {
      const item = navItems.nth(i);
      await item.hover();
      await page.waitForTimeout(200);

      await page.screenshot({
        path: `test-results/ui-analysis/nav-hover-${i}.png`
      });
    }
  });

  test('Responsive Breakpoint Analysis', async ({ page }) => {
    const breakpoints = [
      { width: 375, name: 'mobile-small' },
      { width: 414, name: 'mobile-medium' },
      { width: 768, name: 'tablet' },
      { width: 1024, name: 'desktop-small' },
      { width: 1440, name: 'desktop-medium' },
      { width: 1920, name: 'desktop-large' },
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: 1080 });
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `test-results/ui-analysis/breakpoint-${bp.name}.png`
      });
    }
  });
});
