import { test, expect } from '@playwright/test';

test('check for module export errors', async ({ page }) => {
  const errors: string[] = [];

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ Page Error: ${error.message}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });

  console.log('\n🔍 Checking for module export errors...\n');

  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(3000);

  const contactStatsErrors = errors.filter(e => e.includes('ContactStats'));

  if (contactStatsErrors.length > 0) {
    console.log(`\n❌ FAILED: ContactStats export errors found:`);
    contactStatsErrors.forEach(e => console.log(`   - ${e}`));
    throw new Error('ContactStats export errors still present');
  } else {
    console.log(`\n✅ SUCCESS: No ContactStats export errors found!`);
    console.log(`   Total errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log(`   Other errors:`);
      errors.forEach(e => console.log(`   - ${e}`));
    }
  }
});
