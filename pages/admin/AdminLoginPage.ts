import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { config } from '../../config/environment';

export class AdminLoginPage extends BasePage {
  protected readonly path = '/';

  // Locators
  readonly landingLoginButton: Locator;
  readonly useEmailLink: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitSignInButton: Locator;

  constructor(page: Page) {
    super(page);

    this.landingLoginButton = page.getByRole('button', { name: 'Login', exact: true }).or(page.locator('button:has-text("Login")')).first();
    this.useEmailLink = page.locator('#lnkShowLoginByEmail');
    this.emailInput = page.locator('#LoginEmail, input[name="LoginEmail"], input#email, input#Username, input[type="email"]').first();
    this.passwordInput = page.locator('#Password, input[name="Password"], input[type="password"]').first();
    this.submitSignInButton = page.locator('#signin, input[type="submit"][value*="Sign In"]').first();
  }

  async login(user: string = config.admin.user, password?: string): Promise<void> {
    const pass = password || config.admin.password || '';

    // Click Login on landing page
    if (await this.landingLoginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await Promise.all([
        this.page.waitForURL(/dev-identity/i, { timeout: 30000 }),
        this.landingLoginButton.click(),
      ]);
    }
    await this.page.waitForTimeout(2000);

    // Switch to Email if required
    if (await this.useEmailLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.useEmailLink.click();
      await this.page.waitForTimeout(1000);
    }

    // Fill credentials
    await this.emailInput.fill(user);
    await this.passwordInput.fill(pass);

    // Submit and wait for redirect back
    const targetHost = new URL(config.admin.baseUrl).hostname.replace(/\./g, '\\.');
    await Promise.all([
      this.page.waitForURL(new RegExp(targetHost), { timeout: 45000 }).catch(() => {}),
      this.submitSignInButton.click(),
    ]);

    await this.page.waitForTimeout(3000);
  }

  async expectLoggedIn(): Promise<void> {
    const targetHost = new URL(config.admin.baseUrl).hostname.replace(/\./g, '\\.');
    await expect(this.page).toHaveURL(new RegExp(targetHost));
  }
}
