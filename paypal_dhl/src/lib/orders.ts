import type { CartItem } from '../types/cart'

export type StoredOrder = {
  orderId: string
  paypalOrderId: string
  payerID?: string
  items: CartItem[]
  total: number
  status: 'paid'
  trackingNumber: string
  createdAt: string
}

const ORDERS_KEY = 'lumiere_orders_v1'

function readOrders(): StoredOrder[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredOrder[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeOrders(orders: StoredOrder[]) {
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

export function appendOrder(order: StoredOrder): void {
  const next = [...readOrders(), order]
  writeOrders(next)
}

export function getOrderById(orderId: string): StoredOrder | undefined {
  return readOrders().find((o) => o.orderId === orderId)
}
