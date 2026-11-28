const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests-v2',
  testMatch: '**/*.spec.cjs',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,

  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report-v2',
      open: 'never'
    }]
  ],

  use: {
    baseURL: process.env.NUTRIVN_WEB || 'http://localhost:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  // Start local Vite automatically unless an explicit test target is supplied.
  webServer: process.env.NUTRIVN_WEB ? undefined : {
    command: 'npm run dev -- --host localhost --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    timeout: 60000
  },

  outputDir: 'test-results-v2',

  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] }
  }]
});
