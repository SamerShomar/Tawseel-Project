import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import myRestaurantRoutes from './routes/myRestaurant.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import restaurantsRoutes from './routes/restaurants.routes.js'

export const app = express()

app.use(cors({ origin: config.clientUrl }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantsRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/my-restaurant', myRestaurantRoutes)

app.use(notFound)
app.use(errorHandler)
