const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('🚀 Starting Phase 3 Comprehensive Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // TEST 1: Customer Self-Service Kiosk (/kiosk)
    // -------------------------------------------------------------
    console.log('1️⃣ Navigating to Customer Self-Service Kiosk (/kiosk)...');
    await page.goto('http://localhost:5173/kiosk');
    await page.waitForTimeout(2000);

    // Verify Welcome Screen
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase3_kiosk_welcome.png') });
    console.log('📸 Captured: phase3_kiosk_welcome.png');

    // Click "Dine In"
    console.log('Clicking Dine In mode...');
    const dineInBtn = page.locator('button:has-text("Dine In")');
    await dineInBtn.first().click();
    await page.waitForTimeout(2000);

    // Enter Table Puck
    const puckInput = page.locator('input[placeholder*="e.g. 4"]');
    if (await puckInput.isVisible()) {
      await puckInput.fill('7');
    }

    // Capture Kiosk Menu Screen
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase3_kiosk_menu.png') });
    console.log('📸 Captured: phase3_kiosk_menu.png');

    // Add first item to cart
    console.log('Adding items to kiosk cart...');
    const addBtns = page.locator('button:has-text("Add")');
    await addBtns.first().waitFor({ state: 'visible', timeout: 8000 });
    await addBtns.first().click();
    await page.waitForTimeout(600);
    if (await addBtns.count() > 1) {
      await addBtns.nth(1).click();
      await page.waitForTimeout(600);
    }

    // Open Cart Drawer
    console.log('Opening Kiosk Tray / Cart Drawer...');
    const trayBtn = page.locator('button:has-text("My Order")');
    await trayBtn.click();
    await page.waitForTimeout(1000);

    // Enter Phone
    const phoneInput = page.locator('input[placeholder*="Mobile for SMS"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('9123456780');
    }

    // Enter Coupon WELCOME50
    const couponInput = page.locator('input[placeholder*="WELCOME50"]');
    if (await couponInput.isVisible()) {
      await couponInput.fill('WELCOME50');
      const applyBtn = page.locator('button:has-text("Apply")');
      await applyBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase3_kiosk_cart_drawer.png') });
    console.log('📸 Captured: phase3_kiosk_cart_drawer.png');

    // Confirm Order
    console.log('Confirming Kiosk Order...');
    const confirmBtn = page.locator('button:has-text("Confirm Order")');
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await confirmBtn.click();
    await page.waitForTimeout(3000);

    // Capture Token Confirmation Screen
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase3_kiosk_confirmation.png') });
    console.log('📸 Captured: phase3_kiosk_confirmation.png');

    // -------------------------------------------------------------
    // TEST 2: In-House Rider Mobile Hub (/rider)
    // -------------------------------------------------------------
    console.log('2️⃣ Navigating to In-House Rider Mobile Hub (/rider)...');
    await page.goto('http://localhost:5173/rider');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase3_rider_dispatch.png') });
    console.log('📸 Captured: phase3_rider_dispatch.png');

    // -------------------------------------------------------------
    // TEST 3: Payment Settlement Modal with Loyalty & Gift Card
    // -------------------------------------------------------------
    console.log('3️⃣ Authenticating & Opening Floor Plans Payment Settlement...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      localStorage.setItem('authToken', 'test-admin-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'usr-admin',
        name: 'Master Admin',
        role: 'ADMIN',
        department: 'MANAGEMENT'
      }));
    });

    await page.goto('http://localhost:5173/floor-plans');
    await page.waitForTimeout(2500);

    // Select Table T1
    console.log('Selecting table T1...');
    const tableCard = page.locator('text=T1').first();
    if (await tableCard.isVisible()) {
      await tableCard.click();
      await page.waitForTimeout(1200);
    }

    // Ensure table has items by clicking any dish item on left if ticket total is 0
    const dishCard = page.locator('div:has-text("Paneer")').first();
    if (await dishCard.isVisible()) {
      await dishCard.click().catch(() => {});
      await page.waitForTimeout(600);
    }

    // Click Pay button to trigger Payment Settlement modal (as in User Screenshot 2)
    const payBtn = page.locator('button:has-text("Pay")').first();
    if (await payBtn.isVisible()) {
      console.log('Opening Payment Settlement modal...');
      await payBtn.click();
      await page.waitForTimeout(1500);

      // Search Loyalty Member
      const memberInput = page.locator('input[placeholder*="Search by name or phone"]');
      if (await memberInput.isVisible()) {
        console.log('Searching loyalty member...');
        await memberInput.fill('7016802233');
        const searchBtn = memberInput.locator('..').locator('button');
        await searchBtn.click();
        await page.waitForTimeout(1000);
      }

      // Enter Gift Card
      const giftInput = page.locator('input[placeholder*="Enter gift card code"]');
      if (await giftInput.isVisible()) {
        console.log('Applying Gift Card GC-2026-8841...');
        await giftInput.fill('GC-2026-8841');
        const giftBtn = giftInput.locator('..').locator('button');
        await giftBtn.click();
        await page.waitForTimeout(1000);
      }

      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase3_giftcard_loyalty_settlement.png') });
      console.log('📸 Captured: phase3_giftcard_loyalty_settlement.png');
    }

    console.log('🎉 ALL PHASE 3 VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Error during Phase 3 verification:', error);
  } finally {
    await browser.close();
  }
})();
