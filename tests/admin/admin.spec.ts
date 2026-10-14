import { allure } from 'allure-playwright';
import { test } from '../../fixtures/pages';

test.describe('Admin Portal', () => {
  test('admin login page opens and verifies URL', async ({ adminLoginPage }) => {
    await allure.epic('Admin Portal');
    await allure.feature('Authentication');
    await allure.severity('critical');

    await test.step('Navigate to Admin portal', async () => {
      await adminLoginPage.goto();
    });

    await test.step('Verify Admin portal URL', async () => {
      await adminLoginPage.expectLoginPage();
    });
  });
});

