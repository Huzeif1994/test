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
    this.ageVerificationButton = page.getByRole('button', { name: /^Skip$/i }).or(page.locator('button').filter({ hasText: /^Skip$/i })).or(page.locator('button:has-text("21+"), button:has-text("I\'m 21+")')).first();

    // Storefront Navigation
    this.headerSignInButton = page.locator('.account-notifaction, header button:has-text("Sign In"), header button:has-text("Sign In Account")').first();
    this.drawerSignInButton = page.locator('.q-drawer button, aside button, .q-drawer a, aside a').filter({ hasText: /^Sign In$/i }).first().or(page.locator('button, a').filter({ hasText: /^Sign In$/i }).last());

    // Identity Server Login Form
    this.useEmailLink = page.locator('#lnkShowLoginByEmail, text="Use Email Instead"').first();
    this.emailInput = page.locator('#LoginEmail, input[name="LoginEmail"], input#email, input#Username, input[type="email"]').first();
    this.passwordInput = page.locator('#Password, input[name="Password"], input[type="password"]').first();
    this.submitSignInButton = page.locator('#signin, input[type="submit"][value*="Sign In"]').first();
  }

  /**
   * Dismiss any popups currently present or appearing on the storefront
   * (Disclaimer modal, Age verification modal, Quasar backdrops)
   */
  async dismissAllPopups(maxWaitMs: number = 20000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      let handledSomething = false;

      // 1. Disclaimer Modal: "I understand. Proceed to Store"
      const disclaimer = this.page.locator('button, a').filter({ hasText: /I understand|Proceed to Store/i }).first();
      if (await disclaimer.isVisible({ timeout: 500 }).catch(() => false)) {
        await disclaimer.click({ force: true }).catch(() => {});
        await disclaimer.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        handledSomething = true;
      }

      // 2. Age Verification Modal (21+): click "Skip"
      const skipBtn = this.page.getByRole('button', { name: /^Skip$/i }).or(this.page.locator('button').filter({ hasText: /^Skip$/i })).first();
      const ageBtn = this.page.getByRole('button', { name: /21\+|I'm 21\+/i }).or(this.page.locator('button, a').filter({ hasText: /21\+|I'm 21\+/i })).first();

      if (await skipBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await skipBtn.click({ force: true }).catch(() => {});
        await skipBtn.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        handledSomething = true;
      } else if (await ageBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await ageBtn.click({ force: true }).catch(() => {});
        await ageBtn.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        handledSomething = true;
      }

      // 3. Any consent or generic modal close "X" button
      const closeBtn = this.page.locator('.q-dialog button:has(.q-icon), button[aria-label="Close"], button[aria-label="close"]').first();
      if (!handledSomething && await closeBtn.isVisible({ timeout: 300 }).catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => {});
        handledSomething = true;
      }

      // If a popup was dismissed, wait a moment for Quasar transitions
      if (handledSomething) {
        await this.page.waitForTimeout(1000);
      } else {
        // If neither popup button is visible, check if a backdrop is still covering screen
        const backdropVisible = await this.page.locator('.q-dialog__backdrop:visible').isVisible({ timeout: 300 }).catch(() => false);
        if (!backdropVisible) {
          break;
        }
        await this.page.waitForTimeout(500);
      }
    }

    // Ensure dialog backdrop is fully detached or hidden
    await this.page.locator('.q-dialog__backdrop').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  /**
   * Handle Disclaimer Modal if present on dev/staging storefront
   */
  async handleDisclaimer(timeout: number = 20000): Promise<void> {
    await this.dismissAllPopups(timeout);
  }

  /**
   * Handle Age Verification Modal (21+) if enabled on store
   */
  async handleAgeVerification(timeout: number = 15000): Promise<void> {
    await this.dismissAllPopups(timeout);
  }

  /**
   * Full end-to-end login flow:
   * Header -> Drawer -> Identity Server -> Fill Email/Pass -> Submit -> Redirect
   */
  async login(user: string = config.ordering.user, password?: string): Promise<void> {
    const pass = password || config.ordering.password || '';

    // 1. Open drawer (resilient against popups and backdrops)
    let drawerOpened = false;
    for (let attempt = 1; attempt <= 6; attempt++) {
      // Dismiss any popups that are present or lingering
      await this.dismissAllPopups(attempt === 1 ? 15000 : 3000);

      // Check if drawer is already open
      if (await this.drawerSignInButton.isVisible().catch(() => false)) {
        drawerOpened = true;
        break;
      }

      // Ensure header button is visible and try clicking
      try {
        await this.headerSignInButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.headerSignInButton.click({ timeout: 5000 });
      } catch {
        // If click was intercepted by a backdrop or modal, dismiss popups and retry
        await this.dismissAllPopups(4000);
      }

      // Check if drawer opened
      if (await this.drawerSignInButton.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false)) {
        drawerOpened = true;
        break;
      }

      await this.page.waitForTimeout(1000);
    }

    if (!drawerOpened) {
      // Final attempt: force click header sign in
      await this.dismissAllPopups(3000);
      await this.headerSignInButton.click({ force: true });
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
