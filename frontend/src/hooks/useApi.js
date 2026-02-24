import { useState, useCallback } from 'react'
import api from '../services/api'

export default function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true)
    setError(null)
    try {
      let response
      if (method === 'get' || method === 'delete') {
        response = await api[method](url, config)
      } else {
        response = await api[method](url, data, config)
      }
      return response.data
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Error desconocido'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const get = useCallback((url, config) => request('get', url, null, config), [request])
  const post = useCallback((url, data, config) => request('post', url, data, config), [request])
  const put = useCallback((url, data, config) => request('put', url, data, config), [request])
  const patch = useCallback((url, data, config) => request('patch', url, data, config), [request])
  const del = useCallback((url, config) => request('delete', url, null, config), [request])

  const clearError = useCallback(() => setError(null), [])

  return { loading, error, get, post, put, patch, del, clearError }
}
