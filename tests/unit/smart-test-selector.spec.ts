import { test, expect } from '@playwright/test';
import { selectTests, normalizePath } from '../../scripts/smart-test-selector';

test.describe('Smart Test Selector — Unit Test Suite', () => {
  test('should normalize Windows backslashes to forward slashes', () => {
    expect(normalizePath('pages\\ordering\\Storefront.ts')).toBe('pages/ordering/Storefront.ts');
  });

  test('should handle empty changed files array when git is trusted', () => {
    const result = selectTests([], { isGitTrusted: true });
    expect(result.allTests).toBeFalsy();
    expect(result.projects.size).toBe(0);
    expect(result.testFiles.size).toBe(0);
  });

  test('should fail-safe trigger full test suite when Git is untrusted (shallow clone / git error)', () => {
    const result = selectTests([], {
      isGitTrusted: false,
      failureReason: 'git diff failed (shallow clone)',
    });
    expect(result.allTests).toBeTruthy();
    expect(result.projects.size).toBe(4);
    expect(result.isGitTrusted).toBeFalsy();
    expect(result.reason).toContain('Git change calculation is uncertain');
  });

  test('should map Storefront changes to ordering and e2e-bridge', () => {
    const result = selectTests(['pages/ordering/OrderingStorefrontPage.ts']);
    expect(result.allTests).toBeFalsy();
    expect(result.projects.has('ordering')).toBeTruthy();
    expect(result.projects.has('e2e-bridge')).toBeTruthy();
    expect(result.projects.has('admin')).toBeFalsy();
  });

  test('should map Fulfillment changes to fulfillment and e2e-bridge', () => {
    const result = selectTests(['pages/fulfillment/orders/PendingOrdersPage.ts']);
    expect(result.allTests).toBeFalsy();
    expect(result.projects.has('fulfillment')).toBeTruthy();
    expect(result.projects.has('e2e-bridge')).toBeTruthy();
    expect(result.projects.has('admin')).toBeFalsy();
  });

  test('should map Admin portal changes strictly to admin project', () => {
    const result = selectTests(['pages/admin/AdminAgeVerificationPage.ts']);
    expect(result.allTests).toBeFalsy();
    expect(result.projects.has('admin')).toBeTruthy();
    expect(result.projects.has('ordering')).toBeFalsy();
    expect(result.projects.has('fulfillment')).toBeFalsy();
  });

  test('should trigger full suite when shared BasePage.ts is modified', () => {
    const result = selectTests(['pages/BasePage.ts']);
    expect(result.allTests).toBeTruthy();
    expect(result.projects.size).toBe(4);
    expect(result.reason).toContain('Shared architectural dependency');
  });

  test('should trigger full suite when shared fixtures/ are modified', () => {
    const result = selectTests(['fixtures/pages.ts']);
    expect(result.allTests).toBeTruthy();
    expect(result.projects.size).toBe(4);
  });

  test('should trigger full suite when global configuration changes', () => {
    const result = selectTests(['playwright.config.ts']);
    expect(result.allTests).toBeTruthy();
    expect(result.projects.size).toBe(4);
  });

  test('should detect documentation-only modifications', () => {
    const result = selectTests(['README.md', 'AGENT_CONTEXT.md']);
    expect(result.allTests).toBeFalsy();
    expect(result.docsOnly).toBeTruthy();
    expect(result.projects.size).toBe(0);
  });

  test('should trigger fail-safe full suite on unknown/unmapped source files', () => {
    const result = selectTests(['legacy/custom-unmapped-module.ts']);
    expect(result.allTests).toBeTruthy();
    expect(result.projects.size).toBe(4);
    expect(result.reason).toContain('Defaulting to full test suite for fail-safe safety');
  });
});
