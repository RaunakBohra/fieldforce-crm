import { test } from '@playwright/test';

test('Debug Login Page', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('/login');

  // Wait a bit to see what happens
  await page.waitForTimeout(10000);

  // Take screenshot
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });

  // Log the HTML content
  const html = await page.content();
  console.log('PAGE HTML:', html.substring(0, 1000));
});
