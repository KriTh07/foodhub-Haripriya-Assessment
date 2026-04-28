/**
 * Integration tests for API routes using fetch against
 * the actual Next.js route handlers (via next/server mocking).
 *
 * These tests exercise the full request→handler→response path
 * without a running server, validating routing, validation, and
 * business-logic integration.
 */

import { GET as menuGet } from '@/app/api/menu/route'
import { POST as ordersPost } from '@/app/api/orders/route'
import { POST as paymentPost } from '@/app/api/payment/route'
import { MENU_ITEMS } from '@/lib/menu-data'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(url: string, body?: unknown): Request {
  if (body) {
    return new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }
  return new Request(url)
}

const availableItem = MENU_ITEMS.find(m => m.available)!
const sampleCart = [{ menuItem: availableItem, quantity: 2 }]

const validOrderPayload = {
  items: sampleCart,
  customerName: 'Jane Smith',
  customerEmail: 'jane@example.com',
  customerAddress: '123 Main St, London, W1A 1AA'
}

const validPayment = {
  cardNumber: '4242424242424242',
  cardholderName: 'Jane Smith',
  expiryDate: '12/30',
  cvv: '123'
}

// ─── Menu API ─────────────────────────────────────────────────────────────────

describe('GET /api/menu', () => {
  it('returns all menu items', async () => {
    const res = await menuGet(makeRequest('http://localhost/api/menu'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.items.length).toBe(MENU_ITEMS.length)
    expect(data.total).toBe(MENU_ITEMS.length)
  })

  it('filters by category', async () => {
    const res = await menuGet(makeRequest('http://localhost/api/menu?category=mains'))
    const data = await res.json()
    expect(data.items.every((i: { category: string }) => i.category === 'mains')).toBe(true)
  })

  it('filters by available=true', async () => {
    const res = await menuGet(makeRequest('http://localhost/api/menu?available=true'))
    const data = await res.json()
    expect(data.items.every((i: { available: boolean }) => i.available === true)).toBe(true)
  })

  it('combines category and available filters', async () => {
    const res = await menuGet(makeRequest('http://localhost/api/menu?category=mains&available=true'))
    const data = await res.json()
    expect(data.items.every((i: { category: string; available: boolean }) => i.category === 'mains' && i.available)).toBe(true)
  })
})

// ─── Orders API ───────────────────────────────────────────────────────────────

describe('POST /api/orders', () => {
  it('creates an order with valid payload', async () => {
    const res = await ordersPost(makeRequest('http://localhost/api/orders', validOrderPayload))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.order.id).toMatch(/^ORD-/)
    expect(data.order.status).toBe('confirmed')
    expect(data.order.customerName).toBe('Jane Smith')
  })

  it('returns 400 when name is missing', async () => {
    const res = await ordersPost(makeRequest('http://localhost/api/orders', { ...validOrderPayload, customerName: '' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('name')
  })

  it('returns 400 for invalid email', async () => {
    const res = await ordersPost(makeRequest('http://localhost/api/orders', { ...validOrderPayload, customerEmail: 'not-an-email' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('email')
  })

  it('returns 400 for empty cart', async () => {
    const res = await ordersPost(makeRequest('http://localhost/api/orders', { ...validOrderPayload, items: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing address', async () => {
    const res = await ordersPost(makeRequest('http://localhost/api/orders', { ...validOrderPayload, customerAddress: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json'
    })
    const res = await ordersPost(req)
    expect(res.status).toBe(400)
  })
})

// ─── Payment API ──────────────────────────────────────────────────────────────

describe('POST /api/payment', () => {
  it('processes a valid payment', async () => {
    const res = await paymentPost(makeRequest('http://localhost/api/payment', {
      payment: validPayment,
      orderId: 'ORD-TESTORDER'
    }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.transactionId).toMatch(/^TXN-/)
  })

  it('returns 402 for a declined card', async () => {
    const res = await paymentPost(makeRequest('http://localhost/api/payment', {
      payment: { ...validPayment, cardNumber: '4000000000000002' },
      orderId: 'ORD-TEST'
    }))
    expect(res.status).toBe(402)
    const data = await res.json()
    expect(data.success).toBe(false)
    expect(data.error).toBe('Card declined by issuer')
  })

  it('returns 402 for insufficient funds', async () => {
    const res = await paymentPost(makeRequest('http://localhost/api/payment', {
      payment: { ...validPayment, cardNumber: '4000000000009995' },
      orderId: 'ORD-TEST'
    }))
    expect(res.status).toBe(402)
  })

  it('returns 400 for invalid card number', async () => {
    const res = await paymentPost(makeRequest('http://localhost/api/payment', {
      payment: { ...validPayment, cardNumber: '1234' },
      orderId: 'ORD-TEST'
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when orderId is missing', async () => {
    const res = await paymentPost(makeRequest('http://localhost/api/payment', {
      payment: validPayment
    }))
    expect(res.status).toBe(400)
  })
})
