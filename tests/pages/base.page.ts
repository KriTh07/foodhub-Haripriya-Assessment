import { Page, Locator, expect } from '@playwright/test'
import config from '../../test-config/test.config'

export abstract class BasePage {
  protected page: Page
  protected baseUrl: string

  constructor(page: Page) {
    this.page = page
    this.baseUrl = config.baseUrl
  }

  /**
   * Navigate to a specific path
   */
  async navigate(path: string = '/'): Promise<void> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`
    await this.page.goto(url, { waitUntil: 'domcontentloaded' })
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId)
  }

  /**
   * Get element by role
   */
  getByRole(role: any, options?: any): Locator {
    return this.page.getByRole(role, options)
  }

  /**
   * Get element by text
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text)
  }

  /**
   * Click element
   */
  async click(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector
    await locator.click()
  }

  /**
   * Fill input field
   */
  async fill(selector: string | Locator, value: string): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector
    await locator.fill(value)
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(selector: string | Locator, timeout?: number): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector
    await locator.waitFor({ state: 'visible', timeout: timeout || config.defaultTimeout })
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(selector: string | Locator, timeout?: number): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector
    await locator.waitFor({ state: 'hidden', timeout: timeout || config.defaultTimeout })
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string | Locator): Promise<boolean> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector
    return await locator.isVisible()
  }

  /**
   * Get text content
   */
  async getText(selector: string | Locator): Promise<string> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector
    return (await locator.textContent()) || ''
  }

  /**
   * Wait for page load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded')
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    if (config.screenshots) {
      await this.page.screenshot({
        path: `test-results/screenshots/${name}-${Date.now()}.png`,
        fullPage: true
      })
    }
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector
    await locator.scrollIntoViewIfNeeded()
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url()
  }

  /**
   * Reload page
   */
  async reload(): Promise<void> {
    await this.page.reload()
  }

  /**
   * Go back
   */
  async goBack(): Promise<void> {
    await this.page.goBack()
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForURL('**/*')
  }
}
