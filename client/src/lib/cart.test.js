import { describe, expect, it } from 'vitest'
import { cartCount, cartReducer, cartTotal, emptyCart } from './cart'

const burgerPlace = { id: 1, name: 'Burger' }
const pizzaPlace = { id: 2, name: 'Pizza' }
const burger = { id: 10, name: 'Classic', price: 18 }
const fries = { id: 11, name: 'Fries', price: 7 }

const add = (state, restaurant, item) => cartReducer(state, { type: 'add', restaurant, item })

describe('cartReducer', () => {
  it('adds items and increases the quantity of an existing item', () => {
    let cart = add(emptyCart, burgerPlace, burger)
    cart = add(cart, burgerPlace, burger)
    cart = add(cart, burgerPlace, fries)
    expect(cart.restaurant).toEqual(burgerPlace)
    expect(cart.items).toEqual([
      { ...burger, quantity: 2 },
      { ...fries, quantity: 1 },
    ])
    expect(cartCount(cart)).toBe(3)
    expect(cartTotal(cart)).toBe(43)
  })

  it('starts a new cart when adding from a different restaurant', () => {
    let cart = add(emptyCart, burgerPlace, burger)
    cart = add(cart, pizzaPlace, { id: 20, name: 'Margherita', price: 25 })
    expect(cart.restaurant.id).toBe(2)
    expect(cart.items).toHaveLength(1)
  })

  it('changes quantity, removes at zero, and empties the cart', () => {
    let cart = add(add(emptyCart, burgerPlace, burger), burgerPlace, fries)
    cart = cartReducer(cart, { type: 'setQuantity', id: burger.id, quantity: 5 })
    expect(cart.items[0].quantity).toBe(5)
    cart = cartReducer(cart, { type: 'setQuantity', id: burger.id, quantity: 0 })
    expect(cart.items.map((i) => i.id)).toEqual([fries.id])
    cart = cartReducer(cart, { type: 'setQuantity', id: fries.id, quantity: 0 })
    expect(cart).toEqual(emptyCart)
  })

  it('caps the quantity at 50 and supports clear', () => {
    let cart = add(emptyCart, burgerPlace, burger)
    cart = cartReducer(cart, { type: 'setQuantity', id: burger.id, quantity: 999 })
    expect(cart.items[0].quantity).toBe(50)
    expect(cartReducer(cart, { type: 'clear' })).toEqual(emptyCart)
  })
})
