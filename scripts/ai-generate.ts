import * as fs from 'fs';
import * as path from 'path';
import { UserStoryPlan, PlanStep } from './ai-planner';

export interface GeneratedTestResult {
  filePath: string;
  code: string;
  planId: string;
}

export function translateStepToPOM(step: PlanStep): string {
  const text = step.text;

  // Ordering steps
  if (/navigates? to.*product catalog|opens? catalog|browses? catalog/i.test(text)) {
    return `await catalogPage.gotoCategory('huzeif-test');`;
  }

  if (/clears shopping cart/i.test(text) && /category/i.test(text)) {
    const catMatch = text.match(/["']([^"']+)["']\s*category/i) || text.match(/category\s*["']?([^"']+)["']?/i);
    const cat = catMatch ? catMatch[1] : 'huzeif-test';
    return `await checkoutPage.clearCartIfNotEmpty();\n      await catalogPage.gotoCategory('${cat}');`;
  }

  if (/adds?.*product.*to.*cart/i.test(text) && /checkout/i.test(text)) {
    const prodMatch = text.match(/["'\*]+([^"'\*]+)["'\*]+/);
    const prod = prodMatch ? prodMatch[1] : 'Clipper Refillable Lighter';
    return `await catalogPage.addProductToCart('${prod}');\n      await catalogPage.openCartAndProceed();\n      await checkoutPage.proceedToCheckout();`;
  }

  if (/adds?.*product.*to.*cart/i.test(text)) {
    const prodMatch = text.match(/["'\*]+([^"'\*]+)["'\*]+/);
    const prod = prodMatch ? prodMatch[1] : 'Clipper Refillable Lighter';
    return `await catalogPage.addProductToCart('${prod}');`;
  }

  if (/navigates? to.*Cart page|opens? Cart|proceeds? to cart/i.test(text)) {
    return `await catalogPage.openCartAndProceed();\n      await checkoutPage.proceedToCheckout();`;
  }

  if (/Loyalty Points|loyalty.*redemption|enters?.*loyalty/i.test(text)) {
    const amountMatch = text.match(/\$([0-9.]+)/) || text.match(/([0-9.]+)\s*(points?|dollars?)/i);
    const amount = amountMatch ? amountMatch[1] : '0.01';
    return `await checkoutPage.applyLoyaltyDiscount('${amount}');`;
  }

  if (/checkout summary.*loyalty discount|displays?.*loyalty discount/i.test(text)) {
    const amountMatch = text.match(/\$([0-9.]+)/);
    const amount = amountMatch ? amountMatch[1] : '0.01';
    return `await checkoutPage.verifyLoyaltyDiscount('${amount}');`;
  }

  if (/accepts?.*terms.*submits?.*order|submits?.*order/i.test(text)) {
    return `await checkoutPage.acceptTerms();\n      await checkoutPage.placeOrder();`;
  }

  if (/order.*placed successfully|order.*placed/i.test(text)) {
    return `placedOrderNumber = await checkoutPage.getLatestOrderNumber();\n      console.log('Placed order number verified:', placedOrderNumber);\n      expect(placedOrderNumber).toBeTruthy();`;
  }

  if (/order confirmation.*reflect.*loyalty|confirmation.*loyalty/i.test(text)) {
    const amountMatch = text.match(/\$([0-9.]+)/);
    const amount = amountMatch ? amountMatch[1] : '0.01';
    return `await checkoutPage.verifyOrderConfirmationLoyalty('${amount}');`;
  }

  if (/Orders page.*loyalty discount/i.test(text)) {
    const amountMatch = text.match(/\$([0-9.]+)/);
    const amount = amountMatch ? amountMatch[1] : '0.01';
    return `await checkoutPage.verifyOrderHistoryLoyalty(placedOrderNumber, '${amount}');`;
  }

  if (/In Store Pickup/i.test(text) && /Pay At Store/i.test(text)) {
    return `await checkoutPage.selectInStorePickup();\n      await checkoutPage.turnOffPayAtStore();\n      await checkoutPage.selectCreditOrDebitCard();`;
  }

  if (/Curbside Pickup/i.test(text)) {
    return `await checkoutPage.selectCurbsidePickup();\n      await checkoutPage.turnOffPayAtStore();\n      await checkoutPage.selectCreditOrDebitCard();`;
  }

  if (/places? order/i.test(text) || /capturing Order ID/i.test(text)) {
    return `await checkoutPage.acceptTerms();\n      await checkoutPage.placeOrder();\n      await checkoutPage.clickViewOrderOnThankYouPage();\n      placedOrderNumber = await checkoutPage.getLatestOrderNumber();\n      confirmationCode = await checkoutPage.getConfirmationCode();\n      console.log('Placed Order:', placedOrderNumber, 'Code:', confirmationCode);`;
  }

  if (/Physical Gift Card/i.test(text)) {
    return `await giftCardPage.openGiftCardsCatalog();\n      await giftCardPage.configureAndBuyPhysicalCard(25);\n      await checkoutPage.placeOrder();\n      placedOrderNumber = await checkoutPage.getLatestOrderNumber();`;
  }

  // Mobile customer arrival
  if (/Mobile Device View/i.test(text) || /Pixel 5/i.test(text) || /arrival submission/i.test(text)) {
    return `const mobileContext = await browser.newContext({\n        ...devices['Pixel 5'],\n        storageState: '.auth/ordering.json',\n        baseURL: config.ordering.baseUrl,\n      });\n      const mobilePage = await mobileContext.newPage();\n      const mobileCheckout = new OrderingCheckoutPage(mobilePage);\n      await mobilePage.goto(customerPage.url(), { waitUntil: 'domcontentloaded' });\n      await mobileCheckout.completeMobileCurbsideArrival({\n        spot: 'Spot - A',\n        color: 'Black',\n        maker: 'Acura',\n        model: 'CL',\n      });\n      await mobileContext.close();`;
  }

  // Fulfillment steps
  if (/searches for.*order in Pending Orders/i.test(text) || /opens Pending Orders/i.test(text)) {
    return `await fulfillmentPage.goto('/pending-order', { waitUntil: 'domcontentloaded' });\n      await pendingOrdersPage.expectOnPendingPage();\n      await pendingOrdersPage.expectTableLoaded();\n      if (placedOrderNumber) {\n        await pendingOrdersPage.waitForOrderInPending(placedOrderNumber);\n      }`;
  }

  if (/Start Picking/i.test(text) || /picks all.*items/i.test(text)) {
    return `await pendingOrdersPage.openOrderDetail(placedOrderNumber);\n      await orderDetailPage.expectOnOrderDetail();\n      await orderDetailPage.clickStartPicking();\n      await pickOrderDetailPage.expectOnPickOrderPage();\n      await pickOrderDetailPage.pickAllItems(itemInfoDrawer);\n      await pickOrderDetailPage.clickNext();`;
  }

  if (/package assignment/i.test(text) || /marks? the order Ready/i.test(text)) {
    return `const onAssign = await fulfillmentPage.waitForURL(/assign-package/i, { timeout: 10000 }).then(() => true).catch(() => false);\n      if (onAssign) {\n        await pickOrderPackagePage.selectAllPackages();\n        await pickOrderPackagePage.clickAssignStagingArea();\n        await assignStagingDrawer.expectDrawerOpen();\n        await assignStagingDrawer.selectStagingArea();\n        await assignStagingDrawer.clickSave();\n        await pickOrderPackagePage.clickMarkReady();\n        await pickOrderPackagePage.expectOrderCompletedAndRedirected();\n      } else {\n        const directReady = fulfillmentPage.locator('button').filter({ hasText: /^MARK READY$/i }).first();\n        if (await directReady.isVisible({ timeout: 4000 }).catch(() => false)) {\n          await directReady.click();\n        }\n      }`;
  }

  if (/navigates to Ready Orders/i.test(text)) {
    return `await fulfillmentSidebar.goToReady();\n      await readyOrdersPage.expectOnReadyPage();\n      await readyOrdersPage.expectTableLoaded();\n      if (placedOrderNumber) {\n        await readyOrdersPage.search(placedOrderNumber);\n        await readyOrdersPage.openOrderForHandover(placedOrderNumber);\n      }`;
  }

  if (/submits customer confirmation code/i.test(text) || /Handover modal/i.test(text)) {
    return `await storePickupDetailPage.expectOnOrderDetail();\n      await storePickupDetailPage.clickContinue();\n      if (confirmationCode) {\n        await storePickupDetailPage.enterConfirmationCode(confirmationCode);\n      }`;
  }

  if (/transitions to Fulfilled status/i.test(text) || /Fulfilled Orders listing/i.test(text)) {
    return `await fulfillmentSidebar.goToFulfilled();\n      await fulfilledOrdersPage.expectOnFulfilledPage();\n      if (placedOrderNumber) {\n        await fulfilledOrdersPage.search(placedOrderNumber);\n        await fulfilledOrdersPage.expectOrderRowVisible(placedOrderNumber);\n      }`;
  }

  if (/Curbside Pickup method and Parking Spot/i.test(text)) {
    return `await storePickupDetailPage.verifyCurbsideCarInfo({\n        spot: 'Spot - A',\n        company: 'Acura',\n        model: 'CL',\n        color: 'Black',\n      });`;
  }

  if (/gift card panel/i.test(text) || /activates store credit/i.test(text) || /Active Cards list/i.test(text)) {
    return `await giftCardPage.gotoManageGiftCards();\n      await giftCardPage.activateNewlyPurchasedGiftCard();`;
  }

  // Fallback generic POM placeholder
  return `// Step: ${text}\n      await customerPage.waitForTimeout(1000);`;
}

