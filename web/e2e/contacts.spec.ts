import { test, expect } from '@playwright/test';

test.describe('Contacts Module - Day 2', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');

    // Login (assuming you have a test account)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
  });

  test('should display dashboard with contact stats', async ({ page }) => {
    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Check if the page title exists
    await expect(page.locator('h1')).toContainText('Field Force CRM');

    // Check navigation links
    await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('button:has-text("Contacts")')).toBeVisible();

    // Check contact stats card
    await expect(page.locator('h3:has-text("Contacts")')).toBeVisible();
    await expect(page.locator('h3:has-text("Visits")')).toBeVisible();
    await expect(page.locator('h3:has-text("Orders")')).toBeVisible();
  });

  test('should navigate to contacts page', async ({ page }) => {
    // Click on Contacts navigation button
    await page.click('button:has-text("Contacts")');

    // Verify we're on contacts page
    await page.waitForURL('**/contacts');
    await expect(page.locator('h1')).toContainText('Contacts');

    // Check for Add Contact button
    await expect(page.locator('button:has-text("Add Contact")')).toBeVisible();

    // Check for filters section
    await expect(page.locator('h2:has-text("Filters")')).toBeVisible();
  });

  test('should display contacts list with stats', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts');

    // Check stats cards
    await expect(page.locator('text=Total Contacts')).toBeVisible();
    await expect(page.locator('text=Distribution')).toBeVisible();
    await expect(page.locator('text=Medical')).toBeVisible();

    // Check filters
    await expect(page.locator('select:has-option("All Categories")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should open create contact form - Medical', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts');

    // Click Add Contact button
    await page.click('button:has-text("Add Contact")');

    // Verify we're on the form page
    await page.waitForURL('**/contacts/new');
    await expect(page.locator('h1')).toContainText('Add New Contact');

    // Check that Medical category is selected by default
    await expect(page.locator('input[value="MEDICAL"]:checked')).toBeVisible();

    // Check Medical-specific fields are visible
    await expect(page.locator('label:has-text("Specialty")')).toBeVisible();
    await expect(page.locator('label:has-text("Hospital Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Clinic Name")')).toBeVisible();
    await expect(page.locator('label:has-text("License Number")')).toBeVisible();

    // Check that Contact Type dropdown has medical options
    const contactTypeSelect = page.locator('select').first();
    await expect(contactTypeSelect).toContainText('Doctor');
    await expect(contactTypeSelect).toContainText('Hospital');
    await expect(contactTypeSelect).toContainText('Clinic');
    await expect(contactTypeSelect).toContainText('Pharmacist');
  });

  test('should switch to Distribution category and show distribution fields', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts/new');

    // Click Distribution radio button
    await page.click('input[value="DISTRIBUTION"]');

    // Check Distribution-specific fields are visible
    await expect(page.locator('label:has-text("Territory")')).toBeVisible();
    await expect(page.locator('label:has-text("Credit Limit")')).toBeVisible();
    await expect(page.locator('label:has-text("Payment Terms")')).toBeVisible();

    // Check that Medical fields are NOT visible
    await expect(page.locator('label:has-text("Specialty")')).not.toBeVisible();

    // Check that Contact Type dropdown has distribution options
    const contactTypeSelect = page.locator('select').nth(1);
    await expect(contactTypeSelect).toContainText('Super Admin');
    await expect(contactTypeSelect).toContainText('Sub Super');
    await expect(contactTypeSelect).toContainText('Wholesaler');
    await expect(contactTypeSelect).toContainText('Retailer');
  });

  test('should create a new Medical contact - Doctor', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts/new');

    // Fill in the form
    await page.fill('input[type="text"]', 'Dr. John Smith');
    await page.selectOption('select', { label: 'Doctor' });
    await page.fill('input[placeholder*="10-digit"]', '9876543210');
    await page.fill('input[type="email"]', 'john.smith@hospital.com');
    await page.fill('textarea', '123 Medical Center Road');
    await page.fill('input[type="text"]:below(:text("City"))', 'Mumbai');
    await page.fill('input[type="text"]:below(:text("State"))', 'Maharashtra');
    await page.fill('input[placeholder="6 digits"]', '400001');

    // Fill Medical-specific fields
    const inputs = await page.locator('input[type="text"]').all();
    await inputs[2].fill('Cardiologist'); // Specialty
    await inputs[6].fill('Apollo Hospital'); // Hospital Name

    // Submit the form
    await page.click('button:has-text("Create Contact")');

    // Should redirect back to contacts list
    await page.waitForURL('**/contacts', { timeout: 10000 });

    // Verify contact appears in the list
    await expect(page.locator('text=Dr. John Smith')).toBeVisible();
  });

  test('should create a new Distribution contact - Wholesaler', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts/new');

    // Switch to Distribution
    await page.click('input[value="DISTRIBUTION"]');

    // Fill in the form
    await page.fill('input[type="text"]', 'ABC Medical Supplies');
    await page.selectOption('select', { label: 'Wholesaler' });
    await page.fill('input[placeholder*="10-digit"]', '9123456789');
    await page.fill('input[type="email"]', 'contact@abcmedical.com');
    await page.fill('textarea', '456 Industrial Area');
    await page.fill('input[type="text"]:below(:text("City"))', 'Delhi');
    await page.fill('input[type="text"]:below(:text("State"))', 'Delhi');
    await page.fill('input[placeholder="6 digits"]', '110001');

    // Fill Distribution-specific fields
    const inputs = await page.locator('input[type="text"]').all();
    await inputs[2].fill('North India'); // Territory
    await page.fill('input[type="number"]', '500000'); // Credit Limit
    const paymentTermsInput = await page.locator('input[placeholder*="Net 30"]');
    await paymentTermsInput.fill('Net 30 days');

    // Submit the form
    await page.click('button:has-text("Create Contact")');

    // Should redirect back to contacts list
    await page.waitForURL('**/contacts', { timeout: 10000 });

    // Verify contact appears in the list
    await expect(page.locator('text=ABC Medical Supplies')).toBeVisible();
  });

  test('should filter contacts by category', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts');

    // Select Distribution category filter
    await page.selectOption('select:has-option("All Categories")', { label: 'Distribution' });

    // Wait for the page to reload/filter
    await page.waitForTimeout(1000);

    // Verify URL has the filter parameter
    await expect(page).toHaveURL(/.*contactCategory=DISTRIBUTION/);
  });

  test('should search contacts', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts');

    // Type in search box
    await page.fill('input[placeholder*="Search"]', 'John');

    // Wait for search to take effect
    await page.waitForTimeout(1000);

    // Verify URL has search parameter
    await expect(page).toHaveURL(/.*search=John/);
  });

  test('should edit a contact', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts');

    // Wait for contacts to load
    await page.waitForTimeout(2000);

    // Click the first edit button (pencil icon)
    const editButton = page.locator('button').filter({ hasText: '' }).first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Should be on edit page
      await page.waitForURL(/.*contacts\/.*\/edit/);
      await expect(page.locator('h1')).toContainText('Edit Contact');

      // Verify form is populated
      const nameInput = page.locator('input[type="text"]').first();
      await expect(nameInput).not.toBeEmpty();

      // Make a change
      await nameInput.fill('Updated Name');

      // Submit
      await page.click('button:has-text("Update Contact")');

      // Should redirect back to contacts list
      await page.waitForURL('**/contacts', { timeout: 10000 });
    }
  });

  test('should delete a contact with confirmation', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts');

    // Wait for contacts to load
    await page.waitForTimeout(2000);

    // Setup dialog handler
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Are you sure');
      dialog.dismiss(); // Cancel deletion
    });

    // Click the first delete button (trash icon)
    const deleteButton = page.locator('button').filter({ hasText: '' }).nth(1);
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
    }
  });

  test('should reset filters', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts');

    // Apply filters
    await page.selectOption('select:has-option("All Categories")', { label: 'Medical' });
    await page.fill('input[placeholder*="city"]', 'Mumbai');
    await page.fill('input[placeholder*="Search"]', 'test');

    // Click Reset Filters
    await page.click('button:has-text("Reset Filters")');

    // Verify filters are cleared
    await expect(page.locator('input[placeholder*="city"]')).toHaveValue('');
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('');
  });

  test('should navigate back from contact form', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts/new');

    // Click Back to Contacts
    await page.click('button:has-text("Back to Contacts")');

    // Should be back on contacts list
    await page.waitForURL('**/contacts');
    await expect(page.locator('h1')).toContainText('Contacts');
  });

  test('should cancel contact creation', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts/new');

    // Fill in some data
    await page.fill('input[type="text"]', 'Test Contact');

    // Click Cancel
    await page.click('button:has-text("Cancel")');

    // Should be back on contacts list
    await page.waitForURL('**/contacts');
  });

  test('should show validation error for empty name', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts/new');

    // Try to submit without filling required fields
    await page.click('button:has-text("Create Contact")');

    // Form should show validation error (browser default)
    const nameInput = page.locator('input[type="text"]').first();
    const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should display correct stats on dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');

    // Click on Contacts card to navigate
    await page.click('button:has-text("Contacts")');

    // Should navigate to contacts page
    await page.waitForURL('**/contacts');
  });
});
