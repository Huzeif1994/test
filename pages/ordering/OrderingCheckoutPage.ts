import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Online Ordering Cart & Checkout Page Object
 */
export class OrderingCheckoutPage extends BasePage {
  protected readonly path = '/cart';

  // Cart Page Locators
  readonly cartItems: Locator;
  readonly proceedToCheckoutButton: Locator;

  // Checkout Page Locators
  readonly checkoutTitle: Locator;
  readonly payAtStoreButton: Locator;
  readonly payAtStoreSwitch: Locator;
  readonly acknowledgmentCheckbox: Locator;
  readonly placeOrderButton: Locator;
  readonly orderProcessingLoader: Locator;

  constructor(page: Page) {
    super(page);

    // Cart
    this.cartItems = page.locator('.cart-item, [class*="cart-product"], tr, .q-card');
    this.proceedToCheckoutButton = page.getByRole('button', { name: /checkout|proceed/i }).or(page.locator('button, a').filter({ hasText: /checkout/i })).first();

    // Checkout
    this.checkoutTitle = page.locator('h1, h2, .text-h5, .text-h6').filter({ hasText: /Checkout|Order Details/i }).first();
    this.payAtStoreButton = page.getByRole('button', { name: /Pay At Store/i }).or(page.locator('button:has-text("Pay At Store")')).first();
    this.payAtStoreSwitch = page.locator('div, li, button').filter({ hasText: /Pay At Store/i }).locator('[role="switch"]').first();
    this.acknowledgmentCheckbox = page.locator('button, label').filter({ hasText: /Authorize Payment|I confirm that the final total/i }).first();
    this.placeOrderButton = page.locator('button').filter({ hasText: /^Place Order$/i }).first();
    this.orderProcessingLoader = page.locator('.q-spinner, img[src*="cart"], .q-dialog').first();
  }

  /**
   * Navigate to Cart page directly
   */
  async gotoCart(): Promise<void> {
    await this.page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(2000);
  }

  /**
   * Click "Proceed to Checkout" on the Cart page
   */
  async proceedToCheckout(): Promise<void> {
    await this.proceedToCheckoutButton.waitFor({ state: 'visible', timeout: 20000 });
    await expect(this.proceedToCheckoutButton).toBeVisible();
    await this.proceedToCheckoutButton.click();

    // Wait for checkout URL
    await this.page.waitForURL(/\/checkout/i, { timeout: 30000 });
    await this.expectCheckoutLoaded();
  }

  /**
   * Wait for Checkout page sections to be fully interactive
   */
  async expectCheckoutLoaded(): Promise<void> {
    await this.page.locator('.q-spinner').first().waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
    await this.payAtStoreSwitch.waitFor({ state: 'visible', timeout: 20000 });
    await expect(this.payAtStoreSwitch).toBeVisible();
  }

  /**
   * Select "Pay At Store" payment option
   */
  async selectPayAtStore(): Promise<void> {
    await this.payAtStoreSwitch.waitFor({ state: 'visible', timeout: 15000 });
    const isChecked = await this.payAtStoreSwitch.getAttribute('aria-checked') === 'true';
    if (!isChecked) {
      await this.payAtStoreSwitch.click({ force: true });
      await this.page.waitForTimeout(500);
      await expect(this.payAtStoreSwitch).toHaveAttribute('aria-checked', 'true', { timeout: 5000 });
    }
  }

  /**
   * Accept order acknowledgment / digital signature terms
   */
  async acceptTerms(): Promise<void> {
    await this.acknowledgmentCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    await this.acknowledgmentCheckbox.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click "Place Order" and wait for order submission
   */
  async placeOrder(): Promise<void> {
    await this.placeOrderButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.placeOrderButton).toBeEnabled({ timeout: 5000 });
    await this.placeOrderButton.click();

    // Wait for processing spinner or navigation
    await Promise.race([
      this.page.waitForURL((url) => !url.pathname.endsWith('/checkout'), { timeout: 30000 }),
      this.orderProcessingLoader.waitFor({ state: 'detached', timeout: 30000 }),
    ]).catch(() => {});

    await this.page.waitForTimeout(2000);
  }

  /**
   * Retrieve order confirmation number or latest placed order
   */
  async getLatestOrderNumber(): Promise<string> {
    // Navigate to /orders to fetch the top order card
    await this.page.goto('/orders', { waitUntil: 'domcontentloaded' });
    await this.page.locator('.q-skeleton').first().waitFor({ state: 'detached', timeout: 35000 }).catch(() => {});
    await this.page.waitForTimeout(2000);

    // Extract Order Number from first card: e.g. "Order Number: 48650718742_37385"
    const orderItem = this.page.locator('li, div').filter({ hasText: /Order Number:/i }).first();
    await orderItem.waitFor({ state: 'visible', timeout: 15000 });
    const orderText = await orderItem.innerText();
    const match = orderText.match(/Order Number:\s*([^\s]+)/i);
    return match ? match[1].trim() : orderText.replace(/Order Number:\s*/i, '').trim();
  }
}

