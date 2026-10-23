import fs from 'fs';
import path from 'path';

export interface BugReportData {
  title: string;
  project: string;
  specPath: string;
  line?: number;
  classification: 'APPLICATION_BUG' | 'LOCATOR_DRIFT' | 'TIMEOUT_LATENCY' | 'ENVIRONMENT_ISSUE';
  suggestedSeverity: 'Critical (Suggested)' | 'High (Suggested)' | 'Medium (Suggested)' | 'Low (Suggested)';
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
export function classifyError(errorMsg: string): {
  classification: BugReportData['classification'];
  suggestedSeverity: BugReportData['suggestedSeverity'];
} {
  const lower = (errorMsg || '').toLowerCase();
  if (lower.includes('500 internal') || lower.includes('crash') || lower.includes('502 bad gateway') || lower.includes('failed to fetch')) {
    return { classification: 'APPLICATION_BUG', suggestedSeverity: 'High (Suggested)' };
  }
  if (lower.includes('strict mode violation') || lower.includes('resolved to') || lower.includes('not visible') || lower.includes('detached')) {
    return { classification: 'LOCATOR_DRIFT', suggestedSeverity: 'Medium (Suggested)' };
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return { classification: 'TIMEOUT_LATENCY', suggestedSeverity: 'Medium (Suggested)' };
  }
  return { classification: 'ENVIRONMENT_ISSUE', suggestedSeverity: 'Low (Suggested)' };
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

export interface PlaywrightJsonReport {
  suites?: PlaywrightSuite[];
  errors?: any[];
}

/**
 * Recursively parses Playwright suites in report.json to find verified failed tests
 */
export function findFailedTestsFromReport(report: PlaywrightJsonReport): Array<{
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
 * Extracts confirmed bug data strictly from verified execution metadata of the current run session.
 * Prevents stale artifacts from previous days or unverified folders from generating false defects.
 */
export function extractRealFailure(options: { maxAgeMinutes?: number; reportPath?: string } = {}): BugReportData | null {
  const maxAgeMinutes = options.maxAgeMinutes ?? 60;
  const reportPath = options.reportPath || path.resolve(process.cwd(), 'test-results/report.json');

  if (!fs.existsSync(reportPath)) {
    return null;
  }

  // Verify artifact freshness (must be from the active execution session)
  const stat = fs.statSync(reportPath);
  const ageMinutes = (Date.now() - stat.mtimeMs) / (1000 * 60);
  if (ageMinutes > maxAgeMinutes) {
    console.log(`ℹ️  Found ${reportPath}, but it is ${Math.round(ageMinutes)} minutes old (exceeds session threshold of ${maxAgeMinutes}m).`);
    console.log(`   Ignoring stale report to prevent obsolete defect filing.`);
    return null;
  }

  try {
    const json: PlaywrightJsonReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    const failures = findFailedTestsFromReport(json);
    if (failures.length > 0) {
      const f = failures[0];
      const { classification, suggestedSeverity } = classifyError(f.errorMsg);
      return {
        title: f.title,
        project: f.project,
        specPath: f.specPath,
        line: f.line,
        classification,
        suggestedSeverity,
        errorMessage: f.errorMsg,
        reproCommand: `npx playwright test ${f.specPath}${f.line ? ':' + f.line : ''} --project=${f.project} --headed`,
        steps: [
          `Initialize pre-authenticated session for ${f.project}.`,
          `Execute test scenario defined in ${f.specPath}.`,
          `Assertion failure or timeout occurred at line ${f.line}.`,
        ],
        expected: 'Test assertions pass and target UI interaction completes without error.',
        actual: f.errorMsg.split('\n')[0] || 'Assertion failure or execution timeout.',
        screenshotPath: f.attachments.screenshot,
        tracePath: f.attachments.trace,
        videoPath: f.attachments.video,
      };
    }
  } catch {
    // Malformed report
  }

  return null;
}

/**
 * Generates GitHub-flavored Markdown
 */
export function formatGitHubMarkdown(data: BugReportData): string {
  return `### 🐞 [BUG][${data.project.toUpperCase()}] ${data.title}

- **Severity (Untriaged):** \`${data.suggestedSeverity}\`
- **Classification:** \`${data.classification}\`
- **Spec:** \`${data.specPath}${data.line ? ':' + data.line : ''}\`
- **Environment:** Dev (\`ftx.dev.ftxcommerce.com\`)
- **Reported By:** Automated SDET Bug Reporter (Verified Current Session Metadata)

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

* *Severity (Untriaged):* {{${data.suggestedSeverity}}}
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
    console.log('✅ SDET BUG REPORTER — Execution Status');
    console.log('==================================================');
    console.log('No verified failures detected in the active test execution session.');
    console.log('Zero false-positive reports generated from stale artifacts.');
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
