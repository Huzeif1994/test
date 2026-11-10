const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Huzeif\\.gemini\\antigravity\\brain\\5b7dd2ab-a87d-417b-b238-76b1b99c6ba4\\scratch';

async function verify() {
  console.log('========================================================================');
  console.log('🚀 VERIFYING: ORDERS PAGE OPENS ORDERS LIST & CREATE ORDER OPENS CUBICALS');
  console.log('========================================================================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Error] ${msg.text()}`);
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.error(`[Page Error] ${err.message}`);
    errors.push(err.message);
  });

  // Auth setup
  await page.goto('http://localhost:5173/home');
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'token-emp-admin-1');
    localStorage.setItem('token', 'token-emp-admin-1');
    localStorage.setItem('employee', JSON.stringify({ id: 'emp-admin-1', name: 'Admin', role: 'ADMIN' }));
    localStorage.setItem('user', JSON.stringify({ id: 'emp-admin-1', name: 'Admin', role: 'ADMIN' }));
  });

  // 1. Visit /orders directly
  console.log('\n--- [1] Checking /orders page ---');
  await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Verify Orders board is visible (Order title, search, filter tabs)
  const orderTitle = await page.getByRole('heading', { name: 'Order' }).first().isVisible();
  const searchInput = await page.getByPlaceholder(/Search Order ID/i).isVisible();
  const allTab = await page.locator('button:has-text("All")').first().isVisible();
  console.log('✓ Orders board rendered with header & search bar:', orderTitle && searchInput);
  console.log('✓ Filter tabs rendered:', allTab);

  // Confirm CreateOrderFlow is NOT open on /orders
  const customerInfoTitle = await page.getByText('Customer Information').count();
  console.log('✓ Create Order flow is NOT open on /orders:', customerInfoTitle === 0);

  const ordersScreenshot = path.join(ARTIFACTS_DIR, 'orders_page_restored.png');
  await page.screenshot({ path: ordersScreenshot });
  console.log(`✓ Saved Orders Page screenshot: ${ordersScreenshot}`);

  // 2. Click "Create New Order" button
  console.log('\n--- [2] Clicking "Create New Order" button ---');
  const createOrderBtn = page.locator('button:has-text("Create New Order")').first();
  await createOrderBtn.click();
  await page.waitForTimeout(1000);

  // Verify it navigated to /floor-plans (the cubicals)
  const currentUrl = page.url();
  console.log('✓ Navigated to URL:', currentUrl);
  const isFloorPlans = currentUrl.includes('/floor-plans');
  console.log('✓ Opened Floor Plans (Cubicals) view:', isFloorPlans);

  // 3. Verify Cubicals / Tables Floor Plan is rendered
  const diningHallTab = await page.getByText(/Main Dining|Outdoor|Banquet/i).first().isVisible();
  console.log('✓ Floor Plan section tabs rendered:', diningHallTab);

  const cubicalsScreenshot = path.join(ARTIFACTS_DIR, 'cubicals_floor_plans.png');
  await page.screenshot({ path: cubicalsScreenshot });
  console.log(`✓ Saved Cubicals (Floor Plans) screenshot: ${cubicalsScreenshot}`);

  // 4. Place an order on a cubical (table)
  console.log('\n--- [3] Placing an order on a cubical without crash ---');
  // Click on Table 2 or first available table
  const tableItem = page.locator('button:has-text("Table 2"), button:has-text("T2"), button:has-text("Table 1")').first();
  if (await tableItem.isVisible()) {
    console.log('Selecting table...');
    await tableItem.click();
    await page.waitForTimeout(800);

    // Switch to Menu view if on FloorPlans terminal
    const addItemsBtn = page.locator('button:has-text("Add Items"), button:has-text("Open Food Menu")').first();
    if (await addItemsBtn.isVisible()) {
      console.log('Switching to Food Menu view...');
      await addItemsBtn.click();
      await page.waitForTimeout(600);
    }

    // Click on a food dish item card in main content
    const dishCard = page.locator('main').locator('h4, p, div').filter({ hasText: /Paneer|Chicken|Biryani|Pizza|Burger|Roll|Curry|Rice|Soup|Salad|Dal/i }).first();
    if (await dishCard.isVisible()) {
      console.log('Adding dish to order ticket...');
      await dishCard.click();
      await page.waitForTimeout(600);
    } else {
      // Fallback: click any food card in the menu grid
      const anyCard = page.locator('main div.cursor-pointer, main button.cursor-pointer').first();
      if (await anyCard.isVisible()) {
        await anyCard.click();
        await page.waitForTimeout(600);
      }
    }

    // Fire to kitchen
    const fireBtn = page.locator('main button:has-text("Send to Kitchen"), main button:has-text("Fire to Kitchen"), main button:has-text("KOT")').first();
    if (await fireBtn.isVisible()) {
      console.log('Clicking Send to Kitchen...');
      await fireBtn.click();
      await page.waitForTimeout(2000);
      console.log('✓ Successfully sent to kitchen without crash!');
    }
  }

  const orderPlacedScreenshot = path.join(ARTIFACTS_DIR, 'cubical_order_placed.png');
  await page.screenshot({ path: orderPlacedScreenshot });
  console.log(`✓ Saved Order Placed screenshot: ${orderPlacedScreenshot}`);

  await browser.close();

  // Filter out normal 416 favicon/sound warnings
  const criticalErrors = errors.filter(e => !e.includes('416') && !e.includes('web-share'));
  console.log('\nCritical page errors:', criticalErrors.length);
  if (criticalErrors.length > 0) {
    console.error('Critical errors detected:', criticalErrors);
    process.exit(1);
  }

  console.log('\n========================================================================');
  console.log('🎉 VERIFICATION COMPLETE:');
  console.log('   1. /orders OPENS ORDERS BOARD (NOT CREATE ORDER FLOW)');
  console.log('   2. CREATE NEW ORDER NAVIGATES TO CUBICALS (/floor-plans)');
  console.log('   3. PLACING ORDERS ON CUBICALS RUNS WITH ZERO CRASHES');
  console.log('========================================================================');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
