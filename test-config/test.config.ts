import * as dotenv from 'dotenv'
import * as path from 'path'

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

export interface TestConfig {
  // URLs
  baseUrl: string
  apiBaseUrl: string

  // Timeouts
  defaultTimeout: number
  navigationTimeout: number
  apiTimeout: number

  // Browser Configuration
  defaultBrowser: 'chromium' | 'firefox' | 'webkit'
  headless: boolean

  // Test Execution
  retries: number
  workers: number

  // Test Data
  testUser: {
    email: string
    name: string
    address: string
  }

  // Payment Test Cards
  paymentCards: {
    valid: string
    declined: string
    insufficientFunds: string
  }

  // Feature Flags
  screenshots: boolean
  video: boolean
  tracing: boolean

  // CI/CD
  isCI: boolean
}

const config: TestConfig = {
  // URLs
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',

  // Timeouts (in milliseconds)
  defaultTimeout: parseInt(process.env.TEST_TIMEOUT || '30000', 10),
  navigationTimeout: 30000,
  apiTimeout: 10000,

  // Browser Configuration
  defaultBrowser: (process.env.DEFAULT_BROWSER as 'chromium' | 'firefox' | 'webkit') || 'chromium',
  headless: process.env.HEADLESS === 'true',

  // Test Execution
  retries: parseInt(process.env.TEST_RETRIES || '2', 10),
  workers: parseInt(process.env.TEST_WORKERS || '4', 10),

  // Test Data
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'jane@example.com',
    name: process.env.TEST_USER_NAME || 'Jane Smith',
    address: '123 Main St, Mumbai, 400001'
  },

  // Payment Test Cards
  paymentCards: {
    valid: process.env.VALID_CARD || '4242424242424242',
    declined: process.env.DECLINED_CARD || '4000000000000002',
    insufficientFunds: process.env.INSUFFICIENT_FUNDS_CARD || '4000000000009995'
  },

  // Feature Flags
  screenshots: process.env.ENABLE_SCREENSHOTS !== 'false',
  video: process.env.ENABLE_VIDEO !== 'false',
  tracing: process.env.ENABLE_TRACING !== 'false',

  // CI/CD
  isCI: !!process.env.CI
}

export default config
