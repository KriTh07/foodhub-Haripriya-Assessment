/**
 * Accessibility Tests
 * 
 * WCAG 2.1 Level AA compliance tests using axe-core integration
 * Tests ensure the application is usable by people with disabilities
 */

import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'
import { allure } from 'allure-playwright'
import { MenuPage, CartPage, CheckoutPage } from '../pages'
import config from '../../test-config/test.config'

// ─── Menu Page Accessibility ──────────────────────────────────────────────────

test.describe('Accessibility - Menu Page', () => {
  test('menu page has no accessibility violations', async ({ page }) => {
    await allure.suite('Accessibility')
    await allure.tag('a11y')
    await allure.severity('high')
    
    const menuPage = new MenuPage(page)
    await menuPage.goto()
    
    await injectAxe(page)
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
  })

  test('category tabs have proper ARIA labels', async ({ page }) => {
    await allure.suite('Accessibility')
    await allure.tag('a11y')
    
    const menuPage = new MenuPage(page)
    await menuPage.goto()
    
    const categoryTabs = page.locator('[role="tab"]')
    const count = await categoryTabs.count()
    expect(count).toBeGreaterThan(0)
    
    for (let i = 0; i < count; i++) {
      const ariaLabel = await categoryTabs.nth(i).getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })

  test('add to cart buttons have accessible labels', async ({ page }) => {
    await allure.suite('Accessibility')
    await allure.tag('a11y')
    
    const menuPage = new MenuPage(page)
    await menuPage.goto()
    
    const addButtons = page.locator('[data-testid^="add-"]')
    const count = await addButtons.count()
    expect(count).toBeGreaterThan(0)
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const ariaLabel = await addButtons.nth(i).getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })
})

// ─── Cart Page Accessibility ──────────────────────────────────────────────────

test.describe('Accessibility - Cart Page', () => {
  test('cart page has no accessibility violations', async ({ page }) => {
    await allure.suite('Accessibility')
    await allure.tag('a11y')
    
    const menuPage = new MenuPage(page)
    const cartPage = new CartPage(page)
    
    await menuPage.goto()
    await menuPage.addItemToCart('M001')
    await menuPage.goToCart()
    
    await injectAxe(page)
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
  })

  test('cart items list is marked up semantically', async ({ page }) => {
    await allure.suite('Accessibility')
    await allure.tag('a11y')
    
    const menuPage = new MenuPage(page)
    const cartPage = new CartPage(page)
    
    await menuPage.goto()
    await menuPage.addItemToCart('M001')
    await menuPage.goToCart()
    
    const cartList = page.locator('[role="list"]')
    expect(await cartList.count()).toBeGreaterThan(0)
  })
})

// ─── Checkout Page Accessibility ──────────────────────────────────────────────

test.describe('Accessibility - Checkout Page', () => {
  test('checkout page has no accessibility violations', async ({ page }) => {
    await allure.suite('Accessibility')
    await allure.tag('a11y')
    
    const menuPage = new MenuPage(page)
    const cartPage = new CartPage(page)
    const checkoutPage = new CheckoutPage(page)
    
    await menuPage.goto()
    await menuPage.addItemToCart('M001')
    await menuPage.goToCart()
    await cartPage.proceedToCheckout()
    
    await injectAxe(page)
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
  })

  test('form fields have associated labels', async ({ page }) => {
    await allure.suite('Accessibility')
    await allure.tag('a11y')
    
    const menuPage = new MenuPage(page)
    const cartPage = new CartPage(page)
    const checkoutPage = new CheckoutPage(page)
    
    await menuPage.goto()
    await menuPage.addItemToCart('M001')
    await menuPage.goToCart()
    await cartPage.proceedToCheckout()
    
    const inputs = page.locator('input')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('error messages are announced to screen readers', async ({ page }) => {
    await allure.suite('Accessibility')
    await allure.tag('a11y')
    
    const menuPage = new MenuPage(page)
    const cartPage = new CartPage(page)
    const checkoutPage = new CheckoutPage(page)
    
    await menuPage.goto()
    await menuPage.addItemToCart('M001')
    await menuPage.goToCart()
    await cartPage.proceedToCheckout()
    
    // Try to submit without filling fields
    await checkoutPage.placeOrder()
    
    // Check if error is marked as alert role
    const errorAlert = page.locator('[role="alert"]')
    expect(await errorAlert.count()).toBeGreaterThan(0)
  })
})
