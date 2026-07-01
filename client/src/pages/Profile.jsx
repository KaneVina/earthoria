import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/authService'
import { orderService } from '../services/orderService'
import { arService } from '../services/arService'
import { useAuthStore } from '../store/authStore'
import { formatPrice, formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

const F = { serif: "'Playfair Display', serif", sans: "'Be Vietnam Pro', sans-serif" }

const CHAPTERS = [
  { id: 'overview',  label: 'Hồ Sơ',     roman: 'I',   icon: 'user' },
  { id: 'orders',    label: 'Đơn Hàng',  roman: 'II',  icon: 'package' },
  { id: 'security',  label: 'Bảo Mật',   roman: 'III', icon: 'lock' },
  { id: 'addresses', label: 'Địa Chỉ',   roman: 'IV',  icon: 'map' },
  { id: 'ar',        label: 'Sách AR',   roman: 'V',   icon: 'compass' },
]

const ORDER_STATUS_MAP = {
  PENDING:    { label: 'Chờ xác nhận',  color: '#b8862e', bg: 'rgba(184,134,46,0.08)' },
  CONFIRMED:  { label: 'Đã xác nhận',   color: '#4a9e3f', bg: 'rgba(74,158,63,0.08)' },
  PROCESSING: { label: 'Đang chuẩn bị', color: '#4a9e3f', bg: 'rgba(74,158,63,0.08)' },
  SHIPPING:   { label: 'Đang giao',     color: '#2d7a6e', bg: 'rgba(45,122,110,0.08)' },
  DELIVERED:  { label: 'Đã giao',       color: '#4a7c5f', bg: 'rgba(74,124,95,0.1)' },
  COMPLETED:  { label: 'Hoàn thành',    color: '#4a9e3f', bg: 'rgba(74,158,63,0.12)' },
  CANCELLED:  { label: 'Đã hủy',        color: '#b25450', bg: 'rgba(178,84,80,0.08)' },
}

const ORDER_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED']

// ════════════════════ ICONS ════════════════════
const Icon = {
  user: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  package: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  lock: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  map: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  edit: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  logout: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  checkSm: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  eye: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  shield: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  truck: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  plus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  back: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
  arrowRight: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  mail: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  cake: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2 1 3.5 1 2-1 3.5-1 2 1 3.5 1 2-1 2-1"/><path d="M12 11V7"/><path d="M9 7c0-1 .5-1.5.5-2.5S9 3 9 3"/><path d="M12 7c0-1 .5-1.5.5-2.5S12 3 12 3"/><path d="M15 7c0-1 .5-1.5.5-2.5S15 3 15 3"/></svg>,
  star: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  copy: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="1.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  alert: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  seal: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="8" r="6"/><path d="M9 13.5 7 22l5-3 5 3-2-8.5"/></svg>,
  compass: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
}

// ─── Reveal-on-scroll ───
function useReveal(deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.08 }
    )
    const els = ref.current?.querySelectorAll('.pf-reveal') || []
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, deps)
  return ref
}

// ─── Count-up ───
function useCountUp(end, duration = 900, enabled = true) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const safeEnd = Number.isFinite(end) ? end : 0
    if (!enabled) { setValue(safeEnd); return }
    let raf, startTime = null
    const step = (ts) => {
      if (startTime === null) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(safeEnd * eased))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => raf && cancelAnimationFrame(raf)
  }, [end, duration, enabled])
  return value
}

