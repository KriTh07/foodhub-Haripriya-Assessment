import { Browser, BrowserContext, chromium, firefox, webkit, Page } from '@playwright/test'
import config from '../../test-config/test.config'

export type BrowserType = 'chromium' | 'firefox' | 'webkit'

export class DriverFactory {
  private static browsers: Map<BrowserType, Browser> = new Map()
  private static contexts: Map<string, BrowserContext> = new Map()

  /**
   * Launch a browser instance
   */
  static async launchBrowser(browserType: BrowserType = config.defaultBrowser): Promise<Browser> {
    if (this.browsers.has(browserType)) {
      return this.browsers.get(browserType)!
    }

    let browser: Browser

    const launchOptions = {
      headless: config.headless,
      slowMo: config.isCI ? 0 : 50,
      timeout: config.defaultTimeout
    }

    switch (browserType) {
      case 'chromium':
        browser = await chromium.launch(launchOptions)
        break
      case 'firefox':
        browser = await firefox.launch(launchOptions)
        break
      case 'webkit':
        browser = await webkit.launch(launchOptions)
        break
      default:
        throw new Error(`Unsupported browser type: ${browserType}`)
    }

    this.browsers.set(browserType, browser)
    return browser
  }

  /**
   * Create a new browser context with default settings
   */
  static async createContext(
    browser: Browser,
    contextId: string = 'default',
    options: any = {}
  ): Promise<BrowserContext> {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: config.video ? { dir: 'test-results/videos' } : undefined,
      ...options
    })

    // Enable tracing if configured
    if (config.tracing) {
      await context.tracing.start({ screenshots: true, snapshots: true })
    }

    this.contexts.set(contextId, context)
    return context
  }

  /**
   * Create a new page in the given context
   */
  static async createPage(context: BrowserContext): Promise<Page> {
    const page = await context.newPage()
    
    // Set default timeout
    page.setDefaultTimeout(config.defaultTimeout)
    page.setDefaultNavigationTimeout(config.navigationTimeout)

    // Take screenshot on failure
    if (config.screenshots) {
      page.on('pageerror', async (error) => {
        await page.screenshot({ 
          path: `test-results/screenshots/error-${Date.now()}.png`,
          fullPage: true 
        })
      })
    }

    return page
  }

  /**
   * Navigate to a URL relative to base URL
   */
  static async navigateTo(page: Page, path: string = '/'): Promise<void> {
    const url = path.startsWith('http') ? path : `${config.baseUrl}${path}`
    await page.goto(url, { waitUntil: 'domcontentloaded' })
  }

  /**
   * Get context by ID
   */
  static getContext(contextId: string): BrowserContext | undefined {
    return this.contexts.get(contextId)
  }

  /**
   * Close a specific context
   */
  static async closeContext(contextId: string): Promise<void> {
    const context = this.contexts.get(contextId)
    if (context) {
      if (config.tracing) {
        await context.tracing.stop({ path: `test-results/traces/${contextId}-trace.zip` })
      }
      await context.close()
      this.contexts.delete(contextId)
    }
  }

  /**
   * Close a specific browser
   */
  static async closeBrowser(browserType: BrowserType): Promise<void> {
    const browser = this.browsers.get(browserType)
    if (browser) {
      await browser.close()
      this.browsers.delete(browserType)
    }
  }

  /**
   * Close all browsers and contexts
   */
  static async closeAll(): Promise<void> {
    // Close all contexts
    for (const [contextId] of this.contexts) {
      await this.closeContext(contextId)
    }

    // Close all browsers
    for (const [browserType] of this.browsers) {
      await this.closeBrowser(browserType)
    }
  }

  /**
   * Take screenshot
   */
  static async takeScreenshot(page: Page, name: string): Promise<void> {
    if (config.screenshots) {
      await page.screenshot({
        path: `test-results/screenshots/${name}-${Date.now()}.png`,
        fullPage: true
      })
    }
  }
}
