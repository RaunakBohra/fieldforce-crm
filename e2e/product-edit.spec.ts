import { test, expect } from '@playwright/test';

test.describe('Product Edit Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5174/login');
    await page.fill('input[type="email"]', 'prodtest@example.com');
    await page.fill('input[type="password"]', 'Test123456!');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should load product edit form with populated fields', async ({ page }) => {
    // Navigate to products list
    await page.goto('http://localhost:5174/products');

    // Wait for products to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click first Edit button
    const firstEditButton = page.locator('button:has-text("Edit")').first();
    await firstEditButton.click();

    // Wait for navigation to edit page
    await expect(page).toHaveURL(/\/products\/.*\/edit/);

    // Check page title
    await expect(page.locator('h1')).toContainText('Edit Product');

    // Verify form fields are populated (not empty)
    const nameInput = page.locator('input[value]').filter({ has: page.locator('[type="text"]') }).first();
    await expect(nameInput).not.toHaveValue('');

    // Check SKU field is populated
    const skuInput = page.locator('label:has-text("SKU")').locator('..').locator('input').first();
    const skuValue = await skuInput.inputValue();
    expect(skuValue.length).toBeGreaterThan(0);
    console.log('SKU field populated:', skuValue);

    // Check Category is selected
    const categorySelect = page.locator('select').first();
    const categoryValue = await categorySelect.inputValue();
    expect(categoryValue).not.toBe('');
    console.log('Category selected:', categoryValue);

    // Check Price is populated
    const priceInput = page.locator('label:has-text("Price")').locator('..').locator('input');
    const priceValue = await priceInput.inputValue();
    expect(parseFloat(priceValue)).toBeGreaterThan(0);
    console.log('Price populated:', priceValue);
  });

  test('should update product successfully', async ({ page }) => {
    // Navigate to products list
    await page.goto('http://localhost:5174/products');
    await page.waitForSelector('table tbody tr');

    // Click first Edit button
    await page.locator('button:has-text("Edit")').first().click();
    await expect(page).toHaveURL(/\/products\/.*\/edit/);

    // Get original product name
    const nameInput = page.locator('label:has-text("Product Name")').locator('..').locator('input');
    const originalName = await nameInput.inputValue();

    // Update product name
    const timestamp = Date.now();
    const newName = `${originalName} - Updated ${timestamp}`;
    await nameInput.fill(newName);

    // Update description
    const descInput = page.locator('label:has-text("Description")').locator('..').locator('textarea, input');
    await descInput.fill(`Test update at ${new Date().toISOString()}`);

    // Update price
    const priceInput = page.locator('label:has-text("Price")').locator('..').locator('input');
    await priceInput.fill('999.99');

    // Submit form
    await page.click('button:has-text("Save Product")');

    // Should navigate back to products list
    await expect(page).toHaveURL(/\/products$/);

    // Verify product appears in list with updated name
    await page.waitForSelector('table tbody tr');
    const updatedProduct = page.locator(`td:has-text("${newName}")`);
    await expect(updatedProduct).toBeVisible({ timeout: 5000 });

    console.log('✓ Product updated successfully:', newName);
  });

  test('should display existing product image', async ({ page }) => {
    // Navigate to products list
    await page.goto('http://localhost:5174/products');
    await page.waitForSelector('table tbody tr');

    // Find a product with an image (check if thumbnail exists in table)
    const productWithImage = page.locator('table tbody tr').filter({
      has: page.locator('img')
    }).first();

    if (await productWithImage.count() > 0) {
      // Click edit on product with image
      await productWithImage.locator('button:has-text("Edit")').click();
      await expect(page).toHaveURL(/\/products\/.*\/edit/);

      // Check if image preview is displayed
      const imagePreview = page.locator('img[alt]').first();
      if (await imagePreview.count() > 0) {
        await expect(imagePreview).toBeVisible();
        console.log('✓ Product image loaded in edit form');
      }
    } else {
      console.log('⚠ No products with images found to test');
    }
  });

  test('should validate required fields on submit', async ({ page }) => {
    // Navigate to products list
    await page.goto('http://localhost:5174/products');
    await page.waitForSelector('table tbody tr');

    // Click first Edit button
    await page.locator('button:has-text("Edit")').first().click();
    await expect(page).toHaveURL(/\/products\/.*\/edit/);

    // Clear required field (name)
    const nameInput = page.locator('label:has-text("Product Name")').locator('..').locator('input');
    await nameInput.fill('');

    // Try to submit
    await page.click('button:has-text("Save Product")');

    // Should show validation error (HTML5 validation or custom error)
    // Page should NOT navigate (still on edit page)
    await expect(page).toHaveURL(/\/products\/.*\/edit/);

    console.log('✓ Validation prevents empty required fields');
  });

  test('should cancel edit and return to list', async ({ page }) => {
    // Navigate to products list
    await page.goto('http://localhost:5174/products');
    await page.waitForSelector('table tbody tr');

    // Click first Edit button
    await page.locator('button:has-text("Edit")').first().click();
    await expect(page).toHaveURL(/\/products\/.*\/edit/);

    // Click Back button
    await page.click('button:has-text("Back to Products")');

    // Should return to products list
    await expect(page).toHaveURL(/\/products$/);

    console.log('✓ Cancel button returns to products list');
  });
});
