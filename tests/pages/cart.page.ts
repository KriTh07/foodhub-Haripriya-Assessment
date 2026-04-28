import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class CartPage extends BasePage {
  // Locators
  private readonly cartPageLocator: Locator
  private readonly emptyCartLocator: Locator
  private readonly subtotalLocator: Locator
  private readonly taxLocator: Locator
  private readonly deliveryFeeLocator: Locator
  private readonly orderTotalLocator: Locator
  private readonly proceedToCheckoutLocator: Locator
  private readonly backToMenuLocator: Locator

  constructor(page: Page) {
    super(page)
    this.cartPageLocator = this.getByTestId('cart-page')
    this.emptyCartLocator = this.getByTestId('empty-cart')
    this.subtotalLocator = this.getByTestId('subtotal')
    this.taxLocator = this.getByTestId('tax')
    this.deliveryFeeLocator = this.getByTestId('delivery-fee')
    this.orderTotalLocator = this.getByTestId('order-total')
    this.proceedToCheckoutLocator = this.getByTestId('proceed-to-checkout')
    this.backToMenuLocator = this.getByTestId('back-to-menu')
  }

  /**
   * Get cart item locator
   */
  getCartItem(itemId: string): Locator {
    return this.getByTestId(`cart-item-${itemId}`)
  }

  getCartPageLocator(): Locator {
  return this.cartPageLocator
}

  /**
   * Get cart item quantity
   */
  getCartItemQuantity(itemId: string): Locator {
    return this.getByTestId(`cart-qty-${itemId}`)
  }

  /**
   * Get cart increment button
   */
  getCartIncrementButton(itemId: string): Locator {
    return this.getByTestId(`cart-inc-${itemId}`)
  }

  /**
   * Get cart decrement button
   */
  getCartDecrementButton(itemId: string): Locator {
    return this.getByTestId(`cart-dec-${itemId}`)
  }

  /**
   * Get remove button
   */
  getRemoveButton(itemId: string): Locator {
    return this.getByTestId(`remove-${itemId}`)
  }

  /**
   * Get cart line total
   */
  getCartLineTotal(itemId: string): Locator {
    return this.getByTestId(`cart-line-${itemId}`)
  }

  /**
   * Increment item in cart
   */
  async incrementCartItem(itemId: string): Promise<void> {
    await this.getCartIncrementButton(itemId).click()
  }

  /**
   * Decrement item in cart
   */
  async decrementCartItem(itemId: string): Promise<void> {
    await this.getCartDecrementButton(itemId).click()
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string): Promise<void> {
    await this.getRemoveButton(itemId).click()
  }

  /**
   * Get subtotal
   */
  async getSubtotal(): Promise<string> {
    return await this.getText(this.subtotalLocator)
  }

  /**
   * Get tax
   */
  async getTax(): Promise<string> {
    return await this.getText(this.taxLocator)
  }

  /**
   * Get delivery fee
   */
  async getDeliveryFee(): Promise<string> {
    return await this.getText(this.deliveryFeeLocator)
  }

  /**
   * Get order total
   */
  async getOrderTotal(): Promise<string> {
    return await this.getText(this.orderTotalLocator)
  }

  /**
   * Check if cart is empty
   */
  async isCartEmpty(): Promise<boolean> {
    return await this.isVisible(this.emptyCartLocator)
  }

  /**
   * Proceed to checkout
   */
async proceedToCheckout(): Promise<void> {
  await this.proceedToCheckoutLocator.waitFor({ state: 'visible' })
  await this.proceedToCheckoutLocator.click()
}

  /**
   * Go back to menu
   */
  async backToMenu(): Promise<void> {
    await this.backToMenuLocator.click()
  }

  /**
   * Check if cart page is visible
   */
  async isCartPageVisible(): Promise<boolean> {
    return await this.isVisible(this.cartPageLocator)
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(): Promise<number> {
    const items = this.page.locator('[data-testid^="cart-item-"]')
    return await items.count()
  }

  /**
   * Parse price from text
   */
  parsePrice(text: string): number {
    return parseFloat(text.replace(/[^0-9.]/g, ''))
  }
}
