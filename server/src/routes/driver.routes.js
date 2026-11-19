// Delivery drivers: see orders waiting for a driver, take one, pick it up, deliver it.
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { orderDto } from '../lib/serialize.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.use(requireAuth, requireRole('DRIVER'))

// A driver must verify their email and be approved by an admin before seeing customer addresses.
router.use((req, res, next) => {
  if (!req.user.emailVerifiedAt) {
    return res.status(403).json({ error: 'أكّد إيميلك أولاً', code: 'EMAIL_NOT_VERIFIED' })
  }
  if (!req.user.driverApprovedAt) {
    return res.status(403).json({ error: 'حسابك قيد المراجعة من الإدارة', code: 'DRIVER_NOT_APPROVED' })
  }
  next()
})

/** Orders a driver can take: accepted by the restaurant, not picked up yet, no driver yet. */
const WAITING = ['ACCEPTED', 'PREPARING']
const ACTIVE = ['ACCEPTED', 'PREPARING', 'ON_THE_WAY']

const include = {
  items: true,
  restaurant: { select: { id: true, name: true, address: true, phone: true } },
  customer: { select: { id: true, name: true } },
}

const findMine = async (req, res) => {
  const id = Number(req.params.id)
  const order = Number.isInteger(id) ? await prisma.order.findUnique({ where: { id } }) : null
  if (!order || order.driverId !== req.user.id) {
    res.status(404).json({ error: 'الطلب غير موجود' })
    return null
  }
  return order
}

// GET /api/driver/available — orders waiting for a driver (oldest first)
router.get('/available', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { status: { in: WAITING }, driverId: null },
    include,
    orderBy: { createdAt: 'asc' },
  })
  res.json({ orders: orders.map(orderDto) })
})

// GET /api/driver/mine — my current deliveries and my last 30 delivered orders
router.get('/mine', async (req, res) => {
  const [active, delivered, deliveredCount] = await Promise.all([
    prisma.order.findMany({ where: { driverId: req.user.id, status: { in: ACTIVE } }, include, orderBy: { createdAt: 'asc' } }),
    prisma.order.findMany({ where: { driverId: req.user.id, status: 'DELIVERED' }, include, orderBy: { updatedAt: 'desc' }, take: 30 }),
    prisma.order.count({ where: { driverId: req.user.id, status: 'DELIVERED' } }),
  ])
  res.json({ active: active.map(orderDto), delivered: delivered.map(orderDto), deliveredCount })
})

// POST /api/driver/orders/:id/claim — "I'll deliver this one"
router.post('/orders/:id/claim', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'الطلب غير موجود' })

  // One atomic update, so two drivers can never take the same order.
  const { count } = await prisma.order.updateMany({
    where: { id, driverId: null, status: { in: WAITING } },
    data: { driverId: req.user.id },
  })
  if (count === 0) return res.status(409).json({ error: 'الطلب مش متاح، يمكن أخذه سائق ثاني' })

  const order = await prisma.order.findUnique({ where: { id }, include })
  res.json({ order: orderDto(order) })
})

// POST /api/driver/orders/:id/release — give the order back before picking it up
router.post('/orders/:id/release', async (req, res) => {
  const order = await findMine(req, res)
  if (!order) return
  if (!WAITING.includes(order.status)) return res.status(400).json({ error: 'ما بتقدر تترك الطلب بعد ما استلمته' })

  await prisma.order.update({ where: { id: order.id }, data: { driverId: null } })
  res.status(204).end()
})

// PATCH /api/driver/orders/:id/status — pick up (ON_THE_WAY), then deliver (DELIVERED)
const NEXT = { ACCEPTED: 'ON_THE_WAY', PREPARING: 'ON_THE_WAY', ON_THE_WAY: 'DELIVERED' }

router.patch('/orders/:id/status', validate(z.object({ status: z.enum(['ON_THE_WAY', 'DELIVERED']) })), async (req, res) => {
  const order = await findMine(req, res)
  if (!order) return
  if (NEXT[order.status] !== req.body.status) {
    return res.status(400).json({ error: `لا يمكن تغيير الحالة من ${order.status} إلى ${req.body.status}` })
  }

  const updated = await prisma.order.update({ where: { id: order.id }, data: { status: req.body.status }, include })
  res.json({ order: orderDto(updated) })
})

export default router
