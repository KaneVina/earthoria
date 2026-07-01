import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Request tới /ar/:code tự xử lý 401 riêng (điều hướng kèm
    // ?redirect= để quay lại đúng trang AR sau khi login, thay vì bị
    // logout cứng như các API khác) — bỏ qua auto-redirect ở đây để
    // logic trong ArView.jsx được chạy.
    const isArRequest = error.config?.url?.includes('/ar/')

    if (error.response?.status === 401 && !isArRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api