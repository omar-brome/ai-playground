import type { Product } from '../data/products'
import type { CartItem } from '../types/cart'

export const CART_STORAGE_KEY = 'lumiere_cart_v1'

export type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QTY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE'; payload: CartItem[] }

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload
    case 'ADD_ITEM': {
      const id = action.payload.id
      const existing = state.find((i) => i.product.id === id)
      if (existing) {
        return state.map((i) =>
          i.product.id === id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [...state, { product: action.payload, quantity: 1 }]
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i.product.id !== action.payload.id)
    case 'UPDATE_QTY': {
      const { id, quantity } = action.payload
      if (quantity < 1) return state.filter((i) => i.product.id !== id)
      return state.map((i) =>
        i.product.id === id ? { ...i, quantity } : i,
      )
    }
    case 'CLEAR_CART':
      return []
    default:
      return state
  }
}

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
