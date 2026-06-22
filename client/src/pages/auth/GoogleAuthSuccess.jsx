import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function GoogleAuthSuccess() {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const token  = params.get('token')
    const id     = params.get('id')
    const name   = params.get('name')
    const email  = params.get('email')
    const avatar = params.get('avatar')
    const role   = params.get('role')

    if (!token) {
      toast.error('Đăng nhập Google thất bại')
      navigate('/login')
      return
    }

    setAuth({ id, name, email, avatar, role }, token)
    toast.success(`Chào mừng, ${name}!`)
    navigate('/')
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      flexDirection: 'column', gap: '16px'
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="var(--forest)" strokeWidth="1.5"
        style={{ animation: 'spin .7s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
      </svg>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
        Đang xử lý đăng nhập...
      </p>
    </div>
  )
}