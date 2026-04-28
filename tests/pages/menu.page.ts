import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class MenuPage extends BasePage {
  // Locators
  private readonly menuPageLocator: Locator
  private readonly menuGridLocator: Locator
  private readonly floatingCartBarLocator: Locator
  private readonly cartCountLocator: Locator
  private readonly viewCartButtonLocator: Locator
  private readonly cartButtonLocator: Locator

  constructor(page: Page) {
    super(page)
    this.menuPageLocator = this.getByTestId('menu-page')
    this.menuGridLocator = this.getByTestId('menu-grid')
    this.floatingCartBarLocator = this.getByTestId('floating-cart-bar')
    this.cartCountLocator = this.getByTestId('cart-count')
    this.viewCartButtonLocator = this.getByTestId('view-cart-btn')
    this.cartButtonLocator = this.getByTestId('cart-button')
  }

  /**
   * Navigate to menu page
   */
  async goto(): Promise<void> {
    await this.navigate('/')
  }

  /**
   * Get category tab locator
   */
  getCategoryTab(category: string): Locator {
    return this.getByTestId(`category-${category}`)
  }

  /**
   * Click category tab
   */
  async selectCategory(category: 'all' | 'starters' | 'mains' | 'desserts' | 'drinks'): Promise<void> {
    await this.getCategoryTab(category).click()
  }

  /**
   * Get menu item card locator
   */
  getMenuItem(itemId: string): Locator {
    return this.getByTestId(`menu-item-${itemId}`)
  }

  /**
   * Get add button for item
   */
  getAddButton(itemId: string): Locator {
    return this.getByTestId(`add-${itemId}`)
  }

  /**
   * Get quantity controls for item
   */
  getQuantityControls(itemId: string): Locator {
    return this.getByTestId(`qty-controls-${itemId}`)
  }

  /**
   * Get increment button for item
   */
  getIncrementButton(itemId: string): Locator {
    return this.getByTestId(`inc-${itemId}`)
  }

  /**
   * Get decrement button for item
   */
  getDecrementButton(itemId: string): Locator {
    return this.getByTestId(`dec-${itemId}`)
  }

  /**
   * Get quantity display for item
   */
  getQuantityDisplay(itemId: string): Locator {
    return this.getByTestId(`qty-${itemId}`)
  }

  /**
   * Get price locator for item
   */
  getItemPrice(itemId: string): Locator {
    return this.getByTestId(`price-${itemId}`)
  }

  /**
   * Add item to cart
   */
  async addItemToCart(itemId: string): Promise<void> {
    await this.getAddButton(itemId).click()
  }

  async addItemsToCart(itemId: string, quantity: number = 1): Promise<void> {
  // First click the "Add" button
  await this.getAddButton(itemId).click()

  // If more than one, click the increment button
  for (let i = 1; i < quantity; i++) {
    await this.getIncrementButton(itemId).click()
  }
}

  /**
   * Increment item quantity
   */
  async incrementItem(itemId: string): Promise<void> {
    await this.getIncrementButton(itemId).click()
  }

  /**
   * Decrement item quantity
   */
  async decrementItem(itemId: string): Promise<void> {
    await this.getDecrementButton(itemId).click()
  }

  /**
   * Get cart count
   */
  async getCartCount(): Promise<string> {
    return await this.getText(this.cartCountLocator)
  }

  /**
   * Check if cart bar is visible
   */
  async isCartBarVisible(): Promise<boolean> {
    return await this.isVisible(this.floatingCartBarLocator)
  }

  /**
   * Click view cart button
   */
  async goToCart(): Promise<void> {
    await this.cartButtonLocator.waitFor({ state: 'visible' })
    await this.cartButtonLocator.click()
  }

  /**
   * Check if menu page is visible
   */
  async isMenuPageVisible(): Promise<boolean> {
    return await this.isVisible(this.menuPageLocator)
  }

  /**
   * Check if item is sold out
   */
  async isItemSoldOut(itemId: string): Promise<boolean> {
    const menuItem = this.getMenuItem(itemId)
    const text = await this.getText(menuItem)
    return text.includes('Sold out')
  }

  /**
   * Get all visible menu items
   */
  async getVisibleMenuItems(): Promise<number> {
    const items = this.page.locator('[data-testid^="menu-item-"]')
    return await items.count()
  }

  /**
   * Wait for menu to load
   */
  async waitForMenuLoad(): Promise<void> {
    await this.waitForVisible(this.menuGridLocator)
  }
}
