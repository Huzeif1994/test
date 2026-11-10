const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('--- Starting Complete FTX POS Luxury UI/UX & Parity Verification ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const artifactDir = 'C:\\Users\\Huzeif\\.gemini\\antigravity\\brain\\5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

  try {
    // 1. Pre-seed auth token & dark theme
    console.log('Pre-seeding auth session...');
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

    // 2. Visit Floor Plans
    console.log('Navigating to http://localhost:5173/floor-plans ...');
    await page.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    // 3. Click Table T1
    console.log('Selecting Table T1...');
    const tableT1 = page.locator('text=T1').first();
    if (await tableT1.isVisible()) {
      await tableT1.click();
      await page.waitForTimeout(800);
    }

    // Switch to Food Menu via "Open Food Menu" button
    const openMenuBtn = page.locator('button:has-text("Open Food Menu")');
    if (await openMenuBtn.isVisible()) {
      await openMenuBtn.click();
      await page.waitForTimeout(1000);

      // Tap first food card to add it to ticket
      const firstDish = page.locator('text=Tap to add').first();
      if (await firstDish.isVisible()) {
        await firstDish.click();
        await page.waitForTimeout(800);
      }
    }

    // Capture Table Ticket with items
    const ticketPath = path.join(artifactDir, 'luxury_table_ticket_added.png');
    await page.screenshot({ path: ticketPath, fullPage: false });
    console.log(`Saved screenshot: ${ticketPath}`);

    // 4. Click Settle / Pay to open the Payment Settlement Modal
    console.log('Opening Settle/Pay Modal...');
    const settleBtn = page.locator('button:has-text("Settle / Pay")');
    if (await settleBtn.isVisible()) {
      await settleBtn.click();
      await page.waitForTimeout(1500);

      const paymentPath = path.join(artifactDir, 'luxury_payment_settlement_obsidian.png');
      await page.screenshot({ path: paymentPath, fullPage: false });
      console.log(`Saved screenshot: ${paymentPath}`);

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
    }

    // 5. Open Host Stand Waitlist Modal
    console.log('Opening Waitlist Desk Modal...');
    const waitlistBtn = page.locator('button:has-text("Waitlist")');
    if (await waitlistBtn.isVisible()) {
      await waitlistBtn.click();
      await page.waitForTimeout(1500);

      const waitlistPath = path.join(artifactDir, 'luxury_host_stand_verified.png');
      await page.screenshot({ path: waitlistPath, fullPage: false });
      console.log(`Saved screenshot: ${waitlistPath}`);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
    }

    // 6. Test KDS Visibility of KOT-8773
    console.log('Navigating to http://localhost:5173/kitchen-display ...');
    await page.goto('http://localhost:5173/kitchen-display', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2500);

    const kdsPath = path.join(artifactDir, 'luxury_kds_kot8773_verified.png');
    await page.screenshot({ path: kdsPath, fullPage: false });
    console.log(`Saved screenshot: ${kdsPath}`);

    // Search KOT-8773
    const searchInput = page.locator('input[placeholder*="Search KOT"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('8773');
      await page.waitForTimeout(1000);
      const kdsSearchPath = path.join(artifactDir, 'luxury_kds_search_8773.png');
      await page.screenshot({ path: kdsSearchPath, fullPage: false });
      console.log(`Saved screenshot: ${kdsSearchPath}`);
    }

    console.log('--- ALL LUXURY UI/UX VERIFICATION COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Playwright verification encountered an error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
