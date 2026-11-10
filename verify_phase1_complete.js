const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('--- 1. Pre-seeding Auth & Dark Theme ---');
  await page.goto('http://localhost:5173/login');
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'test-admin-token');
    localStorage.setItem('token', 'test-admin-token');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('user', JSON.stringify({
      id: 'admin-01',
      name: 'Huzeif (Admin)',
      role: 'Admin'
    }));
  });

  console.log('--- 2. Navigating to Floor Plans ---');
  await page.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Test 3: Test Host Stand / Waitlist Seating (Image 2 Fix Verification)
  console.log('--- 3. Testing Host Stand / Waitlist Seating ---');
  const waitlistBtn = page.locator('button:has-text("Waitlist")');
  if (await waitlistBtn.count() > 0) {
    await waitlistBtn.first().click();
    await page.waitForTimeout(1000);

    const seatBtn = page.locator('div.fixed.z-50 button:has-text("Seat")');
    if (await seatBtn.count() > 0) {
      console.log('Clicking Modal Seat button...');
      await seatBtn.first().click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase1_seat_waitlist_fixed.png') });
    console.log('Saved phase1_seat_waitlist_fixed.png');

    // Close waitlist modal
    const closeBtn = page.locator('div.fixed.z-50 button:has-text("Close")');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click();
      await page.waitForTimeout(500);
    }
  }

  // Test 4: Recipe Depletion & BOM Cards (Image 1 Fix Verification)
  console.log('--- 4. Testing Recipe Depletion & BOM Cards ---');
  await page.goto('http://localhost:5173/home', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const homeRecBtn = page.locator('button:has-text("Live Recipe")');
  if (await homeRecBtn.count() > 0) {
    await homeRecBtn.first().click();
    await page.waitForTimeout(1200);

    // Click Fire Butter Chicken
    const fireBtn = page.locator('button:has-text("Fire Butter Chicken")');
    if (await fireBtn.count() > 0) {
      console.log('Clicking Fire Butter Chicken...');
      await fireBtn.first().click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase1_recipe_bom_verified.png') });
    console.log('Saved phase1_recipe_bom_verified.png');
  }

  await browser.close();
  console.log('--- Phase 1 Waitlist & Recipe Verifications Finished! ---');
})();
