import {
  calculateSubtotal,
  calculateTax,
  calculateDeliveryFee,
  calculateTotal,
  calculateOrderTotals,
  validateCart,
  validateCartItem,
  validatePayment,
  isCardExpired,
  mockProcessPayment,
  createOrder
} from '@/lib/order-utils'
import { MENU_ITEMS, TAX_RATE, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/menu-data'
import { CartItem, MenuItem, PaymentDetails } from '@/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const butterChicken: MenuItem = MENU_ITEMS.find(m => m.id === 'M001')! // ₹280
const paneerMasala: MenuItem  = MENU_ITEMS.find(m => m.id === 'M002')! // ₹240
const masalaDosa: MenuItem = MENU_ITEMS.find(m => m.id === 'M006')! // unavailable

const makeCart = (...items: [MenuItem, number][]): CartItem[] =>
  items.map(([menuItem, quantity]) => ({ menuItem, quantity }))

const validCard: PaymentDetails = {
  cardNumber: '4242424242424242',
  cardholderName: 'Jane Smith',
  expiryDate: '12/30',
  cvv: '123'
}

// ─── Subtotal ─────────────────────────────────────────────────────────────────

describe('calculateSubtotal', () => {
  it('returns 0 for empty cart', () => {
    expect(calculateSubtotal([])).toBe(0)
  })

  it('calculates a single-item cart correctly', () => {
    const cart = makeCart([butterChicken, 1])
    expect(calculateSubtotal(cart)).toBeCloseTo(280)
  })

  it('calculates multiple items with quantities', () => {
    const cart = makeCart([butterChicken, 2], [paneerMasala, 1])
    expect(calculateSubtotal(cart)).toBeCloseTo(280 * 2 + 240)
  })

  it('handles quantity of 0 gracefully', () => {
    const cart = makeCart([butterChicken, 0])
    expect(calculateSubtotal(cart)).toBe(0)
  })
})

// ─── Tax ──────────────────────────────────────────────────────────────────────

describe('calculateTax', () => {
  it('applies 5% GST', () => {
    expect(calculateTax(100)).toBeCloseTo(5)
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateTax(13.33)).toBeCloseTo(0.67)
  })

  it('returns 0 for 0 subtotal', () => {
    expect(calculateTax(0)).toBe(0)
  })
})

// ─── Delivery fee ─────────────────────────────────────────────────────────────

describe('calculateDeliveryFee', () => {
  it(`charges delivery for orders below ₹${FREE_DELIVERY_THRESHOLD}`, () => {
    expect(calculateDeliveryFee(FREE_DELIVERY_THRESHOLD - 0.01)).toBe(DELIVERY_FEE)
  })

  it(`waives delivery at exactly ₹${FREE_DELIVERY_THRESHOLD}`, () => {
    expect(calculateDeliveryFee(FREE_DELIVERY_THRESHOLD)).toBe(0)
  })

  it('waives delivery above the threshold', () => {
    expect(calculateDeliveryFee(FREE_DELIVERY_THRESHOLD + 10)).toBe(0)
  })
})

// ─── Total ────────────────────────────────────────────────────────────────────

describe('calculateTotal', () => {
  it('sums subtotal, tax, and delivery correctly', () => {
    expect(calculateTotal(10, 1, 2.99)).toBeCloseTo(13.99)
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateTotal(10.001, 1.002, 0)).toBeCloseTo(11.0)
  })
})

// ─── calculateOrderTotals ─────────────────────────────────────────────────────

describe('calculateOrderTotals', () => {
  it('returns all totals for a normal cart', () => {
    const cart = makeCart([butterChicken, 1])
    const { subtotal, tax, deliveryFee, total } = calculateOrderTotals(cart)
    expect(subtotal).toBeCloseTo(280)
    expect(tax).toBeCloseTo(14)
    expect(deliveryFee).toBe(DELIVERY_FEE)
    expect(total).toBeCloseTo(280 + 14 + DELIVERY_FEE)
  })

  it('applies free delivery when over threshold', () => {
    // Need > ₹500 in cart
    const cart = makeCart([butterChicken, 2]) // 2 × ₹280 = ₹560
    const { deliveryFee } = calculateOrderTotals(cart)
    expect(deliveryFee).toBe(0)
  })
})

// ─── Cart validation ──────────────────────────────────────────────────────────

describe('validateCart', () => {
  it('fails on empty cart', () => {
    expect(validateCart([])).toContain('Cart is empty')
  })

  it('passes for a valid cart', () => {
    const cart = makeCart([butterChicken, 2])
    expect(validateCart(cart)).toHaveLength(0)
  })

  it('catches unavailable items', () => {
    const cart = makeCart([masalaDosa, 1])
    const errors = validateCart(cart)
    expect(errors.some(e => e.includes(masalaDosa.name))).toBe(true)
  })
})

