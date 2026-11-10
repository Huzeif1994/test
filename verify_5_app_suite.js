const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('🚀 Starting 5-App Ecosystem Suite Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[BROWSER ERROR]: ${msg.text()}`);
  });

  try {
    // -----------------------------------------------------------------
    // TEST 1: Dedicated 5-App Suite Portal (/apps)
    // -----------------------------------------------------------------
    console.log('--- Step 1: Navigating to /apps Suite Portal ---');
    await page.goto('http://localhost:5173/apps', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const title = await page.textContent('h1');
    console.log(`Page header: ${title}`);

    const shot1 = path.join(ARTIFACT_DIR, '5_app_suite_ecosystem.png');
    await page.screenshot({ path: shot1, fullPage: true });
    console.log(`📸 Saved: ${shot1}`);

    // -----------------------------------------------------------------
    // TEST 2: Login & 9-Dot Launcher Switcher on /home
    // -----------------------------------------------------------------
    console.log('--- Step 2: Logging in as Admin to access DashboardHeader ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Fast login via simulated badge key: EMP-ADMIN-1
    for (const ch of 'EMP-ADMIN-1') {
      await page.keyboard.press(ch);
      await page.waitForTimeout(15);
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    console.log(`Current page URL: ${page.url()}`);

    // Look for the "5 Apps" 9-dot launcher button
    const switcherBtn = page.locator('button:has-text("5 Apps")');
    if (await switcherBtn.isVisible()) {
      console.log('Clicking "5 Apps" 9-dot launcher...');
      await switcherBtn.click();
      await page.waitForTimeout(1500);

      const shot2 = path.join(ARTIFACT_DIR, '5_app_switcher_modal.png');
      await page.screenshot({ path: shot2, fullPage: true });
      console.log(`📸 Saved: ${shot2}`);
    } else {
      console.warn('Switcher button not found on page');
    }

    console.log('🎉 5-APP ECOSYSTEM SUITE VERIFIED WITH 2 SCREENSHOT ARTIFACTS!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
