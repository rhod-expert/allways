import { createContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('allways_token')
    const storedUser = localStorage.getItem('allways_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('allways_user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    const response = await api.post('/admin/login', { username, password })
    const { token: newToken, admin: newUser } = response.data.data
    localStorage.setItem('allways_token', newToken)
    localStorage.setItem('allways_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('allways_token')
    localStorage.removeItem('allways_user')
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}
