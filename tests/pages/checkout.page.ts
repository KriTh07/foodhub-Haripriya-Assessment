import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'
import config from '../../test-config/test.config'

export class CheckoutPage extends BasePage {
  // Locators
  private readonly checkoutPageLocator: Locator
  private readonly checkoutTotalLocator: Locator
  private readonly placeOrderButtonLocator: Locator
  private readonly backToCartLocator: Locator
  private readonly paymentErrorLocator: Locator

  // Delivery form fields
  private readonly nameInputLocator: Locator
  private readonly emailInputLocator: Locator
  private readonly addressInputLocator: Locator

  // Payment form fields
  private readonly cardNumberInputLocator: Locator
  private readonly cardholderInputLocator: Locator
  private readonly expiryInputLocator: Locator
  private readonly cvvInputLocator: Locator

  // Error fields
  private readonly nameErrorLocator: Locator
  private readonly emailErrorLocator: Locator
  private readonly addressErrorLocator: Locator
  private readonly cardNumberErrorLocator: Locator
  private readonly expiryErrorLocator: Locator
  private readonly cvvErrorLocator: Locator

  constructor(page: Page) {
    super(page)
    this.checkoutPageLocator = this.getByTestId('checkout-page')
    this.checkoutTotalLocator = this.getByTestId('checkout-total')
    this.placeOrderButtonLocator = this.getByTestId('place-order-btn')
    this.backToCartLocator = this.getByTestId('back-to-cart')
    this.paymentErrorLocator = this.getByTestId('payment-error')

    // Delivery form
    this.nameInputLocator = this.getByTestId('input-name')
    this.emailInputLocator = this.getByTestId('input-email')
    this.addressInputLocator = this.getByTestId('input-address')

    // Payment form
    this.cardNumberInputLocator = this.getByTestId('input-card-number')
    this.cardholderInputLocator = this.getByTestId('input-cardholder')
    this.expiryInputLocator = this.getByTestId('input-expiry')
    this.cvvInputLocator = this.getByTestId('input-cvv')

    // Errors
    this.nameErrorLocator = this.getByTestId('error-name')
    this.emailErrorLocator = this.getByTestId('error-email')
    this.addressErrorLocator = this.getByTestId('error-address')
    this.cardNumberErrorLocator = this.getByTestId('error-card-number')
    this.expiryErrorLocator = this.getByTestId('error-expiry')
    this.cvvErrorLocator = this.getByTestId('error-cvv')
  }

  /**
   * Get summary item locator
   */
  getSummaryItem(itemId: string): Locator {
    return this.getByTestId(`summary-item-${itemId}`)
  }

  /**
 * Get payment form locator (used to assert payment section is visible)
 */
getPaymentForm(): Locator {
  return this.getByTestId('input-card-number')
}

  /**
   * Fill delivery details
   */
  async fillDeliveryDetails(
    name?: string,
    email?: string,
    address?: string
  ): Promise<void> {
    const deliveryData = {
      name: name || config.testUser.name,
      email: email || config.testUser.email,
      address: address || config.testUser.address
    }

    if (deliveryData.name) await this.nameInputLocator.fill(deliveryData.name)
    if (deliveryData.email) await this.emailInputLocator.fill(deliveryData.email)
    if (deliveryData.address) await this.addressInputLocator.fill(deliveryData.address)
  }

  /**
   * Fill payment details
   */
  async fillPaymentDetails(
    cardNumber?: string,
    cardholder?: string,
    expiry?: string,
    cvv?: string
  ): Promise<void> {
    const paymentData = {
      cardNumber: cardNumber || config.paymentCards.valid,
      cardholder: cardholder || config.testUser.name,
      expiry: expiry || '12/30',
      cvv: cvv || '123'
    }

    await this.cardNumberInputLocator.fill(paymentData.cardNumber)
    await this.cardholderInputLocator.fill(paymentData.cardholder)
    await this.expiryInputLocator.fill(paymentData.expiry)
    await this.cvvInputLocator.fill(paymentData.cvv)
  }

  /**
   * Fill complete checkout form
   */
  async fillCheckoutForm(
    deliveryOverrides?: { name?: string; email?: string; address?: string },
    paymentOverrides?: { cardNumber?: string; cardholder?: string; expiry?: string; cvv?: string }
  ): Promise<void> {
    await this.fillDeliveryDetails(
      deliveryOverrides?.name,
      deliveryOverrides?.email,
      deliveryOverrides?.address
    )
    await this.fillPaymentDetails(
      paymentOverrides?.cardNumber,
      paymentOverrides?.cardholder,
      paymentOverrides?.expiry,
      paymentOverrides?.cvv
    )
  }

  /**
   * Place order
   */
  async placeOrder(): Promise<void> {
    await this.placeOrderButtonLocator.click()
  }

  /**
   * Complete checkout with valid details
   */
  async completeCheckout(cardNumber?: string): Promise<void> {
    await this.fillDeliveryDetails()
    await this.fillPaymentDetails(cardNumber)
    await this.placeOrder()
  }

  async getDeliveryName(): Promise<string> {
  return await this.nameInputLocator.inputValue()
}



  /**
   * Go back to cart
   */
  async backToCart(): Promise<void> {
    await this.backToCartLocator.click()
  }

  /**
   * Get checkout total
   */
  async getCheckoutTotal(): Promise<string> {
    return await this.getText(this.checkoutTotalLocator)
  }

  /**
   * Check if checkout page is visible
   */
  async isCheckoutPageVisible(): Promise<boolean> {
    return await this.isVisible(this.checkoutPageLocator)
  }

  /**
   * Check if payment error is visible
   */
  async isPaymentErrorVisible(): Promise<boolean> {
    return await this.isVisible(this.paymentErrorLocator)
  }

  /**
   * Get payment error text
   */
  async getPaymentErrorText(): Promise<string> {
    return await this.getText(this.paymentErrorLocator)
  }

  /**
   * Check if name error is visible
   */
  async isNameErrorVisible(): Promise<boolean> {
    return await this.isVisible(this.nameErrorLocator)
  }

  /**
   * Check if email error is visible
   */
  async isEmailErrorVisible(): Promise<boolean> {
    return await this.isVisible(this.emailErrorLocator)
  }

  /**
   * Check if address error is visible
   */
  async isAddressErrorVisible(): Promise<boolean> {
    return await this.isVisible(this.addressErrorLocator)
  }

  /**
   * Check if card number error is visible
   */
  async isCardNumberErrorVisible(): Promise<boolean> {
    return await this.isVisible(this.cardNumberErrorLocator)
  }

  /**
   * Clear card number field
   */
  async clearCardNumber(): Promise<void> {
    await this.cardNumberInputLocator.clear()
  }
}
