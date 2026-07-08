// UserCreate.jsx — Trang tạo tài khoản Dealer / Staff (thay cho modal)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, UserPlus } from 'lucide-react'
import api from "../../../services/api";
import toast from 'react-hot-toast'
import AdminLayout from '../AdminLayout'
import { useAuthStore } from '../../../store/authStore'

const ROLE_OPTIONS = {
  ADMIN: [
    { value: 'DEALER', label: 'Dealer' },
    { value: 'STAFF',  label: 'Staff'  },
  ],
  STAFF: [
    { value: 'DEALER', label: 'Dealer' },
  ],
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(13,51,48,0.7)', display: 'block', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#c05050' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function UserCreate() {
  const navigate = useNavigate()
  const { user: viewer } = useAuthStore()
  const viewerRole = viewer?.role
  const roleOptions = ROLE_OPTIONS[viewerRole] ?? []

  const [form, setForm] = useState({
    name: '', email: '', role: roleOptions.length === 1 ? roleOptions[0].value : '',
    gender: '', phone: '',
  })

  const update = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/admin/users', payload),
    onSuccess: () => {
      toast.success('Tạo tài khoản thành công! Email thông báo đã được gửi.')
      navigate('/dashboard/users')
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Tạo tài khoản thất bại!'),
  })

  const canSubmit = form.name.trim() && form.email.trim() && form.role

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    createMutation.mutate(form)
  }

  return (
    <AdminLayout>
      <div className="a-page-header">
        <div>
          <button
            onClick={() => navigate('/dashboard/users')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'rgba(13,51,48,0.5)', padding: 0, marginBottom: 10,
              fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={13} />
            Quay lại danh sách người dùng
          </button>
          <p className="a-page-eyebrow">Quản lý</p>
          <h1 className="a-page-title">Tạo Tài <em>Khoản</em></h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
        <div className="a-table-card" style={{ padding: 28 }}>

          <Field label="Họ và tên" required>
            <input
              className="a-input"
              value={form.name}
              onChange={update('name')}
              placeholder="Nguyễn Văn A"
            />
          </Field>

          <Field label="Email" required>
            <input
              className="a-input"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="email@example.com"
            />
          </Field>

          <Field label="Vai trò" required>
            <select
              className="a-input"
              value={form.role}
              onChange={update('role')}
              style={{ cursor: 'pointer' }}
            >
              <option value="">Chọn vai trò</option>
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <Field label="Giới tính">
                <select
                  className="a-input"
                  value={form.gender}
                  onChange={update('gender')}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">Không chọn</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Số điện thoại">
                <input
                  className="a-input"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="09xxxxxxxx"
                />
              </Field>
            </div>
          </div>

          <div style={{
            background: 'rgba(74,158,63,0.05)',
            border: '1px solid rgba(74,158,63,0.16)',
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 6,
          }}>
            <p style={{ fontSize: 12, color: '#3d6b38', lineHeight: 1.7, margin: 0 }}>
              Mã ETR và mật khẩu tạm thời sẽ được hệ thống tự sinh ngẫu nhiên và gửi qua email
              cho người dùng, kèm yêu cầu đổi mật khẩu ngay khi đăng nhập lần đầu.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            type="submit"
            className="a-btn-primary"
            disabled={!canSubmit || createMutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <UserPlus size={14} />
            {createMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
          <button
            type="button"
            className="a-btn-ghost"
            onClick={() => navigate('/dashboard/users')}
          >
            Hủy
          </button>
        </div>
      </form>
    </AdminLayout>
  )
}