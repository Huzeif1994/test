const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  
  // 1. Tablet Home (820x1180)
  const context = await browser.newContext({ viewport: { width: 820, height: 1180 }, isMobile: true });
  const page = await context.newPage();
  await page.goto('http://localhost:5173/apps');
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'mock-admin-token');
    localStorage.setItem('user', JSON.stringify({ role: 'ADMIN', name: 'Admin Huzeif' }));
  });
  await page.goto('http://localhost:5173/home', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4/inspect_tablet_home.png', fullPage: false });

  // 2. Tablet Floor Plans
  await page.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4/inspect_tablet_pos.png', fullPage: false });

  console.log('Saved both inspect_tablet_home.png and inspect_tablet_pos.png');
  await browser.close();
})();

