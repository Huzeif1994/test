import { test, expect, devices } from '@playwright/test';
import { allure } from 'allure-playwright';
import { config } from '../../config/environment';
import { OrderingCatalogPage } from '../../pages/ordering/OrderingCatalogPage';
import { OrderingCheckoutPage } from '../../pages/ordering/OrderingCheckoutPage';
import { OrderingGiftCardPage } from '../../pages/ordering/OrderingGiftCardPage';
import { PendingOrdersPage } from '../../pages/fulfillment/orders/PendingOrdersPage';
import { OrderDetailPage } from '../../pages/fulfillment/orders/OrderDetailPage';
import { PickOrderDetailPage } from '../../pages/fulfillment/picking/PickOrderDetailPage';
import { ItemInfoDrawer } from '../../pages/fulfillment/modals/ItemInfoDrawer';
import { PickOrderPackagePage } from '../../pages/fulfillment/picking/PickOrderPackagePage';
import { AssignStagingDrawer } from '../../pages/fulfillment/modals/AssignStagingDrawer';
import { ReadyOrdersPage } from '../../pages/fulfillment/orders/ReadyOrdersPage';
import { StorePickupDetailPage } from '../../pages/fulfillment/detail/StorePickupDetailPage';
import { FulfilledOrdersPage } from '../../pages/fulfillment/orders/FulfilledOrdersPage';
import { FulfillmentSidebar } from '../../pages/fulfillment/navigation/FulfillmentSidebar';

