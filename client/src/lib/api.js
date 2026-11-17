// Small fetch wrapper for the Tawseel REST API.
// In development Vite proxies /api to the Express server (see vite.config.js).
const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'tawseel_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || 'حدث خطأ غير متوقع')
    this.status = status
    this.details = body?.details || []
  }

  /** Field errors from the server as { fieldName: message }. */
  get fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]))
  }
}

export async function api(path, { method = 'GET', body, query } = {}) {
  const url = new URL(BASE_URL + path, window.location.origin)
  Object.entries(query || {}).forEach(([k, v]) => v !== undefined && v !== '' && url.searchParams.set(k, v))

  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError(0, { error: 'تعذّر الاتصال بالخادم، تحقق من الإنترنت' })
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('tawseel:unauthorized'))
    throw new ApiError(res.status, data)
  }
  return data
}
