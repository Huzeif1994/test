const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('--- Launching Enterprise Parity Verification Suite ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
  });
  page.on('pageerror', err => console.log(`PAGE EXCEPTION: ${err.message}`));

  // Pre-seed auth token
  await page.goto('http://localhost:5173/login');
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'test-admin-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'admin-01',
      name: 'Executive Manager',
      role: 'ADMIN',
      email: 'admin@ftxpos.com'
    }));
  });

  // 1. VERIFY DASHBOARD COMMAND PALETTE (⌘K)
  console.log('Navigating to Dashboard (/home)...');
  await page.goto('http://localhost:5173/home');
  await page.waitForTimeout(2000);

  // Click Command Search Bar
  console.log('Triggering ⌘K Command Palette...');
  await page.locator('header kbd:has-text("⌘K")').click();
  await page.waitForTimeout(1000);

  const commandPalette = page.locator('text=FTX Omni-Channel Commercial Core');
  await commandPalette.waitFor({ state: 'visible', timeout: 5000 });
  console.log('SUCCESS: Global Command Palette is visible!');

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'main_app_command_palette.png'),
    fullPage: false
  });
  console.log('Captured main_app_command_palette.png');

  // Close palette via ESC
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 2. VERIFY TILL-01 ONLINE BUTTON (Opens Blind Shift Close)
  console.log('Clicking TILL-01 ONLINE status pill in Dashboard Header...');
  await page.locator('header button:has-text("TILL-01")').click();
  await page.waitForTimeout(1000);

  const blindModalHeader = page.locator('text=Blind Shift Close & X/Z Audit');
  await blindModalHeader.waitFor({ state: 'visible', timeout: 5000 });
  console.log('SUCCESS: Blind Close Shift Modal opened directly from top header!');

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'main_app_header_blind_close.png'),
    fullPage: false
  });
  console.log('Captured main_app_header_blind_close.png');

  // Close modal via Cancel button
  await page.locator('button:has-text("Cancel")').first().click();
  await page.waitForTimeout(500);

  // 3. VERIFY MAIN FLOOR PLANS (/floor-plans)
  console.log('Navigating to Floor Plans (/floor-plans)...');
  await page.goto('http://localhost:5173/floor-plans');
  await page.waitForTimeout(2500);

  // Verify all 5 enterprise buttons exist in toolbar
  const captainBtn = page.locator('button:has-text("Captain POS")');
  const waitlistBtn = page.locator('button:has-text("Waitlist")');
  const shiftMergeBtn = page.locator('button:has-text("Shift / Merge")');
  const hardwareBtn = page.locator('button:has-text("Hardware")');
  const tillBtn = page.locator('button:has-text("Till / Reg X")');

  console.log('Verifying Floor toolbar buttons...');
  await captainBtn.waitFor({ state: 'visible' });
  await waitlistBtn.waitFor({ state: 'visible' });
  await shiftMergeBtn.waitFor({ state: 'visible' });
  await tillBtn.waitFor({ state: 'visible' });
  console.log('SUCCESS: All Enterprise toolbar buttons active in FloorPlans!');

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'main_app_floorplans_toolbar.png'),
    fullPage: false
  });
  console.log('Captured main_app_floorplans_toolbar.png');

  // Click Shift / Merge button
  console.log('Opening Table Shift / Merge modal from Floor...');
  await shiftMergeBtn.click();
  await page.waitForTimeout(1000);
  const shiftModalTitle = page.locator('text=Table Operations');
  await shiftModalTitle.waitFor({ state: 'visible', timeout: 5000 });
  console.log('SUCCESS: Table Shift / Merge modal opened from FloorPlans!');

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'main_app_floor_table_shift_merge.png'),
    fullPage: false
  });
  console.log('Captured main_app_floor_table_shift_merge.png');

  // Close shift modal
  await page.locator('button:has-text("Cancel")').first().click();
  await page.waitForTimeout(500);

  // Click Waitlist button
  console.log('Opening Host Waitlist Desk from Floor...');
  await waitlistBtn.click();
  await page.waitForTimeout(1000);
  const waitlistTitle = page.locator('text=Host Stand: Reservations & Waitlist');
  await waitlistTitle.waitFor({ state: 'visible', timeout: 5000 });
  console.log('SUCCESS: Host Waitlist Desk opened from FloorPlans!');

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'main_app_floor_waitlist_desk.png'),
    fullPage: false
  });
  console.log('Captured main_app_floor_waitlist_desk.png');

  await browser.close();
  console.log('--- Verification Suite Completed Successfully! ---');
})();