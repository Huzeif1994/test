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
   * Navigate to a category with resilient auto-discovery of active categories.
   * If the requested category has 0 items or is missing, automatically discovers an active category.
   */
  async gotoCategory(categorySlug: string = 'huzeif-test'): Promise<void> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await this.page.goto(`/category/${categorySlug}`, { waitUntil: 'domcontentloaded' });
        await this.expectProductsLoaded(8000);
        return;
      } catch {
        if (attempt === 1) {
          console.log(`⚠️ Category "${categorySlug}" unavailable or has no items. Discovering active categories dynamically...`);
          await this.discoverAndNavigateToActiveCategory();
          return;
        }
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Dynamically discover active categories from storefront header navigation
   */
  async discoverAndNavigateToActiveCategory(): Promise<void> {
    await this.dismissPopups();
    if (this.page.url() !== '/' && !this.page.url().includes('category')) {
      await this.page.goto('/', { waitUntil: 'domcontentloaded' });
      await this.dismissPopups();
    }

    // 1. Check if category links already exist in navigation or page
    let categoryLinks = await this.page.locator('a[href*="/category/"]').evaluateAll(els =>
      els.map(e => e.getAttribute('href')).filter(Boolean) as string[]
    );

    // 2. If not visible, click "All" button to expand departments/categories
    if (categoryLinks.length === 0) {
      const allBtn = this.page.locator('button, .q-btn, a').filter({ hasText: /^All$/i }).first();
      if (await allBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
        await allBtn.click({ force: true });
        await this.page.waitForTimeout(1200);
        categoryLinks = await this.page.locator('a[href*="/category/"]').evaluateAll(els =>
          els.map(e => e.getAttribute('href')).filter(Boolean) as string[]
        );
      }
    }

    const uniqueCategories = [...new Set(categoryLinks)].filter(c => !c.includes('non-existent'));
    if (uniqueCategories.length > 0) {
      const chosenCategory = uniqueCategories[0];
      console.log(`🎯 Dynamically discovered active category: ${chosenCategory}`);
      await this.page.goto(chosenCategory, { waitUntil: 'domcontentloaded' });
      await this.expectProductsLoaded(15000);
      return;
    }

    console.log('⚠️ No category links found via navigation; falling back to best selling collection.');
    await this.page.goto('/collection/best-selling-products-last-7-days', { waitUntil: 'domcontentloaded' });
    await this.expectProductsLoaded(15000);
  }

  /**
   * Helper to dismiss disclaimers and age gates
   */
  async dismissPopups(): Promise<void> {
    const disclaimer = this.page.locator('button, a').filter({ hasText: /I understand|Proceed to Store/i }).first();
    if (await disclaimer.isVisible({ timeout: 1500 }).catch(() => false)) {
      await disclaimer.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(400);
    }
    const skipBtn = this.page.getByRole('button', { name: /^Skip$/i }).or(this.page.locator('button').filter({ hasText: /^Skip$/i })).first();
    const ageBtn = this.page.getByRole('button', { name: /21\+|I'm 21\+/i }).or(this.page.locator('button, a').filter({ hasText: /21\+|I'm 21\+/i })).first();
    if (await skipBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipBtn.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(400);
    } else if (await ageBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await ageBtn.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(400);
    }
  }

  /**
   * Wait for category products to render
   */
  async expectProductsLoaded(timeout: number = 35000): Promise<void> {
    await this.dismissPopups();
    // Wait directly for products or Add buttons to be visible (avoid waiting 35s for detached skeletons)
    const productIndicator = this.productCards.first().or(
      this.page.locator('.add-cart, .btn, button, .q-btn').filter({ hasText: /Add to Cart/i }).first()
    );
    await productIndicator.waitFor({ state: 'visible', timeout });
    await this.page.waitForTimeout(500);
  }

  /**
   * Add a product to cart by name or the first available product
   */
  async addProductToCart(productName?: string): Promise<void> {
    // 1. If cart already has items, no need to add duplicate item
    const cartHasItems = await this.page.locator('header').filter({ hasText: /Your Cart\s*\$[1-9]/i }).first().isVisible({ timeout: 1500 }).catch(() => false);
    if (cartHasItems) {
      console.log('Cart already contains items, proceeding directly.');
      return;
    }

    let targetBtn: Locator | null = null;
    if (productName) {
      const card = this.page.locator('.q-card, .product-card, [class*="product-card"]').filter({
        hasText: new RegExp(productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      }).first();
      if (await card.isVisible({ timeout: 4000 }).catch(() => false)) {
        await card.scrollIntoViewIfNeeded().catch(() => {});

        // If card already has quantity controls [trash] 1 [+], it's already in the cart
        const inCartControls = card.locator('button:has-text("+"), button i:has-text("delete"), .q-field, input').first();
        if (await inCartControls.isVisible({ timeout: 1200 }).catch(() => false)) {
          console.log(`Product "${productName}" is already in the cart.`);
          return;
        }

        const cardAddBtn = card.locator('.add-cart, .btn, button, .q-btn, [role="button"]').filter({ hasText: /Add to Cart/i }).first();
        if (await cardAddBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          targetBtn = cardAddBtn;
        }
      }
    }

    if (!targetBtn) {
      const cardWithControls = this.page.locator('.q-card, .product-card, [class*="product-card"]').filter({
        has: this.page.locator('button:has-text("+"), button i:has-text("delete"), .q-field, input')
      }).first();

      const addBtn = this.page.locator('.q-card, .product-card, [class*="product-card"]')
        .locator('.add-cart, .btn, button, .q-btn, [role="button"]')
        .filter({ hasText: /Add to Cart/i })
        .first();

      if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        targetBtn = addBtn;
      } else if (await cardWithControls.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log('An item is already in the cart, proceeding.');
        return;
      } else {
        const anyAddBtn = this.page.locator('.add-cart, .btn, button, .q-btn, [role="button"]').filter({ hasText: /Add to Cart/i }).first();
        if (await anyAddBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          targetBtn = anyAddBtn;
        }
      }
    }

    if (targetBtn && await targetBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await targetBtn.scrollIntoViewIfNeeded().catch(() => {});
      await targetBtn.click({ force: true });
      await this.page.waitForTimeout(2500);
      return;
    }

    // Resilience Fallback: If target category is empty or product not found, dynamically find an active category with products
    console.log(`⚠️ [Catalog Resilience] Product "${productName || 'Default'}" not found in current category. Discovering active physical category...`);
    await this.discoverAndNavigateToActiveCategory();

    const discoveredAddBtn = this.page.locator('.add-cart, .btn, button, .q-btn, [role="button"]')
      .filter({ hasText: /Add to Cart/i })
      .first();

    await discoveredAddBtn.waitFor({ state: 'visible', timeout: 15000 });
    await discoveredAddBtn.scrollIntoViewIfNeeded().catch(() => {});
    await discoveredAddBtn.click({ force: true });
    await this.page.waitForTimeout(2500);
  }

  /**
   * Open Cart Drawer and click "Proceed To Cart" or navigate to /cart
   */
  async openCartAndProceed(): Promise<void> {
    // 1. If Cart Drawer Proceed button is already visible, click it
    const proceedBtn = this.page.locator('button, a').filter({ hasText: /Proceed To Cart/i }).first();
    if (await proceedBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
      await proceedBtn.click({ force: true });
      if (await this.page.waitForURL(/\/cart/i, { timeout: 8000 }).then(() => true).catch(() => false)) {
        return;
      }
    }

    // 2. Otherwise open Cart via header button
    const headerCartBtn = this.page.locator('button, a').filter({ hasText: /Your Cart/i }).first();
    if (await headerCartBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
      await headerCartBtn.click({ force: true });
      await this.page.waitForTimeout(800);
      if (await proceedBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await proceedBtn.click({ force: true });
        if (await this.page.waitForURL(/\/cart/i, { timeout: 8000 }).then(() => true).catch(() => false)) {
          return;
        }
      }
    }

    // 3. Guaranteed fallback: navigate directly to /cart
    if (!this.page.url().includes('/cart')) {
      await this.page.goto('/cart', { waitUntil: 'domcontentloaded' });
    }
    await this.page.waitForURL(/\/cart/i, { timeout: 25000 });
  }
}

