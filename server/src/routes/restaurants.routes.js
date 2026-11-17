import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { menuItemDto } from '../lib/serialize.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const listQuery = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(50).optional(),
})

// GET /api/restaurants?search=&category=
router.get('/', validate(listQuery, 'query'), async (req, res) => {
  const { search, category } = req.validated
  const restaurants = await prisma.restaurant.findMany({
    where: {
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
  const rows = await prisma.restaurant.findMany({ where: { category: { not: '' } }, distinct: ['category'], select: { category: true } })
  res.json({ categories: rows.map((r) => r.category).sort() })
})

// GET /api/restaurants/:id — restaurant with its available menu items
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'المطعم غير موجود' })

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { menuItems: { where: { isAvailable: true }, orderBy: [{ category: 'asc' }, { name: 'asc' }] } },
  })
  if (!restaurant) return res.status(404).json({ error: 'المطعم غير موجود' })

  const { menuItems, ownerId: _ownerId, ...rest } = restaurant
  res.json({ restaurant: { ...rest, menuItems: menuItems.map(menuItemDto) } })
})

export default router
