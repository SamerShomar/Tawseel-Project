import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { config } from '../config.js'
import { sendPasswordResetEmail } from '../lib/mailer.js'
import { prisma } from '../lib/prisma.js'
import { publicUser } from '../lib/serialize.js'
import { requireAuth, signToken } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const email = z.string().trim().toLowerCase().email('البريد الإلكتروني غير صحيح')
const password = z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل').max(100)
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'الاسم قصير جداً').max(100),
    email,
    password,
    phone: z.string().trim().max(30).optional(),
    role: z.enum(['CUSTOMER', 'RESTAURANT_OWNER']).default('CUSTOMER'),
    restaurantName: z.string().trim().max(100).optional(),
  })
  .refine((d) => d.role !== 'RESTAURANT_OWNER' || (d.restaurantName && d.restaurantName.length >= 2), {
    message: 'اسم المطعم مطلوب',
    path: ['restaurantName'],
  })

router.post('/register', validate(registerSchema), async (req, res) => {
  const { name, email, password, phone, role, restaurantName } = req.body

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ error: 'هذا البريد مسجّل مسبقاً' })

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      role,
      passwordHash: await bcrypt.hash(password, 10),
      // A restaurant owner gets an (empty) restaurant right away; they fill in the details from the dashboard.
      ...(role === 'RESTAURANT_OWNER' && { restaurant: { create: { name: restaurantName, phone: phone ?? '' } } }),
    },
  })

  res.status(201).json({ token: signToken(user), user: publicUser(user) })
})

const loginSchema = z.object({ email, password: z.string().min(1, 'كلمة المرور مطلوبة') })

router.post('/login', validate(loginSchema), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } })
  const ok = user && (await bcrypt.compare(req.body.password, user.passwordHash))
  if (!ok) return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' })
  if (!user.isActive) return res.status(403).json({ error: 'تم إيقاف هذا الحساب، تواصل مع إدارة الموقع' })

  res.json({ token: signToken(user), user: publicUser(user) })
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

router.post('/forgot-password', validate(z.object({ email })), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } })

  if (user) {
    const token = crypto.randomBytes(32).toString('hex')
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: hashToken(token),
        resetTokenExpires: new Date(Date.now() + config.resetTokenMinutes * 60_000),
      },
    })
    try {
      await sendPasswordResetEmail(user.email, `${config.clientUrl}/reset-password?token=${token}`)
    } catch (err) {
      // Logged for the team; the response stays the same so it never reveals which emails exist.
      console.error(`[mail] Could not send the password reset email: ${err.message}`)
    }
  }

  // Same answer whether or not the email exists, so nobody can check which emails are registered.
  res.json({ message: 'إذا كان البريد مسجلاً، فستصلك رسالة لإعادة تعيين كلمة المرور' })
})

const resetSchema = z.object({ token: z.string().min(10), password })

router.post('/reset-password', validate(resetSchema), async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { resetTokenHash: hashToken(req.body.token), resetTokenExpires: { gt: new Date() } },
  })
  if (!user) return res.status(400).json({ error: 'الرابط غير صالح أو منتهي الصلاحية' })

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(req.body.password, 10), resetTokenHash: null, resetTokenExpires: null },
  })
  res.json({ message: 'تم تغيير كلمة المرور، يمكنك تسجيل الدخول الآن' })
})

export default router
