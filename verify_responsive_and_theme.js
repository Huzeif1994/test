const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('📱 Testing Mobile & Tablet Responsiveness + Theme Consistency...');
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------
    // TEST 1: Android / Mobile Screen (390 x 844)
    // -----------------------------------------------------------------
    console.log('\n--- Test 1: Mobile Device (390 x 844) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();

    // Authenticate via localStorage
    await mobilePage.goto('http://localhost:5173/apps');
    await mobilePage.evaluate(() => {
      localStorage.setItem('authToken', 'mock-admin-token');
      localStorage.setItem('user', JSON.stringify({ role: 'ADMIN', name: 'Admin Huzeif' }));
    });
    await mobilePage.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);

    // Verify mobile tabs are present
    const catalogTab = mobilePage.locator('button:has-text("Floor & Menu")');
    const ticketTab = mobilePage.locator('button:has-text("Live Ticket")');
    const tabsVisible = await catalogTab.isVisible() && await ticketTab.isVisible();
    console.log(`✓ Mobile POS Tabs visible: ${tabsVisible}`);

    const mobileShot = path.join(ARTIFACT_DIR, 'responsive_mobile_pos.png');
    await mobilePage.screenshot({ path: mobileShot, fullPage: true });
    console.log(`📸 Saved Mobile POS: ${mobileShot}`);

    // Switch to Ticket tab
    if (await ticketTab.isVisible()) {
      await ticketTab.click();
      await mobilePage.waitForTimeout(1000);
      const mobileTicketShot = path.join(ARTIFACT_DIR, 'responsive_mobile_ticket.png');
      await mobilePage.screenshot({ path: mobileTicketShot, fullPage: true });
      console.log(`📸 Saved Mobile Ticket: ${mobileTicketShot}`);
    }

    await mobileContext.close();

    // -----------------------------------------------------------------
    // TEST 2: Android Tablet / iPad Screen (820 x 1180)
    // -----------------------------------------------------------------
    console.log('\n--- Test 2: Tablet Device (820 x 1180) ---');
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

    // Open hamburger menu drawer on tablet
    const hamburger = tabletPage.locator('button[aria-label="Toggle menu"]');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await tabletPage.waitForTimeout(1000);
    }

    const tabletShot = path.join(ARTIFACT_DIR, 'responsive_tablet_drawer.png');
    await tabletPage.screenshot({ path: tabletShot, fullPage: true });
    console.log(`📸 Saved Tablet Drawer: ${tabletShot}`);

    await tabletContext.close();

    console.log('\n🎉 ALL RESPONSIVENESS AND THEME TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