export function generatePlaywrightSpecFromPlan(plan: UserStoryPlan): string {
  const isE2EBridge = plan.targetProjects.includes('e2e-bridge') ||
                      (plan.targetProjects.includes('ordering') && plan.targetProjects.includes('fulfillment'));

  const code: string[] = [];

  // 1. Imports
  code.push(`import { test, expect, devices } from '@playwright/test';`);
  code.push(`import { allure } from 'allure-playwright';`);
  code.push(`import { config } from '../../config/environment';`);

  // POM Imports based on target domains
  code.push(`import { OrderingCatalogPage } from '../../pages/ordering/OrderingCatalogPage';`);
  code.push(`import { OrderingCheckoutPage } from '../../pages/ordering/OrderingCheckoutPage';`);
  code.push(`import { OrderingGiftCardPage } from '../../pages/ordering/OrderingGiftCardPage';`);

  if (isE2EBridge || plan.targetProjects.includes('fulfillment')) {
    code.push(`import { PendingOrdersPage } from '../../pages/fulfillment/orders/PendingOrdersPage';`);
    code.push(`import { OrderDetailPage } from '../../pages/fulfillment/orders/OrderDetailPage';`);
    code.push(`import { PickOrderDetailPage } from '../../pages/fulfillment/picking/PickOrderDetailPage';`);
    code.push(`import { ItemInfoDrawer } from '../../pages/fulfillment/modals/ItemInfoDrawer';`);
    code.push(`import { PickOrderPackagePage } from '../../pages/fulfillment/picking/PickOrderPackagePage';`);
    code.push(`import { AssignStagingDrawer } from '../../pages/fulfillment/modals/AssignStagingDrawer';`);
    code.push(`import { ReadyOrdersPage } from '../../pages/fulfillment/orders/ReadyOrdersPage';`);
    code.push(`import { StorePickupDetailPage } from '../../pages/fulfillment/detail/StorePickupDetailPage';`);
    code.push(`import { FulfilledOrdersPage } from '../../pages/fulfillment/orders/FulfilledOrdersPage';`);
    code.push(`import { FulfillmentSidebar } from '../../pages/fulfillment/navigation/FulfillmentSidebar';`);
  }

  code.push(``);

  // 2. Describe Block
  code.push(`test.describe('${plan.id}: ${plan.title}', () => {`);
  code.push(`  test.describe.configure({ mode: 'serial' });`);
  code.push(``);

  for (const scenario of plan.scenarios) {
    code.push(`  test('${scenario.name} @generated @${plan.id.toLowerCase()}', async ({ browser }) => {`);
    code.push(`    test.setTimeout(360_000); // 6 minutes maximum for full workflow`);
    code.push(`    await allure.epic('AI-Generated SDET Suites');`);
    code.push(`    await allure.feature('${plan.id}: ${plan.title}');`);
    code.push(`    await allure.story('${scenario.name}');`);
    code.push(``);

    // State variables
    code.push(`    let placedOrderNumber = '';`);
    code.push(`    let confirmationCode = '';`);
    code.push(``);

    // Contexts & Pages
    code.push(`    // --- Customer Storefront Context ---`);
    code.push(`    const customerContext = await browser.newContext({`);
    code.push(`      storageState: '.auth/ordering.json',`);
    code.push(`      baseURL: config.ordering.baseUrl,`);
    code.push(`      viewport: { width: 1366, height: 768 },`);
    code.push(`    });`);
    code.push(`    const customerPage = await customerContext.newPage();`);
    code.push(`    const catalogPage = new OrderingCatalogPage(customerPage);`);
    code.push(`    const checkoutPage = new OrderingCheckoutPage(customerPage);`);
    code.push(`    const giftCardPage = new OrderingGiftCardPage(customerPage);`);
    code.push(``);

    if (isE2EBridge || plan.targetProjects.includes('fulfillment')) {
      code.push(`    // --- Fulfillment Employee Context ---`);
      code.push(`    const fulfillmentContext = await browser.newContext({`);
      code.push(`      storageState: '.auth/fulfillment.json',`);
      code.push(`      baseURL: config.fulfillment.baseUrl,`);
      code.push(`      viewport: { width: 1366, height: 768 },`);
      code.push(`    });`);
      code.push(`    const fulfillmentPage = await fulfillmentContext.newPage();`);
      code.push(`    const pendingOrdersPage = new PendingOrdersPage(fulfillmentPage);`);
      code.push(`    const orderDetailPage = new OrderDetailPage(fulfillmentPage);`);
      code.push(`    const pickOrderDetailPage = new PickOrderDetailPage(fulfillmentPage);`);
      code.push(`    const itemInfoDrawer = new ItemInfoDrawer(fulfillmentPage);`);
      code.push(`    const pickOrderPackagePage = new PickOrderPackagePage(fulfillmentPage);`);
      code.push(`    const assignStagingDrawer = new AssignStagingDrawer(fulfillmentPage);`);
      code.push(`    const readyOrdersPage = new ReadyOrdersPage(fulfillmentPage);`);
      code.push(`    const storePickupDetailPage = new StorePickupDetailPage(fulfillmentPage);`);
      code.push(`    const fulfilledOrdersPage = new FulfilledOrdersPage(fulfillmentPage);`);
      code.push(`    const fulfillmentSidebar = new FulfillmentSidebar(fulfillmentPage);`);
      code.push(``);
    }

    // Step Generation
    code.push(`    try {`);
    for (const step of scenario.steps) {
      const pomSnippet = translateStepToPOM(step);
      code.push(`      await test.step('${step.type}: ${step.text.replace(/'/g, "\\'")}', async () => {`);
      code.push(`        ${pomSnippet.split('\n').join('\n        ')}`);
      code.push(`      });`);
      code.push(``);
    }

    code.push(`    } finally {`);
    code.push(`      await customerContext.close().catch(() => {});`);
    if (isE2EBridge || plan.targetProjects.includes('fulfillment')) {
      code.push(`      await fulfillmentContext.close().catch(() => {});`);
    }
    code.push(`    }`);
    code.push(`  });`);
  }

  code.push(`});`);
  code.push(``);

  return code.join('\n');
}

