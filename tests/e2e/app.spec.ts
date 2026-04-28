/**
 * Application Full Flow Tests
 * 
 * These tests verify the complete user journey from menu browsing
 * through to order confirmation using the Page Object Model.
 */

import { test, expect } from '@playwright/test'
import { allure } from 'allure-playwright'
import { MenuPage, CartPage, CheckoutPage, ConfirmationPage } from '../pages'
import config from '../../test-config/test.config'

// ─── Full application flow ────────────────────────────────────────────────────

test.describe('Full Application Flow', () => {
  test('complete order journey: menu → cart → checkout → confirmation', async ({ page }) => {
    await allure.suite('Full Flow')
    await allure.tag('smoke')
    await allure.severity('blocker')
    await allure.description('Complete happy path: browse menu, add item, view cart, checkout, and receive confirmation')

    const menuPage = new MenuPage(page)
    const cartPage = new CartPage(page)
    const checkoutPage = new CheckoutPage(page)
    const confirmationPage = new ConfirmationPage(page)

    // Step 1: Browse menu and add item
    await menuPage.goto()
    expect(await menuPage.isMenuPageVisible()).toBeTruthy()
    await menuPage.addItemToCart('M001')
    expect(await menuPage.isCartBarVisible()).toBeTruthy()

    // Step 2: View cart
    await menuPage.goToCart()
    expect(await cartPage.isCartPageVisible()).toBeTruthy()
    expect(await cartPage.getCartItem('M001').isVisible()).toBeTruthy()

    // Step 3: Proceed to checkout
    await cartPage.proceedToCheckout()
    expect(await checkoutPage.isCheckoutPageVisible()).toBeTruthy()

    // Step 4: Fill delivery details
    await checkoutPage.fillDeliveryDetails(config.testUser.name, config.testUser.email, config.testUser.address)

    // Step 5: Fill payment details with valid card
    await checkoutPage.fillPaymentDetails(config.paymentCards.valid)

    // Step 6: Place order
    await checkoutPage.placeOrder()

    // Step 7: Verify confirmation
    await confirmationPage.waitForConfirmation()
    expect(await confirmationPage.isConfirmationPageVisible()).toBeTruthy()
    expect(await confirmationPage.getConfirmationTitle()).toBe('Order Confirmed!')
    expect(await confirmationPage.verifyOrderIdFormat()).toBeTruthy()
    expect(await confirmationPage.verifyTransactionIdFormat()).toBeTruthy()
  })

  test('can place another order from confirmation page', async ({ page }) => {
    await allure.suite('Full Flow')
    await allure.description('Verify user can restart the flow from confirmation page')

    const menuPage = new MenuPage(page)
    const cartPage = new CartPage(page)
    const checkoutPage = new CheckoutPage(page)
    const confirmationPage = new ConfirmationPage(page)

    // Complete first order
    await menuPage.goto()
    await menuPage.addItemToCart('M001')
    await menuPage.goToCart()
    await cartPage.proceedToCheckout()
    await checkoutPage.fillDeliveryDetails(config.testUser.name, config.testUser.email, config.testUser.address)
    await checkoutPage.fillPaymentDetails(config.paymentCards.valid)
    await checkoutPage.placeOrder()
    await confirmationPage.waitForConfirmation()

    // Order again
    await confirmationPage.orderAgain()
    expect(await menuPage.isMenuPageVisible()).toBeTruthy()
  })
})
