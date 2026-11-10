const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // 1. Login Screen Header
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Screenshot the login card brand
  const loginBrandShot = path.join(ARTIFACT_DIR, 'kroma_pure_login_header.png');
  await page.locator('div:has-text("KROMA POS"):not(:has-text("Start Your Shift"))').first().screenshot({ path: loginBrandShot });
  console.log('✅ Captured kroma_pure_login_header.png');

  // Login
  for (let i = 0; i < 4; i++) await page.keyboard.press('0');
  await page.waitForTimeout(2000);

  // 2. Sidebar Header
  const sidebarHeader = page.locator('aside > div').first();
  const sidebarBrandShot = path.join(ARTIFACT_DIR, 'kroma_pure_sidebar_header.png');
  await sidebarHeader.screenshot({ path: sidebarBrandShot });
  console.log('✅ Captured kroma_pure_sidebar_header.png');

  await browser.close();
})();

