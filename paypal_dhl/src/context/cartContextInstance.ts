import { createContext } from 'react'
import type { CartContextValue } from './cartTypes'

export const CartContext = createContext<CartContextValue | null>(null)
