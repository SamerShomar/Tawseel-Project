import { api, prisma, registerOwner, resetDb } from './helpers.js'

let burger
let pizza

beforeEach(async () => {
  await resetDb()
  const a = await registerOwner({ restaurantName: 'Burger Town' })
  const b = await registerOwner({ restaurantName: 'Pizza Roma' })
  burger = await prisma.restaurant.update({ where: { ownerId: a.user.id }, data: { category: 'Burgers' } })
  pizza = await prisma.restaurant.update({ where: { ownerId: b.user.id }, data: { category: 'Pizza' } })
  await prisma.menuItem.createMany({
    data: [
      { restaurantId: burger.id, name: 'Classic', price: 18 },
      { restaurantId: burger.id, name: 'Hidden', price: 10, isAvailable: false },
    ],
  })
})
afterAll(() => prisma.$disconnect())

describe('GET /api/restaurants', () => {
  it('lists all restaurants', async () => {
    const res = await api().get('/api/restaurants')
    expect(res.status).toBe(200)
    expect(res.body.restaurants.map((r) => r.name)).toEqual(['Burger Town', 'Pizza Roma'])
  })

  it('searches by name (case-insensitive)', async () => {
    const res = await api().get('/api/restaurants?search=roma')
    expect(res.body.restaurants.map((r) => r.name)).toEqual(['Pizza Roma'])
  })

  it('filters by category', async () => {
    const res = await api().get('/api/restaurants?category=Burgers')
    expect(res.body.restaurants.map((r) => r.id)).toEqual([burger.id])
  })

  it('lists categories', async () => {
    const res = await api().get('/api/restaurants/categories')
    expect(res.body.categories).toEqual(['Burgers', 'Pizza'])
  })
})

describe('GET /api/restaurants/:id', () => {
  it('returns only available menu items, with numeric prices', async () => {
    const res = await api().get(`/api/restaurants/${burger.id}`)
    expect(res.status).toBe(200)
    expect(res.body.restaurant.ownerId).toBeUndefined()
    expect(res.body.restaurant.menuItems).toHaveLength(1)
    expect(res.body.restaurant.menuItems[0]).toMatchObject({ name: 'Classic', price: 18 })
  })

  it('returns 404 for unknown or invalid ids', async () => {
    expect((await api().get('/api/restaurants/99999')).status).toBe(404)
    expect((await api().get('/api/restaurants/abc')).status).toBe(404)
    expect(pizza.id).toBeDefined()
  })
})
