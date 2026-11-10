const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/floor-plans');
  await page.waitForTimeout(2000);
  console.log('Current URL:', page.url());
  const btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean));
  console.log('Found buttons:', btns);
  await browser.close();
})();

