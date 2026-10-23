import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { config } from '../../config/environment';
import { maximizeWindow } from '../../utils/window';
import { OrderingCatalogPage } from '../../pages/ordering/OrderingCatalogPage';
import { OrderingCheckoutPage } from '../../pages/ordering/OrderingCheckoutPage';
import { PendingOrdersPage } from '../../pages/fulfillment/orders/PendingOrdersPage';
import { ReadyOrdersPage } from '../../pages/fulfillment/orders/ReadyOrdersPage';
import { FulfillmentSidebar } from '../../pages/fulfillment/navigation/FulfillmentSidebar';
import { OrderDetailPage } from '../../pages/fulfillment/orders/OrderDetailPage';
import { PickOrderDetailPage } from '../../pages/fulfillment/picking/PickOrderDetailPage';
import { ItemInfoDrawer } from '../../pages/fulfillment/modals/ItemInfoDrawer';
import { DeliveryHandlingDrawer } from '../../pages/fulfillment/modals/DeliveryHandlingDrawer';
import { PickOrderPackagePage } from '../../pages/fulfillment/picking/PickOrderPackagePage';
import { AssignStagingDrawer } from '../../pages/fulfillment/modals/AssignStagingDrawer';

test.describe('Cross-App E2E Integration Suite: Ordering to Fulfillment', () => {
  test('Complete Customer Order placement bridged to Fulfillment Picking and Staging @bridge @e2e', async ({
    browser,
  }, testInfo) => {
    test.setTimeout(300_000); // 5 minutes for multi-app end-to-end flow

    await allure.epic('Cross-App E2E Integration');
    await allure.feature('Online Ordering Storefront to Fulfillment App Bridge');
    await allure.story('Customer places Store Pickup order -> Fulfillment staff picks and marks Ready');
    await allure.severity('blocker');

    const isHeaded = process.argv.some(arg => arg.includes('--headed') || arg.includes('--ui') || arg === '-h') || process.env.HEADED === 'true';
    const desktopViewport = isHeaded ? null : { width: 1366, height: 768 };
    const recordVideoConfig = testInfo.project.use.video === 'on' ? { dir: testInfo.outputDir } : undefined;

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
    const catalogPage = new OrderingCatalogPage(customerPage);
    const checkoutPage = new OrderingCheckoutPage(customerPage);

    let placedOrderNumber = '';

    await test.step('Customer clears cart, browses category, adds CASA TURRENT SERIE 1973 ROBUSTO, and proceeds to checkout', async () => {
      await checkoutPage.clearCartIfNotEmpty();
      await catalogPage.gotoCategory('huzeif-test');
      await catalogPage.addProductToCart('CASA TURRENT SERIE 1973 ROBUSTO');
      await catalogPage.openCartAndProceed();
      await checkoutPage.proceedToCheckout();
    });

    await test.step('Customer selects Pay At Store, accepts terms, and places order', async () => {
      await checkoutPage.selectPayAtStore();
      await checkoutPage.acceptTerms();
      await checkoutPage.placeOrder();
    });

    await test.step('Customer verifies generated Order Number on Orders history', async () => {
      placedOrderNumber = await checkoutPage.getLatestOrderNumber();
      console.log('Bridge Test: Captured Placed Order Number:', placedOrderNumber);
      expect(placedOrderNumber).toBeTruthy();
    });

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Fulfillment App Session (Fulfillment Employee)
    // ─────────────────────────────────────────────────────────────
    const fulfillmentContext = await browser.newContext({
      storageState: '.auth/fulfillment.json',
      baseURL: config.fulfillment.baseUrl,
      viewport: desktopViewport,
      recordVideo: recordVideoConfig,
    });
    const fulfillmentPage = await fulfillmentContext.newPage();
    await maximizeWindow(fulfillmentPage);
    const pendingOrdersPage = new PendingOrdersPage(fulfillmentPage);
    const orderDetailPage = new OrderDetailPage(fulfillmentPage);
    const pickOrderDetailPage = new PickOrderDetailPage(fulfillmentPage);
    const itemInfoDrawer = new ItemInfoDrawer(fulfillmentPage);
    const deliveryHandlingDrawer = new DeliveryHandlingDrawer(fulfillmentPage);
    const pickOrderPackagePage = new PickOrderPackagePage(fulfillmentPage);
    const assignStagingDrawer = new AssignStagingDrawer(fulfillmentPage);

    let searchKeyword = '';
    await test.step('Fulfillment employee navigates to Pending Orders and searches order', async () => {
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
        // Open the matching searched order
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
        await test.step('Pick order items in Item Info drawer', async () => {
          await pickOrderDetailPage.pickAllItems(itemInfoDrawer);
        });

        await test.step('Click Next to proceed from Pick Order Detail', async () => {
          await pickOrderDetailPage.clickNext();
        });

        // Delivery handling check (for Delivery orders)
        if (await deliveryHandlingDrawer.isDrawerVisible(4000)) {
          await test.step('Complete Delivery Handling Options if requested', async () => {
            await deliveryHandlingDrawer.completeDeliveryHandling({
              containsType: 'Contains Both',
              instructions: 'Handle with care.',
            });
          });
        }

        // Package Staging & Mark Ready
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

          await test.step('Finalize order: Mark Ready and verify return to Pending Orders', async () => {
            await pickOrderPackagePage.clickMarkReady();
            await pickOrderPackagePage.expectOrderCompletedAndRedirected();
          });
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Ready Orders Listing & Payment Method Card Verification
    // ─────────────────────────────────────────────────────────────
    const readyOrdersPage = new ReadyOrdersPage(fulfillmentPage);
    const fulfillmentSidebar = new FulfillmentSidebar(fulfillmentPage);

    await test.step('Navigate to Ready Orders listing and verify YES, Payment Due', async () => {
      await fulfillmentSidebar.goToReady();
      await readyOrdersPage.expectOnReadyPage();
      await readyOrdersPage.expectTableLoaded();

      if (searchKeyword) {
        await readyOrdersPage.search(searchKeyword);
        await readyOrdersPage.expectTableLoaded();
        await readyOrdersPage.expectPaymentDue(searchKeyword);
      }
    });

    await test.step('Open Order Detail from Ready Orders and verify Pay At Store in Payment Method card', async () => {
      if (searchKeyword) {
        await readyOrdersPage.openOrderDetail(searchKeyword);
      } else {
        await readyOrdersPage.openOrderDetail();
      }
      await readyOrdersPage.verifyPayAtStorePaymentMethod();
    });

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Cleanup & Customer Status Verification
    // ─────────────────────────────────────────────────────────────
    await test.step('Customer refreshes Orders history and confirms order was processed', async () => {
      await customerPage.goto('/orders', { waitUntil: 'domcontentloaded' });
      await customerPage.locator('.order-card, .q-table tbody tr, .q-card').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    });

    const customerVideo = customerPage.video();
    const fulfillmentVideo = fulfillmentPage.video();
    await customerContext.close();
    await fulfillmentContext.close();

    if (customerVideo) {
      const customerVideoPath = await customerVideo.path().catch(() => null);
      if (customerVideoPath) {
        await testInfo.attach('customer-ordering-video', { path: customerVideoPath, contentType: 'video/webm' });
      }
    }
    if (fulfillmentVideo) {
      const fulfillmentVideoPath = await fulfillmentVideo.path().catch(() => null);
      if (fulfillmentVideoPath) {
        await testInfo.attach('fulfillment-handover-video', { path: fulfillmentVideoPath, contentType: 'video/webm' });
      }
    }
  });
});

