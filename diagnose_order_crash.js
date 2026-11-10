const { chromium } = require('playwright');

async function testPlaceOrder() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]`, msg.text());
    if (msg.type() === 'error') errors.push(msg.text());
  });

  page.on('pageerror', err => {
    console.error('[PAGE CRASH ERROR]', err.message, err.stack);
    errors.push(err.message);
  });

  // Set Auth tokens
  await page.goto('http://localhost:5173/home');
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'token-emp-admin-1');
    localStorage.setItem('token', 'token-emp-admin-1');
    localStorage.setItem('employee', JSON.stringify({ id: 'emp-admin-1', name: 'Admin', role: 'ADMIN' }));
    localStorage.setItem('user', JSON.stringify({ id: 'emp-admin-1', name: 'Admin', role: 'ADMIN' }));
  });

  // 1. Visit /floor-plans (the cubicals)
  console.log('\n--- Navigating to /floor-plans ---');
  await page.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 2. Click on a table (cubicle)
  console.log('Selecting first vacant table...');
  const tableBtn = page.locator('button:has-text("Table"), div:has-text("Table"), button:has-text("T1"), button:has-text("T01")').first();
  if (await tableBtn.isVisible()) {
    await tableBtn.click();
    await page.waitForTimeout(500);
    console.log('Clicked table.');
  }

  // Check if Menu view is shown
  console.log('Adding menu items...');
  const foodItem = page.locator('div:has-text("Paneer"), div:has-text("Chicken"), div:has-text("Naan"), button:has-text("Add")').first();
  if (await foodItem.isVisible()) {
    await foodItem.click();
    await page.waitForTimeout(500);
    console.log('Clicked food item.');
  }

  // Try to send to kitchen
  console.log('Clicking "Send to Kitchen" or "Place Order"...');
  const sendBtn = page.locator('button:has-text("Send to Kitchen"), button:has-text("Fire to Kitchen"), button:has-text("Place Order")').first();
  if (await sendBtn.isVisible()) {
    console.log('Found send button, clicking...');
    await sendBtn.click();
    await page.waitForTimeout(1500);
    console.log('Clicked send button.');
  }

  // Now test placing order in CreateOrderFlow as well
  console.log('\n--- Testing CreateOrderFlow directly ---');
  await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // If there is Create New Order button
  const createOrderBtn = page.locator('button:has-text("Create New Order")');
  if (await createOrderBtn.isVisible()) {
    console.log('Checking where Create New Order leads...');
    await createOrderBtn.click();
    await page.waitForTimeout(1000);
    console.log('Current URL after clicking Create New Order:', page.url());
  }

  await browser.close();
  console.log('\nTotal errors caught:', errors.length);
}

testPlaceOrder().catch(console.error);
