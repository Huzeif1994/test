import { test, expect, Page } from '@playwright/test';
import { allure } from 'allure-playwright';
import { config } from '../../config/environment';
import { maximizeWindow } from '../../utils/window';
import { OrderingCatalogPage } from '../../pages/ordering/OrderingCatalogPage';
import { OrderingCheckoutPage } from '../../pages/ordering/OrderingCheckoutPage';
import { PendingOrdersPage } from '../../pages/fulfillment/orders/PendingOrdersPage';
import { ReadyOrdersPage } from '../../pages/fulfillment/orders/ReadyOrdersPage';
import { FulfilledOrdersPage } from '../../pages/fulfillment/orders/FulfilledOrdersPage';
import { FulfillmentSidebar } from '../../pages/fulfillment/navigation/FulfillmentSidebar';
import { OrderDetailPage } from '../../pages/fulfillment/orders/OrderDetailPage';
import { PickOrderDetailPage } from '../../pages/fulfillment/picking/PickOrderDetailPage';
import { ItemInfoDrawer } from '../../pages/fulfillment/modals/ItemInfoDrawer';
import { DeliveryHandlingDrawer } from '../../pages/fulfillment/modals/DeliveryHandlingDrawer';
import { PickOrderPackagePage } from '../../pages/fulfillment/picking/PickOrderPackagePage';
import { AssignStagingDrawer } from '../../pages/fulfillment/modals/AssignStagingDrawer';
import { StorePickupDetailPage } from '../../pages/fulfillment/detail/StorePickupDetailPage';

