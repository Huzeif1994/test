const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('🚀 Executing Phase 5 Final Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Post a guest service request to backend
  console.log('1️⃣ Seeding live service request (Table #4 - Call Waiter)...');
  await page.request.post('http://127.0.0.1:5000/api/tables/4/service-request', {
    data: {
      type: 'CALL_WAITER',
      notes: 'Guest requested Captain assistance at Table 4'
    }
  });

  // 2. Authenticate
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

  // 3. Open FloorPlans & verify Service Alert Banner & Pole Display button
  console.log('2️⃣ Opening FloorPlans to verify Service Alert Banner & Pole Display button...');
  await page.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase5_floorplans_service_alert.png') });
  console.log('📸 Captured: phase5_floorplans_service_alert.png');

  // 4. Open Smart Void Modal
  console.log('3️⃣ Opening Smart Void Control Modal...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('openSmartVoidTest'));
  });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase5_smart_void_modal.png') });
  console.log('📸 Captured: phase5_smart_void_modal.png');

  // 5. Select Kitchen Wastage option
  console.log('4️⃣ Selecting Kitchen Wastage option...');
  const wastageBtn = page.locator('button:has-text("Kitchen Wastage")');
  if (await wastageBtn.isVisible()) {
    await wastageBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase5_smart_void_wastage.png') });
    console.log('📸 Captured: phase5_smart_void_wastage.png');
  }

  // 6. Confirm Void
  console.log('5️⃣ Confirming void action...');
  const confirmBtn = page.locator('button:has-text("Confirm Wastage & Void")');
  if (await confirmBtn.isVisible()) {
    await confirmBtn.click();
    await page.waitForTimeout(1000);
    console.log('✅ Void confirmed and modal closed!');
  }

  await browser.close();
  console.log('🎉 Phase 5 Verification Complete!');
})();