test.describe('US-001: Customer Store Pickup with Credit Card and Fulfillment Handover', () => {
  test.describe.configure({ mode: 'serial' });

  test('Complete In-Store Pickup Lifecycle with Confirmation Code Handover @generated @us-001', async ({ browser }) => {
    test.setTimeout(360_000); // 6 minutes maximum for full workflow
    await allure.epic('AI-Generated SDET Suites');
    await allure.feature('US-001: Customer Store Pickup with Credit Card and Fulfillment Handover');
    await allure.story('Complete In-Store Pickup Lifecycle with Confirmation Code Handover');

    let placedOrderNumber = '';
    let confirmationCode = '';

    // --- Customer Storefront Context ---
    const customerContext = await browser.newContext({
      storageState: '.auth/ordering.json',
      baseURL: config.ordering.baseUrl,
      viewport: { width: 1366, height: 768 },
    });
    const customerPage = await customerContext.newPage();
    const catalogPage = new OrderingCatalogPage(customerPage);
    const checkoutPage = new OrderingCheckoutPage(customerPage);
    const giftCardPage = new OrderingGiftCardPage(customerPage);

    // --- Fulfillment Employee Context ---
    const fulfillmentContext = await browser.newContext({
      storageState: '.auth/fulfillment.json',
      baseURL: config.fulfillment.baseUrl,
      viewport: { width: 1366, height: 768 },
    });
    const fulfillmentPage = await fulfillmentContext.newPage();
    const pendingOrdersPage = new PendingOrdersPage(fulfillmentPage);
    const orderDetailPage = new OrderDetailPage(fulfillmentPage);
    const pickOrderDetailPage = new PickOrderDetailPage(fulfillmentPage);
    const itemInfoDrawer = new ItemInfoDrawer(fulfillmentPage);
    const pickOrderPackagePage = new PickOrderPackagePage(fulfillmentPage);
    const assignStagingDrawer = new AssignStagingDrawer(fulfillmentPage);
    const readyOrdersPage = new ReadyOrdersPage(fulfillmentPage);
    const storePickupDetailPage = new StorePickupDetailPage(fulfillmentPage);
    const fulfilledOrdersPage = new FulfilledOrdersPage(fulfillmentPage);
    const fulfillmentSidebar = new FulfillmentSidebar(fulfillmentPage);

    try {
      await test.step('GIVEN: Customer clears shopping cart and navigates to "huzeif-test" category', async () => {
        await checkoutPage.clearCartIfNotEmpty();
              await catalogPage.gotoCategory('huzeif-test');
      });

      await test.step('WHEN: Customer adds "CASA TURRENT SERIE 1973 ROBUSTO" product to cart and proceeds to checkout', async () => {
        await catalogPage.addProductToCart('CASA TURRENT SERIE 1973 ROBUSTO');
              await catalogPage.openCartAndProceed();
              await checkoutPage.proceedToCheckout();
      });

      await test.step('AND: Customer selects "In Store Pickup", turns off "Pay At Store", and selects "Credit or Debit Card"', async () => {
        await checkoutPage.selectInStorePickup();
              await checkoutPage.turnOffPayAtStore();
              await checkoutPage.selectCreditOrDebitCard();
      });

      await test.step('AND: Customer accepts terms and places order, capturing Order ID and Confirmation Code', async () => {
        await checkoutPage.acceptTerms();
              await checkoutPage.placeOrder();
              await checkoutPage.clickViewOrderOnThankYouPage();
              placedOrderNumber = await checkoutPage.getLatestOrderNumber();
              confirmationCode = await checkoutPage.getConfirmationCode();
              console.log('Placed Order:', placedOrderNumber, 'Code:', confirmationCode);
      });

      await test.step('WHEN: Fulfillment employee searches for the placed order in Pending Orders', async () => {
        await fulfillmentPage.goto('/pending-order', { waitUntil: 'domcontentloaded' });
              await pendingOrdersPage.expectOnPendingPage();
              await pendingOrdersPage.expectTableLoaded();
              if (placedOrderNumber) {
                await pendingOrdersPage.waitForOrderInPending(placedOrderNumber);
              }
      });

      await test.step('AND: Fulfillment employee initiates Start Picking and picks all required items', async () => {
        await pendingOrdersPage.openOrderDetail(placedOrderNumber);
              await orderDetailPage.expectOnOrderDetail();
              await orderDetailPage.clickStartPicking();
              await pickOrderDetailPage.expectOnPickOrderPage();
              await pickOrderDetailPage.pickAllItems(itemInfoDrawer);
              await pickOrderDetailPage.clickNext();
      });

      await test.step('AND: Fulfillment employee completes package assignment and marks the order Ready', async () => {
        const onAssign = await fulfillmentPage.waitForURL(/assign-package/i, { timeout: 10000 }).then(() => true).catch(() => false);
              if (onAssign) {
                await pickOrderPackagePage.selectAllPackages();
                await pickOrderPackagePage.clickAssignStagingArea();
                await assignStagingDrawer.expectDrawerOpen();
                await assignStagingDrawer.selectStagingArea();
                await assignStagingDrawer.clickSave();
                await pickOrderPackagePage.clickMarkReady();
                await pickOrderPackagePage.expectOrderCompletedAndRedirected();
              } else {
                const directReady = fulfillmentPage.locator('button').filter({ hasText: /^MARK READY$/i }).first();
                if (await directReady.isVisible({ timeout: 4000 }).catch(() => false)) {
                  await directReady.click();
                }
              }
      });

      await test.step('WHEN: Fulfillment employee navigates to Ready Orders and opens order for handover', async () => {
        await fulfillmentSidebar.goToReady();
              await readyOrdersPage.expectOnReadyPage();
              await readyOrdersPage.expectTableLoaded();
              if (placedOrderNumber) {
                await readyOrdersPage.search(placedOrderNumber);
                await readyOrdersPage.openOrderForHandover(placedOrderNumber);
              }
      });

      await test.step('AND: Fulfillment employee submits customer confirmation code in Handover modal', async () => {
        await storePickupDetailPage.expectOnOrderDetail();
              await storePickupDetailPage.clickContinue();
              if (confirmationCode) {
                await storePickupDetailPage.enterConfirmationCode(confirmationCode);
              }
      });

      await test.step('THEN: The order transitions to Fulfilled status and appears in Fulfilled Orders listing', async () => {
        await fulfillmentSidebar.goToFulfilled();
              await fulfilledOrdersPage.expectOnFulfilledPage();
              if (placedOrderNumber) {
                await fulfilledOrdersPage.search(placedOrderNumber);
                await fulfilledOrdersPage.expectOrderRowVisible(placedOrderNumber);
              }
      });

    } finally {
      await customerContext.close().catch(() => {});
      await fulfillmentContext.close().catch(() => {});
    }
  });
});
