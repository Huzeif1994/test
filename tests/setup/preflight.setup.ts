import { test as setup, expect } from '@playwright/test';
import { config } from '../../config/environment';

/**
 * Fast-Fail Pre-Flight Environment Health Check (< 5 seconds)
 * Verifies that target environments are alive and responsive before launching heavy UI browser sessions.
 * Prevents wasting 15-20 minutes of CI runner minutes when a backend is down or experiencing outages.
 */
setup('verify environment health & accessibility across portals', async ({ request }) => {
  setup.setTimeout(30_000);

  console.log(`\n==================================================`);
  console.log(`🩺 PRE-FLIGHT HEALTH CHECK — Environment: [${config.env.toUpperCase()}]`);
  console.log(`==================================================`);

  // 1. Online Ordering Storefront
  const orderingStart = Date.now();
  const orderingRes = await request.get(config.ordering.baseUrl, { timeout: 15_000 }).catch(err => {
    throw new Error(`🛑 [PRE-FLIGHT OUTAGE] Online Ordering Storefront (${config.ordering.baseUrl}) is UNREACHABLE: ${err.message}`);
  });
  const orderingLatency = Date.now() - orderingStart;
  expect(orderingRes.status(), `Storefront responded with HTTP ${orderingRes.status()}`).toBeLessThan(500);
  console.log(`  ✅ Storefront:   HTTP ${orderingRes.status()} (${orderingLatency}ms) -> ${config.ordering.baseUrl}`);

  // 2. Admin Portal
  const adminStart = Date.now();
  const adminRes = await request.get(config.admin.baseUrl, { timeout: 15_000 }).catch(err => {
    throw new Error(`🛑 [PRE-FLIGHT OUTAGE] Admin Portal (${config.admin.baseUrl}) is UNREACHABLE: ${err.message}`);
  });
  const adminLatency = Date.now() - adminStart;
  expect(adminRes.status(), `Admin Portal responded with HTTP ${adminRes.status()}`).toBeLessThan(500);
  console.log(`  ✅ Admin Portal: HTTP ${adminRes.status()} (${adminLatency}ms) -> ${config.admin.baseUrl}`);

  // 3. Fulfillment Application
  const fulfillmentStart = Date.now();
  const fulfillmentRes = await request.get(config.fulfillment.baseUrl, { timeout: 15_000 }).catch(err => {
    throw new Error(`🛑 [PRE-FLIGHT OUTAGE] Fulfillment App (${config.fulfillment.baseUrl}) is UNREACHABLE: ${err.message}`);
  });
  const fulfillmentLatency = Date.now() - fulfillmentStart;
  expect(fulfillmentRes.status(), `Fulfillment App responded with HTTP ${fulfillmentRes.status()}`).toBeLessThan(500);
  console.log(`  ✅ Fulfillment:  HTTP ${fulfillmentRes.status()} (${fulfillmentLatency}ms) -> ${config.fulfillment.baseUrl}`);

  console.log(`--------------------------------------------------`);
  console.log(`🎯 All 3 Portal Endpoints are ONLINE & Healthy. Proceeding with Auth & Test Suites.`);
  console.log(`==================================================\n`);
});