// ─── Confirm dialog ───
function useConfirm() {
  const [state, setState] = useState(null)
  const confirm = (opts) => new Promise((resolve) => setState({ ...opts, resolve }))
  const close = (result) => { state?.resolve(result); setState(null) }

  const dialog = state ? (
    <div className="pf-overlay" onClick={() => close(false)}>
      <div className="pf-confirm" onClick={e => e.stopPropagation()}>
        <div className={`pf-confirm-icon ${state.danger ? 'danger' : ''}`}>
          {state.danger ? Icon.alert : Icon.shield}
        </div>
        <div className="pf-confirm-title">{state.title}</div>
        <div className="pf-confirm-msg">{state.message}</div>
        <div className="pf-confirm-actions">
          <button type="button" className="pf-btn-tactile pf-confirm-cancel" onClick={() => close(false)}>
            {state.cancelLabel || 'Hủy'}
          </button>
          <button type="button" className={`pf-btn-tactile pf-confirm-ok ${state.danger ? 'danger' : ''}`} onClick={() => close(true)}>
            {state.confirmLabel || 'Xác Nhận'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return { confirm, dialog }
}

// ─── Copy button ───
function CopyButton({ text, label = 'Sao Chép', compact = false }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async (e) => {
    e.stopPropagation()
    if (!text) return
    try {
      await navigator.clipboard.writeText(String(text))
      setCopied(true)
      toast.success('Đã sao chép')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Không thể sao chép, vui lòng thử lại')
    }
  }
  return (
    <button type="button" onClick={handleCopy} className={`pf-btn-tactile pf-copy-btn ${compact ? 'compact' : ''} ${copied ? 'copied' : ''}`}>
      {copied ? Icon.checkSm : Icon.copy} {!compact && (copied ? 'Đã chép' : label)}
    </button>
  )
}

// ─── Inline-editable field ───
// Click pencil → field becomes an input; Enter/blur-check saves, Esc cancels.
function EditableField({ label, value, icon, onSave, placeholder = 'Không có thông tin. Bấm vào đây để cập nhật', type = 'text', validate, locked = false, lockedHint }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { setDraft(value || '') }, [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const startEdit = () => {
    if (locked) return
    setDraft(value || '')
    setError('')
    setEditing(true)
  }
  const cancel = () => { setEditing(false); setError(''); setDraft(value || '') }

  const save = async () => {
    if (validate) {
      const err = validate(draft)
      if (err) { setError(err); return }
    }
    if (draft === (value || '')) { setEditing(false); return }
    setSaving(true)
    try {
      await onSave(draft)
      setEditing(false)
    } catch (err) {
      setError(err?.response?.data?.message || 'Cập nhật thất bại, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); save() }
    if (e.key === 'Escape') { e.preventDefault(); cancel() }
  }

  return (
    <div className={`pf-field ${editing ? 'is-editing' : ''} ${locked ? 'is-locked' : ''}`}>
      <div className="pf-field-label">
        <span className="pf-field-icon">{icon}</span>
        {label}
        {locked && (
          <span className="pf-field-lock-badge" title={lockedHint}>
            {Icon.lock}
          </span>
        )}
      </div>

      {!editing ? (
        <div className="pf-field-display" onClick={startEdit}>
          <span className={`pf-field-value ${!value ? 'is-empty' : ''}`}>{value || placeholder}</span>
          {!locked && (
            <button type="button" className="pf-btn-tactile pf-field-edit-btn" onClick={startEdit} aria-label={`Sửa ${label}`}>
              {Icon.edit}
            </button>
          )}
        </div>
      ) : (
        <div className="pf-field-edit-row">
          <input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={e => { setDraft(e.target.value); setError('') }}
            onKeyDown={handleKey}
            className={`pf-field-input ${error ? 'has-error' : ''}`}
            placeholder={placeholder}
            disabled={saving}
          />
          <div className="pf-field-edit-actions">
            <button type="button" disabled={saving} onClick={save} className="pf-btn-tactile pf-field-save" aria-label="Lưu">
              {saving ? <span className="pf-spinner-sm" /> : Icon.checkSm}
            </button>
            <button type="button" disabled={saving} onClick={cancel} className="pf-btn-tactile pf-field-cancel" aria-label="Hủy">
              {Icon.x}
            </button>
          </div>
        </div>
      )}
      {error && <div className="pf-field-error">{error}</div>}
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, logout, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const containerRef = useReveal([activeTab, selectedOrderId])
  const { confirm, dialog } = useConfirm()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getMe().then(r => r.data.data),
    initialData: user,
  })

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getOrders().then(r => r.data.data),
    enabled: activeTab === 'orders' || activeTab === 'overview',
  })

  const { data: orderDetail, isLoading: orderDetailLoading } = useQuery({
    queryKey: ['order', selectedOrderId],
    queryFn: () => orderService.getOrder(selectedOrderId).then(r => r.data.data),
    enabled: !!selectedOrderId,
  })

  const { data: arCodes = [], isLoading: arLoading } = useQuery({
    queryKey: ['my-ar-codes'],
    queryFn: () => arService.getMyArBooks().then(r => r.data.data),
    enabled: activeTab === 'ar',
  })

  const updateProfileMutation = useMutation({
    mutationFn: (patch) => authService.updateProfile(patch),
    onSuccess: (res, patch) => {
      const updated = { ...profile, ...patch }
      setUser(updated)
      queryClient.setQueryData(['profile'], updated)
      toast.success('Đã cập nhật thông tin')
    },
  })

  const saveField = useCallback((field) => async (val) => {
    await updateProfileMutation.mutateAsync({ [field]: val })
  }, [updateProfileMutation])

  const completedOrders = orders.filter(o => o.status === 'COMPLETED')
  const totalSpent = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const animatedOrderCount = useCountUp(orders.length, 900, !ordersLoading)
  const animatedSpent = useCountUp(totalSpent, 1100, !ordersLoading)

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Đăng Xuất Tài Khoản?',
      message: 'Bạn sẽ cần đăng nhập lại để xem đơn hàng và tiếp tục mua sắm tại Earthoria.',
      confirmLabel: 'Đăng Xuất',
      cancelLabel: 'Ở Lại',
      danger: true,
    })
    if (!ok) return
    logout()
     queryClient.clear()
    toast.success('Đã đăng xuất')
    navigate('/')
  }

  if (!profile) return <GuestState />

  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || 'U'
  const memberTier = totalSpent > 3000000 ? 'Thành Viên Bạch Kim' : totalSpent > 1000000 ? 'Thành Viên Vàng' : 'Thành Viên Mới'
  const accountCode = (profile.memberCode || profile.id || '').toString()
  const formattedCode = formatAccountCode(accountCode)
  const recentOrders = orders.slice(0, 3)

  return (
    <div ref={containerRef} style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '92px' }}>

      <PassportHero
        profile={profile}
        initials={initials}
        memberTier={memberTier}
        formattedCode={formattedCode}
        animatedOrderCount={ordersLoading ? '—' : animatedOrderCount}
        animatedSpent={ordersLoading ? '—' : formatPrice(animatedSpent)}
        onLogout={handleLogout}
      />

      <div className="pf-chapters-bar">
        <div className="pf-chapters-inner">
          {CHAPTERS.map(ch => (
            <button
              key={ch.id}
              onClick={() => { setActiveTab(ch.id); setSelectedOrderId(null) }}
              className={`pf-btn-tactile pf-chapter-tab ${activeTab === ch.id ? 'is-active' : ''}`}
            >
              <span className="pf-chapter-roman">{ch.roman}</span>
              <span className="pf-chapter-label">{ch.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pf-main-layout pf-reveal">
        {activeTab === 'overview' && (
          <OverviewTab
            profile={profile}
            recentOrders={recentOrders}
            ordersLoading={ordersLoading}
            saveField={saveField}
            onViewOrders={() => setActiveTab('orders')}
            onViewOrder={(id) => { setActiveTab('orders'); setSelectedOrderId(id) }}
          />
        )}
        {activeTab === 'orders' && !selectedOrderId && (
          <OrdersTab orders={orders} loading={ordersLoading} onSelect={setSelectedOrderId} />
        )}
        {activeTab === 'orders' && selectedOrderId && (
          <OrderDetailTab order={orderDetail} loading={orderDetailLoading} onBack={() => setSelectedOrderId(null)} />
        )}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'addresses' && <AddressesTab profile={profile} confirm={confirm} />}
        {activeTab === 'ar' && <ArTab arCodes={arCodes} loading={arLoading} />}
      </div>

      <FooterHelp />

      {dialog}
      <style>{PROFILE_CSS}</style>
    </div>
  )
}

function formatAccountCode(raw) {
  if (!raw) return '—'
  // Build a stable, passport-style code: EARTH- + 8 hex chars from id, grouped.
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const base = (clean || '00000000').slice(0, 8).padEnd(8, '0')
  return `EARTH-${base.slice(0, 4)}-${base.slice(4, 8)}`
}

function GuestState() {
  return (
    <div className="pf-guest-wrap">
      <div className="pf-guest-card">
        <div className="pf-guest-seal">{Icon.seal}</div>
        <h2 className="pf-guest-title">Vui Lòng <em>Đăng Nhập</em></h2>
        <p className="pf-guest-sub">Đăng nhập để xem hồ sơ, theo dõi đơn hàng và quản lý tài khoản của bạn.</p>
        <Link to="/login">
          <button className="pf-btn-tactile pf-guest-cta">Đăng Nhập Ngay</button>
        </Link>
      </div>
      <style>{PROFILE_CSS}</style>
    </div>
  )
}

// ════════════════════════ PASSPORT HERO ════════════════════════
// Signature element: a membership "passport card" — replaces the generic
// dashboard banner. Shows avatar seal, member tier, account code (stamped,
// monospace), and two key stats. Email is intentionally NOT shown as editable
// here (handled in Overview's field list) — this strip is identity-first.
function PassportHero({ profile, initials, memberTier, formattedCode, animatedOrderCount, animatedSpent, onLogout }) {
  const isAdmin = profile?.role === 'ADMIN'
  const roleMeta = isAdmin
    ? { label: 'Quản Trị Viên', color: '#b8862e', bg: 'rgba(184,134,46,0.09)', border: 'rgba(184,134,46,0.28)', dot: '#b8862e', sealBg: 'linear-gradient(135deg,#b8862e 0%,#d4a843 100%)' }
    : { label: 'Thành Viên',    color: '#4a9e3f', bg: 'rgba(74,158,63,0.09)',   border: 'rgba(74,158,63,0.25)',   dot: '#4a9e3f', sealBg: undefined }
  return (
    <div className="pf-passport-zone">
      <div className="pf-passport-watermark">EARTHORIA</div>
      <div className="pf-passport-grid" />
      <div className="pf-passport-glow-a" />
      <div className="pf-passport-glow-b" />

      <div className="pf-passport-inner">
        <div className="pf-passport-card pf-reveal">
          <div className="pf-passport-card-top">
            <div className="pf-passport-left">
              <div className="pf-passport-seal" style={isAdmin ? { background: roleMeta.sealBg, borderColor: 'rgba(184,134,46,0.4)' } : undefined}>
                <div className="pf-passport-seal-ring" style={isAdmin ? { borderColor: 'rgba(184,134,46,0.35)' } : undefined} />
                {initials}
              </div>
              <div className="pf-passport-id">
                <div className="pf-passport-tier">
                  <span className="pf-tier-dot" />
                  {memberTier}
                </div>
                <h1 className="pf-passport-name">{profile.firstName} {profile.lastName}</h1>
                <div className="pf-passport-email">
                  {Icon.mail}
                  <span>{profile.email}</span>
                </div>
              </div>
            </div>

            <button onClick={onLogout} className="pf-btn-tactile pf-passport-logout">
              {Icon.logout} Đăng Xuất
            </button>
          </div>

          <div className="pf-passport-divider">
            <span className="pf-passport-divider-mark" />
          </div>

          <div className="pf-passport-bottom">
            <div className="pf-passport-code-block">
              <div className="pf-passport-code-label">Mã Số Tài Khoản</div>
              <div className="pf-passport-code-row">
                <span className="pf-passport-code-value">{formattedCode}</span>
                <CopyButton text={formattedCode} compact />
              </div>
            </div>

            <div className="pf-passport-stats">
              <div className="pf-passport-stat">
                <div className="pf-passport-stat-val">{animatedOrderCount}</div>
                <div className="pf-passport-stat-label">Đơn hàng</div>
              </div>
              <div className="pf-passport-stat-sep" />
              <div className="pf-passport-stat">
                <div className="pf-passport-stat-val">{animatedSpent}</div>
                <div className="pf-passport-stat-label">Tổng chi tiêu</div>
              </div>
              <div className="pf-passport-stat-sep" />
              <div className="pf-passport-stat">
                <div className="pf-passport-stat-val">{profile.createdAt ? formatDate(profile.createdAt) : '—'}</div>
                <div className="pf-passport-stat-label">Thành viên từ</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FooterHelp() {
  return (
    <div className="pf-help-strip">
      <div className="pf-help-strip-inner">
        <div className="pf-help-strip-left">
          <div className="pf-help-strip-icon">{Icon.compass}</div>
          <div>
            <div className="pf-help-strip-title">Cần Hỗ Trợ?</div>
            <div className="pf-help-strip-sub">Đội ngũ Earthoria luôn sẵn sàng đồng hành cùng bạn trong mọi vấn đề.</div>
          </div>
        </div>
        <a href="mailto:earthoriavn@gmail.com" className="pf-help-strip-link">
          earthoriavn@gmail.com {Icon.arrowRight}
        </a>
      </div>
    </div>
  )
}

// ════════════════════════ OVERVIEW TAB ════════════════════════
function OverviewTab({ profile, recentOrders, ordersLoading, saveField, onViewOrders, onViewOrder }) {
  return (
    <div>
      <SectionHeader chapter="I" eyebrow="Hồ Sơ" title="Thông Tin" emphasis="Cá Nhân" sub="Nhấn vào biểu tượng bút để chỉnh sửa từng trường thông tin" />

      <div className="pf-fields-grid">
        <EditableField
          label="Họ"
          icon={Icon.user}
          value={profile.lastName}
          onSave={saveField('lastName')}
          validate={v => !v.trim() ? 'Họ không được để trống' : null}
        />
        <EditableField
          label="Tên"
          icon={Icon.user}
          value={profile.firstName}
          onSave={saveField('firstName')}
          validate={v => !v.trim() ? 'Tên không được để trống' : null}
        />
        <EditableField
          label="Email"
          icon={Icon.mail}
          value={profile.email}
          locked
          lockedHint="Email được dùng để đăng nhập và không thể thay đổi"
          onSave={() => {}}
        />
        <EditableField
          label="Số điện thoại"
          icon={Icon.phone}
          value={profile.phone}
          type="tel"
          placeholder="Chưa cập nhật"
          onSave={saveField('phone')}
          validate={v => v && !/^[0-9+\s-]{8,15}$/.test(v) ? 'Số điện thoại không hợp lệ' : null}
        />
        <EditableField
          label="Ngày sinh"
          icon={Icon.cake}
          value={profile.dob ? profile.dob.slice(0, 10) : ''}
          type="date"
          placeholder="Chưa cập nhật"
          onSave={saveField('dob')}
        />
        <div className="pf-field is-locked">
          <div className="pf-field-label">
            <span className="pf-field-icon">{Icon.shield}</span>
            Mã Số Tài Khoản
            <span className="pf-field-lock-badge" title="Mã định danh không thể thay đổi">{Icon.lock}</span>
          </div>
          <div className="pf-field-display" style={{ cursor: 'default' }}>
            <span className="pf-field-value pf-mono">{formatAccountCode((profile.memberCode || profile.id || '').toString())}</span>
          </div>
        </div>
      </div>

      <div className="pf-ornament-sm">
        <span /><span className="pf-ornament-mark" /><span />
      </div>

      <div className="pf-subheader-row">
        <h3 className="pf-subheader-title">Đơn Hàng <em>Gần Đây</em></h3>
        <button onClick={onViewOrders} className="pf-btn-tactile pf-view-all">
          Xem tất cả {Icon.arrowRight}
        </button>
      </div>

      {ordersLoading ? (
        <div className="pf-stack-12">{[0, 1, 2].map(i => <MiniOrderSkeleton key={i} />)}</div>
      ) : recentOrders.length === 0 ? (
        <EmptyState icon={Icon.package} text="Bạn chưa có đơn hàng nào" sub="Hãy bắt đầu hành trình khám phá sách AR đầu tiên" />
      ) : (
        <div className="pf-stack-12">
          {recentOrders.map((order, i) => (
            <MiniOrderCard key={order.id} order={order} delay={i} onClick={() => onViewOrder(order.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function MiniOrderSkeleton() {
  return (
    <div className="pf-mini-order" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '4px' }}>
        <div className="pf-skel" style={{ width: '160px', height: '13px' }} />
        <div className="pf-skel" style={{ width: '200px', height: '11px' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div className="pf-skel" style={{ width: '78px', height: '22px' }} />
        <div className="pf-skel" style={{ width: '90px', height: '20px' }} />
      </div>
    </div>
  )
}

function MiniOrderCard({ order, delay, onClick }) {
  const status = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.PENDING
  return (
    <div onClick={onClick} className="pf-mini-order" style={{ transitionDelay: `${delay * 0.05}s` }}>
      <div className="pf-mini-order-accent" />
      <div style={{ paddingLeft: '4px' }}>
        <div className="pf-mini-order-code">Đơn #{order.orderCode || order.id?.slice(0, 8)}</div>
        <div className="pf-mini-order-meta">{order.items?.length || 0} sản phẩm · {formatDate(order.createdAt)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <span className="pf-status-pill" style={{ background: status.bg, color: status.color }}>{status.label}</span>
        <div className="pf-mini-order-price">{formatPrice(order.total)}</div>
      </div>
    </div>
  )
}

// ════════════════════════ ORDERS TAB ════════════════════════
function OrdersTab({ orders, loading, onSelect }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const countFor = (key) => key === 'all' ? orders.length : orders.filter(o => o.status === key).length

  return (
    <div>
      <SectionHeader chapter="II" eyebrow="Lịch Sử Mua Sắm" title="Lịch Sử" emphasis="Đơn Hàng" sub={`${orders.length} đơn hàng đã đặt từ khi tham gia Earthoria`} />

      <div className="pf-filter-row">
        {[['all', 'Tất cả'], ...Object.entries(ORDER_STATUS_MAP).map(([k, v]) => [k, v.label])].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`pf-btn-tactile pf-filter-pill ${filter === key ? 'is-active' : ''}`}>
            {label}
            <span className="pf-filter-count">{countFor(key)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="pf-stack-16">{[0, 1, 2].map(i => <OrderCardSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Icon.package} text="Không có đơn hàng nào" sub="Thử chọn bộ lọc khác để xem thêm" />
      ) : (
        <div className="pf-stack-16">
          {filtered.map((order, i) => <OrderCard key={order.id} order={order} delay={i} onClick={() => onSelect(order.id)} />)}
        </div>
      )}
    </div>
  )
}

function OrderCardSkeleton() {
  return (
    <div className="pf-order-card">
      <div className="pf-order-card-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div className="pf-skel" style={{ width: '120px', height: '13px' }} />
          <div className="pf-skel" style={{ width: '90px', height: '12px' }} />
        </div>
        <div className="pf-skel" style={{ width: '84px', height: '22px' }} />
      </div>
      <div className="pf-order-card-body">
        <div style={{ display: 'flex', gap: '10px' }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="pf-skel" style={{ width: '54px', height: '70px' }} />)}
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <div className="pf-skel" style={{ width: '70px', height: '11px' }} />
          <div className="pf-skel" style={{ width: '100px', height: '22px' }} />
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, delay, onClick }) {
  const status = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.PENDING
  return (
    <div onClick={onClick} className="pf-order-card" style={{ transitionDelay: `${Math.min(delay, 6) * 0.04}s` }}>
      <div className="pf-order-card-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', rowGap: '8px' }}>
          <span className="pf-order-code">Đơn #{order.orderCode || order.id?.slice(0, 8)}</span>
          <CopyButton text={order.orderCode || order.id} />
          <div className="pf-vdivider" />
          <span className="pf-order-date">{formatDate(order.createdAt)}</span>
        </div>
        <span className="pf-status-pill" style={{ background: status.bg, color: status.color }}>{status.label}</span>
      </div>
      <div className="pf-order-card-body">
        <div style={{ display: 'flex', gap: '10px' }}>
          {(order.items || []).slice(0, 4).map((item, i) => (
            <div key={i} className="pf-thumb-cell">
              {item.book?.coverImage && <img src={item.book.coverImage} alt="" />}
            </div>
          ))}
          {(order.items?.length || 0) > 4 && (
            <div className="pf-thumb-cell pf-thumb-more">+{order.items.length - 4}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pf-order-item-count">{order.items?.length || 0} sản phẩm</div>
          <div className="pf-order-total">{formatPrice(order.total)}</div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════ ORDER DETAIL TAB ════════════════════════
function OrderDetailSkeleton({ onBack }) {
  return (
    <div>
      <button onClick={onBack} className="pf-btn-tactile pf-back-btn">{Icon.back} Quay Lại Danh Sách Đơn Hàng</button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '36px' }}>
        <div className="pf-skel" style={{ width: '160px', height: '11px' }} />
        <div className="pf-skel" style={{ width: '260px', height: '36px' }} />
      </div>
      <div className="pf-skel" style={{ width: '100%', height: '120px', marginBottom: '28px' }} />
      <div className="pf-detail-layout">
        <div className="pf-skel" style={{ width: '100%', height: '320px' }} />
        <div className="pf-skel" style={{ width: '100%', height: '260px' }} />
      </div>
    </div>
  )
}

function OrderDetailTab({ order, loading, onBack }) {
  if (loading || !order) return <OrderDetailSkeleton onBack={onBack} />

  const status = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.PENDING
  const isCancelled = order.status === 'CANCELLED'
  const stepIdx = ORDER_STEPS.indexOf(order.status)
  const shippingName = order.shippingName || order.address?.name || 'Chưa cập nhật'
  const shippingPhone = order.shippingPhone || order.address?.phone || 'Chưa cập nhật'
  const shippingAddress = order.shippingAddress
    || [order.address?.street, order.address?.wardName || order.address?.ward, order.address?.provinceName || order.address?.district, order.address?.city].filter(Boolean).join(', ')
    || 'Chưa cập nhật'

  return (
    <div>
      <button onClick={onBack} className="pf-btn-tactile pf-back-btn">{Icon.back} Quay Lại Danh Sách Đơn Hàng</button>

      <div className="pf-detail-head-row">
        <div>
          <div className="pf-detail-eyebrow">
            <span className="pf-detail-eyebrow-line" />
            Chi Tiết Đơn Hàng
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <h2 className="pf-detail-title">#{order.orderCode || order.id?.slice(0, 8)}</h2>
            <CopyButton text={order.orderCode || order.id} />
          </div>
          <div className="pf-detail-date">Đặt ngày {formatDate(order.createdAt)}</div>
        </div>
        <span className="pf-status-pill pf-status-pill-lg" style={{ background: status.bg, color: status.color }}>{status.label}</span>
      </div>

      {!isCancelled && (
        <div className="pf-tracker-card">
          <div className="pf-tracker-row">
            <div className="pf-tracker-line">
              <div className="pf-tracker-line-fill" style={{ width: `${Math.max(0, stepIdx) / (ORDER_STEPS.length - 1) * 100}%` }} />
            </div>
            {ORDER_STEPS.map((s, i) => {
              const st = ORDER_STATUS_MAP[s]
              const done = i <= stepIdx
              const current = i === stepIdx
              return (
                <div key={s} className="pf-tracker-step">
                  <div className={`pf-tracker-dot ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                    {done ? Icon.checkSm : <span style={{ fontSize: '10px' }}>{i + 1}</span>}
                  </div>
                  <span className={`pf-tracker-label ${done ? 'done' : ''}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="pf-cancelled-banner">
          <span style={{ color: '#b25450' }}>⊗</span>
          <span>Đơn hàng này đã bị hủy</span>
        </div>
      )}

      <div className="pf-detail-layout">
        <div>
          <div className="pf-items-card">
            <div className="pf-items-header">Sản Phẩm ({order.items?.length || 0})</div>
            {(order.items || []).map((item, i) => (
              <div key={i} className="pf-item-row" style={{ borderBottom: i < order.items.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                <div className="pf-item-thumb">
                  {item.book?.coverImage && <img src={item.book.coverImage} alt="" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="pf-item-title">{item.book?.title || item.title}</div>
                  <div className="pf-item-meta">SL: {item.quantity} × {formatPrice(item.price)}</div>
                </div>
                <div className="pf-item-total">{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div className="pf-shipping-card">
            <div className="pf-shipping-head">{Icon.truck} Thông Tin Giao Hàng</div>
            <div className="pf-shipping-name">{shippingName}</div>
            <div className="pf-shipping-detail">{shippingPhone}<br/>{shippingAddress}</div>
          </div>
        </div>

        <div>
          <div className="pf-summary-card">
            <div className="pf-summary-title">Tóm Tắt Thanh Toán</div>
            {[
              ['Tạm tính', formatPrice(order.subtotal || order.total)],
              ['Phí giao hàng', order.shippingFee ? formatPrice(order.shippingFee) : 'Miễn phí'],
              ...(order.discount ? [['Giảm giá', `−${formatPrice(order.discount)}`]] : []),
            ].map(([k, v]) => (
              <div key={k} className="pf-summary-line">
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ color: 'var(--forest)' }}>{v}</span>
              </div>
            ))}
            <div className="pf-summary-divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="pf-summary-total-label">Tổng cộng</span>
              <span className="pf-summary-total-val">{formatPrice(order.total)}</span>
            </div>
            <div className="pf-payment-badge">
              {Icon.shield}
              <span>Thanh toán: {order.paymentMethod || 'COD'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════ SECURITY TAB ════════════════════════
const PASSWORD_CHECKS = [
  { key: 'len', label: '8 – 16 ký tự', test: v => v.length >= 8 && v.length <= 16 },
  { key: 'upper', label: 'Ít nhất 1 chữ HOA (A-Z)', test: v => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Ít nhất 1 chữ thường (a-z)', test: v => /[a-z]/.test(v) },
  { key: 'special', label: 'Ít nhất 1 ký tự đặc biệt (!@#…)', test: v => /[^A-Za-z0-9]/.test(v) },
]

function SecurityTab() {
  const [showPw, setShowPw] = useState({ old: false, new: false, confirm: false })
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [touched, setTouched] = useState(false)
  const [errors, setErrors] = useState({})

  const checksResult = PASSWORD_CHECKS.map(c => ({ ...c, ok: c.test(form.newPassword) }))
  const strength = checksResult.filter(c => c.ok).length
  const isStrongEnough = form.newPassword.length > 0 && checksResult.every(c => c.ok)
  const confirmMatches = form.confirmPassword.length > 0 && form.confirmPassword === form.newPassword

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (field === 'newPassword') setTouched(true)
    setErrors(e => ({ ...e, [field]: null }))
  }

  const mutation = useMutation({
    mutationFn: (data) => authService.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setTouched(false)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Đổi mật khẩu thất bại!'
      toast.error(msg)
      setErrors({ oldPassword: msg })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!form.oldPassword) newErrors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại'
    if (!isStrongEnough) newErrors.newPassword = 'Mật khẩu mới chưa đạt đủ các tiêu chí bên dưới'
    if (form.newPassword !== form.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    if (Object.keys(newErrors).length) { setErrors(newErrors); setTouched(true); return }
    mutation.mutate({ oldPassword: form.oldPassword, newPassword: form.newPassword })
  }

  const strengthMeta = [
    { label: '', color: 'var(--border)' },
    { label: 'Yếu', color: '#e05c5c' },
    { label: 'Trung Bình', color: '#e0a840' },
    { label: 'Tốt', color: 'var(--sage)' },
    { label: 'Mạnh', color: 'var(--gold)' },
  ][strength]

  const canSubmit = !mutation.isPending && form.oldPassword.length > 0 && isStrongEnough && confirmMatches

  return (
    <div>
      <SectionHeader chapter="III" eyebrow="Bảo Mật Tài Khoản" title="Bảo Mật" emphasis="Tài Khoản" sub="Quản lý mật khẩu và các tùy chọn bảo mật đăng nhập" />

      <div className="pf-security-layout">
        <div className="pf-security-form-card">
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="pf-lock-icon-wrap">{Icon.lock}</div>
            <h3 className="pf-security-title">Đổi Mật Khẩu</h3>
          </div>
          <p className="pf-security-sub">Sử dụng mật khẩu mạnh mà bạn chưa từng dùng ở nơi khác để bảo vệ tài khoản tốt nhất.</p>

          <form onSubmit={handleSubmit} className="pf-pw-form">
            <PasswordField label="Mật Khẩu Hiện Tại" value={form.oldPassword} onChange={v => handleChange('oldPassword', v)} show={showPw.old} toggle={() => setShowPw(s => ({ ...s, old: !s.old }))} error={errors.oldPassword} placeholder="Nhập mật khẩu hiện tại" />

            <div>
              <PasswordField label="Mật Khẩu Mới" value={form.newPassword} onChange={v => handleChange('newPassword', v)} show={showPw.new} toggle={() => setShowPw(s => ({ ...s, new: !s.new }))} error={errors.newPassword} placeholder="8–16 ký tự, chữ hoa, ký tự đặc biệt" />
              {touched && form.newPassword && (
                <div className="pf-strength-zone">
                  <div className="pf-strength-bar">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="pf-strength-seg" style={{ background: i < strength ? strengthMeta.color : 'var(--border)' }} />
                    ))}
                  </div>
                  <div className="pf-strength-label" style={{ color: strengthMeta.color }}>{strengthMeta.label}</div>
                </div>
              )}
              <div className="pf-pw-checklist">
                {checksResult.map(c => (
                  <div key={c.key} className={`pf-pw-check-item ${c.ok ? 'met' : ''}`}>
                    <span className="pf-pw-dot">{c.ok ? Icon.checkSm : ''}</span>
                    {c.label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <PasswordField label="Xác Nhận Mật Khẩu Mới" value={form.confirmPassword} onChange={v => handleChange('confirmPassword', v)} show={showPw.confirm} toggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))} error={errors.confirmPassword} placeholder="Nhập lại mật khẩu mới" />
              {form.confirmPassword && (
                <div className={`pf-pw-check-item ${confirmMatches ? 'met' : ''}`} style={{ marginTop: '8px' }}>
                  <span className="pf-pw-dot">{confirmMatches ? Icon.checkSm : ''}</span>
                  Khớp với mật khẩu mới
                </div>
              )}
            </div>

            <button type="submit" disabled={!canSubmit} className="pf-btn-tactile pf-pw-submit">
              {mutation.isPending ? 'Đang Xử Lý...' : <>Cập Nhật Mật Khẩu {Icon.arrowRight}</>}
            </button>
          </form>
        </div>

        <div className="pf-tips-card">
          <div className="pf-tips-glow" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div className="pf-lock-icon-wrap">{Icon.shield}</div>
              <span className="pf-tips-eyebrow">Mẹo Bảo Mật</span>
            </div>
            {[
              'Dùng 8–16 ký tự, kết hợp chữ hoa, chữ thường và ký tự đặc biệt.',
              'Không sử dụng lại mật khẩu đã dùng ở trang web khác.',
              'Không chia sẻ mật khẩu qua email hoặc tin nhắn.',
              'Đổi mật khẩu định kỳ mỗi 3–6 tháng để bảo mật tối ưu.',
            ].map((tip, i) => (
              <div key={i} className="pf-tip-row" style={{ marginBottom: i < 3 ? '18px' : 0 }}>
                <span className="pf-tip-num">{String(i + 1).padStart(2, '0')}</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordField({ label, value, onChange, show, toggle, error, placeholder }) {
  return (
    <div>
      <label className="pf-pw-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pf-pw-input ${error ? 'has-error' : ''}`}
        />
        <button type="button" onClick={toggle} className="pf-btn-tactile pf-pw-toggle">
          {show ? Icon.eyeOff : Icon.eye}
        </button>
      </div>
      {error && <div className="pf-field-error">{error}</div>}
    </div>
  )
}

// ════════════════════════ ADDRESSES TAB ════════════════════════
const EMPTY_ADDR_FORM = { name: '', phone: '', street: '', provinceCode: '', provinceName: '', wardCode: '', wardName: '', isDefault: false }

// ─── Autocomplete combobox for Province / Ward (step-by-step) ───
// Type to filter, click or arrow+Enter to select. `disabled` locks the field
// until its prerequisite (province) is chosen — enforces the step order.
function LocationCombobox({ label, placeholder, value, options, loading, disabled, disabledHint, onSelect }) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = query.trim()
    ? options.filter(o => stripDiacritics(o.name).includes(stripDiacritics(query)))
    : options

  const handleSelect = (opt) => {
    onSelect(opt)
    setQuery(opt.name)
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlight]) handleSelect(filtered[highlight]) }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="pf-form-input-wrap pf-combobox" ref={wrapRef}>
      <label>{label}</label>
      <div className="pf-combobox-inner">
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder={disabled ? disabledHint : placeholder}
          onFocus={() => !disabled && setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHighlight(0); if (value) onSelect(null) }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {loading && <span className="pf-combobox-spinner" />}
        {!loading && value && <span className="pf-combobox-check">{Icon.checkSm}</span>}
      </div>
      {open && !disabled && (
        <div className="pf-combobox-dropdown">
          {filtered.length === 0 ? (
            <div className="pf-combobox-empty">Không tìm thấy kết quả</div>
          ) : (
            filtered.slice(0, 60).map((opt, i) => (
              <div
                key={opt.code}
                className={`pf-combobox-option ${i === highlight ? 'is-highlight' : ''} ${opt.name === value ? 'is-selected' : ''}`}
                onMouseDown={() => handleSelect(opt)}
                onMouseEnter={() => setHighlight(i)}
              >
                {opt.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function stripDiacritics(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
}

// ─── Hook: fetch + cache the 34-province list (new 2-tier model) ───
function useProvinces() {
  const [provinces, setProvinces] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    fetch('https://provinces.open-api.vn/api/v2/p/')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setProvinces((data || []).map(p => ({ code: p.code, name: p.name })))
      })
      .catch(() => { if (!cancelled) toast.error('Không tải được danh sách tỉnh/thành, vui lòng thử lại') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])
  return { provinces, loading }
}

// ─── Hook: fetch wards for a given province code ───
function useWards(provinceCode) {
  const [wards, setWards] = useState([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!provinceCode) { setWards([]); return }
    let cancelled = false
    setLoading(true)
    fetch(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const list = (data?.wards || []).map(w => ({ code: w.code, name: w.name }))
        setWards(list)
      })
      .catch(() => { if (!cancelled) toast.error('Không tải được danh sách phường/xã, vui lòng thử lại') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [provinceCode])
  return { wards, loading }
}

function AddressesTab({ profile, confirm }) {
  const storageKey = `earthoria_addresses_${profile.id || profile.email || 'guest'}`

  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null
      if (saved) return JSON.parse(saved)
    } catch { /* ignore malformed cache */ }
    return profile.addresses || []
  })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_ADDR_FORM)

  const { provinces, loading: provincesLoading } = useProvinces()
  const { wards, loading: wardsLoading } = useWards(form.provinceCode)

  useEffect(() => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(addresses)) } catch { /* storage unavailable */ }
  }, [addresses, storageKey])

  const openAddForm = () => { setEditingId(null); setForm(EMPTY_ADDR_FORM); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_ADDR_FORM) }
  const openEditForm = (addr) => {
    setEditingId(addr.id)
    setForm({
      name: addr.name, phone: addr.phone, street: addr.street,
      provinceCode: addr.provinceCode || '', provinceName: addr.provinceName || addr.city || '',
      wardCode: addr.wardCode || '', wardName: addr.wardName || addr.ward || '',
      isDefault: !!addr.isDefault,
    })
    setShowForm(true)
  }

  const selectProvince = (opt) => {
    setForm(f => ({
      ...f,
      provinceCode: opt ? opt.code : '',
      provinceName: opt ? opt.name : '',
      // Changing province invalidates whatever ward was chosen for the old province.
      wardCode: '',
      wardName: '',
    }))
  }
  const selectWard = (opt) => {
    setForm(f => ({ ...f, wardCode: opt ? opt.code : '', wardName: opt ? opt.name : '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.provinceCode || !form.wardCode) {
      toast.error('Vui lòng chọn đầy đủ Tỉnh/Thành và Phường/Xã')
      return
    }
    if (editingId) {
      setAddresses(a => a.map(x => {
        if (x.id === editingId) return { ...x, ...form }
        return form.isDefault ? { ...x, isDefault: false } : x
      }))
      toast.success('Đã cập nhật địa chỉ')
    } else {
      const newAddr = { ...form, id: Date.now() }
      setAddresses(a => form.isDefault ? [newAddr, ...a.map(x => ({ ...x, isDefault: false }))] : [...a, newAddr])
      toast.success('Đã thêm địa chỉ mới!')
    }
    closeForm()
  }

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Xóa Địa Chỉ Này?',
      message: 'Địa chỉ sẽ bị xóa khỏi sổ địa chỉ giao hàng của bạn. Hành động này không thể hoàn tác.',
      confirmLabel: 'Xóa Địa Chỉ',
      cancelLabel: 'Giữ Lại',
      danger: true,
    })
    if (!ok) return
    setAddresses(a => a.filter(x => x.id !== id))
    toast.success('Đã xóa địa chỉ')
  }

  const setDefault = (id) => {
    setAddresses(a => a.map(x => ({ ...x, isDefault: x.id === id })))
    toast.success('Đã đặt làm địa chỉ mặc định')
  }

  return (
    <div>
      <SectionHeader chapter="IV" eyebrow="Quản Lý Giao Hàng" title="Sổ Địa Chỉ" emphasis="Giao Hàng" sub="Quản lý các địa chỉ nhận hàng của bạn — theo đơn vị hành chính 2 cấp mới nhất" />

      <button onClick={() => (showForm ? closeForm() : openAddForm())} className={`pf-btn-tactile pf-add-addr-btn ${showForm ? 'is-cancel' : ''}`}>
        {showForm ? 'Hủy' : <>{Icon.plus} Thêm Địa Chỉ Mới</>}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="pf-addr-form">
          {editingId && <div className="pf-addr-form-editing">Đang chỉnh sửa địa chỉ</div>}
          <div className="pf-form-row-2">
            <FormInput label="Họ và tên người nhận" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
            <FormInput label="Số điện thoại" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} required />
          </div>
          <FormInput label="Địa chỉ cụ thể (số nhà, đường)" value={form.street} onChange={v => setForm(f => ({ ...f, street: v }))} required style={{ marginBottom: '18px' }} />

          <div className="pf-step-hint">
            <span className="pf-step-num">1</span> Chọn Tỉnh/Thành phố trước
            <span className="pf-step-arrow">{Icon.arrowRight}</span>
            <span className="pf-step-num">2</span> rồi chọn Phường/Xã
          </div>
          <div className="pf-form-row-2" style={{ marginBottom: '22px' }}>
            <LocationCombobox
              label="Tỉnh/Thành phố"
              placeholder="Gõ để tìm, ví dụ: Cần Thơ"
              value={form.provinceName}
              options={provinces}
              loading={provincesLoading}
              onSelect={selectProvince}
            />
            <LocationCombobox
              label="Phường/Xã"
              placeholder="Gõ để tìm phường/xã"
              disabledHint="Chọn Tỉnh/Thành phố trước"
              value={form.wardName}
              options={wards}
              loading={wardsLoading}
              disabled={!form.provinceCode}
              onSelect={selectWard}
            />
          </div>

          <label className="pf-addr-default-check">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
            Đặt làm địa chỉ mặc định
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="pf-btn-tactile pf-addr-save-btn">{editingId ? 'Lưu Thay Đổi' : 'Lưu Địa Chỉ'}</button>
            <button type="button" onClick={closeForm} className="pf-btn-tactile pf-addr-cancel-btn">Hủy Bỏ</button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <EmptyState icon={Icon.map} text="Chưa có địa chỉ giao hàng nào" sub="Thêm địa chỉ để quá trình đặt hàng nhanh hơn" />
      ) : (
        <div className="pf-addr-grid">
          {addresses.map(addr => (
            <div key={addr.id} className="pf-addr-card" style={{ borderColor: addr.isDefault ? 'var(--gold)' : 'var(--border)' }}>
              {addr.isDefault && <span className="pf-addr-default-badge">Mặc Định</span>}
              <div className="pf-addr-name">{addr.name}</div>
              <div className="pf-addr-phone">{addr.phone}</div>
              <div className="pf-addr-text">{addr.street}, {addr.wardName || addr.ward}, {addr.provinceName || addr.city}</div>
              <div className="pf-addr-actions">
                {!addr.isDefault && (
                  <button onClick={() => setDefault(addr.id)} className="pf-btn-tactile pf-addr-action-gold">Đặt Mặc Định</button>
                )}
                <button onClick={() => openEditForm(addr)} className="pf-btn-tactile pf-addr-action">
                  {Icon.edit} Sửa
                </button>
                <button onClick={() => handleDelete(addr.id)} className="pf-btn-tactile pf-addr-action">
                  {Icon.trash} Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   TAB: SÁCH AR CỦA TÔI
   Chỉ liệt kê ArCode thuộc sách đã mua + đơn DELIVERED (backend đã lọc
   sẵn qua endpoint /ar/my-books) — không cần lọc lại ở frontend.
   Bấm vào 1 mục sẽ đi thẳng tới /ar/:slug/:code để xem mô hình 3D,
   không cần quét lại QR giấy.
══════════════════════════════════════════════ */
function ArTab({ arCodes, loading }) {
  if (loading) {
    return (
      <div>
        <SectionHeader
          chapter="V" eyebrow="Trải Nghiệm AR" title="Sách" emphasis="AR Của Tôi"
          sub="Toàn bộ mô hình 3D thuộc các cuốn sách bạn đã mua và nhận hàng"
        />
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>
      </div>
    )
  }

  if (!arCodes.length) {
    return (
      <div>
        <SectionHeader
          chapter="V" eyebrow="Trải Nghiệm AR" title="Sách" emphasis="AR Của Tôi"
          sub="Toàn bộ mô hình 3D thuộc các cuốn sách bạn đã mua và nhận hàng"
        />
        <EmptyState
          icon={Icon.compass}
          text="Chưa có sách AR nào"
          sub="Mua sách có AR và chờ giao hàng thành công để mở khoá mô hình 3D tại đây"
        />
      </div>
    )
  }

  // Gom các mã AR theo từng cuốn sách để hiển thị thành từng nhóm,
  // tránh trộn lẫn khi khách sở hữu nhiều sách AR cùng lúc.
  const grouped = arCodes.reduce((acc, item) => {
    const key = item.book?.id || item.bookId
    if (!acc[key]) acc[key] = { book: item.book, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  return (
    <div>
      <SectionHeader
        chapter="V" eyebrow="Trải Nghiệm AR" title="Sách" emphasis="AR Của Tôi"
        sub="Toàn bộ mô hình 3D thuộc các cuốn sách bạn đã mua và nhận hàng"
      />

      {Object.values(grouped).map(group => (
        <div key={group.book?.id} style={{ marginBottom: 36 }}>
          <div className="pf-addr-name" style={{ marginBottom: 14, fontSize: 15 }}>
            {group.book?.title}
          </div>
          <div className="pf-addr-grid">
            {group.items.map(item => (
              <Link
                key={item.id}
                to={`/ar/${group.book?.slug}/${item.code}`}
                className="pf-addr-card"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  border: '0.5px solid var(--border-gold)', color: 'var(--gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {Icon.compass}
                </div>
                <div>
                  <div className="pf-addr-name" style={{ marginBottom: 3 }}>{item.label}</div>
                  <div className="pf-addr-phone">Bấm để xem mô hình 3D</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FormInput({ label, value, onChange, required, style }) {
  return (
    <div style={style} className="pf-form-input-wrap">
      <label>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} required={required} />
    </div>
  )
}

// ════════════════════════ SHARED COMPONENTS ════════════════════════
function SectionHeader({ chapter, eyebrow, title, emphasis, sub }) {
  return (
    <div className="pf-section-header">
      <div className="pf-section-chapter">Chương {chapter}</div>
      <div className="pf-section-eyebrow-row">
        <span className="pf-section-eyebrow-line" />
        <span className="pf-section-eyebrow-text">{eyebrow}</span>
      </div>
      <h2 className="pf-section-title">{title} <em>{emphasis}</em></h2>
      <p className="pf-section-sub">{sub}</p>
    </div>
  )
}

function EmptyState({ icon, text, sub }) {
  return (
    <div className="pf-empty-state">
      <div className="pf-empty-icon-wrap">{icon}</div>
      <p className="pf-empty-text">{text}</p>
      {sub && <p className="pf-empty-sub">{sub}</p>}
    </div>
  )
}

// ════════════════════════ STYLES ════════════════════════
const PROFILE_CSS = `
/* ── Reveal ── */
.pf-reveal { opacity: 0; transform: translateY(18px); transition: all 0.7s cubic-bezier(0.16,1,0.3,1); }
.pf-reveal.in { opacity: 1; transform: translateY(0); }

.pf-btn-tactile { transition: transform 0.15s ease, background 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; cursor: pointer; }
.pf-btn-tactile:active { transform: scale(0.96); }
.pf-btn-tactile:focus-visible { outline: 1.5px solid var(--gold); outline-offset: 2px; }

@keyframes pfShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes pfDotPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
@keyframes pfSpin { to { transform: rotate(360deg); } }
@keyframes pfOverlayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes pfModalIn { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes pfFadeSlide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

.pf-skel {
  background: linear-gradient(90deg, var(--border) 25%, rgba(74,158,63,0.14) 50%, var(--border) 75%);
  background-size: 200% 100%;
  animation: pfShimmer 1.5s ease-in-out infinite;
}

/* ── Guest state ── */
.pf-guest-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding-top: 80px; background: var(--cream); }
.pf-guest-card { text-align: center; max-width: 380px; padding: 0 24px; }
.pf-guest-seal {
  width: 64px; height: 64px; margin: 0 auto 28px; border-radius: 50%;
  border: 0.5px solid var(--border-gold); display: flex; align-items: center; justify-content: center;
  color: var(--gold);
}
.pf-guest-title { font-family: ${F.serif}; font-size: 30px; font-weight: 300; color: var(--forest); margin-bottom: 14px; letter-spacing: -0.01em; }
.pf-guest-title em { font-style: italic; color: var(--gold); }
.pf-guest-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 32px; line-height: 1.7; font-weight: 300; }
.pf-guest-cta { background: var(--forest); color: var(--ivory); border: none; padding: 15px 36px; font-family: ${F.sans}; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; }
.pf-guest-cta:hover { background: var(--forest-mid); }


/* ═══════════ PASSPORT HERO ═══════════ */
.pf-passport-zone {
  background: var(--forest);
  position: relative;
  overflow: hidden;
  padding: 56px 100px 0;
}
.pf-passport-watermark {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-52%);
  font-family: ${F.serif}; font-size: clamp(90px, 13vw, 220px); font-weight: 300;
  color: rgba(255,255,255,0.025); white-space: nowrap; letter-spacing: -0.02em;
  pointer-events: none; user-select: none; z-index: 0;
}
.pf-passport-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 48px 48px;
}
.pf-passport-glow-a {
  position: absolute; top: -100px; right: -60px; width: 380px; height: 380px; border-radius: 50%;
  background: radial-gradient(circle, rgba(74,158,63,0.12) 0%, transparent 70%); pointer-events: none;
}
.pf-passport-glow-b {
  position: absolute; bottom: -140px; left: 10%; width: 320px; height: 320px; border-radius: 50%;
  background: radial-gradient(circle, rgba(45,122,110,0.1) 0%, transparent 70%); pointer-events: none;
}
.pf-passport-inner { max-width: 1300px; margin: 0 auto; position: relative; z-index: 2; padding-bottom: 0; }

.pf-passport-card {
  background: linear-gradient(165deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%);
  border: 0.5px solid rgba(74,158,63,0.28);
  backdrop-filter: blur(8px);
  padding: 44px 48px 0;
  position: relative;
  border-radius: 2px 2px 0 0;
}
.pf-passport-card::before {
  content: '';
  position: absolute; top: 18px; left: 18px; right: 18px; bottom: 0;
  border: 0.5px solid rgba(74,158,63,0.14);
  border-bottom: none;
  pointer-events: none;
}
.pf-passport-card-top {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap;
}
.pf-passport-left { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }

.pf-passport-seal {
  width: 84px; height: 84px; border-radius: 50%;
  background: rgba(255,255,255,0.06);
  border: 0.5px solid rgba(74,158,63,0.45);
  display: flex; align-items: center; justify-content: center;
  font-family: ${F.serif}; font-size: 32px; font-weight: 400; color: var(--gold);
  flex-shrink: 0; position: relative;
}
.pf-passport-seal-ring { position: absolute; inset: -7px; border: 0.5px solid rgba(74,158,63,0.2); border-radius: 50%; }

.pf-passport-tier { display: flex; align-items: center; gap: 8px; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }
.pf-tier-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--gold); animation: pfDotPulse 2s ease-in-out infinite; }
.pf-passport-name { font-family: ${F.serif}; font-size: clamp(24px, 3.2vw, 36px); font-weight: 300; color: var(--ivory); letter-spacing: -0.01em; line-height: 1.1; }
.pf-passport-email { display: flex; align-items: center; gap: 8px; margin-top: 8px; color: rgba(250,248,243,0.45); font-size: 13px; }
.pf-passport-email svg { color: rgba(74,158,63,0.6); flex-shrink: 0; }

.pf-passport-logout {
  display: flex; align-items: center; gap: 10px;
  background: transparent; border: 0.5px solid rgba(255,255,255,0.14);
  color: rgba(250,248,243,0.55); padding: 12px 22px;
  font-family: ${F.sans}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
}
.pf-passport-logout:hover { border-color: #b25450; color: #d99a96; background: rgba(178,84,80,0.06); }

.pf-passport-divider { display: flex; align-items: center; justify-content: center; margin: 36px 0 0; position: relative; height: 1px; }
.pf-passport-divider::before {
  content: ''; position: absolute; left: 0; right: 0; top: 0; height: 0.5px;
  background: repeating-linear-gradient(90deg, rgba(74,158,63,0.35) 0, rgba(74,158,63,0.35) 6px, transparent 6px, transparent 13px);
}
.pf-passport-divider-mark {
  position: relative; z-index: 1; width: 9px; height: 9px; background: var(--forest);
  border: 0.5px solid var(--gold); transform: rotate(45deg);
}

.pf-passport-bottom {
  display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap;
  padding: 28px 0 26px;
}
.pf-passport-code-label { font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 9px; }
.pf-passport-code-row { display: flex; align-items: center; gap: 14px; }
.pf-passport-code-value {
  font-family: 'Courier New', ui-monospace, monospace;
  font-size: clamp(16px, 2vw, 21px); letter-spacing: 0.12em; color: var(--gold-light);
  font-weight: 600;
}

.pf-passport-stats { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
.pf-passport-stat { text-align: right; }
.pf-passport-stat-val { font-family: ${F.serif}; font-size: 24px; font-weight: 300; color: var(--ivory); line-height: 1; margin-bottom: 6px; }
.pf-passport-stat-label { font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.35); }
.pf-passport-stat-sep { width: 0.5px; height: 32px; background: rgba(255,255,255,0.1); }

/* Copy button (compact for code) */
.pf-copy-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(74,158,63,0.08); border: 0.5px solid rgba(74,158,63,0.3);
  color: var(--gold-light); font-size: 10px; letter-spacing: 0.08em;
  padding: 6px 11px; font-family: ${F.sans};
}
.pf-copy-btn:hover { background: rgba(74,158,63,0.16); }
.pf-copy-btn.copied { color: #8fd882; border-color: #8fd882; }
.pf-copy-btn.compact { padding: 6px 8px; }

/* On light backgrounds (order cards), copy button needs light theme */
.pf-order-card .pf-copy-btn, .pf-detail-head-row .pf-copy-btn {
  background: transparent; border-color: var(--border-gold); color: var(--gold);
}
.pf-order-card .pf-copy-btn:hover, .pf-detail-head-row .pf-copy-btn:hover { background: var(--gold-pale); }
.pf-order-card .pf-copy-btn.copied, .pf-detail-head-row .pf-copy-btn.copied { color: var(--sage); border-color: var(--sage); }


/* ═══════════ CHAPTERS BAR ═══════════ */
.pf-chapters-bar {
  background: var(--forest);
  border-top: 0.5px solid rgba(74,158,63,0.18);
  padding: 0 100px;
  position: relative; z-index: 2;
}
.pf-chapters-inner {
  max-width: 1300px; margin: 0 auto;
  display: flex; gap: 4px;
  overflow-x: auto; scrollbar-width: none;
}
.pf-chapters-inner::-webkit-scrollbar { display: none; }
.pf-chapter-tab {
  display: flex; align-items: baseline; gap: 10px;
  background: transparent; border: none;
  border-bottom: 2px solid transparent;
  padding: 18px 6px; margin-right: 36px;
  font-family: ${F.sans}; white-space: nowrap;
  color: rgba(250,248,243,0.4);
}
.pf-chapter-tab:hover { color: rgba(250,248,243,0.7); }
.pf-chapter-tab.is-active { color: var(--ivory); border-bottom-color: var(--gold); }
.pf-chapter-roman { font-family: ${F.serif}; font-size: 13px; font-style: italic; color: var(--gold); }
.pf-chapter-label { font-size: 12px; letter-spacing: 0.08em; }

/* ═══════════ MAIN LAYOUT ═══════════ */
.pf-main-layout {
  max-width: 1300px; margin: 0 auto;
  padding: 56px 100px 90px;
}

/* ═══════════ SECTION HEADER ═══════════ */
.pf-section-header { margin-bottom: 40px; }
.pf-section-chapter { font-family: ${F.serif}; font-style: italic; font-size: 12px; color: var(--mist); margin-bottom: 14px; }
.pf-section-eyebrow-row { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.pf-section-eyebrow-line { width: 28px; height: 0.5px; background: var(--gold); }
.pf-section-eyebrow-text { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); }
.pf-section-title { font-family: ${F.serif}; font-size: 34px; font-weight: 300; color: var(--forest); letter-spacing: -0.01em; }
.pf-section-title em { font-style: italic; color: var(--gold); }
.pf-section-sub { font-size: 13px; color: var(--text-muted); margin-top: 10px; font-weight: 300; }

/* ═══════════ FOOTER HELP STRIP ═══════════ */
.pf-help-strip { background: var(--parchment); border-top: 0.5px solid var(--border); }
.pf-help-strip-inner {
  max-width: 1300px; margin: 0 auto; padding: 36px 100px;
  display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap;
}
.pf-help-strip-left { display: flex; align-items: center; gap: 18px; }
.pf-help-strip-icon {
  width: 42px; height: 42px; border: 0.5px solid var(--border-gold);
  display: flex; align-items: center; justify-content: center; color: var(--gold); flex-shrink: 0;
}
.pf-help-strip-title { font-family: ${F.serif}; font-size: 16px; color: var(--forest); margin-bottom: 3px; }
.pf-help-strip-sub { font-size: 12px; color: var(--text-muted); font-weight: 300; max-width: 380px; }
.pf-help-strip-link {
  font-size: 11px; letter-spacing: 0.1em; color: var(--gold); text-decoration: none;
  display: flex; align-items: center; gap: 8px; transition: gap 0.25s; flex-shrink: 0;
}
.pf-help-strip-link:hover { gap: 14px; }

/* ═══════════ EDITABLE FIELDS ═══════════ */
.pf-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 36px; }
.pf-field {
  background: var(--white); border: 0.5px solid var(--border);
  padding: 18px 22px; transition: border-color 0.25s, box-shadow 0.25s;
}
.pf-field.is-editing { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(74,158,63,0.06); }
.pf-field.is-locked { background: var(--cream); }
.pf-field-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-muted);
  margin-bottom: 10px;
}
.pf-field-icon { color: var(--mist); display: flex; }
.pf-field-lock-badge { margin-left: auto; color: var(--mist); display: flex; }
.pf-field-display {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  cursor: pointer; min-height: 24px;
}
.pf-field.is-locked .pf-field-display { cursor: default; }
.pf-field-value { font-size: 14px; color: var(--forest); font-weight: 500; font-family: ${F.sans}; }
.pf-field-value.is-empty { color: var(--mist); font-weight: 300; font-style: italic; }
.pf-mono { font-family: 'Courier New', ui-monospace, monospace; letter-spacing: 0.06em; font-weight: 600; }
.pf-field-edit-btn {
  background: none; border: none; color: var(--mist); padding: 4px; display: flex; opacity: 0; transition: opacity 0.2s, color 0.2s;
}
.pf-field:hover .pf-field-edit-btn { opacity: 1; }
.pf-field-edit-btn:hover { color: var(--gold); }

.pf-field-edit-row { display: flex; gap: 8px; align-items: center; }
.pf-field-input {
  flex: 1; font-family: ${F.sans}; font-size: 14px; color: var(--text-body);
  background: var(--ivory); border: 0.5px solid var(--gold); padding: 9px 12px;
  outline: none; box-shadow: 0 0 0 3px rgba(74,158,63,0.08);
}
.pf-field-input.has-error { border-color: #b25450; box-shadow: 0 0 0 3px rgba(178,84,80,0.07); }
.pf-field-edit-actions { display: flex; gap: 6px; flex-shrink: 0; }
.pf-field-save, .pf-field-cancel {
  width: 32px; height: 32px; border: 0.5px solid var(--border); background: var(--white);
  display: flex; align-items: center; justify-content: center; color: var(--text-muted);
}
.pf-field-save { color: var(--gold); border-color: var(--border-gold); }
.pf-field-save:hover { background: var(--gold); color: var(--ivory); }
.pf-field-cancel:hover { background: var(--cream); color: var(--forest); }
.pf-field-error { font-size: 10px; color: #b25450; margin-top: 8px; letter-spacing: 0.03em; }
.pf-spinner-sm { width: 12px; height: 12px; border: 1.5px solid var(--gold-pale); border-top-color: var(--gold); border-radius: 50%; animation: pfSpin 0.7s linear infinite; display: block; }

/* ═══════════ ORNAMENT & SUBHEADER ═══════════ */
.pf-ornament-sm { display: flex; align-items: center; gap: 10px; margin: 8px 0 32px; }
.pf-ornament-sm span:not(.pf-ornament-mark) { flex: 1; height: 0.5px; background: var(--border); }
.pf-ornament-mark { width: 5px; height: 5px; border: 0.5px solid var(--gold); transform: rotate(45deg); flex: none !important; }
.pf-subheader-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.pf-subheader-title { font-family: ${F.serif}; font-size: 22px; font-weight: 400; color: var(--forest); }
.pf-subheader-title em { font-style: italic; color: var(--gold); }
.pf-view-all { background: none; border: none; color: var(--gold); font-size: 12px; display: flex; align-items: center; gap: 7px; transition: gap 0.25s; }
.pf-view-all:hover { gap: 12px; }
.pf-stack-12 { display: flex; flex-direction: column; gap: 12px; }
.pf-stack-16 { display: flex; flex-direction: column; gap: 16px; }


/* ═══════════ MINI ORDER CARD ═══════════ */
.pf-mini-order {
  background: var(--white); border: 0.5px solid var(--border);
  padding: 22px 26px; display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; row-gap: 14px; cursor: pointer; transition: all 0.35s; position: relative;
}
.pf-mini-order:hover { border-color: var(--border-gold); transform: translateX(6px); box-shadow: 0 12px 32px rgba(13,43,30,0.08); }
.pf-mini-order-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--gold); opacity: 0; transition: opacity 0.3s; }
.pf-mini-order:hover .pf-mini-order-accent { opacity: 1; }
.pf-mini-order-code { font-size: 13px; color: var(--forest); font-weight: 500; margin-bottom: 5px; letter-spacing: 0.01em; }
.pf-mini-order-meta { font-size: 12px; color: var(--text-muted); }
.pf-mini-order-price { font-family: ${F.serif}; font-size: 18px; color: var(--forest); min-width: 90px; text-align: right; }

.pf-status-pill { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 14px; font-weight: 500; white-space: nowrap; }
.pf-status-pill-lg { font-size: 11px; padding: 9px 22px; }

/* ═══════════ FILTER PILLS ═══════════ */
.pf-filter-row { display: flex; gap: 8px; margin-bottom: 32px; flex-wrap: wrap; }
.pf-filter-pill {
  display: flex; align-items: center; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 9px 16px; border: 0.5px solid var(--border); background: transparent; color: var(--text-muted);
  font-family: ${F.sans};
}
.pf-filter-pill:hover { border-color: var(--border-gold); color: var(--forest); }
.pf-filter-pill.is-active { background: var(--forest); color: var(--ivory); border-color: var(--forest); }
.pf-filter-count {
  font-size: 9px; margin-left: 7px; padding: 1px 6px; border-radius: 2px;
  background: var(--pale); color: var(--forest);
}
.pf-filter-pill.is-active .pf-filter-count { background: rgba(255,255,255,0.18); color: var(--ivory); }

/* ═══════════ ORDER CARD (list) ═══════════ */
.pf-order-card { background: var(--white); border: 0.5px solid var(--border); cursor: pointer; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); overflow: hidden; }
.pf-order-card:hover { box-shadow: 0 28px 56px rgba(13,43,30,0.1); transform: translateY(-4px); border-color: var(--border-gold); }
.pf-order-card-head { padding: 22px 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; row-gap: 12px; border-bottom: 0.5px solid var(--border); }
.pf-order-code { font-size: 13px; color: var(--forest); font-weight: 500; letter-spacing: 0.01em; }
.pf-order-date { font-size: 12px; color: var(--text-muted); }
.pf-vdivider { width: 0.5px; height: 14px; background: var(--border); }
.pf-order-card-body { padding: 22px 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.pf-thumb-cell { width: 54px; height: 70px; background: var(--cream); border: 0.5px solid var(--border); overflow: hidden; flex-shrink: 0; }
.pf-thumb-cell img { width: 100%; height: 100%; object-fit: cover; }
.pf-thumb-more { background: var(--gold-pale) !important; display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--forest); font-weight: 500; border: none !important; }
.pf-order-item-count { font-size: 11px; color: var(--text-muted); margin-bottom: 6px; letter-spacing: 0.02em; }
.pf-order-total { font-family: ${F.serif}; font-size: 22px; color: var(--forest); }

/* ═══════════ ORDER DETAIL ═══════════ */
.pf-back-btn { display: flex; align-items: center; gap: 8px; background: none; border: none; color: var(--text-muted); font-size: 12px; margin-bottom: 28px; font-family: ${F.sans}; letter-spacing: 0.06em; }
.pf-back-btn:hover { color: var(--forest); gap: 12px; }
.pf-detail-head-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; flex-wrap: wrap; gap: 20px; }
.pf-detail-eyebrow { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; display: flex; align-items: center; gap: 12px; }
.pf-detail-eyebrow-line { width: 24px; height: 0.5px; background: var(--gold); }
.pf-detail-title { font-family: ${F.serif}; font-size: 36px; font-weight: 300; color: var(--forest); letter-spacing: -0.01em; }
.pf-detail-date { font-size: 13px; color: var(--text-muted); margin-top: 8px; }
.pf-detail-layout { display: grid; grid-template-columns: 1fr 340px; gap: 28px; }

.pf-tracker-card { background: var(--white); border: 0.5px solid var(--border); padding: 40px 44px; margin-bottom: 28px; }
.pf-tracker-row { display: flex; justify-content: space-between; position: relative; }
.pf-tracker-line { position: absolute; top: 15px; left: 15px; right: 15px; height: 1.5px; background: var(--border); z-index: 0; }
.pf-tracker-line-fill { height: 100%; background: linear-gradient(90deg, var(--gold), var(--gold-light)); transition: width 0.8s cubic-bezier(0.16,1,0.3,1); }
.pf-tracker-step { display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; z-index: 1; flex: 1; }
.pf-tracker-dot { width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted); background: var(--white); transition: all 0.4s; }
.pf-tracker-dot.done { background: var(--gold); border-color: var(--gold); color: #fff; }
.pf-tracker-dot.current { box-shadow: 0 0 0 6px rgba(74,158,63,0.12); }
.pf-tracker-label { font-size: 10px; letter-spacing: 0.06em; text-align: center; color: var(--text-muted); font-weight: 300; max-width: 84px; }
.pf-tracker-label.done { color: var(--forest); font-weight: 500; }

.pf-cancelled-banner { display: flex; align-items: center; gap: 12px; padding: 18px 24px; background: rgba(178,84,80,0.06); border: 0.5px solid rgba(178,84,80,0.2); margin-bottom: 28px; font-size: 13px; color: #8a4440; }

.pf-items-card { background: var(--white); border: 0.5px solid var(--border); }
.pf-items-header { padding: 22px 30px; border-bottom: 0.5px solid var(--border); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-muted); }
.pf-item-row { padding: 22px 30px; display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
.pf-item-thumb { width: 64px; height: 82px; background: var(--cream); border: 0.5px solid var(--border); overflow: hidden; flex-shrink: 0; }
.pf-item-thumb img { width: 100%; height: 100%; object-fit: cover; }
.pf-item-title { font-family: ${F.serif}; font-size: 17px; color: var(--forest); margin-bottom: 5px; }
.pf-item-meta { font-size: 12px; color: var(--text-muted); }
.pf-item-total { font-family: ${F.serif}; font-size: 18px; color: var(--forest); }

.pf-shipping-card { background: var(--white); border: 0.5px solid var(--border); margin-top: 22px; padding: 26px 30px; }
.pf-shipping-head { display: flex; align-items: center; gap: 11px; margin-bottom: 18px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-muted); }
.pf-shipping-name { font-size: 14px; color: var(--forest); margin-bottom: 7px; font-weight: 500; }
.pf-shipping-detail { font-size: 13px; color: var(--text-muted); line-height: 1.75; }

.pf-summary-card { background: var(--white); border: 0.5px solid var(--border); padding: 32px; position: sticky; top: 110px; }
.pf-summary-title { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 22px; padding-bottom: 16px; border-bottom: 0.5px solid var(--border); }
.pf-summary-line { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 14px; }
.pf-summary-divider { height: 0.5px; background: var(--border); margin: 18px 0; }
.pf-summary-total-label { font-family: ${F.serif}; font-size: 15px; color: var(--forest); }
.pf-summary-total-val { font-family: ${F.serif}; font-size: 30px; color: var(--forest); }
.pf-payment-badge { margin-top: 22px; padding: 13px 18px; background: var(--cream); display: flex; align-items: center; gap: 11px; color: var(--gold); font-size: 11px; }
.pf-payment-badge span { color: var(--text-muted); }


/* ═══════════ SECURITY TAB ═══════════ */
.pf-security-layout { display: grid; grid-template-columns: 1fr 300px; gap: 28px; }
.pf-security-form-card { background: var(--white); border: 0.5px solid var(--border); padding: 40px 44px; }
.pf-lock-icon-wrap { width: 36px; height: 36px; border: 0.5px solid var(--border-gold); display: flex; align-items: center; justify-content: center; color: var(--gold); flex-shrink: 0; }
.pf-security-title { font-family: ${F.serif}; font-size: 24px; font-weight: 400; color: var(--forest); }
.pf-security-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 36px; line-height: 1.75; max-width: 440px; }
.pf-pw-form { display: flex; flex-direction: column; gap: 24px; max-width: 440px; }
.pf-pw-label { display: block; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 9px; font-family: ${F.sans}; }
.pf-pw-input {
  width: 100%; padding: 14px 48px 14px 18px; border: 0.5px solid var(--border); background: var(--ivory);
  font-family: ${F.sans}; font-size: 14px; color: var(--text-body); outline: none; transition: all 0.25s;
}
.pf-pw-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(74,158,63,0.08); }
.pf-pw-input.has-error { border-color: #b25450; box-shadow: 0 0 0 3px rgba(178,84,80,0.06); }
.pf-pw-toggle { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--mist); display: flex; }
.pf-pw-toggle:hover { color: var(--gold); }
.pf-strength-zone { margin-top: 10px; animation: pfFadeSlide 0.3s ease; }
.pf-strength-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.pf-strength-seg { height: 2.5px; border-radius: 2px; transition: background 0.3s; }
.pf-strength-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 7px; font-weight: 500; }
.pf-pw-checklist { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
.pf-pw-check-item { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: var(--text-muted); transition: color 0.3s; }
.pf-pw-dot { width: 14px; height: 14px; border-radius: 50%; border: 0.5px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--ivory); transition: all 0.3s; flex-shrink: 0; }
.pf-pw-check-item.met { color: var(--forest); }
.pf-pw-check-item.met .pf-pw-dot { background: var(--gold); border-color: var(--gold); }
.pf-pw-submit {
  margin-top: 10px; background: var(--forest); color: var(--ivory); border: none; padding: 16px 34px;
  font-family: ${F.sans}; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  align-self: flex-start; display: flex; align-items: center; gap: 10px;
}
.pf-pw-submit:hover:not(:disabled) { background: var(--forest-mid); gap: 18px; }
.pf-pw-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.pf-tips-card { background: var(--forest); padding: 34px 30px; height: fit-content; position: relative; overflow: hidden; }
.pf-tips-glow { position: absolute; bottom: -60px; left: -40px; width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle, rgba(74,158,63,0.12) 0%, transparent 70%); }
.pf-tips-eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); }
.pf-tip-row { display: flex; gap: 14px; font-size: 12.5px; color: rgba(250,248,243,0.6); line-height: 1.7; }
.pf-tip-num { font-family: ${F.serif}; color: var(--gold); flex-shrink: 0; font-size: 13px; }

/* ═══════════ ADDRESSES TAB ═══════════ */
.pf-add-addr-btn {
  display: flex; align-items: center; gap: 10px; padding: 14px 26px;
  font-family: ${F.sans}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
  margin-bottom: 28px; background: var(--forest); color: var(--ivory); border: none;
}
.pf-add-addr-btn:hover { background: var(--forest-mid); }
.pf-add-addr-btn.is-cancel { background: var(--parchment); color: var(--forest); border: 0.5px solid var(--border); }
.pf-addr-form { background: var(--white); border: 0.5px solid var(--border-gold); padding: 32px; margin-bottom: 28px; animation: pfFadeSlide 0.35s ease; }
.pf-addr-form-editing { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); margin-bottom: 18px; }
.pf-form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }
.pf-form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; margin-bottom: 22px; }
.pf-form-input-wrap label { display: block; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
.pf-form-input-wrap input {
  width: 100%; padding: 12px 16px; border: 0.5px solid var(--border); background: var(--ivory);
  font-family: ${F.sans}; font-size: 13px; outline: none; transition: border-color 0.25s;
}

/* ── Step hint (Province → Ward) ── */
.pf-step-hint {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: 10px; letter-spacing: 0.06em; color: var(--text-muted);
  margin-bottom: 14px; font-family: ${F.sans};
}
.pf-step-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--gold-pale); color: var(--forest);
  font-size: 9px; font-weight: 600; flex-shrink: 0;
}
.pf-step-arrow { color: var(--gold); display: flex; }

/* ── Location Combobox (Tỉnh/Phường autocomplete) ── */
.pf-combobox { position: relative; }
.pf-combobox-inner { position: relative; display: flex; align-items: center; }
.pf-combobox-inner input { padding-right: 40px; }
.pf-combobox-inner input:disabled { background: var(--cream); color: var(--mist); cursor: not-allowed; }
.pf-combobox-inner input:focus:not(:disabled) { border-color: var(--gold); }
.pf-combobox-check { position: absolute; right: 13px; color: var(--gold); display: flex; pointer-events: none; }
.pf-combobox-spinner {
  position: absolute; right: 13px; width: 13px; height: 13px;
  border: 1.5px solid var(--gold-pale); border-top-color: var(--gold); border-radius: 50%;
  animation: pfSpin 0.7s linear infinite;
}
.pf-combobox-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 60;
  background: var(--white); border: 0.5px solid var(--border-gold);
  box-shadow: 0 20px 44px rgba(13,43,30,0.14);
  max-height: 260px; overflow-y: auto;
}
.pf-combobox-option {
  padding: 10px 16px; font-size: 13px; color: var(--text-body); cursor: pointer;
  border-bottom: 0.5px solid var(--border); transition: background 0.15s;
}
.pf-combobox-option:last-child { border-bottom: none; }
.pf-combobox-option.is-highlight { background: var(--gold-pale); color: var(--forest); }
.pf-combobox-option.is-selected { color: var(--gold); font-weight: 500; }
.pf-combobox-empty { padding: 14px 16px; font-size: 12px; color: var(--text-muted); text-align: center; }

.pf-form-input-wrap input:focus { border-color: var(--gold); }
.pf-addr-default-check { display: flex; align-items: center; gap: 11px; margin-bottom: 24px; cursor: pointer; font-size: 13px; color: var(--text-muted); }
.pf-addr-save-btn {
  background: var(--forest); color: var(--ivory); border: none; padding: 14px 30px;
  font-family: ${F.sans}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
}
.pf-addr-save-btn:hover { background: var(--forest-mid); }
.pf-addr-cancel-btn {
  background: transparent; color: var(--text-muted); border: 0.5px solid var(--border); padding: 14px 26px;
  font-family: ${F.sans}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
}
.pf-addr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.pf-addr-card { background: var(--white); border: 0.5px solid; padding: 24px 26px; position: relative; transition: box-shadow 0.3s; }
.pf-addr-card:hover { box-shadow: 0 16px 40px rgba(13,43,30,0.08); }
.pf-addr-default-badge { position: absolute; top: 18px; right: 18px; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; background: var(--gold-pale); color: var(--forest); padding: 5px 11px; font-weight: 500; }
.pf-addr-name { font-size: 14px; color: var(--forest); font-weight: 500; margin-bottom: 5px; }
.pf-addr-phone { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
.pf-addr-text { font-size: 13px; color: var(--text-body); line-height: 1.7; margin-bottom: 18px; }
.pf-addr-actions { display: flex; gap: 16px; flex-wrap: wrap; padding-top: 16px; border-top: 0.5px solid var(--border); }
.pf-addr-action-gold { background: none; border: none; color: var(--gold); font-size: 11px; letter-spacing: 0.04em; }
.pf-addr-action { background: none; border: none; color: var(--forest-mid); font-size: 11px; display: flex; align-items: center; gap: 7px; }

/* ═══════════ EMPTY STATE ═══════════ */
.pf-empty-state { background: var(--white); border: 0.5px dashed var(--border); padding: 72px 32px; text-align: center; }
.pf-empty-icon-wrap { width: 60px; height: 60px; border: 0.5px solid var(--border-gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: var(--gold); }
.pf-empty-text { font-family: ${F.serif}; font-size: 18px; color: var(--forest); font-weight: 400; margin-bottom: 8px; }
.pf-empty-sub { font-size: 12.5px; color: var(--text-muted); }

/* ═══════════ CONFIRM MODAL ═══════════ */
.pf-overlay { position: fixed; inset: 0; background: rgba(10,14,12,0.55); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 24px; animation: pfOverlayIn 0.2s ease; }
.pf-confirm { background: var(--ivory); border: 0.5px solid var(--border-gold); max-width: 420px; width: 100%; padding: 36px 34px 30px; box-shadow: 0 40px 80px rgba(13,43,30,0.3); animation: pfModalIn 0.28s cubic-bezier(0.16,1,0.3,1); }
.pf-confirm-icon { width: 44px; height: 44px; border: 0.5px solid var(--border-gold); display: flex; align-items: center; justify-content: center; color: var(--gold); margin-bottom: 20px; }
.pf-confirm-icon.danger { border-color: rgba(178,84,80,0.35); color: #b25450; }
.pf-confirm-title { font-family: ${F.serif}; font-size: 22px; font-weight: 400; color: var(--forest); margin-bottom: 10px; }
.pf-confirm-msg { font-size: 13px; line-height: 1.75; color: var(--text-muted); margin-bottom: 28px; font-weight: 300; }
.pf-confirm-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
.pf-confirm-cancel { background: transparent; border: 0.5px solid var(--border); color: var(--text-muted); padding: 11px 22px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; font-family: ${F.sans}; }
.pf-confirm-cancel:hover { border-color: var(--border-gold); color: var(--forest); }
.pf-confirm-ok { background: var(--forest); border: none; color: var(--ivory); padding: 11px 26px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; font-family: ${F.sans}; }
.pf-confirm-ok:hover { background: var(--forest-mid); }
.pf-confirm-ok.danger { background: #b25450; }
.pf-confirm-ok.danger:hover { background: #9a423e; }

/* ═══════════ RESPONSIVE ═══════════ */
@media (max-width: 1100px) {
  .pf-passport-zone { padding: 48px 56px 0; }
  .pf-chapters-bar { padding: 0 56px; }
  .pf-main-layout { padding: 48px 56px 80px; }
  .pf-help-strip-inner { padding: 32px 56px; }
}
@media (max-width: 900px) {
  .pf-passport-zone { padding: 110px 24px 0; }
  .pf-passport-card { padding: 32px 24px 0; }
  .pf-chapters-bar { padding: 0 24px; }
  .pf-main-layout { padding: 40px 24px 64px; }
  .pf-help-strip-inner { padding: 28px 24px; flex-direction: column; align-items: flex-start; }
  .pf-fields-grid, .pf-detail-layout, .pf-security-layout, .pf-addr-grid, .pf-form-row-3 { grid-template-columns: 1fr; }
  .pf-passport-bottom { flex-direction: column; align-items: flex-start; gap: 24px; }
  .pf-passport-stats { width: 100%; justify-content: space-between; }
  .pf-tracker-card { padding: 28px 16px; overflow-x: auto; }
  .pf-tracker-row { min-width: 480px; }
}
@media (max-width: 560px) {
  .pf-passport-left { gap: 18px; }
  .pf-passport-seal { width: 64px; height: 64px; font-size: 24px; }
  .pf-form-row-2 { grid-template-columns: 1fr; }
  .pf-passport-stat-sep { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
`