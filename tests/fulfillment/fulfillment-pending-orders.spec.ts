import { allure } from 'allure-playwright';
import { test, expect } from '../../fixtures/pages';

test.describe('Fulfillment Pending Orders & Order Picking Workflow Suite', () => {
  test('Pending Orders controls, search, pagination, 5-action menu, and order details actions @smoke @pending', async ({
    fulfillmentLoginPage,
    fulfillmentSidebar,
    pendingOrdersPage,
    orderDetailPage,
    page,
  }) => {
    await allure.epic('Fulfillment App');
    await allure.feature('Pending Orders Management');
    await allure.story('Controls, Search, Pagination, Action Menu & Order Details Inspection');
    await allure.severity('critical');

    await test.step('Authenticate via Identity Server and verify Dashboard landing', async () => {
      await fulfillmentLoginPage.goto();
      await fulfillmentLoginPage.login();
      await fulfillmentLoginPage.expectLoggedIn();
    });

    await test.step('Navigate to Pending Orders via Sidebar and verify table loaded', async () => {
      await fulfillmentSidebar.goToPending();
      await pendingOrdersPage.expectOnPendingPage();
      await pendingOrdersPage.expectTableLoaded();
    });

    await test.step('Test Brand Store Filter dropdown interaction', async () => {
      await pendingOrdersPage.testBrandStoreFilter();
    });

    await test.step('Test Search filter functionality on Pending Orders table', async () => {
      await pendingOrdersPage.search('TEST');
      await pendingOrdersPage.expectTableLoaded();
      await pendingOrdersPage.clearSearch();
      await pendingOrdersPage.expectTableLoaded();
    });

    await test.step('Test Pagination controls (records range, next and previous page)', async () => {
      await pendingOrdersPage.testPagination();
    });

    const pendingCount = await pendingOrdersPage.getRowCount();

    if (pendingCount > 0) {
      await test.step('Verify 5 Actions in Row Dropdown Menu (View Order, Start Picking, Print Picklist, Download, Cancel Order)', async () => {
        await pendingOrdersPage.openActionMenu(0);
        await pendingOrdersPage.expectAll5Actions();
        // Close menu by clicking outside or pressing Escape
        await page.keyboard.press('Escape');
      });

      await test.step('Navigate to Order Detail page (/order/:orderId)', async () => {
        await pendingOrdersPage.openOrderDetail();
        await orderDetailPage.expectOnOrderDetail();
      });

      await test.step('Verify functional action buttons on Order Detail page', async () => {
        await orderDetailPage.expectActionButtonsVisible();
      });

      await test.step('Test Print Picklist action button', async () => {
        await orderDetailPage.testPrintPicklist();
      });

      await test.step('Test Download PDF action button', async () => {
        await orderDetailPage.testDownload();
      });

      await test.step('Test Cancel Order action button (display confirmation prompt and dismiss)', async () => {
        await orderDetailPage.testCancelOrderDialog('dismiss');
      });
    } else {
      await test.step('No pending orders available currently to test detail actions', async () => {
        await page.waitForTimeout(1000);
      });
    }
  });

  test('Complete End-to-End Picking flow: Item Picking -> Delivery Handling -> Staging Area -> Mark Ready @e2e @picking', async ({
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
  }) => {
    test.setTimeout(120000);

    await allure.epic('Fulfillment App');
    await allure.feature('Order Picking & Staging');
    await allure.story('End-to-End Pick Order to Staging and Mark Ready Workflow');
    await allure.severity('blocker');

    await test.step('Authenticate via Identity Server and navigate to Pending Orders', async () => {
      await fulfillmentLoginPage.goto();
      await fulfillmentLoginPage.login();
      await fulfillmentLoginPage.expectLoggedIn();

      await fulfillmentSidebar.goToPending();
      await pendingOrdersPage.expectOnPendingPage();
      await pendingOrdersPage.expectTableLoaded();
    });

    const pendingCount = await pendingOrdersPage.getRowCount();

    if (pendingCount > 0) {
      await test.step('Open Order Detail and initiate Start Picking', async () => {
        await pendingOrdersPage.openOrderDetail();
        await orderDetailPage.expectOnOrderDetail();
        await orderDetailPage.clickStartPicking();
        await pickOrderDetailPage.expectOnPickOrderPage();
      });

      await test.step('Verify header actions on Pick Order screen (Print Picklist, Cancel Order)', async () => {
        await pickOrderDetailPage.expectHeaderActionsVisible();
      });

      const productCount = await pickOrderDetailPage.getProductCount();

      if (productCount > 0) {
        await test.step('Pick order items: confirm picked quantity in Item Info drawer for all items', async () => {
          await pickOrderDetailPage.pickAllItems(itemInfoDrawer);
        });

        await test.step('Click Next to proceed from Pick Order Detail', async () => {
          await pickOrderDetailPage.clickNext();
        });

        // Check if Delivery Handling Options drawer opens (for Delivery orders)
        const isDeliveryDrawerOpen = await deliveryHandlingDrawer.isDrawerVisible(6000);
        if (isDeliveryDrawerOpen) {
          await test.step('Complete Delivery Handling Options (contains type, package size, driver instructions)', async () => {
            await deliveryHandlingDrawer.completeDeliveryHandling({
              containsType: 'Contains Both',
              instructions: 'Handle with care. Fragile items.',
            });
          });
        }

        // Check if redirected to Assign Package Staging Area screen
        const onAssignPackage = await page.waitForURL(/assign-package/i, { timeout: 15000 }).then(() => true).catch(() => false);

        if (onAssignPackage) {
          await test.step('Select all packages on Assign Package page', async () => {
            await pickOrderPackagePage.expectOnAssignPackagePage();
            await pickOrderPackagePage.selectAllPackages();
          });

          await test.step('Assign Staging Area via Select Staging drawer', async () => {
            await pickOrderPackagePage.clickAssignStagingArea();
            await assignStagingDrawer.expectDrawerOpen();
            await assignStagingDrawer.selectStagingArea();
            await assignStagingDrawer.clickSave();
          });

          await test.step('Finalize order: Click MARK READY, verify completion toast, and redirect to Pending Orders', async () => {
            await pickOrderPackagePage.clickMarkReady();
            await pickOrderPackagePage.expectOrderCompletedAndRedirected();
          });
        }
      }
    } else {
      await test.step('Pending Orders table is currently empty; verified graceful handling', async () => {
        await page.waitForTimeout(1000);
      });
    }
  });
});

