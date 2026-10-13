import { allure } from 'allure-playwright';
import { test } from '../fixtures/pages';

test.describe('Home page', () => {
  test('home page opens', async ({ homePage }) => {
    await allure.epic('Storefront');
    await allure.feature('Home page');
    await allure.severity('critical');

    await test.step('Open home page', async () => {
      await homePage.goto();
    });

    await test.step('Verify URL', async () => {
      await homePage.expectOnHomePage();
    });
  });
});
