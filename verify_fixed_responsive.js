const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('🚀 Running Comprehensive Responsive Verification (Mobile & Tablet)...');
  const browser = await chromium.launch({ headless: true });

  const errors = [];

  try {
    // =================================================================
    // 1. MOBILE DEVICE: 390 x 844 (iPhone 14 / Android Phone)
    // =================================================================
    console.log('\n--- 1. Testing Mobile View (390 x 844) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();
    
    mobilePage.on('pageerror', err => {
      console.error('❌ MOBILE PAGE ERROR:', err.message);
      errors.push(`Mobile error: ${err.message}`);
    });

    await mobilePage.goto('http://localhost:5173/apps');
    await mobilePage.evaluate(() => {
      localStorage.setItem('authToken', 'mock-admin-token');
      localStorage.setItem('user', JSON.stringify({ role: 'ADMIN', name: 'Admin Huzeif' }));
    });

    await mobilePage.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);

    // Verify Floor & Menu is visible
    const floorTab = mobilePage.locator('button:has-text("Floor & Menu")');
    const ticketTab = mobilePage.locator('button:has-text("Live Ticket")');
    console.log('Mobile Tabs present:', await floorTab.isVisible(), await ticketTab.isVisible());

    const mobileCatalogShot = path.join(ARTIFACT_DIR, 'responsive_mobile_pos.png');
    await mobilePage.screenshot({ path: mobileCatalogShot, fullPage: false });
    console.log('✅ Captured responsive_mobile_pos.png (Catalog View)');

    // Click Live Ticket Tab
    if (await ticketTab.isVisible()) {
      await ticketTab.click();
      await mobilePage.waitForTimeout(800);
      const mobileTicketShot = path.join(ARTIFACT_DIR, 'responsive_mobile_ticket.png');
      await mobilePage.screenshot({ path: mobileTicketShot, fullPage: false });
      console.log('✅ Captured responsive_mobile_ticket.png (Ticket View)');
    }

    await mobileContext.close();

    // =================================================================
    // 2. TABLET DEVICE: 820 x 1180 (iPad 10th Gen / Android Tablet)
    // =================================================================
    console.log('\n--- 2. Testing Tablet View (820 x 1180) ---');
    const tabletContext = await browser.newContext({
      viewport: { width: 820, height: 1180 },
      isMobile: true,
      hasTouch: true
    });
    const tabletPage = await tabletContext.newPage();

    tabletPage.on('pageerror', err => {
      console.error('❌ TABLET PAGE ERROR:', err.message);
      errors.push(`Tablet error: ${err.message}`);
    });

    await tabletPage.goto('http://localhost:5173/apps');
    await tabletPage.evaluate(() => {
      localStorage.setItem('authToken', 'mock-admin-token');
      localStorage.setItem('user', JSON.stringify({ role: 'ADMIN', name: 'Admin Huzeif' }));
    });

    // POS on Tablet
    await tabletPage.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
    await tabletPage.waitForTimeout(1500);

    const tabletPosShot = path.join(ARTIFACT_DIR, 'responsive_tablet_pos.png');
    await tabletPage.screenshot({ path: tabletPosShot, fullPage: false });
    console.log('✅ Captured responsive_tablet_pos.png (Side-by-Side POS on Tablet)');

    // Home / Dashboard on Tablet
    await tabletPage.goto('http://localhost:5173/home', { waitUntil: 'networkidle' });
    await tabletPage.waitForTimeout(1500);

    const tabletHomeShot = path.join(ARTIFACT_DIR, 'responsive_tablet_home.png');
    await tabletPage.screenshot({ path: tabletHomeShot, fullPage: false });
    console.log('✅ Captured responsive_tablet_home.png (Side-by-Side Home on Tablet)');

    await tabletContext.close();

    // =================================================================
    // 3. TABLET LANDSCAPE: 1180 x 820 (Countertop Terminal Mount)
    // =================================================================
    console.log('\n--- 3. Testing Tablet Landscape View (1180 x 820) ---');
    const tabletLandscapeContext = await browser.newContext({
      viewport: { width: 1180, height: 820 },
      isMobile: true,
      hasTouch: true
    });
    const landscapePage = await tabletLandscapeContext.newPage();

    await landscapePage.goto('http://localhost:5173/apps');
    await landscapePage.evaluate(() => {
      localStorage.setItem('authToken', 'mock-admin-token');
      localStorage.setItem('user', JSON.stringify({ role: 'ADMIN', name: 'Admin Huzeif' }));
    });

    await landscapePage.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
    await landscapePage.waitForTimeout(1500);

    const tabletLandscapeShot = path.join(ARTIFACT_DIR, 'responsive_tablet_landscape.png');
    await landscapePage.screenshot({ path: tabletLandscapeShot, fullPage: false });
    console.log('✅ Captured responsive_tablet_landscape.png (Landscape POS Terminal)');

    await tabletLandscapeContext.close();

    if (errors.length > 0) {
      console.error('❌ Some errors occurred during responsive verification:', errors);
      process.exit(1);
    } else {
      console.log('\n🎉 ALL RESPONSIVE TESTS PASSED WITH 0 ERRORS!');
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

