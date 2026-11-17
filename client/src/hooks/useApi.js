import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'

/**
 * Loads data from the API: const { data, error, loading, reload } = useApi('/restaurants')
 * Pass `pollMs` to refresh automatically (used for live order status).
 */
export function useApi(path, { query, pollMs } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const queryKey = JSON.stringify(query || {})

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setState((s) => ({ ...s, loading: true }))
      try {
        const data = await api(path, { query: JSON.parse(queryKey) })
        setState({ data, error: null, loading: false })
      } catch (error) {
        setState((s) => ({ data: silent ? s.data : null, error, loading: false }))
      }
    },
    [path, queryKey],
  )

  useEffect(() => {
    load()
    if (!pollMs) return
    const id = setInterval(() => load(true), pollMs)
    return () => clearInterval(id)
  }, [load, pollMs])

  return { ...state, reload: () => load(true), setData: (fn) => setState((s) => ({ ...s, data: fn(s.data) })) }
}
