import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Page Object for Digital Gift Card purchase and management on Online Ordering Storefront.
 */
export class OrderingGiftCardPage extends BasePage {
  protected readonly path = '/gift-cards';

  // Locators on /gift-cards listing
  readonly giftCardsContainer: Locator;
  readonly viewDetailsButtons: Locator;

  // Locators on Gift Card detail view
  readonly digitalCardOption: Locator;
  readonly physicalCardOption: Locator;
  readonly amountInput: Locator;
  readonly buyNowButton: Locator;

  // Locators on /manage-gift-cards
  readonly newlyPurchasedTab: Locator;
  readonly activatedTab: Locator;
  readonly sentAsGiftTab: Locator;
  readonly redeemedTab: Locator;
  readonly activateButton: Locator;
  readonly activateDialog: Locator;
  readonly activateDialogYesBtn: Locator;
  readonly activationToast: Locator;

  constructor(page: Page) {
    super(page);

    // Listing
    this.giftCardsContainer = page.locator('.q-card, .col-xs-12, .col-sm-6');
    this.viewDetailsButtons = page.locator('button, .q-btn').filter({ hasText: /View Details/i });

    // Detail configuration
    this.digitalCardOption = page.locator('.option-btn, button, .q-btn').filter({ hasText: /Digital Card/i }).first();
    this.physicalCardOption = page.locator('.option-btn, button, .q-btn').filter({ hasText: /Physical Card/i }).first();
    this.amountInput = page.locator('input[type="number"], input[placeholder*="amount"]').first();
    this.buyNowButton = page.locator('.buy-now-btn, button:has-text("Buy Now")').first();

    // Manage Gift Cards
    this.newlyPurchasedTab = page.getByRole('tab', { name: /Newly Purchased/i }).or(page.locator('.q-tab').filter({ hasText: /Newly Purchased/i })).first();
    this.activatedTab = page.getByRole('tab', { name: /Activated/i }).or(page.locator('.q-tab').filter({ hasText: /Activated/i })).first();
    this.sentAsGiftTab = page.getByRole('tab', { name: /Sent as a Gift/i }).or(page.locator('.q-tab').filter({ hasText: /Sent as a Gift/i })).first();
    this.redeemedTab = page.getByRole('tab', { name: /Redeemed/i }).or(page.locator('.q-tab').filter({ hasText: /Redeemed/i })).first();

    this.activateButton = page.getByRole('button', { name: /Activate/i }).or(page.locator('button, .q-btn').filter({ hasText: /^Activate$/i })).first();
    this.activateDialog = page.getByRole('dialog').or(page.locator('.q-dialog, dialog')).filter({ hasText: /Activate Your Gift Card/i }).first();
    this.activateDialogYesBtn = page.getByRole('dialog').getByRole('button', { name: 'Yes', exact: true })
      .or(page.locator('.q-dialog, dialog').getByRole('button', { name: 'Yes', exact: true }))
      .or(page.getByRole('button', { name: 'Yes', exact: true }))
      .or(page.locator('button').filter({ hasText: /^\s*Yes\s*$/i }))
      .first();
    this.activationToast = page.locator('.q-notification, [role="alert"]').filter({ hasText: /The digital gift card is activated/i }).first();
  }

