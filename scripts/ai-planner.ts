import * as fs from 'fs';
import * as path from 'path';

export interface PlanStep {
  type: 'GIVEN' | 'WHEN' | 'THEN' | 'AND';
  text: string;
  targetDomain: 'ordering' | 'fulfillment' | 'admin' | 'shared';
  suggestedPageObjects: string[];
}

export interface PlanScenario {
  name: string;
  steps: PlanStep[];
}

export interface UserStoryPlan {
  id: string;
  title: string;
  persona: string;
  priority: string;
  targetProjects: Array<'ordering' | 'fulfillment' | 'admin' | 'e2e-bridge' | 'unit'>;
  preconditions: {
    authStates: string[];
    devices: string[];
    store?: string;
  };
  scenarios: PlanScenario[];
  generatedAt: string;
}

const PAGE_OBJECT_RULES: Array<{ keywords: RegExp; domain: 'ordering' | 'fulfillment' | 'admin' | 'shared'; pageObject: string }> = [
  { keywords: /catalog|category|product|cart|shopping/i, domain: 'ordering', pageObject: 'OrderingCatalogPage' },
  { keywords: /checkout|place order|pay at store|credit card|curbside|arrival|terms/i, domain: 'ordering', pageObject: 'OrderingCheckoutPage' },
  { keywords: /gift card|physical gift card|digital card|activate/i, domain: 'ordering', pageObject: 'OrderingGiftCardPage' },
  { keywords: /pending order|search.*order/i, domain: 'fulfillment', pageObject: 'PendingOrdersPage' },
  { keywords: /pick|item info/i, domain: 'fulfillment', pageObject: 'PickOrderDetailPage' },
  { keywords: /package|assign package|staging area/i, domain: 'fulfillment', pageObject: 'PickOrderPackagePage' },
  { keywords: /ready order|handover|confirmation code|pickup detail/i, domain: 'fulfillment', pageObject: 'ReadyOrdersPage' },
  { keywords: /store pickup detail|curbside car info|verify curbside/i, domain: 'fulfillment', pageObject: 'StorePickupDetailPage' },
  { keywords: /fulfilled order/i, domain: 'fulfillment', pageObject: 'FulfilledOrdersPage' },
  { keywords: /admin|customer detail|loyalty point/i, domain: 'admin', pageObject: 'AdminCustomerDetailPage' },
];

export function mapStepToPageObjects(stepText: string): { domain: 'ordering' | 'fulfillment' | 'admin' | 'shared'; pageObjects: string[] } {
  const matches: string[] = [];
  let detectedDomain: 'ordering' | 'fulfillment' | 'admin' | 'shared' = 'shared';

  for (const rule of PAGE_OBJECT_RULES) {
    if (rule.keywords.test(stepText)) {
      if (!matches.includes(rule.pageObject)) {
        matches.push(rule.pageObject);
      }
      if (detectedDomain === 'shared') {
        detectedDomain = rule.domain;
      }
    }
  }

  // Domain fallback detection from text
  if (detectedDomain === 'shared') {
    if (/customer|storefront/i.test(stepText)) detectedDomain = 'ordering';
    else if (/fulfillment|employee|picker|staging|handover/i.test(stepText)) detectedDomain = 'fulfillment';
    else if (/admin|backoffice/i.test(stepText)) detectedDomain = 'admin';
  }

  return {
    domain: detectedDomain,
    pageObjects: matches.length > 0 ? matches : ['BasePage'],
  };
}

