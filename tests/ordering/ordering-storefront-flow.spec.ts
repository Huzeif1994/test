import { allure } from 'allure-playwright';
import { test, expect } from '../../fixtures/pages';

test.describe('Online Ordering Storefront & Checkout Flow', () => {
  test('Customer browses catalog and verifies category items @ordering @catalog', async ({
    orderingCatalogPage,
  }) => {
    test.setTimeout(180_000);

    await allure.epic('Online Ordering');
    await allure.feature('Catalog Browsing');
    await allure.severity('critical');

    await test.step('Navigate to Huzeif Test category page', async () => {
      await orderingCatalogPage.gotoCategory('huzeif-test');
    });

    await test.step('Verify category items rendered and skeletons detached', async () => {
      await orderingCatalogPage.expectProductsLoaded();
      await expect(orderingCatalogPage.productCards.first()).toBeVisible();
    });
  });

  test('Customer adds item to cart and proceeds to cart review @ordering @cart', async ({
    page,
    orderingCatalogPage,
  }) => {
    test.setTimeout(180_000);

    await allure.epic('Online Ordering');
    await allure.feature('Shopping Cart');
    await allure.severity('critical');

    await test.step('Navigate to category and add product to cart', async () => {
      await orderingCatalogPage.gotoCategory('huzeif-test');
      await orderingCatalogPage.addProductToCart();
    });

    await test.step('Open cart drawer and proceed to Cart page', async () => {
      await orderingCatalogPage.openCartAndProceed();
      await expect(page).toHaveURL(/\/cart/i);
    });
  });

  test('Customer completes checkout with Pay At Store and places order @ordering @checkout', async ({
    orderingCatalogPage,
    orderingCheckoutPage,
  }) => {
    test.setTimeout(240_000);

    await allure.epic('Online Ordering');
    await allure.feature('Checkout & Order Placement');
    await allure.severity('blocker');

    await test.step('Ensure item in cart and proceed to Checkout page', async () => {
      await orderingCatalogPage.gotoCategory('huzeif-test');
      await orderingCatalogPage.addProductToCart();
      await orderingCatalogPage.openCartAndProceed();
      await orderingCheckoutPage.proceedToCheckout();
    });

    await test.step('Select Pay At Store and accept terms', async () => {
      await orderingCheckoutPage.selectPayAtStore();
      await orderingCheckoutPage.acceptTerms();
    });

    await test.step('Place order and verify submission', async () => {
      await orderingCheckoutPage.placeOrder();
    });

    await test.step('Verify placed order appears in Orders history', async () => {
      const orderNumber = await orderingCheckoutPage.getLatestOrderNumber();
      console.log('Placed order number verified:', orderNumber);
      expect(orderNumber).toBeTruthy();
    });
  });
});

