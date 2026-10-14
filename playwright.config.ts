import { defineConfig, devices } from '@playwright/test';
import { config } from './config/environment';

export default defineConfig({
  testDir: './tests',

  /* Dev site slow hai (page kholne mein 25-30s), isliye test timeout badhaya */
  timeout: 60_000,

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['allure-playwright', { resultsDir: 'allure-results' }],
      ]
    : [
        ['html'],
        ['allure-playwright', { resultsDir: 'allure-results' }],
      ],

  use: {
    navigationTimeout: 45_000,
    actionTimeout: 15_000,

    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'ordering',
      testDir: './tests/ordering',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.ordering.baseUrl,
      },
    },
    {
      name: 'admin',
      testDir: './tests/admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.admin.baseUrl,
      },
    },
    {
      name: 'fulfillment',
      testDir: './tests/fulfillment',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.fulfillment.baseUrl,
      },
    },
  ],
});