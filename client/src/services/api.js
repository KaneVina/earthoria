import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true // bắt buộc để cookie refreshToken (HttpOnly) được gửi kèm
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
let refreshPromise = null

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .then((res) => {
        const { accessToken, user } = res.data.data
        useAuthStore.getState().setAuth(user, accessToken)
        return accessToken
      })
      .catch((err) => {
        useAuthStore.getState().logout()
        throw err
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    const isArRequest = originalRequest?.url?.includes('/ar/')
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh')

    if (status === 401 && !isArRequest && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const newToken = await refreshSession()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    if (status === 401 && isAuthEndpoint) {
      useAuthStore.getState().logout()
    }

    return Promise.reject(error)
  }
)

export default api;