// Admin panel API: site-wide statistics, users, restaurants and orders.
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { orderDto, publicUser } from '../lib/serialize.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.use(requireAuth, requireRole('ADMIN'))

const ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'REJECTED']
const idParam = (req) => {
  const id = Number(req.params.id)
  return Number.isInteger(id) ? id : null
}

/* ---------- Overview ---------- */

router.get('/stats', async (req, res) => {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [usersByRole, restaurants, activeRestaurants, ordersByStatus, ordersToday, revenue, recentOrders, pendingDrivers] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.order.groupBy({ by: ['status'], _count: true }),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { total: true } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { restaurant: { select: { id: true, name: true } }, customer: { select: { id: true, name: true } } },
    }),
    prisma.user.count({ where: { role: 'DRIVER', driverApprovedAt: null, isActive: true } }),
  ])

  const count = (rows, key) => Object.fromEntries(rows.map((r) => [r[key], r._count]))
  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]))
  Object.assign(statusCounts, count(ordersByStatus, 'status'))

  res.json({
    users: { CUSTOMER: 0, RESTAURANT_OWNER: 0, DRIVER: 0, ADMIN: 0, ...count(usersByRole, 'role') },
    pendingDrivers,
    restaurants: { total: restaurants, active: activeRestaurants },
    orders: {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      today: ordersToday,
      byStatus: statusCounts,
    },
    deliveredRevenue: Number(revenue._sum.total ?? 0),
    recentOrders: recentOrders.map(orderDto),
  })
})

/* ---------- Users ---------- */

const usersQuery = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(['CUSTOMER', 'RESTAURANT_OWNER', 'DRIVER', 'ADMIN']).optional(),
})

router.get('/users', validate(usersQuery, 'query'), async (req, res) => {
  const { search, role } = req.validated
  const users = await prisma.user.findMany({
    where: {
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: { restaurant: { select: { id: true, name: true } }, _count: { select: { orders: true, deliveries: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({
    users: users.map((u) => ({
      ...publicUser(u),
      isActive: u.isActive,
      createdAt: u.createdAt,
      restaurant: u.restaurant,
      ordersCount: u._count.orders,
      deliveriesCount: u._count.deliveries,
    })),
  })
})

const userPatch = z
  .object({ isActive: z.boolean(), driverApproved: z.boolean() })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'لا يوجد تغيير' })

router.patch('/users/:id', validate(userPatch), async (req, res) => {
  const id = idParam(req)
  const user = id && (await prisma.user.findUnique({ where: { id } }))
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' })
  if (user.id === req.user.id) return res.status(400).json({ error: 'لا يمكنك تعديل حسابك من هنا' })
  if (user.role === 'ADMIN') return res.status(400).json({ error: 'لا يمكن تعديل حساب أدمن' })
  if (req.body.driverApproved !== undefined && user.role !== 'DRIVER') {
    return res.status(400).json({ error: 'الموافقة للسائقين فقط' })
  }

  const data = {}
  if (req.body.isActive !== undefined) data.isActive = req.body.isActive
  if (req.body.driverApproved !== undefined) data.driverApprovedAt = req.body.driverApproved ? new Date() : null
  const updated = await prisma.user.update({ where: { id }, data })
  res.json({ user: { ...publicUser(updated), isActive: updated.isActive } })
})

/* ---------- Restaurants ---------- */

router.get('/restaurants', async (req, res) => {
  const restaurants = await prisma.restaurant.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true, isActive: true, emailVerifiedAt: true } },
      _count: { select: { menuItems: true, orders: true } },
    },
    orderBy: { name: 'asc' },
  })
  res.json({
    restaurants: restaurants.map(({ _count, ...r }) => ({ ...r, menuItemsCount: _count.menuItems, ordersCount: _count.orders })),
  })
})

router.patch('/restaurants/:id', validate(z.object({ isActive: z.boolean() })), async (req, res) => {
  const id = idParam(req)
  const restaurant = id && (await prisma.restaurant.findUnique({ where: { id } }))
  if (!restaurant) return res.status(404).json({ error: 'المطعم غير موجود' })

  const updated = await prisma.restaurant.update({ where: { id }, data: { isActive: req.body.isActive } })
  res.json({ restaurant: updated })
})

/* ---------- Orders ---------- */

const ordersQuery = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  restaurantId: z.coerce.number().int().positive().optional(),
})

router.get('/orders', validate(ordersQuery, 'query'), async (req, res) => {
  const { status, restaurantId } = req.validated
  const orders = await prisma.order.findMany({
    where: { ...(status && { status }), ...(restaurantId && { restaurantId }) },
    include: {
      items: true,
      restaurant: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, email: true } },
      driver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  res.json({ orders: orders.map(orderDto) })
})

export default router
