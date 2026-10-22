import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Online Ordering Catalog & Product Browsing Page Object
 */
export class OrderingCatalogPage extends BasePage {
  protected readonly path = '/category/huzeif-test';

  readonly categoryHeading: Locator;
  readonly productCards: Locator;
  readonly skeletons: Locator;
  readonly yourCartButton: Locator;
  readonly cartDrawer: Locator;
  readonly proceedToCartButton: Locator;

  constructor(page: Page) {
    super(page);

    this.categoryHeading = page.locator('h1, h2, .text-h5, .text-h6, .breadcrumb').first();
    this.productCards = page.locator('.product-card, .q-card, [class*="product-card"]');
    this.skeletons = page.locator('.q-skeleton');
    this.yourCartButton = page.locator('button, a').filter({ hasText: /Your Cart/i }).first();
    this.cartDrawer = page.locator('complementary, aside, .q-drawer').filter({ hasText: /Store Pickup|Sub Total|Proceed To Cart/i }).first();
    this.proceedToCartButton = page.getByRole('button', { name: /Proceed To Cart/i }).or(page.locator('button:has-text("Proceed To Cart")')).first();
  }

  /**
   * Navigate to a specific category (defaults to 'huzeif-test') with transient network retry
   */
  async gotoCategory(categorySlug: string = 'huzeif-test'): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.page.goto(`/category/${categorySlug}`, { waitUntil: 'domcontentloaded' });
        await this.expectProductsLoaded();
        return;
      } catch (err) {
        if (attempt === 2) throw err;
        await this.page.waitForTimeout(2000);
      }
    }
  }

  /**
   * Wait for category products to render
   */
  async expectProductsLoaded(): Promise<void> {
    // Dismiss disclaimer if present
    const disclaimer = this.page.locator('button, a').filter({ hasText: /I understand|Proceed to Store/i }).first();
    if (await disclaimer.isVisible({ timeout: 1500 }).catch(() => false)) {
      await disclaimer.click({ force: true });
      await this.page.waitForTimeout(500);
    }

    // Wait directly for products to be visible (avoid waiting 35s for detached skeletons that never leave the DOM)
    await this.productCards.first().waitFor({ state: 'visible', timeout: 25000 });
    await this.page.waitForTimeout(500);
  }

  /**
   * Add a product to cart by name or the first available product
   */
  async addProductToCart(productName?: string): Promise<void> {

    let targetBtn: Locator | null = null;
    if (productName) {
      const card = this.page.locator('.q-card, .product-card, [class*="product-card"]').filter({
        hasText: new RegExp(productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      }).first();
      if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
        await card.scrollIntoViewIfNeeded().catch(() => {});

        // If card already has quantity controls [trash] 1 [+], it's already in the cart
        const inCartControls = card.locator('button:has-text("+"), button i:has-text("delete"), .q-field, input').first();
        if (await inCartControls.isVisible({ timeout: 1500 }).catch(() => false)) {
          console.log(`Product "${productName}" is already in the cart.`);
          return;
        }

        const cardAddBtn = card.locator('.q-btn, [role="button"], button, a, div, span').filter({ hasText: /^Add to Cart$/i }).last();
        if (await cardAddBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          targetBtn = cardAddBtn;
        }
      }
    }

    if (!targetBtn) {
      targetBtn = this.page.locator('.q-btn, [role="button"], button, a, div, span').filter({ hasText: /^Add to Cart$/i }).first();
    }

    await targetBtn.waitFor({ state: 'visible', timeout: 15000 });
    await targetBtn.scrollIntoViewIfNeeded().catch(() => {});
    await targetBtn.click({ force: true });

    // Wait for add-to-cart action to process
    await this.page.waitForTimeout(2500);
  }

  /**
   * Open Cart Drawer and click "Proceed To Cart" or navigate to /cart
   */
  async openCartAndProceed(): Promise<void> {
    // 1. If Cart Drawer Proceed button is already visible, click it
    const proceedBtn = this.page.locator('button, a').filter({ hasText: /Proceed To Cart/i }).first();
    if (await proceedBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await proceedBtn.click();
      await this.page.waitForURL(/\/cart/i, { timeout: 20000 }).catch(() => {});
      return;
    }

    // 2. Otherwise open Cart via header button
    const headerCartBtn = this.page.locator('button, a').filter({ hasText: /Your Cart/i }).first();
    if (await headerCartBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await headerCartBtn.click();
      await this.page.waitForTimeout(1000);
      if (await proceedBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await proceedBtn.click();
        await this.page.waitForURL(/\/cart/i, { timeout: 20000 }).catch(() => {});
        return;
      }
    }

    // 3. Fallback direct navigation to /cart
    await this.page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await this.page.waitForURL(/\/cart/i, { timeout: 20000 });
  }
}

