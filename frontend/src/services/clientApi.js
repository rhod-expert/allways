import axios from 'axios'

const clientApi = axios.create({
  baseURL: '/allways/api',
  headers: { 'Content-Type': 'application/json' }
})

clientApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('allways_cliente_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const path = window.location.pathname
      const isClientArea = path.includes('/cliente') &&
        !path.includes('/cliente/login') &&
        !path.includes('/cliente/recuperar') &&
        !path.includes('/cliente/setup-password') &&
        !path.includes('/cliente/reset-password')
      if (isClientArea) {
        localStorage.removeItem('allways_cliente_token')
        localStorage.removeItem('allways_cliente_user')
        window.location.href = '/allways/cliente/login'
      }
    }
    return Promise.reject(error)
  }
)

export default clientApi
