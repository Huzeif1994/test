import { test, expect } from '@playwright/test';
import { getRequiredSecret, getBaseUrl } from '../../config/environment';

test.describe('Environment & Secrets Security — Unit Test Suite', () => {
  const originalEnv = { ...process.env };

  test.beforeEach(() => {
    delete process.env.SKIP_CREDENTIAL_CHECK;
    delete process.env.TEST_SECRET_KEY;
  });

  test.afterAll(() => {
    process.env = originalEnv;
  });

  test('should throw immediately when mandatory secret is missing (Fail-Fast)', () => {
    expect(() => getRequiredSecret('NON_EXISTENT_SECRET_XYZ', 'Test App')).toThrow(
      /\[Security Gate\] Missing required credential secret/
    );
  });

  test('should return trimmed secret value when configured', () => {
    process.env.TEST_SECRET_KEY = '  valid_secret_123  ';
    const val = getRequiredSecret('TEST_SECRET_KEY', 'Test App');
    expect(val).toBe('valid_secret_123');
  });

  test('should allow explicit bypass for dry-run workflows via SKIP_CREDENTIAL_CHECK=true', () => {
    process.env.SKIP_CREDENTIAL_CHECK = 'true';
    const val = getRequiredSecret('NON_EXISTENT_SECRET_XYZ', 'Test App');
    expect(val).toBe('');
  });

  test('should resolve base URL with environment override or default', () => {
    expect(getBaseUrl('CUSTOM_URL_TEST', 'https://default.url.com')).toBe('https://default.url.com');
    process.env.CUSTOM_URL_TEST = 'https://custom.override.com';
    expect(getBaseUrl('CUSTOM_URL_TEST', 'https://default.url.com')).toBe('https://custom.override.com');
  });
});
