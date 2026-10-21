# Project Playwright Automation Guidelines & Skills

## Mounted AI Skills
This project integrates **TestDino Playwright Skill** (`.agents/skills/playwright-skill/SKILL.md`):
- For any locator strategies, consult `.agents/skills/playwright-skill/core/locators.md`
- For assertions and waiting, consult `.agents/skills/playwright-skill/core/assertions-and-waiting.md`
- For Page Object Model & Drawers, consult `.agents/skills/playwright-skill/pom/page-object-model.md`
- For auth setup & session reuse, consult `.agents/skills/playwright-skill/core/authentication.md`
- For CI/CD & Docker, consult `.agents/skills/playwright-skill/ci/docker-and-containers.md`

## 10 Golden Rules (TestDino Standard)
1. **User-Facing Locators**: Prefer `getByRole()`, `getByLabel()`, `getByText()` over fragile CSS or XPath.
2. **Never arbitrary sleep**: Avoid `page.waitForTimeout()`; use web-first assertions (`expect(locator).toBeVisible()`).
3. **Web-first assertions**: Always assert locators directly (`await expect(locator).toBeVisible()`), never raw JS values.
4. **Isolate every test**: Independent tests without execution-order coupling.
5. **BaseURL in config**: Zero hardcoded domain URLs in test specs.
6. **Retries**: `2` in CI, `0` locally to catch flakiness immediately.
7. **Traces**: `'on-first-retry'` for lightweight, actionable failure debugging.
8. **Fixtures over globals**: Share state and page objects via `test.extend()` fixtures (`fixtures/pages.ts`).
9. **Single responsibility**: Test one user workflow or behavior per test case.
10. **External services**: Mock only 3rd-party dependencies (payment gateways, external SMS/email), never internal backend APIs.

## Project-Specific Constraints
- **Sequential Execution**: Maintain `workers: 1` to prevent dev server throttling.
- **Visual Pause**: Retain a 2-second visual pause on `expectLoggedIn()` so headed test execution is clearly observable.
- **Maximized Viewport**: Keep `viewport: null` and `--start-maximized` in `playwright.config.ts`.
