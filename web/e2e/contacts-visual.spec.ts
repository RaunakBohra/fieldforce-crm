import { test, expect } from '@playwright/test';

/**
 * Visual testing for Contacts Module
 * Opens pages in headed mode for manual inspection
 * No backend required - just UI verification
 */

test.describe('Contacts Module - Visual Testing', () => {
  test('open contacts form - shows all pages for visual inspection', async ({ page }) => {
    // Set a longer timeout for manual testing
    test.setTimeout(300000); // 5 minutes

    console.log('\n🔍 Opening Contacts Module Pages for Visual Inspection...\n');

    // 1. Open Login Page
    console.log('1. Opening Login Page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(3000);

    // 2. Open Signup Page
    console.log('2. Opening Signup Page...');
    await page.goto('http://localhost:5173/signup');
    await page.waitForTimeout(3000);

    // 3. Open Dashboard (will redirect to login if not authenticated, that's okay)
    console.log('3. Attempting Dashboard...');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(3000);

    // 4. Open Contacts List
    console.log('4. Opening Contacts List Page...');
    await page.goto('http://localhost:5173/contacts');
    await page.waitForTimeout(5000);

    // Check if we can see the page structure (even without auth)
    const heading = await page.locator('h1').first();
    const headingText = await heading.textContent();
    console.log(`   Found heading: "${headingText}"`);

    // 5. Open Create Contact Form - Medical (default)
    console.log('5. Opening Create Contact Form (Medical)...');
    await page.goto('http://localhost:5173/contacts/new');
    await page.waitForTimeout(5000);

    // Check for category radio buttons
    const medicalRadio = page.locator('input[value="MEDICAL"]');
    const distributionRadio = page.locator('input[value="DISTRIBUTION"]');

    if (await medicalRadio.isVisible()) {
      console.log('   ✓ Medical category radio found');
      console.log('   ✓ Medical category is default (should be checked)');

      // Wait to see Medical fields
      await page.waitForTimeout(3000);

      // 6. Switch to Distribution category
      console.log('6. Switching to Distribution category...');
      await distributionRadio.click();
      await page.waitForTimeout(5000);

      console.log('   ✓ Distribution fields should now be visible');
      console.log('   ✓ Check for: Territory, Credit Limit, Payment Terms');

      // Wait to see Distribution fields
      await page.waitForTimeout(3000);

      // 7. Switch back to Medical
      console.log('7. Switching back to Medical category...');
      await medicalRadio.click();
      await page.waitForTimeout(5000);

      console.log('   ✓ Medical fields should now be visible');
      console.log('   ✓ Check for: Specialty, Hospital Name, Clinic Name, License Number');
    }

    // 8. Test form filling - Medical Contact
    console.log('8. Filling Medical Contact Form (Dr. Test)...');

    await page.fill('input[type="text"]', 'Dr. Test Smith');
    await page.waitForTimeout(1000);

    const phoneInput = page.locator('input[placeholder*="10-digit"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('9876543210');
      await page.waitForTimeout(1000);
    }

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.waitForTimeout(1000);
    }

    console.log('   ✓ Form populated with test data');
    await page.waitForTimeout(3000);

    // 9. Switch to Distribution and fill
    console.log('9. Switching to Distribution and filling form (ABC Supplies)...');
    await distributionRadio.click();
    await page.waitForTimeout(2000);

    // Clear and fill name
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.clear();
    await nameInput.fill('ABC Medical Supplies');
    await page.waitForTimeout(1000);

    // Select Wholesaler
    const contactTypeSelect = page.locator('select').nth(1);
    await contactTypeSelect.selectOption({ label: 'Wholesaler' });
    await page.waitForTimeout(1000);

    console.log('   ✓ Distribution form populated');
    await page.waitForTimeout(3000);

    // 10. Final inspection
    console.log('\n✅ Visual inspection complete!');
    console.log('\nVerify the following:');
    console.log('  □ Login page displays correctly');
    console.log('  □ Signup page displays correctly');
    console.log('  □ Contacts list page loads (may redirect to login)');
    console.log('  □ Contact form has Medical/Distribution radio buttons');
    console.log('  □ Medical fields show: Specialty, Hospital Name, Clinic Name, License Number');
    console.log('  □ Distribution fields show: Territory, Credit Limit, Payment Terms');
    console.log('  □ Form switches dynamically between categories');
    console.log('  □ Contact types change based on category');
    console.log('  □ Neutral Corporate theme colors are applied');
    console.log('  □ Navigation works (Dashboard, Contacts buttons)');
    console.log('\nKeeping browser open for 30 more seconds for inspection...\n');

    await page.waitForTimeout(30000);
  });
});
