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

  // Ensure Store Pickup is the preferred fulfillment so that time-slot booking is not blocked by Delivery addresses
  await page.evaluate(async () => {
    try {
      const oidcCookie = document.cookie.split('; ').find(row => row.startsWith('oidc.user%253A'));
      if (oidcCookie) {
        const userTok = JSON.parse(decodeURIComponent(oidcCookie.split('=')[1])).access_token;
        await fetch('https://api-qa.dev.ftxcommerce.com/api/v1/Customer/Location/SetPreferred', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + userTok, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationId: 'a40eaf1f-7400-44b9-8ffe-86e7804fb632',
            fulfillmentMethodId: '81c89b19-8f64-4cb9-b1c3-8ad12b0135e4',
          }),
        });
      }
    } catch {}
  });

  // Reload to reflect preferred store & fulfillment in cookies/store
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(2000);

  // Persist storage state
  await page.context().storageState({ path: authFile });
});

