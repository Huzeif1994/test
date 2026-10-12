import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(process.env.BASE_URL || 'https://ftx.dev.ftxcommerce.com/');
});