test.describe('E2E Flow 1: In-Store Pickup with Credit Card & Handover Completion', () => {
  test('Customer places In-Store Pickup order with Credit Card -> Fulfillment picks, marks Ready, enters Confirmation Code -> Order fulfilled @bridge @flow1', async ({
    browser,
  }, testInfo) => {
    test.setTimeout(360_000); // 6 minutes for full cross-app lifecycle

    await allure.epic('Cross-App E2E Integration');
    await allure.feature('Flow 1: In-Store Pickup with Credit Card');
    await allure.story('Customer places order -> Staff picks & marks Ready -> Confirmation code handover -> Fulfilled');
    await allure.severity('blocker');

    let placedOrderNumber = '';
    let confirmationCode = '';
    const isHeaded = process.argv.some(arg => arg.includes('--headed') || arg.includes('--ui') || arg === '-h') || process.env.HEADED === 'true';
    const desktopViewport = isHeaded ? null : { width: 1366, height: 768 };
    const recordVideoConfig = testInfo.project.use.video === 'on' ? { dir: testInfo.outputDir } : undefined;

    // Register network interceptor to capture confirmation code from API responses
    const listenForConfirmationCode = (targetPage: Page) => {
      targetPage.on('response', async (res) => {
        try {
          const url = res.url();
          if (url.includes('/order') || url.includes('/checkout') || url.includes('/store-pickup') || url.includes('/cart')) {
            const text = await res.text().catch(() => '');
            if (text.includes('customerConfirmationCode') || text.includes('confirmationCode')) {
              const json = JSON.parse(text);
              const found =
                json.customerConfirmationCode ||
                json.confirmationCode ||
                json.data?.customerConfirmationCode ||
                json.data?.confirmationCode ||
                json.order?.customerConfirmationCode ||
                json.order?.confirmationCode ||
                json.orderDetail?.customerConfirmationCode;
              if (found && typeof found === 'string' && found.length >= 4) {
                confirmationCode = found.trim();
                console.log('Flow 1: Intercepted Confirmation Code from API:', confirmationCode);
              }
            }
          }
        } catch {}
      });
    };

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Customer Storefront Session (Online Ordering)
    // ─────────────────────────────────────────────────────────────
    const customerContext = await browser.newContext({
      storageState: '.auth/ordering.json',
      baseURL: config.ordering.baseUrl,
      viewport: desktopViewport,
      recordVideo: recordVideoConfig,
    });
    const customerPage = await customerContext.newPage();
    await maximizeWindow(customerPage);
    listenForConfirmationCode(customerPage);

    const catalogPage = new OrderingCatalogPage(customerPage);
    const checkoutPage = new OrderingCheckoutPage(customerPage);

    await test.step('Customer clears cart, browses huzeif-test category, and proceeds to checkout', async () => {
      await checkoutPage.clearCartIfNotEmpty();
      await catalogPage.gotoCategory('huzeif-test');
      await catalogPage.addProductToCart('CASA TURRENT SERIE 1973 ROBUSTO');
      await catalogPage.openCartAndProceed();
      await checkoutPage.proceedToCheckout();
    });

    await test.step('Customer selects In Store Pickup, turns OFF Pay At Store, and selects Credit or Debit Card', async () => {
      await checkoutPage.selectInStorePickup();
      await checkoutPage.turnOffPayAtStore();
      await checkoutPage.selectCreditOrDebitCard();
      await checkoutPage.acceptTerms();
    });

    await test.step('Customer places order and captures Order ID and Confirmation Code', async () => {
      await checkoutPage.placeOrder();

      // Click "View Order" from Thank You / Confirmation page to reach /track-order/:orderId
      await checkoutPage.clickViewOrderOnThankYouPage();

      // Extract Confirmation Code from /track-order/:orderId
      const uiCode = await checkoutPage.getConfirmationCode();
      if (uiCode) confirmationCode = uiCode;

      placedOrderNumber = await checkoutPage.getLatestOrderNumber();
      console.log('Flow 1: Captured Placed Order Number:', placedOrderNumber);
      console.log('Flow 1: Captured Confirmation Code:', confirmationCode);
      expect(placedOrderNumber).toBeTruthy();
    });

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Fulfillment App Session (Pick, Stage, Mark Ready)
    // ─────────────────────────────────────────────────────────────
    const fulfillmentContext = await browser.newContext({
      storageState: '.auth/fulfillment.json',
      baseURL: config.fulfillment.baseUrl,
      viewport: desktopViewport,
      recordVideo: recordVideoConfig,
    });
    const fulfillmentPage = await fulfillmentContext.newPage();
    await maximizeWindow(fulfillmentPage);
    listenForConfirmationCode(fulfillmentPage);

    const pendingOrdersPage = new PendingOrdersPage(fulfillmentPage);
    const orderDetailPage = new OrderDetailPage(fulfillmentPage);
    const pickOrderDetailPage = new PickOrderDetailPage(fulfillmentPage);
    const itemInfoDrawer = new ItemInfoDrawer(fulfillmentPage);
    const deliveryHandlingDrawer = new DeliveryHandlingDrawer(fulfillmentPage);
    const pickOrderPackagePage = new PickOrderPackagePage(fulfillmentPage);
    const assignStagingDrawer = new AssignStagingDrawer(fulfillmentPage);
    const readyOrdersPage = new ReadyOrdersPage(fulfillmentPage);
    const storePickupDetailPage = new StorePickupDetailPage(fulfillmentPage);
    const fulfilledOrdersPage = new FulfilledOrdersPage(fulfillmentPage);
    const fulfillmentSidebar = new FulfillmentSidebar(fulfillmentPage);

    let searchKeyword = '';
    await test.step('Fulfillment employee searches for order in Pending Orders', async () => {
      await fulfillmentPage.goto('/pending-order', { waitUntil: 'domcontentloaded' });
      await pendingOrdersPage.expectOnPendingPage();
      await pendingOrdersPage.expectTableLoaded();

      if (placedOrderNumber) {
        searchKeyword = placedOrderNumber;
        await pendingOrdersPage.waitForOrderInPending(searchKeyword);
      }
    });

    const pendingCount = await pendingOrdersPage.getRowCount();

    if (pendingCount > 0) {
      await test.step('Open Order Detail and initiate Start Picking', async () => {
        if (searchKeyword) {
          await pendingOrdersPage.openOrderDetail(searchKeyword);
        } else {
          await pendingOrdersPage.openOrderDetail();
        }
        await orderDetailPage.expectOnOrderDetail();
        await orderDetailPage.clickStartPicking();
        await pickOrderDetailPage.expectOnPickOrderPage();
      });

      const productCount = await pickOrderDetailPage.getProductCount();

      if (productCount > 0) {
        await test.step('Pick order items including any linked products', async () => {
          await pickOrderDetailPage.pickAllItems(itemInfoDrawer);
        });

        await test.step('Click Next to proceed from Pick Order Detail', async () => {
          await pickOrderDetailPage.clickNext();
        });

        if (await deliveryHandlingDrawer.isDrawerVisible(4000)) {
          await test.step('Complete Delivery Handling Options if prompted', async () => {
            await deliveryHandlingDrawer.completeDeliveryHandling({
              containsType: 'Contains Both',
              instructions: 'Handle with care.',
            });
          });
        }

        const onAssignPackage = await fulfillmentPage.waitForURL(/assign-package/i, { timeout: 15000 }).then(() => true).catch(() => false);
        if (onAssignPackage) {
          await test.step('Assign Staging Area to package', async () => {
            await pickOrderPackagePage.expectOnAssignPackagePage();
            await pickOrderPackagePage.selectAllPackages();
            await pickOrderPackagePage.clickAssignStagingArea();
            await assignStagingDrawer.expectDrawerOpen();
            await assignStagingDrawer.selectStagingArea();
            await assignStagingDrawer.clickSave();
          });

          await test.step('Finalize order: Click Mark Ready', async () => {
            await pickOrderPackagePage.clickMarkReady();
            await pickOrderPackagePage.expectOrderCompletedAndRedirected();
          });
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Ready Orders Handover & Confirmation Code Submission
    // ─────────────────────────────────────────────────────────────
    await test.step('Navigate to Ready Orders and open order for handover', async () => {
      await fulfillmentSidebar.goToReady();
      await readyOrdersPage.expectOnReadyPage();
      await readyOrdersPage.expectTableLoaded();

      if (searchKeyword) {
        await readyOrdersPage.search(searchKeyword);
        await readyOrdersPage.expectTableLoaded();
        await readyOrdersPage.openOrderForHandover(searchKeyword);
      } else {
        await readyOrdersPage.openOrderForHandover();
      }

      await storePickupDetailPage.expectOnOrderDetail();
    });

    await test.step('Click CONTINUE and enter Confirmation Code during customer handover', async () => {
      await storePickupDetailPage.clickContinue();

      // Retrieve Confirmation Code from customer page if not already set
      if (!confirmationCode && !customerPage.isClosed()) {
        confirmationCode = await checkoutPage.getConfirmationCode();
      }

      console.log('Flow 1: Submitting Confirmation Code to Handover Modal:', confirmationCode);
      if (confirmationCode) {
        await storePickupDetailPage.enterConfirmationCode(confirmationCode);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Fulfilled Orders Verification
    // ─────────────────────────────────────────────────────────────
    await test.step('Navigate to Fulfilled Orders and verify the completed order is visible', async () => {
      await fulfillmentSidebar.goToFulfilled();
      await fulfilledOrdersPage.expectOnFulfilledPage();

      if (searchKeyword) {
        await fulfilledOrdersPage.search(searchKeyword);
        await fulfilledOrdersPage.expectOrderRowVisible(searchKeyword);
      }
    });

    const customerVideo = customerPage.video();
    const fulfillmentVideo = fulfillmentPage.video();
    await customerContext.close();
    await fulfillmentContext.close();

    if (customerVideo) {
      const customerVideoPath = await customerVideo.path().catch(() => null);
      if (customerVideoPath) {
        await testInfo.attach('flow1-customer-ordering-video', { path: customerVideoPath, contentType: 'video/webm' });
      }
    }
    if (fulfillmentVideo) {
      const fulfillmentVideoPath = await fulfillmentVideo.path().catch(() => null);
      if (fulfillmentVideoPath) {
        await testInfo.attach('flow1-fulfillment-handover-video', { path: fulfillmentVideoPath, contentType: 'video/webm' });
      }
    }
  });
});

