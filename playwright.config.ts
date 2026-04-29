import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
const testTimeout = parseInt(process.env.TEST_TIMEOUT || '30000', 10)
const retries = parseInt(process.env.TEST_RETRIES || '2', 10)
const workers = parseInt(process.env.TEST_WORKERS || '4', 10)
const headless = process.env.HEADLESS === 'true'
const enableScreenshots = process.env.ENABLE_SCREENSHOTS !== 'false'
const enableVideo = process.env.ENABLE_VIDEO !== 'false'
const enableTracing = process.env.ENABLE_TRACING !== 'false'
const defaultBrowser = process.env.DEFAULT_BROWSER || 'chromium'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? retries : 0,
  workers: process.env.CI ? 1 : workers,
  timeout: testTimeout,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results/e2e', detail: true }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  use: {
    baseURL: baseUrl,
    headless: headless,
    actionTimeout: testTimeout,
    navigationTimeout: testTimeout,

    // Tracing: capture on first retry or always if enabled
    trace: enableTracing ? (process.env.CI ? 'on-first-retry' : 'on') : 'off',

    // Screenshots: configurable via env
    screenshot: enableScreenshots ? 'only-on-failure' : 'off',

    // Video: configurable via env
    video: enableVideo ? 'retain-on-failure' : 'off'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] }
    }
  ].filter(project => {
    // Filter projects based on DEFAULT_BROWSER env var
    if (process.env.DEFAULT_BROWSER) {
      return project.name === process.env.DEFAULT_BROWSER
    }
    return true
  }),

  webServer: {
    command: 'npm run dev',
    url: baseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
})
