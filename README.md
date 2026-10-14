# playwright-huzeif

Playwright automated testing framework with TypeScript, Docker, Allure Reporting, and GitHub Actions CI/CD.

## Quick Start (Local Setup)

> **Important**: Open the `playwright-huzeif` directory directly as your workspace root in VS Code.

```bash
# Dependencies install karo
npm ci

# Playwright browsers download karo
npx playwright install

# TypeScript typecheck
npm run typecheck

# Tests run karo
npm test

# Playwright HTML report dekho
npm run report
```

### Additional Test Runners
- `npm run test:chromium` - Sirf Chromium par tests chalao
- `npm run test:headed` - Headed mode (browser UI open karke) test chalao
- `npm run test:ui` - Playwright Interactive UI Mode

---

## Allure Reporting

Tests run hone par raw results `allure-results/` mein save hote hain.

```bash
# Report generate karo
npm run allure:generate

# Generated report browser mein open karo
npm run allure:open

# Direct results se local dev server chalao
npm run allure:serve

# Results aur report cache clean karo
npm run allure:clean
```

---

## Docker Execution

```bash
# Image build karo
npm run docker:build

# Tests run karo container mein (reports host machine par sync hongi)
npm run docker:test

# Docker test chala kar Allure report auto open karo
npm run docker:allure

# Custom Base URL ke sath Docker run
docker run --rm --ipc=host -e BASE_URL=https://ftx.dev.ftxcommerce.com playwright-huzeif:latest
```

> **Note**: `Dockerfile` ka image tag (`v1.64.0-noble`) aur `package.json` ka `@playwright/test` version hamesha match hone chahiye.

---

## Environment Variables

- `BASE_URL`: Target environment URL (Default: `https://ftx.dev.ftxcommerce.com`).
  ```bash
  BASE_URL=https://staging.ftxcommerce.com npm test
  ```

---

## CI/CD (GitHub Actions)

`.github/workflows/playwright.yml`:
- **Triggers**: Push on `main`/`master`, Pull Requests, Daily Schedule (12:15 PM IST / 06:45 UTC), aur Manual Dispatch.
- **Jobs**:
  1. `test`: Chromium, Firefox, WebKit par parallel matrix run.
  2. `allure-report`: Saare browser results jodkar unified Allure report create hoti hai.
  3. `deploy-report`: `main` branch ke runs ke liye GitHub Pages par live report publish hoti hai (`https://<username>.github.io/<repo>/`).
  4. `docker`: Container build aur smoke test verification.

