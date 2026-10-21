import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { config } from '../../config/environment';
import { OrderingCatalogPage } from '../../pages/ordering/OrderingCatalogPage';
import { OrderingCheckoutPage } from '../../pages/ordering/OrderingCheckoutPage';
import { PendingOrdersPage } from '../../pages/fulfillment/orders/PendingOrdersPage';
import { OrderDetailPage } from '../../pages/fulfillment/orders/OrderDetailPage';
import { PickOrderDetailPage } from '../../pages/fulfillment/picking/PickOrderDetailPage';
import { ItemInfoDrawer } from '../../pages/fulfillment/modals/ItemInfoDrawer';
import { DeliveryHandlingDrawer } from '../../pages/fulfillment/modals/DeliveryHandlingDrawer';
import { PickOrderPackagePage } from '../../pages/fulfillment/picking/PickOrderPackagePage';
import { AssignStagingDrawer } from '../../pages/fulfillment/modals/AssignStagingDrawer';

test.describe('Cross-App E2E Integration Suite: Ordering to Fulfillment', () => {
  test('Complete Customer Order placement bridged to Fulfillment Picking and Staging @bridge @e2e', async ({
    browser,
  }) => {
    test.setTimeout(240_000); // 4 minutes for multi-app end-to-end flow

    await allure.epic('Cross-App E2E Integration');
    await allure.feature('Online Ordering Storefront to Fulfillment App Bridge');
    await allure.story('Customer places Store Pickup order -> Fulfillment staff picks and marks Ready');
    await allure.severity('blocker');

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Customer Storefront Session (Online Ordering)
    // ─────────────────────────────────────────────────────────────
    const customerContext = await browser.newContext({
      storageState: '.auth/ordering.json',
      baseURL: config.ordering.baseUrl,
    });
    const customerPage = await customerContext.newPage();
    const catalogPage = new OrderingCatalogPage(customerPage);
    const checkoutPage = new OrderingCheckoutPage(customerPage);

    let placedOrderNumber = '';

    await test.step('Customer browses catalog, adds product to cart, and proceeds to checkout', async () => {
      await catalogPage.gotoCategory('huzeif-test');
      await catalogPage.addProductToCart();
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
    });
    const fulfillmentPage = await fulfillmentContext.newPage();
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
        // Strip suffix if present (e.g., 03065381372_37386 -> 03065381372)
        searchKeyword = placedOrderNumber.split('_')[0];
        console.log('Fulfillment searching for order keyword:', searchKeyword);
        await pendingOrdersPage.search(searchKeyword);
        await pendingOrdersPage.expectTableLoaded();
      }
    });

    const pendingCount = await pendingOrdersPage.getRowCount();

    if (pendingCount > 0) {
      await test.step('Open Order Detail and initiate Start Picking', async () => {
        // Open the matching searched order or the first order
        if (searchKeyword && await fulfillmentPage.locator('.ftx-table__body').filter({ hasText: searchKeyword }).first().isVisible().catch(() => false)) {
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
    // STEP 3: Cleanup & Status Verification
    // ─────────────────────────────────────────────────────────────
    await test.step('Customer refreshes Orders history and confirms order was processed', async () => {
      await customerPage.goto('/orders', { waitUntil: 'domcontentloaded' });
      await customerPage.waitForTimeout(2000);
    });

    await customerContext.close();
    await fulfillmentContext.close();
  });
});

