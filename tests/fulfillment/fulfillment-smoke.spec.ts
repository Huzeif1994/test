import { allure } from 'allure-playwright';
import { test, expect } from '../../fixtures/pages';

test.describe('Fulfillment App Smoke Suite', () => {
  test('user logs in, navigates through sidebar modules, and interacts with orders table @smoke', async ({
    fulfillmentLoginPage,
    fulfillmentSidebar,
    pendingOrdersPage,
    readyOrdersPage,
    page,
  }) => {
    await allure.epic('Fulfillment App');
    await allure.feature('Navigation & Order Lists');
    await allure.story('Sidebar Navigation & Order Tables Health Check');
    await allure.severity('critical');

    await test.step('Authenticate via Identity Server and verify Dashboard landing', async () => {
      await fulfillmentLoginPage.goto();
      await fulfillmentLoginPage.login();
      await fulfillmentLoginPage.expectLoggedIn();
    });

    await test.step('Navigate to Pending Orders via Sidebar and verify table', async () => {
      await fulfillmentSidebar.goToPending();
      await pendingOrdersPage.expectOnPendingPage();
      await pendingOrdersPage.expectTableLoaded();
    });

    await test.step('Perform search filter test on Pending Orders table', async () => {
      await pendingOrdersPage.search('TEST-SEARCH');
      // Verify table handles search without breaking
      await pendingOrdersPage.expectTableLoaded();
      await pendingOrdersPage.clearSearch();
    });

    await test.step('Navigate to Ready Orders via Sidebar and verify table', async () => {
      await fulfillmentSidebar.goToReady();
      await readyOrdersPage.expectOnReadyPage();
      await readyOrdersPage.expectTableLoaded();
    });

    await test.step('Navigate to Manage Staging Area via Sidebar', async () => {
      await fulfillmentSidebar.goToManageStagingArea();
      await expect(page).toHaveURL(/manage-staging-area/i, { timeout: 15000 });
      await page.waitForTimeout(1000);
    });

    await test.step('Return to Dashboard via Sidebar', async () => {
      await fulfillmentSidebar.goToDashboard();
      await expect(page).toHaveURL(/\/(?:#\/)?(?:$|\?)/, { timeout: 15000 });
      await page.waitForTimeout(1000);
    });
  });
});

