import { api, auth, deliverOrder, prisma, registerDriver, registerOwner, registerUser, resetDb } from './helpers.js'

let customer
let owner
let driver
let order

beforeEach(async () => {
  await resetDb()
  customer = await registerUser()
  owner = await registerOwner()
  driver = await registerDriver()
  const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: owner.user.id } })
  const item = await prisma.menuItem.create({ data: { restaurantId: restaurant.id, name: 'Burger', price: 15 } })
  order = (
    await api()
      .post('/api/orders')
      .set(auth(customer.token))
      .send({ restaurantId: restaurant.id, items: [{ menuItemId: item.id, quantity: 2 }], deliveryAddress: 'Gaza, Rimal', phone: '0599123456' })
  ).body.order
})
afterAll(() => prisma.$disconnect())

const asDriver = (method, url, d = driver) => api()[method](url).set(auth(d.token))
const ownerSets = (status) => api().patch(`/api/my-restaurant/orders/${order.id}/status`).set(auth(owner.token)).send({ status })

describe('registration and access', () => {
  it('drivers sign up with a phone number and start unapproved', async () => {
    const noPhone = await api().post('/api/auth/register').send({ name: 'Driver X', email: 'dx@test.com', password: 'password123', role: 'DRIVER' })
    expect(noPhone.status).toBe(400)
    expect(noPhone.body.details[0].field).toBe('phone')

    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Driver Y', email: 'dy@test.com', password: 'password123', role: 'DRIVER', phone: '0599888777' })
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ role: 'DRIVER', driverApproved: false })
  })

  it('only verified and approved drivers can use the driver API', async () => {
    expect((await api().get('/api/driver/available').set(auth(customer.token))).status).toBe(403)

    const pending = await registerDriver({ approved: false })
    const res = await asDriver('get', '/api/driver/available', pending)
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('DRIVER_NOT_APPROVED')

    const unverified = await registerDriver({ verified: false })
    expect((await asDriver('get', '/api/driver/available', unverified)).body.code).toBe('EMAIL_NOT_VERIFIED')
  })
})

describe('available orders', () => {
  it('shows orders once the restaurant accepts them, until a driver takes them', async () => {
    expect((await asDriver('get', '/api/driver/available')).body.orders).toHaveLength(0) // still PENDING

    await ownerSets('ACCEPTED')
    const list = (await asDriver('get', '/api/driver/available')).body.orders
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ id: order.id, deliveryAddress: 'Gaza, Rimal', total: 30, restaurant: { name: 'Test Restaurant' } })

    await asDriver('post', `/api/driver/orders/${order.id}/claim`)
    expect((await asDriver('get', '/api/driver/available')).body.orders).toHaveLength(0)
  })
})

