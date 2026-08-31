import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Lock, Unlock, X, ChevronDown, Copy, Check,
  ArrowUpCircle, ArrowDownCircle, UserPlus, Eye, Download, Users as UsersIcon,
} from 'lucide-react'
import api from "../../../services/api";
import { formatDateShort } from "../../../utils/helpers";
import toast from 'react-hot-toast'
import AdminLayout from '../AdminLayout'
import Pagination from '../../../components/Pagination'
import { useAuthStore } from '../../../store/authStore'
import UserDetailDrawer from './UserDetailDrawer'
import { TierBadge } from './UserBadges'

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

/* ─ CopyButton dùng chung cho mã code & email ─ */
function CopyButton({ value, label = 'Sao chép' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async (e) => {
    e.stopPropagation()
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback
    }
  }, [value])

  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'none',
        border: 'none',
        padding: '2px 3px',
        cursor: 'pointer',
        color: copied ? '#4a9e3f' : 'rgba(13,51,48,0.3)',
        borderRadius: 3,
        display: 'inline-flex',
        alignItems: 'center',
        transition: 'color 0.15s',
      }}
      aria-label={label}
      title={copied ? 'Đã sao chép!' : label}
    >
      {copied ? <Check size={10.5} /> : <Copy size={10.5} />}
    </button>
  )
}

/* ─ UserCodeBadge ─ */
function UserCodeBadge({ code }) {
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
      <CopyButton value={code} label="Sao chép mã" />
    </div>
  )
}

/* ─ TierBadge — hạng thành viên, dùng chung với UserDetailDrawer (xem ./UserBadges.jsx) ─ */

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

