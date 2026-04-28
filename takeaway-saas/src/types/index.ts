export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: 'starters' | 'mains' | 'desserts' | 'drinks'
  available: boolean
  imageEmoji: string
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}

export interface Order {
  id: string
  items: CartItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
  status: OrderStatus
  createdAt: string
  customerName: string
  customerEmail: string
  customerAddress: string
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export interface PaymentDetails {
  cardNumber: string
  cardholderName: string
  expiryDate: string
  cvv: string
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  errorMessage?: string
}

export interface CheckoutFormData {
  customerName: string
  customerEmail: string
  customerAddress: string
  payment: PaymentDetails
}
