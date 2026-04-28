/**
 * Critical UI Tests
 *
 * These tests cover the highest-risk user journeys that, if broken,
 * would immediately prevent a customer from placing an order.
 * Every test is tagged @critical and runs in the smoke gate.
 *
 * Scope:
 *  - Page load and core layout
 *  - Menu renders with correct data
 *  - Add-to-cart and cart state
 *  - Price calculation accuracy
 *  - Full checkout happy path
 *  - Navigation between all steps
 *  - Confirmation page data integrity
 */

import { test, expect } from '@playwright/test'
import { allure } from 'allure-playwright'
import { MenuPage, CartPage, CheckoutPage, ConfirmationPage } from '../pages'
import config from '../../test-config/test.config'

function parsePrice(text: string | null): number {
  return parseFloat((text ?? '0').replace(/[^0-9.]/g, ''))
}

// ─── CUI-01: Application loads ────────────────────────────────────────────────

test('CUI-01: application loads and renders menu page', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('blocker')
  await allure.description('The app must load and show the menu — if this fails nothing else works')

  const menuPage = new MenuPage(page)
  await menuPage.goto()
  await expect(page).toHaveTitle(/grub/i)
  expect(await menuPage.isMenuPageVisible()).toBeTruthy()
})

// ─── CUI-02: Add to cart and cart visibility ──────────────────────────────────

test('CUI-02: add to cart shows cart bar', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('critical')

  const menuPage = new MenuPage(page)
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  expect(await menuPage.isCartBarVisible()).toBeTruthy()
})

// ─── CUI-03: Cart page displays items ─────────────────────────────────────────

test('CUI-03: cart page shows added items', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('critical')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.goToCart()
  expect(await cartPage.getCartItem('M001').isVisible()).toBeTruthy()
})

// ─── CUI-04: Price calculations include tax ──────────────────────────────────

test('CUI-04: cart shows subtotal and tax', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('critical')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.goToCart()
  expect(await cartPage.getSubtotal()).toContain('₹')
  expect(await cartPage.getTax()).toContain('₹')
  expect(await cartPage.getOrderTotal()).toContain('₹')
})

// ─── CUI-05: Checkout page accessible from cart ───────────────────────────────

test('CUI-05: checkout page loads with delivery form', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('critical')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  const checkoutPage = new CheckoutPage(page)
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.goToCart()
  await cartPage.proceedToCheckout()
  expect(await checkoutPage.isCheckoutPageVisible()).toBeTruthy()
})

// ─── CUI-06: Delivery details form visible ────────────────────────────────────

test('CUI-06: delivery form fields are visible and fillable', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('critical')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  const checkoutPage = new CheckoutPage(page)
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.goToCart()
  await cartPage.proceedToCheckout()
  await checkoutPage.fillDeliveryDetails(config.testUser.name, config.testUser.email, config.testUser.address)
  expect(await checkoutPage.getDeliveryName()).toBe(config.testUser.name)
})

// ─── CUI-07: Payment form visible and fillable ────────────────────────────────

test('CUI-07: payment form fields are visible', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('critical')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  const checkoutPage = new CheckoutPage(page)
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.goToCart()
  await cartPage.proceedToCheckout()
  await checkoutPage.fillDeliveryDetails(config.testUser.name, config.testUser.email, config.testUser.address)
  expect(await checkoutPage.getPaymentForm()).toBeVisible()
})

// ─── CUI-08: Valid payment succeeds ───────────────────────────────────────────

test('CUI-08: valid payment card completes order', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('blocker')
  await allure.description('Happy path: valid card must complete the order')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  const checkoutPage = new CheckoutPage(page)
  const confirmationPage = new ConfirmationPage(page)
  
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.goToCart()
  await cartPage.proceedToCheckout()
  await checkoutPage.fillDeliveryDetails(config.testUser.name, config.testUser.email, config.testUser.address)
  await checkoutPage.fillPaymentDetails(config.paymentCards.valid)
  await checkoutPage.placeOrder()
  await confirmationPage.waitForConfirmation()
  expect(await confirmationPage.isConfirmationPageVisible()).toBeTruthy()
})

// ─── CUI-09: Confirmation page shows order ID ─────────────────────────────────

test('CUI-09: confirmation page displays order ID', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('blocker')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  const checkoutPage = new CheckoutPage(page)
  const confirmationPage = new ConfirmationPage(page)
  
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.goToCart()
  await cartPage.proceedToCheckout()
  await checkoutPage.fillDeliveryDetails(config.testUser.name, config.testUser.email, config.testUser.address)
  await checkoutPage.fillPaymentDetails(config.paymentCards.valid)
  await checkoutPage.placeOrder()
  await confirmationPage.waitForConfirmation()
  expect(await confirmationPage.verifyOrderIdFormat()).toBeTruthy()
})

// ─── CUI-10: Confirmation page shows transaction ID ──────────────────────────

test('CUI-10: confirmation page displays transaction ID', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('blocker')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  const checkoutPage = new CheckoutPage(page)
  const confirmationPage = new ConfirmationPage(page)
  
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.goToCart()
  await cartPage.proceedToCheckout()
  await checkoutPage.fillDeliveryDetails(config.testUser.name, config.testUser.email, config.testUser.address)
  await checkoutPage.fillPaymentDetails(config.paymentCards.valid)
  await checkoutPage.placeOrder()
  await confirmationPage.waitForConfirmation()
  expect(await confirmationPage.verifyTransactionIdFormat()).toBeTruthy()
})

// ─── CUI-11: Declined card shows error ────────────────────────────────────────

test('CUI-11: declined payment card shows error', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('critical')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  const checkoutPage = new CheckoutPage(page)
  
  await menuPage.goto()
  await menuPage.addItemToCart('M001')
  await menuPage.goToCart()
  await cartPage.proceedToCheckout()
  await checkoutPage.fillDeliveryDetails(config.testUser.name, config.testUser.email, config.testUser.address)
  await checkoutPage.fillPaymentDetails(config.paymentCards.declined)
  await checkoutPage.placeOrder()
  expect(await checkoutPage.getPaymentErrorText()).toContain('Card declined')
  //await expect(await checkoutPage.isPaymentErrorVisible()).toBeTruthy()
})

// ─── CUI-12: Multiple items price calculation ─────────────────────────────────

test('CUI-12: cart totals reflect multiple items', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('critical')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  
  await menuPage.goto()
  await menuPage.addItemToCart('M001') // ₹280
  await menuPage.addItemToCart('M002') // ₹240
  await menuPage.goToCart()
  
  //const subtotal = parsePrice(await cartPage.getSubtotal().then(t => Promise.resolve(t)))
  const subtotalText = await cartPage.getSubtotal()
  const subtotal = parsePrice(subtotalText)
  expect(subtotal).toBeCloseTo(280 + 240, 0)
})

// ─── CUI-13: Free delivery over threshold ─────────────────────────────────────

test('CUI-13: free delivery appears above ₹500 threshold', async ({ page }) => {
  await allure.suite('Critical UI')
  await allure.tag('critical')
  await allure.tag('smoke')
  await allure.severity('critical')

  const menuPage = new MenuPage(page)
  const cartPage = new CartPage(page)
  
  await menuPage.goto()
  //await menuPage.addItemToCart('M001') // ₹280
  await menuPage.addItemsToCart('M001', 2) // ₹280 x2 = ₹560 > ₹500
  await menuPage.goToCart()
  
  const delivery = await cartPage.getDeliveryFee()
  expect(delivery.toLowerCase()).toContain('free')
})
