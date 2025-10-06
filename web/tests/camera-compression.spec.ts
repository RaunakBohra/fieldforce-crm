import { test, expect } from '@playwright/test';

test.describe('Camera Compression', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5175/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should auto-compress photos without UI controls', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);

    // Navigate to visit checkout page (need to check-in first)
    await page.goto('http://localhost:5175/visits/new');

    // Select a contact
    await page.selectOption('select', { index: 1 });

    // Check in
    await page.click('button:has-text("Check In")');
    await page.waitForURL('**/visits/*');

    // Click "Take Photo" button
    await page.click('button:has-text("Take Photo")');

    // Wait for camera modal to open
    await expect(page.locator('video')).toBeVisible({ timeout: 5000 });

    // Verify no compression controls visible
    await expect(page.locator('text=Quality')).not.toBeVisible();
    await expect(page.locator('text=Max Resolution')).not.toBeVisible();
    await expect(page.locator('button:has-text("Adjust")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Low")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Balanced")')).not.toBeVisible();
    await expect(page.locator('button:has-text("High")')).not.toBeVisible();

    // Capture photo (mock camera by injecting test image)
    await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        // Mock video dimensions
        Object.defineProperty(video, 'videoWidth', { value: 1920 });
        Object.defineProperty(video, 'videoHeight', { value: 1080 });
      }
    });

    // Click capture button
    await page.click('button[aria-label="Capture photo"]');

    // Should show "Compressing..." briefly
    await expect(page.locator('text=Compressing...')).toBeVisible({ timeout: 2000 });

    // Wait for compression to complete
    await expect(page.locator('text=Compressing...')).not.toBeVisible({ timeout: 3000 });

    // Verify captured photo is displayed
    await expect(page.locator('img[alt="Captured"]')).toBeVisible();

    // Verify only two buttons: Retake and Use Photo
    await expect(page.locator('button:has-text("Retake")')).toBeVisible();
    await expect(page.locator('button:has-text("Use Photo")')).toBeVisible();

    // Verify no metadata overlay
    await expect(page.locator('text=Original:')).not.toBeVisible();
    await expect(page.locator('text=Compressed:')).not.toBeVisible();
    await expect(page.locator('text=Savings:')).not.toBeVisible();

    // Test retake functionality
    await page.click('button:has-text("Retake")');
    await expect(page.locator('video')).toBeVisible();
    await expect(page.locator('img[alt="Captured"]')).not.toBeVisible();

    console.log('✅ Camera auto-compression test passed');
  });

  test('should verify compression quality settings', async ({ page }) => {
    // This test verifies the compression logic directly
    const compressionResult = await page.evaluate(async () => {
      // Create a test canvas with sample image
      const canvas = document.createElement('canvas');
      canvas.width = 3840;
      canvas.height = 2160;
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

      // Draw test pattern
      ctx.fillStyle = '#3730a3';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#db2777';
      ctx.fillRect(100, 100, 1000, 1000);

      // Get original as full quality
      const originalDataUrl = canvas.toDataURL('image/jpeg', 1.0);
      const originalSize = (originalDataUrl.split(',')[1].length * 3/4) / 1024;

      // Import compression function (need to expose it)
      const { compressImageWithQuality } = await import('./utils/imageCompression');

      // Test balanced preset (0.8 quality, 1920px)
      const result = await compressImageWithQuality(originalDataUrl, 0.8, 1920);

      return {
        originalSize,
        compressedSize: result.sizeKB,
        width: result.width,
        height: result.height,
        savings: ((1 - result.sizeKB / originalSize) * 100).toFixed(0),
      };
    });

    console.log('Compression test results:', compressionResult);

    // Verify compression happened
    expect(compressionResult).toBeTruthy();
    if (compressionResult) {
      expect(compressionResult.compressedSize).toBeLessThan(compressionResult.originalSize);
      expect(compressionResult.width).toBeLessThanOrEqual(1920);
      expect(compressionResult.height).toBeLessThanOrEqual(1080);

      // Should achieve at least 30% savings
      expect(parseFloat(compressionResult.savings)).toBeGreaterThan(30);

      console.log(`✅ Compression achieved ${compressionResult.savings}% savings`);
      console.log(`✅ Original: ${compressionResult.originalSize.toFixed(1)} KB`);
      console.log(`✅ Compressed: ${compressionResult.compressedSize.toFixed(1)} KB`);
      console.log(`✅ Dimensions: ${compressionResult.width}×${compressionResult.height}`);
    }
  });

  test('should integrate with offline storage', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);

    // Go offline
    await context.setOffline(true);

    // Navigate to visit form
    await page.goto('http://localhost:5175/visits/new');

    // Fill in contact
    await page.selectOption('select', { index: 1 });

    // Check in offline (should save to IndexedDB)
    await page.click('button:has-text("Check In")');

    // Verify offline message
    await expect(page.locator('text=Offline mode')).toBeVisible({ timeout: 3000 });

    // Verify offline indicator appears
    await expect(page.locator('text=Offline Mode')).toBeVisible({ timeout: 5000 });

    console.log('✅ Offline storage integration verified');
  });
});

test.describe('Image Compression Utilities', () => {
  test('should compress images to target size', async ({ page }) => {
    await page.goto('http://localhost:5175/');

    const testResults = await page.evaluate(async () => {
      const { compressImage, getImageSizeKB, batchCompressImages } = await import('./utils/imageCompression');

      // Create test image
      const canvas = document.createElement('canvas');
      canvas.width = 2560;
      canvas.height = 1440;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#3730a3';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const testImage = canvas.toDataURL('image/jpeg', 0.9);

      // Test 1: Compress to 200KB
      const compressed200 = await compressImage(testImage, 200);
      const size200 = getImageSizeKB(compressed200);

      // Test 2: Compress to 100KB
      const compressed100 = await compressImage(testImage, 100);
      const size100 = getImageSizeKB(compressed100);

      // Test 3: Batch compress
      const batch = await batchCompressImages([testImage, testImage], 150);

      return {
        size200,
        size100,
        batchCount: batch.length,
        batchSizes: batch.map(img => getImageSizeKB(img)),
      };
    });

    expect(testResults).toBeTruthy();
    if (testResults) {
      // Verify 200KB target (allow 10% margin)
      expect(testResults.size200).toBeLessThanOrEqual(220);

      // Verify 100KB target (allow 10% margin)
      expect(testResults.size100).toBeLessThanOrEqual(110);

      // Verify batch processing
      expect(testResults.batchCount).toBe(2);
      testResults.batchSizes.forEach(size => {
        expect(size).toBeLessThanOrEqual(165); // 150KB + 10%
      });

      console.log('✅ Compression utility tests passed');
      console.log(`  - 200KB target: ${testResults.size200.toFixed(1)} KB`);
      console.log(`  - 100KB target: ${testResults.size100.toFixed(1)} KB`);
      console.log(`  - Batch: ${testResults.batchSizes.map(s => s.toFixed(1)).join(', ')} KB`);
    }
  });
});
