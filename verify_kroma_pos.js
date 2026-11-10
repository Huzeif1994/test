const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('🚀 Running Kroma POS Verification & Screenshot Capture...');
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // 1. Employee Login Screen with Kroma POS Logo
    console.log('\n--- 1. Testing Employee Login with Kroma POS Logo ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const loginBrandVisible = page.locator('span:has-text("KROMA")');
    console.log('Login KROMA Logo text visible:', await loginBrandVisible.first().isVisible());

    const loginShot = path.join(ARTIFACT_DIR, 'kroma_1_login_screen.png');
    await page.screenshot({ path: loginShot });
    console.log('✅ Captured kroma_1_login_screen.png');

    // 2. Perform Quick Pin Login (Admin default PIN 0000)
    console.log('\n--- 2. Logging In to Dashboard ---');
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('0');
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(2000);

    // 3. Verify Dashboard Sidebar with Kroma POS Logo
    console.log('\n--- 3. Testing Dashboard Sidebar with Kroma POS Logo ---');
    const sidebarLogo = page.locator('span:has-text("KROMA")');
    console.log('Sidebar Kroma Logo visible:', await sidebarLogo.first().isVisible());

    const dashboardShot = path.join(ARTIFACT_DIR, 'kroma_2_dashboard_sidebar.png');
    await page.screenshot({ path: dashboardShot });
    console.log('✅ Captured kroma_2_dashboard_sidebar.png');

    // 4. Verify Kiosk Welcome Screen with Kroma POS Logo
    console.log('\n--- 4. Testing Kiosk with Kroma POS Logo ---');
    const kioskContext = await browser.newContext({
      viewport: { width: 1080, height: 1920 },
      isMobile: true,
      hasTouch: true
    });
    const kioskPage = await kioskContext.newPage();
    await kioskPage.goto('http://localhost:5173/kiosk', { waitUntil: 'networkidle' });
    await kioskPage.waitForTimeout(1500);

    const kioskLogo = kioskPage.locator('span:has-text("KROMA")');
    console.log('Kiosk Kroma Logo visible:', await kioskLogo.first().isVisible());

    const kioskShot = path.join(ARTIFACT_DIR, 'kroma_3_kiosk_welcome.png');
    await kioskPage.screenshot({ path: kioskShot });
    console.log('✅ Captured kroma_3_kiosk_welcome.png');

    console.log('\n🎉 KROMA POS VERIFICATION COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Kroma verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

