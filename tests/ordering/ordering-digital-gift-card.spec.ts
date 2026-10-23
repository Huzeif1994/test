import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { OrderingGiftCardPage } from '../../pages/ordering/OrderingGiftCardPage';
import { OrderingCheckoutPage } from '../../pages/ordering/OrderingCheckoutPage';
import { maximizeWindow } from '../../utils/window';

test.describe('Digital Gift Card Lifecycle: Purchase & Live Activation', () => {
  test('Customer purchases Digital Gift Card via Buy Now, activates in Newly Purchased tab, and validates Active status @ordering @giftcard', async ({
    page,
  }) => {
    test.setTimeout(240_000); // 4 minutes timeout for complete purchase and activation

    await allure.epic('Online Ordering Storefront');
    await allure.feature('Digital Gift Card Lifecycle');
    await allure.story('Customer purchases Digital Gift Card -> Activates via Newly Purchased modal -> Verifies Activated tab');
    await allure.severity('critical');

    await maximizeWindow(page);

    const giftCardPage = new OrderingGiftCardPage(page);
    const checkoutPage = new OrderingCheckoutPage(page);

    let orderNumber = '';

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Navigate to /gift-cards and verify available cards
    // ─────────────────────────────────────────────────────────────
    await test.step('Customer opens Gift Cards catalog page', async () => {
      await giftCardPage.openGiftCardsCatalog();
      await expect(page).toHaveURL(/gift-cards/i, { timeout: 25000 });
      await expect(page.locator('text=/Gift Card/i').first()).toBeVisible({ timeout: 20000 });
    });

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Select Gift Card and configure Digital Card amount
    // ─────────────────────────────────────────────────────────────
    await test.step('Customer selects Gift Card and configures Digital denomination ($25)', async () => {
      await giftCardPage.selectGiftCard(0);
      await expect(page).toHaveURL(/\/gift-cards\/.+/, { timeout: 20000 });

      // Configure $25 and click Buy Now
      await giftCardPage.configureAndBuyDigitalCard(25);
    });

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Verify Checkout Line Item and Complete Order
    // ─────────────────────────────────────────────────────────────
    await test.step('Customer verifies Gift Card - Digital item on Checkout and completes order', async () => {
      await checkoutPage.expectCheckoutLoaded();

      // Verify line item reflects Digital Gift Card
      const digitalItem = page.getByRole('heading', { name: /Gift Card - Digital/i }).or(page.locator('text=/Gift Card - Digital/i'));
      await expect(digitalItem.first()).toBeVisible({ timeout: 15000 });

      // Step 1: Order Details (Store Pickup) -> Continue
      await checkoutPage.selectInStorePickup();

      // Step 3: Payment -> Credit or Debit Card -> Place Order
      await checkoutPage.selectCreditOrDebitCard();
      await checkoutPage.acceptTerms();
      await checkoutPage.placeOrder();

      // Verify order placement success heading
      const orderPlacedHeading = page.getByRole('heading', { name: /Thank you|order has been placed/i });
      await expect(orderPlacedHeading).toBeVisible({ timeout: 45000 });

      // Capture order number from Thank you page
      const orderNumberElem = page.locator('text=/Your order Number:/i, strong:has-text("Your order Number")').first();
      if (await orderNumberElem.isVisible({ timeout: 5000 }).catch(() => false)) {
        const text = await orderNumberElem.innerText();
        const match = text.match(/\d+/);
        if (match) orderNumber = match[0];
      }
      console.log('Purchased Digital Gift Card Order Number:', orderNumber);
    });

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Navigate to /manage-gift-cards via "View Gift Card"
    // ─────────────────────────────────────────────────────────────
    await test.step('Customer navigates to /manage-gift-cards from Thank You page', async () => {
      const viewGiftCardLink = page.getByRole('link', { name: /View Gift Card/i });
      if (await viewGiftCardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await viewGiftCardLink.click();
      } else {
        await giftCardPage.gotoManageGiftCards();
      }
      await expect(page).toHaveURL(/manage-gift-cards/i, { timeout: 25000 });
      await page.waitForTimeout(2000);
    });

    // ─────────────────────────────────────────────────────────────
    // STEP 5: Activate Gift Card in Newly Purchased & Verify Activated Tab
    // ─────────────────────────────────────────────────────────────
    await test.step('Customer activates card in Newly Purchased tab, confirms modal, and validates Active status', async () => {
      const result = await giftCardPage.activateNewlyPurchasedGiftCard();
      console.log('Completed lifecycle activation for Gift Card:', result.cardNumber);
    });
  });
});
