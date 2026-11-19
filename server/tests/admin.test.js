import { ensureAdmin } from '../src/lib/ensureAdmin.js'
import { api, auth, deliverOrder, prisma, registerDriver, registerOwner, registerUser, resetDb } from './helpers.js'

let admin
let customer
let owner
let restaurant
let item

async function createAdmin() {
  await ensureAdmin(prisma, { email: 'admin@test.com', password: 'adminpass123' })
  const res = await api().post('/api/auth/login').send({ email: 'admin@test.com', password: 'adminpass123' })
  return res.body
}

beforeEach(async () => {
  await resetDb()
  admin = await createAdmin()
  customer = await registerUser()
  owner = await registerOwner()
  restaurant = await prisma.restaurant.findUnique({ where: { ownerId: owner.user.id } })
  item = await prisma.menuItem.create({ data: { restaurantId: restaurant.id, name: 'Burger', price: 20 } })
})
afterAll(() => prisma.$disconnect())

const asAdmin = (method, url) => api()[method](url).set(auth(admin.token))
const placeOrder = (token = customer.token) =>
  api()
    .post('/api/orders')
    .set(auth(token))
    .send({ restaurantId: restaurant.id, items: [{ menuItemId: item.id, quantity: 2 }], deliveryAddress: 'Gaza city', phone: '0599123456' })

