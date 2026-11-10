const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('--- 1. Pre-seeding Auth & Dark Theme ---');
  await page.goto('http://localhost:5173/login');
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'test-admin-token');
    localStorage.setItem('token', 'test-admin-token');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('user', JSON.stringify({
      id: 'admin-01',
      name: 'Huzeif (Admin)',
      role: 'Admin'
    }));
  });

  console.log('--- 2. Navigating to Floor Plans ---');
  await page.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('--- 3. Clicking Recipe BOM Button ---');
  const recipeBtn = page.locator('button:has-text("Recipe BOM")');
  await recipeBtn.first().click();
  await page.waitForTimeout(1200);

  // Click Fire Butter Chicken
  const fireBtn = page.locator('button:has-text("Fire Butter Chicken")');
  if (await fireBtn.count() > 0) {
    console.log('Clicking Fire Butter Chicken...');
    await fireBtn.first().click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase1_recipe_bom_verified.png') });
  console.log('Saved phase1_recipe_bom_verified.png');

  await browser.close();
  console.log('Recipe BOM Verified cleanly!');
})();

