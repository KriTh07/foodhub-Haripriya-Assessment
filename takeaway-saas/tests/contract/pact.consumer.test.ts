/**
 * Pact Consumer Contract Tests
 *
 * These tests define the contract between the Grub frontend (consumer)
 * and the Grub API (provider). Pact generates a pact file in /pacts that
 * the provider verification step uses to confirm the API honours the contract.
 *
 * Run: npm run test:contract
 */

import path from 'path'
import { PactV3, MatchersV3 } from '@pact-foundation/pact'
import { testLogger } from '@/lib/logger'

const { like, eachLike, string, integer, decimal, boolean: bool, regex } = MatchersV3

const provider = new PactV3({
  consumer: 'GrubUI',
  provider: 'GrubAPI',
  dir: path.resolve(__dirname, '../../pacts'),
  logLevel: 'warn'
})

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const menuItemShape = like({
  id: string('M001'),
  name: string('Butter Chicken'),
  description: string('Tender chicken in rich tomato-butter gravy, served with naan'),
  price: integer(280),
  category: string('mains'),
  available: bool(true),
  imageEmoji: string('🍛'),
  imageUrl: string('https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop')
})

const cartItem = {
  menuItem: {
    id: 'M001',
    name: 'Butter Chicken',
    description: 'Tender chicken in rich tomato-butter gravy',
    price: 280,
    category: 'mains',
    available: true,
    imageEmoji: '🍛'
  },
  quantity: 1
}

const validPayment = {
  cardNumber: '4242424242424242',
  cardholderName: 'Jane Smith',
  expiryDate: '12/30',
  cvv: '123'
}

// ─── GET /api/menu ─────────────────────────────────────────────────────────────

describe('Pact: GET /api/menu', () => {
  test('returns a list of menu items', async () => {
    testLogger.info('pact: defining GET /api/menu interaction')

    await provider
      .addInteraction({
        states: [{ description: 'menu items exist' }],
        uponReceiving: 'a request for all menu items',
        withRequest: {
          method: 'GET',
          path: '/api/menu'
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            items: eachLike(menuItemShape),
            total: integer(1)
          }
        }
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/api/menu`)
        const data = await res.json()
        expect(res.status).toBe(200)
        expect(Array.isArray(data.items)).toBe(true)
        expect(data.items.length).toBeGreaterThan(0)
        expect(data.total).toBeGreaterThan(0)
      })
  })

  test('filters by category', async () => {
    await provider
      .addInteraction({
        states: [{ description: 'menu items exist' }],
        uponReceiving: 'a request for mains only',
        withRequest: {
          method: 'GET',
          path: '/api/menu',
          query: { category: 'mains' }
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            items: eachLike(like({ ...menuItemShape, category: string('mains') })),
            total: integer(1)
          }
        }
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/api/menu?category=mains`)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.items.every((i: { category: string }) => i.category === 'mains')).toBe(true)
      })
  })
})

// ─── POST /api/orders ──────────────────────────────────────────────────────────

describe('Pact: POST /api/orders', () => {
  test('creates an order with valid payload', async () => {
    testLogger.info('pact: defining POST /api/orders interaction')

    await provider
      .addInteraction({
        states: [{ description: 'order can be created' }],
        uponReceiving: 'a valid order creation request',
        withRequest: {
          method: 'POST',
          path: '/api/orders',
          headers: { 'Content-Type': 'application/json' },
          body: {
            items: [cartItem],
            customerName: 'Jane Smith',
            customerEmail: 'jane@example.com',
            customerAddress: '123 Main St, London, W1A 1AA'
          }
        },
        willRespondWith: {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
          body: {
            order: like({
              id: regex(/^ORD-[A-Z0-9]+$/, 'ORD-ABCD1234'),
              status: string('confirmed'),
              customerName: string('Jane Smith'),
              customerEmail: string('jane@example.com'),
              subtotal: integer(280),
              tax: integer(14),
              deliveryFee: integer(40),
              total: integer(334),
              createdAt: string('2024-01-01T00:00:00.000Z')
            })
          }
        }
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [cartItem],
            customerName: 'Jane Smith',
            customerEmail: 'jane@example.com',
            customerAddress: '123 Main St, London, W1A 1AA'
          })
        })
        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.order.id).toMatch(/^ORD-/)
        expect(data.order.status).toBe('confirmed')
      })
  })

  test('returns 400 for missing customer name', async () => {
    await provider
      .addInteraction({
        states: [{ description: 'order validation is active' }],
        uponReceiving: 'an order request with missing customer name',
        withRequest: {
          method: 'POST',
          path: '/api/orders',
          headers: { 'Content-Type': 'application/json' },
          body: {
            items: [cartItem],
            customerName: '',
            customerEmail: 'jane@example.com',
            customerAddress: '123 Main St'
          }
        },
        willRespondWith: {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: { error: string('Customer name is required') }
        }
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [cartItem],
            customerName: '',
            customerEmail: 'jane@example.com',
            customerAddress: '123 Main St'
          })
        })
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toMatch(/name/i)
      })
  })
})

// ─── POST /api/payment ─────────────────────────────────────────────────────────

describe('Pact: POST /api/payment', () => {
  test('processes a successful payment', async () => {
    testLogger.info('pact: defining POST /api/payment success interaction')

    await provider
      .addInteraction({
        states: [{ description: 'payment gateway is available' }],
        uponReceiving: 'a valid payment request',
        withRequest: {
          method: 'POST',
          path: '/api/payment',
          headers: { 'Content-Type': 'application/json' },
          body: {
            payment: validPayment,
            orderId: 'ORD-PACTTEST'
          }
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            success: bool(true),
            transactionId: regex(/^TXN-[A-Z0-9]+$/, 'TXN-ABCD1234'),
            orderId: string('ORD-PACTTEST')
          }
        }
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/api/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment: validPayment, orderId: 'ORD-PACTTEST' })
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)
        expect(data.transactionId).toMatch(/^TXN-/)
      })
  })

  test('returns 402 for a declined card', async () => {
    await provider
      .addInteraction({
        states: [{ description: 'payment gateway is available' }],
        uponReceiving: 'a payment request with a declined card',
        withRequest: {
          method: 'POST',
          path: '/api/payment',
          headers: { 'Content-Type': 'application/json' },
          body: {
            payment: { ...validPayment, cardNumber: '4000000000000002' },
            orderId: 'ORD-PACTDECLINE'
          }
        },
        willRespondWith: {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
          body: {
            success: bool(false),
            error: string('Card declined by issuer')
          }
        }
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/api/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment: { ...validPayment, cardNumber: '4000000000000002' },
            orderId: 'ORD-PACTDECLINE'
          })
        })
        expect(res.status).toBe(402)
        const data = await res.json()
        expect(data.success).toBe(false)
        expect(data.error).toBe('Card declined by issuer')
      })
  })

  test('returns 400 when orderId is missing', async () => {
    await provider
      .addInteraction({
        states: [{ description: 'payment gateway is available' }],
        uponReceiving: 'a payment request without an orderId',
        withRequest: {
          method: 'POST',
          path: '/api/payment',
          headers: { 'Content-Type': 'application/json' },
          body: { payment: validPayment }
        },
        willRespondWith: {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: { error: string('Order ID is required') }
        }
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/api/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment: validPayment })
        })
        expect(res.status).toBe(400)
      })
  })
})
