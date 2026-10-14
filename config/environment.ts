import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export type EnvironmentName = 'dev' | 'staging';

export interface AppConfig {
  name: string;
  baseUrl: string;
  user: string;
  password?: string;
}

export interface SystemConfig {
  env: EnvironmentName;
  ordering: AppConfig;
  admin: AppConfig;
  fulfillment: AppConfig;
}

// Default to 'dev' if not specified
const currentEnv: EnvironmentName = (process.env.TEST_ENV?.toLowerCase() === 'staging') ? 'staging' : 'dev';

const environments: Record<EnvironmentName, { ordering: AppConfig; admin: AppConfig; fulfillment: AppConfig }> = {
  dev: {
    ordering: {
      name: 'Online Ordering (Dev)',
      baseUrl: process.env.ORDERING_DEV_URL || 'https://ftx.dev.ftxcommerce.com',
      user: process.env.ORDERING_DEV_USER || '',
      password: process.env.ORDERING_DEV_PASSWORD || '',
    },
    admin: {
      name: 'Admin Portal (Dev)',
      baseUrl: process.env.ADMIN_DEV_URL || 'https://ftx.admin.dev.ftxcommerce.com/',
      user: process.env.ADMIN_DEV_USER || '',
      password: process.env.ADMIN_DEV_PASSWORD || '',
    },
    fulfillment: {
      name: 'Fulfillment App (Dev)',
      baseUrl: process.env.FULFILLMENT_DEV_URL || 'https://ftx.fulfillment.dev.ftxcommerce.com/',
      user: process.env.FULFILLMENT_DEV_USER || '',
      password: process.env.FULFILLMENT_DEV_PASSWORD || '',
    },
  },
  staging: {
    ordering: {
      name: 'Online Ordering (Staging)',
      baseUrl: process.env.ORDERING_STAGING_URL || 'https://ftx.staging.ftxcommerce.com',
      user: process.env.ORDERING_STAGING_USER || '',
      password: process.env.ORDERING_STAGING_PASSWORD || '',
    },
    admin: {
      name: 'Admin Portal (Staging)',
      baseUrl: process.env.ADMIN_STAGING_URL || 'https://ftx.admin.staging.ftxcommerce.com/',
      user: process.env.ADMIN_STAGING_USER || '',
      password: process.env.ADMIN_STAGING_PASSWORD || '',
    },
    fulfillment: {
      name: 'Fulfillment App (Staging)',
      baseUrl: process.env.FULFILLMENT_STAGING_URL || 'https://ftx.fulfillment.staging.ftxcommerce.com/',
      user: process.env.FULFILLMENT_STAGING_USER || '',
      password: process.env.FULFILLMENT_STAGING_PASSWORD || '',
    },
  },
};

export const config: SystemConfig = {
  env: currentEnv,
  ...environments[currentEnv],
};

