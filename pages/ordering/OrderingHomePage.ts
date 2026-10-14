import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { config } from '../../config/environment';

export class OrderingHomePage extends BasePage {
  protected readonly path = '/';

  // Locators
  readonly disclaimerButton: Locator;
  readonly ageVerificationButton: Locator;
  readonly headerSignInButton: Locator;
  readonly drawerSignInButton: Locator;
  readonly useEmailLink: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitSignInButton: Locator;

  constructor(page: Page) {
    super(page);

    // Popups
    this.disclaimerButton = page.locator('button, a').filter({ hasText: /I understand\.?\s*Proceed to Store/i }).first();
    this.ageVerificationButton = page.locator('button, a').filter({ hasText: /21\+|I'm 21\+/i }).first();

    // Storefront Navigation
    this.headerSignInButton = page.locator('.account-notifaction, header button:has-text("Sign In"), header button:has-text("Sign In Account")').first();
    this.drawerSignInButton = page.locator('button, a').filter({ hasText: /^Sign In$/i }).last();

    // Identity Server Login Form
    this.useEmailLink = page.locator('#lnkShowLoginByEmail, text="Use Email Instead"').first();
    this.emailInput = page.locator('#LoginEmail, input[name="LoginEmail"], input#email, input#Username, input[type="email"]').first();
    this.passwordInput = page.locator('#Password, input[name="Password"], input[type="password"]').first();
    this.submitSignInButton = page.locator('#signin, input[type="submit"][value*="Sign In"]').first();
  }

  /**
   * Handle Disclaimer Modal if present on dev/staging storefront
   */
  async handleDisclaimer(): Promise<void> {
    if (await this.disclaimerButton.isVisible({ timeout: 7000 }).catch(() => false)) {
      await this.disclaimerButton.click();
      await this.page.waitForTimeout(1500);
    }
  }

  /**
   * Handle Age Verification Modal (21+) if enabled on store
   */
  async handleAgeVerification(): Promise<void> {
    if (await this.ageVerificationButton.isVisible({ timeout: 4000 }).catch(() => false)) {
      await this.ageVerificationButton.click();
      await this.page.waitForTimeout(1500);
    }
    // Wait for backdrop overlay to disappear
    await this.page.locator('.q-dialog__backdrop').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  }

  /**
   * Full end-to-end login flow:
   * Header -> Drawer -> Identity Server -> Fill Email/Pass -> Submit -> Redirect
   */
  async login(user: string = config.ordering.user, password?: string): Promise<void> {
    const pass = password || config.ordering.password || '';

    // 1. Open drawer
    await this.headerSignInButton.click({ force: true });
    await this.page.waitForTimeout(1500);

    // 2. Click Drawer Sign In and wait for Identity Server redirect
    await Promise.all([
      this.page.waitForURL(/dev-identity|Identity|Login/i, { timeout: 30000 }),
      this.drawerSignInButton.click(),
    ]);
    await this.page.waitForTimeout(2000);

    // 3. Switch to Email if page defaulted to Phone number
    if (await this.useEmailLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.useEmailLink.click();
      await this.page.waitForTimeout(1000);
    }

    // 4. Fill credentials
    await this.emailInput.fill(user);
    await this.passwordInput.fill(pass);

    // 5. Submit login
    const targetHost = new URL(config.ordering.baseUrl).hostname.replace(/\./g, '\\.');
    await Promise.all([
      this.page.waitForURL(new RegExp(targetHost), { timeout: 45000 }),
      this.submitSignInButton.click(),
    ]);

    await this.page.waitForTimeout(3000);
  }

  async expectOnHomePage(): Promise<void> {
    const hostname = new URL(config.ordering.baseUrl).hostname.replace(/\./g, '\\.');
    await expect(this.page).toHaveURL(new RegExp(hostname));
  }

  async expectLoggedIn(): Promise<void> {
    const hostname = new URL(config.ordering.baseUrl).hostname.replace(/\./g, '\\.');
    await expect(this.page).toHaveURL(new RegExp(hostname));
  }
}
