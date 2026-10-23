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
 * Classifies failure root cause based on error message patterns
 */
export function classifyError(errorMsg: string): BugReportData['classification'] {
  const lower = (errorMsg || '').toLowerCase();
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

interface PlaywrightTestResult {
  status: string;
  error?: {
    message?: string;
    stack?: string;
  };
  attachments?: Array<{
    name: string;
    contentType: string;
    path?: string;
  }>;
}

interface PlaywrightTest {
  title: string;
  projectName?: string;
  results: PlaywrightTestResult[];
}

interface PlaywrightSpec {
  title: string;
  file: string;
  line: number;
  tests: PlaywrightTest[];
}

interface PlaywrightSuite {
  title: string;
  file?: string;
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightJsonReport {
  suites?: PlaywrightSuite[];
  errors?: any[];
}

/**
 * Recursively parses Playwright suites in report.json to find genuine failed tests
 */
function findFailedTestsFromReport(report: PlaywrightJsonReport): Array<{
  title: string;
  specPath: string;
  line: number;
  project: string;
  errorMsg: string;
  attachments: { screenshot?: string; trace?: string; video?: string };
}> {
  const failed: Array<{
    title: string;
    specPath: string;
    line: number;
    project: string;
    errorMsg: string;
    attachments: { screenshot?: string; trace?: string; video?: string };
  }> = [];

  function traverseSuite(suite: PlaywrightSuite, currentFile?: string) {
    const file = suite.file || currentFile || '';
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          for (const res of test.results) {
            if (res.status === 'unexpected' || res.status === 'timedOut' || res.status === 'failed') {
              const attachments = {
                screenshot: res.attachments?.find(a => a.contentType.includes('image') || a.name === 'screenshot')?.path,
                trace: res.attachments?.find(a => a.name === 'trace' || (a.path && a.path.endsWith('.zip')))?.path,
                video: res.attachments?.find(a => a.contentType.includes('video') || (a.path && a.path.endsWith('.webm')))?.path,
              };

              failed.push({
                title: `${spec.title} › ${test.title}`,
                specPath: spec.file || file,
                line: spec.line,
                project: test.projectName || 'default',
                errorMsg: res.error?.stack || res.error?.message || 'Unknown test failure',
                attachments,
              });
            }
          }
        }
      }
    }

    if (suite.suites) {
      for (const child of suite.suites) {
        traverseSuite(child, file);
      }
    }
  }

  if (report.suites) {
    for (const suite of report.suites) {
      traverseSuite(suite);
    }
  }

  return failed;
}

/**
 * Scans test-results directories for actual failed artifacts (ending in -failed or -retry)
 */
export function findLatestFailedDirectory(): { dir: string; name: string; files: string[] } | null {
  const resultsDir = path.resolve(process.cwd(), 'test-results');
  if (!fs.existsSync(resultsDir)) return null;

  const entries = fs.readdirSync(resultsDir, { withFileTypes: true });
  const failedDirs = entries
    .filter(e => e.isDirectory() && (e.name.endsWith('-failed') || e.name.includes('-retry')))
    .map(e => ({
      name: e.name,
      dir: path.join(resultsDir, e.name),
      stats: fs.statSync(path.join(resultsDir, e.name)),
      files: fs.readdirSync(path.join(resultsDir, e.name)),
    }))
    .sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);

  return failedDirs[0] || null;
}

/**
 * Extracts confirmed bug data from real Playwright execution artifacts
 */
export function extractRealFailure(): BugReportData | null {
  // 1. Try parsing structured JSON report if generated
  const reportPath = path.resolve(process.cwd(), 'test-results/report.json');
  if (fs.existsSync(reportPath)) {
    try {
      const json: PlaywrightJsonReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      const failures = findFailedTestsFromReport(json);
      if (failures.length > 0) {
        const f = failures[0];
        const classification = classifyError(f.errorMsg);
        return {
          title: f.title,
          project: f.project,
          specPath: f.specPath,
          line: f.line,
          classification,
          errorMessage: f.errorMsg,
          reproCommand: `npx playwright test ${f.specPath}${f.line ? ':' + f.line : ''} --project=${f.project} --headed`,
          steps: [
            `Initialize session and authentication for ${f.project}.`,
            `Execute test scenario defined in ${f.specPath}.`,
            `Failure encountered at line ${f.line}.`,
          ],
          expected: 'Test assertions pass and target UI interaction completes without error.',
          actual: f.errorMsg.split('\n')[0] || 'Assertion failure or execution timeout.',
          screenshotPath: f.attachments.screenshot,
          tracePath: f.attachments.trace,
          videoPath: f.attachments.video,
        };
      }
    } catch {
      // Fallback to directory inspection if JSON parse fails
    }
  }

  // 2. Fallback: inspect verified failed directories
  const failedDir = findLatestFailedDirectory();
  if (failedDir) {
    const screenshot = failedDir.files.find(f => f.endsWith('.png'));
    const trace = failedDir.files.find(f => f.endsWith('.zip'));
    const video = failedDir.files.find(f => f.endsWith('.webm'));
    const errorSnippet = `Automated execution failed in artifact folder: ${failedDir.name}`;

    return {
      title: `Execution failure in ${failedDir.name}`,
      project: failedDir.name.includes('ordering') ? 'ordering' : failedDir.name.includes('admin') ? 'admin' : failedDir.name.includes('e2e') ? 'e2e-bridge' : 'fulfillment',
      specPath: 'Identified from test-results artifact',
      classification: classifyError(errorSnippet),
      errorMessage: errorSnippet,
      reproCommand: `npx playwright test --project=${failedDir.name.includes('e2e') ? 'e2e-bridge' : 'fulfillment'} --headed`,
      steps: [
        'Review attached trace and screenshot artifacts to reproduce failed steps.',
      ],
      expected: 'Test action succeeds without exceeding timeout threshold.',
      actual: 'Execution generated failure artifacts in test-results directory.',
      screenshotPath: screenshot ? path.join('test-results', failedDir.name, screenshot) : undefined,
      tracePath: trace ? path.join('test-results', failedDir.name, trace) : undefined,
      videoPath: video ? path.join('test-results', failedDir.name, video) : undefined,
    };
  }

  return null;
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
- **Reported By:** Automated SDET Bug Reporter (Playwright Real Run Metadata)

---

#### 🔁 Reproduction Command
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

h3. 🔁 Reproduction Command
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

  const failure = extractRealFailure();

  if (!failure) {
    console.log('\n==================================================');
    console.log('✅ SDET BUG REPORTER — Clean Execution Summary');
    console.log('==================================================');
    console.log('No failed tests detected in test-results or report.json.');
    console.log('All tests passed or no execution failures were recorded.');
    console.log('Zero false-positive defect reports were generated.');
    console.log('==================================================\n');
    process.exit(0);
  }

  const output = isJira ? formatJiraMarkup(failure) : formatGitHubMarkdown(failure);

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
