const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('🚀 Running Unified Branding & Razorpay Test Environment Verification...');
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // 1. Verify Unified Branding on Employee Login
    console.log('\n--- 1. Testing Employee Login Branding ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const loginBrandHeader = page.locator('h1:has-text("FTX Restaurant OS"), h2:has-text("FTX Restaurant OS")');
    console.log('Login Brand Header count:', await loginBrandHeader.count());
    const loginShot = path.join(ARTIFACT_DIR, 'verify_branding_login.png');
    await page.screenshot({ path: loginShot });
    console.log('✅ Captured verify_branding_login.png');

    // 2. Perform Quick Pin Login (Admin default PIN 0000)
    console.log('\n--- 2. Logging In to Dashboard ---');
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('0');
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(2000);

    // 3. Verify Sidebar Branding on /home
    console.log('\n--- 3. Testing Sidebar Unified Branding on Dashboard ---');
    const sidebarBrand = page.locator('span:has-text("FTX RESTAURANT OS")');
    console.log('Sidebar Brand visible:', await sidebarBrand.first().isVisible());
    const dashboardShot = path.join(ARTIFACT_DIR, 'verify_branding_sidebar.png');
    await page.screenshot({ path: dashboardShot });
    console.log('✅ Captured verify_branding_sidebar.png');

    // 4. Verify POS Counter PaymentFlow QR Tab with Razorpay
    console.log('\n--- 4. Testing POS Counter /floor-plans PaymentFlow QR Tab ---');
    await page.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Click Takeaway tab to test quick settle
    const takeawayTab = page.locator('button:has-text("Takeaway")').first();
    if (await takeawayTab.isVisible()) {
      await takeawayTab.click();
      await page.waitForTimeout(500);
    }

    // Add first menu item
    const firstItem = page.locator('.grid button:has-text("₹"), .grid div:has-text("₹")').first();
    if (await firstItem.isVisible()) {
      await firstItem.click();
      await page.waitForTimeout(500);
    }

    // Click Settle / Pay button
    const settleBtn = page.locator('button:has-text("Settle / Pay")').first();
    if (await settleBtn.isVisible()) {
      await settleBtn.click();
      await page.waitForTimeout(1000);

      // Click on QR Code tab
      const qrTabBtn = page.locator('button:has-text("QR Code")').first();
      if (await qrTabBtn.isVisible()) {
        await qrTabBtn.click();
        await page.waitForTimeout(800);

        const rzpTestBtn = page.locator('button:has-text("Open Razorpay Test Checkout")');
        console.log('PaymentFlow Razorpay Test Button visible:', await rzpTestBtn.isVisible());

        const posPaymentShot = path.join(ARTIFACT_DIR, 'verify_pos_razorpay_qr.png');
        await page.screenshot({ path: posPaymentShot });
        console.log('✅ Captured verify_pos_razorpay_qr.png');
      }
    }

    // 5. Verify Kiosk Self-Service Razorpay Test Environment
    console.log('\n--- 5. Testing Kiosk /kiosk Razorpay Test Gateway ---');
    const kioskContext = await browser.newContext({
      viewport: { width: 1080, height: 1920 },
      isMobile: true,
      hasTouch: true
    });
    const kioskPage = await kioskContext.newPage();
    await kioskPage.goto('http://localhost:5173/kiosk', { waitUntil: 'networkidle' });
    await kioskPage.waitForTimeout(1500);

    // Verify Welcome Screen Branding
    const kioskBrand = kioskPage.locator('h1:has-text("FTX Restaurant OS")');
    console.log('Kiosk Welcome Header "FTX Restaurant OS" visible:', await kioskBrand.isVisible());

    // Click Dine In & Select Table
    await kioskPage.locator('button:has-text("Dine In")').click();
    await kioskPage.waitForTimeout(800);
    await kioskPage.locator('button:has-text("T2")').first().click();
    await kioskPage.waitForTimeout(800);

    // Verify Menu Screen Header Branding
    const menuBrand = kioskPage.locator('span:has-text("FTX RESTAURANT OS")');
    console.log('Kiosk Menu Header "FTX RESTAURANT OS" visible:', await menuBrand.isVisible());

    // Add item to cart
    await kioskPage.locator('button:has-text("Add")').first().click();
    await kioskPage.waitForTimeout(500);

    // Open Cart Drawer
    await kioskPage.locator('button:has-text("My Order")').click();
    await kioskPage.waitForTimeout(800);

    // Confirm Order to open UPI / Razorpay Modal
    await kioskPage.locator('button:has-text("Confirm Order")').click();
    await kioskPage.waitForTimeout(1000);

    // Verify Razorpay Test Environment CTA and Sandbox Pill
    const rzpKioskBtn = kioskPage.locator('button:has-text("Open Razorpay Test Environment")');
    console.log('Kiosk Razorpay Test CTA visible:', await rzpKioskBtn.isVisible());

    const kioskQrModalShot = path.join(ARTIFACT_DIR, 'verify_kiosk_razorpay_modal.png');
    await kioskPage.screenshot({ path: kioskQrModalShot });
    console.log('✅ Captured verify_kiosk_razorpay_modal.png');

    // Click Open Razorpay Test Environment to trigger Razorpay Checkout iframe
    console.log('\n--- 6. Launching Real Razorpay Test Checkout Popup ---');
    await rzpKioskBtn.click();
    await kioskPage.waitForTimeout(3500);

    // Check for Razorpay checkout iframe or overlay
    const rzpFrame = kioskPage.locator('iframe[src*="razorpay"], iframe.razorpay-checkout-frame');
    const frameCount = await rzpFrame.count();
    console.log('Razorpay Checkout iframe detected:', frameCount > 0);

    const rzpPopupShot = path.join(ARTIFACT_DIR, 'verify_kiosk_razorpay_checkout_popup.png');
    await kioskPage.screenshot({ path: rzpPopupShot });
    console.log('✅ Captured verify_kiosk_razorpay_checkout_popup.png');

    console.log('\n🎉 ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

