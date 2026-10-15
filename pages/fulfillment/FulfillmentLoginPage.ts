import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { config } from '../../config/environment';

export class FulfillmentLoginPage extends BasePage {
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

  async login(user: string = config.fulfillment.user, password?: string): Promise<void> {
    const pass = password || config.fulfillment.password || '';

    // Wait for landing login button and click
    await this.landingLoginButton.waitFor({ state: 'visible', timeout: 30000 });
    await Promise.all([
      this.page.waitForURL(/dev-identity/i, { timeout: 30000 }),
      this.landingLoginButton.click(),
    ]);

    // Switch to Email if required
    if (await this.useEmailLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.useEmailLink.click();
      await this.page.waitForTimeout(1000);
    }

    // Wait for loader overlay to disappear and email input to be visible
    await this.page.locator('#divloader').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await this.emailInput.waitFor({ state: 'visible', timeout: 30000 });
    await this.emailInput.fill(user);
    await this.passwordInput.fill(pass);

    // Submit and wait for redirect back to Fulfillment app
    const targetHostname = new URL(config.fulfillment.baseUrl).hostname.replace(/\./g, '\\.');
    await this.submitSignInButton.click({ force: true });

    // Wait until browser redirects back to Fulfillment app (away from Identity server)
    await expect(this.page).toHaveURL(new RegExp(`^https?://${targetHostname}`), { timeout: 60000 });

    await this.page.waitForTimeout(2000);
  }

  async expectLoggedIn(): Promise<void> {
    const origin = new URL(config.fulfillment.baseUrl).origin.replace(/\./g, '\\.');
    await expect(this.page).toHaveURL(new RegExp(`^${origin}`));

    // Wait 2 seconds so the user can visually confirm the real dashboard is loaded
    await this.page.waitForTimeout(2000);
  }
}
