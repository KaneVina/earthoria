import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
let refreshPromise = null
let sessionExpiredNotified = false

function notifySessionExpired(message) {
  if (sessionExpiredNotified) return
  sessionExpiredNotified = true
  toast.error(message || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
  setTimeout(() => { sessionExpiredNotified = false }, 3000)
}

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
    // Chỉ bỏ qua auto-refresh cho endpoint CÔNG KHAI /games/:code (trang
    // GamePlay tự xử lý 401 bằng cách điều hướng sang /login) — các gọi
    // /admin/games/* vẫn cần auto-refresh-retry như mọi endpoint admin khác.
    const isPublicGameRequest =
      originalRequest?.url?.includes('/games/') && !originalRequest?.url?.includes('/admin/')
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh')

    if (status === 401 && !isArRequest && !isPublicGameRequest && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const newToken = await refreshSession()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        notifySessionExpired(refreshError.response?.data?.message)
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    if (status === 401 && isAuthEndpoint) {
      useAuthStore.getState().logout()
      notifySessionExpired(error.response?.data?.message)
    }

    return Promise.reject(error)
  }
)

export default api;