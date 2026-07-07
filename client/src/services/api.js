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

// Gom các request bị 401 trong lúc đang refresh lại, tránh gọi /auth/refresh
// nhiều lần song song (vd 5 request cùng lúc đều hết hạn access token).
let isRefreshing = false
let refreshSubscribers = []

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb)
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken))
  refreshSubscribers = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // Request tới /ar/:code tự xử lý 401 riêng (điều hướng kèm ?redirect=
    // để quay lại đúng trang AR sau khi login) — bỏ qua auto-refresh/redirect
    // ở đây để logic trong ArView.jsx được chạy.
    const isArRequest = originalRequest?.url?.includes('/ar/')
    // Chính request login hoặc refresh bị 401 thì không cố refresh đệ quy nữa,
    // coi như phiên thật sự đã hết, cho lỗi rơi thẳng xuống caller.
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh')

    if (status === 401 && !isArRequest && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        // Đang có 1 request khác refresh rồi, đợi kết quả rồi retry theo
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (!newToken) {
              reject(error)
              return
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(api(originalRequest))
          })
        })
      }

      isRefreshing = true
      try {
        const refreshRes = await api.post('/auth/refresh')
        const { accessToken, user } = refreshRes.data.data
        useAuthStore.getState().setAuth(user, accessToken)
        onRefreshed(accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        onRefreshed(null)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (status === 401 && isAuthEndpoint) {
      useAuthStore.getState().logout()
    }

    return Promise.reject(error)
  }
)

export default api