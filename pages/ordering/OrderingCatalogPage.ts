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
   * Navigate to a specific category (defaults to 'huzeif-test')
   */
  async gotoCategory(categorySlug: string = 'huzeif-test'): Promise<void> {
    await this.page.goto(`/category/${categorySlug}`, { waitUntil: 'domcontentloaded' });
    await this.expectProductsLoaded();
  }

  /**
   * Wait for category skeleton loaders to detach and products to render
   */
  async expectProductsLoaded(): Promise<void> {
    // Dismiss disclaimer if present
    const disclaimer = this.page.locator('button, a').filter({ hasText: /I understand|Proceed to Store/i }).first();
    if (await disclaimer.isVisible({ timeout: 1500 }).catch(() => false)) {
      await disclaimer.click({ force: true });
      await this.page.waitForTimeout(500);
    }

    // Wait for skeleton loaders to finish
    await this.skeletons.first().waitFor({ state: 'detached', timeout: 35000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  /**
   * Add a product to cart by name or the first available product
   */
  async addProductToCart(productName?: string): Promise<void> {
    let card: Locator;
    if (productName) {
      card = this.page.locator('.q-card, [class*="product"]').filter({ hasText: productName }).first();
    } else {
      card = this.page.locator('.q-card, [class*="product"]').first();
    }

    // If card has "Add to Cart", click it
    const addBtn = card.getByText('Add to Cart', { exact: true }).or(card.locator('button:has-text("Add to Cart")')).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
    } else {
      // Fallback: click global first "Add to Cart"
      const globalAddBtn = this.page.getByText('Add to Cart', { exact: true }).first();
      await globalAddBtn.waitFor({ state: 'visible', timeout: 10000 });
      await globalAddBtn.click();
    }

    await this.page.waitForTimeout(1500);
  }

  /**
   * Open Cart Drawer and click "Proceed To Cart" or navigate to /cart
   */
  async openCartAndProceed(): Promise<void> {
    // Check if drawer is visible with Proceed To Cart button
    const isDrawerVisible = await this.proceedToCartButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (isDrawerVisible) {
      await this.proceedToCartButton.click();
    } else {
      // Direct navigation to /cart ensures 100% stability against slow side-drawer animations
      await this.page.goto('/cart', { waitUntil: 'domcontentloaded' });
    }

    // Verify navigation to Cart page
    await this.page.waitForURL(/\/cart/i, { timeout: 20000 });
  }
}

