const { defineConfig } = require('@playwright/test');
const base = require('./playwright.v2.config.cjs');

module.exports = defineConfig({
  ...base,
  testDir: './tests-security',
  testMatch: '**/*.spec.cjs',
  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report-security',
      open: 'never'
    }]
  ],
  outputDir: 'test-results-security',
  use: {
    ...base.use,
    baseURL: process.env.NUTRIVN_WEB || 'http://localhost:5174'
  }
});
