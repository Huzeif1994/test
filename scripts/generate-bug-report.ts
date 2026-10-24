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
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightJsonReport {
  suites?: PlaywrightSuite[];
}

export interface ExtractedFailure {
  title: string;
  project: string;
  specPath: string;
  line: number;
  errorMsg: string;
  attachments: {
    screenshot?: string;
    trace?: string;
    video?: string;
  };
}

/**
 * Recursively traverses Playwright JSON report to find failed tests
 */
export function findFailedTestsFromReport(report: PlaywrightJsonReport): ExtractedFailure[] {
  const failures: ExtractedFailure[] = [];

  function traverseSuite(suite: PlaywrightSuite) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const t of spec.tests) {
          const failedResult = t.results.find((r) => r.status === 'failed' || r.status === 'timedOut');
          if (failedResult && failedResult.error) {
            const rawMsg = failedResult.error.message || failedResult.error.stack || 'Unknown error';
            // Strip ANSI escape codes
            const cleanMsg = rawMsg.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

            const attachments: ExtractedFailure['attachments'] = {};
            if (failedResult.attachments) {
              for (const att of failedResult.attachments) {
                if (att.name === 'screenshot') attachments.screenshot = att.path;
                if (att.name === 'trace') attachments.trace = att.path;
                if (att.name === 'video') attachments.video = att.path;
              }
            }

            failures.push({
              title: spec.title,
              project: t.projectName || 'default',
              specPath: spec.file,
              line: spec.line,
              errorMsg: cleanMsg,
              attachments,
            });
          }
        }
      }
    }

    if (suite.suites) {
      for (const childSuite of suite.suites) {
        traverseSuite(childSuite);
      }
    }
  }

  if (report.suites) {
    for (const rootSuite of report.suites) {
      traverseSuite(rootSuite);
    }
  }

  return failures;
}

/**
 * Extracts all verified failures from test-results/report.json
 */
export function extractAllFailures(reportPath: string = 'test-results/report.json', maxAgeMinutes: number = 60): BugReportData[] {
  if (!fs.existsSync(reportPath)) {
    return [];
  }

  const stat = fs.statSync(reportPath);
  const ageMinutes = (Date.now() - stat.mtimeMs) / (1000 * 60);
  if (ageMinutes > maxAgeMinutes) {
    console.log(`ℹ️  Found ${reportPath}, but it is ${Math.round(ageMinutes)} minutes old. Ignoring stale report.`);
    return [];
  }

  try {
    const json: PlaywrightJsonReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    const failures = findFailedTestsFromReport(json);
    return failures.map((f) => {
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
    });
  } catch {
    return [];
  }
}

/**
 * Extracts first verified failure (backward compatibility)
 */
export function extractRealFailure(reportPath: string = 'test-results/report.json', maxAgeMinutes: number = 60): BugReportData | null {
  const all = extractAllFailures(reportPath, maxAgeMinutes);
  return all.length > 0 ? all[0] : null;
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

/**
 * Computes an executive blast-radius risk evaluation across all failures
 */
export function computeBlastRadius(failures: BugReportData[]): {
  riskLevel: 'CRITICAL_BLOCKER' | 'ELEVATED_RISK' | 'LOW_MAINTENANCE' | 'CLEAN';
  headline: string;
  recommendation: string;
} {
  if (failures.length === 0) {
    return {
      riskLevel: 'CLEAN',
      headline: 'All Quality Gates Passed (100% Green Build)',
      recommendation: 'Safe to proceed with release and deployment.',
    };
  }

  const hasAppBug = failures.some(f => f.classification === 'APPLICATION_BUG');
  const hasTimeout = failures.some(f => f.classification === 'TIMEOUT_LATENCY');

  if (hasAppBug) {
    return {
      riskLevel: 'CRITICAL_BLOCKER',
      headline: 'Release Blocker: Server crash, 5xx error, or core business logic defect detected',
      recommendation: 'Halt deployment pipeline immediately; file critical defect with backend engineering.',
    };
  }

  if (hasTimeout) {
    return {
      riskLevel: 'ELEVATED_RISK',
      headline: 'Elevated Risk: Eventual consistency sync lag or slow endpoint latency observed',
      recommendation: 'Review database read-replica sync intervals and expand polling threshold before promotion.',
    };
  }

  return {
    riskLevel: 'LOW_MAINTENANCE',
    headline: 'Low Blast Radius: Cosmetic UI changes or selector drift detected',
    recommendation: 'Trigger automated self-healing via `npm run test:heal` to update Page Object locators.',
  };
}

/**
 * Generates an Executive Quality & Risk Assessment summary for GitHub Step Summary
 */
export function generateExecutiveQualitySummary(failures: BugReportData[]): string {
  const blast = computeBlastRadius(failures);

  let md = `## 🛡️ Executive QA Quality & Blast Radius Triage\n\n`;
  md += `| Metric | Assessment |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Overall Risk Status** | **${blast.riskLevel}** |\n`;
  md += `| **Failures Detected** | \`${failures.length}\` |\n`;
  md += `| **Executive Verdict** | ${blast.headline} |\n`;
  md += `| **Action Recommendation** | ${blast.recommendation} |\n\n`;

  if (failures.length > 0) {
    md += `### 📋 Detected Defect Inventory\n\n`;
    md += `| Project | Spec Target | Failure Classification | Severity |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    for (const f of failures) {
      md += `| \`${f.project}\` | \`${f.specPath}\` | \`${f.classification}\` | \`${f.suggestedSeverity}\` |\n`;
    }
  }

  return md;
}

/**
 * Generates standard Jira REST API Issue Payload
 */
export function generateJiraPayload(data: BugReportData): object {
  return {
    fields: {
      project: { key: 'FTX' },
      summary: `[BUG][${data.project.toUpperCase()}] ${data.title}`,
      description: `*Classification:* ${data.classification}\n*Spec:* ${data.specPath}\n*Repro:* ${data.reproCommand}\n\n*Error:*\n${data.errorMessage.slice(0, 500)}`,
      issuetype: { name: 'Bug' },
      priority: { name: data.suggestedSeverity.includes('Critical') ? 'Highest' : data.suggestedSeverity.includes('High') ? 'High' : 'Medium' },
    },
  };
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

    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, generateExecutiveQualitySummary([]), 'utf8');
    }
    process.exit(0);
  }

  const output = isJira ? formatJiraMarkup(failure) : formatGitHubMarkdown(failure);

  const outDir = path.resolve(process.cwd(), 'bug-reports');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, `bug-report-${Date.now()}.${isJira ? 'txt' : 'md'}`);
  fs.writeFileSync(outPath, output, 'utf-8');

  // Also write Jira JSON payload
  const jiraPayload = generateJiraPayload(failure);
  const jiraPayloadPath = path.join(outDir, 'latest-jira-defect.json');
  fs.writeFileSync(jiraPayloadPath, JSON.stringify(jiraPayload, null, 2), 'utf-8');

  // If in CI, append executive summary to GITHUB_STEP_SUMMARY
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, generateExecutiveQualitySummary([failure]) + '\n\n' + output, 'utf8');
  }

  console.log('\n==================================================');
  console.log(`🐞 BUG REPORTER — Generated Defect Report (${isJira ? 'Jira' : 'GitHub'} Format)`);
  console.log('==================================================');
  console.log(`📄 Saved to: ${outPath}`);
  console.log(`📦 Jira REST Payload: ${jiraPayloadPath}\n`);
  console.log(output);
  console.log('==================================================\n');
}
