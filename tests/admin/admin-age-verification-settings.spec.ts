import { allure } from 'allure-playwright';
import { test, expect } from '../../fixtures/pages';

test.describe('Admin Portal Age Verification Settings Suite', () => {
  test.beforeEach(async ({ ageVerificationSettingsPage }) => {
    // Navigate directly using authenticated session from setup-admin
    await ageVerificationSettingsPage.gotoAgeRestriction();
  });

  test('Scenario 1: Configure Only "Enable Age Verification" main toggle @admin @age-settings', async ({
    ageVerificationSettingsPage,
  }) => {
    await allure.epic('Admin Portal');
    await allure.feature('Age Verification Settings');
    await allure.story('Scenario 1: Main Enable Age Verification Active');
    await allure.severity('critical');

    await test.step('Apply Scenario 1: Main Toggle ON, all sub-toggles OFF', async () => {
      await ageVerificationSettingsPage.configureScenario1();
    });

    await test.step('Save configuration and verify confirmation', async () => {
      await ageVerificationSettingsPage.saveSettings();
    });
  });

  test('Scenario 2: Configure Age Verification before showing age-restricted products @admin @age-settings', async ({
    ageVerificationSettingsPage,
  }) => {
    await allure.epic('Admin Portal');
    await allure.feature('Age Verification Settings');
    await allure.story('Scenario 2: Verify age before showing restricted products');
    await allure.severity('critical');

    await test.step('Apply Scenario 2: Main Toggle ON + Before Showing Products ON', async () => {
      await ageVerificationSettingsPage.configureScenario2();
    });

    await test.step('Save configuration and verify confirmation', async () => {
      await ageVerificationSettingsPage.saveSettings();
    });
  });

  test('Scenario 3: Configure Age Verification during checkout @admin @age-settings', async ({
    ageVerificationSettingsPage,
  }) => {
    await allure.epic('Admin Portal');
    await allure.feature('Age Verification Settings');
    await allure.story('Scenario 3: Verify age during checkout');
    await allure.severity('critical');

    await test.step('Apply Scenario 3: Main Toggle ON + During Checkout ON', async () => {
      await ageVerificationSettingsPage.configureScenario3();
    });

    await test.step('Save configuration and verify confirmation', async () => {
      await ageVerificationSettingsPage.saveSettings();
    });
  });

  test('Scenario 4 & 5: Configure Age Verification during fulfillment with manual DOB fallback @admin @age-settings', async ({
    ageVerificationSettingsPage,
  }) => {
    await allure.epic('Admin Portal');
    await allure.feature('Age Verification Settings');
    await allure.story('Scenario 4 & 5: Verify age during fulfillment with manual DOB fallback');
    await allure.severity('critical');

    await test.step('Apply Scenario 4 & 5: Main Toggle ON + Fulfillment ON + Manual DOB fallback', async () => {
      await ageVerificationSettingsPage.configureScenario5();
    });

    await test.step('Save configuration and verify confirmation', async () => {
      await ageVerificationSettingsPage.saveSettings();
    });
  });
});

