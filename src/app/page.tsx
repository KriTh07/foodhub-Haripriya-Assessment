'use client'

import { useState, useCallback } from 'react'
import { MenuItem, CartItem, CheckoutFormData, Order } from '@/types'
import { MENU_ITEMS, TAX_RATE, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/menu-data'
import { calculateOrderTotals, validatePayment, isCardExpired } from '@/lib/order-utils'
import styles from './page.module.css'

type Step = 'menu' | 'cart' | 'checkout' | 'confirmation'
type Category = 'all' | 'starters' | 'mains' | 'desserts' | 'drinks'

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '🍽️' },
  { id: 'starters', label: 'Starters', emoji: '🥗' },
  { id: 'mains', label: 'Mains', emoji: '🍔' },
  { id: 'desserts', label: 'Desserts', emoji: '🍰' },
  { id: 'drinks', label: 'Drinks', emoji: '🥤' }
]

function formatPrice(p: number) {
  return `₹${p.toFixed(2)}`
}

export default function App() {
  const [step, setStep] = useState<Step>('menu')
  const [cart, setCart] = useState<CartItem[]>([])
  const [category, setCategory] = useState<Category>('all')
  const [form, setForm] = useState<CheckoutFormData>({
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    payment: { cardNumber: '', cardholderName: '', expiryDate: '', cvv: '' }
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)
  const [confirmedTxn, setConfirmedTxn] = useState<string>('')
  const [paymentError, setPaymentError] = useState('')

  const filteredMenu = MENU_ITEMS.filter(i => category === 'all' || i.category === category)

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const getQty = (id: string) => cart.find(i => i.menuItem.id === id)?.quantity ?? 0

  const addItem = useCallback((item: MenuItem) => {
    if (!item.available) return
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id)
      if (existing) return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { menuItem: item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === id)
      if (existing && existing.quantity > 1) return prev.map(i => i.menuItem.id === id ? { ...i, quantity: i.quantity - 1 } : i)
      return prev.filter(i => i.menuItem.id !== id)
    })
  }, [])

  const removeAll = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.menuItem.id !== id))
  }, [])

  const totals = calculateOrderTotals(cart)

  const updateField = (field: string, value: string) => {
    if (field.startsWith('payment.')) {
      const key = field.replace('payment.', '') as keyof CheckoutFormData['payment']
      setForm(f => ({ ...f, payment: { ...f.payment, [key]: value } }))
    } else {
      setForm(f => ({ ...f, [field]: value }))
    }
    setFormErrors(e => { const n = { ...e }; delete n[field]; return n })
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.customerName.trim()) errors.customerName = 'Name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) errors.customerEmail = 'Valid email required'
    if (!form.customerAddress.trim()) errors.customerAddress = 'Address is required'
    const payErrors = validatePayment(form.payment)
    if (payErrors.length) {
      payErrors.forEach(e => {
        if (e.includes('Card number')) errors['payment.cardNumber'] = e
        if (e.includes('Cardholder')) errors['payment.cardholderName'] = e
        if (e.includes('Expiry')) errors['payment.expiryDate'] = e
        if (e.includes('CVV')) errors['payment.cvv'] = e
      })
    }
    if (!Object.keys(errors).some(k => k.startsWith('payment')) && isCardExpired(form.payment.expiryDate)) {
      errors['payment.expiryDate'] = 'Card has expired'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCheckout = async () => {
    if (!validateForm()) return
    setProcessing(true)
    setPaymentError('')
    try {
      // Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerAddress: form.customerAddress
        })
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error)

      // Process payment
      const payRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment: form.payment, orderId: orderData.order.id })
      })
      const payData = await payRes.json()
      if (!payRes.ok) {
        setPaymentError(payData.error || 'Payment failed. Please try again.')
        setProcessing(false)
        return
      }

      setConfirmedOrder(orderData.order)
      setConfirmedTxn(payData.transactionId)
      setStep('confirmation')
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setProcessing(false)
    }
  }

  const startOver = () => {
    setCart([])
    setForm({ customerName: '', customerEmail: '', customerAddress: '', payment: { cardNumber: '', cardholderName: '', expiryDate: '', cvv: '' } })
    setStep('menu')
    setConfirmedOrder(null)
    setPaymentError('')
  }

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header} data-testid="header">
        <div className={styles.logo} onClick={startOver}>
          <span className={styles.logoMark}>G</span>
          <span className={styles.logoText}>rub</span>
        </div>
        <nav className={styles.steps}>
          {(['menu', 'cart', 'checkout'] as Step[]).map((s, i) => (
            <div key={s} className={`${styles.stepDot} ${step === s || (step === 'confirmation' && i < 3) ? styles.active : ''} ${(step === 'cart' && i === 0) || (step === 'checkout' && i <= 1) || step === 'confirmation' ? styles.done : ''}`}>
              <span>{i + 1}</span>
            </div>
          ))}
        </nav>
        {step === 'menu' && (
          <button className={styles.cartBtn} onClick={() => cart.length && setStep('cart')} data-testid="cart-button" aria-label={`Cart with ${cartCount} items`}>
            🛒 {cartCount > 0 && <span className={styles.badge} data-testid="cart-count">{cartCount}</span>}
            {totals.subtotal > 0 && <span className={styles.cartTotal}>{formatPrice(totals.subtotal)}</span>}
          </button>
        )}
      </header>

      <main className={styles.main}>

        {/* ── MENU ── */}
        {step === 'menu' && (
          <div className={styles.menuView} data-testid="menu-page">
            <div className={styles.hero}>
              <h1 className={styles.heroTitle}>Fresh food,<br /><em>fast delivery</em></h1>
              <p className={styles.heroSub}>Free delivery on orders over {formatPrice(FREE_DELIVERY_THRESHOLD)}</p>
            </div>

            <div className={styles.categoryBar} role="tablist" aria-label="Menu categories">
              {CATEGORIES.map(c => (
                <button key={c.id} role="tab" aria-selected={category === c.id} aria-label={c.label} className={`${styles.catBtn} ${category === c.id ? styles.catActive : ''}`} onClick={() => setCategory(c.id)} data-testid={`category-${c.id}`}>
                  <span>{c.emoji}</span> {c.label}
                </button>
              ))}
            </div>

            <div className={styles.menuGrid} data-testid="menu-grid">
              {filteredMenu.map((item, idx) => {
                const qty = getQty(item.id)
                return (
                  <div key={item.id} className={`${styles.menuCard} ${!item.available ? styles.unavailable : ''} fade-up`} style={{ animationDelay: `${idx * 0.05}s` }} data-testid={`menu-item-${item.id}`}>
                      <div className={styles.cardEmoji}>{item.imageEmoji}</div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTop}>
                        <h2 className={styles.cardName}>{item.name}</h2>
                        {!item.available && <span className={styles.unavailableBadge}>Sold out</span>}
                      </div>
                      <p className={styles.cardDesc}>{item.description}</p>
                      <div className={styles.cardFooter}>
                        <span className={styles.cardPrice} data-testid={`price-${item.id}`}>{formatPrice(item.price)}</span>
                        {item.available && (
                          qty === 0 ? (
                            <button className={styles.addBtn} onClick={() => addItem(item)} data-testid={`add-${item.id}`} aria-label={`Add ${item.name} to cart`}>
                              Add +
                            </button>
                          ) : (
                            <div className={styles.qtyControls} data-testid={`qty-controls-${item.id}`}>
                              <button onClick={() => removeItem(item.id)} data-testid={`dec-${item.id}`} aria-label="Decrease quantity">−</button>
                              <span data-testid={`qty-${item.id}`}>{qty}</span>
                              <button onClick={() => addItem(item)} data-testid={`inc-${item.id}`} aria-label="Increase quantity">+</button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {cart.length > 0 && (
              <div className={styles.floatingBar} data-testid="floating-cart-bar">
                <span>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
                <button className={styles.floatingBtn} onClick={() => setStep('cart')} data-testid="view-cart-btn">
                  View cart → {formatPrice(totals.subtotal)}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CART ── */}
        {step === 'cart' && (
          <div className={styles.cartView} data-testid="cart-page">
            <h1 className={styles.srOnly}>Cart</h1>
            <div className={styles.pageHeader}>
              <button className={styles.backBtn} onClick={() => setStep('menu')} data-testid="back-to-menu">← Menu</button>
              <h2>Your Order</h2>
            </div>

            {cart.length === 0 ? (
              <div className={styles.emptyCart} data-testid="empty-cart">
                <p>Your cart is empty</p>
                <button onClick={() => setStep('menu')}>Browse menu</button>
              </div>
            ) : (
              <>
                <ul className={styles.cartList} role="list" data-testid="cart-items">
                  {cart.map(item => (
                    <li key={item.menuItem.id} className={styles.cartItem} data-testid={`cart-item-${item.menuItem.id}`}>
                      <span className={styles.cartEmoji}>{item.menuItem.imageEmoji}</span>
                      <div className={styles.cartItemInfo}>
                        <span className={styles.cartItemName}>{item.menuItem.name}</span>
                        <span className={styles.cartItemPrice}>{formatPrice(item.menuItem.price)} each</span>
                      </div>
                      <div className={styles.cartQty}>
                        <button onClick={() => removeItem(item.menuItem.id)} data-testid={`cart-dec-${item.menuItem.id}`}>−</button>
                        <span data-testid={`cart-qty-${item.menuItem.id}`}>{item.quantity}</span>
                        <button onClick={() => addItem(item.menuItem)} data-testid={`cart-inc-${item.menuItem.id}`}>+</button>
                      </div>
                      <span className={styles.cartLineTotal} data-testid={`cart-line-${item.menuItem.id}`}>{formatPrice(item.menuItem.price * item.quantity)}</span>
                      <button className={styles.removeBtn} onClick={() => removeAll(item.menuItem.id)} data-testid={`remove-${item.menuItem.id}`} aria-label={`Remove ${item.menuItem.name}`}>✕</button>
                    </li>
                  ))}
                </ul>

                <div className={styles.orderSummary} data-testid="order-summary">
                  <div className={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span data-testid="subtotal">{formatPrice(totals.subtotal)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Tax (GST 5%)</span>
                    <span data-testid="tax">{formatPrice(totals.tax)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Delivery {totals.deliveryFee === 0 && <span className={styles.freeTag}>FREE</span>}</span>
                    <span data-testid="delivery-fee">{totals.deliveryFee === 0 ? 'Free' : formatPrice(totals.deliveryFee)}</span>
                  </div>
                  {totals.deliveryFee > 0 && (
                    <p className={styles.freeDeliveryHint}>Add {formatPrice(FREE_DELIVERY_THRESHOLD - totals.subtotal)} more for free delivery</p>
                  )}
                  <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                    <span>Total</span>
                    <span data-testid="order-total">{formatPrice(totals.total)}</span>
                  </div>
                  <button className={styles.checkoutBtn} onClick={() => setStep('checkout')} data-testid="proceed-to-checkout">
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── CHECKOUT ── */}
        {step === 'checkout' && (
          <div className={styles.checkoutView} data-testid="checkout-page">
            <div className={styles.pageHeader}>
              <button className={styles.backBtn} onClick={() => setStep('cart')} data-testid="back-to-cart">← Cart</button>
              <h2>Checkout</h2>
            </div>

            <div className={styles.checkoutGrid}>
              <div className={styles.checkoutForm}>
                <section className={styles.formSection}>
                  <h3>Delivery Details</h3>
                  <div className={styles.field}>
                    <label htmlFor="name">Full Name</label>
                    <input id="name" type="text" placeholder="Jane Smith" value={form.customerName} onChange={e => updateField('customerName', e.target.value)} data-testid="input-name" className={formErrors.customerName ? styles.inputError : ''} aria-describedby={formErrors.customerName ? 'name-error' : undefined} />
                    {formErrors.customerName && <span id="name-error" className={styles.errorMsg} data-testid="error-name" role="alert">{formErrors.customerName}</span>}
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" placeholder="jane@example.com" value={form.customerEmail} onChange={e => updateField('customerEmail', e.target.value)} data-testid="input-email" className={formErrors.customerEmail ? styles.inputError : ''} />
                    {formErrors.customerEmail && <span className={styles.errorMsg} data-testid="error-email" role="alert">{formErrors.customerEmail}</span>}
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="address">Delivery Address</label>
                    <textarea id="address" placeholder="123 Main St, City, Postcode" value={form.customerAddress} onChange={e => updateField('customerAddress', e.target.value)} data-testid="input-address" className={formErrors.customerAddress ? styles.inputError : ''} rows={2} />
                    {formErrors.customerAddress && <span className={styles.errorMsg} data-testid="error-address" role="alert">{formErrors.customerAddress}</span>}
                  </div>
                </section>

                <section className={styles.formSection}>
                  <h3>Payment <span className={styles.mockBadge}>Test Mode</span></h3>
                  <p className={styles.testCards}>Test cards: <code>4242 4242 4242 4242</code> (success) · <code>4000 0000 0000 0002</code> (decline)</p>
                  <div className={styles.field}>
                    <label htmlFor="cardNumber">Card Number</label>
                    <input id="cardNumber" type="text" placeholder="4242 4242 4242 4242" maxLength={19} value={form.payment.cardNumber} onChange={e => updateField('payment.cardNumber', e.target.value.replace(/[^\d\s]/g, ''))} data-testid="input-card-number" className={formErrors['payment.cardNumber'] ? styles.inputError : ''} />
                    {formErrors['payment.cardNumber'] && <span className={styles.errorMsg} data-testid="error-card-number" role="alert">{formErrors['payment.cardNumber']}</span>}
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="cardName">Cardholder Name</label>
                    <input id="cardName" type="text" placeholder="Jane Smith" value={form.payment.cardholderName} onChange={e => updateField('payment.cardholderName', e.target.value)} data-testid="input-cardholder" className={formErrors['payment.cardholderName'] ? styles.inputError : ''} />
                    {formErrors['payment.cardholderName'] && <span className={styles.errorMsg} data-testid="error-cardholder" role="alert">{formErrors['payment.cardholderName']}</span>}
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label htmlFor="expiry">Expiry (MM/YY)</label>
                      <input id="expiry" type="text" placeholder="12/27" maxLength={5} value={form.payment.expiryDate} onChange={e => updateField('payment.expiryDate', e.target.value)} data-testid="input-expiry" className={formErrors['payment.expiryDate'] ? styles.inputError : ''} />
                      {formErrors['payment.expiryDate'] && <span className={styles.errorMsg} data-testid="error-expiry" role="alert">{formErrors['payment.expiryDate']}</span>}
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="cvv">CVV</label>
                      <input id="cvv" type="text" placeholder="123" maxLength={4} value={form.payment.cvv} onChange={e => updateField('payment.cvv', e.target.value.replace(/\D/g, ''))} data-testid="input-cvv" className={formErrors['payment.cvv'] ? styles.inputError : ''} />
                      {formErrors['payment.cvv'] && <span className={styles.errorMsg} data-testid="error-cvv" role="alert">{formErrors['payment.cvv']}</span>}
                    </div>
                  </div>
                </section>

                {paymentError && (
                  <div className={styles.paymentErrorBox} data-testid="payment-error" role="alert">
                    ⚠️ {paymentError}
                  </div>
                )}

                <button className={`${styles.checkoutBtn} ${processing ? styles.processing : ''}`} onClick={handleCheckout} disabled={processing} data-testid="place-order-btn">
                  {processing ? <><span className={styles.spinner} />Processing…</> : `Pay ${formatPrice(totals.total)}`}
                </button>
              </div>

              <aside className={styles.orderSidebar}>
                <h3>Order Summary</h3>
                <ul className={styles.sidebarItems}>
                  {cart.map(i => (
                    <li key={i.menuItem.id} data-testid={`summary-item-${i.menuItem.id}`}>
                      <span>{i.menuItem.imageEmoji} {i.menuItem.name} ×{i.quantity}</span>
                      <span>{formatPrice(i.menuItem.price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className={styles.sidebarTotals}>
                  <div><span>Subtotal</span><span>{formatPrice(totals.subtotal)}</span></div>
                  <div><span>Tax</span><span>{formatPrice(totals.tax)}</span></div>
                  <div><span>Delivery</span><span>{totals.deliveryFee === 0 ? 'Free' : formatPrice(totals.deliveryFee)}</span></div>
                  <div className={styles.sidebarTotal}><span>Total</span><span data-testid="checkout-total">{formatPrice(totals.total)}</span></div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* ── CONFIRMATION ── */}
        {step === 'confirmation' && confirmedOrder && (
          <div className={styles.confirmView} data-testid="confirmation-page">
            <div className={styles.confirmCard}>
              <div className={styles.confirmIcon}>✓</div>
              <h2 data-testid="confirmation-title">Order Confirmed!</h2>
              <p className={styles.confirmSub}>Your food is being prepared</p>
              <div className={styles.confirmDetails}>
                <div><span>Order ID</span><strong data-testid="order-id">{confirmedOrder.id}</strong></div>
                <div><span>Transaction</span><strong data-testid="transaction-id">{confirmedTxn}</strong></div>
                <div><span>Delivery to</span><strong>{confirmedOrder.customerAddress}</strong></div>
                <div><span>Total paid</span><strong data-testid="confirmed-total">{formatPrice(confirmedOrder.total)}</strong></div>
              </div>
              <div className={styles.estimateBar}>
                <span>🕐 Estimated delivery: 30–45 mins</span>
              </div>
              <button className={styles.checkoutBtn} onClick={startOver} data-testid="order-again-btn">
                Order Again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
