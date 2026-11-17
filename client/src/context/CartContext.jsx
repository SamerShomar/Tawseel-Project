import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { cartCount, cartReducer, cartTotal, emptyCart } from '@/lib/cart'

const CART_KEY = 'tawseel_cart'

function load() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || emptyCart
  } catch {
    return emptyCart
  }
}

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart))
    } catch {
      // Storage can be unavailable (private mode); the cart still works for this visit.
    }
  }, [cart])

  const value = useMemo(
    () => ({
      ...cart,
      count: cartCount(cart),
      total: cartTotal(cart),
      add: (restaurant, item) => dispatch({ type: 'add', restaurant, item }),
      setQuantity: (id, quantity) => dispatch({ type: 'setQuantity', id, quantity }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [cart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext)
