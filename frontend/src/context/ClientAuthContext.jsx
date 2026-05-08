import { createContext, useState, useEffect, useCallback } from 'react'
import clientApi from '../services/clientApi'

export const ClientAuthContext = createContext(null)

/**
 * Wipe PWA caches that may contain authenticated API responses or assets
 * scoped to the previous user. Safe to call when caches API is unavailable
 * (older browsers / non-secure contexts).
 */
async function clearAuthenticatedCaches() {
  if (typeof caches === 'undefined') return
  try {
    const names = await caches.keys()
    await Promise.all(
      names
        .filter((name) => name.startsWith('allways-api') || name.startsWith('allways-images'))
        .map((name) => caches.delete(name))
    )
  } catch {
    /* non-fatal */
  }
}

export function ClientAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('allways_cliente_token')
    const storedUser = localStorage.getItem('allways_cliente_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('allways_cliente_user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (cedula, password, recordarme) => {
    const response = await clientApi.post('/cliente/login', { cedula, password, recordarme })
    const { token: newToken, participante } = response.data.data
    localStorage.setItem('allways_cliente_token', newToken)
    localStorage.setItem('allways_cliente_user', JSON.stringify(participante))
    setToken(newToken)
    setUser(participante)
    return participante
  }, [])

  const logout = useCallback(async () => {
    try { await clientApi.post('/cliente/logout') } catch {}
    localStorage.removeItem('allways_cliente_token')
    localStorage.removeItem('allways_cliente_user')
    setToken(null)
    setUser(null)
    await clearAuthenticatedCaches()
  }, [])

  const logoutEverywhere = useCallback(async () => {
    try { await clientApi.post('/cliente/logout-everywhere') } catch {}
    localStorage.removeItem('allways_cliente_token')
    localStorage.removeItem('allways_cliente_user')
    setToken(null)
    setUser(null)
    await clearAuthenticatedCaches()
  }, [])

  const refreshMe = useCallback(async () => {
    const r = await clientApi.get('/cliente/me')
    setUser(r.data.data)
    localStorage.setItem('allways_cliente_user', JSON.stringify(r.data.data))
    return r.data.data
  }, [])

  const isAuthenticated = !!token && !!user

  return (
    <ClientAuthContext.Provider
      value={{ user, token, loading, login, logout, logoutEverywhere, refreshMe, isAuthenticated }}
    >
      {children}
    </ClientAuthContext.Provider>
  )
}
