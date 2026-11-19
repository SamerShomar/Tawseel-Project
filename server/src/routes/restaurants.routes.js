import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { menuItemDto } from '../lib/serialize.js'
import { validate } from '../middleware/validate.js'

const router = Router()

/** Restaurants customers can see: not hidden by an admin, and the owner has verified their email. */
export const PUBLIC = { isActive: true, owner: { emailVerifiedAt: { not: null } } }

const listQuery = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(50).optional(),
})

// GET /api/restaurants?search=&category=
router.get('/', validate(listQuery, 'query'), async (req, res) => {
  const { search, category } = req.validated
  const restaurants = await prisma.restaurant.findMany({
    where: {
      ...PUBLIC,
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(category && { category }),
    },
    select: { id: true, name: true, description: true, category: true, imageUrl: true, address: true },
    orderBy: { name: 'asc' },
  })
  res.json({ restaurants })
})

// GET /api/restaurants/categories
router.get('/categories', async (req, res) => {
  const rows = await prisma.restaurant.findMany({ where: { ...PUBLIC, category: { not: '' } }, distinct: ['category'], select: { category: true } })
  res.json({ categories: rows.map((r) => r.category).sort() })
})

// GET /api/restaurants/:id — restaurant with its available menu items
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'المطعم غير موجود' })

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, ...PUBLIC },
    include: { menuItems: { where: { isAvailable: true }, orderBy: [{ category: 'asc' }, { name: 'asc' }] } },
  })
  if (!restaurant) return res.status(404).json({ error: 'المطعم غير موجود' })

  const { menuItems, ownerId: _ownerId, isActive: _isActive, ...rest } = restaurant
  res.json({ restaurant: { ...rest, menuItems: menuItems.map(menuItemDto) } })
})

export default router
