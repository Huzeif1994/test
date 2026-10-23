# 🐞 Automated SDET Bug Report Guide & Standard

When a Playwright test fails and the failure is determined to be an **actual product bug** (rather than test script flakiness), the agent must format the bug report following this exact schema.

---

## 📋 Markdown Schema (GitHub / GitLab / Slack)

```markdown
### 🐞 [BUG][<MODULE>] <Concise summary of failure>

- **Severity:** Blocker / Critical / Major / Minor
- **Classification:** `APPLICATION_BUG` | `LOCATOR_DRIFT` | `TIMEOUT_LATENCY`
- **Spec File:** `tests/<path-to-test>.spec.ts:<line>`
- **Environment:** Dev (`https://ftx.dev.ftxcommerce.com`)

---

#### 🔁 Quick CLI Reproduction Command
\`\`\`bash
npx playwright test <path-to-test>.spec.ts --project=<project> --headed
\`\`\`

---

#### 📝 Steps to Reproduce
1. Log in with customer/fulfillment credentials.
2. Navigate to `<URL>`.
3. Perform `<Action>`.

---

#### ❌ Expected vs. Actual
- **Expected:** Element `<Name>` updates state to `<State>`.
- **Actual:** Request returned status 500 / Element was not found within 30s timeout.

---

#### ⚠️ Stack Trace & Call Log
\`\`\`text
<Paste sanitized Playwright error message and locator call log>
\`\`\`

---

#### 📸 Attached Forensics
- Screenshot: `test-results/<folder>/test-failed-1.png`
- Trace File: `test-results/<folder>/trace.zip`
```

---

## ⚡ CLI Command
To generate the report automatically from the latest failed run:
```bash
npm run report:bug          # GitHub Markdown
npm run report:bug -- --jira # Atlassian Jira format
```

