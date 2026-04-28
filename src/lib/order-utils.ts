import { CartItem, Order, PaymentDetails, PaymentResult } from '@/types'
import { TAX_RATE, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from './menu-data'
import { v4 as uuidv4 } from 'uuid'

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
}

export function calculateTax(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE * 100) / 100
}

export function calculateDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
}

export function calculateTotal(subtotal: number, tax: number, delivery: number): number {
  return Math.round((subtotal + tax + delivery) * 100) / 100
}

export function calculateOrderTotals(items: CartItem[]): {
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
} {
  const subtotal = calculateSubtotal(items)
  const tax = calculateTax(subtotal)
  const deliveryFee = calculateDeliveryFee(subtotal)
  const total = calculateTotal(subtotal, tax, deliveryFee)
  return { subtotal, tax, deliveryFee, total }
}

export function validateCartItem(item: CartItem): string[] {
  const errors: string[] = []
  if (!item.menuItem.available) errors.push(`${item.menuItem.name} is not available`)
  if (item.quantity < 1) errors.push('Quantity must be at least 1')
  if (item.quantity > 20) errors.push('Cannot order more than 20 of the same item')
  return errors
}

export function validateCart(items: CartItem[]): string[] {
  if (items.length === 0) return ['Cart is empty']
  return items.flatMap(validateCartItem)
}

export function validatePayment(details: PaymentDetails): string[] {
  const errors: string[] = []
  const cardNum = details.cardNumber.replace(/\s/g, '')
  if (!/^\d{16}$/.test(cardNum)) errors.push('Card number must be 16 digits')
  if (!details.cardholderName.trim()) errors.push('Cardholder name is required')
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(details.expiryDate)) errors.push('Expiry must be MM/YY format')
  if (!/^\d{3,4}$/.test(details.cvv)) errors.push('CVV must be 3 or 4 digits')
  return errors
}

export function isCardExpired(expiryDate: string, now: Date = new Date()): boolean {
  const [month, year] = expiryDate.split('/').map(Number)
  const expiry = new Date(2000 + year, month) // first day of the month AFTER expiry
  return expiry <= now
}

export function mockProcessPayment(details: PaymentDetails): PaymentResult {
  // Simulate payment gateway — use specific card numbers to trigger scenarios
  const cardNum = details.cardNumber.replace(/\s/g, '')

  if (cardNum === '4000000000000002') {
    return { success: false, errorMessage: 'Card declined by issuer' }
  }
  if (cardNum === '4000000000009995') {
    return { success: false, errorMessage: 'Insufficient funds' }
  }
  if (isCardExpired(details.expiryDate)) {
    return { success: false, errorMessage: 'Card has expired' }
  }

  if (!/^\d{16}$/.test(cardNum) || !isValidLuhn(cardNum)) {
    return { success: false, errorMessage: 'Invalid card number' }
  }

  // Simulate slight processing delay indicator (no actual async here — keep pure)
  return {
    success: true,
    transactionId: `TXN-${uuidv4().toUpperCase().slice(0, 8)}`
  }
}

// Simple Luhn algorithm check
function isValidLuhn(cardNum: string): boolean {
  let sum = 0
  let shouldDouble = false
  for (let i = cardNum.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNum[i], 10)
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}


export function createOrder(
  items: CartItem[],
  customerName: string,
  customerEmail: string,
  customerAddress: string
): Order {
  const { subtotal, tax, deliveryFee, total } = calculateOrderTotals(items)
  return {
    id: `ORD-${uuidv4().toUpperCase().slice(0, 8)}`,
    items,
    subtotal,
    tax,
    deliveryFee,
    total,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    customerName,
    customerEmail,
    customerAddress
  }
}
