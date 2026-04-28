import { NextResponse } from 'next/server'
import { CartItem } from '@/types'
import { validateCart, calculateOrderTotals, createOrder } from '@/lib/order-utils'
import { apiLogger } from '@/lib/logger'

// In-memory store (replace with DB in production)
const orders: ReturnType<typeof createOrder>[] = []

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, customerName, customerEmail, customerAddress } = body as {
      items: CartItem[]
      customerName: string
      customerEmail: string
      customerAddress: string
    }

    apiLogger.debug({ customerEmail, itemCount: items?.length }, 'POST /api/orders received')

    if (!customerName?.trim()) {
      apiLogger.warn({ customerEmail }, 'order rejected: missing name')
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }
    if (!customerEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      apiLogger.warn({ customerEmail }, 'order rejected: invalid email')
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!customerAddress?.trim()) {
      apiLogger.warn({ customerEmail }, 'order rejected: missing address')
      return NextResponse.json({ error: 'Delivery address is required' }, { status: 400 })
    }

    const cartErrors = validateCart(items)
    if (cartErrors.length > 0) {
      apiLogger.warn({ cartErrors }, 'order rejected: cart validation failed')
      return NextResponse.json({ error: cartErrors.join(', ') }, { status: 400 })
    }

    const order = createOrder(items, customerName, customerEmail, customerAddress)
    orders.push(order)

    apiLogger.info({ orderId: order.id, total: order.total }, 'order created')
    return NextResponse.json({ order }, { status: 201 })
  } catch (err) {
    apiLogger.error({ err }, 'POST /api/orders unhandled error')
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function GET() {
  apiLogger.debug({ count: orders.length }, 'GET /api/orders')
  return NextResponse.json({ orders, total: orders.length })
}
