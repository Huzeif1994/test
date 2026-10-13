import { defineConfig } from 'allure';

export default defineConfig({
  name: 'FTX Playwright Report',
  output: './allure-report',
  // History: trends, flaky detection. CI mein ye file cache se restore/save hoti hai.
  historyPath: './allure-history.jsonl',
  historyLimit: 20,
});
