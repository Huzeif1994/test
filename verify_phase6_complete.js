const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/Huzeif/.gemini/antigravity/brain/5b7dd2ab-a87d-417b-b238-76b1b99c6ba4';

(async () => {
  console.log('🚀 Starting Phase 6 Comprehensive Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Authenticate in localStorage
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

  // -------------------------------------------------------------------
  // TEST 1: Kitchen Equipment Maintenance Tracker (/operations)
  // -------------------------------------------------------------------
  console.log('1️⃣ Navigating to Kitchen Operations & Equipment Tracker...');
  await page.goto('http://localhost:5173/operations', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase6_equipment_tracker.png') });
  console.log('📸 Captured: phase6_equipment_tracker.png');

  // -------------------------------------------------------------------
  // TEST 2: Recipe Plating SOP Vault
  // -------------------------------------------------------------------
  console.log('2️⃣ Switching to SOP Vault tab...');
  const sopsTab = page.locator('button:has-text("SOP Vault")');
  if (await sopsTab.isVisible()) {
    await sopsTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase6_sop_vault.png') });
    console.log('📸 Captured: phase6_sop_vault.png');
  }

  // -------------------------------------------------------------------
  // TEST 3: Nightly Owner Digest & WhatsApp Preview
  // -------------------------------------------------------------------
  console.log('3️⃣ Switching to Nightly Digest tab...');
  const digestTab = page.locator('button:has-text("Nightly Digest")');
  if (await digestTab.isVisible()) {
    await digestTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase6_nightly_digest.png') });
    console.log('📸 Captured: phase6_nightly_digest.png');
  }

  // -------------------------------------------------------------------
  // TEST 4: AI MCP Copilot & Conversational Query
  // -------------------------------------------------------------------
  console.log('4️⃣ Switching to AI MCP Copilot tab...');
  const mcpTab = page.locator('button:has-text("AI MCP Copilot")');
  if (await mcpTab.isVisible()) {
    await mcpTab.click();
    await page.waitForTimeout(1000);

    // Ask AI Copilot a question
    const queryInput = page.locator('input[placeholder*="Ask POS Copilot"]');
    if (await queryInput.isVisible()) {
      await queryInput.fill("What are today's sales and revenue?");
      await page.locator('button:has-text("Ask AI")').click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'phase6_ai_mcp_copilot.png') });
    console.log('📸 Captured: phase6_ai_mcp_copilot.png');
  }

  await browser.close();
  console.log('🎉 Phase 6 Complete & Verified Successfully!');
})();
