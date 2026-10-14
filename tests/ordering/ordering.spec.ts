import { allure } from 'allure-playwright';
import { test } from '../../fixtures/pages';

test.describe('Online Ordering App', () => {
  test('home page opens successfully', async ({ orderingHomePage }) => {
    await allure.epic('Online Ordering');
    await allure.feature('Home Page');
    await allure.severity('critical');

    await test.step('Navigate to Ordering home page', async () => {
      await orderingHomePage.goto();
    });

    await test.step('Verify Ordering URL', async () => {
      await orderingHomePage.expectOnHomePage();
    });
  });
});
