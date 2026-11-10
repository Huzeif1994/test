const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('🚀 Verifying Whole App Responsiveness (Mobile & Tablet)...');
  const browser = await chromium.launch({ headless: true });

  try {
    // =================================================================
    // 1. MOBILE DEVICE: 390 x 844 (iPhone 14 / Mobile View)
    // =================================================================
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('http://localhost:5173/apps');
    await mobilePage.evaluate(() => {
      localStorage.setItem('authToken', 'mock-admin-token');
      localStorage.setItem('user', JSON.stringify({ role: 'ADMIN', name: 'Admin Huzeif' }));
    });

    // Test /home (Dashboard) on Mobile
    console.log('\n--- 1. Testing /home on Mobile (390 x 844) ---');
    await mobilePage.goto('http://localhost:5173/home', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);

    const homeOverflow = await mobilePage.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    console.log('Mobile /home Overflow Check:', homeOverflow);

    const mobileHomeShot = path.join(ARTIFACT_DIR, 'fixed_mobile_home.png');
    await mobilePage.screenshot({ path: mobileHomeShot, fullPage: false });
    console.log('✅ Captured fixed_mobile_home.png');

    // Test /orders on Mobile
    console.log('\n--- 2. Testing /orders on Mobile (390 x 844) ---');
    await mobilePage.goto('http://localhost:5173/orders', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);

    const ordersOverflow = await mobilePage.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    console.log('Mobile /orders Overflow Check:', ordersOverflow);

    // Verify button visibility on first order card
    const payBillsBtn = mobilePage.locator('button:has-text("Pay Bills")').first();
    const seeDetailsBtn = mobilePage.locator('button:has-text("See Details")').first();
    if (await payBillsBtn.isVisible()) {
      const box = await payBillsBtn.boundingBox();
      console.log('Pay Bills Button Position & Width:', box);
    }

    const mobileOrdersShot = path.join(ARTIFACT_DIR, 'fixed_mobile_orders.png');
    await mobilePage.screenshot({ path: mobileOrdersShot, fullPage: false });
    console.log('✅ Captured fixed_mobile_orders.png');

    await mobileContext.close();

    // =================================================================
    // 2. TABLET DEVICE: 820 x 1180 (iPad 10th Gen)
    // =================================================================
    console.log('\n--- 3. Testing Tablet /home (820 x 1180) ---');
    const tabletContext = await browser.newContext({
      viewport: { width: 820, height: 1180 },
      isMobile: true,
      hasTouch: true
    });
    const tabletPage = await tabletContext.newPage();

    await tabletPage.goto('http://localhost:5173/apps');
    await tabletPage.evaluate(() => {
      localStorage.setItem('authToken', 'mock-admin-token');
      localStorage.setItem('user', JSON.stringify({ role: 'ADMIN', name: 'Admin Huzeif' }));
    });

    await tabletPage.goto('http://localhost:5173/home', { waitUntil: 'networkidle' });
    await tabletPage.waitForTimeout(1500);

    const tabletHomeOverflow = await tabletPage.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    console.log('Tablet /home Overflow Check:', tabletHomeOverflow);

    const tabletHomeShot = path.join(ARTIFACT_DIR, 'fixed_tablet_home.png');
    await tabletPage.screenshot({ path: tabletHomeShot, fullPage: false });
    console.log('✅ Captured fixed_tablet_home.png');

    // Test /orders on Tablet
    console.log('\n--- 4. Testing Tablet /orders (820 x 1180) ---');
    await tabletPage.goto('http://localhost:5173/orders', { waitUntil: 'networkidle' });
    await tabletPage.waitForTimeout(1500);

    const tabletOrdersShot = path.join(ARTIFACT_DIR, 'fixed_tablet_orders.png');
    await tabletPage.screenshot({ path: tabletOrdersShot, fullPage: false });
    console.log('✅ Captured fixed_tablet_orders.png');

    await tabletContext.close();

    console.log('\n🎉 ALL RESPONSIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

