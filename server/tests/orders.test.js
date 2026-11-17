import { api, auth, prisma, registerOwner, registerUser, resetDb } from './helpers.js'

let customer
let owner
let restaurant
let burger
let fries

beforeEach(async () => {
  await resetDb()
  customer = await registerUser()
  owner = await registerOwner()
  restaurant = await prisma.restaurant.findUnique({ where: { ownerId: owner.user.id } })
  burger = await prisma.menuItem.create({ data: { restaurantId: restaurant.id, name: 'Burger', price: 18.5 } })
  fries = await prisma.menuItem.create({ data: { restaurantId: restaurant.id, name: 'Fries', price: 7 } })
})
afterAll(() => prisma.$disconnect())

const orderBody = (overrides = {}) => ({
  restaurantId: restaurant.id,
  items: [
    { menuItemId: burger.id, quantity: 2 },
    { menuItemId: fries.id, quantity: 1 },
  ],
  deliveryAddress: 'Gaza, Al-Rimal street',
  phone: '0599123456',
  ...overrides,
})

const placeOrder = (overrides) => api().post('/api/orders').set(auth(customer.token)).send(orderBody(overrides))

describe('POST /api/orders', () => {
  it('places an order and calculates the total on the server', async () => {
    const res = await placeOrder()
    expect(res.status).toBe(201)
    expect(res.body.order).toMatchObject({ status: 'PENDING', total: 44, restaurant: { name: 'Test Restaurant' } })
    expect(res.body.order.items).toHaveLength(2)
    expect(res.body.order.items[0]).toMatchObject({ name: 'Burger', unitPrice: 18.5, quantity: 2 })
  })

  it('requires login', async () => {
    const res = await api().post('/api/orders').send(orderBody())
    expect(res.status).toBe(401)
  })

  it('does not let a restaurant owner place orders', async () => {
    const res = await api().post('/api/orders').set(auth(owner.token)).send(orderBody())
    expect(res.status).toBe(403)
  })

  it('rejects unavailable items and items from another restaurant', async () => {
    await prisma.menuItem.update({ where: { id: fries.id }, data: { isAvailable: false } })
    expect((await placeOrder()).status).toBe(400)

    const other = await registerOwner()
    const otherRestaurant = await prisma.restaurant.findUnique({ where: { ownerId: other.user.id } })
    const res = await placeOrder({ restaurantId: otherRestaurant.id, items: [{ menuItemId: burger.id, quantity: 1 }] })
    expect(res.status).toBe(400)
  })

  it('validates the delivery details and cart', async () => {
    const res = await placeOrder({ items: [], deliveryAddress: 'x', phone: '1' })
    expect(res.status).toBe(400)
    expect(res.body.details.map((d) => d.field).sort()).toEqual(['deliveryAddress', 'items', 'phone'])
  })
})

describe('GET /api/orders', () => {
  it("returns only the customer's own orders, newest first", async () => {
    const first = await placeOrder()
    const second = await placeOrder({ items: [{ menuItemId: fries.id, quantity: 3 }] })

    const someoneElse = await registerUser()
    await api().post('/api/orders').set(auth(someoneElse.token)).send(orderBody())

    const res = await api().get('/api/orders').set(auth(customer.token))
    expect(res.body.orders.map((o) => o.id)).toEqual([second.body.order.id, first.body.order.id])
  })
})

describe('GET /api/orders/:id', () => {
  it('is visible to the customer and the restaurant owner only', async () => {
    const { order } = (await placeOrder()).body
    const stranger = await registerUser()

    expect((await api().get(`/api/orders/${order.id}`).set(auth(customer.token))).status).toBe(200)
    expect((await api().get(`/api/orders/${order.id}`).set(auth(owner.token))).status).toBe(200)
    expect((await api().get(`/api/orders/${order.id}`).set(auth(stranger.token))).status).toBe(404)
    expect((await api().get('/api/orders/nope').set(auth(customer.token))).status).toBe(404)
  })

  it('keeps the item name and price after the menu item is deleted', async () => {
    const { order } = (await placeOrder()).body
    await prisma.menuItem.delete({ where: { id: burger.id } })

    const res = await api().get(`/api/orders/${order.id}`).set(auth(customer.token))
    expect(res.body.order.items.find((i) => i.name === 'Burger')).toMatchObject({ unitPrice: 18.5, menuItemId: null })
  })
})
