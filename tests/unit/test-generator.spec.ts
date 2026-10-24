import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { translateStepToPOM, generatePlaywrightSpecFromPlan, generateTestSpecFile } from '../../scripts/ai-generate';
import { UserStoryPlan } from '../../scripts/ai-planner';

test.describe('POM-Aware Test Generator — Unit Test Suite', () => {
  const dummyPlan: UserStoryPlan = {
    id: 'US-TEST-GEN',
    title: 'Automated Checkout Verification',
    persona: 'Customer',
    priority: 'High',
    targetProjects: ['e2e-bridge', 'ordering', 'fulfillment'],
    preconditions: {
      authStates: ['.auth/ordering.json'],
      devices: ['Pixel 5'],
    },
    scenarios: [
      {
        name: 'Verify Store Pickup Checkout Flow',
        steps: [
          {
            type: 'GIVEN',
            text: 'Customer clears shopping cart and navigates to "cigars" category',
            targetDomain: 'ordering',
            suggestedPageObjects: ['OrderingCatalogPage', 'OrderingCheckoutPage'],
          },
          {
            type: 'WHEN',
            text: 'Customer selects "In Store Pickup", turns off "Pay At Store", and selects "Credit or Debit Card"',
            targetDomain: 'ordering',
            suggestedPageObjects: ['OrderingCheckoutPage'],
          },
          {
            type: 'THEN',
            text: 'Fulfillment employee searches for the placed order in Pending Orders',
            targetDomain: 'fulfillment',
            suggestedPageObjects: ['PendingOrdersPage'],
          },
        ],
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  test('should accurately translate Gherkin steps to typed Page Object Model calls', () => {
    // 1. Cart clear & category navigation
    const step1Code = translateStepToPOM({
      type: 'GIVEN',
      text: 'Customer clears shopping cart and navigates to "cigars" category',
      targetDomain: 'ordering',
      suggestedPageObjects: ['OrderingCatalogPage'],
    });
    expect(step1Code).toContain('checkoutPage.clearCartIfNotEmpty()');
    expect(step1Code).toContain("catalogPage.gotoCategory('cigars')");

    // 2. In Store Pickup
    const step2Code = translateStepToPOM({
      type: 'WHEN',
      text: 'Customer selects "In Store Pickup", turns off "Pay At Store", and selects "Credit or Debit Card"',
      targetDomain: 'ordering',
      suggestedPageObjects: ['OrderingCheckoutPage'],
    });
    expect(step2Code).toContain('checkoutPage.selectInStorePickup()');
    expect(step2Code).toContain('checkoutPage.turnOffPayAtStore()');
    expect(step2Code).toContain('checkoutPage.selectCreditOrDebitCard()');

    // 3. Pending Orders search
    const step3Code = translateStepToPOM({
      type: 'THEN',
      text: 'Fulfillment employee searches for the placed order in Pending Orders',
      targetDomain: 'fulfillment',
      suggestedPageObjects: ['PendingOrdersPage'],
    });
    expect(step3Code).toContain('pendingOrdersPage.expectOnPendingPage()');
    expect(step3Code).toContain('pendingOrdersPage.waitForOrderInPending(placedOrderNumber)');
  });

  test('should generate complete Playwright spec code structure with POM imports and Allure tags', () => {
    const specCode = generatePlaywrightSpecFromPlan(dummyPlan);

    // Assert imports
    expect(specCode).toContain("import { test, expect, devices } from '@playwright/test';");
    expect(specCode).toContain("import { allure } from 'allure-playwright';");
    expect(specCode).toContain("import { OrderingCatalogPage } from '../../pages/ordering/OrderingCatalogPage';");
    expect(specCode).toContain("import { PendingOrdersPage } from '../../pages/fulfillment/orders/PendingOrdersPage';");

    // Assert describe and test titles
    expect(specCode).toContain("test.describe('US-TEST-GEN: Automated Checkout Verification'");
    expect(specCode).toContain("test('Verify Store Pickup Checkout Flow @generated @us-test-gen'");

    // Assert Allure annotations
    expect(specCode).toContain("await allure.epic('AI-Generated SDET Suites');");
    expect(specCode).toContain("await allure.feature('US-TEST-GEN: Automated Checkout Verification');");

    // Assert wrapped native test.step blocks
    expect(specCode).toContain("await test.step('GIVEN: Customer clears shopping cart");
    expect(specCode).toContain("await test.step('WHEN: Customer selects \"In Store Pickup\"");
    expect(specCode).toContain("await test.step('THEN: Fulfillment employee searches");
  });

  test('should write generated test file to disk correctly', () => {
    const tmpPlanPath = path.resolve('test-plans', 'us-test-gen-plan.json');
    fs.writeFileSync(tmpPlanPath, JSON.stringify(dummyPlan, null, 2), 'utf8');

    try {
      const result = generateTestSpecFile(tmpPlanPath);
      expect(fs.existsSync(result.filePath)).toBeTruthy();
      expect(result.code).toContain('US-TEST-GEN');

      // Clean up generated spec
      if (fs.existsSync(result.filePath)) fs.unlinkSync(result.filePath);
    } finally {
      if (fs.existsSync(tmpPlanPath)) fs.unlinkSync(tmpPlanPath);
    }
  });
});
