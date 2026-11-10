const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER_PAGE_ERROR:', err.message));
  
  await page.goto('http://localhost:5173/login');
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Admin', role: 'ADMIN' }));
  });

  await page.goto('http://localhost:5173/floor-plans');
  await page.waitForTimeout(2000);
  console.log('Page URL:', page.url());
  const bodyText = await page.innerText('body');
  console.log('Body Text snippet:', bodyText.slice(0, 300));
  await browser.close();
})();
