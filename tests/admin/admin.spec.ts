import { allure } from 'allure-playwright';
import { test } from '../../fixtures/pages';

// Login flow test requires fresh, unauthenticated session
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Admin Portal', () => {
  test('admin user logs in via Identity Server and redirects to dashboard', async ({ adminLoginPage }) => {
    await allure.epic('Admin Portal');
    await allure.feature('Authentication');
    await allure.severity('blocker');

    await test.step('Navigate to Admin portal login page', async () => {
      await adminLoginPage.goto();
    });

    await test.step('Execute Login via Identity Server', async () => {
      await adminLoginPage.login();
    });

    await test.step('Verify redirection to Admin portal', async () => {
      await adminLoginPage.expectLoggedIn();
    });
  });
});
