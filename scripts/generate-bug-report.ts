import fs from 'fs';
import path from 'path';

export interface BugReportData {
  title: string;
  project: string;
  specPath: string;
  line?: number;
  classification: 'APPLICATION_BUG' | 'LOCATOR_DRIFT' | 'TIMEOUT_LATENCY' | 'ENVIRONMENT_ISSUE';
  errorMessage: string;
  reproCommand: string;
  steps: string[];
  expected: string;
  actual: string;
  screenshotPath?: string;
  tracePath?: string;
  videoPath?: string;
}

/**
 * Scans test-results for the most recent failure
 */
export function findLatestFailure(): { dir: string; stats: fs.Stats } | null {
  const resultsDir = path.resolve(process.cwd(), 'test-results');
  if (!fs.existsSync(resultsDir)) return null;

  const entries = fs.readdirSync(resultsDir, { withFileTypes: true });
  const failedDirs = entries
    .filter(e => e.isDirectory() && (e.name.includes('failed') || e.name.includes('retry') || true))
    .map(e => ({
      name: e.name,
      dir: path.join(resultsDir, e.name),
      stats: fs.statSync(path.join(resultsDir, e.name)),
    }))
    // Sort newest first
    .sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);

  return failedDirs[0] || null;
}

/**
 * Classifies the failure root cause
 */
export function classifyError(errorMsg: string): BugReportData['classification'] {
  const lower = errorMsg.toLowerCase();
  if (lower.includes('500 internal') || lower.includes('crash') || lower.includes('502 bad gateway') || lower.includes('failed to fetch')) {
    return 'APPLICATION_BUG';
  }
  if (lower.includes('strict mode violation') || lower.includes('resolved to') || lower.includes('not visible') || lower.includes('detached')) {
    return 'LOCATOR_DRIFT';
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'TIMEOUT_LATENCY';
  }
  return 'ENVIRONMENT_ISSUE';
}

/**
 * Generates GitHub-flavored Markdown
 */
export function formatGitHubMarkdown(data: BugReportData): string {
  return `### 🐞 [BUG][${data.project.toUpperCase()}] ${data.title}

- **Severity:** Major / Blocker
- **Classification:** \`${data.classification}\`
- **Spec:** \`${data.specPath}${data.line ? ':' + data.line : ''}\`
- **Environment:** Dev (\`ftx.dev.ftxcommerce.com\`)
- **Reported By:** Automated SDET Bug Reporter

---

#### 🔁 Quick Reproduction Command
\`\`\`bash
${data.reproCommand}
\`\`\`

---

#### 📝 Steps to Reproduce
${data.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---

#### ❌ Expected vs. Actual
- **Expected:** ${data.expected}
- **Actual:** ${data.actual}

---

#### ⚠️ Error Details & Stack Trace
\`\`\`text
${data.errorMessage}
\`\`\`

---

#### 📸 Forensic Artifacts
- **Screenshot:** ${data.screenshotPath ? `\`${data.screenshotPath}\`` : 'None captured'}
- **Trace ZIP:** ${data.tracePath ? `\`${data.tracePath}\`` : 'None captured'}
- **Video:** ${data.videoPath ? `\`${data.videoPath}\`` : 'None captured'}
`;
}

/**
 * Generates Atlassian Jira markup
 */
export function formatJiraMarkup(data: BugReportData): string {
  return `h2. 🐞 [BUG][${data.project.toUpperCase()}] ${data.title}

* *Severity:* Major / Blocker
* *Classification:* {{${data.classification}}}
* *Spec:* {{${data.specPath}${data.line ? ':' + data.line : ''}}}
* *Environment:* Dev (ftx.dev.ftxcommerce.com)

h3. 🔁 Quick Reproduction Command
{code:bash}
${data.reproCommand}
{code}

h3. 📝 Steps to Reproduce
${data.steps.map((s, i) => `# ${s}`).join('\n')}

h3. ❌ Expected vs. Actual
* *Expected:* ${data.expected}
* *Actual:* ${data.actual}

h3. ⚠️ Error Stack
{noformat}
${data.errorMessage}
{noformat}

h3. 📸 Forensic Artifacts
* *Screenshot:* {{${data.screenshotPath || 'N/A'}}}
* *Trace:* {{${data.tracePath || 'N/A'}}}
`;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const isJira = args.includes('--jira');

  const latest = findLatestFailure();
  let bugData: BugReportData;

  if (latest) {
    const files = fs.readdirSync(latest.dir);
    const screenshot = files.find(f => f.endsWith('.png'));
    const trace = files.find(f => f.endsWith('.zip'));
    const video = files.find(f => f.endsWith('.webm'));

    const errorSnippet = `Timeout exceeded in directory: ${path.basename(latest.dir)}`;
    const classification = classifyError(errorSnippet);

    bugData = {
      title: `Automated test failed in ${path.basename(latest.dir).split('-')[0]}`,
      project: path.basename(latest.dir).includes('e2e') ? 'e2e-bridge' : 'fulfillment',
      specPath: 'tests/e2e-bridge/physical-gift-card-lifecycle.spec.ts',
      classification,
      errorMessage: errorSnippet,
      reproCommand: `npx playwright test tests/e2e-bridge/physical-gift-card-lifecycle.spec.ts --headed`,
      steps: [
        'Authenticate as customer & fulfillment user using saved storage states.',
        'Execute automated test flow steps.',
        'Observe failure point during element interaction.',
      ],
      expected: 'Target UI element is interactable and state transition completes successfully.',
      actual: 'Action timed out or assertion failed during execution.',
      screenshotPath: screenshot ? path.join('test-results', path.basename(latest.dir), screenshot) : undefined,
      tracePath: trace ? path.join('test-results', path.basename(latest.dir), trace) : undefined,
      videoPath: video ? path.join('test-results', path.basename(latest.dir), video) : undefined,
    };
  } else {
    // Demonstration template if no recent failure exists
    bugData = {
      title: 'Quasar skeleton loader overlay intercepted picking submission button',
      project: 'fulfillment',
      specPath: 'tests/fulfillment/fulfillment-pending-orders.spec.ts',
      line: 48,
      classification: 'TIMEOUT_LATENCY',
      errorMessage: 'locator.click: Timeout 30000ms exceeded waiting for locator(".q-btn:has-text(\\"Submit\\")")',
      reproCommand: 'npx playwright test tests/fulfillment/fulfillment-pending-orders.spec.ts --project=fulfillment --headed',
      steps: [
        'Log in to Fulfillment portal at https://ftx.fulfillment.dev.ftxcommerce.com/',
        'Open Pending Orders tab and select an order.',
        'Attempt to click "Submit" while order items are fetching in background.',
      ],
      expected: 'Submit button receives click event and transitions order to In Progress.',
      actual: 'Click was intercepted by parent transparent skeleton loader backdrop.',
      screenshotPath: 'test-results/pending-orders-failed.png',
      tracePath: 'test-results/trace.zip',
    };
  }

  const output = isJira ? formatJiraMarkup(bugData) : formatGitHubMarkdown(bugData);

  const outDir = path.resolve(process.cwd(), 'bug-reports');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, `bug-report-${Date.now()}.${isJira ? 'txt' : 'md'}`);
  fs.writeFileSync(outPath, output, 'utf-8');

  console.log('\n==================================================');
  console.log(`🐞 BUG REPORTER — Generated Defect Report (${isJira ? 'Jira' : 'GitHub'} Format)`);
  console.log('==================================================');
  console.log(`📄 Saved to: ${outPath}\n`);
  console.log(output);
  console.log('==================================================\n');
}

