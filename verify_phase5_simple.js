const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('🚀 Phase 5 FloorPlans & Smart Void Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Seed a table service request to backend
  await page.request.post('http://127.0.0.1:5000/api/tables/4/service-request', {
    data: {
      type: 'CALL_WAITER',
      notes: 'Guest requested Captain assistance at Table 4'
    }
  });

  // 2. Set Auth
  await page.goto('http://localhost:5173/login');
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'test-admin-token');
    localStorage.setItem('token', 'test-admin-token');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('user', JSON.stringify({
      id: 'admin-01',
      name: 'Huzeif (Admin)',
      role: 'Admin'
    }));
  });

  // 3. Go to FloorPlans
  await page.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check and screenshot Service Alert banner
  console.log('Checking Guest Service Alert Banner...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase5_floorplans_service_alert.png') });
  console.log('📸 Captured: phase5_floorplans_service_alert.png');

  // 4. Test Smart Void Modal directly by triggering state in FloorPlans
  console.log('Opening Smart Void Modal...');
  await page.evaluate(() => {
    // If FloorPlans exposed setter or we can click Void button
    const event = new CustomEvent('openSmartVoidTest');
    window.dispatchEvent(event);
  });

  // Look for any Void button or trigger the modal via React state
  const voidBtn = page.locator('button:has-text("Void")');
  if (await voidBtn.count() > 0) {
    await voidBtn.first().click();
    await page.waitForTimeout(1000);
  } else {
    // Render the SmartVoidModal standalone in a lightweight test route or mount
    await page.evaluate(() => {
      // Find void trigger button in the page
      const btn = document.querySelector('button[title*="Smart Void"], button:has-text("Void")');
      if (btn) btn.click();
    });
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase5_smart_void_modal.png') });
  console.log('📸 Captured: phase5_smart_void_modal.png');

  await browser.close();
  console.log('✅ Finished!');
})();
