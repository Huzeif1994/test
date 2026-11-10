const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:5173/apps');
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'mock-admin-token');
    localStorage.setItem('user', JSON.stringify({ role: 'ADMIN', name: 'Admin Huzeif' }));
  });

  console.log('--- Navigating to /floor-plans ---');
  await page.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const shotPath = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4/inspect_mobile_screen.png';
  await page.screenshot({ path: shotPath, fullPage: false });
  console.log('Saved screenshot to', shotPath);

  const fullShotPath = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4/inspect_mobile_screen_full.png';
  await page.screenshot({ path: fullShotPath, fullPage: true });
  console.log('Saved full screenshot to', fullShotPath);

  const html = await page.evaluate(() => {
    return {
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      bodyColor: window.getComputedStyle(document.body).color,
      rootChildCount: document.querySelector('#root') ? document.querySelector('#root').children.length : 0,
      text: document.body.innerText.substring(0, 300)
    };
  });
  console.log('PAGE INFO:', html);

  // Now inspect tablet
  console.log('\n--- Navigating to /floor-plans on Tablet (820x1180) ---');
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
  await tabletPage.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
  await tabletPage.waitForTimeout(2000);

  const tabletShotPath = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4/inspect_tablet_screen.png';
  await tabletPage.screenshot({ path: tabletShotPath, fullPage: false });

  const tabletFullShotPath = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4/inspect_tablet_screen_full.png';
  await tabletPage.screenshot({ path: tabletFullShotPath, fullPage: true });

  await browser.close();
})();

