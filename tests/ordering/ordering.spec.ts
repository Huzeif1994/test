import { allure } from 'allure-playwright';
import { test } from '../../fixtures/pages';

test.describe('Online Ordering App', () => {
  test('home page opens successfully and handles popups', async ({ orderingHomePage }) => {
    await allure.epic('Online Ordering');
    await allure.feature('Storefront Landing');
    await allure.severity('critical');

    await test.step('Navigate to Ordering home page', async () => {
      await orderingHomePage.goto();
    });

    await test.step('Handle Disclaimer popup if present', async () => {
      await orderingHomePage.handleDisclaimer();
    });

    await test.step('Handle Age verification popup if present', async () => {
      await orderingHomePage.handleAgeVerification();
    });

    await test.step('Verify Ordering URL', async () => {
      await orderingHomePage.expectOnHomePage();
    });
  });

  test('user logs in via Identity Server and redirects back', async ({ orderingHomePage }) => {
    await allure.epic('Online Ordering');
    await allure.feature('Authentication');
    await allure.severity('blocker');

    await test.step('Open storefront and clear dialogs', async () => {
      await orderingHomePage.goto();
      await orderingHomePage.handleDisclaimer();
      await orderingHomePage.handleAgeVerification();
    });

    await test.step('Perform Login via Identity Server', async () => {
      await orderingHomePage.login();
    });

    await test.step('Verify redirection back to storefront', async () => {
      await orderingHomePage.expectLoggedIn();
    });
  });
});
