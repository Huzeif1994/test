import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { config } from '../../config/environment';

export class AdminLoginPage extends BasePage {
  protected readonly path = '/';

  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[type="text"]').first();
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
  }

  async expectLoginPage(): Promise<void> {
    const hostname = new URL(config.admin.baseUrl).hostname.replace(/\./g, '\\.');
    await expect(this.page).toHaveURL(new RegExp(hostname));
  }

  async login(user: string = config.admin.user, password?: string): Promise<void> {
    const pass = password || config.admin.password || '';
    if (await this.emailInput.isVisible()) {
      await this.emailInput.fill(user);
    }
    if (await this.passwordInput.isVisible()) {
      await this.passwordInput.fill(pass);
    }
    if (await this.loginButton.isVisible()) {
      await this.loginButton.click();
    }
  }
}

