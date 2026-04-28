/**
 * Regression Suite
 * Covers edge cases, boundary conditions, and previously-identified risk areas.
 * Tagged @regression — run separately from smoke/critical.
 */

import { test, expect } from '@playwright/test'
import { allure } from 'allure-playwright'
import { MenuPage, CartPage, CheckoutPage, ConfirmationPage } from '../pages'
import config from '../../test-config/test.config'

function parsePrice(text: string | null): number {
  return parseFloat((text ?? '0').replace(/[^0-9.]/g, ''))
}

// ─── REG-01: Category filter switching ────────────────────────────────────────

test('REG-01: switching back to All shows every item', async ({ page }) => {
  await allure.suite('Regression')
  await allure.tag('regression')
  await allure.description('When switching from a filtered category back to All, all items should be visible')

  const menuPage = new MenuPage(page)
  await menuPage.goto()
  
  // Filter to drinks
  await menuPage.selectCategory('drinks')
  expect(await menuPage.getMenuItem('M001').isVisible()).toBeFalsy()
  
  // Switch back to all
  await menuPage.selectCategory('all')
  expect(await menuPage.getMenuItem('M001').isVisible()).toBeTruthy()
  expect(await menuPage.getMenuItem('S001').isVisible()).toBeTruthy()
  expect(await menuPage.getMenuItem('DR001').isVisible()).toBeTruthy()
})

// ─── REG-02: Quantity decrement removes item at boundary ──────────────────────

test('REG-02: decrement at qty 1 removes item entirely', async ({ page }) => {
  await allure.suite('Regression')
  await allure.tag('regression')
  await allure.description('Decrementing quantity to 0 should remove the item and hide cart if empty')

  const menuPage = new MenuPage(page)
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  expect(await menuPage.getQuantityDisplay('M001').textContent()).toContain('1')
  
  await menuPage.decrementItem('M001')
  expect(await menuPage.getQuantityControls('M001').isVisible()).toBeFalsy()
  expect(await menuPage.getAddButton('M001').isVisible()).toBeTruthy()
  expect(await menuPage.isCartBarVisible()).toBeFalsy()
})

// ─── REG-03: Cart increment from cart page ────────────────────────────────────

test('REG-03: cart page increment updates line total', async ({ page }) => {
  await allure.suite('Regression')
  await allure.tag('regression')
  await allure.description('Incrementing quantity on cart page should recalculate line total')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  await menuPage.goto()
  await menuPage.addItemToCart('M001') // ₹280
  await menuPage.goToCart()

  const lineTotalBefore = parsePrice(await cartPage.getCartLineTotal('M001').textContent())
  await cartPage.incrementCartItem('M001')
  const lineTotalAfter = parsePrice(await cartPage.getCartLineTotal('M001').textContent())
  expect(lineTotalAfter).toBeCloseTo(lineTotalBefore * 2, 0)
})

// ─── REG-04: Free delivery boundary ────────────────────────────────────────────

test('REG-04: free delivery threshold at ₹500', async ({ page }) => {
  await allure.suite('Regression')
  await allure.tag('regression')
  await allure.description('Subtotal >= ₹500 should show free delivery')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  
  await menuPage.goto()
  //await menuPage.addItemToCart('M001') // ₹280
  await menuPage.addItemsToCart('M001', 2) // ₹280 x2 = ₹560 > ₹500
  await menuPage.goToCart()
  
  const delivery = await cartPage.getDeliveryFee()
  expect(delivery.toLowerCase()).toContain('free')
})

// ─── REG-05: Remove all items shows empty cart ─────────────────────────────────

test('REG-05: removing all items shows empty cart state', async ({ page }) => {
  await allure.suite('Regression')
  await allure.tag('regression')
  await allure.description('When all items are removed, empty cart message should appear')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.addItemToCart('M002')
  await menuPage.goToCart()

  await cartPage.removeItem('M001')
  await cartPage.removeItem('M002')
  expect(await cartPage.isCartEmpty()).toBeTruthy()
})

// ─── REG-06: Back from checkout returns to cart with items ──────────────────

test('REG-06: back from checkout returns to cart intact', async ({ page }) => {
  await allure.suite('Regression')
  await allure.tag('regression')
  await allure.description('Navigating back from checkout should preserve cart items')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  const checkoutPage = new CheckoutPage(page)
  
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.goToCart()
  await cartPage.proceedToCheckout()
  
  // Go back
  //await page.goBack()

  // Navigate back using the checkout page's "Back to cart" button
  await checkoutPage.backToCart()

  // Wait for cart page to be visible again
  await expect(cartPage.getCartPageLocator()).toBeVisible()  
  await expect(cartPage.getCartItem('M001')).toBeVisible()
  //expect(await cartPage.getCartItem('M001').isVisible()).toBeTruthy()
})

// ─── REG-07: Invalid email validation ──────────────────────────────────────────

test('REG-07: invalid email format shows error', async ({ page }) => {
  await allure.suite('Regression')
  await allure.tag('regression')
  await allure.description('Email validation should reject malformed addresses')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  const checkoutPage = new CheckoutPage(page)
  
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.goToCart()
  await cartPage.proceedToCheckout()
  
  await checkoutPage.fillDeliveryDetails(config.testUser.name, 'not-an-email', config.testUser.address)
  await checkoutPage.fillPaymentDetails(config.paymentCards.valid)
  await checkoutPage.placeOrder()
  
  expect(await checkoutPage.isEmailErrorVisible()).toBeTruthy()
})

// ─── REG-08: Retry after payment failure ──────────────────────────────────────

test('REG-08: can retry with valid card after declined payment', async ({ page }) => {
  await allure.suite('Regression')
  await allure.tag('regression')
  await allure.description('After a declined card, user should be able to retry with a valid card')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  const checkoutPage = new CheckoutPage(page)
  const confirmationPage = new ConfirmationPage(page)
  
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.goToCart()
  await cartPage.proceedToCheckout()
  await checkoutPage.fillDeliveryDetails(config.testUser.name, config.testUser.email, config.testUser.address)
  
  // Try with declined card
  await checkoutPage.fillPaymentDetails(config.paymentCards.declined)
  await checkoutPage.placeOrder()
  expect(await checkoutPage.getPaymentErrorText()).toContain('Card declined')
  //expect(await checkoutPage.isPaymentErrorVisible()).toBeTruthy()
  
  // Retry with valid card
  await checkoutPage.fillPaymentDetails(config.paymentCards.valid)
  await checkoutPage.placeOrder()
  await confirmationPage.waitForConfirmation()
  expect(await confirmationPage.isConfirmationPageVisible()).toBeTruthy()
})
