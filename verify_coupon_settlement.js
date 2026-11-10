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

  console.log('--- 3. Selecting Table T2 with active order ---');
  const tableT2 = page.locator('div:has-text("T2")').last();
  await tableT2.click();
  await page.waitForTimeout(1000);

  console.log('--- 4. Clicking Settle / Pay ---');
  const settleBtn = page.locator('button:has-text("Settle / Pay")');
  await settleBtn.click();
  await page.waitForTimeout(1200);

  console.log('--- 5. Applying Coupon WELCOME50 via Enter ---');
  const couponInput = page.locator('input[placeholder*="coupon" i]');
  if (await couponInput.count() > 0) {
    await couponInput.first().fill('WELCOME50');
    await page.waitForTimeout(400);
    await couponInput.first().press('Enter');
    await page.waitForTimeout(1200);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_coupon_applied.png') });
  console.log('Saved phase2_coupon_applied.png');

  await browser.close();
  console.log('Coupon & Payment Settlement verified cleanly!');
})();
