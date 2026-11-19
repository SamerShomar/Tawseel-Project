import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/errors.js'
import { PUBLIC } from './restaurants.routes.js'
import { prisma } from '../lib/prisma.js'
import { orderDto } from '../lib/serialize.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.use(requireAuth)

const orderInclude = {
  items: true,
  restaurant: { select: { id: true, name: true, phone: true } },
}

const createSchema = z.object({
  restaurantId: z.number().int().positive(),
  items: z
    .array(z.object({ menuItemId: z.number().int().positive(), quantity: z.number().int().min(1).max(50) }))
    .min(1, 'السلة فارغة'),
  deliveryAddress: z.string().trim().min(5, 'العنوان قصير جداً').max(300),
  phone: z.string().trim().min(7, 'رقم الهاتف غير صحيح').max(30),
  notes: z.string().trim().max(500).default(''),
})

// POST /api/orders — place an order (cash on delivery)
router.post('/', requireRole('CUSTOMER'), validate(createSchema), async (req, res) => {
  if (!req.user.emailVerifiedAt) {
    return res.status(403).json({ error: 'أكّد إيميلك أولاً عشان تقدر تطلب. الرابط وصلك على إيميلك.', code: 'EMAIL_NOT_VERIFIED' })
  }
  const { restaurantId, items, deliveryAddress, phone, notes } = req.body

  // Prices always come from the database, never from the client.
  const ids = [...new Set(items.map((i) => i.menuItemId))]
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: ids }, restaurantId, isAvailable: true, restaurant: PUBLIC } })
  if (menuItems.length !== ids.length) throw new HttpError(400, 'بعض الأصناف غير متوفرة حالياً')

  const byId = new Map(menuItems.map((m) => [m.id, m]))
  const lines = items.map(({ menuItemId, quantity }) => {
    const m = byId.get(menuItemId)
    return { menuItemId, quantity, name: m.name, unitPrice: m.price }
  })
  const total = lines.reduce((sum, l) => sum + Number(l.unitPrice) * l.quantity, 0)

  const order = await prisma.order.create({
    data: {
      customerId: req.user.id,
      restaurantId,
      deliveryAddress,
      phone,
      notes,
      total: total.toFixed(2),
      items: { create: lines },
    },
    include: orderInclude,
  })
  res.status(201).json({ order: orderDto(order) })
})

// GET /api/orders — the customer's order history (newest first)
router.get('/', requireRole('CUSTOMER'), async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { customerId: req.user.id },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  })
  res.json({ orders: orders.map(orderDto) })
})

// GET /api/orders/:id — visible to the customer who placed it, the restaurant owner, and admins
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const order = Number.isInteger(id)
    ? await prisma.order.findUnique({ where: { id }, include: { ...orderInclude, restaurant: { select: { id: true, name: true, phone: true, ownerId: true } } } })
    : null

  const allowed =
    order && (order.customerId === req.user.id || order.restaurant.ownerId === req.user.id || req.user.role === 'ADMIN')
  if (!allowed) return res.status(404).json({ error: 'الطلب غير موجود' })

  const { ownerId: _ownerId, ...restaurant } = order.restaurant
  res.json({ order: orderDto({ ...order, restaurant }) })
})

export default router
