import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { prisma } from '../lib/prisma.js'

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}

/** Requires a valid "Authorization: Bearer <token>" header. Sets req.user. */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'يجب تسجيل الدخول' })

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return res.status(401).json({ error: 'يجب تسجيل الدخول' })
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'انتهت الجلسة، سجّل الدخول مرة أخرى' })
  }
}

/** Use after requireAuth: allows only the given roles. */
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'غير مسموح' })
  next()
}
