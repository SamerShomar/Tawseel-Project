// Routes for the logged-in restaurant owner: their restaurant, menu and incoming orders.
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { menuItemDto, orderDto } from '../lib/serialize.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.use(requireAuth, requireRole('RESTAURANT_OWNER'))

// Loads the owner's restaurant into req.restaurant.
router.use(async (req, res, next) => {
  req.restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user.id } })
  if (!req.restaurant) return res.status(404).json({ error: 'لا يوجد مطعم مرتبط بهذا الحساب' })
  next()
})

/* ---------- Restaurant info ---------- */

router.get('/', (req, res) => res.json({ restaurant: req.restaurant }))

const restaurantSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500),
    category: z.string().trim().max(50),
    imageUrl: z.string().trim().url().max(500).or(z.literal('')).nullable(),
    address: z.string().trim().max(300),
    phone: z.string().trim().max(30),
  })
  .partial()

router.patch('/', validate(restaurantSchema), async (req, res) => {
  const restaurant = await prisma.restaurant.update({
    where: { id: req.restaurant.id },
    data: { ...req.body, ...(req.body.imageUrl === '' && { imageUrl: null }) },
  })
  res.json({ restaurant })
})

/* ---------- Menu management ---------- */

const menuItemSchema = z.object({
  name: z.string().trim().min(2, 'اسم الصنف قصير جداً').max(100),
  description: z.string().trim().max(500).default(''),
  price: z.coerce.number().positive('السعر يجب أن يكون أكبر من صفر').max(100000),
  category: z.string().trim().max(50).default(''),
  imageUrl: z.string().trim().url().max(500).or(z.literal('')).nullable().optional(),
  isAvailable: z.boolean().default(true),
})

const findOwnItem = async (req, res) => {
  const id = Number(req.params.id)
  const item = Number.isInteger(id) ? await prisma.menuItem.findUnique({ where: { id } }) : null
  if (!item || item.restaurantId !== req.restaurant.id) {
    res.status(404).json({ error: 'الصنف غير موجود' })
    return null
  }
  return item
}

const cleanImage = (data) => ({ ...data, ...(data.imageUrl === '' && { imageUrl: null }) })

router.get('/menu', async (req, res) => {
  const items = await prisma.menuItem.findMany({
    where: { restaurantId: req.restaurant.id },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  res.json({ menuItems: items.map(menuItemDto) })
})

router.post('/menu', validate(menuItemSchema), async (req, res) => {
  const item = await prisma.menuItem.create({ data: { ...cleanImage(req.body), restaurantId: req.restaurant.id } })
  res.status(201).json({ menuItem: menuItemDto(item) })
})

router.patch('/menu/:id', validate(menuItemSchema.partial()), async (req, res) => {
  if (!(await findOwnItem(req, res))) return
  const item = await prisma.menuItem.update({ where: { id: Number(req.params.id) }, data: cleanImage(req.body) })
  res.json({ menuItem: menuItemDto(item) })
})

router.delete('/menu/:id', async (req, res) => {
  if (!(await findOwnItem(req, res))) return
  await prisma.menuItem.delete({ where: { id: Number(req.params.id) } })
  res.status(204).end()
})

/* ---------- Orders dashboard ---------- */

const ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'REJECTED']

// What the restaurant can do: accept or reject, then start preparing.
// Picking the order up (ON_THE_WAY) and delivering it are the driver's steps (see driver.routes.js).
export const NEXT_STATUS = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['PREPARING'],
  PREPARING: [],
  ON_THE_WAY: [],
  DELIVERED: [],
  REJECTED: [],
}

const ownerOrderInclude = {
  items: true,
  customer: { select: { id: true, name: true } },
  driver: { select: { id: true, name: true, phone: true } },
}

router.get('/orders', validate(z.object({ status: z.enum(ORDER_STATUSES).optional() }), 'query'), async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { restaurantId: req.restaurant.id, ...(req.validated.status && { status: req.validated.status }) },
    include: ownerOrderInclude,
    orderBy: { createdAt: 'desc' },
  })
  res.json({ orders: orders.map(orderDto) })
})

router.patch('/orders/:id/status', validate(z.object({ status: z.enum(ORDER_STATUSES) })), async (req, res) => {
  const id = Number(req.params.id)
  const order = Number.isInteger(id) ? await prisma.order.findUnique({ where: { id } }) : null
  if (!order || order.restaurantId !== req.restaurant.id) return res.status(404).json({ error: 'الطلب غير موجود' })

  if (!NEXT_STATUS[order.status].includes(req.body.status)) {
    return res.status(400).json({ error: `لا يمكن تغيير الحالة من ${order.status} إلى ${req.body.status}` })
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: req.body.status },
    include: ownerOrderInclude,
  })
  res.json({ order: orderDto(updated) })
})

export default router
