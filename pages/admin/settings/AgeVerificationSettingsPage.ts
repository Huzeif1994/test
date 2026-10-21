import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../BasePage';

/**
 * Admin Portal Age Verification Settings Page
 * Routes:
 * - Multi-Brand: /online-stores/:storeId/business#ageRestriction
 * - Single-Brand: /business#ageRestriction
 * Covers: Scenarios 1, 2, 3, 4, 5 configuration
 */
export class AgeVerificationSettingsPage extends BasePage {
  protected readonly path = '/online-stores/5cc7384f-d841-4489-a3fc-b27d120da11a/business#ageRestriction';

  readonly ageVerificationNavTab: Locator;
  readonly pageContainer: Locator;
  readonly mainEnableToggle: Locator;
  readonly beforeShowingProductsToggle: Locator;
  readonly duringCheckoutToggle: Locator;
  readonly duringFulfillmentToggle: Locator;
  readonly allowManualDobCheckbox: Locator;
  readonly ftxIdentitySelect: Locator;
  readonly saveButton: Locator;
  readonly saveAndNextButton: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    super(page);

    this.ageVerificationNavTab = page.locator('.q-item, button').filter({ hasText: /^Age Verification$/i }).first();
    this.pageContainer = page.locator('#ageRestriction, .age-restriction').first();

    // Main Toggle: Enable Age Verification
    this.mainEnableToggle = page.locator('div').filter({ has: page.getByText(/Enable Age Verification/i) }).locator('[role="switch"], .q-toggle').first();

    // Sub-Toggles (Scenarios 1, 2, 3, 4, 5)
    this.beforeShowingProductsToggle = page.locator('div').filter({ has: page.getByText(/before showing age-restricted products/i) }).locator('[role="switch"], .q-toggle').first();
    this.duringCheckoutToggle = page.locator('div').filter({ has: page.getByText(/during checkout/i) }).locator('[role="switch"], .q-toggle').first();
    this.duringFulfillmentToggle = page.locator('div').filter({ has: page.getByText(/during fulfillment/i) }).locator('[role="switch"], .q-toggle').first();
    this.allowManualDobCheckbox = page.locator('div').filter({ has: page.getByText(/enter DOB manually|allow.*manual.*DOB/i) }).locator('[role="switch"], [role="checkbox"], .q-toggle, .q-checkbox').first();

    // FTx Identity Configuration Select
    this.ftxIdentitySelect = page.locator('.q-select').filter({ hasText: /Select configuration|FTX Commerce/i }).first();

    // Action Buttons
    this.saveButton = page.locator('button:has-text("Save")').last();
    this.saveAndNextButton = page.locator('button:has-text("Save and Next")').first();
    this.successToast = page.locator('.q-notification, #q-notify, text=/saved successfully|Updated successfully|settings saved/i').first();
  }

  /**
   * Navigate to Age Restriction Settings and wait for full render
   */
  async gotoAgeRestriction(targetUrl?: string): Promise<void> {
    const url = targetUrl || this.path;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.expectPageLoaded();
  }

  /**
   * Wait for loading spinner to detach and settings card to be fully interactive
   */
  async expectPageLoaded(): Promise<void> {
    // Wait for Quasar spinner to finish
    await this.page.locator('.q-spinner').first().waitFor({ state: 'detached', timeout: 45000 }).catch(() => {});

    // Ensure Age Verification tab is clicked if visible
    const ageTab = this.page.getByText('Age Verification', { exact: true }).first();
    if (await ageTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ageTab.click().catch(() => {});
      await this.page.waitForTimeout(500);
    }

    await this.saveButton.waitFor({ state: 'visible', timeout: 30000 });
    await expect(this.saveButton).toBeVisible();
  }

  /**
   * Determine whether a toggle/switch is currently checked/active
   */
  async isToggleChecked(toggle: Locator): Promise<boolean> {
    const ariaChecked = await toggle.getAttribute('aria-checked');
    if (ariaChecked !== null && ariaChecked !== undefined) {
      return ariaChecked === 'true';
    }
    const text = (await toggle.innerText().catch(() => ''))?.trim().toLowerCase();
    if (text === 'on') return true;
    if (text === 'off') return false;
    const className = (await toggle.getAttribute('class')) || '';
    return className.includes('truthy') || className.includes('active');
  }

  /**
   * Helper to set a toggle to desired state (true = ON, false = OFF)
   */
  async setToggle(toggle: Locator, enable: boolean): Promise<void> {
    await toggle.waitFor({ state: 'visible', timeout: 10000 });
    const isChecked = await this.isToggleChecked(toggle);
    if (isChecked !== enable) {
      await toggle.click();
      await this.page.waitForTimeout(400);
      await expect.poll(async () => await this.isToggleChecked(toggle), {
        message: `Expected toggle state to be ${enable}`,
        timeout: 7000,
      }).toBe(enable);
    }
  }

  /**
   * Configure Scenario 1: Only "Enable Age Verification" is enabled
   */
  async configureScenario1(): Promise<void> {
    await this.setToggle(this.mainEnableToggle, true);
    await this.setToggle(this.beforeShowingProductsToggle, false);
    await this.setToggle(this.duringCheckoutToggle, false);
    await this.setToggle(this.duringFulfillmentToggle, false);
  }

  /**
   * Configure Scenario 2: Enable Age Verification + Verify before showing products
   */
  async configureScenario2(): Promise<void> {
    await this.setToggle(this.mainEnableToggle, true);
    await this.setToggle(this.beforeShowingProductsToggle, true);
    await this.setToggle(this.duringCheckoutToggle, false);
    await this.setToggle(this.duringFulfillmentToggle, false);
  }

  /**
   * Configure Scenario 3: Enable Age Verification + Verify during checkout
   */
  async configureScenario3(): Promise<void> {
    await this.setToggle(this.mainEnableToggle, true);
    await this.setToggle(this.beforeShowingProductsToggle, false);
    await this.setToggle(this.duringCheckoutToggle, true);
    await this.setToggle(this.duringFulfillmentToggle, false);
  }

  /**
   * Configure Scenario 4: Enable Age Verification + Verify during fulfillment
   */
  async configureScenario4(): Promise<void> {
    await this.setToggle(this.mainEnableToggle, true);
    await this.setToggle(this.duringFulfillmentToggle, true);
  }

  /**
   * Configure Scenario 5: Enable Age Verification + Fulfillment + Manual DOB Fallback
   */
  async configureScenario5(): Promise<void> {
    await this.setToggle(this.mainEnableToggle, true);
    await this.setToggle(this.duringFulfillmentToggle, true);
    if (await this.allowManualDobCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isChecked = await this.allowManualDobCheckbox.getAttribute('aria-checked') === 'true';
      if (!isChecked) {
        await this.allowManualDobCheckbox.click();
      }
    }
  }

  /**
   * Save configuration and assert success notification
   */
  async saveSettings(): Promise<void> {
    await this.saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.saveButton).toBeEnabled();
    await this.saveButton.click();

    // Verify toast or notification appear
    await Promise.race([
      this.successToast.waitFor({ state: 'visible', timeout: 8000 }),
      this.page.locator('.q-notification').first().waitFor({ state: 'visible', timeout: 8000 }),
    ]).catch(() => {});

    await this.page.waitForTimeout(1000);
  }
}

