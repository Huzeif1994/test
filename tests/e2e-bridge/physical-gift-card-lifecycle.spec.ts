import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { config } from '../../config/environment';
import { maximizeWindow } from '../../utils/window';
import { OrderingGiftCardPage } from '../../pages/ordering/OrderingGiftCardPage';
import { OrderingCheckoutPage } from '../../pages/ordering/OrderingCheckoutPage';
import { PendingOrdersPage } from '../../pages/fulfillment/orders/PendingOrdersPage';
import { OrderDetailPage } from '../../pages/fulfillment/orders/OrderDetailPage';
import { PickOrderDetailPage } from '../../pages/fulfillment/picking/PickOrderDetailPage';
import { ItemInfoDrawer } from '../../pages/fulfillment/modals/ItemInfoDrawer';
import { DeliveryHandlingDrawer } from '../../pages/fulfillment/modals/DeliveryHandlingDrawer';
import { PickOrderPackagePage } from '../../pages/fulfillment/picking/PickOrderPackagePage';
import { AssignStagingDrawer } from '../../pages/fulfillment/modals/AssignStagingDrawer';
import { ReadyOrdersPage } from '../../pages/fulfillment/orders/ReadyOrdersPage';
import { StorePickupDetailPage } from '../../pages/fulfillment/detail/StorePickupDetailPage';