/* ─ Skeleton row khi đang tải (bao gồm cả ô checkbox) ─ */
function SkeletonRow() {
  const bar = (w, h = 12) => (
    <div className="a-skeleton" style={{ width: w, height: h }} />
  )
  return (
    <tr>
      <td>{bar(16, 16)}</td>
      <td>{bar(110)}</td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="a-skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bar(90)}
            {bar(130, 9)}
          </div>
        </div>
      </td>
      <td>{bar(60, 18)}</td>
      <td>{bar(50, 18)}</td>
      <td>{bar(24)}</td>
      <td>{bar(80)}</td>
      <td>{bar(70, 18)}</td>
      <td>{bar(50)}</td>
    </tr>
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
  const [tierFilter, setTierFilter]     = useState('')
  const [confirmUser, setConfirmUser]   = useState(null) // lock/unlock (1 user)
  const [promoteUser, setPromoteUser]   = useState(null) // upgrade/downgrade
  const [viewUserId, setViewUserId]     = useState(null) // xem chi tiết
  const [selectedIds, setSelectedIds]   = useState(new Set()) // bulk select
  const [bulkAction, setBulkAction]     = useState(null) // { action: 'lock'|'unlock' }
  const [exporting, setExporting]       = useState(false)

  // State cho form xác nhận khóa (email + lý do) — dùng chung cho cả modal 1 user & bulk
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

  const handleTierChange = useCallback((val) => {
    setTierFilter(val)
    setPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setSearchInput('')
    setSearch('')
    setRoleFilter('')
    setStatusFilter('')
    setTierFilter('')
    setPage(1)
  }, [])

  const hasFilters = searchInput || roleFilter || statusFilter || tierFilter

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter, statusFilter, tierFilter],
    queryFn:  () => api.get('/admin/users', {
      params: {
        page,
        limit: 15,
        ...(search       && { search }),
        ...(roleFilter   && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(tierFilter   && { tier: tierFilter }),
      },
    }).then(r => r.data.data),
    keepPreviousData: true,
  })

  // ⚠️ Lớp phòng vệ phía client: Staff không được thấy tài khoản ADMIN trong danh sách.
  // Đây KHÔNG thay thế việc backend phải tự lọc theo role người gọi — nếu API
  // /admin/users chưa lọc, Staff vẫn có thể gọi thẳng API và thấy dữ liệu Admin.
  // Cần kiểm tra & vá phía server song song với thay đổi này.
  const users = useMemo(() => {
    const raw = data?.users ?? []
    return viewerRole === 'STAFF' ? raw.filter(u => u.role !== 'ADMIN') : raw
  }, [data, viewerRole])

  const totalPages = data?.totalPages ?? 1
  const total      = data?.total      ?? 0

  const closeLockModal = useCallback(() => {
    setConfirmUser(null)
    setBulkAction(null)
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

  const bulkToggleMutation = useMutation({
    mutationFn: ({ ids, action, reason }) =>
      api.post('/admin/users/bulk-toggle', { ids, action, reason }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Đã cập nhật hàng loạt!')
      qc.invalidateQueries(['admin-users'])
      setSelectedIds(new Set())
      closeLockModal()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Thao tác thất bại!'),
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

  /*  Phân quyền theo role người đang xem  */
  // Staff: xem staff (read-only), xem+sửa customer/dealer
  // Admin: xem+sửa customer/dealer/staff
  const canPromote = (targetRole) => ['CUSTOMER', 'DEALER'].includes(targetRole)

  const canToggle = (targetUser) => {
    if (targetUser.id === viewer?.id) return false // không tự khóa chính mình
    if (viewerRole === 'STAFF') return ['CUSTOMER', 'DEALER'].includes(targetUser.role)
    if (viewerRole === 'ADMIN') return ['CUSTOMER', 'DEALER', 'STAFF'].includes(targetUser.role)
    return false
  }

  // Staff không được tạo tài khoản nào cả (chỉ xem danh sách) — chỉ Admin mới tạo được Dealer/Staff
  const canCreateRoles = viewerRole === 'ADMIN' ? ['DEALER', 'STAFF'] : []

  const roleFilterOptions = [
    { value: 'CUSTOMER', label: 'Customer' },
    { value: 'DEALER',   label: 'Dealer'    },
    { value: 'STAFF',    label: 'Staff'     },
  ]

  // Đồng bộ với 5 hạng trong server/src/utils/loyaltyTier.js (rank 1-5, gửi lên qua param ?tier=)
  const tierFilterOptions = [
    { value: '1', label: 'Hạng I · Chùa Một Cột'     },
    { value: '2', label: 'Hạng II · Cố Đô Huế'        },
    { value: '3', label: 'Hạng III · Cầu Rồng'        },
    { value: '4', label: 'Hạng IV · Tháp Bà Ponagar'  },
    { value: '5', label: 'Hạng V · Landmark 81'       },
  ]

  // Điều kiện để xác nhận khóa 1 user: email nhập đúng + lý do đủ dài
  const lockEmailMatches = confirmUser?.action === 'lock'
    ? lockEmailInput.trim().toLowerCase() === confirmUser.user.email.toLowerCase()
    : true
  const lockReasonValid = lockReason.trim().length >= 10
  const canSubmitLock = confirmUser?.action === 'unlock' || (lockEmailMatches && lockReasonValid)
  const canSubmitBulk = bulkAction?.action === 'unlock' || lockReasonValid

  /*  Bulk selection helpers  */
  const selectableUsers = useMemo(
    () => users.filter(u => canToggle(u)),
    [users, viewer?.id, viewerRole]
  )
  const allSelectableChecked = selectableUsers.length > 0 &&
    selectableUsers.every(u => selectedIds.has(u.id))

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (allSelectableChecked) return new Set()
      return new Set(selectableUsers.map(u => u.id))
    })
  }

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Trong các user đã chọn, có bao nhiêu đang active (để quyết định bulk action là khóa hay mở)
  const selectedUsers = users.filter(u => selectedIds.has(u.id))
  const selectedActiveCount = selectedUsers.filter(u => u.isActive).length
  const selectedLockedCount = selectedUsers.length - selectedActiveCount

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const res = await api.get('/admin/users/export', {
        params: {
          ...(search       && { search }),
          ...(roleFilter   && { role: roleFilter }),
          ...(statusFilter && { status: statusFilter }),
        },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Đã tải file CSV!')
    } catch (err) {
      toast.error('Xuất CSV thất bại!')
    } finally {
      setExporting(false)
    }
  }

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
          <button
            className="a-btn-ghost"
            style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={handleExportCsv}
            disabled={exporting}
          >
            <Download size={13} />
            {exporting ? 'Đang xuất...' : 'Xuất CSV'}
          </button>
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

      {/*  Search & Filters — full width, canh chung lề trái/phải với bảng phía dưới  */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        width: '100%',
        gap: 10,
        marginBottom: 16,
        alignItems: 'center',
      }}>
        {/* Search box — kéo dài chiếm hết phần còn lại */}
        <div className="a-search-wrap" style={{ flex: '1 1 260px', minWidth: 200, marginBottom: 0 }}>
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
                top: '50%',
                transform: 'translateY(-50%)',
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

        {/* Cụm bộ lọc — luôn neo sát lề phải, khớp với mép phải của bảng bên dưới */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginLeft: 'auto' }}>
          {/* Role filter */}
          <FilterSelect
            value={roleFilter}
            onChange={handleRoleChange}
            placeholder="Tất cả vai trò"
            options={roleFilterOptions}
          />

          {/* Tier filter */}
          <FilterSelect
            value={tierFilter}
            onChange={handleTierChange}
            placeholder="Tất cả hạng"
            options={tierFilterOptions}
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
      </div>

      {/*  Bulk action bar  */}
      {selectedIds.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(74,158,63,0.06)', border: '1px solid rgba(74,158,63,0.2)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 14,
        }}>
          <div style={{ fontSize: 12.5, color: 'var(--a-ink)', fontWeight: 500 }}>
            Đã chọn {selectedIds.size} tài khoản
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {selectedActiveCount > 0 && (
              <button
                className="a-btn-icon lock"
                style={{ width: 'auto', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}
                onClick={() => setBulkAction({ action: 'lock' })}
              >
                <Lock size={12} /> Khóa ({selectedActiveCount})
              </button>
            )}
            {selectedLockedCount > 0 && (
              <button
                className="a-btn-icon unlock"
                style={{ width: 'auto', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}
                onClick={() => setBulkAction({ action: 'unlock' })}
              >
                <Unlock size={12} /> Mở khóa ({selectedLockedCount})
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(13,51,48,0.45)', fontSize: 11.5, padding: '6px 8px',
              }}
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/*  Table  */}
      <div className="a-table-card">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th style={{ width: 34 }}>
                  <input
                    type="checkbox"
                    checked={allSelectableChecked}
                    onChange={toggleSelectAll}
                    disabled={selectableUsers.length === 0}
                    style={{ cursor: selectableUsers.length ? 'pointer' : 'default' }}
                    aria-label="Chọn tất cả"
                  />
                </th>
                {['Mã người dùng', 'Người dùng', 'Vai trò', 'Hạng', 'Đơn hàng', 'Ngày đăng ký', 'Trạng thái', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={`sk-${i}`} />)
              ) : !users.length ? (
                <tr>
                  <td colSpan={9} style={{ padding: 56, textAlign: 'center' }}>
                    <UsersIcon size={30} style={{ color: 'rgba(13,51,48,0.15)', marginBottom: 10 }} />
                    <div style={{ color: 'rgba(13,51,48,0.35)', fontSize: 13 }}>
                      {hasFilters
                        ? 'Không tìm thấy kết quả phù hợp'
                        : 'Không có người dùng nào'}
                    </div>
                  </td>
                </tr>
              ) : users.map(user => {
                const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.CUSTOMER
                const showPromote = canPromote(user.role)
                const showToggle = canToggle(user)
                const isSelf = user.id === viewer?.id
                return (
                  <tr
                    key={user.id}
                    className="a-row-clickable"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setViewUserId(user.id)}
                  >
                    <td onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelectOne(user.id)}
                        disabled={!showToggle}
                        style={{ cursor: showToggle ? 'pointer' : 'default' }}
                        aria-label={`Chọn ${user.name}`}
                      />
                    </td>

                    {/* User code */}
                    <td style={{ minWidth: 160 }} onClick={e => e.stopPropagation()}>
                      <UserCodeBadge code={user.userCode} />
                    </td>

                    {/* User info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            style={{
                              width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
                              flexShrink: 0, border: '1px solid rgba(13,51,48,0.08)',
                            }}
                          />
                        ) : (
                          <div
                            className="a-user-avatar"
                            style={{ background: avatarColor(user.name) }}
                          >
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {user.name}
                            {isSelf && (
                              <span className="a-badge neutral" style={{ fontSize: 8.5, padding: '1px 6px' }}>Bạn</span>
                            )}
                          </div>
                          <div className="a-td-muted" style={{ display: 'flex', alignItems: 'center', gap: 3 }} onClick={e => e.stopPropagation()}>
                            {user.email}
                            <CopyButton value={user.email} label="Sao chép email" />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <span className={`a-badge ${roleCfg.cls}`}>
                        {roleCfg.label}
                      </span>
                    </td>

                    {/* Tier / Hạng */}
                    <td><TierBadge tier={user.tier} size="sm" showImage={false} /></td>

                    {/* Order count */}
                    <td style={{ fontWeight: 500 }}>{user._count?.orders ?? 0}</td>

                    {/* Joined */}
                    <td className="a-td-muted">{formatDateShort(user.createdAt)}</td>

                    {/* Status */}
                    <td>
                      <span className={`a-badge ${user.isActive ? 'success' : 'danger'}`}>
                        {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>

                    {/* Action */}
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
                        {isSelf && (
                          <span
                            className="a-td-muted"
                            style={{ fontSize: 10.5 }}
                            title="Không thể tự khóa tài khoản của chính mình"
                          >
                            —
                          </span>
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
        <UserDetailDrawer
          userId={viewUserId}
          onClose={() => setViewUserId(null)}
          viewerId={viewer?.id}
          canPromote={canPromote}
          canToggle={canToggle}
          onPromote={(user) => setPromoteUser(user)}
          onToggleLock={(user, action) => setConfirmUser({ user, action })}
        />
      )}

      {/*  Confirm lock/unlock modal (1 user)  */}
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
                    và lý do khóa — hệ thống sẽ tự động gửi email thông báo kèm lý do cho người dùng.
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
                    {lockReasonValid
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

      {/*  Bulk lock/unlock modal  */}
      {bulkAction && (
        <div
          className="a-modal-overlay"
          onClick={e => e.target === e.currentTarget && closeLockModal()}
        >
          <div className="a-modal" style={{ maxWidth: 440 }}>
            <div className="a-modal-header">
              <h3 className="a-modal-title">
                {bulkAction.action === 'lock'
                  ? `Khóa ${selectedActiveCount} tài khoản`
                  : `Mở khóa ${selectedLockedCount} tài khoản`}
              </h3>
              <button className="a-modal-close" onClick={closeLockModal}>
                <X size={16} />
              </button>
            </div>
            <div className="a-modal-body">
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16,
                maxHeight: 140, overflowY: 'auto',
              }}>
                {selectedUsers
                  .filter(u => bulkAction.action === 'lock' ? u.isActive : !u.isActive)
                  .map(u => (
                    <span key={u.id} className="a-badge neutral" style={{ fontSize: 10 }}>
                      {u.name}
                    </span>
                  ))}
              </div>

              {bulkAction.action === 'unlock' ? (
                <p style={{ fontSize: 13, color: 'rgba(13,51,48,0.65)', lineHeight: 1.6 }}>
                  Các tài khoản trên sẽ được mở khóa. Email thông báo sẽ được gửi tự động cho từng người.
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: 'rgba(13,51,48,0.65)', lineHeight: 1.6, marginBottom: 16 }}>
                    Các tài khoản trên sẽ bị khóa cùng lúc. Nhập lý do chung — hệ thống sẽ gửi email
                    thông báo kèm lý do cho từng người dùng.
                  </p>
                  <label className="a-form-label" htmlFor="bulk-lock-reason">
                    Lý do khóa tài khoản
                  </label>
                  <textarea
                    id="bulk-lock-reason"
                    className="a-input a-textarea"
                    placeholder="Vd: Dọn dẹp tài khoản spam/rác theo đợt kiểm tra định kỳ..."
                    value={lockReason}
                    onChange={e => setLockReason(e.target.value)}
                  />
                  <div style={{
                    fontSize: 11,
                    color: lockReason.length > 0 && !lockReasonValid ? '#c05050' : 'rgba(13,51,48,0.4)',
                    marginTop: 5,
                  }}>
                    {lockReasonValid
                      ? 'Lý do hợp lệ'
                      : `Tối thiểu 10 ký tự (hiện ${lockReason.trim().length})`}
                  </div>
                </>
              )}
            </div>
            <div className="a-modal-footer">
              <button
                className="a-btn-primary"
                style={{ background: bulkAction.action === 'lock' ? '#c05050' : '#4a9e3f' }}
                onClick={() => bulkToggleMutation.mutate({
                  ids: selectedUsers
                    .filter(u => bulkAction.action === 'lock' ? u.isActive : !u.isActive)
                    .map(u => u.id),
                  action: bulkAction.action,
                  reason: bulkAction.action === 'lock' ? lockReason.trim() : undefined,
                })}
                disabled={bulkToggleMutation.isPending || !canSubmitBulk}
              >
                {bulkToggleMutation.isPending
                  ? 'Đang xử lý...'
                  : (bulkAction.action === 'lock' ? 'Khóa tài khoản' : 'Mở khóa')
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