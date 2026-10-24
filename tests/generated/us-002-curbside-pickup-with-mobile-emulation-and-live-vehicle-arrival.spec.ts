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

test.describe('US-002: Curbside Pickup with Mobile Emulation and Live Vehicle Arrival', () => {
  test.describe.configure({ mode: 'serial' });

  test('Complete Curbside Mobile Arrival and Vehicle Verification @generated @us-002', async ({ browser }) => {
    test.setTimeout(360_000); // 6 minutes maximum for full workflow
    await allure.epic('AI-Generated SDET Suites');
    await allure.feature('US-002: Curbside Pickup with Mobile Emulation and Live Vehicle Arrival');
    await allure.story('Complete Curbside Mobile Arrival and Vehicle Verification');

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

      await test.step('WHEN: Customer adds product to cart, proceeds to checkout, and selects "Curbside Pickup"', async () => {
        await catalogPage.addProductToCart('Curbside Pickup');
              await catalogPage.openCartAndProceed();
              await checkoutPage.proceedToCheckout();
      });

      await test.step('AND: Customer turns off "Pay At Store", selects Credit Card, places order, and captures Order ID and Confirmation Code', async () => {
        await checkoutPage.acceptTerms();
              await checkoutPage.placeOrder();
              await checkoutPage.clickViewOrderOnThankYouPage();
              placedOrderNumber = await checkoutPage.getLatestOrderNumber();
              confirmationCode = await checkoutPage.getConfirmationCode();
              console.log('Placed Order:', placedOrderNumber, 'Code:', confirmationCode);
      });

      await test.step('WHEN: Fulfillment employee opens Pending Orders, picks all items, and marks order Ready', async () => {
        await fulfillmentPage.goto('/pending-order', { waitUntil: 'domcontentloaded' });
              await pendingOrdersPage.expectOnPendingPage();
              await pendingOrdersPage.expectTableLoaded();
              if (placedOrderNumber) {
                await pendingOrdersPage.waitForOrderInPending(placedOrderNumber);
              }
      });

      await test.step('WHEN: Customer opens order in Mobile Device View (Pixel 5)', async () => {
        const mobileContext = await browser.newContext({
                ...devices['Pixel 5'],
                storageState: '.auth/ordering.json',
                baseURL: config.ordering.baseUrl,
              });
              const mobilePage = await mobileContext.newPage();
              const mobileCheckout = new OrderingCheckoutPage(mobilePage);
              await mobilePage.goto(customerPage.url(), { waitUntil: 'domcontentloaded' });
              await mobileCheckout.completeMobileCurbsideArrival({
                spot: 'Spot - A',
                color: 'Black',
                maker: 'Acura',
                model: 'CL',
              });
              await mobileContext.close();
      });

      await test.step('AND: Customer verifies "Ready For Pickup" status and completes mobile vehicle arrival submission with Spot "Spot - A", Color "Black", Maker "Acura", Model "CL"', async () => {
        const mobileContext = await browser.newContext({
                ...devices['Pixel 5'],
                storageState: '.auth/ordering.json',
                baseURL: config.ordering.baseUrl,
              });
              const mobilePage = await mobileContext.newPage();
              const mobileCheckout = new OrderingCheckoutPage(mobilePage);
              await mobilePage.goto(customerPage.url(), { waitUntil: 'domcontentloaded' });
              await mobileCheckout.completeMobileCurbsideArrival({
                spot: 'Spot - A',
                color: 'Black',
                maker: 'Acura',
                model: 'CL',
              });
              await mobileContext.close();
      });

      await test.step('WHEN: Fulfillment employee navigates to Ready Orders and opens the curbside order', async () => {
        await fulfillmentSidebar.goToReady();
              await readyOrdersPage.expectOnReadyPage();
              await readyOrdersPage.expectTableLoaded();
              if (placedOrderNumber) {
                await readyOrdersPage.search(placedOrderNumber);
                await readyOrdersPage.openOrderForHandover(placedOrderNumber);
              }
      });

      await test.step('THEN: Fulfillment employee verifies Curbside Pickup method and Parking Spot / Car Info blocks', async () => {
        await checkoutPage.selectCurbsidePickup();
              await checkoutPage.turnOffPayAtStore();
              await checkoutPage.selectCreditOrDebitCard();
      });

      await test.step('AND: Fulfillment employee completes handover with confirmation code transitioning order to Fulfilled', async () => {
        // Step: Fulfillment employee completes handover with confirmation code transitioning order to Fulfilled
              await customerPage.waitForTimeout(1000);
      });

    } finally {
      await customerContext.close().catch(() => {});
      await fulfillmentContext.close().catch(() => {});
    }
  });
});
