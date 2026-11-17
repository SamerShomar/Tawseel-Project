import { rateLimit } from 'express-rate-limit'

// Slows down password guessing and email spam on login / forgot-password.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'محاولات كثيرة، حاول مرة أخرى بعد قليل' },
})
