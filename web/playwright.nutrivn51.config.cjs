const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/e2e', testMatch: '**/nutrivn-51.spec.cjs',
  timeout: 45000, expect: { timeout: 10000 }, retries: 0,
  workers: 1,
  reporter: [['list'], ['html', {outputFolder: 'playwright-report', open: 'never'}], ['json', {outputFile: 'test-results/results.json'}]],
  use: { baseURL: process.env.NUTRIVN_WEB || 'http://localhost:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}]
});
