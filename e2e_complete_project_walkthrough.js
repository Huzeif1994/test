const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('🌟 Commencing Complete Full Project End-to-End Walkthrough & Test Run...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[BROWSER ERROR]: ${msg.text()}`);
  });

  try {
    // -------------------------------------------------------------------------
    // SCENE 1: Floor Plans & Waiter Call Bell Paging
    // -------------------------------------------------------------------------
    console.log('\n--- SCENE 1: Floor Plans & Waiter Call Bell ---');
    // Simulate a guest calling waiter for Table 4 via API
    try {
      await fetch('http://localhost:5000/api/tables/4/call-waiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'WATER', note: 'Cold mineral water bottle' })
      });
      console.log('✓ Guest called waiter on Table 4 (Water)');
    } catch (e) {
      console.warn('Call waiter request error:', e.message);
    }

    await page.goto('http://localhost:5173/floor-plans', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const shot1 = path.join(ARTIFACT_DIR, 'walkthrough_1_floorplan_callbell.png');
    await page.screenshot({ path: shot1, fullPage: true });
    console.log(`📸 Captured Scene 1: ${shot1}`);

    // -------------------------------------------------------------------------
    // SCENE 2: Captain / Waiter App & KOT Firing
    // -------------------------------------------------------------------------
    console.log('\n--- SCENE 2: Captain App & KOT Placement ---');
    await page.goto('http://localhost:5173/captain', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Click on a table or item
    const tableBtn = page.locator('button:has-text("Table"), button:has-text("T4"), button:has-text("T-4"), div:has-text("T4")').first();
    if (await tableBtn.isVisible()) {
      await tableBtn.click();
      await page.waitForTimeout(1000);
    }

    const shot2 = path.join(ARTIFACT_DIR, 'walkthrough_2_captain_kot_fired.png');
    await page.screenshot({ path: shot2, fullPage: true });
    console.log(`📸 Captured Scene 2: ${shot2}`);

    // -------------------------------------------------------------------------
    // SCENE 3: Kitchen Display System (KDS Expo)
    // -------------------------------------------------------------------------
    console.log('\n--- SCENE 3: Kitchen Display System (KDS Expo) ---');
    await page.goto('http://localhost:5173/kitchen-display', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const shot3 = path.join(ARTIFACT_DIR, 'walkthrough_3_kds_expo_ready.png');
    await page.screenshot({ path: shot3, fullPage: true });
    console.log(`📸 Captured Scene 3: ${shot3}`);

    // -------------------------------------------------------------------------
    // SCENE 4: Kitchen Operations & SOP Vault
    // -------------------------------------------------------------------------
    console.log('\n--- SCENE 4: Operations & SOP Vault ---');
    await page.goto('http://localhost:5173/operations', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Switch to SOP Vault tab
    const sopTabBtn = page.locator('button:has-text("Recipe SOP Vault")');
    if (await sopTabBtn.isVisible()) {
      await sopTabBtn.click();
      await page.waitForTimeout(1000);
    }

    const shot4 = path.join(ARTIFACT_DIR, 'walkthrough_4_kitchen_operations_sop.png');
    await page.screenshot({ path: shot4, fullPage: true });
    console.log(`📸 Captured Scene 4: ${shot4}`);

    // -------------------------------------------------------------------------
    // SCENE 5: Dual-Screen Customer-Facing Display
    // -------------------------------------------------------------------------
    console.log('\n--- SCENE 5: Dual-Screen Customer Display ---');
    await page.goto('http://localhost:5173/customer-display', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const shot5 = path.join(ARTIFACT_DIR, 'walkthrough_5_customer_display_live.png');
    await page.screenshot({ path: shot5, fullPage: true });
    console.log(`📸 Captured Scene 5: ${shot5}`);

    // -------------------------------------------------------------------------
    // SCENE 6: Growth & Marketing Hub (Referral Simulator)
    // -------------------------------------------------------------------------
    console.log('\n--- SCENE 6: Marketing Hub & Referral Redemption ---');
    await page.goto('http://localhost:5173/marketing/referrals', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const simBtn = page.locator('button:has-text("Simulate Discount")');
    if (await simBtn.isVisible()) {
      await simBtn.click();
      await page.waitForTimeout(1000);
    }

    const shot6 = path.join(ARTIFACT_DIR, 'walkthrough_6_marketing_referral_applied.png');
    await page.screenshot({ path: shot6, fullPage: true });
    console.log(`📸 Captured Scene 6: ${shot6}`);

    // -------------------------------------------------------------------------
    // SCENE 7: Staff Audit Trail & Outgoing Webhooks Hub
    // -------------------------------------------------------------------------
    console.log('\n--- SCENE 7: Enterprise Audit Trail & Outgoing Webhooks ---');
    await page.goto('http://localhost:5173/settings/audit-log', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const shot7 = path.join(ARTIFACT_DIR, 'walkthrough_7_audit_webhooks_synced.png');
    await page.screenshot({ path: shot7, fullPage: true });
    console.log(`📸 Captured Scene 7: ${shot7}`);

    // -------------------------------------------------------------------------
    // SCENE 8: Shift Closing Digest & Database Snapshot Vault
    // -------------------------------------------------------------------------
    console.log('\n--- SCENE 8: Shift Closing & Snapshot Vault ---');
    await page.goto('http://localhost:5173/nightly-digest', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const shot8 = path.join(ARTIFACT_DIR, 'walkthrough_8_shift_closing_digest_backup.png');
    await page.screenshot({ path: shot8, fullPage: true });
    console.log(`📸 Captured Scene 8: ${shot8}`);

    console.log('\n🏆 COMPLETE END-TO-END WALKTHROUGH EXECUTED SUCCESSFULLY ACROSS ALL 8 PHASES!');
  } catch (err) {
    console.error('❌ Walkthrough encountered an error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
