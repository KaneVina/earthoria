import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Lock, Unlock, X, ChevronDown, Copy, Check, ArrowUpCircle, ArrowDownCircle, UserPlus, Eye } from 'lucide-react'
import api from "../../../services/api";
import { formatDate } from "../../../utils/helpers";
import toast from 'react-hot-toast'
import AdminLayout from '../AdminLayout'
import Pagination from '../../../components/Pagination'
import { useAuthStore } from '../../../store/authStore'
import UserDetailDrawer from './UserDetailDrawer'

/* ─ Avatar color pool (deterministic by first char) ─ */
const AVATAR_COLORS = [
  '#0D3330', '#2a78d6', '#4a3aa7', '#4a9e3f', '#eda100', '#e34948',
]
const avatarColor = (name = '') =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

/* ─ Role badge config — mỗi vai trò một màu, đều bo tròn (đồng bộ .a-badge) ─ */
const ROLE_CONFIG = {
  ADMIN:    { label: 'Admin',    cls: 'dark'    },
  STAFF:    { label: 'Staff',    cls: 'blue'    },
  DEALER:   { label: 'Dealer',   cls: 'purple'  },
  CUSTOMER: { label: 'Customer', cls: 'neutral' },
}

/* ─ UserCodeBadge ─ */
function UserCodeBadge({ code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async (e) => {
    e.stopPropagation()
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback
    }
  }, [code])

  if (!code) {
    return <span className="a-td-muted" style={{ fontSize: 11 }}>—</span>
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <code style={{
        fontSize: 10.5,
        fontFamily: 'monospace',
        background: 'rgba(13,51,48,0.06)',
        padding: '2px 6px',
        borderRadius: 4,
        color: 'var(--a-ink)',
        letterSpacing: '0.03em',
        userSelect: 'all',
      }}>
        {code}
      </code>
      <button
        onClick={handleCopy}
        style={{
          background: 'none',
          border: 'none',
          padding: '2px 3px',
          cursor: 'pointer',
          color: copied ? '#4a9e3f' : 'rgba(13,51,48,0.35)',
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.15s',
        }}
        aria-label="Sao chép mã"
        title={copied ? 'Đã sao chép!' : 'Sao chép mã'}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </div>
  )
}

