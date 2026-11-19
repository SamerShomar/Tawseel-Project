import crypto from 'node:crypto'
import { jest } from '@jest/globals'
import { config } from '../src/config.js'
import { verificationEmail } from '../src/lib/mailer.js'
import { api, auth, prisma, registerOwner, registerUser, resetDb } from './helpers.js'

const hash = (t) => crypto.createHash('sha256').update(t).digest('hex')

/** Gives the user a known verification token (the real one is only in the email). */
async function setToken(userId, token, msFromNow = 60_000) {
  await prisma.user.update({ where: { id: userId }, data: { verifyTokenHash: hash(token), verifyTokenExpires: new Date(Date.now() + msFromNow) } })
}

beforeEach(resetDb)
afterAll(() => prisma.$disconnect())

describe('registration', () => {
  it('creates an unverified user with a verification token', async () => {
    const { user } = await registerUser({ verified: false })
    expect(user.emailVerified).toBe(false)
    const row = await prisma.user.findUnique({ where: { id: user.id } })
    expect(row.emailVerifiedAt).toBeNull()
    expect(row.verifyTokenHash).toMatch(/^[a-f0-9]{64}$/)
    expect(row.verifyTokenExpires.getTime()).toBeGreaterThan(Date.now() + 23 * 3600_000)
  })

  it('still registers when the email cannot be sent', async () => {
    const saved = config.brevoApiKey
    config.brevoApiKey = 'bad'
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('down', { status: 500 }))
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const res = await api().post('/api/auth/register').send({ name: 'Mail Down', email: 'down@test.com', password: 'password123' })
      expect(res.status).toBe(201)
      expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('Could not send the verification email'))
    } finally {
      config.brevoApiKey = saved
      fetchSpy.mockRestore()
      errorLog.mockRestore()
    }
  })
})

describe('POST /api/auth/verify-email', () => {
  it('verifies the email once', async () => {
    const { user, token: jwt } = await registerUser({ verified: false })
    await setToken(user.id, 'v'.repeat(64))

    const res = await api().post('/api/auth/verify-email').send({ token: 'v'.repeat(64) })
    expect(res.status).toBe(200)
    expect(res.body.user.emailVerified).toBe(true)
    expect((await api().get('/api/auth/me').set(auth(jwt))).body.user.emailVerified).toBe(true)

    expect((await api().post('/api/auth/verify-email').send({ token: 'v'.repeat(64) })).status).toBe(400)
  })

  it('rejects unknown and expired tokens', async () => {
    const { user } = await registerUser({ verified: false })
    expect((await api().post('/api/auth/verify-email').send({ token: 'x'.repeat(64) })).status).toBe(400)

    await setToken(user.id, 'e'.repeat(64), -1000)
    const res = await api().post('/api/auth/verify-email').send({ token: 'e'.repeat(64) })
    expect(res.status).toBe(400)
    expect(res.body.expired).toBe(true)
  })
})

describe('POST /api/auth/resend-verification', () => {
  it('replaces the token for unverified users', async () => {
    const { user, token } = await registerUser({ verified: false })
    const before = (await prisma.user.findUnique({ where: { id: user.id } })).verifyTokenHash

    const res = await api().post('/api/auth/resend-verification').set(auth(token))
    expect(res.status).toBe(200)
    expect((await prisma.user.findUnique({ where: { id: user.id } })).verifyTokenHash).not.toBe(before)
  })

  it('refuses verified users and anonymous requests', async () => {
    const { token } = await registerUser()
    expect((await api().post('/api/auth/resend-verification').set(auth(token))).status).toBe(400)
    expect((await api().post('/api/auth/resend-verification')).status).toBe(401)
  })
})

describe('what unverified accounts cannot do', () => {
  it('an unverified customer cannot place orders until verified', async () => {
    const owner = await registerOwner()
    const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: owner.user.id } })
    const item = await prisma.menuItem.create({ data: { restaurantId: restaurant.id, name: 'Burger', price: 10 } })
    const customer = await registerUser({ verified: false })
    const order = () =>
      api()
        .post('/api/orders')
        .set(auth(customer.token))
        .send({ restaurantId: restaurant.id, items: [{ menuItemId: item.id, quantity: 1 }], deliveryAddress: 'Gaza city', phone: '0599123456' })

    const blocked = await order()
    expect(blocked.status).toBe(403)
    expect(blocked.body.code).toBe('EMAIL_NOT_VERIFIED')

    await prisma.user.update({ where: { id: customer.user.id }, data: { emailVerifiedAt: new Date() } })
    expect((await order()).status).toBe(201)
  })

  it("an unverified owner's restaurant is hidden from customers", async () => {
    const owner = await registerOwner({ verified: false })
    const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: owner.user.id } })

    expect((await api().get('/api/restaurants')).body.restaurants).toHaveLength(0)
    expect((await api().get(`/api/restaurants/${restaurant.id}`)).status).toBe(404)
    // The owner can still set up the restaurant meanwhile.
    expect((await api().get('/api/my-restaurant/menu').set(auth(owner.token))).status).toBe(200)

    await prisma.user.update({ where: { id: owner.user.id }, data: { emailVerifiedAt: new Date() } })
    expect((await api().get('/api/restaurants')).body.restaurants).toHaveLength(1)
  })
})

describe('verificationEmail', () => {
  it('greets the user and contains the link', () => {
    const { subject, text, html } = verificationEmail('سامر', 'https://site.test/verify-email?token=abc', 24)
    expect(subject).toContain('أكّد إيميلك')
    expect(text).toContain('أهلاً سامر')
    expect(html).toContain('href="https://site.test/verify-email?token=abc"')
    expect(text).toContain('24 ساعة')
  })
})
