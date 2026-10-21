import { test as setup } from '../../fixtures/pages';

const authFile = '.auth/ordering.json';

setup('authenticate ordering customer and save storage state', async ({ orderingHomePage, page }) => {
  setup.setTimeout(180_000);

  // Visit storefront and dismiss onboarding popups
  await orderingHomePage.goto();
  await orderingHomePage.handleDisclaimer();
  await orderingHomePage.handleAgeVerification();

  // Log in via Identity server
  await orderingHomePage.login();
  await orderingHomePage.expectLoggedIn();

  // Persist storage state
  await page.context().storageState({ path: authFile });
});

