// Cart state logic, kept separate from React so it is easy to test.
// The cart holds items from ONE restaurant at a time (one order = one restaurant).
export const emptyCart = { restaurant: null, items: [] }
export const MAX_QUANTITY = 50

export function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { restaurant, item } = action
      const items = state.restaurant?.id === restaurant.id ? state.items : []
      const existing = items.find((i) => i.id === item.id)
      return {
        restaurant: { id: restaurant.id, name: restaurant.name },
        items: existing
          ? items.map((i) => (i.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QUANTITY) } : i))
          : [...items, { id: item.id, name: item.name, price: item.price, ...(item.imageUrl && { imageUrl: item.imageUrl }), quantity: 1 }],
      }
    }
    case 'setQuantity': {
      const items = state.items
        .map((i) => (i.id === action.id ? { ...i, quantity: Math.min(action.quantity, MAX_QUANTITY) } : i))
        .filter((i) => i.quantity > 0)
      return items.length ? { ...state, items } : emptyCart
    }
    case 'clear':
      return emptyCart
    default:
      return state
  }
}

export const cartCount = (cart) => cart.items.reduce((n, i) => n + i.quantity, 0)
export const cartTotal = (cart) => cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
