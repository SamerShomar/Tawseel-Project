import { HttpError } from '../lib/errors.js'

export function notFound(req, res) {
  res.status(404).json({ error: 'المسار غير موجود' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON غير صالح' })
  console.error(err)
  res.status(500).json({ error: 'حدث خطأ في الخادم' })
}
