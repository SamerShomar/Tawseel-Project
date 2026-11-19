import { api, auth, prisma, registerOwner, registerUser, resetDb } from './helpers.js'

let owner
let customer
let restaurant

beforeEach(async () => {
  await resetDb()
  owner = await registerOwner()
  customer = await registerUser()
  restaurant = await prisma.restaurant.findUnique({ where: { ownerId: owner.user.id } })
})
afterAll(() => prisma.$disconnect())

const asOwner = (method, url) => api()[method](url).set(auth(owner.token))

describe('access control', () => {
  it('blocks customers and anonymous users', async () => {
    expect((await api().get('/api/my-restaurant')).status).toBe(401)
    expect((await api().get('/api/my-restaurant').set(auth(customer.token))).status).toBe(403)
  })
})

describe('restaurant info', () => {
  it('returns and updates the restaurant', async () => {
    expect((await asOwner('get', '/api/my-restaurant')).body.restaurant.id).toBe(restaurant.id)

    const res = await asOwner('patch', '/api/my-restaurant').send({ description: 'Best food', category: 'Burgers', imageUrl: '' })
    expect(res.status).toBe(200)
    expect(res.body.restaurant).toMatchObject({ description: 'Best food', category: 'Burgers', imageUrl: null })
  })
})

describe('menu management', () => {
  it('adds, edits, lists and deletes menu items', async () => {
    const created = await asOwner('post', '/api/my-restaurant/menu').send({ name: 'Falafel', price: '4.5', category: 'Sandwiches' })
    expect(created.status).toBe(201)
    expect(created.body.menuItem).toMatchObject({ name: 'Falafel', price: 4.5, isAvailable: true })
    const id = created.body.menuItem.id

    const edited = await asOwner('patch', `/api/my-restaurant/menu/${id}`).send({ price: 5, isAvailable: false })
    expect(edited.body.menuItem).toMatchObject({ price: 5, isAvailable: false })

    const list = await asOwner('get', '/api/my-restaurant/menu')
    expect(list.body.menuItems).toHaveLength(1)

    expect((await asOwner('delete', `/api/my-restaurant/menu/${id}`)).status).toBe(204)
    expect((await asOwner('get', '/api/my-restaurant/menu')).body.menuItems).toHaveLength(0)
  })

  it('validates menu items', async () => {
    const res = await asOwner('post', '/api/my-restaurant/menu').send({ name: 'X', price: -1 })
    expect(res.status).toBe(400)
  })

  it("cannot touch another restaurant's items", async () => {
    const other = await registerOwner()
    const otherRestaurant = await prisma.restaurant.findUnique({ where: { ownerId: other.user.id } })
    const item = await prisma.menuItem.create({ data: { restaurantId: otherRestaurant.id, name: 'Theirs', price: 1 } })

    expect((await asOwner('patch', `/api/my-restaurant/menu/${item.id}`).send({ price: 2 })).status).toBe(404)
    expect((await asOwner('delete', `/api/my-restaurant/menu/${item.id}`)).status).toBe(404)
    expect((await asOwner('delete', '/api/my-restaurant/menu/abc')).status).toBe(404)
  })
})

describe('orders dashboard', () => {
  let order

  beforeEach(async () => {
    const item = await prisma.menuItem.create({ data: { restaurantId: restaurant.id, name: 'Burger', price: 10 } })
    const res = await api()
      .post('/api/orders')
      .set(auth(customer.token))
      .send({ restaurantId: restaurant.id, items: [{ menuItemId: item.id, quantity: 1 }], deliveryAddress: 'Gaza city', phone: '0599123456' })
    order = res.body.order
  })

  it('lists incoming orders, optionally filtered by status', async () => {
    const all = await asOwner('get', '/api/my-restaurant/orders')
    expect(all.body.orders).toHaveLength(1)
    expect(all.body.orders[0].customer.name).toBe(customer.user.name)

    const delivered = await asOwner('get', '/api/my-restaurant/orders?status=DELIVERED')
    expect(delivered.body.orders).toHaveLength(0)

    expect((await asOwner('get', '/api/my-restaurant/orders?status=WRONG')).status).toBe(400)
  })

  it('accepts and prepares, but pickup and delivery are left to the driver', async () => {
    for (const status of ['ACCEPTED', 'PREPARING']) {
      const res = await asOwner('patch', `/api/my-restaurant/orders/${order.id}/status`).send({ status })
      expect(res.status).toBe(200)
      expect(res.body.order.status).toBe(status)
    }
    for (const status of ['ON_THE_WAY', 'DELIVERED']) {
      expect((await asOwner('patch', `/api/my-restaurant/orders/${order.id}/status`).send({ status })).status).toBe(400)
    }
    const seenByCustomer = await api().get(`/api/orders/${order.id}`).set(auth(customer.token))
    expect(seenByCustomer.body.order.status).toBe('PREPARING')
  })

  it('can reject a pending order but not skip steps', async () => {
    const skip = await asOwner('patch', `/api/my-restaurant/orders/${order.id}/status`).send({ status: 'DELIVERED' })
    expect(skip.status).toBe(400)

    const reject = await asOwner('patch', `/api/my-restaurant/orders/${order.id}/status`).send({ status: 'REJECTED' })
    expect(reject.body.order.status).toBe('REJECTED')

    const after = await asOwner('patch', `/api/my-restaurant/orders/${order.id}/status`).send({ status: 'ACCEPTED' })
    expect(after.status).toBe(400)
  })

  it("cannot update another restaurant's order", async () => {
    const other = await registerOwner()
    const res = await api().patch(`/api/my-restaurant/orders/${order.id}/status`).set(auth(other.token)).send({ status: 'ACCEPTED' })
    expect(res.status).toBe(404)
  })
})

describe('misc', () => {
  it('returns 404 JSON for unknown routes and 400 for bad JSON', async () => {
    expect((await api().get('/api/nope')).status).toBe(404)
    const bad = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad')
    expect(bad.status).toBe(400)
    expect((await api().get('/api/health')).body.ok).toBe(true)
  })
})
