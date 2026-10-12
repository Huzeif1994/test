# playwright-huzeif

## Local
```bash
npm ci
npx playwright install
npm test
npm run report
```

## Docker
```bash
npm run docker:build
npm run docker:test          # reports ./playwright-report mein aayengi
# ya
docker build -t playwright-huzeif .
docker run --rm --ipc=host -e BASE_URL=https://ftx.dev.ftxcommerce.com playwright-huzeif
```
> Dockerfile ka image tag (`v1.64.0-noble`) `@playwright/test` ke version se match hona chahiye. Playwright upgrade karo to Dockerfile bhi update karo.

## CI/CD (GitHub Actions)
`.github/workflows/playwright.yml` — push/PR/manual/daily schedule par chalta hai:
- **test**: chromium, firefox, webkit parallel matrix
- **docker**: image build karke container ke andar tests
- Reports artifacts mein upload hoti hain (Actions tab → run → Artifacts)
