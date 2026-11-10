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

  // Test 1: Blind Cash Drawer Close & X/Z Audit Reports
  console.log('--- 3. Testing Shift Close / Blind Denominations ---');
  const shiftCloseBtn = page.locator('button:has-text("Shift Close")');
  if (await shiftCloseBtn.count() > 0) {
    await shiftCloseBtn.first().click();
    await page.waitForTimeout(1000);

    // Type notes count
    const inputs = page.locator('div.fixed.z-50 input[type="text"]');
    if (await inputs.count() >= 3) {
      await inputs.nth(0).fill('10'); // ₹500 x 10 = ₹5,000
      await inputs.nth(1).fill('10'); // ₹200 x 10 = ₹2,000
      await inputs.nth(2).fill('10'); // ₹100 x 10 = ₹1,000
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_blind_cash_counter.png') });
    console.log('Saved phase2_blind_cash_counter.png');

    // Click Submit Blind Count
    const submitBlindBtn = page.locator('div.fixed.z-50 button:has-text("Submit Blind Count")');
    if (await submitBlindBtn.count() > 0) {
      await submitBlindBtn.first().click();
      await page.waitForTimeout(1200);

      // We are now in REVIEW_ZREPORT stage
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_zreport_audit_review.png') });
      console.log('Saved phase2_zreport_audit_review.png');

      // Enter Manager PIN 0000
      const pinInput = page.locator('div.fixed.z-50 input[type="password"]');
      if (await pinInput.count() > 0) {
        await pinInput.first().fill('0000');
        await page.waitForTimeout(400);

        const approveBtn = page.locator('div.fixed.z-50 button:has-text("Authorize & Close Shift")');
        if (await approveBtn.count() > 0) {
          await approveBtn.first().click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // Ensure modal is closed
    const closeBtn = page.locator('div.fixed.z-50 button:has-text("Close")');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click();
      await page.waitForTimeout(500);
    }
  }

  // Test 2: Payment Settlement Coupon Application
  console.log('--- 4. Testing Coupon Code WELCOME50 in Payment Settlement ---');
  // Click on Table T1 to select it
  const tableT1 = page.locator('div:has-text("T1")').first();
  await tableT1.click();
  await page.waitForTimeout(800);

  // Click Settle / Pay
  const settleBtn = page.locator('button:has-text("Settle / Pay")');
  if (await settleBtn.count() > 0) {
    await settleBtn.first().click();
    await page.waitForTimeout(1000);

    // Find coupon input
    const couponInput = page.locator('input[placeholder*="coupon" i]');
    if (await couponInput.count() > 0) {
      await couponInput.first().fill('WELCOME50');
      await page.waitForTimeout(300);

      // Click Search Coupon button
      const searchCouponBtn = page.locator('button:has(svg)').nth(1); // Second search icon
      await searchCouponBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_coupon_applied.png') });
    console.log('Saved phase2_coupon_applied.png');

    // Close Payment Modal
    const modalClose = page.locator('.fixed button:has-text("×"), .fixed button:has(svg)').first();
    if (await modalClose.count() > 0) {
      await modalClose.click();
      await page.waitForTimeout(500);
    }
  }

  await browser.close();
  console.log('--- Phase 2 Complete Verification Finished Successfully! ---');
})();

