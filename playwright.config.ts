import { defineConfig, devices } from '@playwright/test';
import { config } from './config/environment';

export default defineConfig({
  testDir: './tests',

  /* Dev site slow hai (page kholne mein 25-30s), isliye test timeout badhaya */
  timeout: 90_000,

  /* Run tests sequentially to avoid choking slow dev server */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Use single worker to ensure stability against dev server */
  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ...(process.env.CI ? [['junit', { outputFile: 'test-results/junit.xml' }] as const] : []),
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],

  use: {
    navigationTimeout: 60_000,
    actionTimeout: 20_000,

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