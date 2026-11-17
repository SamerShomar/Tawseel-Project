// Validates req.body (or req.query) with a zod schema and replaces it with the parsed value.
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {})
  if (!result.success) {
    return res.status(400).json({
      error: 'بيانات غير صحيحة',
      details: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    })
  }
  if (source === 'body') req.body = result.data
  else req.validated = result.data
  next()
}
