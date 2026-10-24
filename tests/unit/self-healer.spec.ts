import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  parsePlaywrightFailureOutput,
  generateResilientAlternativeLocators,
  patchPageObjectFile,
} from '../../scripts/ai-heal';

test.describe('Autonomous Self-Healer — Unit Test Suite', () => {
  const sampleTimeoutOutput = `
  1) [e2e-bridge] › tests/e2e-bridge/flow1.spec.ts:20:7 › Customer store pickup
    TimeoutError: locator.waitFor: Timeout 15000ms exceeded waiting for locator('button:has-text("CONFIRM")')
    =========================== logs ===========================
    waiting for locator('button:has-text("CONFIRM")') to be visible
    ============================================================
      at OrderingCheckoutPage.confirmOrder (c:\\Huzeif Data\\Basic Automaion\\playwright-huzeif-CICD-Docker-setup\\playwright-huzeif\\pages\\ordering\\OrderingCheckoutPage.ts:452:25)
      at c:\\Huzeif Data\\Basic Automaion\\playwright-huzeif-CICD-Docker-setup\\playwright-huzeif\\tests\\e2e-bridge\\flow1.spec.ts:35:10
  `;

  const sampleStrictModeOutput = `
  1) [fulfillment] › tests/fulfillment/pending.spec.ts:15:7 › Open order
    Error: strict mode violation: locator('.q-btn') resolved to 12 elements:
      at PendingOrdersPage.openOrderDetail (pages/fulfillment/orders/PendingOrdersPage.ts:88:15)
  `;

  test('should accurately parse Playwright failure output and isolate locator & Page Object', () => {
    const diagnosis = parsePlaywrightFailureOutput(sampleTimeoutOutput);

    expect(diagnosis.errorType).toBe('TIMEOUT_DRIFT');
    expect(diagnosis.pageObjectFile).toBe('pages/ordering/OrderingCheckoutPage.ts');
    expect(diagnosis.lineNumber).toBe(452);
    expect(diagnosis.failedLocator).toBe('button:has-text("CONFIRM")');
  });

  test('should detect strict mode violation errors and isolate target line', () => {
    const diagnosis = parsePlaywrightFailureOutput(sampleStrictModeOutput);

    expect(diagnosis.errorType).toBe('STRICT_MODE_VIOLATION');
    expect(diagnosis.pageObjectFile).toBe('pages/fulfillment/orders/PendingOrdersPage.ts');
    expect(diagnosis.lineNumber).toBe(88);
  });

  test('should generate ordered resilient locator alternatives', () => {
    const candidates = generateResilientAlternativeLocators('button:has-text("CONFIRM")');

    expect(candidates.length).toBeGreaterThan(0);
    // Should provide regex-based filter
    expect(candidates.some(c => c.includes('.filter({ hasText: /CONFIRM/i })'))).toBeTruthy();
    // Should provide getByRole accessibility locator
    expect(candidates.some(c => c.includes("getByRole('button'"))).toBeTruthy();
  });

  test('should generate Quasar toggle and switch alternatives for toggle failures', () => {
    const candidates = generateResilientAlternativeLocators('pay at store switch');

    expect(candidates.some(c => c.includes('.q-toggle') || c.includes('[role="switch"]'))).toBeTruthy();
  });

  test('should safely patch target file with resilient locator candidate', () => {
    const tmpFile = path.resolve('pages', 'tmp-healing-test.ts');
    const initialContent = `
export class TmpPage {
  readonly submitBtn = page.locator('button:has-text("Submit")');
}
`;
    fs.writeFileSync(tmpFile, initialContent, 'utf8');

    try {
      const patched = patchPageObjectFile(
        'pages/tmp-healing-test.ts',
        "button:has-text(\"Submit\")",
        "button, .q-btn').filter({ hasText: /Submit/i }).first("
      );

      expect(patched).toBeTruthy();
      const updated = fs.readFileSync(tmpFile, 'utf8');
      expect(updated).toContain('/Submit/i');
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });
});
