const { chromium } = require('playwright');
const path = require('path');

async function run() {
  console.log('--- Verifying KDS & KOT-8773 ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const artifactDir = 'C:\\Users\\Huzeif\\.gemini\\antigravity\\brain\\5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

  try {
    await page.goto('http://localhost:5173/login');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'test-admin-token');
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('user', JSON.stringify({
        id: 'admin-01',
        name: 'Executive Manager',
        role: 'ADMIN',
        email: 'admin@ftxpos.com'
      }));
    });

    console.log('Navigating to http://localhost:5173/kitchen-display ...');
    await page.goto('http://localhost:5173/kitchen-display', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    const kdsPath = path.join(artifactDir, 'luxury_kds_verified.png');
    await page.screenshot({ path: kdsPath, fullPage: false });
    console.log(`Saved screenshot: ${kdsPath}`);

    // Filter by 8773
    const searchInput = page.locator('input[placeholder*="Search KOT"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('8773');
      await page.waitForTimeout(1000);
      const kdsSearchPath = path.join(artifactDir, 'luxury_kds_search_8773.png');
      await page.screenshot({ path: kdsSearchPath, fullPage: false });
      console.log(`Saved screenshot: ${kdsSearchPath}`);
    }

    console.log('--- KDS VERIFICATION COMPLETE ---');
  } catch (err) {
    console.error('KDS verification error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();

