import { test as setup, expect } from '../../fixtures/pages';

const authFile = '.auth/fulfillment.json';

setup('authenticate fulfillment user and save storage state', async ({ fulfillmentLoginPage, page }) => {
  setup.setTimeout(90000);

  // Authenticate via Identity Server
  await fulfillmentLoginPage.goto();
  await fulfillmentLoginPage.login();
  await fulfillmentLoginPage.expectLoggedIn();

  // Save authenticated cookies and localStorage to .auth/fulfillment.json
  await page.context().storageState({ path: authFile });
});

