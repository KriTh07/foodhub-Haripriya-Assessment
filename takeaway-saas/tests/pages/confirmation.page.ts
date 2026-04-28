import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class ConfirmationPage extends BasePage {
  // Locators
  private readonly confirmationPageLocator: Locator
  private readonly confirmationTitleLocator: Locator
  private readonly orderIdLocator: Locator
  private readonly transactionIdLocator: Locator
  private readonly confirmedTotalLocator: Locator
  private readonly orderAgainButtonLocator: Locator

  constructor(page: Page) {
    super(page)
    this.confirmationPageLocator = this.getByTestId('confirmation-page')
    this.confirmationTitleLocator = this.getByTestId('confirmation-title')
    this.orderIdLocator = this.getByTestId('order-id')
    this.transactionIdLocator = this.getByTestId('transaction-id')
    this.confirmedTotalLocator = this.getByTestId('confirmed-total')
    this.orderAgainButtonLocator = this.getByTestId('order-again-btn')
  }

  /**
   * Check if confirmation page is visible
   */
  async isConfirmationPageVisible(): Promise<boolean> {
    return await this.isVisible(this.confirmationPageLocator)
  }

  /**
   * Wait for confirmation page
   */
  async waitForConfirmation(timeout: number = 10000): Promise<void> {
    await this.waitForVisible(this.confirmationPageLocator, timeout)
  }

  /**
   * Get confirmation title
   */
  async getConfirmationTitle(): Promise<string> {
    return await this.getText(this.confirmationTitleLocator)
  }

  /**
   * Get order ID
   */
  async getOrderId(): Promise<string> {
    return await this.getText(this.orderIdLocator)
  }

  /**
   * Get transaction ID
   */
  async getTransactionId(): Promise<string> {
    return await this.getText(this.transactionIdLocator)
  }

  /**
   * Get confirmed total
   */
  async getConfirmedTotal(): Promise<string> {
    return await this.getText(this.confirmedTotalLocator)
  }

  /**
   * Click order again button
   */
  async orderAgain(): Promise<void> {
    await this.orderAgainButtonLocator.click()
  }

  /**
   * Verify order ID format
   */
  async verifyOrderIdFormat(): Promise<boolean> {
    const orderId = await this.getOrderId()
    return orderId.includes('ORD-')
  }

  /**
   * Verify transaction ID format
   */
  async verifyTransactionIdFormat(): Promise<boolean> {
    const transactionId = await this.getTransactionId()
    return transactionId.includes('TXN-')
  }

  /**
   * Parse price from text
   */
  parsePrice(text: string): number {
    return parseFloat(text.replace(/[^0-9.]/g, ''))
  }
}
