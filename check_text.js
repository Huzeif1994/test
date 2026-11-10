const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);
  const loginText = await page.innerText('body');
  console.log('=== LOGIN TEXT ===');
  console.log(loginText.slice(0, 500));

  for (let i = 0; i < 4; i++) await page.keyboard.press('0');
  await page.waitForTimeout(2000);
  const homeText = await page.innerText('body');
  console.log('=== HOME TEXT (first 500) ===');
  console.log(homeText.slice(0, 500));
  await browser.close();
})();

