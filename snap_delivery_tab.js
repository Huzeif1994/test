const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/floor-plans');
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'token-emp-admin-1');
    localStorage.setItem('token', 'token-emp-admin-1');
    localStorage.setItem('employee', JSON.stringify({ id: 'emp-admin-1', name: 'Admin', role: 'ADMIN' }));
    localStorage.setItem('user', JSON.stringify({ id: 'emp-admin-1', name: 'Admin', role: 'ADMIN' }));
  });
  await page.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
  await page.click('button:has-text("Delivery / Online")');
  await page.waitForTimeout(1500);
  const outPath = 'C:\\Users\\Huzeif\\.gemini\\antigravity\\brain\\5b7dd2ab-a87d-417b-b238-76b1b99c6ba4\\scratch\\delivery_tab_in_floor_plans.png';
  await page.screenshot({ path: outPath });
  console.log('Saved to', outPath);
  await browser.close();
})();

