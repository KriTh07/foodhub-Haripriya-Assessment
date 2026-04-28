/**
 * API tests using supertest against the Next.js dev server.
 *
 * These complement the integration handler tests by exercising the full
 * HTTP stack: routing, middleware, serialisation, and status codes.
 *
 * Run: npm run test:api  (requires the server to be running on port 3000)
 * In CI the server is started via the `webServer` block in jest config.
 */

import request from 'supertest'
import { testLogger } from '@/lib/logger'

const BASE = process.env.API_BASE_URL || 'http://localhost:3000'
const api = request(BASE)

const validCart = [
  {
    menuItem: {
      id: 'M001',
      name: 'Classic Burger',
      description: 'Beef patty',
      price: 12.99,
      category: 'mains',
      available: true,
      imageEmoji: '🍔'
    },
    quantity: 1
  }
]

const validOrderBody = {
  items: validCart,
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

// ─── GET /api/menu ─────────────────────────────────────────────────────────────

describe('GET /api/menu', () => {
  it('returns 200 with all items', async () => {
    testLogger.info('testing GET /api/menu')
    const res = await api.get('/api/menu')
    expect(res.status).toBe(200)
    expect(res.body.items).toBeInstanceOf(Array)
    expect(res.body.items.length).toBeGreaterThan(0)
    expect(res.body.total).toBe(res.body.items.length)
  })

  it('filters by category=mains', async () => {
    const res = await api.get('/api/menu?category=mains')
    expect(res.status).toBe(200)
    expect(res.body.items.every((i: { category: string }) => i.category === 'mains')).toBe(true)
  })

  it('filters by available=true', async () => {
    const res = await api.get('/api/menu?available=true')
    expect(res.status).toBe(200)
    expect(res.body.items.every((i: { available: boolean }) => i.available)).toBe(true)
  })

  it('combines category and available filters', async () => {
    const res = await api.get('/api/menu?category=mains&available=true')
    expect(res.status).toBe(200)
    res.body.items.forEach((i: { category: string; available: boolean }) => {
      expect(i.category).toBe('mains')
      expect(i.available).toBe(true)
    })
  })

  it('returns correct shape per item', async () => {
    const res = await api.get('/api/menu')
    const item = res.body.items[0]
    expect(item).toHaveProperty('id')
    expect(item).toHaveProperty('name')
    expect(item).toHaveProperty('price')
    expect(item).toHaveProperty('category')
    expect(item).toHaveProperty('available')
  })
})

// ─── POST /api/orders ──────────────────────────────────────────────────────────

describe('POST /api/orders', () => {
  it('creates an order and returns 201', async () => {
    testLogger.info('testing POST /api/orders - happy path')
    const res = await api.post('/api/orders').send(validOrderBody)
    expect(res.status).toBe(201)
    expect(res.body.order.id).toMatch(/^ORD-/)
    expect(res.body.order.status).toBe('confirmed')
    expect(res.body.order.customerName).toBe('Jane Smith')
    expect(res.body.order.total).toBeGreaterThan(0)
  })

  it('returns 400 for missing name', async () => {
    const res = await api.post('/api/orders').send({ ...validOrderBody, customerName: '' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/name/i)
  })

  it('returns 400 for invalid email', async () => {
    const res = await api.post('/api/orders').send({ ...validOrderBody, customerEmail: 'bad' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/email/i)
  })

  it('returns 400 for missing address', async () => {
    const res = await api.post('/api/orders').send({ ...validOrderBody, customerAddress: '' })
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty cart', async () => {
    const res = await api.post('/api/orders').send({ ...validOrderBody, items: [] })
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON', async () => {
    const res = await api
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send('not-json')
    expect(res.status).toBe(400)
  })

  it('response includes calculated totals', async () => {
    const res = await api.post('/api/orders').send(validOrderBody)
    expect(res.status).toBe(201)
    const { subtotal, tax, deliveryFee, total } = res.body.order
    expect(subtotal).toBeCloseTo(12.99)
    expect(tax).toBeGreaterThan(0)
    expect(deliveryFee).toBeGreaterThan(0)
    expect(total).toBeCloseTo(subtotal + tax + deliveryFee, 1)
  })
})

// ─── POST /api/payment ─────────────────────────────────────────────────────────

describe('POST /api/payment', () => {
  it('processes a valid payment and returns 200', async () => {
    testLogger.info('testing POST /api/payment - success')
    const res = await api.post('/api/payment').send({
      payment: validPayment,
      orderId: 'ORD-APITEST1'
    })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.transactionId).toMatch(/^TXN-/)
    expect(res.body.orderId).toBe('ORD-APITEST1')
  })

  it('returns 402 for declined card', async () => {
    const res = await api.post('/api/payment').send({
      payment: { ...validPayment, cardNumber: '4000000000000002' },
      orderId: 'ORD-APITEST2'
    })
    expect(res.status).toBe(402)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('Card declined by issuer')
  })

  it('returns 402 for insufficient funds', async () => {
    const res = await api.post('/api/payment').send({
      payment: { ...validPayment, cardNumber: '4000000000009995' },
      orderId: 'ORD-APITEST3'
    })
    expect(res.status).toBe(402)
    expect(res.body.error).toMatch(/funds/i)
  })

  it('returns 400 for invalid card number', async () => {
    const res = await api.post('/api/payment').send({
      payment: { ...validPayment, cardNumber: '1234' },
      orderId: 'ORD-APITEST4'
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when orderId is missing', async () => {
    const res = await api.post('/api/payment').send({ payment: validPayment })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/order id/i)
  })

  it('returns 400 for missing cardholder name', async () => {
    const res = await api.post('/api/payment').send({
      payment: { ...validPayment, cardholderName: '' },
      orderId: 'ORD-APITEST5'
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid expiry format', async () => {
    const res = await api.post('/api/payment').send({
      payment: { ...validPayment, expiryDate: '1299' },
      orderId: 'ORD-APITEST6'
    })
    expect(res.status).toBe(400)
  })
})