export function generateTestSpecFile(planFilePath: string, outputDir: string = 'tests/generated'): GeneratedTestResult {
  const raw = fs.readFileSync(path.resolve(planFilePath), 'utf8');
  const plan: UserStoryPlan = JSON.parse(raw);

  const specCode = generatePlaywrightSpecFromPlan(plan);
  const outDir = path.resolve(outputDir);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const fileName = `${plan.id.toLowerCase()}-${plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.spec.ts`;
  const fullOutPath = path.join(outDir, fileName);

  fs.writeFileSync(fullOutPath, specCode, 'utf8');
  console.log(`🚀 [AI-GENERATE] Generated Playwright Spec -> ${fullOutPath}`);

  return {
    filePath: fullOutPath,
    code: specCode,
    planId: plan.id,
  };
}

// CLI Execution Entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const plansDir = path.resolve('test-plans');

  if (args.length === 0 || args[0] === '--all') {
    if (!fs.existsSync(plansDir)) {
      console.error(`Test plans directory not found: ${plansDir}. Run "npm run test:plan" first.`);
      process.exit(1);
    }
    const planFiles = fs.readdirSync(plansDir).filter(f => f.endsWith('-plan.json'));
    console.log(`Found ${planFiles.length} test plan(s) in test-plans/...`);
    for (const pf of planFiles) {
      generateTestSpecFile(path.join(plansDir, pf));
    }
  } else {
    for (const target of args) {
      generateTestSpecFile(target);
    }
  }
}
