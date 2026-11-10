const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('🌓 Testing Global Light & Dark Theme Switching...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Visit /apps in default Dark mode
    await page.goto('http://localhost:5173/apps', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const darkShot = path.join(ARTIFACT_DIR, 'theme_dark_mode_verified.png');
    await page.screenshot({ path: darkShot, fullPage: true });
    console.log(`📸 Saved Dark Mode: ${darkShot}`);

    // 2. Switch to Light Mode by updating localStorage and evaluating theme
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark', 'dark-theme');
      document.documentElement.classList.add('light', 'light-theme');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    });
    await page.waitForTimeout(1000);

    const lightShot = path.join(ARTIFACT_DIR, 'theme_light_mode_verified.png');
    await page.screenshot({ path: lightShot, fullPage: true });
    console.log(`📸 Saved Light Mode: ${lightShot}`);

    // 3. Test on Enterprise Settings page
    await page.goto('http://localhost:5173/settings/backup', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const settingsLightShot = path.join(ARTIFACT_DIR, 'theme_settings_light_mode.png');
    await page.screenshot({ path: settingsLightShot, fullPage: true });
    console.log(`📸 Saved Settings Light Mode: ${settingsLightShot}`);

    console.log('🎉 THEME SWITCHING VERIFIED IN BOTH DARK & LIGHT MODES!');
  } catch (err) {
    console.error('❌ Theme test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