export function parseUserStoryContent(markdown: string): UserStoryPlan {
  const lines = markdown.split(/\r?\n/);

  let id = 'US-UNKNOWN';
  let title = 'Untitled User Story';
  let persona = 'Customer';
  let priority = 'Medium';
  const targetProjects: Array<'ordering' | 'fulfillment' | 'admin' | 'e2e-bridge' | 'unit'> = [];
  const authStates: string[] = [];
  const devices: string[] = [];
  let store: string | undefined;

  const scenarios: PlanScenario[] = [];
  let currentScenario: PlanScenario | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Title & ID: e.g. # US-001: Customer Store Pickup...
    if (trimmed.startsWith('# ')) {
      const fullTitle = trimmed.substring(2).trim();
      const idMatch = fullTitle.match(/^([A-Z]+-[0-9]+)\s*:\s*(.*)$/i);
      if (idMatch) {
        id = idMatch[1].toUpperCase();
        title = idMatch[2].trim();
      } else {
        title = fullTitle;
      }
    }

    // Metadata items
    const idMeta = trimmed.match(/^\s*[-*]\s*\*\*ID:\*\*\s*(.+)$/i);
    if (idMeta) id = idMeta[1].trim();

    const personaMeta = trimmed.match(/^\s*[-*]\s*\*\*Persona:\*\*\s*(.+)$/i);
    if (personaMeta) persona = personaMeta[1].trim();

    const priorityMeta = trimmed.match(/^\s*[-*]\s*\*\*Priority:\*\*\s*(.+)$/i);
    if (priorityMeta) priority = priorityMeta[1].trim();

    const projectsMeta = trimmed.match(/^\s*[-*]\s*\*\*Target Projects:\*\*\s*(.+)$/i);
    if (projectsMeta) {
      const parts = projectsMeta[1].split(',').map(p => p.trim().toLowerCase());
      for (const p of parts) {
        if (['ordering', 'fulfillment', 'admin', 'e2e-bridge', 'unit'].includes(p)) {
          targetProjects.push(p as any);
        }
      }
    }

    // Preconditions
    if (trimmed.includes('.auth/ordering.json') && !authStates.includes('.auth/ordering.json')) {
      authStates.push('.auth/ordering.json');
    }
    if (trimmed.includes('.auth/fulfillment.json') && !authStates.includes('.auth/fulfillment.json')) {
      authStates.push('.auth/fulfillment.json');
    }
    if (trimmed.includes('.auth/admin.json') && !authStates.includes('.auth/admin.json')) {
      authStates.push('.auth/admin.json');
    }
    const deviceMatch = trimmed.match(/Pixel\s*[0-9]+|iPhone\s*[a-zA-Z0-9]+|iPad|Desktop/i) || trimmed.match(/Mobile/i);
    if (deviceMatch && !devices.includes(deviceMatch[0])) {
      devices.push(deviceMatch[0]);
    }
    const storeMatch = trimmed.match(/store branch `([^`]+)`/i);
    if (storeMatch) store = storeMatch[1];

    // Scenario header: e.g. ## Scenario: Complete In-Store Pickup
    const scenarioMatch = trimmed.match(/^##\s*Scenario:\s*(.+)$/i);
    if (scenarioMatch) {
      currentScenario = {
        name: scenarioMatch[1].trim(),
        steps: [],
      };
      scenarios.push(currentScenario);
      continue;
    }

    // Gherkin Steps: - **GIVEN**, - **WHEN**, - **THEN**, - **AND**
    const stepMatch = trimmed.match(/^[-*]\s*\*\*(GIVEN|WHEN|THEN|AND)\*\*\s*(.+)$/i);
    if (stepMatch && currentScenario) {
      const stepType = stepMatch[1].toUpperCase() as 'GIVEN' | 'WHEN' | 'THEN' | 'AND';
      const stepText = stepMatch[2].trim();
      const mapped = mapStepToPageObjects(stepText);

      currentScenario.steps.push({
        type: stepType,
        text: stepText,
        targetDomain: mapped.domain,
        suggestedPageObjects: mapped.pageObjects,
      });
    }
  }

  // Fallback defaults
  if (targetProjects.length === 0) {
    targetProjects.push('e2e-bridge');
  }

  return {
    id,
    title,
    persona,
    priority,
    targetProjects,
    preconditions: {
      authStates,
      devices,
      store,
    },
    scenarios,
    generatedAt: new Date().toISOString(),
  };
}

export function generateTestPlan(storyFilePath: string, outputDir: string = 'test-plans'): string {
  const fullPath = path.resolve(storyFilePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`User story file not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const plan = parseUserStoryContent(content);

  const targetDir = path.resolve(outputDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const outFilePath = path.join(targetDir, `${plan.id.toLowerCase()}-plan.json`);
  fs.writeFileSync(outFilePath, JSON.stringify(plan, null, 2), 'utf8');

  console.log(`✅ [AI-PLANNER] Generated Test Plan for ${plan.id} -> ${outFilePath}`);
  console.log(`   Title: ${plan.title}`);
  console.log(`   Target Projects: ${plan.targetProjects.join(', ')}`);
  console.log(`   Scenarios Parsed: ${plan.scenarios.length}`);
  for (const s of plan.scenarios) {
    console.log(`   - "${s.name}" (${s.steps.length} Gherkin steps)`);
  }

  return outFilePath;
}

// CLI Execution Entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const userStoriesDir = path.resolve('user-stories');

  if (args.length === 0 || args[0] === '--all') {
    if (!fs.existsSync(userStoriesDir)) {
      console.error(`User stories directory not found: ${userStoriesDir}`);
      process.exit(1);
    }
    const files = fs.readdirSync(userStoriesDir).filter(f => f.endsWith('.md'));
    console.log(`Found ${files.length} user story specification(s) in user-stories/...`);
    for (const f of files) {
      generateTestPlan(path.join(userStoriesDir, f));
    }
  } else {
    for (const targetFile of args) {
      generateTestPlan(targetFile);
    }
  }
}
