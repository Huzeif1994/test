import { defineConfig, devices } from '@playwright/test';
import { config } from './config/environment';

const isHeaded = process.argv.some(arg => arg.includes('--headed') || arg.includes('--ui') || arg === '-h') || process.env.HEADED === 'true';

if (isHeaded) {
  process.env.HEADED = 'true';
}

const desktopChrome = {
  viewport: null,
};

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

    /* Always use viewport: null so the browser window expands naturally without forced emulation borders */
    viewport: null,
    launchOptions: {
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    },

    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup-fulfillment',
      testMatch: /auth\.fulfillment\.setup\.ts/,
      use: {
        ...desktopChrome,
        baseURL: config.fulfillment.baseUrl,
      },
    },
    {
      name: 'setup-admin',
      testMatch: /auth\.admin\.setup\.ts/,
      use: {
        ...desktopChrome,
        baseURL: config.admin.baseUrl,
      },
    },
    {
      name: 'setup-ordering',
      testMatch: /auth\.ordering\.setup\.ts/,
      use: {
        ...desktopChrome,
        baseURL: config.ordering.baseUrl,
      },
    },
    {
      name: 'ordering',
      testDir: './tests/ordering',
      dependencies: ['setup-ordering'],
      use: {
        ...desktopChrome,
        baseURL: config.ordering.baseUrl,
        storageState: '.auth/ordering.json',
      },
    },
    {
      name: 'admin',
      testDir: './tests/admin',
      dependencies: ['setup-admin'],
      use: {
        ...desktopChrome,
        baseURL: config.admin.baseUrl,
        storageState: '.auth/admin.json',
      },
    },
    {
      name: 'fulfillment',
      testDir: './tests/fulfillment',
      dependencies: ['setup-fulfillment'],
      use: {
        ...desktopChrome,
        baseURL: config.fulfillment.baseUrl,
        storageState: '.auth/fulfillment.json',
      },
    },
    {
      name: 'e2e-bridge',
      testDir: './tests/e2e-bridge',
      dependencies: ['setup-ordering', 'setup-fulfillment'],
      use: {
        ...desktopChrome,
      },
    },
  ],
});