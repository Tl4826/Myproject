
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests-quality',
  testMatch: '**/*.spec.cjs',
  timeout: 30000,
  expect: { timeout: 10000 },

  fullyParallel: false,
  workers: 1,
  retries: 0,

  reporter: [['list']],

  outputDir: './test-results-quality',

  use: {
    baseURL: process.env.NUTRIVN_WEB || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
