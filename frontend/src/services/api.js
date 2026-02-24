import axios from 'axios'

const api = axios.create({
  baseURL: '/allways/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('allways_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('allways_token')
      localStorage.removeItem('allways_user')
      if (window.location.pathname.includes('/admin') && !window.location.pathname.includes('/admin/login')) {
        window.location.href = '/allways/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
