// Users.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Lock, Unlock } from 'lucide-react'
import api from '../../services/api'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'

export default function Users() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => api.get('/admin/users', { params: { page, limit: 15, search } }).then(r => r.data.data)
  })
  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => { toast.success('Cập nhật tài khoản!'); qc.invalidateQueries(['admin-users']) },
    onError: () => toast.error('Thất bại!')
  })

  return (
    <AdminLayout currentPath="/admin/users">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)', marginBottom: 6 }}>Quản lý</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px,2.5vw,34px)', fontWeight: 300, color: '#0D3330' }}>
          Người <em style={{ fontStyle: 'italic', color: '#C9A84C' }}>Dùng</em>
        </h1>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
        <Search size={13} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(13,51,48,0.35)' }} />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Tìm kiếm người dùng..."
          style={{ background: '#F7F6F2', border: '1px solid rgba(13,51,48,0.12)', borderRadius: 6, padding: '9px 13px 9px 38px', fontSize: 13, color: '#0D3330', outline: 'none', width: '100%', fontFamily: 'Be Vietnam Pro, sans-serif' }}
          onFocus={e => e.target.style.borderColor = '#C9A84C'}
          onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(13,51,48,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAF8' }}>
              {['Người dùng', 'Vai trò', 'Đơn hàng', 'Ngày đăng ký', 'Trạng thái', ''].map(h => (
                <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)', fontSize: 13 }}>Đang tải...</td></tr>
            ) : data?.users?.map(user => (
              <tr key={user.id} style={{ borderTop: '1px solid rgba(13,51,48,0.06)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '13px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0D3330', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display, serif', fontSize: 14, color: '#C9A84C', flexShrink: 0, fontWeight: 600 }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: '#0D3330', fontWeight: 500 }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(13,51,48,0.4)' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '13px 18px' }}>
                  <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, fontWeight: 600, background: user.role === 'ADMIN' ? 'rgba(13,51,48,0.1)' : 'rgba(13,51,48,0.05)', color: user.role === 'ADMIN' ? '#0D3330' : 'rgba(13,51,48,0.45)' }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '13px 18px', fontSize: 13, color: '#0D3330', fontWeight: 500 }}>{user._count?.orders || 0}</td>
                <td style={{ padding: '13px 18px', fontSize: 12, color: 'rgba(13,51,48,0.4)' }}>{formatDate(user.createdAt)}</td>
                <td style={{ padding: '13px 18px' }}>
                  <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', background: user.isActive ? 'rgba(50,160,100,0.12)' : 'rgba(192,80,80,0.1)', color: user.isActive ? '#288A55' : '#B84040' }}>
                    {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td style={{ padding: '13px 18px' }}>
                  {user.role !== 'ADMIN' && (
                    <button onClick={() => toggleMutation.mutate(user.id)} title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                      style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${user.isActive ? '#B8404033' : '#C9A84C33'}`, background: user.isActive ? 'rgba(192,80,80,0.07)' : 'rgba(201,168,76,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: user.isActive ? '#B84040' : '#C9A84C' }}>
                      {user.isActive ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}