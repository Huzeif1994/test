const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('response', res => {
    if (res.status() >= 400) {
      console.log('FAILED REQUEST:', res.status(), res.request().method(), res.url());
    }
  });

  await page.goto('http://localhost:5173/home');
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'token-emp-admin-1');
    localStorage.setItem('token', 'token-emp-admin-1');
    localStorage.setItem('employee', JSON.stringify({ id: 'emp-admin-1', name: 'Admin', role: 'ADMIN' }));
    localStorage.setItem('user', JSON.stringify({ id: 'emp-admin-1', name: 'Admin', role: 'ADMIN' }));
  });

  await page.goto('http://localhost:5173/delivery', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await browser.close();
})();
