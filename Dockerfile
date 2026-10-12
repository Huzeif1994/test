# Image version package-lock.json wale @playwright/test se match honi chahiye
FROM mcr.microsoft.com/playwright:v1.64.0-noble

WORKDIR /app

# Pehle sirf package files copy karo (Docker layer caching ke liye)
COPY package.json package-lock.json ./
RUN npm ci

# Phir baaki code
COPY . .

ENV CI=true

# Default: saare tests chalao (override kar sakte ho: docker run ... npx playwright test --project=chromium)
CMD ["npx", "playwright", "test"]