describe('the delivery flow', () => {
  it('claim → pick up → deliver, visible to the customer and the restaurant', async () => {
    await ownerSets('ACCEPTED')
    await ownerSets('PREPARING')

    const claimed = await asDriver('post', `/api/driver/orders/${order.id}/claim`)
    expect(claimed.status).toBe(200)
    expect(claimed.body.order.driverId).toBe(driver.user.id)

    const seen = (await api().get(`/api/orders/${order.id}`).set(auth(customer.token))).body.order
    expect(seen.driver).toMatchObject({ name: driver.user.name, phone: '0599000111' })
    const ownerView = (await api().get('/api/my-restaurant/orders').set(auth(owner.token))).body.orders[0]
    expect(ownerView.driver.name).toBe(driver.user.name)

    expect((await asDriver('patch', `/api/driver/orders/${order.id}/status`).send({ status: 'DELIVERED' })).status).toBe(400)
    expect((await asDriver('patch', `/api/driver/orders/${order.id}/status`).send({ status: 'ON_THE_WAY' })).body.order.status).toBe('ON_THE_WAY')
    expect((await asDriver('post', `/api/driver/orders/${order.id}/release`)).status).toBe(400)
    expect((await asDriver('patch', `/api/driver/orders/${order.id}/status`).send({ status: 'DELIVERED' })).body.order.status).toBe('DELIVERED')

    const mine = (await asDriver('get', '/api/driver/mine')).body
    expect(mine.active).toHaveLength(0)
    expect(mine.delivered.map((o) => o.id)).toEqual([order.id])
    expect(mine.deliveredCount).toBe(1)
    expect((await asDriver('get', `/api/orders/${order.id}`)).status).toBe(200)
  })

  it('two drivers cannot take the same order', async () => {
    await ownerSets('ACCEPTED')
    const other = await registerDriver()
    const [a, b] = await Promise.all([
      asDriver('post', `/api/driver/orders/${order.id}/claim`),
      asDriver('post', `/api/driver/orders/${order.id}/claim`, other),
    ])
    expect([a.status, b.status].sort()).toEqual([200, 409])
  })

  it('a driver can give an order back before pickup', async () => {
    await ownerSets('ACCEPTED')
    await asDriver('post', `/api/driver/orders/${order.id}/claim`)
    expect((await asDriver('get', '/api/driver/mine')).body.active).toHaveLength(1)

    expect((await asDriver('post', `/api/driver/orders/${order.id}/release`)).status).toBe(204)
    expect((await asDriver('get', '/api/driver/available')).body.orders).toHaveLength(1)
  })

  it("drivers can't touch orders that aren't theirs, or rejected ones", async () => {
    await ownerSets('ACCEPTED')
    await asDriver('post', `/api/driver/orders/${order.id}/claim`)
    const other = await registerDriver()
    expect((await asDriver('patch', `/api/driver/orders/${order.id}/status`, other).send({ status: 'ON_THE_WAY' })).status).toBe(404)
    expect((await asDriver('post', `/api/driver/orders/${order.id}/release`, other)).status).toBe(404)
    expect((await asDriver('get', `/api/orders/${order.id}`, other)).status).toBe(404)
    expect((await asDriver('post', '/api/driver/orders/abc/claim')).status).toBe(404)
    expect((await asDriver('post', '/api/driver/orders/999999/claim')).status).toBe(409)
  })
})

describe('admin manages drivers', () => {
  it('approves and un-approves a driver', async () => {
    const { ensureAdmin } = await import('../src/lib/ensureAdmin.js')
    await ensureAdmin(prisma, { email: 'admin@test.com', password: 'adminpass123' })
    const admin = (await api().post('/api/auth/login').send({ email: 'admin@test.com', password: 'adminpass123' })).body
    const pending = await registerDriver({ approved: false })

    const drivers = (await api().get('/api/admin/users?role=DRIVER').set(auth(admin.token))).body.users
    expect(drivers.find((u) => u.id === pending.user.id)).toMatchObject({ driverApproved: false })

    const ok = await api().patch(`/api/admin/users/${pending.user.id}`).set(auth(admin.token)).send({ driverApproved: true })
    expect(ok.body.user.driverApproved).toBe(true)
    expect((await asDriver('get', '/api/driver/available', pending)).status).toBe(200)

    await api().patch(`/api/admin/users/${pending.user.id}`).set(auth(admin.token)).send({ driverApproved: false })
    expect((await asDriver('get', '/api/driver/available', pending)).status).toBe(403)

    expect((await api().patch(`/api/admin/users/${customer.user.id}`).set(auth(admin.token)).send({ driverApproved: true })).status).toBe(400)
    expect((await api().patch(`/api/admin/users/${customer.user.id}`).set(auth(admin.token)).send({})).status).toBe(400)
  })

  it('the whole flow helper works end to end', async () => {
    await deliverOrder(order.id, owner.token, driver.token)
    expect((await prisma.order.findUnique({ where: { id: order.id } })).status).toBe('DELIVERED')
  })
})