describe('access', () => {
  it('admin routes are for admins only', async () => {
    expect((await api().get('/api/admin/stats')).status).toBe(401)
    expect((await api().get('/api/admin/stats').set(auth(customer.token))).status).toBe(403)
    expect((await api().get('/api/admin/stats').set(auth(owner.token))).status).toBe(403)
    expect((await asAdmin('get', '/api/admin/stats')).status).toBe(200)
  })

  it('nobody can register as an admin', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'Hacker', email: 'h@test.com', password: 'password123', role: 'ADMIN' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/admin/stats', () => {
  it('counts users, restaurants, orders and delivered revenue', async () => {
    const { order } = (await placeOrder()).body
    const driver = await registerDriver()
    await registerDriver({ approved: false })
    await deliverOrder(order.id, owner.token, driver.token)
    await placeOrder()

    const { body } = await asAdmin('get', '/api/admin/stats')
    expect(body.users).toEqual({ CUSTOMER: 1, RESTAURANT_OWNER: 1, DRIVER: 2, ADMIN: 1 })
    expect(body.pendingDrivers).toBe(1)
    expect(body.restaurants).toEqual({ total: 1, active: 1 })
    expect(body.orders.total).toBe(2)
    expect(body.orders.today).toBe(2)
    expect(body.orders.byStatus).toMatchObject({ DELIVERED: 1, PENDING: 1, REJECTED: 0 })
    expect(body.deliveredRevenue).toBe(40)
    expect(body.recentOrders).toHaveLength(2)
  })
})

describe('users', () => {
  it('lists, searches and filters users', async () => {
    const all = await asAdmin('get', '/api/admin/users')
    expect(all.body.users).toHaveLength(3)
    expect(all.body.users[0].passwordHash).toBeUndefined()

    const owners = await asAdmin('get', '/api/admin/users?role=RESTAURANT_OWNER')
    expect(owners.body.users.map((u) => u.id)).toEqual([owner.user.id])
    expect(owners.body.users[0].restaurant.name).toBe('Test Restaurant')

    const search = await asAdmin('get', `/api/admin/users?search=${encodeURIComponent(customer.user.email.toUpperCase())}`)
    expect(search.body.users.map((u) => u.id)).toEqual([customer.user.id])
  })

  it('suspends a user: login and existing sessions stop working, until reactivated', async () => {
    const res = await asAdmin('patch', `/api/admin/users/${customer.user.id}`).send({ isActive: false })
    expect(res.body.user.isActive).toBe(false)

    const login = await api().post('/api/auth/login').send({ email: customer.user.email, password: 'password123' })
    expect(login.status).toBe(403)
    expect((await api().get('/api/auth/me').set(auth(customer.token))).status).toBe(403)

    await asAdmin('patch', `/api/admin/users/${customer.user.id}`).send({ isActive: true })
    expect((await api().get('/api/auth/me').set(auth(customer.token))).status).toBe(200)
  })

  it('cannot suspend itself or another admin, and 404s unknown users', async () => {
    expect((await asAdmin('patch', `/api/admin/users/${admin.user.id}`).send({ isActive: false })).status).toBe(400)
    await ensureAdmin(prisma, { email: 'admin2@test.com', password: 'adminpass123' })
    const other = await prisma.user.findUnique({ where: { email: 'admin2@test.com' } })
    expect((await asAdmin('patch', `/api/admin/users/${other.id}`).send({ isActive: false })).status).toBe(400)
    expect((await asAdmin('patch', '/api/admin/users/99999').send({ isActive: false })).status).toBe(404)
    expect((await asAdmin('patch', '/api/admin/users/abc').send({ isActive: false })).status).toBe(404)
  })
})

describe('restaurants', () => {
  it('lists restaurants with owner and counts', async () => {
    await placeOrder()
    const { body } = await asAdmin('get', '/api/admin/restaurants')
    expect(body.restaurants[0]).toMatchObject({ id: restaurant.id, menuItemsCount: 1, ordersCount: 1, owner: { id: owner.user.id } })
  })

  it('hiding a restaurant removes it for customers and blocks new orders', async () => {
    await asAdmin('patch', `/api/admin/restaurants/${restaurant.id}`).send({ isActive: false })

    expect((await api().get('/api/restaurants')).body.restaurants).toHaveLength(0)
    expect((await api().get(`/api/restaurants/${restaurant.id}`)).status).toBe(404)
    expect((await placeOrder()).status).toBe(400)

    await asAdmin('patch', `/api/admin/restaurants/${restaurant.id}`).send({ isActive: true })
    expect((await api().get('/api/restaurants')).body.restaurants).toHaveLength(1)
    expect((await placeOrder()).status).toBe(201)
  })

  it('404s unknown restaurants', async () => {
    expect((await asAdmin('patch', '/api/admin/restaurants/99999').send({ isActive: false })).status).toBe(404)
  })
})

describe('orders', () => {
  it('lists all orders with filters, and the admin can open any order', async () => {
    const { order } = (await placeOrder()).body
    await api().patch(`/api/my-restaurant/orders/${order.id}/status`).set(auth(owner.token)).send({ status: 'REJECTED' })
    await placeOrder()

    expect((await asAdmin('get', '/api/admin/orders')).body.orders).toHaveLength(2)
    const rejected = await asAdmin('get', '/api/admin/orders?status=REJECTED')
    expect(rejected.body.orders.map((o) => o.id)).toEqual([order.id])
    expect(rejected.body.orders[0].customer.name).toBe(customer.user.name)
    expect((await asAdmin('get', `/api/admin/orders?restaurantId=${restaurant.id}`)).body.orders).toHaveLength(2)

    expect((await asAdmin('get', `/api/orders/${order.id}`)).status).toBe(200)
  })
})

describe('ensureAdmin', () => {
  it('creates, leaves unchanged, and promotes/updates existing accounts', async () => {
    expect(await ensureAdmin(prisma, { email: 'admin@test.com', password: 'adminpass123' })).toBe('unchanged')
    expect(await ensureAdmin(prisma, { email: 'Admin@Test.com', password: 'newpassword1' })).toBe('updated')
    const login = await api().post('/api/auth/login').send({ email: 'admin@test.com', password: 'newpassword1' })
    expect(login.body.user.role).toBe('ADMIN')

    expect(await ensureAdmin(prisma, { email: customer.user.email, password: 'password123' })).toBe('updated')
    expect((await prisma.user.findUnique({ where: { id: customer.user.id } })).role).toBe('ADMIN')
  })

  it('rejects bad input', async () => {
    await expect(ensureAdmin(prisma, { email: 'nope', password: 'adminpass123' })).rejects.toThrow('ADMIN_EMAIL')
    await expect(ensureAdmin(prisma, { email: 'a@b.com', password: 'short' })).rejects.toThrow('ADMIN_PASSWORD')
  })
})
