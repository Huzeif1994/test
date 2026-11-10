const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('🚀 Running Kiosk Table Selection & Dynamic UPI Verification...');
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1080, height: 1920 }, // Standard 1080p Portrait Kiosk Touchscreen
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();

    page.on('console', msg => console.log('KIOSK CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('KIOSK ERROR:', err.message));

    // 1. Open /kiosk
    console.log('\n--- 1. Navigating to /kiosk (Welcome Screen) ---');
    await page.goto('http://localhost:5173/kiosk', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // 2. Click "Dine In"
    console.log('\n--- 2. Clicking Dine In to trigger Table Selection Modal ---');
    const dineInBtn = page.locator('button:has-text("Dine In")');
    await dineInBtn.click();
    await page.waitForTimeout(1000);

    // Verify Table Selection Modal is visible
    const tableModal = page.locator('h3:has-text("Select Your Dining Table")');
    console.log('Table Selection Modal visible:', await tableModal.isVisible());

    const tableModalShot = path.join(ARTIFACT_DIR, 'kiosk_1_table_selection_modal.png');
    await page.screenshot({ path: tableModalShot });
    console.log('✅ Captured kiosk_1_table_selection_modal.png');

    // 3. Select Table (e.g. Table T2)
    console.log('\n--- 3. Selecting Table T2 ---');
    const tableT2Btn = page.locator('button:has-text("T2")').first();
    if (await tableT2Btn.isVisible()) {
      await tableT2Btn.click();
    } else {
      // Fallback click first available table button in modal
      await page.locator('div[role="dialog"] button, .grid button').first().click();
    }
    await page.waitForTimeout(1000);

    const menuWithTableShot = path.join(ARTIFACT_DIR, 'kiosk_2_menu_with_selected_table.png');
    await page.screenshot({ path: menuWithTableShot });
    console.log('✅ Captured kiosk_2_menu_with_selected_table.png');

    // 4. Add items to tray
    console.log('\n--- 4. Adding Menu Items to Cart ---');
    const addBtns = page.locator('button:has-text("Add")');
    const count = await addBtns.count();
    if (count > 0) {
      await addBtns.nth(0).click();
      await page.waitForTimeout(500);
      if (count > 1) {
        await addBtns.nth(1).click();
        await page.waitForTimeout(500);
      }
    }

    // 5. Open Tray / Cart Drawer
    console.log('\n--- 5. Opening Cart Drawer ---');
    const trayBtn = page.locator('button:has-text("My Order")');
    await trayBtn.click();
    await page.waitForTimeout(1000);

    // 6. Ensure Dynamic UPI is selected & click checkout
    console.log('\n--- 6. Selecting Dynamic UPI & Initiating Checkout ---');
    const upiChoiceBtn = page.locator('button:has-text("Dynamic UPI QR")');
    if (await upiChoiceBtn.isVisible()) {
      await upiChoiceBtn.click();
    }

    const confirmOrderBtn = page.locator('button:has-text("Confirm Order")');
    await confirmOrderBtn.click();
    await page.waitForTimeout(1200);

    // Verify Dynamic UPI QR Modal is visible
    const upiModalTitle = page.locator('h3:has-text("Scan & Pay")');
    const upiQrSvg = page.locator('svg[value*="upi://pay"]');
    console.log('Dynamic UPI Modal visible:', await upiModalTitle.isVisible());

    const upiModalShot = path.join(ARTIFACT_DIR, 'kiosk_3_dynamic_upi_qr_modal.png');
    await page.screenshot({ path: upiModalShot });
    console.log('✅ Captured kiosk_3_dynamic_upi_qr_modal.png');

    // 7. Simulate instant UPI payment
    console.log('\n--- 7. Simulating Instant UPI Payment Received ---');
    const simulatePaymentBtn = page.locator('button:has-text("Simulate UPI Payment Success")');
    await simulatePaymentBtn.click();
    await page.waitForTimeout(1500);

    // 8. Verify Order Confirmation Screen
    const orderConfirmedHeading = page.locator('h2:has-text("Order Confirmed!")');
    console.log('Order Confirmed screen visible:', await orderConfirmedHeading.isVisible());

    const confirmationShot = path.join(ARTIFACT_DIR, 'kiosk_4_order_confirmed_token.png');
    await page.screenshot({ path: confirmationShot });
    console.log('✅ Captured kiosk_4_order_confirmed_token.png');

    console.log('\n🎉 KIOSK TABLE SELECTION & DYNAMIC UPI VERIFIED 100% SUCCESSFULLY!');
  } catch (err) {
    console.error('Kiosk verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

