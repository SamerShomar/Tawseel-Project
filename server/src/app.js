import fs from 'node:fs'
import path from 'node:path'
import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { authLimiter } from './middleware/rateLimit.js'
import adminRoutes from './routes/admin.routes.js'
import authRoutes from './routes/auth.routes.js'
import myRestaurantRoutes from './routes/myRestaurant.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import restaurantsRoutes from './routes/restaurants.routes.js'

export const app = express()

// Railway (and most hosts) put the app behind a proxy; needed for correct client IPs in rate limiting.
app.set('trust proxy', 1)
app.use(cors({ origin: config.corsOrigins }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use(
  [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/auth/resend-verification',
  ],
  authLimiter,
)
app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantsRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/my-restaurant', myRestaurantRoutes)
app.use('/api/admin', adminRoutes)

// In production the built React app (client/dist) is served by this same server,
// so the site and the API share one URL. Every non-API page returns index.html (React Router handles it).
const clientDist = process.env.CLIENT_DIST || path.resolve(import.meta.dirname, '../../client/dist')
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }))
  app.get(/^(?!\/api(\/|$)).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')))
}

app.use(notFound)
app.use(errorHandler)