test.describe('Physical Gift Card Lifecycle: Purchase to Fulfillment to Activation', () => {
  test('Complete Customer Purchase -> Pre-Fulfillment Verification -> Fulfillment 12-digit Barcode Assignment -> Live Activated Validation @bridge @physical-giftcard', async ({
    browser,
  }, testInfo) => {
    test.setTimeout(360_000); // 6 minutes for full cross-app lifecycle

    await allure.epic('Cross-App E2E Integration');
    await allure.feature('Physical Gift Card Lifecycle');
    await allure.story('Purchase on Storefront -> Fulfillment Barcode Assignment -> Customer Activated Tab Verification');
    await allure.severity('critical');

    const isHeaded = process.argv.some(arg => arg.includes('--headed') || arg.includes('--ui') || arg === '-h') || process.env.HEADED === 'true';
    const desktopViewport = isHeaded ? null : { width: 1366, height: 768 };
    const recordVideoConfig = testInfo.project.use.video === 'on' ? { dir: testInfo.outputDir } : undefined;

    // Unique 12-digit number for this test run (e.g. 8XXXXXXXXXXX)
    const unique12DigitBarcode = '8' + Math.floor(10000000000 + Math.random() * 90000000000).toString();
    console.log('Generated Unique 12-Digit Physical Gift Card Number:', unique12DigitBarcode);

    let placedOrderNumber = '';
    let confirmationCode = '';

    const listenForConfirmationCode = (targetPage: any) => {
      targetPage.on('response', async (res: any) => {
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
                console.log('Intercepted Confirmation Code from API:', confirmationCode);
              }
            }
          }
        } catch {}
      });
    };

    // ─────────────────────────────────────────────────────────────
    // STAGE 1 & 2: Storefront Purchase & Order Placement
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

    const giftCardPage = new OrderingGiftCardPage(customerPage);
    const checkoutPage = new OrderingCheckoutPage(customerPage);

    await test.step('Step 1: Customer opens Gift Cards catalog and configures Physical Gift Card ($25)', async () => {
      await giftCardPage.openGiftCardsCatalog();
      await expect(customerPage).toHaveURL(/gift-cards/i, { timeout: 25000 });
      await giftCardPage.selectGiftCard(0);
      await expect(customerPage).toHaveURL(/\/gift-cards\/.+/, { timeout: 20000 });

      // Configure Physical Card and proceed to Checkout
      await giftCardPage.configureAndBuyPhysicalCard(25);
    });

    await test.step('Step 2: Customer checks out with Store Pickup and places order', async () => {
      // Multi-step Physical Card Checkout: Order Details -> Personal Info -> Store Pickup Info -> Payment -> Place Order
      await checkoutPage.completeMultiStepPhysicalCheckout();

      // Verify Thank You page
      const thankYouHeading = customerPage.getByRole('heading', { name: /Thank you|order has been placed/i });
      await expect(thankYouHeading).toBeVisible({ timeout: 45000 });

      // Extract placed order number
      const orderNumberElem = customerPage.locator('text=/Your order Number:/i, strong:has-text("Your order Number")').first();
      if (await orderNumberElem.isVisible({ timeout: 5000 }).catch(() => false)) {
        const text = await orderNumberElem.innerText();
        const match = text.match(/\d+_\d+/) || text.match(/\d+/);
        if (match) placedOrderNumber = match[0];
      }

      if (!placedOrderNumber) {
        placedOrderNumber = await checkoutPage.getLatestOrderNumber();
      }

      console.log('Placed Physical Gift Card Order Number:', placedOrderNumber);
      expect(placedOrderNumber).toBeTruthy();

      // Fetch pickup confirmation code from customer order details for Step 7 Handover
      try {
        confirmationCode = await checkoutPage.fetchConfirmationCodeFromOrdersList(placedOrderNumber);
        console.log('Captured Store Pickup Confirmation Code for Step 7:', confirmationCode);
      } catch (err) {
        console.log('Will retry capturing confirmation code during Step 7 handover:', err);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // STAGE 3: Pre-Fulfillment Verification on Customer Storefront
    // ─────────────────────────────────────────────────────────────
    await test.step('Step 3: Customer verifies card is in Newly Purchased tab and NOT in Activated tab', async () => {
      await giftCardPage.gotoManageGiftCards();
      await giftCardPage.verifyPhysicalCardPreFulfillment();
    });

    // ─────────────────────────────────────────────────────────────
    // STAGE 4: Fulfillment Picking & 12-Digit Barcode Assignment
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

    await test.step('Step 4 & 5: Fulfillment staff locates order in Pending Orders and starts picking', async () => {
      await fulfillmentPage.goto('/pending-order', { waitUntil: 'domcontentloaded' });
      await pendingOrdersPage.expectOnPendingPage();
      await pendingOrdersPage.expectTableLoaded();

      // Ensure Brand Store filter is set to All Brands so orders from all stores appear
      await pendingOrdersPage.selectBrandStore('All Brands');
      await pendingOrdersPage.waitForOrderInPending(placedOrderNumber);
      await pendingOrdersPage.openOrderDetail(placedOrderNumber);
      await orderDetailPage.expectOnOrderDetail();
      await orderDetailPage.clickStartPicking();
      await pickOrderDetailPage.expectOnPickOrderPage();
    });

    await test.step('Step 6 & 7: Fulfillment staff inputs 12-digit card barcode and completes order fulfillment', async () => {
      // Pick all items, providing the 12-digit barcode for the Physical Gift Card prompt
      await pickOrderDetailPage.pickAllItems(itemInfoDrawer, unique12DigitBarcode);
      await pickOrderDetailPage.clickNext();

      // Handle delivery drawer if prompted
      if (await deliveryHandlingDrawer.isDrawerVisible(4000)) {
        await deliveryHandlingDrawer.completeDeliveryHandling({
          containsType: 'Contains Both',
          instructions: 'Handle with care.',
        });
      }

      // Package Staging & Mark Ready
      const onAssignPackage = await fulfillmentPage.waitForURL(/assign-package/i, { timeout: 15000 }).then(() => true).catch(() => false);
      if (onAssignPackage) {
        await pickOrderPackagePage.expectOnAssignPackagePage();
        await pickOrderPackagePage.selectAllPackages();
        await pickOrderPackagePage.clickAssignStagingArea();
        await assignStagingDrawer.expectDrawerOpen();
        await assignStagingDrawer.selectStagingArea();
        await assignStagingDrawer.clickSave();
        await pickOrderPackagePage.clickMarkReady();
        await pickOrderPackagePage.expectOrderCompletedAndRedirected();
      }

      // Step 7 Handover: Open Ready order and complete handover to transition to "Fulfilled"
      await fulfillmentPage.goto('/all-orders', { waitUntil: 'domcontentloaded' });
      await pendingOrdersPage.expectTableLoaded();
      await pendingOrdersPage.selectBrandStore('All Brands');
      await pendingOrdersPage.expectTableLoaded();
      await pendingOrdersPage.search(placedOrderNumber);
      await pendingOrdersPage.expectTableLoaded();

      console.log('Fulfillment Handover: Searching for order in All Orders:', placedOrderNumber);
      const readyRow = fulfillmentPage.locator('.q-table tbody tr.cursor-pointer, .q-table tbody tr').filter({ hasText: placedOrderNumber }).first();
      await readyRow.waitFor({ state: 'visible', timeout: 20000 });

      // Click 3-dots action menu -> Start Fulfilling
      const dotsBtn = readyRow.locator('.action-dropdown, button, .q-btn').last();
      await dotsBtn.click();
      const startFulfillItem = fulfillmentPage.locator('.q-menu .q-item, .action-menu .q-item, [role="menuitem"]').filter({ hasText: /Start Fulfilling/i }).first();
      await startFulfillItem.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      if (await startFulfillItem.isVisible().catch(() => false)) {
        await startFulfillItem.click();
      } else {
        await readyRow.click();
      }

      await storePickupDetailPage.expectOnOrderDetail();
      await storePickupDetailPage.clickContinue();

      if (!confirmationCode && !customerPage.isClosed()) {
        confirmationCode = await checkoutPage.fetchConfirmationCodeFromOrdersList(placedOrderNumber);
      }

      console.log('Fulfillment Handover: Submitting Confirmation Code:', confirmationCode);
      if (confirmationCode) {
        await storePickupDetailPage.enterConfirmationCode(confirmationCode);
      } else {
        const submitBtn = fulfillmentPage.locator('.q-dialog button:has-text("SUBMIT"), .q-dialog button:has-text("Submit")').first();
        if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitBtn.click();
        }
      }

      console.log(`Step 7 Completed: Order ${placedOrderNumber} is FULFILLED with Gift Card ${unique12DigitBarcode}!`);
    });

    // ─────────────────────────────────────────────────────────────
    // STAGE 5: Post-Fulfillment Activation Verification on Storefront
    // ─────────────────────────────────────────────────────────────
    await test.step('Step 8 & 9: Customer verifies card is now in Activated tab with matching 12-digit number, Physical type, and Active status', async () => {
      await customerPage.bringToFront();
      await giftCardPage.verifyPhysicalCardPostFulfillment(unique12DigitBarcode);
    });

    // Close contexts cleanly
    await fulfillmentContext.close().catch(() => {});
    await customerContext.close().catch(() => {});
  });
});

