import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  protected readonly path = '/';

  // ---- Locators (sirf yahin define honge) ----
  // Abhi koi nahi. Asli store ka URL milne par header, search, login link yahan aayenge.

  constructor(page: Page) {
    super(page);
  }

  // ---- Actions / Assertions ----
  async expectOnHomePage(): Promise<void> {
    await expect(this.page).toHaveURL(/ftx\.dev\.ftxcommerce\.com/);
  }
}