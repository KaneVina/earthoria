// Users.jsx — Admin user management
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Lock, Unlock, X } from 'lucide-react'
import api from '../../services/api'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'

/* Avatar color pool (deterministic by first char) */
const AVATAR_COLORS = [
  '#0D3330', '#2a78d6', '#4a3aa7', '#4a9e3f', '#eda100', '#e34948',
]
const avatarColor = (name = '') =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

export default function Users() {
  const qc = useQueryClient()

  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [confirmUser, setConfirmUser] = useState(null) // { user, action: 'lock'|'unlock' }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn:  () => api.get('/admin/users', { params: { page, limit: 15, search } }).then(r => r.data.data),
    keepPreviousData: true,
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => {
      toast.success('Cập nhật tài khoản thành công!')
      qc.invalidateQueries(['admin-users'])
      setConfirmUser(null)
    },
    onError: () => toast.error('Cập nhật thất bại!'),
  })

  const users      = data?.users      ?? []
  const totalPages = data?.totalPages ?? 1
  const total      = data?.total      ?? 0

  return (
    <AdminLayout>

      {/* ── Header ── */}
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Quản lý</p>
          <h1 className="a-page-title">Người <em>Dùng</em></h1>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(13,51,48,0.4)' }}>
          Tổng <strong style={{ color: 'var(--a-ink)' }}>{total}</strong> tài khoản
        </div>
      </div>

      {/* ── Search ── */}
      <div className="a-search-wrap">
        <Search size={13} className="a-search-icon" />
        <input
          className="a-input"
          type="text"
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* ── Table ── */}
      <div className="a-table-card">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {['Người dùng', 'Vai trò', 'Đơn hàng', 'Ngày đăng ký', 'Trạng thái', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>
                    Đang tải...
                  </td>
                </tr>
              ) : !users.length ? (
                <tr>
                  <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : users.map(user => (
                <tr key={user.id}>
                  {/* User info */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        className="a-user-avatar"
                        style={{ background: avatarColor(user.name) }}
                      >
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 12 }}>{user.name}</div>
                        <div className="a-td-muted">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td>
                    <span className={`a-badge ${user.role === 'ADMIN' ? 'dark' : 'neutral'}`}>
                      {user.role}
                    </span>
                  </td>

                  {/* Order count */}
                  <td style={{ fontWeight: 500 }}>{user._count?.orders ?? 0}</td>

                  {/* Joined */}
                  <td className="a-td-muted">{formatDate(user.createdAt)}</td>

                  {/* Status */}
                  <td>
                    <span className={`a-badge ${user.isActive ? 'success' : 'danger'}`}>
                      {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>

                  {/* Action */}
                  <td>
                    {user.role !== 'ADMIN' && (
                      <button
                        className={`a-btn-icon ${user.isActive ? 'lock' : 'unlock'}`}
                        onClick={() => setConfirmUser({ user, action: user.isActive ? 'lock' : 'unlock' })}
                        aria-label={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {user.isActive ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="a-pagination">
          <span className="a-pagination-info">Tổng {total} người dùng</span>
          <div className="a-pagination-btns">
            <button
              className="a-page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  className={`a-page-btn${p === page ? ' active' : ''}`}
                  onClick={() => setPage(p)}
                >{p}</button>
              )
            })}
            <button
              className="a-page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >›</button>
          </div>
        </div>
      </div>

      {/* ── Confirm lock/unlock modal ── */}
      {confirmUser && (
        <div
          className="a-modal-overlay"
          onClick={e => e.target === e.currentTarget && setConfirmUser(null)}
        >
          <div className="a-modal" style={{ maxWidth: 420 }}>
            <div className="a-modal-header">
              <h3 className="a-modal-title">
                {confirmUser.action === 'lock' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              </h3>
              <button className="a-modal-close" onClick={() => setConfirmUser(null)}><X size={16} /></button>
            </div>
            <div className="a-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div className="a-user-avatar" style={{ width: 40, height: 40, fontSize: 16, background: avatarColor(confirmUser.user.name) }}>
                  {confirmUser.user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{confirmUser.user.name}</div>
                  <div className="a-td-muted">{confirmUser.user.email}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(13,51,48,0.65)', lineHeight: 1.6 }}>
                {confirmUser.action === 'lock'
                  ? 'Tài khoản này sẽ bị khóa. Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.'
                  : 'Tài khoản này sẽ được mở khóa. Người dùng có thể đăng nhập và mua hàng bình thường.'
                }
              </p>
            </div>
            <div className="a-modal-footer">
              <button
                className="a-btn-primary"
                style={{ background: confirmUser.action === 'lock' ? '#c05050' : '#4a9e3f' }}
                onClick={() => toggleMutation.mutate(confirmUser.user.id)}
                disabled={toggleMutation.isPending}
              >
                {toggleMutation.isPending
                  ? 'Đang xử lý...'
                  : (confirmUser.action === 'lock' ? 'Khóa tài khoản' : 'Mở khóa')
                }
              </button>
              <button className="a-btn-ghost" onClick={() => setConfirmUser(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  )
}