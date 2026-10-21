import { allure } from 'allure-playwright';
import { test } from '../../fixtures/pages';

// Login flow test requires fresh, unauthenticated session
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Online Ordering App', () => {
  test('user visits storefront, handles popups, and logs in via Identity Server', async ({ orderingHomePage }) => {
    await allure.epic('Online Ordering');
    await allure.feature('Authentication & Storefront Landing');
    await allure.severity('blocker');

    await test.step('Navigate to Ordering storefront home page', async () => {
      await orderingHomePage.goto();
    });

    await test.step('Handle Disclaimer popup if present', async () => {
      await orderingHomePage.handleDisclaimer();
    });

    await test.step('Handle Age verification popup if present', async () => {
      await orderingHomePage.handleAgeVerification();
    });

    await test.step('Verify initial Storefront landing URL', async () => {
      await orderingHomePage.expectOnHomePage();
    });

    await test.step('Execute Login via Identity Server and verify redirection', async () => {
      await orderingHomePage.login();
      await orderingHomePage.expectLoggedIn();
    });
  });
});
