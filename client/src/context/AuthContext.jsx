import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, tokenStore } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()))

  // Restore the session from the saved token.
  useEffect(() => {
    if (!tokenStore.get()) return
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // Any 401 from the API (expired token) logs the user out.
  useEffect(() => {
    window.addEventListener('tawseel:unauthorized', logout)
    return () => window.removeEventListener('tawseel:unauthorized', logout)
  }, [logout])

  const saveSession = useCallback(({ token, user }) => {
    tokenStore.set(token)
    setUser(user)
    return user
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isOwner: user?.role === 'RESTAURANT_OWNER',
      isAdmin: user?.role === 'ADMIN',
      // Customers and visitors can order; owners and admins cannot.
      canOrder: !user || user.role === 'CUSTOMER',
      login: async (email, password) => saveSession(await api('/auth/login', { method: 'POST', body: { email, password } })),
      register: async (form) => saveSession(await api('/auth/register', { method: 'POST', body: form })),
      logout,
      /** Updates the logged-in user (e.g. after verifying the email). */
      setUser: (u) => setUser((prev) => (prev && u && prev.id === u.id ? { ...prev, ...u } : prev)),
    }),
    [user, loading, logout, saveSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