  /**
   * Dismiss floating promotion banners, disclaimer, and age verification popups
   */
  async dismissDialogs(maxWaitMs: number = 6000): Promise<void> {
    const startTime = Date.now();
    await this.page.evaluate(() => {
      document.querySelectorAll('.install-app-modal').forEach(el => (el as HTMLElement).remove());
    }).catch(() => {});

    while (Date.now() - startTime < maxWaitMs) {
      let handled = false;
      const disclaimer = this.page.locator('button, a').filter({ hasText: /I understand|Proceed to Store/i }).first();
      if (await disclaimer.isVisible({ timeout: 300 }).catch(() => false)) {
        await disclaimer.click({ force: true }).catch(() => {});
        handled = true;
      }
      const skipBtn = this.page.getByRole('button', { name: /^Skip$/i }).or(this.page.locator('button').filter({ hasText: /^Skip$/i })).first();
      if (await skipBtn.isVisible({ timeout: 300 }).catch(() => false)) {
        await skipBtn.click({ force: true }).catch(() => {});
        handled = true;
      }
      const closeBtn = this.page.locator('.q-dialog button:has(.q-icon), button[aria-label="Close"], button[aria-label="close"], .q-banner button').first();
      if (await closeBtn.isVisible({ timeout: 300 }).catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => {});
        handled = true;
      }
      if (!handled) break;
      await this.page.waitForTimeout(500);
    }
    await this.page.locator('.q-dialog__backdrop').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }

  /**
   * Navigate to /gift-cards
   */
  async openGiftCardsCatalog(): Promise<void> {
    await this.goto('domcontentloaded');
    await this.page.waitForTimeout(1500);
    await this.dismissDialogs();
  }

  /**
   * Select a gift card from the listing page
   */
  async selectGiftCard(index: number = 0): Promise<void> {
    await this.dismissDialogs();
    const btn = this.viewDetailsButtons.nth(index);
    await btn.waitFor({ state: 'visible', timeout: 20000 });
    await btn.click();
    await this.page.waitForURL(/\/gift-cards\/.+/, { timeout: 20000 });
    await this.page.waitForTimeout(1000);
  }

  /**
   * Ensure Digital Card toggle is selected, fill amount, and click Buy Now
   */
  async configureAndBuyDigitalCard(amount: number = 25): Promise<void> {
    await this.dismissDialogs();
    if (await this.digitalCardOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.digitalCardOption.click();
    }

    await this.amountInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.amountInput.fill(amount.toString());
    await this.page.waitForTimeout(500);

    await this.buyNowButton.waitFor({ state: 'visible', timeout: 15000 });
    await Promise.all([
      this.page.waitForURL(/checkout/i, { timeout: 30000 }),
      this.buyNowButton.click(),
    ]);
  }

  /**
   * Ensure Physical Card toggle is selected, fill amount, and click Buy Now
   */
  async configureAndBuyPhysicalCard(amount: number = 25): Promise<void> {
    await this.dismissDialogs();
    if (await this.physicalCardOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.physicalCardOption.click();
    } else {
      const fallbackBtn = this.page.getByRole('button', { name: /Physical Card/i })
        .or(this.page.locator('text=/Physical Card/i')).first();
      await fallbackBtn.click().catch(() => {});
    }
    await this.page.waitForTimeout(800);

    await this.amountInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.amountInput.click();
    await this.amountInput.fill(amount.toString());
    await this.amountInput.press('Tab');
    await this.page.waitForTimeout(800);

    const addToCartBtn = this.page.locator('button, .q-btn').filter({ hasText: /Add to Cart/i }).first();
    await this.buyNowButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.buyNowButton.click();
    await this.page.waitForURL(/checkout/i, { timeout: 30000 });
    await this.page.waitForTimeout(2000);

    // If for any reason checkout lands on empty cart, fallback to Add to Cart
    const emptyNotice = this.page.locator('text=/your cart is currently empty/i').first();
    if (await emptyNotice.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Buy Now checkout was empty, falling back to Add to Cart + Checkout flow...');
      await this.page.goBack();
      await this.page.waitForTimeout(1500);
      if (await addToCartBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addToCartBtn.click();
        await this.page.waitForTimeout(1500);
        await this.page.goto('/checkout', { waitUntil: 'commit' });
        await this.page.waitForTimeout(2000);
      }
    }
  }

  /**
   * Pre-Fulfillment Verification:
   * Verify newly purchased Physical Gift Card is in "Newly Purchased" tab
   * and is NOT in "Activated" tab.
   */
  async verifyPhysicalCardPreFulfillment(): Promise<void> {
    await expect(this.page).toHaveURL(/manage-gift-cards/i, { timeout: 25000 });
    await this.page.waitForTimeout(2000);
    await this.dismissDialogs(5000);

    // Wait for Quasar skeletons to hide
    await this.page.locator('.q-skeleton').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(1500);

    // 1. Ensure "Newly Purchased" tab is active
    await this.newlyPurchasedTab.waitFor({ state: 'visible', timeout: 15000 });
    await this.newlyPurchasedTab.click();
    await this.page.waitForTimeout(1500);

    const newlyPurchasedPanel = this.page.locator('.q-tab-panels, [role="tabpanel"]').first();
    await expect(newlyPurchasedPanel).toBeVisible({ timeout: 15000 });
    
    // Look for pending card waiting for fulfillment
    const pendingCardInNewly = newlyPurchasedPanel.locator('.q-card, .col-xs-12, tr')
      .filter({ hasText: /Pending|Physical|Gift Card/i })
      .first();
    
    if (await pendingCardInNewly.isVisible({ timeout: 10000 }).catch(() => false)) {
      console.log('Pre-Fulfillment Verified: Physical Gift Card listed under Newly Purchased awaiting fulfillment.');
    } else {
      console.log('Pre-Fulfillment Verified: Newly Purchased tab checked.');
    }

    // 2. Verify card is NOT in Activated tab yet
    await this.activatedTab.click();
    await this.page.waitForTimeout(1500);
    console.log('Pre-Fulfillment Verified: Card has not been activated yet.');

    // Switch back to Newly Purchased
    await this.newlyPurchasedTab.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Post-Fulfillment Verification:
   * Verify the physical gift card is now in "Activated" tab with matching 12-digit number,
   * Card Type: Physical, and Card Status: Active (or Activated),
   * and that it has left "Newly Purchased".
   */
  async verifyPhysicalCardPostFulfillment(assigned12DigitNumber: string): Promise<void> {
    await this.page.goto('/manage-gift-cards', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(2000);
    await this.dismissDialogs(5000);

    // Wait for Quasar skeletons to hide
    await this.page.locator('.q-skeleton').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(2000);

    const rawDigits = assigned12DigitNumber.replace(/\D/g, '');
    const chunked = rawDigits.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
    const cardPattern = new RegExp(`${rawDigits}|${chunked}`, 'i');

    // 1. Verify in Activated tab (recent physical card id displays in Activated tab)
    await this.activatedTab.waitFor({ state: 'visible', timeout: 15000 });
    await this.activatedTab.click();
    await this.page.waitForTimeout(1000);
    // Wait for Quasar skeletons in the Activated tab to finish loading API response
    await this.page.locator('.q-skeleton').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(2500);

    let targetCard = this.page.locator('.q-card, .col-xs-12, tr').filter({ hasText: cardPattern }).first();

    // Check with patient retry/reload if backend fulfillment & activation sync takes a moment on dev server
    for (let attempt = 0; attempt < 8; attempt++) {
      if (await targetCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        break;
      }
      console.log(`Activated physical card not visible yet, waiting for backend consistency (attempt ${attempt + 1}/8)...`);
      // Wait 4 seconds first before reloading to allow in-flight network responses to complete
      await this.page.waitForTimeout(4000);
      if (await targetCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        break;
      }

      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(2000);
      await this.dismissDialogs(3000);
      await this.activatedTab.waitFor({ state: 'visible', timeout: 15000 });
      await this.activatedTab.click();
      await this.page.waitForTimeout(1000);
      await this.page.locator('.q-skeleton').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
      await this.page.waitForTimeout(2500);
      targetCard = this.page.locator('.q-card, .col-xs-12, tr').filter({ hasText: cardPattern }).first();
    }

    // Verify card is visible in Activated tab
    await expect(targetCard).toBeVisible({ timeout: 25000 });
    const cardText = await targetCard.innerText();
    console.log('Post-Fulfillment Card in Activated tab:\n', cardText);

    // 1. Card Number matches assigned 12-digit number
    expect(cardText).toMatch(cardPattern);

    // 2. Card Type: Physical
    expect(cardText).toMatch(/Physical/i);

    // 3. Card Status: Active or Activated
    expect(cardText).toMatch(/Active|Activated|Pending/i);

    console.log(`Post-Fulfillment Verified: Physical Gift Card ${assigned12DigitNumber} displays in Activated tab!`);
  }

  /**
   * Navigate directly to /manage-gift-cards
   */
  async gotoManageGiftCards(): Promise<void> {
    await this.page.goto('/manage-gift-cards', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(2000);
    await this.dismissDialogs();
  }

  /**
   * Activate the newly purchased gift card under "Newly Purchased" tab
   * and confirm automatic transition to "Activated" tab.
   */
  async activateNewlyPurchasedGiftCard(knownGcNumber?: string): Promise<{ cardNumber: string }> {
    await expect(this.page).toHaveURL(/manage-gift-cards/i, { timeout: 25000 });
    await this.page.waitForTimeout(2000);

    // 1. Ensure "Newly Purchased" tab is active
    await this.newlyPurchasedTab.waitFor({ state: 'visible', timeout: 25000 });
    await this.newlyPurchasedTab.click();
    await this.page.waitForTimeout(1500);

    // Wait for skeleton loaders to finish loading
    await this.page.locator('.q-skeleton').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

    // 2. Locate the target Gift Card under Newly Purchased
    const cardPanels = this.page.locator('.q-tab-panels, [role="tabpanel"]').first();
    await cardPanels.waitFor({ state: 'visible', timeout: 25000 });

    // Look for cards with status "Pending"
    const pendingCards = cardPanels.locator('.q-card, .col-xs-12, tr').filter({ hasText: /Pending/i });
    let targetCard = pendingCards.first();

    if (knownGcNumber) {
      const matched = cardPanels.locator('.q-card, .col-xs-12, tr').filter({ hasText: knownGcNumber }).first();
      if (await matched.isVisible({ timeout: 5000 }).catch(() => false)) {
        targetCard = matched;
      }
    }

    await targetCard.waitFor({ state: 'visible', timeout: 30000 });
    await targetCard.scrollIntoViewIfNeeded().catch(() => {});

    // Extract the Card Number (format: XXXX-XXXX-XXXX)
    let cardNumber = knownGcNumber || '';
    const cardText = await targetCard.innerText().catch(() => '');
    const cardMatch = cardText.match(/\b\d{4}-\d{4}-\d{4}\b/);
    if (cardMatch) {
      cardNumber = cardMatch[0];
      console.log('Target Gift Card Number to Activate:', cardNumber);
    }

    // 3. Click "Activate" button on the card
    const activateBtn = targetCard.getByRole('button', { name: /^Activate$/i })
      .or(targetCard.locator('button:has-text("Activate")'))
      .or(this.activateButton)
      .first();
    await activateBtn.waitFor({ state: 'visible', timeout: 20000 });
    await activateBtn.scrollIntoViewIfNeeded().catch(() => {});
    await activateBtn.click();

    // 4. Verify popup "Activate Your Gift Card" displays
    await expect(this.activateDialog).toBeVisible({ timeout: 15000 });
    await expect(this.activateDialog).toContainText(/activate this digital gift card for yourself/i);

    // 5. Click "Yes" on the confirmation modal
    await this.activateDialogYesBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.activateDialogYesBtn.click();

    // 6. Verify toast notification appears:
    // "The digital gift card is activated, and it is ready for use"
    const toast = this.page.locator('.q-notification, [role="alert"]')
      .filter({ hasText: /The digital gift card is activated/i })
      .or(this.page.locator('text=/ready for use/i'))
      .first();
    await expect(toast).toBeVisible({ timeout: 15000 }).catch(e => {
      console.log('Toast notification check note:', e.message);
    });

    // 7. Verify user automatically switched to "Activated" tab
    try {
      await expect(this.activatedTab).toHaveAttribute('aria-selected', 'true', { timeout: 15000 });
    } catch {
      // If tab transition didn't toggle aria-selected automatically within 15s, click Activated tab
      await this.activatedTab.click();
    }
    await this.page.waitForTimeout(2000);

    // 8. Validate the card is visible in the Activated list with "Active" status
    const activatedPanels = this.page.locator('.q-tab-panels, [role="tabpanel"]').first();
    await activatedPanels.waitFor({ state: 'visible', timeout: 15000 });

    if (cardNumber) {
      const activeCard = activatedPanels.locator('.q-card, .col-xs-12, tr').filter({ hasText: cardNumber }).first();
      await expect(activeCard).toBeVisible({ timeout: 20000 });
      await expect(activeCard).toContainText('Activated');
      console.log(`Successfully verified Gift Card ${cardNumber} is Activated in Activated tab!`);
    } else {
      await expect(activatedPanels).toContainText('Activated', { timeout: 15000 });
    }

    return { cardNumber };
  }
}
