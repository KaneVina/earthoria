import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import FullScreenLoader from "../../components/FullScreenLoader";

import toast from 'react-hot-toast'

// Backend (googleCallback) giờ KHÔNG còn nhét token/thông tin user vào query
// string nữa (tránh lộ qua URL/lịch sử trình duyệt/log). Nó chỉ set cookie
// refreshToken (HttpOnly) rồi redirect về đây. Trang này chỉ việc gọi
// /auth/refresh — cookie tự động gửi kèm — để lấy accessToken + user thật.
export default function GoogleAuthSuccess() {
  const navigate    = useNavigate()
  const { setAuth }  = useAuthStore()
  const handled      = useRef(false) // chặn StrictMode chạy 2 lần

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const run = async () => {
      try {
        await authService.refresh()
        const { user } = useAuthStore.getState()
        toast.success(`Chào mừng trở lại, ${user.name}!`)

        if (user.role === 'ADMIN') {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } catch (err) {
        toast.error('Đăng nhập Google thất bại')
        navigate('/login', { replace: true })
      }
    }

    run()
  }, [])

return <FullScreenLoader message="Đang xử lý đăng nhập..." />;
}