import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  protected readonly path = '/';

  // ---- Locators (sirf yahin define honge) ----
  // Asli store ke locators header, search, login link yahan aayenge.

  // ---- Actions / Assertions ----
  async expectOnHomePage(): Promise<void> {
    const baseUrl = process.env.BASE_URL || 'https://ftx.dev.ftxcommerce.com';
    const hostname = new URL(baseUrl).hostname.replace(/\./g, '\\.');
    await expect(this.page).toHaveURL(new RegExp(hostname));
  }
}