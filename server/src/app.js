import fs from 'node:fs'
import path from 'node:path'
import compression from 'compression'
import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { authLimiter } from './middleware/rateLimit.js'
import adminRoutes from './routes/admin.routes.js'
import driverRoutes from './routes/driver.routes.js'
import authRoutes from './routes/auth.routes.js'
import myRestaurantRoutes from './routes/myRestaurant.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import restaurantsRoutes from './routes/restaurants.routes.js'

export const app = express()

// Railway (and most hosts) put the app behind a proxy; needed for correct client IPs in rate limiting.
app.set('trust proxy', 1)
// Gzip text responses (the JS bundle, CSS and API JSON shrink to about a quarter).
app.use(compression())
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
app.use('/api/driver', driverRoutes)

// In production the built React app (client/dist) is served by this same server,
// so the site and the API share one URL. Every non-API page returns index.html (React Router handles it).
const clientDist = process.env.CLIENT_DIST || path.resolve(import.meta.dirname, '../../client/dist')
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  // Built files in /assets have a content hash in their name, so a browser can keep them for a year;
  // photos for a week; index.html is always checked again so a new deploy shows up right away.
  app.use('/assets', express.static(path.join(clientDist, 'assets'), { index: false, immutable: true, maxAge: '1y' }))
  app.use(express.static(clientDist, { index: false, maxAge: '7d' }))
  app.get(/^(?!\/api(\/|$)).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html'), { headers: { 'Cache-Control': 'no-cache' } }))
}

app.use(notFound)
app.use(errorHandler)
