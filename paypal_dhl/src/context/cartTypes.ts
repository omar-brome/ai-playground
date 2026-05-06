import type { Product } from '../data/products'
import type { CartItem } from '../types/cart'

export type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  shipping: number
  total: number
  addItem: (product: Product) => void
  removeItem: (id: string) => void
  updateQty: (id: string, quantity: number) => void
  clearCart: () => void
}
