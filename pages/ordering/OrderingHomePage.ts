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
    this.ageVerificationButton = page.locator('#age-verification-modal button:has-text("Skip"), #age-verification-modal button:has-text("21+"), button:has-text("21+"), button:has-text("I\'m 21+"), button:has-text("Skip")').first();

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
  async handleDisclaimer(timeout: number = 20000): Promise<void> {
    try {
      await this.disclaimerButton.waitFor({ state: 'visible', timeout });
      await this.disclaimerButton.click();
      await this.disclaimerButton.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      await this.page.waitForTimeout(1000);
    } catch {
      // Disclaimer didn't appear within timeout (may not be enabled)
    }
  }

  /**
   * Handle Age Verification Modal (21+) if enabled on store
   */
  async handleAgeVerification(timeout: number = 15000): Promise<void> {
    const modal = this.page.locator('#age-verification-modal, .avmodalDialog');
    const skipButton = modal.locator('button').filter({ hasText: /^Skip$/i }).or(this.page.getByRole('button', { name: 'Skip', exact: true }));
    const ageButton = modal.locator('button, a').filter({ hasText: /21\+|I'm 21\+/i }).or(this.page.locator('button, a').filter({ hasText: /21\+|I'm 21\+/i }));

    try {
      // Dev server takes 8-12 seconds to fetch store settings and mount age modal
      await modal.waitFor({ state: 'visible', timeout });

      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
      } else if (await ageButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ageButton.click();
      } else {
        await modal.locator('button').first().click();
      }

      await modal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      await this.page.waitForTimeout(1000);
    } catch {
      // Age verification didn't appear (may not be enabled)
    }

    // Wait for Quasar dialog backdrop overlay and age modal to detach
    await this.page.locator('.q-dialog__backdrop, #age-verification-modal, .avmodalDialog').waitFor({ state: 'detached', timeout: 6000 }).catch(() => {});
  }

  /**
   * Full end-to-end login flow:
   * Header -> Drawer -> Identity Server -> Fill Email/Pass -> Submit -> Redirect
   */
  async login(user: string = config.ordering.user, password?: string): Promise<void> {
    const pass = password || config.ordering.password || '';

    // Check if any popup appeared late and dismiss
    await this.handleDisclaimer(2000);
    await this.handleAgeVerification(5000);
    await this.page.locator('.q-dialog__backdrop, #age-verification-modal, .avmodalDialog').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // 1. Open drawer
    await this.headerSignInButton.waitFor({ state: 'visible', timeout: 20000 });
    await this.headerSignInButton.click();

    // Ensure drawer is open, retry click if drawer did not open immediately
    const drawerOpen = await this.drawerSignInButton.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    if (!drawerOpen) {
      // Check if age modal popped up right when header was clicked
      await this.handleAgeVerification(3000);
      await this.headerSignInButton.click();
      await this.drawerSignInButton.waitFor({ state: 'visible', timeout: 15000 });
    }

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

    // 4. Fill credentials (wait for loader overlay to clear first)
    await this.page.locator('#divloader').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await this.emailInput.waitFor({ state: 'visible', timeout: 20000 });
    await this.emailInput.fill(user);
    await this.passwordInput.fill(pass);

    // 5. Submit login
    const targetHostname = new URL(config.ordering.baseUrl).hostname.replace(/\./g, '\\.');
    await this.submitSignInButton.click({ force: true });

    // Wait for browser to redirect away from Identity server back to storefront domain
    await expect(this.page).toHaveURL(new RegExp(`^https?://${targetHostname}`), { timeout: 60000 });

    // Wait until callback token exchange finishes and lands on storefront home
    await expect(this.page).not.toHaveURL(/callback/i, { timeout: 60000 });

    await this.page.waitForTimeout(2000);
  }

  async expectOnHomePage(): Promise<void> {
    const origin = new URL(config.ordering.baseUrl).origin.replace(/\./g, '\\.');
    await expect(this.page).toHaveURL(new RegExp(`^${origin}`));
  }

  async expectLoggedIn(): Promise<void> {
    const origin = new URL(config.ordering.baseUrl).origin.replace(/\./g, '\\.');
    // Must be on storefront origin and not on identity or callback
    await expect(this.page).toHaveURL(new RegExp(`^${origin}/?(?!callback)`));

    // Wait 2 seconds so the user can visually confirm the real storefront is loaded
    await this.page.waitForTimeout(2000);
  }
}
