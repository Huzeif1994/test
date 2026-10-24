import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { parseUserStoryContent, mapStepToPageObjects, generateTestPlan } from '../../scripts/ai-planner';

test.describe('Agile Story Planner — Unit Test Suite', () => {
  const sampleMarkdown = `# US-999: Automated Return and Refund Workflow

## Metadata
- **ID:** US-999
- **Target Projects:** ordering, fulfillment, e2e-bridge
- **Priority:** Critical
- **Persona:** Retail Customer & Customer Support Agent

## Preconditions
- Customer is authenticated via \`.auth/ordering.json\`
- Fulfillment Employee is authenticated via \`.auth/fulfillment.json\`
- Mobile device emulation uses \`Pixel 5\`

## Scenario: Customer initiates store return and receives confirmation
- **GIVEN** Customer clears shopping cart and navigates to catalog
- **WHEN** Customer selects checkout and pays with credit card
- **AND** Customer captures order reference and confirmation code
- **WHEN** Fulfillment employee searches for order in pending orders
- **AND** Fulfillment employee picks all items and marks order ready
- **THEN** Customer navigates to gift card panel and activates store credit
`;

  test('should accurately extract story metadata and preconditions', () => {
    const plan = parseUserStoryContent(sampleMarkdown);

    expect(plan.id).toBe('US-999');
    expect(plan.title).toBe('Automated Return and Refund Workflow');
    expect(plan.priority).toBe('Critical');
    expect(plan.persona).toBe('Retail Customer & Customer Support Agent');
    expect(plan.targetProjects).toEqual(['ordering', 'fulfillment', 'e2e-bridge']);
    expect(plan.preconditions.authStates).toContain('.auth/ordering.json');
    expect(plan.preconditions.authStates).toContain('.auth/fulfillment.json');
    expect(plan.preconditions.devices).toContain('Pixel 5');
  });

  test('should parse Gherkin steps and map to accurate target domains', () => {
    const plan = parseUserStoryContent(sampleMarkdown);

    expect(plan.scenarios.length).toBe(1);
    const scenario = plan.scenarios[0];
    expect(scenario.name).toBe('Customer initiates store return and receives confirmation');
    expect(scenario.steps.length).toBe(6);

    // Step 1: Catalog
    expect(scenario.steps[0].type).toBe('GIVEN');
    expect(scenario.steps[0].targetDomain).toBe('ordering');
    expect(scenario.steps[0].suggestedPageObjects).toContain('OrderingCatalogPage');

    // Step 2: Checkout & Credit Card
    expect(scenario.steps[1].type).toBe('WHEN');
    expect(scenario.steps[1].targetDomain).toBe('ordering');
    expect(scenario.steps[1].suggestedPageObjects).toContain('OrderingCheckoutPage');

    // Step 4: Pending orders search
    expect(scenario.steps[3].type).toBe('WHEN');
    expect(scenario.steps[3].targetDomain).toBe('fulfillment');
    expect(scenario.steps[3].suggestedPageObjects).toContain('PendingOrdersPage');

    // Step 5: Pick items & mark ready
    expect(scenario.steps[4].type).toBe('AND');
    expect(scenario.steps[4].targetDomain).toBe('fulfillment');
    expect(scenario.steps[4].suggestedPageObjects).toContain('PickOrderDetailPage');

    // Step 6: Gift card activation
    expect(scenario.steps[5].type).toBe('THEN');
    expect(scenario.steps[5].targetDomain).toBe('ordering');
    expect(scenario.steps[5].suggestedPageObjects).toContain('OrderingGiftCardPage');
  });

  test('should map individual keywords to specific Page Objects and domains', () => {
    const cartMapping = mapStepToPageObjects('Customer adds product to cart and clears basket');
    expect(cartMapping.domain).toBe('ordering');
    expect(cartMapping.pageObjects).toContain('OrderingCatalogPage');

    const pickingMapping = mapStepToPageObjects('Picker starts picking and scans item barcode');
    expect(pickingMapping.domain).toBe('fulfillment');
    expect(pickingMapping.pageObjects).toContain('PickOrderDetailPage');

    const handoverMapping = mapStepToPageObjects('Staff opens ready orders and verifies pickup handover code');
    expect(handoverMapping.domain).toBe('fulfillment');
    expect(handoverMapping.pageObjects).toContain('ReadyOrdersPage');

    const adminMapping = mapStepToPageObjects('Admin backoffice navigates to customer detail and checks loyalty points');
    expect(adminMapping.domain).toBe('admin');
    expect(adminMapping.pageObjects).toContain('AdminCustomerDetailPage');
  });

  test('should generate structured JSON test plan on disk', () => {
    const tmpStoryPath = path.resolve('user-stories', 'US-TMP-TEST.md');
    fs.writeFileSync(tmpStoryPath, sampleMarkdown, 'utf8');

    try {
      const outPath = generateTestPlan(tmpStoryPath);
      expect(fs.existsSync(outPath)).toBeTruthy();

      const raw = fs.readFileSync(outPath, 'utf8');
      const json = JSON.parse(raw);
      expect(json.id).toBe('US-999');
      expect(json.scenarios[0].steps.length).toBe(6);
    } finally {
      if (fs.existsSync(tmpStoryPath)) fs.unlinkSync(tmpStoryPath);
    }
  });
});

