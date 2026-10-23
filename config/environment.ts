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

/**
 * Strict fail-fast secret accessor.
 * Enforces credential presence across ALL environments (local developer machines and CI).
 * Evaluated lazily when tests actually authenticate.
 *
 * An explicit bypass is allowed ONLY for non-execution workflows (e.g. typechecking, unit tests, linting)
 * via `SKIP_CREDENTIAL_CHECK=true`.
 */
export function getRequiredSecret(key: string, appName: string): string {
  const isBypassed =
    process.env.SKIP_CREDENTIAL_CHECK === 'true' ||
    process.env.npm_lifecycle_event === 'typecheck';
  const value = process.env[key];

  if (!value || value.trim() === '') {
    if (isBypassed) {
      return '';
    }
    throw new Error(
      `[Security Gate] Missing required credential secret: "${key}" for ${appName}.\n` +
      `Configure it in your local .env file or GitHub Actions secrets before executing tests.\n` +
      `See .env.example for template instructions, or export SKIP_CREDENTIAL_CHECK=true for dry-run verification.`
    );
  }
  return value.trim();
}

export function getBaseUrl(key: string, defaultUrl: string): string {
  return process.env[key]?.trim() || defaultUrl;
}

// Default to 'dev' if not specified
const currentEnv: EnvironmentName = (process.env.TEST_ENV?.toLowerCase() === 'staging') ? 'staging' : 'dev';

const environments: Record<EnvironmentName, { ordering: AppConfig; admin: AppConfig; fulfillment: AppConfig }> = {
  dev: {
    ordering: {
      name: 'Online Ordering (Dev)',
      baseUrl: getBaseUrl('ORDERING_DEV_URL', 'https://ftx.dev.ftxcommerce.com'),
      get user() { return getRequiredSecret('ORDERING_DEV_USER', 'Online Ordering (Dev)'); },
      get password() { return getRequiredSecret('ORDERING_DEV_PASSWORD', 'Online Ordering (Dev)'); },
    },
    admin: {
      name: 'Admin Portal (Dev)',
      baseUrl: getBaseUrl('ADMIN_DEV_URL', 'https://ftx.admin.dev.ftxcommerce.com/'),
      get user() { return getRequiredSecret('ADMIN_DEV_USER', 'Admin Portal (Dev)'); },
      get password() { return getRequiredSecret('ADMIN_DEV_PASSWORD', 'Admin Portal (Dev)'); },
    },
    fulfillment: {
      name: 'Fulfillment App (Dev)',
      baseUrl: getBaseUrl('FULFILLMENT_DEV_URL', 'https://ftx.fulfillment.dev.ftxcommerce.com/'),
      get user() { return getRequiredSecret('FULFILLMENT_DEV_USER', 'Fulfillment App (Dev)'); },
      get password() { return getRequiredSecret('FULFILLMENT_DEV_PASSWORD', 'Fulfillment App (Dev)'); },
    },
  },
  staging: {
    ordering: {
      name: 'Online Ordering (Staging)',
      baseUrl: getBaseUrl('ORDERING_STAGING_URL', 'https://ftx.staging.ftxcommerce.com'),
      get user() { return getRequiredSecret('ORDERING_STAGING_USER', 'Online Ordering (Staging)'); },
      get password() { return getRequiredSecret('ORDERING_STAGING_PASSWORD', 'Online Ordering (Staging)'); },
    },
    admin: {
      name: 'Admin Portal (Staging)',
      baseUrl: getBaseUrl('ADMIN_STAGING_URL', 'https://ftx.admin.staging.ftxcommerce.com/'),
      get user() { return getRequiredSecret('ADMIN_STAGING_USER', 'Admin Portal (Staging)'); },
      get password() { return getRequiredSecret('ADMIN_STAGING_PASSWORD', 'Admin Portal (Staging)'); },
    },
    fulfillment: {
      name: 'Fulfillment App (Staging)',
      baseUrl: getBaseUrl('FULFILLMENT_STAGING_URL', 'https://ftx.fulfillment.staging.ftxcommerce.com/'),
      get user() { return getRequiredSecret('FULFILLMENT_STAGING_USER', 'Fulfillment App (Staging)'); },
      get password() { return getRequiredSecret('FULFILLMENT_STAGING_PASSWORD', 'Fulfillment App (Staging)'); },
    },
  },
};

export const config: SystemConfig = {
  env: currentEnv,
  ...environments[currentEnv],
};
