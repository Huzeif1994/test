import { allure } from 'allure-playwright';
import { test } from '../../fixtures/pages';

test.describe('Fulfillment App', () => {
  test('fulfillment user logs in via Identity Server and redirects to dashboard', async ({ fulfillmentLoginPage }) => {
    await allure.epic('Fulfillment App');
    await allure.feature('Authentication');
    await allure.severity('blocker');

    await test.step('Navigate to Fulfillment app login page', async () => {
      await fulfillmentLoginPage.goto();
    });

    await test.step('Execute Login via Identity Server', async () => {
      await fulfillmentLoginPage.login();
    });

    await test.step('Verify redirection to Fulfillment app', async () => {
      await fulfillmentLoginPage.expectLoggedIn();
    });
  });
});
