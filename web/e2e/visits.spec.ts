import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8787';

test.describe('Visits Management', () => {
  let authToken: string;
  let contactId: string;
  let visitId: string;

  test.beforeAll(async ({ request }) => {
    // Create test user
    const timestamp = Date.now();
    const signupResponse = await request.post(`${API_URL}/api/auth/signup`, {
      data: {
        email: `test-visits-${timestamp}@example.com`,
        password: 'Test123!@#',
        name: 'Visit Tester',
        phone: '9876543210'
      }
    });

    const signupData = await signupResponse.json();
    authToken = signupData.data.token;

    // Create a test contact
    const contactResponse = await request.post(`${API_URL}/api/contacts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        contactCategory: 'MEDICAL',
        name: 'Dr. Test Contact',
        contactType: 'Doctor',
        designation: 'Cardiologist',
        phone: '9876543211',
        email: 'doctor@hospital.com',
        city: 'Mumbai',
        hospitalName: 'Test Hospital',
        isActive: true
      }
    });

    const contactData = await contactResponse.json();
    contactId = contactData.data.id;
  });

  test('should create a new visit', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', `test-visits-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');

    // Navigate to visits
    await page.goto(`${BASE_URL}/visits`);
    await page.waitForLoadState('networkidle');

    // Click "New Visit" button
    await page.click('text=New Visit');
    await page.waitForURL('**/visits/new');

    // Fill visit form
    await page.selectOption('select', contactId);
    await page.selectOption('text=Visit Type', 'FIELD_VISIT');
    await page.selectOption('text=Status', 'COMPLETED');
    await page.selectOption('text=Outcome', 'SUCCESSFUL');
    await page.fill('input[placeholder*="Purpose"]', 'Product demonstration');
    await page.fill('textarea[placeholder*="notes"]', 'Discussed new cardiology products');
    await page.fill('input[placeholder*="Product"]', 'Aspirin, Statin');
    await page.fill('input[type="number"]', '45'); // Duration

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to visits list
    await page.waitForURL('**/visits');

    // Verify visit appears in list
    await expect(page.locator('text=Product demonstration')).toBeVisible();
  });

  test('should display visits list', async ({ page }) => {
    await page.goto(`${BASE_URL}/visits`);
    await page.waitForLoadState('networkidle');

    // Check for key elements
    await expect(page.locator('h1:has-text("Visits")')).toBeVisible();
    await expect(page.locator('text=New Visit')).toBeVisible();
  });

  test('should filter visits by status', async ({ page }) => {
    await page.goto(`${BASE_URL}/visits`);
    await page.waitForLoadState('networkidle');

    // Select filter
    const statusFilter = page.locator('select').first();
    await statusFilter.selectOption('COMPLETED');

    await page.waitForTimeout(1000);

    // Verify filtered results
    const visitCards = page.locator('[data-testid="visit-card"]');
    const count = await visitCards.count();

    if (count > 0) {
      // All visible visits should have COMPLETED status
      for (let i = 0; i < count; i++) {
        await expect(visitCards.nth(i).locator('text=COMPLETED')).toBeVisible();
      }
    }
  });

  test('should view visit details', async ({ request, page }) => {
    // Create a visit via API
    const visitResponse = await request.post(`${API_URL}/api/visits`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        contactId,
        visitDate: new Date().toISOString(),
        visitType: 'FIELD_VISIT',
        status: 'COMPLETED',
        purpose: 'Test visit for details',
        notes: 'This is a test visit',
        outcome: 'SUCCESSFUL',
        duration: 30,
        products: ['Product A', 'Product B']
      }
    });

    const visitData = await visitResponse.json();
    const testVisitId = visitData.data.id;

    // Navigate to visit details
    await page.goto(`${BASE_URL}/visits/${testVisitId}`);
    await page.waitForLoadState('networkidle');

    // Verify details are displayed
    await expect(page.locator('text=Visit Details')).toBeVisible();
    await expect(page.locator('text=Test visit for details')).toBeVisible();
    await expect(page.locator('text=This is a test visit')).toBeVisible();
    await expect(page.locator('text=Product A')).toBeVisible();
    await expect(page.locator('text=Product B')).toBeVisible();
    await expect(page.locator('text=30 minutes')).toBeVisible();
  });

  test('should edit a visit', async ({ request, page }) => {
    // Create a visit via API
    const visitResponse = await request.post(`${API_URL}/api/visits`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        contactId,
        visitDate: new Date().toISOString(),
        visitType: 'FIELD_VISIT',
        status: 'COMPLETED',
        purpose: 'Original purpose',
        outcome: 'SUCCESSFUL'
      }
    });

    const visitData = await visitResponse.json();
    const testVisitId = visitData.data.id;

    // Navigate to edit page
    await page.goto(`${BASE_URL}/visits/${testVisitId}/edit`);
    await page.waitForLoadState('networkidle');

    // Edit the purpose
    await page.fill('input[placeholder*="Purpose"]', 'Updated purpose');
    await page.fill('input[type="number"]', '60'); // Update duration

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForURL('**/visits');

    // Verify update
    await expect(page.locator('text=Updated purpose')).toBeVisible();
  });

  test('should delete a visit', async ({ request, page }) => {
    // Create a visit via API
    const visitResponse = await request.post(`${API_URL}/api/visits`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        contactId,
        visitDate: new Date().toISOString(),
        visitType: 'FIELD_VISIT',
        status: 'COMPLETED',
        purpose: 'Visit to delete',
        outcome: 'SUCCESSFUL'
      }
    });

    const visitData = await visitResponse.json();
    const testVisitId = visitData.data.id;

    // Navigate to visit details
    await page.goto(`${BASE_URL}/visits/${testVisitId}`);
    await page.waitForLoadState('networkidle');

    // Setup dialog handler before clicking delete
    page.on('dialog', dialog => dialog.accept());

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Should redirect to visits list
    await page.waitForURL('**/visits');

    // Verify visit no longer appears
    await expect(page.locator('text=Visit to delete')).not.toBeVisible();
  });

  test('should capture GPS location', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 19.0760, longitude: 72.8777 }); // Mumbai

    await page.goto(`${BASE_URL}/visits/new`);
    await page.waitForLoadState('networkidle');

    // Click capture location button
    await page.click('button:has-text("Capture Location")');

    // Wait for location to be captured
    await page.waitForTimeout(1000);

    // Verify coordinates are displayed
    await expect(page.locator('text=/19.0760.*72.8777/')).toBeVisible();
  });

  test('should handle follow-up visits', async ({ page }) => {
    await page.goto(`${BASE_URL}/visits/new`);
    await page.waitForLoadState('networkidle');

    // Fill basic info
    await page.selectOption('select', contactId);
    await page.selectOption('text=Outcome', 'FOLLOW_UP_NEEDED');

    // Enable follow-up
    await page.check('input[type="checkbox"]#followUpRequired');

    // Fill follow-up details
    const nextVisitDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
    const dateStr = nextVisitDate.toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"]', dateStr);
    await page.fill('textarea[placeholder*="Follow-up"]', 'Need to discuss pricing');

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForURL('**/visits');

    // Verify follow-up indicator appears
    await expect(page.locator('text=Follow-up Required')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/visits/new`);
    await page.waitForLoadState('networkidle');

    // Try to submit without selecting contact
    await page.click('button[type="submit"]');

    // Form should not submit (still on same page)
    await expect(page).toHaveURL('**/visits/new');
  });

  test('should search visits', async ({ page }) => {
    await page.goto(`${BASE_URL}/visits`);
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('Product demonstration');
      await page.waitForTimeout(1000);

      // Verify filtered results
      await expect(page.locator('text=Product demonstration')).toBeVisible();
    }
  });
});
