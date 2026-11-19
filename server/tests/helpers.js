import request from 'supertest'
import { app } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'

export const api = () => request(app)

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE order_items, orders, menu_items, restaurants, users RESTART IDENTITY CASCADE',
  )
}

let counter = 0
/**
 * Registers a user through the API and returns { token, user }.
 * The email is marked verified unless `verified: false` is passed.
 */
export async function registerUser({ verified = true, ...overrides } = {}) {
  counter += 1
  const body = {
    name: `User ${counter}`,
    email: `user${counter}@test.com`,
    password: 'password123',
    role: 'CUSTOMER',
    ...overrides,
  }
  const res = await api().post('/api/auth/register').send(body)
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`)
  if (verified) {
    await prisma.user.update({ where: { id: res.body.user.id }, data: { emailVerifiedAt: new Date() } })
    res.body.user.emailVerified = true
  }
  return res.body
}

export const registerOwner = (overrides = {}) =>
  registerUser({ role: 'RESTAURANT_OWNER', restaurantName: 'Test Restaurant', ...overrides })

export const auth = (token) => ({ Authorization: `Bearer ${token}` })

export { prisma }

/** Registers a delivery driver; approved by an admin unless `approved: false`. */
export async function registerDriver({ approved = true, ...overrides } = {}) {
  const res = await registerUser({ role: 'DRIVER', phone: '0599000111', ...overrides })
  if (approved) {
    await prisma.user.update({ where: { id: res.user.id }, data: { driverApprovedAt: new Date() } })
    res.user.driverApproved = true
  }
  return res
}

/** Takes an order through the whole flow: restaurant accepts and prepares, a driver picks it up and delivers it. */
export async function deliverOrder(orderId, ownerToken, driverToken) {
  for (const status of ['ACCEPTED', 'PREPARING']) {
    await request(app).patch(`/api/my-restaurant/orders/${orderId}/status`).set(auth(ownerToken)).send({ status })
  }
  await request(app).post(`/api/driver/orders/${orderId}/claim`).set(auth(driverToken))
  for (const status of ['ON_THE_WAY', 'DELIVERED']) {
    await request(app).patch(`/api/driver/orders/${orderId}/status`).set(auth(driverToken)).send({ status })
  }
}
