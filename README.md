# playwright-huzeif

Playwright automated testing framework with TypeScript, Multi-App Support, Docker, Allure Reporting, and GitHub Actions CI/CD.

## Applications Covered

This framework supports 3 independent applications across multiple environments (**Dev** & **Staging**):

1. **Online Ordering**: Customer storefront (`https://ftx.dev.ftxcommerce.com` / `https://ftx.staging.ftxcommerce.com`)
2. **Admin Portal**: Merchant administration (`https://ftx.admin.dev.ftxcommerce.com/` / `https://ftx.admin.staging.ftxcommerce.com/`)
3. **Fulfillment App**: Operations & dispatch (`https://ftx.fulfillment.dev.ftxcommerce.com/` / `https://ftx.fulfillment.staging.ftxcommerce.com/`)

---

## Quick Start (Local Setup)

> **Important**: Open the `playwright-huzeif` directory directly as your workspace root in VS Code.

```bash
# 1. Dependencies install karo
npm ci

# 2. Playwright browser install karo
npx playwright install chromium

# 3. .env file create karo (.env.example se copy karke credentials configure karein)
cp .env.example .env

# 4. TypeScript typecheck karo
npm run typecheck

# 5. Saare apps ke tests run karo (Default: Dev environment)
npm test
```

---

## Running Tests by Application

Aap specific app ke tests alag se run kar sakte hain:

```bash
# 1. Online Ordering app
npm run test:ordering

# 2. Admin Portal
npm run test:admin

# 3. Fulfillment App
npm run test:fulfillment

# Headed mode (Browser UI visible)
npm run test:headed

# Playwright interactive UI mode
npm run test:ui

# Playwright HTML report view karo
npm run report
```

---

## Environment Switching (Dev vs Staging)

Environment switch karne ke liye `.env` file mein `TEST_ENV` change karein ya command line se pass karein:

```bash
# Staging environment par sabhi tests run karo
TEST_ENV=staging npx playwright test

# Staging par sirf Admin tests run karo
TEST_ENV=staging npm run test:admin

# Dev environment par run karo
TEST_ENV=dev npm test
```

Credentials aur URLs `config/environment.ts` ke through automatically Dev ya Staging ke hisaab se load hote hain.

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
```

---

## CI/CD (GitHub Actions)

`.github/workflows/playwright.yml`:
- **Triggers**: Push on `main`/`master`, Pull Requests, Daily Schedule (12:15 PM IST / 06:45 UTC), aur Manual Dispatch.
- **Jobs**:
  1. `test`: **3 Apps Parallel Matrix** (`ordering`, `admin`, `fulfillment`).
  2. `allure-report`: Teeno apps ke results combine karke single Allure report create hoti hai.
  3. `deploy-report`: `main` branch ke runs ke liye GitHub Pages par live report publish hoti hai (`https://<username>.github.io/<repo>/`).
  4. `docker`: Container build aur smoke test verification.
  5. `notify`: Test execution outcome aur Allure report ka link directly Outlook email par dispatch hota hai (`huzeif.shaikh@ftxinfotech.com`).

### Outlook Email Setup (GitHub Secrets)
GitHub Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
- `MAIL_USERNAME`: Sender email address (e.g. `huzeif.shaikh@ftxinfotech.com`)
- `MAIL_PASSWORD`: Outlook / Microsoft 365 Password ya App Password

