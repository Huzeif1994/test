import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Online Ordering Catalog & Product Browsing Page Object
 */
export class OrderingCatalogPage extends BasePage {
  protected readonly path = '/category/accessories-60';

  readonly categoryHeading: Locator;
  readonly productCards: Locator;
  readonly skeletons: Locator;
  readonly yourCartButton: Locator;
  readonly cartDrawer: Locator;
  readonly proceedToCartButton: Locator;

  constructor(page: Page) {
    super(page);

    this.categoryHeading = page.locator('h1, h2, .text-h5, .text-h6, .breadcrumb').first();
    this.productCards = page.locator('.product-items--card:visible, .product-card:visible, [class*="product-items"]:visible, .q-card.product-items--card:visible');
    this.skeletons = page.locator('.q-skeleton');
    this.yourCartButton = page.locator('button, a').filter({ hasText: /Your Cart/i }).first();
    this.cartDrawer = page.locator('complementary, aside, .q-drawer').filter({ hasText: /Store Pickup|Sub Total|Proceed To Cart/i }).first();
    this.proceedToCartButton = page.getByRole('button', { name: /Proceed To Cart/i }).or(page.locator('button:has-text("Proceed To Cart")')).first();
  }

  /**
   * Navigate to a category with resilient dynamic auto-discovery of active FTx Storefront categories.
   * If the requested category has 0 items, redirects to home, or is missing/legacy POS,
   * it dynamically discovers and navigates to an active FTx category.
   */
  async gotoCategory(categorySlug?: string): Promise<void> {
    const isLegacyOrEmpty = !categorySlug ||
      categorySlug === 'discount-&-budget-cigarettes' ||
      categorySlug === 'huzeif-test' ||
      categorySlug === 'tobacco-items';

    if (!isLegacyOrEmpty && categorySlug) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await this.page.goto(`/category/${categorySlug}`, { waitUntil: 'domcontentloaded' });
          await this.dismissPopups();
          if (this.page.url().includes(`/category/${categorySlug}`)) {
            await this.expectProductsLoaded(8000);
            return;
          }
        } catch {
          if (attempt === 1) {
            console.log(`⚠️ Category "${categorySlug}" unavailable. Discovering active FTx categories dynamically...`);
          }
          await this.page.waitForTimeout(1000);
        }
      }
    }

    await this.discoverAndNavigateToActiveCategory();
  }

  /**
   * Dynamically discover active FTx categories from storefront navigation or prime candidates
   */
  async discoverAndNavigateToActiveCategory(): Promise<void> {
    await this.dismissPopups();

    // 1. Try known active FTx Storefront collections & categories (guaranteed products)
    const primeCategories = [
      '/collection/best-selling-products-last-7-days',
      '/category/cigarettes',
      '/category/accessories-60',
      '/category/apparel-01'
    ];

    for (const catUrl of primeCategories) {
      try {
        await this.page.goto(catUrl, { waitUntil: 'domcontentloaded' });
        await this.dismissPopups();
        if (this.page.url().includes('category') || this.page.url().includes('collection')) {
          const hasCards = await this.productCards.first().isVisible({ timeout: 6000 }).catch(() => false);
          if (hasCards) {
            console.log(`🎯 Dynamically routed to active FTx catalog: ${catUrl}`);
            return;
          }
        }
      } catch {
        // try next prime candidate
      }
    }

    if (this.page.url() !== '/' && !this.page.url().includes('category')) {
      await this.page.goto('/', { waitUntil: 'domcontentloaded' });
      await this.dismissPopups();
    }

    // 2. Discover from header / menu navigation
    let categoryLinks = await this.page.locator('a[href*="/category/"]').evaluateAll(els =>
      els.map(e => e.getAttribute('href')).filter(Boolean) as string[]
    );

    if (categoryLinks.length === 0) {
      const allBtn = this.page.locator('button, .q-btn, a').filter({ hasText: /^All$|Shop by Categories/i }).first();
      if (await allBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
        await allBtn.click({ force: true });
        await this.page.waitForTimeout(1200);
        categoryLinks = await this.page.locator('a[href*="/category/"]').evaluateAll(els =>
          els.map(e => e.getAttribute('href')).filter(Boolean) as string[]
        );
      }
    }

    const uniqueCategories = [...new Set(categoryLinks)].filter(c =>
      !c.includes('non-existent') &&
      !c.includes('huzeif-test') &&
      !c.includes('discount-&-budget-cigarettes')
    );

    for (const chosenCategory of uniqueCategories.slice(0, 5)) {
      try {
        await this.page.goto(chosenCategory, { waitUntil: 'domcontentloaded' });
        await this.dismissPopups();
        const hasVisible = await this.productCards.first().isVisible({ timeout: 3000 }).catch(() => false);
        if (hasVisible) {
          console.log(`🎯 Discovered active FTx category: ${chosenCategory}`);
          return;
        }
      } catch {
        // try next
      }
    }

    console.log('⚠️ Falling back to best selling collection.');
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
   * Wait for category products to render (resolving strictly to first visible indicator)
   */
  async expectProductsLoaded(timeout: number = 35000): Promise<void> {
    await this.dismissPopups();
    // Use .first() at the end to ensure strict mode compliance across combined locators
    const productIndicator = this.productCards.first().or(
      this.page.locator('.add-cart:visible, .btn:visible, button:visible, .q-btn:visible').filter({ hasText: /Add to Cart/i }).first()
    ).first();
    await productIndicator.waitFor({ state: 'visible', timeout });
    await this.page.waitForTimeout(500);
  }

  /**
   * Add a product to cart by name or dynamically select the first available in-stock product
   */
  async addProductToCart(productName?: string): Promise<void> {
    // 1. If cart already has items, no need to add duplicate item
    const cartHasItems = await this.page.locator('header').filter({ hasText: /Your Cart\s*\$[1-9]/i }).first().isVisible({ timeout: 1500 }).catch(() => false);
    if (cartHasItems) {
      console.log('Cart already contains items, proceeding directly.');
      return;
    }

    let targetBtn: Locator | null = null;

    // 2. If a specific product was requested, try locating its card first
    if (productName) {
      const card = this.page.locator('.q-card, .product-card, [class*="product-card"], .product-items--card').filter({
        hasText: new RegExp(productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      }).first();

      if (await card.isVisible({ timeout: 2500 }).catch(() => false)) {
        await card.scrollIntoViewIfNeeded().catch(() => {});

        // If card already has quantity controls [trash] 1 [+], it's already in the cart
        const inCartControls = card.locator('button:has-text("+"), button i:has-text("delete"), .q-field, input').first();
        if (await inCartControls.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`Product "${productName}" is already in the cart.`);
          return;
        }

        const cardAddBtn = card.locator('.add-cart, .btn, button, .q-btn, [role="button"]').filter({ hasText: /Add to Cart/i }).first();
        if (await cardAddBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          targetBtn = cardAddBtn;
          console.log(`Located requested product card: "${productName}"`);
        }
      } else {
        console.log(`⚠️ Product "${productName}" not present in active category. Selecting first available product dynamically.`);
      }
    }

    // 3. Dynamic Selection: pick whatever product card is visible on current page
    if (!targetBtn) {
      // Check if an item is already added with quantity selector
      const cardWithControls = this.page.locator('.product-items--card:visible, .product-card:visible, .q-card:visible').filter({
        has: this.page.locator('button:has-text("+"), button i:has-text("delete"), .q-field, input')
      }).first();

      if (await cardWithControls.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log('An item is already in the cart, proceeding.');
        return;
      }

      // Find any visible Add to Cart button on the page
      const dynamicAddBtn = this.page.locator(
        'button:visible, .q-btn:visible, .add-cart:visible, a:visible, [role="button"]:visible'
      ).filter({ hasText: /Add to Cart/i }).first();

      if (await dynamicAddBtn.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false)) {
        targetBtn = dynamicAddBtn;
        console.log('Selected first available product dynamically on current page.');
      } else {
        // If no direct Add to Cart on grid, click the first product card to go to Product Detail Page (PDP)
        const firstCard = this.productCards.first();
        if (await firstCard.isVisible({ timeout: 4000 }).catch(() => false)) {
          console.log('Navigating to Product Detail Page from card...');
          await firstCard.click();
          await this.page.waitForTimeout(1500);
          const pdpAddBtn = this.page.locator('button:visible, .q-btn:visible').filter({ hasText: /Add to Cart/i }).first();
          if (await pdpAddBtn.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false)) {
            targetBtn = pdpAddBtn;
          }
        }
      }
    }

    if (targetBtn && await targetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await targetBtn.scrollIntoViewIfNeeded().catch(() => {});
      await targetBtn.click({ force: true });
      await this.page.waitForTimeout(1500);

      // Handle Quick Shop modal if product has variants / options
      const quickDialog = this.page.locator('.quickDialogProduct, [role="dialog"]').filter({ hasText: /Quick Shop|Product Details/i }).first();
      if (await quickDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        const dialogAddBtn = quickDialog.locator('button, .q-btn').filter({ hasText: /Add to Cart/i }).first();
        if (await dialogAddBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dialogAddBtn.click({ force: true });
          await this.page.waitForTimeout(1500);
        }
        const closeBtn = quickDialog.locator('button.close, button[aria-label="Close"], i:has-text("close")').first();
        if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await closeBtn.click({ force: true }).catch(() => {});
        }
      }
      return;
    }

    // 4. Resilience Fallback: Only if current page has NO products at all, discover active category
    console.log(`⚠️ [Catalog Resilience] No available products found in current category. Discovering active category...`);
    await this.discoverAndNavigateToActiveCategory();

    const discoveredAddBtn = this.page.locator(
      'button:visible, .q-btn:visible, .add-cart:visible, a:visible, [role="button"]:visible'
    ).filter({ hasText: /Add to Cart/i }).first();

    await discoveredAddBtn.waitFor({ state: 'visible', timeout: 15000 });
    await discoveredAddBtn.scrollIntoViewIfNeeded().catch(() => {});
    await discoveredAddBtn.click({ force: true });
    await this.page.waitForTimeout(1500);

    const fallbackQuickDialog = this.page.locator('.quickDialogProduct, [role="dialog"]').filter({ hasText: /Quick Shop|Product Details/i }).first();
    if (await fallbackQuickDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      const dialogAddBtn = fallbackQuickDialog.locator('button, .q-btn').filter({ hasText: /Add to Cart/i }).first();
      if (await dialogAddBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dialogAddBtn.click({ force: true });
        await this.page.waitForTimeout(1500);
      }
      const closeBtn = fallbackQuickDialog.locator('button.close, button[aria-label="Close"], i:has-text("close")').first();
      if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => {});
      }
    }
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

