const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Comprehensive RBAC & Role Enforcement Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  try {
    // ==========================================
    // PHASE 1: WAITER ROLE ENFORCEMENT & 403 GUARDS
    // ==========================================
    console.log('\n--- Phase 1: Waiter Role Route Guards (403 Forbidden) ---');
    
    // Seed localStorage as Waiter
    await page.goto('http://127.0.0.1:5173/login');
    await page.evaluate(() => {
      const waiterUser = {
        id: 'emp-waiter-1',
        name: 'Rahul Sharma',
        role: 'WAITER',
        pin: '1234'
      };
      localStorage.setItem('authToken', 'mock-waiter-token-12345');
      localStorage.setItem('user', JSON.stringify(waiterUser));
      localStorage.setItem('employee', JSON.stringify(waiterUser));
    });

    // Test 1: Access /settings as WAITER -> Should trigger 403 Forbidden
    await page.goto('http://127.0.0.1:5173/settings');
    await page.waitForTimeout(1000);
    const settingsForbidden = await page.getByText(/Access Denied \(403 Forbidden\)/i).isVisible();
    assert(settingsForbidden, 'Waiter blocked from /settings with 403 Access Denied');

    // Test 2: Access /orders/approvals as WAITER -> Should trigger 403 Forbidden
    await page.goto('http://127.0.0.1:5173/orders/approvals');
    await page.waitForTimeout(1000);
    const approvalsForbidden = await page.getByText(/Access Denied \(403 Forbidden\)/i).isVisible();
    assert(approvalsForbidden, 'Waiter blocked from /orders/approvals with 403 Access Denied');

    // Test 3: Access /accounting/journal as WAITER -> Should trigger 403 Forbidden
    await page.goto('http://127.0.0.1:5173/accounting/journal');
    await page.waitForTimeout(1000);
    const accountingForbidden = await page.getByText(/Access Denied \(403 Forbidden\)/i).isVisible();
    assert(accountingForbidden, 'Waiter blocked from /accounting/journal with 403 Access Denied');

    // Test 4: Access /reports/profit-loss as WAITER -> Should trigger 403 Forbidden
    await page.goto('http://127.0.0.1:5173/reports/profit-loss');
    await page.waitForTimeout(1000);
    const plForbidden = await page.getByText(/Access Denied \(403 Forbidden\)/i).isVisible();
    assert(plForbidden, 'Waiter blocked from /reports/profit-loss with 403 Access Denied');

    // Test 5: Access /hrm/employees as WAITER -> Should trigger 403 Forbidden
    await page.goto('http://127.0.0.1:5173/hrm/employees');
    await page.waitForTimeout(1000);
    const hrmForbidden = await page.getByText(/Access Denied \(403 Forbidden\)/i).isVisible();
    assert(hrmForbidden, 'Waiter blocked from /hrm/employees with 403 Access Denied');

    // ==========================================
    // PHASE 2: WAITER SIDEBAR RBAC FILTERING
    // ==========================================
    console.log('\n--- Phase 2: Waiter Sidebar Recursive RBAC Filtering ---');
    await page.goto('http://127.0.0.1:5173/orders');
    await page.waitForTimeout(1200);

    // Verify allowed sections are visible
    const salesVisible = await page.getByText(/Sales/i).first().isVisible();
    assert(salesVisible, 'Sales section is visible to Waiter in sidebar');

    // Verify forbidden sections/items are absent
    const accountingInSidebar = await page.getByText(/^Accounting$/i).count();
    assert(accountingInSidebar === 0, 'Accounting section completely hidden from Waiter sidebar');

    const hrmInSidebar = await page.getByText(/^HRM$/i).count();
    assert(hrmInSidebar === 0, 'HRM section completely hidden from Waiter sidebar');

    const settingsInSidebar = await page.getByText(/^Settings$/i).count();
    assert(settingsInSidebar === 0, 'Settings section completely hidden from Waiter sidebar');

    // ==========================================
    // PHASE 3: CAPTAIN & WAITER APP RBAC & PIN UNLOCK
    // ==========================================
    console.log('\n--- Phase 3: Handheld Captain App Mode Lock & Supervisor PIN ---');
    await page.goto('http://127.0.0.1:5173/captain');
    await page.waitForTimeout(1500);

    // 1. Role Badge displayed in header
    const waiterBadge = await page.getByText('WAITER').first().isVisible();
    assert(waiterBadge, 'Header displays WAITER role badge for active staff');

    // 2. Lock icon on Captain toggle button
    const captainButtonWithLock = await page.getByRole('button', { name: /Captain.*🔒/i }).first().isVisible();
    assert(captainButtonWithLock, 'Captain mode button shows 🔒 lock badge for Waiter role');

    // 3. Click Captain Mode button -> Prompts Supervisor PIN modal
    await page.getByRole('button', { name: /Captain.*🔒/i }).first().click();
    await page.waitForTimeout(500);

    const pinModalVisible = await page.getByText(/Supervisor Mode Authorization/i).first().isVisible();
    assert(pinModalVisible, 'Supervisor Mode Authorization PIN modal appears upon Captain mode request');

    // 4. Enter invalid PIN
    const pinInput = page.locator('input[placeholder="e.g. 9999"]');
    await pinInput.fill('1111');
    await page.getByRole('button', { name: /Authorize Captain/i }).click();
    await page.waitForTimeout(800);
    const pinError = await page.getByText(/Invalid/i).first().isVisible();
    assert(pinError, 'Invalid PIN rejection verified with error alert');

    // 5. Enter valid Supervisor PIN (9999 Vikram Singhania Captain / 8888 Rajesh Manager)
    await pinInput.fill('9999');
    await page.getByRole('button', { name: /Authorize Captain/i }).click();
    await page.waitForTimeout(1200);

    // 6. Verify Captain Mode is unlocked
    const pinModalClosed = !(await page.getByText(/Supervisor Mode Authorization/i).isVisible());
    const captainNotif = await page.getByText(/Captain Mode Unlocked/i).first().isVisible().catch(() => false);
    assert(pinModalClosed || captainNotif, 'Captain Mode successfully unlocked with supervisor PIN 9999');

    // ==========================================
    // PHASE 4: ADMIN UNRESTRICTED ACCESS
    // ==========================================
    console.log('\n--- Phase 4: Admin Unrestricted Route Access ---');
    await page.evaluate(() => {
      const adminUser = {
        id: 'emp-admin-1',
        name: 'Super Administrator',
        role: 'ADMIN',
        pin: '0000'
      };
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('employee', JSON.stringify(adminUser));
    });

    // Test Admin access to /settings
    await page.goto('http://127.0.0.1:5173/settings');
    await page.waitForTimeout(1000);
    const adminSettingsForbidden = await page.getByText(/Access Denied \(403 Forbidden\)/i).isVisible();
    assert(!adminSettingsForbidden, 'Admin is NOT blocked from /settings');

    // Test Admin access to /orders/approvals
    await page.goto('http://127.0.0.1:5173/orders/approvals');
    await page.waitForTimeout(1000);
    const adminApprovalsForbidden = await page.getByText(/Access Denied \(403 Forbidden\)/i).isVisible();
    assert(!adminApprovalsForbidden, 'Admin is NOT blocked from /orders/approvals');

    console.log(`\n==========================================`);
    console.log(`RBAC Verification Complete: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`==========================================\n`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL ENTERPRISE RBAC GUARDS & CONTROLS FULLY OPERATIONAL!');
    } else {
      console.warn('⚠️ Some tests did not pass. Check output above.');
    }

  } catch (err) {
    console.error('Fatal error during RBAC test execution:', err);
  } finally {
    await browser.close();
  }
})();
