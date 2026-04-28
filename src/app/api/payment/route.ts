import { NextResponse } from 'next/server'
import { PaymentDetails } from '@/types'
import { validatePayment, mockProcessPayment } from '@/lib/order-utils'
import { apiLogger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { payment, orderId } = body as { payment: PaymentDetails; orderId: string }

    apiLogger.debug({ orderId }, 'POST /api/payment received')

    if (!orderId) {
      apiLogger.warn('payment rejected: missing orderId')
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const validationErrors = validatePayment(payment)
    if (validationErrors.length > 0) {
      apiLogger.warn({ orderId, validationErrors }, 'payment rejected: validation failed')
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 })
    }

    // Simulate processing time — injectable for test environments
    const delay = parseInt(process.env.PAYMENT_DELAY_MS ?? '800', 10)
    await new Promise(resolve => setTimeout(resolve, delay))

    const result = mockProcessPayment(payment)

    if (!result.success) {
      apiLogger.warn({ orderId, reason: result.errorMessage }, 'payment declined')
      return NextResponse.json({ success: false, error: result.errorMessage }, { status: 402 })
    }

    apiLogger.info({ orderId, transactionId: result.transactionId }, 'payment successful')
    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      orderId
    })
  } catch (err) {
    apiLogger.error({ err }, 'POST /api/payment unhandled error')
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
