import { allure } from 'allure-playwright';
import { test, expect } from '../../fixtures/pages';

test.describe('Fulfillment Sidebar Navigation & Remaining Modules Suite', () => {
  test('Navigate to In Progress Orders and verify table controls @fulfillment @inprogress', async ({
    fulfillmentSidebar,
    inProgressOrdersPage,
  }) => {
    await allure.epic('Fulfillment App');
    await allure.feature('In Progress Orders');
    await allure.severity('critical');

    await test.step('Navigate to In Progress Orders via Sidebar', async () => {
      await fulfillmentSidebar.goToInProgress();
      await inProgressOrdersPage.expectOnInProgressPage();
    });

    await test.step('Verify table is loaded', async () => {
      await inProgressOrdersPage.expectTableLoaded();
    });
  });

  test('Navigate to Fulfilled Orders and verify table controls @fulfillment @fulfilled', async ({
    fulfillmentSidebar,
    fulfilledOrdersPage,
  }) => {
    await allure.epic('Fulfillment App');
    await allure.feature('Fulfilled Orders');
    await allure.severity('critical');

    await test.step('Navigate to Fulfilled Orders via Sidebar', async () => {
      await fulfillmentSidebar.goToFulfilled();
      await fulfilledOrdersPage.expectOnFulfilledPage();
    });

    await test.step('Verify table is loaded', async () => {
      await fulfilledOrdersPage.expectTableLoaded();
    });
  });

  test('Navigate to All Orders and verify table controls @fulfillment @all-orders', async ({
    fulfillmentSidebar,
    allOrdersPage,
  }) => {
    await allure.epic('Fulfillment App');
    await allure.feature('All Orders');
    await allure.severity('critical');

    await test.step('Navigate to All Orders via Sidebar', async () => {
      await fulfillmentSidebar.goToAllOrders();
      await allOrdersPage.expectOnAllOrdersPage();
    });

    await test.step('Verify table is loaded', async () => {
      await allOrdersPage.expectTableLoaded();
    });
  });

  test('Navigate to Manage Staging Area and verify staging locations @fulfillment @staging', async ({
    fulfillmentSidebar,
    manageStagingAreaPage,
  }) => {
    await allure.epic('Fulfillment App');
    await allure.feature('Manage Staging Area');
    await allure.severity('critical');

    await test.step('Navigate to Manage Staging Area via Sidebar', async () => {
      await fulfillmentSidebar.goToManageStagingArea();
      await manageStagingAreaPage.expectOnManageStagingAreaPage();
    });

    await test.step('Verify staging area table loaded', async () => {
      await manageStagingAreaPage.expectTableLoaded();
      const count = await manageStagingAreaPage.getStagingAreasCount();
      console.log('Staging areas found:', count);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});

