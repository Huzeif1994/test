import { test, expect } from '@playwright/test';
import { extractTags, deriveModule, deriveSuite, derivePriority, generateManifest } from '../../scripts/generate-manifest';

test.describe('Test Manifest & QA Catalog — Unit Test Suite', () => {
  test('should extract tags accurately from test title', () => {
    const title = 'Customer completes checkout with Pay At Store @ordering @checkout @critical';
    const tags = extractTags(title);
    expect(tags).toEqual(['@ordering', '@checkout', '@critical']);
  });

  test('should return empty array when no tags are present', () => {
    const tags = extractTags('Simple unit test without tags');
    expect(tags).toEqual([]);
  });

  test('should accurately derive domain module from file and tags', () => {
    expect(deriveModule('tests/ordering/checkout.spec.ts', ['@checkout'])).toBe('checkout');
    expect(deriveModule('tests/ordering/gift-card.spec.ts', ['@giftcard'])).toBe('giftcard');
    expect(deriveModule('tests/fulfillment/staging.spec.ts', ['@staging'])).toBe('staging');
    expect(deriveModule('tests/fulfillment/picking.spec.ts', ['@picking'])).toBe('picking');
    expect(deriveModule('tests/admin/smoke.spec.ts', ['@admin'])).toBe('admin');
  });

  test('should accurately classify test into suites (e2e, smoke, release-critical, regression)', () => {
    expect(deriveSuite(['@bridge', '@flow1'], 'e2e-bridge', 'Cross-app store pickup')).toBe('e2e');
    expect(deriveSuite(['@smoke'], 'ordering', 'Ordering storefront health check')).toBe('smoke');
    expect(deriveSuite(['@critical', '@checkout'], 'ordering', 'Customer completes checkout')).toBe('release-critical');
    expect(deriveSuite(['@catalog'], 'ordering', 'Customer views catalog')).toBe('regression');
  });

  test('should assign accurate priority based on suite and tags', () => {
    expect(derivePriority('e2e', ['@bridge'], 'Full E2E handover')).toBe('blocker');
    expect(derivePriority('release-critical', ['@critical'], 'Customer places order')).toBe('blocker');
    expect(derivePriority('regression', ['@catalog'], 'Customer views category')).toBe('normal');
  });

  test('should generate structured manifest with summary metrics and test cases', () => {
    const manifest = generateManifest('./tests');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.summary.totalTests).toBeGreaterThan(0);
    expect(manifest.summary.projects.ordering).toBeGreaterThan(0);
    expect(manifest.summary.projects.fulfillment).toBeGreaterThan(0);
    expect(manifest.summary.projects.admin).toBeGreaterThan(0);
    expect(manifest.summary.projects['e2e-bridge']).toBeGreaterThan(0);
    expect(manifest.tests.length).toBe(manifest.summary.totalTests);

    // Verify first test structure
    const firstTest = manifest.tests[0];
    expect(firstTest.id).toMatch(/^[A-Z]{3}-\d{3}$/);
    expect(firstTest.title).toBeTruthy();
    expect(firstTest.file).toContain('tests/');
    expect(firstTest.dependencies.length).toBeGreaterThan(0);
    expect(firstTest.estimatedDurationMs).toBeGreaterThan(0);
  });
});
