import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import type { Product } from '../data/products'
import { CartContext } from './cartContextInstance'
import {
  CART_STORAGE_KEY,
  cartReducer,
  loadCart,
} from './cartReducer'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [], () => [])

  useEffect(() => {
    dispatch({ type: 'HYDRATE', payload: loadCart() })
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const itemCount = useMemo(
    () => items.reduce((n, i) => n + i.quantity, 0),
    [items],
  )

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items],
  )

  const shipping = 8
  const total = subtotal > 0 ? subtotal + shipping : 0

  const addItem = useCallback((product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product })
  }, [])

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } })
  }, [])

  const updateQty = useCallback((id: string, quantity: number) => {
    dispatch({
      type: 'UPDATE_QTY',
      payload: { id, quantity },
    })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
  }, [])

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      shipping,
      total,
      addItem,
      removeItem,
      updateQty,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      shipping,
      total,
      addItem,
      removeItem,
      updateQty,
      clearCart,
    ],
  )

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  )
}
