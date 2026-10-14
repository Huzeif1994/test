import { test, expect } from '@playwright/test';

test.describe('Test group', () => {
  // Marked as skip so empty seed does not pollute test results until implemented
  test.skip('seed', async ({ page }) => {
    // generate code here.
  });
});