describe('validateCartItem', () => {
  it('passes a valid item', () => {
    expect(validateCartItem({ menuItem: butterChicken, quantity: 1 })).toHaveLength(0)
  })

  it('rejects quantity below 1', () => {
    const errors = validateCartItem({ menuItem: butterChicken, quantity: 0 })
    expect(errors).toContain('Quantity must be at least 1')
  })

  it('rejects quantity above 20', () => {
    const errors = validateCartItem({ menuItem: butterChicken, quantity: 21 })
    expect(errors).toContain('Cannot order more than 20 of the same item')
  })

  it('rejects unavailable items', () => {
    const errors = validateCartItem({ menuItem: masalaDosa, quantity: 1 })
    expect(errors.some(e => e.includes(masalaDosa.name))).toBe(true)
  })
})

// ─── Payment validation ───────────────────────────────────────────────────────

describe('validatePayment', () => {
  it('passes a valid card', () => {
    expect(validatePayment(validCard)).toHaveLength(0)
  })

  it('fails a short card number', () => {
    const card: PaymentDetails = { ...validCard, cardNumber: '1234' }
    expect(validatePayment(card)).toContain('Card number must be 16 digits')
  })

  it('accepts card numbers with spaces', () => {
    const card: PaymentDetails = { ...validCard, cardNumber: '4242 4242 4242 4242' }
    expect(validatePayment(card)).toHaveLength(0)
  })

  it('fails blank cardholder name', () => {
    const card: PaymentDetails = { ...validCard, cardholderName: '   ' }
    expect(validatePayment(card)).toContain('Cardholder name is required')
  })

  it('fails invalid expiry format', () => {
    const card: PaymentDetails = { ...validCard, expiryDate: '1230' }
    expect(validatePayment(card)).toContain('Expiry must be MM/YY format')
  })

  it('fails a short CVV', () => {
    const card: PaymentDetails = { ...validCard, cvv: '12' }
    expect(validatePayment(card)).toContain('CVV must be 3 or 4 digits')
  })

  it('accepts 4-digit CVV (Amex style)', () => {
    const card: PaymentDetails = { ...validCard, cvv: '1234' }
    expect(validatePayment(card)).toHaveLength(0)
  })
})

// ─── Card expiry ──────────────────────────────────────────────────────────────

describe('isCardExpired', () => {
  // Pin a fixed reference date so these tests never become brittle
  const JAN_2025 = new Date(2025, 0, 15) // 15 Jan 2025

  it('returns false for a card expiring in the future', () => {
    expect(isCardExpired('12/99', JAN_2025)).toBe(false)
  })

  it('returns true for a card that expired years ago', () => {
    expect(isCardExpired('01/20', JAN_2025)).toBe(true)
  })

  it('returns false on the first day of the expiry month (card still valid)', () => {
    // Card printed 01/25 — valid through all of January 2025
    expect(isCardExpired('01/25', JAN_2025)).toBe(false)
  })

  it('returns true on the first day of the month after expiry', () => {
    const FEB_2025 = new Date(2025, 1, 1)
    expect(isCardExpired('01/25', FEB_2025)).toBe(true)
  })

  it('returns false for a card expiring this month', () => {
    const MID_DEC_2030 = new Date(2030, 11, 15)
    expect(isCardExpired('12/30', MID_DEC_2030)).toBe(false)
  })
})

// ─── Mock payment processor ───────────────────────────────────────────────────

describe('mockProcessPayment', () => {
  it('succeeds with a standard test card', () => {
    const result = mockProcessPayment(validCard)
    expect(result.success).toBe(true)
    expect(result.transactionId).toMatch(/^TXN-/)
  })

  it('declines the 4000000000000002 card', () => {
    const result = mockProcessPayment({ ...validCard, cardNumber: '4000000000000002' })
    expect(result.success).toBe(false)
    expect(result.errorMessage).toBe('Card declined by issuer')
  })

  it('returns insufficient funds for 4000000000009995', () => {
    const result = mockProcessPayment({ ...validCard, cardNumber: '4000000000009995' })
    expect(result.success).toBe(false)
    expect(result.errorMessage).toBe('Insufficient funds')
  })

  it('rejects an expired card', () => {
    const result = mockProcessPayment({ ...validCard, expiryDate: '01/20' })
    expect(result.success).toBe(false)
    expect(result.errorMessage).toBe('Card has expired')
  })
})

// ─── createOrder ──────────────────────────────────────────────────────────────

describe('createOrder', () => {
  it('creates an order with the correct shape', () => {
    const cart = makeCart([butterChicken, 2])
    const order = createOrder(cart, 'Jane', 'jane@test.com', '123 Main St')
    expect(order.id).toMatch(/^ORD-/)
    expect(order.items).toHaveLength(1)
    expect(order.customerName).toBe('Jane')
    expect(order.status).toBe('confirmed')
    expect(order.total).toBeGreaterThan(0)
  })

  it('includes all totals', () => {
    const cart = makeCart([butterChicken, 1])
    const order = createOrder(cart, 'Jane', 'jane@test.com', '123 Main St')
    expect(order.subtotal).toBeCloseTo(280)
    expect(order.tax).toBeGreaterThan(0)
    expect(order.total).toBeGreaterThan(order.subtotal)
  })
})
