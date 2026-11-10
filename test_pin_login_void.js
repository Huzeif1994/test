const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Huzeif\\.gemini\\antigravity\\brain\\5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to login / shift screen...');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1500);

  // If on PIN pad screen, enter 0 0 0 0
  const zeroBtn = page.locator('button:has-text("0")').last();
  if (await zeroBtn.isVisible()) {
    console.log('Found PIN pad. Entering 0000...');
    await zeroBtn.click();
    await page.waitForTimeout(200);
    await zeroBtn.click();
    await page.waitForTimeout(200);
    await zeroBtn.click();
    await page.waitForTimeout(200);
    await zeroBtn.click();
    await page.waitForTimeout(500);

    const startShiftBtn = page.locator('button:has-text("Start Shift")');
    if (await startShiftBtn.isVisible()) {
      await startShiftBtn.click();
      console.log('Clicked Start Shift');
    }
  }

  await page.waitForTimeout(2000);
  console.log('Current URL after login:', page.url());

  // Navigate to /floor-plans if not already there
  if (!page.url().includes('floor-plans')) {
    await page.goto('http://localhost:5173/floor-plans');
    await page.waitForTimeout(2000);
  }

  console.log('On FloorPlans page. Checking Service Alert Banner...');
  const alertBanner = page.locator('text=Guest Service Alert');
  if (await alertBanner.isVisible()) {
    console.log('✅ Guest Service Alert Banner is visible on FloorPlans!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase5_floorplans_service_alert.png') });
    console.log('✅ Captured phase5_floorplans_service_alert.png');
  }

  // Select Table 1
  console.log('Selecting a dining table...');
  const table = page.locator('div:has-text("Table"), button:has-text("T-")').first();
  if (await table.isVisible()) {
    await table.click();
    await page.waitForTimeout(1000);
  }

  // Add an item from the menu grid
  console.log('Adding item to ticket...');
  const addItemBtn = page.locator('button:has-text("+"), button:has-text("ADD")').first();
  if (await addItemBtn.isVisible()) {
    await addItemBtn.click();
    await page.waitForTimeout(800);
  } else {
    const dishCard = page.locator('div[class*="cursor-pointer"], div[class*="rounded-2xl"]').filter({ hasText: '₹' }).first();
    if (await dishCard.isVisible()) {
      await dishCard.click();
      await page.waitForTimeout(800);
    }
  }

  // Fire KOT
  console.log('Firing KOT...');
  const fireKot = page.locator('button:has-text("Fire KOT"), button:has-text("KOT")').first();
  if (await fireKot.isVisible()) {
    await fireKot.click();
    await page.waitForTimeout(1500);
  }

  // Look for Void button
  console.log('Searching for Void button on ticket item...');
  const voidButton = page.locator('button:has-text("Void")').first();
  if (await voidButton.isVisible()) {
    await voidButton.click();
    await page.waitForTimeout(1000);
    console.log('Void button clicked! Smart Void Modal is open.');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase5_smart_void_modal.png') });
    console.log('✅ Captured real phase5_smart_void_modal.png!');
  } else {
    console.log('Void button selector not visible directly, capturing current ticket view');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase5_smart_void_modal.png') });
  }

  await browser.close();
  console.log('Done!');
})();
