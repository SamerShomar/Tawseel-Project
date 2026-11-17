import { api, auth, prisma, registerOwner, registerUser, resetDb } from './helpers.js'

beforeEach(resetDb)
afterAll(() => prisma.$disconnect())

describe('POST /api/auth/register', () => {
  it('creates a customer and returns a token', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Samer', email: 'Samer@Test.com', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body.token).toEqual(expect.any(String))
    expect(res.body.user).toMatchObject({ name: 'Samer', email: 'samer@test.com', role: 'CUSTOMER' })
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('creates a restaurant for a restaurant owner', async () => {
    const { user } = await registerOwner({ restaurantName: 'Falafel Place' })
    const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: user.id } })
    expect(restaurant.name).toBe('Falafel Place')
  })

  it('requires a restaurant name for owners', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Owner', email: 'o@test.com', password: 'password123', role: 'RESTAURANT_OWNER' })
    expect(res.status).toBe(400)
    expect(res.body.details[0].field).toBe('restaurantName')
  })

  it('rejects a duplicate email', async () => {
    await registerUser({ email: 'dup@test.com' })
    const res = await api().post('/api/auth/register').send({ name: 'Again', email: 'dup@test.com', password: 'password123' })
    expect(res.status).toBe(409)
  })

  it('rejects a short password and invalid email', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'X Y', email: 'not-an-email', password: '123' })
    expect(res.status).toBe(400)
    expect(res.body.details.map((d) => d.field).sort()).toEqual(['email', 'password'])
  })
})

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await registerUser({ email: 'login@test.com' })
    const res = await api().post('/api/auth/login').send({ email: 'login@test.com', password: 'password123' })
    expect(res.status).toBe(200)
    expect(res.body.token).toEqual(expect.any(String))
  })

  it('rejects a wrong password and unknown email the same way', async () => {
    await registerUser({ email: 'login@test.com' })
    const wrong = await api().post('/api/auth/login').send({ email: 'login@test.com', password: 'wrongpass' })
    const unknown = await api().post('/api/auth/login').send({ email: 'nobody@test.com', password: 'password123' })
    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(wrong.body.error).toBe(unknown.body.error)
  })
})

describe('GET /api/auth/me', () => {
  it('returns the current user', async () => {
    const { token, user } = await registerUser()
    const res = await api().get('/api/auth/me').set(auth(token))
    expect(res.status).toBe(200)
    expect(res.body.user.id).toBe(user.id)
  })

  it('rejects missing or invalid tokens', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401)
    expect((await api().get('/api/auth/me').set(auth('garbage'))).status).toBe(401)
  })
})

describe('password reset', () => {
  const requestResetToken = (email) => api().post('/api/auth/forgot-password').send({ email })

  it('answers the same for known and unknown emails', async () => {
    await registerUser({ email: 'reset@test.com' })
    const known = await requestResetToken('reset@test.com')
    const unknown = await requestResetToken('nobody@test.com')
    expect(known.status).toBe(200)
    expect(unknown.status).toBe(200)
    expect(known.body).toEqual(unknown.body)
  })

  it('stores only a hash of the reset token', async () => {
    await registerUser({ email: 'reset@test.com' })
    await requestResetToken('reset@test.com')
    const user = await prisma.user.findUnique({ where: { email: 'reset@test.com' } })
    expect(user.resetTokenHash).toMatch(/^[a-f0-9]{64}$/)
    expect(user.resetTokenExpires.getTime()).toBeGreaterThan(Date.now())
  })

  it('resets the password with a valid token, only once', async () => {
    const crypto = await import('node:crypto')
    await registerUser({ email: 'reset@test.com' })
    const token = 'a'.repeat(64)
    await prisma.user.update({
      where: { email: 'reset@test.com' },
      data: {
        resetTokenHash: crypto.createHash('sha256').update(token).digest('hex'),
        resetTokenExpires: new Date(Date.now() + 60_000),
      },
    })

    const res = await api().post('/api/auth/reset-password').send({ token, password: 'newpassword1' })
    expect(res.status).toBe(200)

    const login = await api().post('/api/auth/login').send({ email: 'reset@test.com', password: 'newpassword1' })
    expect(login.status).toBe(200)

    const again = await api().post('/api/auth/reset-password').send({ token, password: 'another-pass' })
    expect(again.status).toBe(400)
  })

  it('rejects an expired token', async () => {
    const crypto = await import('node:crypto')
    await registerUser({ email: 'reset@test.com' })
    const token = 'b'.repeat(64)
    await prisma.user.update({
      where: { email: 'reset@test.com' },
      data: {
        resetTokenHash: crypto.createHash('sha256').update(token).digest('hex'),
        resetTokenExpires: new Date(Date.now() - 1000),
      },
    })
    const res = await api().post('/api/auth/reset-password').send({ token, password: 'newpassword1' })
    expect(res.status).toBe(400)
  })
})
