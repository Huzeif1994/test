import { test as setup, expect } from '../../fixtures/pages';

const authFile = '.auth/admin.json';

setup('authenticate admin user and save storage state', async ({ adminLoginPage, page }) => {
  setup.setTimeout(90000);

  // Authenticate via Identity Server
  await adminLoginPage.goto();
  await adminLoginPage.login();
  await adminLoginPage.expectLoggedIn();

  // Save authenticated cookies and localStorage to .auth/admin.json
  await page.context().storageState({ path: authFile });
});

