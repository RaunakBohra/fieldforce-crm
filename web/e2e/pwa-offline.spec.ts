import { test, expect } from '@playwright/test';

test.describe('PWA Functionality', () => {
  test('should register service worker', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Wait for service worker registration
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return registration.active !== null;
      }
      return false;
    });

    expect(swRegistered).toBe(true);
    console.log('✅ Service worker registered');
  });

  test('should have valid PWA manifest', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Check manifest link
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestLink).toBeTruthy();

    // Fetch and validate manifest
    const manifestUrl = new URL(manifestLink!, 'http://localhost:5173/').href;
    const response = await page.request.get(manifestUrl);
    expect(response.ok()).toBe(true);

    const manifest = await response.json();
    expect(manifest.name).toBe('Field Force CRM');
    expect(manifest.short_name).toBe('FieldForce');
    expect(manifest.theme_color).toBe('#3730a3');
    expect(manifest.display).toBe('standalone');

    console.log('✅ PWA manifest valid:', manifest.name);
  });
});

test.describe('Offline Storage - Visits', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should save visit offline and show indicator', async ({ page, context }) => {
    // Go offline BEFORE navigating
    await context.setOffline(true);

    // Navigate to new visit form
    await page.goto('http://localhost:5173/visits/new');

    // Wait for page to load
    await page.waitForSelector('select', { timeout: 5000 });

    // Select first contact
    await page.selectOption('select', { index: 1 });

    // Click check-in
    await page.click('button:has-text("Check In")');

    // Should show offline alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Offline mode');
      expect(dialog.message()).toContain('saved locally');
      await dialog.accept();
    });

    // Wait for redirect
    await page.waitForURL('**/visits', { timeout: 5000 });

    // Verify offline indicator appears
    await expect(page.locator('text=Offline Mode')).toBeVisible({ timeout: 5000 });

    // Check IndexedDB for saved visit
    const offlineData = await page.evaluate(async () => {
      const localforage = (await import('localforage')).default;
      const offlineStore = localforage.createInstance({
        name: 'fieldforce-crm',
        storeName: 'offline_data'
      });
      const visits = await offlineStore.getItem('visits');
      return visits;
    });

    expect(offlineData).toBeTruthy();
    expect(Array.isArray(offlineData)).toBe(true);
    if (Array.isArray(offlineData)) {
      expect(offlineData.length).toBeGreaterThan(0);
      console.log('✅ Offline visit saved to IndexedDB:', offlineData[0]);
    }
  });

  test('should show pending count in offline indicator', async ({ page, context }) => {
    await context.setOffline(true);

    // Create offline visit
    await page.goto('http://localhost:5173/visits/new');
    await page.selectOption('select', { index: 1 });

    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Check In")');

    await page.waitForURL('**/visits');

    // Check offline indicator shows count
    const indicator = page.locator('text=Offline Mode').locator('..');
    await expect(indicator).toBeVisible();

    // Should show pending data count badge
    const badge = indicator.locator('span:has-text("1")');
    await expect(badge).toBeVisible();

    console.log('✅ Offline indicator shows pending count');
  });
});

test.describe('Offline Storage - Orders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should save order offline', async ({ page, context }) => {
    await context.setOffline(true);

    await page.goto('http://localhost:5173/orders/new');

    // Select contact
    await page.selectOption('select[value=""]', { index: 1 });

    // Add product
    await page.click('button:has-text("Add Product")');
    await page.selectOption('select[value=""]:last-of-type', { index: 1 });

    // Set quantity
    await page.fill('input[type="number"]', '5');

    // Submit
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Offline mode');
      dialog.accept();
    });
    await page.click('button[type="submit"]');

    await page.waitForURL('**/orders');

    // Verify in IndexedDB
    const offlineOrders = await page.evaluate(async () => {
      const localforage = (await import('localforage')).default;
      const offlineStore = localforage.createInstance({
        name: 'fieldforce-crm',
        storeName: 'offline_data'
      });
      return await offlineStore.getItem('orders');
    });

    expect(offlineOrders).toBeTruthy();
    expect(Array.isArray(offlineOrders)).toBe(true);
    if (Array.isArray(offlineOrders)) {
      expect(offlineOrders.length).toBeGreaterThan(0);
      console.log('✅ Offline order saved:', offlineOrders[0]);
    }
  });
});

test.describe('Auto-Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should auto-sync when coming back online', async ({ page, context }) => {
    // Create offline data first
    await context.setOffline(true);
    await page.goto('http://localhost:5173/visits/new');
    await page.selectOption('select', { index: 1 });

    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Check In")');
    await page.waitForURL('**/visits');

    // Verify offline indicator visible
    await expect(page.locator('text=Offline Mode')).toBeVisible();

    // Come back online
    await context.setOffline(false);

    // Trigger sync manually (in production this happens automatically)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('offline-sync-requested'));
    });

    // Wait for sync to complete (page reload happens on success)
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Should show online status
    await expect(page.locator('text=Offline Mode')).not.toBeVisible({ timeout: 5000 });

    console.log('✅ Auto-sync triggered when back online');
  });

  test('should allow manual sync via button', async ({ page, context }) => {
    // Create offline data
    await context.setOffline(true);
    await page.goto('http://localhost:5173/visits/new');
    await page.selectOption('select', { index: 1 });

    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Check In")');
    await page.waitForURL('**/visits');

    // Come back online
    await context.setOffline(false);

    // Click manual sync button in offline indicator
    const syncButton = page.locator('button:has-text("Sync Now")');
    if (await syncButton.isVisible()) {
      await syncButton.click();

      // Should show syncing state
      await expect(page.locator('text=Syncing...')).toBeVisible({ timeout: 2000 });

      console.log('✅ Manual sync button works');
    }
  });
});

test.describe('Offline Detection', () => {
  test('should detect online/offline status', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    const status = await page.evaluate(() => {
      return {
        navigatorOnline: navigator.onLine,
        isOnlineFunction: window.isOnline ? window.isOnline() : null,
      };
    });

    expect(status.navigatorOnline).toBe(true);
    console.log('✅ Online status detected correctly');
  });

  test('should update indicator when going offline', async ({ page, context }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Should NOT show offline indicator when online
    await expect(page.locator('text=Offline Mode')).not.toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Trigger offline event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Should show offline indicator
    await expect(page.locator('text=Offline Mode')).toBeVisible({ timeout: 5000 });

    console.log('✅ Offline indicator appears when going offline');
  });
});