/* ─ FilterSelect ─ */
function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          background: 'var(--a-surface, #fff)',
          border: '1px solid rgba(13,51,48,0.12)',
          borderRadius: 8,
          padding: '7px 30px 7px 11px',
          fontSize: 12,
          color: value ? 'var(--a-ink)' : 'rgba(13,51,48,0.4)',
          cursor: 'pointer',
          outline: 'none',
          minWidth: 120,
          fontFamily: 'inherit',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown
        size={12}
        style={{
          position: 'absolute',
          right: 9,
          pointerEvents: 'none',
          color: 'rgba(13,51,48,0.4)',
        }}
      />
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function Users() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { user: viewer } = useAuthStore()
  const viewerRole = viewer?.role // 'STAFF' | 'ADMIN'

  const [searchInput, setSearchInput]   = useState('')
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [roleFilter, setRoleFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmUser, setConfirmUser]   = useState(null) // lock/unlock
  const [promoteUser, setPromoteUser]   = useState(null) // upgrade/downgrade
  const [viewUserId, setViewUserId]     = useState(null) // xem chi tiết

  // State cho form xác nhận khóa (email + lý do)
  const [lockEmailInput, setLockEmailInput] = useState('')
  const [lockReason, setLockReason]         = useState('')

  // Debounce search để tránh gọi API liên tục khi gõ
  const handleSearchChange = useCallback((val) => {
    setSearchInput(val)
    clearTimeout(window.__userSearchTimer)
    window.__userSearchTimer = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 350)
  }, [])

  const handleRoleChange = useCallback((val) => {
    setRoleFilter(val)
    setPage(1)
  }, [])

  const handleStatusChange = useCallback((val) => {
    setStatusFilter(val)
    setPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setSearchInput('')
    setSearch('')
    setRoleFilter('')
    setStatusFilter('')
    setPage(1)
  }, [])

  const hasFilters = searchInput || roleFilter || statusFilter

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter, statusFilter],
    queryFn:  () => api.get('/admin/users', {
      params: {
        page,
        limit: 15,
        ...(search       && { search }),
        ...(roleFilter   && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
      },
    }).then(r => r.data.data),
    keepPreviousData: true,
  })

  const closeLockModal = useCallback(() => {
    setConfirmUser(null)
    setLockEmailInput('')
    setLockReason('')
  }, [])

  const toggleMutation = useMutation({
    mutationFn: ({ id, email, reason }) => api.put(`/admin/users/${id}/toggle`, { email, reason }),
    onSuccess: () => {
      toast.success(
        confirmUser?.action === 'lock'
          ? 'Đã khóa tài khoản! Email thông báo kèm lý do đã được gửi.'
          : 'Đã mở khóa tài khoản!'
      )
      qc.invalidateQueries(['admin-users'])
      qc.invalidateQueries(['admin-user-detail'])
      closeLockModal()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Cập nhật thất bại!'),
  })

  const promoteMutation = useMutation({
    mutationFn: ({ id, role }) => api.put(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      toast.success('Cập nhật cấp bậc thành công! Email thông báo đã được gửi.')
      qc.invalidateQueries(['admin-users'])
      setPromoteUser(null)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Cập nhật thất bại!'),
  })

  const users      = data?.users      ?? []
  const totalPages = data?.totalPages ?? 1
  const total      = data?.total      ?? 0

  /*  Phân quyền theo role người đang xem  */
  // Staff: xem staff (read-only), xem+sửa customer/dealer
  // Admin: xem+sửa customer/dealer/staff
  const canPromote = (targetRole) => ['CUSTOMER', 'DEALER'].includes(targetRole)

  const canToggle = (targetRole) => {
    if (viewerRole === 'STAFF') return ['CUSTOMER', 'DEALER'].includes(targetRole)
    if (viewerRole === 'ADMIN') return ['CUSTOMER', 'DEALER', 'STAFF'].includes(targetRole)
    return false
  }

  const canCreateRoles = viewerRole === 'ADMIN' ? ['DEALER', 'STAFF'] : viewerRole === 'STAFF' ? ['DEALER'] : []

  const roleFilterOptions = viewerRole === 'ADMIN'
    ? [
        { value: 'CUSTOMER', label: 'Customer' },
        { value: 'DEALER',   label: 'Dealer'    },
        { value: 'STAFF',    label: 'Staff'     },
      ]
    : [
        { value: 'CUSTOMER', label: 'Customer' },
        { value: 'DEALER',   label: 'Dealer'    },
        { value: 'STAFF',    label: 'Staff'     },
      ]

  // Điều kiện để xác nhận khóa: email nhập đúng + lý do đủ dài (đồng bộ với BE, tối thiểu 10 ký tự)
  const lockEmailMatches = confirmUser?.action === 'lock'
    ? lockEmailInput.trim().toLowerCase() === confirmUser.user.email.toLowerCase()
    : true
  const lockReasonValid = confirmUser?.action === 'lock'
    ? lockReason.trim().length >= 10
    : true
  const canSubmitLock = confirmUser?.action === 'unlock' || (lockEmailMatches && lockReasonValid)

  return (
    <AdminLayout>

      {/*  Header  */}
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Quản lý</p>
          <h1 className="a-page-title">Người <em>Dùng</em></h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 12, color: 'rgba(13,51,48,0.4)' }}>
            Tổng <strong style={{ color: 'var(--a-ink)' }}>{total}</strong> tài khoản
          </div>
          {canCreateRoles.length > 0 && (
            <button
              className="a-btn-primary"
              style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => navigate('/dashboard/users/new')}
            >
              <UserPlus size={13} />
              Tạo tài khoản
            </button>
          )}
        </div>
      </div>

      {/*  Search & Filters  */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
        alignItems: 'center',
      }}>
        {/* Search box */}
        <div className="a-search-wrap" style={{ flex: '1 1 220px', minWidth: 200, marginBottom: 0 }}>
          <Search size={13} className="a-search-icon" />
          <input
            className="a-input"
            type="text"
            placeholder="Tìm tên, email hoặc mã người dùng..."
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange('')}
              style={{
                position: 'absolute',
                right: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(13,51,48,0.35)',
                display: 'flex',
                padding: 0,
              }}
              aria-label="Xóa tìm kiếm"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Role filter */}
        <FilterSelect
          value={roleFilter}
          onChange={handleRoleChange}
          placeholder="Tất cả vai trò"
          options={roleFilterOptions}
        />

        {/* Status filter */}
        <FilterSelect
          value={statusFilter}
          onChange={handleStatusChange}
          placeholder="Tất cả trạng thái"
          options={[
            { value: 'active', label: 'Đang hoạt động' },
            { value: 'locked', label: 'Đã khóa'        },
          ]}
        />

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              background: 'none',
              border: '1px solid rgba(13,51,48,0.12)',
              borderRadius: 8,
              padding: '7px 12px',
              fontSize: 12,
              color: 'rgba(13,51,48,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            <X size={11} />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/*  Table  */}
      <div className="a-table-card">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {['Mã người dùng', 'Người dùng', 'Vai trò', 'Đơn hàng', 'Ngày đăng ký', 'Trạng thái', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>
                    Đang tải...
                  </td>
                </tr>
              ) : !users.length ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>
                    {hasFilters
                      ? 'Không tìm thấy kết quả phù hợp'
                      : 'Không có người dùng nào'}
                  </td>
                </tr>
              ) : users.map(user => {
                const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.CUSTOMER
                const showPromote = canPromote(user.role)
                const showToggle = canToggle(user.role)
                return (
                  <tr
                    key={user.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setViewUserId(user.id)}
                  >
                    {/* User code */}
                    <td style={{ minWidth: 160 }} onClick={e => e.stopPropagation()}>
                      <UserCodeBadge code={user.userCode} />
                    </td>

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
                      <span className={`a-badge ${roleCfg.cls}`}>
                        {roleCfg.label}
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
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="a-btn-icon"
                          onClick={() => setViewUserId(user.id)}
                          title="Xem chi tiết"
                          aria-label="Xem chi tiết"
                        >
                          <Eye size={13} />
                        </button>
                        {showPromote && (
                          <button
                            className="a-btn-icon"
                            onClick={() => setPromoteUser(user)}
                            title={user.role === 'CUSTOMER' ? 'Nâng lên Dealer' : 'Hạ xuống Customer'}
                            aria-label={user.role === 'CUSTOMER' ? 'Nâng lên Dealer' : 'Hạ xuống Customer'}
                          >
                            {user.role === 'CUSTOMER' ? <ArrowUpCircle size={13} /> : <ArrowDownCircle size={13} />}
                          </button>
                        )}
                        {showToggle && (
                          <button
                            className={`a-btn-icon ${user.isActive ? 'lock' : 'unlock'}`}
                            onClick={() => setConfirmUser({ user, action: user.isActive ? 'lock' : 'unlock' })}
                            aria-label={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {user.isActive ? <Lock size={12} /> : <Unlock size={12} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination — dùng component dùng chung */}
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={total}
          label="người dùng"
        />
      </div>

      {/*  Detail drawer  */}
      {viewUserId && (
        <UserDetailDrawer userId={viewUserId} onClose={() => setViewUserId(null)} />
      )}

      {/*  Confirm lock/unlock modal  */}
      {confirmUser && (
        <div
          className="a-modal-overlay"
          onClick={e => e.target === e.currentTarget && closeLockModal()}
        >
          <div className="a-modal" style={{ maxWidth: 440 }}>
            <div className="a-modal-header">
              <h3 className="a-modal-title">
                {confirmUser.action === 'lock' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              </h3>
              <button className="a-modal-close" onClick={closeLockModal}>
                <X size={16} />
              </button>
            </div>
            <div className="a-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  className="a-user-avatar"
                  style={{ width: 40, height: 40, fontSize: 16, background: avatarColor(confirmUser.user.name) }}
                >
                  {confirmUser.user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{confirmUser.user.name}</div>
                  <div className="a-td-muted">{confirmUser.user.email}</div>
                </div>
              </div>
              {confirmUser.user.userCode && (
                <div style={{ marginBottom: 12 }}>
                  <UserCodeBadge code={confirmUser.user.userCode} />
                </div>
              )}

              {confirmUser.action === 'unlock' ? (
                <p style={{ fontSize: 13, color: 'rgba(13,51,48,0.65)', lineHeight: 1.6 }}>
                  Tài khoản này sẽ được mở khóa. Người dùng có thể đăng nhập và mua hàng bình thường.
                  Email thông báo sẽ được gửi tự động.
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: 'rgba(13,51,48,0.65)', lineHeight: 1.6, marginBottom: 16 }}>
                    Tài khoản này sẽ bị khóa. Để xác nhận, vui lòng nhập đúng email của tài khoản
                    và lý do khóa.
                  </p>

                  <label className="a-form-label" htmlFor="lock-email-confirm">
                    Nhập email để xác nhận
                  </label>
                  <input
                    id="lock-email-confirm"
                    className="a-input"
                    type="email"
                    placeholder={confirmUser.user.email}
                    value={lockEmailInput}
                    onChange={e => setLockEmailInput(e.target.value)}
                    style={{ marginBottom: 4 }}
                    autoComplete="off"
                  />
                  {lockEmailInput.length > 0 && !lockEmailMatches && (
                    <div style={{ fontSize: 11, color: '#c05050', marginBottom: 10 }}>
                      Email chưa khớp với tài khoản này
                    </div>
                  )}
                  {(lockEmailInput.length === 0 || lockEmailMatches) && (
                    <div style={{ marginBottom: 10 }} />
                  )}

                  <label className="a-form-label" htmlFor="lock-reason" style={{ marginTop: 10, display: 'block' }}>
                    Lý do khóa tài khoản
                  </label>
                  <textarea
                    id="lock-reason"
                    className="a-input a-textarea"
                    placeholder="Vd: Vi phạm điều khoản sử dụng, gian lận thanh toán, yêu cầu từ người dùng..."
                    value={lockReason}
                    onChange={e => setLockReason(e.target.value)}
                    disabled={!lockEmailMatches}
                  />
                  <div style={{
                    fontSize: 11,
                    color: lockReason.length > 0 && !lockReasonValid ? '#c05050' : 'rgba(13,51,48,0.4)',
                    marginTop: 5,
                  }}>
                    {lockReason.trim().length >= 10
                      ? 'Lý do hợp lệ'
                      : `Tối thiểu 10 ký tự (hiện ${lockReason.trim().length})`}
                  </div>
                </>
              )}
            </div>
            <div className="a-modal-footer">
              <button
                className="a-btn-primary"
                style={{ background: confirmUser.action === 'lock' ? '#c05050' : '#4a9e3f' }}
                onClick={() => toggleMutation.mutate({
                  id: confirmUser.user.id,
                  email: confirmUser.action === 'lock' ? lockEmailInput.trim() : undefined,
                  reason: confirmUser.action === 'lock' ? lockReason.trim() : undefined,
                })}
                disabled={toggleMutation.isPending || !canSubmitLock}
              >
                {toggleMutation.isPending
                  ? 'Đang xử lý...'
                  : (confirmUser.action === 'lock' ? 'Khóa tài khoản' : 'Mở khóa')
                }
              </button>
              <button className="a-btn-ghost" onClick={closeLockModal}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/*  Confirm promote/demote modal  */}
      {promoteUser && (
        <div
          className="a-modal-overlay"
          onClick={e => e.target === e.currentTarget && setPromoteUser(null)}
        >
          <div className="a-modal" style={{ maxWidth: 420 }}>
            <div className="a-modal-header">
              <h3 className="a-modal-title">
                {promoteUser.role === 'CUSTOMER' ? 'Nâng cấp lên Dealer' : 'Hạ cấp xuống Customer'}
              </h3>
              <button className="a-modal-close" onClick={() => setPromoteUser(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="a-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  className="a-user-avatar"
                  style={{ width: 40, height: 40, fontSize: 16, background: avatarColor(promoteUser.name) }}
                >
                  {promoteUser.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{promoteUser.name}</div>
                  <div className="a-td-muted">{promoteUser.email}</div>
                </div>
              </div>
              {promoteUser.userCode && (
                <div style={{ marginBottom: 12 }}>
                  <UserCodeBadge code={promoteUser.userCode} />
                </div>
              )}
              <p style={{ fontSize: 13, color: 'rgba(13,51,48,0.65)', lineHeight: 1.6 }}>
                Hệ thống sẽ tự sinh <strong>mã ETR mới</strong> và <strong>mật khẩu tạm thời mới</strong>,
                gửi email thông báo đến người dùng. Họ cần đổi mật khẩu ngay khi đăng nhập lần đầu.
              </p>
            </div>
            <div className="a-modal-footer">
              <button
                className="a-btn-primary"
                disabled={promoteMutation.isPending}
                onClick={() => promoteMutation.mutate({
                  id: promoteUser.id,
                  role: promoteUser.role === 'CUSTOMER' ? 'DEALER' : 'CUSTOMER',
                })}
              >
                {promoteMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
              <button className="a-btn-ghost" onClick={() => setPromoteUser(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  )
}