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
   * Navigate to Cart page directly with transient network retry
   */
  async gotoCart(): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await this.page.waitForTimeout(2000);
        return;
      } catch (err) {
        if (attempt === 2) throw err;
        await this.page.waitForTimeout(2000);
      }
    }
  }

  /**
   * Clear any existing items in the cart to guarantee clean cart state
   */
  async clearCartIfNotEmpty(): Promise<void> {
    await this.gotoCart();
    await this.page.waitForTimeout(1500);

    const emptyNotice = this.page.locator('text=/your cart is empty/i, text=/no items in cart/i').first();
    if (await emptyNotice.isVisible({ timeout: 1500 }).catch(() => false)) {
      return;
    }

    const clearBtn = this.page.locator('button, a').filter({ hasText: /Empty Cart|Clear Cart|Remove All/i }).first();
    if (await clearBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
      await clearBtn.click();
      await this.page.locator('.q-dialog button:has-text("Yes"), .q-dialog button:has-text("Confirm"), .q-dialog button:has-text("OK")').first().click({ timeout: 2500 }).catch(() => {});
      await this.page.waitForTimeout(1500);
      return;
    }

    const deleteButtons = this.page.locator('button:has(.q-icon:has-text("delete")), button i:has-text("delete"), .q-btn [class*="delete"], button:has-text("Remove"), .delete-btn');
    let count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      await deleteButtons.first().click().catch(() => {});
      await this.page.locator('.q-dialog button:has-text("Yes"), .q-dialog button:has-text("Confirm"), .q-dialog button:has-text("OK")').first().click({ timeout: 1500 }).catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Click "Proceed to Checkout" on the Cart page
   */
  async proceedToCheckout(): Promise<void> {
    const btn = this.page.getByRole('button', { name: /Proceed to Checkout/i })
      .or(this.page.locator('button, a').filter({ hasText: /Proceed to Checkout/i }))
      .first();

    await btn.waitFor({ state: 'visible', timeout: 20000 });
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(500);

    // Click button
    await btn.click().catch(() => btn.dispatchEvent('click'));

    // Ensure transition to /checkout
    for (let retry = 0; retry < 6; retry++) {
      if (this.page.url().includes('/checkout')) break;
      await this.page.waitForTimeout(1000);
      if (await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => btn.dispatchEvent('click'));
      }
    }

    // Wait for checkout URL
    await this.page.waitForURL(/\/checkout/i, { timeout: 25000 });
    await this.expectCheckoutLoaded();
  }

  /**
   * Wait for Checkout page sections to be fully interactive
   */
  async expectCheckoutLoaded(): Promise<void> {
    const interactiveEl = this.page.locator('[role="switch"], [role="radio"], .q-radio, button').filter({ hasText: /Place Order|In Store|Curbside|Pay At Store/i }).first();
    await interactiveEl.waitFor({ state: 'visible', timeout: 20000 });
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
   * Turn OFF "Pay At Store" switch (if present)
   */
  async turnOffPayAtStore(): Promise<void> {
    const switchEl = this.page.locator('button, div, li').filter({ hasText: /Pay At Store/i }).locator('[role="switch"], .q-toggle').first();
    if (await switchEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isChecked = await switchEl.getAttribute('aria-checked') === 'true';
      if (isChecked) {
        await switchEl.click({ force: true });
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Select "In Store Pickup" radio option
   */
  async selectInStorePickup(): Promise<void> {
    const radio = this.page.locator('.q-radio, [role="radio"], label')
      .filter({ hasText: /In Store Pickup/i })
      .first();
    if (await radio.isVisible({ timeout: 5000 }).catch(() => false)) {
      await radio.scrollIntoViewIfNeeded().catch(() => {});
      await radio.click({ force: true });
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Select "Curbside Pickup" radio option
   */
  async selectCurbsidePickup(): Promise<void> {
    const radio = this.page.locator('.q-radio, [role="radio"], label')
      .filter({ hasText: /Curbside Pickup/i })
      .first();
    await radio.waitFor({ state: 'visible', timeout: 15000 });
    await radio.scrollIntoViewIfNeeded().catch(() => {});
    await radio.click({ force: true });
    await this.page.waitForTimeout(500);

    // Verify it is checked
    const isChecked = await radio.getAttribute('aria-checked') === 'true' ||
                      await radio.locator('.q-radio__inner--truthy').isVisible().catch(() => false);
    if (!isChecked) {
      await radio.locator('input[type="radio"], .q-radio__bg, .q-radio__inner').first().click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Select "Credit or Debit Card" payment option
   * Matches HTML:
   * 1. <div class="cursor-pointer">...<div class="card-payment-icon">...<p>Credit or Debit Card</p>
   * 2. <div class="saved-card selected-saved-card">...<div class="q-radio">...<span class="card-number">
   */
  async selectCreditOrDebitCard(): Promise<void> {
    // 1. Locate and click "Credit or Debit Card" option row
    const cardOption = this.page.locator('.card-payment-icon')
      .locator('xpath=ancestor::div[contains(@class, "cursor-pointer")][1]')
      .first();

    await cardOption.waitFor({ state: 'visible', timeout: 15000 });
    await cardOption.scrollIntoViewIfNeeded().catch(() => {});
    await cardOption.click({ force: true });
    await this.page.waitForTimeout(500);

    // Click the radio button inside the row
    const cardRadio = cardOption.locator('.q-radio, [role="radio"]').first();
    if (await cardRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cardRadio.click({ force: true });
    }
    await this.page.waitForTimeout(1000);

    // 2. Select the saved card (.saved-card)
    const savedCard = this.page.locator('.saved-card').first();
    if (await savedCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await savedCard.scrollIntoViewIfNeeded().catch(() => {});
      await savedCard.click({ force: true });
      const savedRadio = savedCard.locator('.q-radio, [role="radio"]').first();
      if (await savedRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
        await savedRadio.click({ force: true });
      }
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Click "View Order" from the Thank You / Order Confirmation page
   * Guarantees customer lands on /track-order/:orderId
   */
  async clickViewOrderOnThankYouPage(): Promise<void> {
    // 1. If already on /track-order, do nothing
    if (this.page.url().includes('/track-order')) return;

    // 2. Wait for Thank You page and click "View Order"
    await this.page.waitForTimeout(2500);
    const viewOrderBtn = this.page.locator('button, a')
      .filter({ hasText: /View Order/i })
      .first();
    if (await viewOrderBtn.isVisible({ timeout: 20000 }).catch(() => false)) {
      await viewOrderBtn.click();
      await this.page.waitForURL(/track-order/i, { timeout: 20000 }).catch(() => {});
      await this.page.waitForTimeout(1500);
      if (this.page.url().includes('/track-order')) return;
    }

    // 3. If URL or page text has order number, go directly to /track-order/:orderId
    const orderMatch = this.page.url().match(/(\d{6,}_\d+)/) ||
      (await this.page.locator('body').innerText().catch(() => '')).match(/(\d{6,}_\d+)/);
    if (orderMatch && orderMatch[1]) {
      await this.page.goto(`/track-order/${orderMatch[1]}`, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(2000);
      return;
    }

    // 4. Fallback: go to /orders and open latest order details
    await this.page.goto('/orders', { waitUntil: 'domcontentloaded' });
    await this.page.locator('.q-skeleton').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(2000);

    const trackOrderLink = this.page.locator('a, button').filter({ hasText: /Track Order|View Order|View Details/i }).first();
    if (await trackOrderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trackOrderLink.click();
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Extract Pickup Confirmation Code from customer Order Details, Thank You page, or body
   */
  async getConfirmationCode(): Promise<string> {
    await this.page.waitForTimeout(1000);

    // 1. Direct match on <li><span>Confirmation Code</span><strong>7874</strong></li>
    const strongCode = this.page.locator('li').filter({ hasText: /Confirmation Code/i }).locator('strong').first();
    if (await strongCode.isVisible({ timeout: 5000 }).catch(() => false)) {
      const code = (await strongCode.innerText()).trim();
      if (/^\d{4}$/.test(code)) return code;
    }

    // 2. Text match: Confirmation Code: XXXX or Pickup Code: XXXX
    const codeLocator = this.page.locator('text=/confirmation code|pickup code|handover code|pickup pin/i').first();
    if (await codeLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await codeLocator.innerText();
      const match = text.match(/(?:code|pin)\s*:?\s*([0-9]{4})/i);
      if (match) return match[1].trim();
    }

    // 3. Class / Badge match
    const badgeCode = this.page.locator('.pickup-code, .confirmation-code, .text-h5, .text-h6, .q-badge')
      .filter({ hasText: /^[A-Z0-9]{4,8}$/ })
      .first();
    if (await badgeCode.isVisible({ timeout: 3000 }).catch(() => false)) {
      return (await badgeCode.innerText()).trim();
    }

    // 4. Full body text search
    const bodyText = await this.page.locator('body').innerText().catch(() => '');
    const bodyMatch = bodyText.match(/confirmation code\s*[:\n\r\s]*([0-9]{4})/i) ||
                     bodyText.match(/pickup code\s*[:\n\r\s]*([0-9]{4})/i);
    if (bodyMatch) return bodyMatch[1].trim();

    return '';
  }

  /**
   * Handle Mobile Curbside Arrival flow:
  /**
   * Handle Mobile Curbside Arrival flow:
   * Refresh -> "I'M ON MY WAY" -> Confirm -> "I AM HERE" -> Select Details -> Confirm
   */
  async completeMobileCurbsideArrival(details: {
    color?: string;
    spot?: string;
    maker?: string;
    model?: string;
  } = { color: 'Black', spot: 'Spot - A', maker: 'Acura', model: 'CL' }): Promise<void> {
    console.log('Curbside Mobile View: Waiting for order to load and arrival button to appear...');

    // Wait for store pickup card to render
    const storePickupCard = this.page.locator('text=Store Pickup').first();
    await storePickupCard.waitFor({ state: 'visible', timeout: 30000 });

    const onMyWayBtn = this.page.locator('button, a, .q-btn, div, span').filter({ hasText: /^I'M ON MY WAY$/i }).first();
    const iAmHereBtn = this.page.locator('button, a, .q-btn, div, span').filter({ hasText: /^I AM HERE$|^I'm Here$/i }).first();

    // 1. Wait for either "I'M ON MY WAY" or "I AM HERE"
    for (let refreshAttempt = 0; refreshAttempt < 8; refreshAttempt++) {
      if (await onMyWayBtn.isVisible({ timeout: 2000 }).catch(() => false) ||
          await iAmHereBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Curbside Mobile View: Arrival button is visible!`);
        break;
      }
      console.log(`Curbside arrival: Refreshing page (${refreshAttempt + 1}/8)...`);
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await storePickupCard.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
      await this.page.waitForTimeout(2000);
    }

    // 2. Click "I'M ON MY WAY" if present
    if (await onMyWayBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Curbside arrival: Clicking "I\'M ON MY WAY"...');
      await onMyWayBtn.click();
      await this.page.waitForTimeout(1000);

      // Confirm on bottom sheet dialog
      const bottomSheetConfirm = this.page.locator('button').filter({ hasText: /^Confirm$/i }).first();
      if (await bottomSheetConfirm.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Curbside arrival: Clicking Confirm on bottom sheet...');
        await bottomSheetConfirm.click();
        await this.page.waitForTimeout(1500);
      }
    }

    // 3. Wait for and click "I AM HERE"
    await iAmHereBtn.waitFor({ state: 'visible', timeout: 20000 });
    console.log('Curbside arrival: Clicking "I AM HERE"...');
    await iAmHereBtn.click();
    await this.page.waitForTimeout(1500);

    // 4. Select Parking Spot
    if (details.spot) {
      const spotRegex = new RegExp(`^${details.spot.replace('-', '\\s*-\\s*')}$`, 'i');
      const spotEl = this.page.locator('div, span, button').filter({ hasText: spotRegex }).first();
      if (await spotEl.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`Curbside arrival: Selecting Parking Spot "${details.spot}"...`);
        await spotEl.click();
        await this.page.waitForTimeout(400);
      }
    }

    // 5. Select Car Color
    if (details.color) {
      const colorEl = this.page.locator('div, span, label').filter({ hasText: new RegExp(`^${details.color}$`, 'i') }).first();
      if (await colorEl.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Curbside arrival: Selecting Car Color "${details.color}"...`);
        await colorEl.click();
        await this.page.waitForTimeout(400);
      }
    }

    // 6. Select Car Maker
    if (details.maker) {
      console.log(`Curbside arrival: Opening Car Maker dropdown for "${details.maker}"...`);
      const makerSelect = this.page.locator('.q-select, [role="combobox"]').filter({ hasText: /Car Maker/i }).first();
      if (await makerSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        await makerSelect.click();
        await this.page.waitForTimeout(500);
        const option = this.page.locator('.q-menu .q-item, .q-dialog .q-item, [role="option"]')
          .filter({ hasText: new RegExp(`^${details.maker}$`, 'i') }).first();
        await option.waitFor({ state: 'visible', timeout: 5000 });
        await option.click();
        await this.page.waitForTimeout(500);
      }
    }

    // 7. Select Car Model
    if (details.model) {
      console.log(`Curbside arrival: Opening Car Model dropdown for "${details.model}"...`);
      const modelSelect = this.page.locator('.q-select, [role="combobox"]').filter({ hasText: /Car Model/i }).first();
      if (await modelSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        await modelSelect.click();
        await this.page.waitForTimeout(500);
        const option = this.page.locator('.q-menu .q-item, .q-dialog .q-item, [role="option"]')
          .filter({ hasText: new RegExp(`^${details.model}$`, 'i') }).first();
        await option.waitFor({ state: 'visible', timeout: 5000 });
        await option.click();
        await this.page.waitForTimeout(500);
      }
    }

    // 8. Submit arrival modal
    const arrivalConfirmBtn = this.page.locator('button').filter({ hasText: /^Confirm$/i }).first();
    await arrivalConfirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Curbside arrival: Submitting arrival form (Confirm)...');
    await arrivalConfirmBtn.click();
    await this.page.waitForTimeout(2000);
    console.log('Curbside arrival: Completed vehicle arrival submission!');
  }

  /**
   * Accept order acknowledgment / digital signature terms
   */
  async acceptTerms(): Promise<void> {
    const chk = this.page.locator('.q-checkbox, [role="checkbox"], input[type="checkbox"]')
      .filter({ hasText: /Authorize Payment|I confirm that the final total/i })
      .first()
      .or(this.acknowledgmentCheckbox);

    await chk.waitFor({ state: 'visible', timeout: 10000 });
    const isChecked = (await chk.getAttribute('aria-checked')) === 'true' ||
                      (await chk.locator('input[type="checkbox"]').isChecked().catch(() => false));
    if (!isChecked) {
      await chk.click({ force: true });
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Click "Place Order" and wait for order submission
   */
  async placeOrder(): Promise<void> {
    await this.placeOrderButton.waitFor({ state: 'visible', timeout: 15000 });

    // Guard: If disabled, re-ensure terms and card selection
    if (!(await this.placeOrderButton.isEnabled())) {
      await this.acceptTerms();
      await this.page.waitForTimeout(1000);
    }

    if (!(await this.placeOrderButton.isEnabled())) {
      await this.selectCreditOrDebitCard();
      await this.acceptTerms();
      await this.page.waitForTimeout(1000);
    }

    await expect(this.placeOrderButton).toBeEnabled({ timeout: 10000 });
    await this.placeOrderButton.click();

    // Wait for processing spinner or navigation
    await Promise.race([
      this.page.waitForURL((url) => !url.pathname.endsWith('/checkout'), { timeout: 35000 }),
      this.orderProcessingLoader.waitFor({ state: 'detached', timeout: 35000 }),
    ]).catch(() => {});

    await this.page.waitForTimeout(2000);
  }

  /**
   * Retrieve order confirmation number or latest placed order
   */
  async getLatestOrderNumber(): Promise<string> {
    // 1. Check URL first for the standard order ID format: e.g. 57854114352_37418
    const urlMatch = this.page.url().match(/(\d{6,}_\d+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].trim();
    }

    // 2. Direct match on page text for Order Number: e.g. "Order Number: 17904293032_37414"
    const orderNumEl = this.page.locator('li, div, p, span, h1, h2, h3, h4').filter({ hasText: /Order Number/i }).first();
    if (await orderNumEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await orderNumEl.innerText();
      const match = text.match(/(\d{6,}_\d+)/);
      if (match) return match[1].trim();
    }

    // 3. Search entire body text for any standard order number pattern
    const pageText = await this.page.locator('body').innerText().catch(() => '');
    const bodyMatch = pageText.match(/(\d{6,}_\d+)/);
    if (bodyMatch) return bodyMatch[1].trim();

    // 4. Fallback: navigate to /orders to fetch the top order card, then return
    const currentUrl = this.page.url();
    await this.page.goto('/orders', { waitUntil: 'domcontentloaded' });
    await this.page.locator('.q-skeleton').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(2000);

    const orderItem = this.page.locator('li, div').filter({ hasText: /Order Number:/i }).first();
    await orderItem.waitFor({ state: 'visible', timeout: 15000 });
    const orderText = await orderItem.innerText();
    const listMatch = orderText.match(/(\d{6,}_\d+)/) || orderText.match(/Order Number:\s*([^\s]+)/i);
    const result = listMatch ? listMatch[1].trim() : orderText.replace(/Order Number:\s*/i, '').trim();

    // If we originally were on track-order or details, return back so subsequent steps don't break
    if (currentUrl.includes('/track-order')) {
      await this.page.goto(currentUrl, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(1000);
    }

    return result;
  }
}

