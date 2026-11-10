const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin User', role: 'ADMIN' }));
    localStorage.setItem('employee', JSON.stringify({ id: 1, name: 'Admin User', role: 'ADMIN' }));
  });

  await page.goto('http://localhost:5173/floor-plans');
  await page.waitForTimeout(2000);

  // Click Delivery / Online
  await page.locator('button:has-text("Delivery / Online")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4/scratch/verify_delivery_full.png' });

  // Now click "+ New Direct Delivery" to verify modal
  await page.locator('button:has-text("New Direct Delivery")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4/scratch/verify_delivery_modal.png' });

  await browser.close();
  console.log('Done full delivery and modal screenshots');
})();
