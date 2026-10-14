import { allure } from 'allure-playwright';
import { test } from '../../fixtures/pages';

test.describe('Fulfillment App', () => {
  test('fulfillment login page opens and verifies URL', async ({ fulfillmentLoginPage }) => {
    await allure.epic('Fulfillment App');
    await allure.feature('Authentication');
    await allure.severity('critical');

    await test.step('Navigate to Fulfillment app', async () => {
      await fulfillmentLoginPage.goto();
    });

    await test.step('Verify Fulfillment app URL', async () => {
      await fulfillmentLoginPage.expectLoginPage();
    });
  });
});

