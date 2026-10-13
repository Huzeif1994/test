import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

/**
 * Custom fixtures: tests mein seedha `homePage` mil jayega,
 * `new HomePage(page)` har jagah nahi likhna padega.
 * Naya page banao to yahan add karo (LoginPage, CartPage...).
 */
type Pages = {
  homePage: HomePage;
};

export const test = base.extend<Pages>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});

export { expect } from '@playwright/test';
