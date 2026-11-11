import { allure } from 'allure-playwright';
import { test, expect } from '../../fixtures/pages';
import { config } from '../../config/environment';
import { OrderingCatalogPage } from '../../pages/ordering/OrderingCatalogPage';
import { OrderingCheckoutPage } from '../../pages/ordering/OrderingCheckoutPage';
import { FulfilledOrdersPage } from '../../pages/fulfillment/orders/FulfilledOrdersPage';
import { ReadyOrdersPage } from '../../pages/fulfillment/orders/ReadyOrdersPage';
import { StorePickupDetailPage } from '../../pages/fulfillment/detail/StorePickupDetailPage';

test.describe('Fulfillment Pending Orders & Order Picking Workflow Suite', () => {
  test('Creates, picks, stages, and hands over a dedicated test order @smoke @e2e @picking', async ({
    browser,
    fulfillmentLoginPage,
    fulfillmentSidebar,
    pendingOrdersPage,
    orderDetailPage,
    pickOrderDetailPage,
    itemInfoDrawer,
    deliveryHandlingDrawer,
    pickOrderPackagePage,
    assignStagingDrawer,
    page,
  }, testInfo) => {
    test.setTimeout(420_000);

    await allure.epic('Fulfillment App');
    await allure.feature('Pending Orders Management');
    await allure.story('Create a test order, fulfill it, and verify completed handover');
    await allure.severity('blocker');

    const orderToResume = process.env.FULFILLMENT_TEST_ORDER_NUMBER?.trim();
    let alreadyFulfilled = false;
    const customerContext = await browser.newContext({
      storageState: '.auth/ordering.json',
      baseURL: config.ordering.baseUrl,
      viewport: { width: 1366, height: 768 },
    });

    try {
      if (orderToResume) {
        await test.step('Verify whether the resumed order is already fulfilled', async () => {
          const fulfilledOrdersPage = new FulfilledOrdersPage(page);
          await fulfillmentSidebar.goToFulfilled();
          await fulfilledOrdersPage.expectOnFulfilledPage();
          await fulfilledOrdersPage.search(orderToResume);

          const fulfilledRow = page.locator('.q-table tbody tr:visible, table tbody tr:visible').filter({ hasText: orderToResume }).first();
          if (await fulfilledRow.isVisible()) {
            testInfo.annotations.push({ type: 'test-order', description: orderToResume });
            await expect(fulfilledRow).toBeVisible();
            console.log(`Resumed order is already fulfilled: ${orderToResume}`);
            alreadyFulfilled = true;
          }
        });

        if (alreadyFulfilled) return;
      }

      const customerPage = await customerContext.newPage();
      const catalogPage = new OrderingCatalogPage(customerPage);
      const checkoutPage = new OrderingCheckoutPage(customerPage);
      let orderNumber = '';
      let confirmationCode = '';

      await test.step('Place or resume a dedicated paid pickup order', async () => {
        if (orderToResume) {
          orderNumber = orderToResume;
          await customerPage.goto('/orders');
          confirmationCode = await checkoutPage.fetchConfirmationCodeFromOrdersList(orderNumber);
          console.log(`Resuming fulfillment test order: ${orderNumber}`);
        } else {
          await checkoutPage.clearCartIfNotEmpty();
          await catalogPage.gotoCategory();
          await catalogPage.addProductToCart();
          await catalogPage.openCartAndProceed();
          await checkoutPage.proceedToCheckout();
          await checkoutPage.selectInStorePickup();
          await checkoutPage.turnOffPayAtStore();
          await checkoutPage.selectCreditOrDebitCard();
          await checkoutPage.acceptTerms();
          await checkoutPage.placeOrder();
          await checkoutPage.clickViewOrderOnThankYouPage();

          orderNumber = await checkoutPage.getLatestOrderNumber();
          confirmationCode = await checkoutPage.getConfirmationCode(orderNumber);
          console.log(`Created dedicated fulfillment test order: ${orderNumber} code: ${confirmationCode}`);
        }

        expect(orderNumber, 'Checkout or recovery input must provide the test order number').toBeTruthy();
        testInfo.annotations.push({ type: 'test-order', description: orderNumber });

        const readConfirmationCode = async (): Promise<string> => {
          if (confirmationCode) return confirmationCode;
          const directCode = await checkoutPage.getConfirmationCode(orderNumber);
          if (directCode) return directCode;
          const bodyText = await customerPage.locator('body').innerText();
          return bodyText.match(/(?:confirmation|pickup) code\s*:?\s*([0-9]{4})/i)?.[1] ?? '';
        };
        if (!confirmationCode) {
          await expect.poll(readConfirmationCode, {
            message: 'Pickup confirmation code should load on the customer order page',
            timeout: 25_000,
          }).toMatch(/^\d{4}$/);
          confirmationCode = await readConfirmationCode();
        }
        expect(confirmationCode, 'Pickup handover must provide a confirmation code').toMatch(/^\d{4}$/);
      });

      await test.step('Verify fulfillment authentication and locate the new order', async () => {
        await page.goto('/pending-order');
        await fulfillmentLoginPage.expectLoggedIn();
        await pendingOrdersPage.expectOnPendingPage();
        await pendingOrdersPage.expectTableLoaded();

        const orderRow = await pendingOrdersPage.waitForOrderInPending(orderNumber);
        await expect(orderRow).toBeVisible();
      });

      await test.step('Exercise Pending Orders filters, search, and pagination', async () => {
        await pendingOrdersPage.testBrandStoreFilter();
        await pendingOrdersPage.search(orderNumber);
        await pendingOrdersPage.expectTableLoaded();
        await expect(
          page.locator('.q-table tbody tr.cursor-pointer').filter({ hasText: orderNumber }).first()
        ).toBeVisible();
        await pendingOrdersPage.clearSearch();
        await pendingOrdersPage.expectTableLoaded();
        await pendingOrdersPage.testPagination();
      });

      await test.step('Verify row actions and order detail controls', async () => {
        await pendingOrdersPage.search(orderNumber);
        await pendingOrdersPage.openActionMenu(orderNumber);
        await pendingOrdersPage.expectAll5Actions();
        await page.keyboard.press('Escape');

        await pendingOrdersPage.openOrderDetail(orderNumber);
        await orderDetailPage.expectOnOrderDetail(orderNumber);
        await orderDetailPage.expectActionButtonsVisible();
        await orderDetailPage.testPrintPicklist();
        await orderDetailPage.testDownload();
        await orderDetailPage.testCancelOrderDialog('dismiss');
      });

      await test.step('Pick all items and assign the order to a staging area', async () => {
        await orderDetailPage.clickStartPicking();
        await pickOrderDetailPage.expectOnPickOrderPage();

        const productCount = await pickOrderDetailPage.getProductCount();
        expect(productCount, 'The newly created test order must contain at least one product').toBeGreaterThan(0);
        await pickOrderDetailPage.pickAllItems(itemInfoDrawer);
        await pickOrderDetailPage.clickNext();

        if (await deliveryHandlingDrawer.isDrawerVisible(6000)) {
          await deliveryHandlingDrawer.completeDeliveryHandling({
            containsType: 'Contains Both',
            instructions: 'Handle with care. Test order.',
          });
        }

        await page.waitForURL(/assign-package/i, { timeout: 20_000 });
        await pickOrderPackagePage.expectOnAssignPackagePage();
        await expect(pickOrderPackagePage.packageRows).not.toHaveCount(0);
        await pickOrderPackagePage.selectAllPackages();
        await pickOrderPackagePage.clickAssignStagingArea();
        await assignStagingDrawer.expectDrawerOpen();
        await assignStagingDrawer.selectStagingArea();
        await assignStagingDrawer.clickSave();
        await pickOrderPackagePage.clickMarkReady();
        await pickOrderPackagePage.expectOrderCompletedAndRedirected();
      });

      await test.step('Complete handover and verify the test order is fulfilled', async () => {
        const readyOrdersPage = new ReadyOrdersPage(page);
        const storePickupDetailPage = new StorePickupDetailPage(page);
        const fulfilledOrdersPage = new FulfilledOrdersPage(page);

        await fulfillmentSidebar.goToReady();
        await readyOrdersPage.expectOnReadyPage();
        await readyOrdersPage.expectTableLoaded();
        await readyOrdersPage.search(orderNumber);
        await readyOrdersPage.openOrderForHandover(orderNumber);
        await storePickupDetailPage.expectOnOrderDetail(orderNumber);
        await storePickupDetailPage.clickContinue();
        await storePickupDetailPage.enterConfirmationCode(confirmationCode);

        await fulfillmentSidebar.goToFulfilled();
        await fulfilledOrdersPage.expectOnFulfilledPage();
        await fulfilledOrdersPage.search(orderNumber);
        await fulfilledOrdersPage.expectOrderRowVisible(orderNumber);
      });
    } finally {
      await customerContext.close();
    }
  });
});
