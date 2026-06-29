// Analytics.jsx — Trang theo dõi lưu lượng truy cập (Umami)
// Đặt tại: src/pages/admin/Analytics.jsx
//
// CÀI ĐẶT:
//   1. Tạo file .env trong thư mục client:
//      VITE_UMAMI_URL=https://your-umami.onrender.com
//      VITE_UMAMI_SITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
//      VITE_UMAMI_USER=admin
//      VITE_UMAMI_PASS=your_password
//      (Token được tự động lấy qua POST /api/auth/login, cache 23 giờ)
//
//   2. Thêm tracking script vào index.html:
//      <script defer src="${VITE_UMAMI_URL}/script.js" data-website-id="${VITE_UMAMI_SITE_ID}"></script>

import { useState, useEffect, useCallback } from 'react'
import {
  Users, TrendingUp, Globe, Smartphone, Monitor,
  Clock, FileText, RefreshCw, Wifi, WifiOff,
  BarChart2, Activity,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import AdminLayout from './AdminLayout'

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const UMAMI_URL  = import.meta.env.VITE_UMAMI_URL    || ''
const SITE_ID    = import.meta.env.VITE_UMAMI_SITE_ID || ''
const UMAMI_USER = import.meta.env.VITE_UMAMI_USER   || 'admin'
const UMAMI_PASS = import.meta.env.VITE_UMAMI_PASS   || ''

const PERIOD_OPTIONS = [
  { label: '7 ngày',  value: '7d',  unit: 'day'   },
  { label: '30 ngày', value: '30d', unit: 'day'   },
  { label: '3 tháng', value: '90d', unit: 'month' },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getRange(period) {
  const end   = Date.now()
  const days  = parseInt(period)
  const start = end - days * 24 * 60 * 60 * 1000
  return { startAt: start, endAt: end }
}

function fmtNum(n) {
  if (n == null) return '—'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function fmtDur(ms) {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}p ${s % 60}s` : `${s}s`
}

// ─── TOKEN MANAGER ────────────────────────────────────────────────────────────
// Token được lấy tự động qua POST /api/auth/login và cache 23 giờ.
// Không cần VITE_UMAMI_TOKEN trong .env nữa.
let _token       = null
let _tokenExpiry = 0

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token
  const res = await fetch(`${UMAMI_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: UMAMI_USER, password: UMAMI_PASS }),
  })
  if (!res.ok) throw new Error(`Đăng nhập Umami thất bại (${res.status})`)
  const data = await res.json()
  _token = data.token
  _tokenExpiry = Date.now() + 23 * 60 * 60 * 1000   // cache 23 giờ
  return _token
}

// ─── API FETCH ────────────────────────────────────────────────────────────────
async function umamiGet(path, params = {}) {
  if (!UMAMI_URL || !SITE_ID || !UMAMI_PASS) return null
  const token = await getToken()
  const url = new URL(`${UMAMI_URL}/api/websites/${SITE_ID}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  // 400 = không có data (chưa có traffic), trả rỗng thay vì crash
  if (res.status === 400) return []
  if (!res.ok) throw new Error(`Umami API lỗi: ${res.status}`)
  return res.json()
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--a-surface)',
      border: '0.5px solid var(--a-border)',
      borderRadius: 12,
      padding: '20px 22px',
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 9,
        background: accent ? 'rgba(74,158,63,0.1)' : 'rgba(13,51,48,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: accent ? 'var(--a-green)' : 'rgba(13,51,48,0.45)',
      }}>
        <Icon size={16} strokeWidth={1.7} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'rgba(13,51,48,0.4)', marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--a-text)', fontFamily: 'var(--a-font-serif)', lineHeight: 1 }}>
          {value ?? '—'}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: 'rgba(13,51,48,0.38)', marginTop: 4 }}>{sub}</div>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'rgba(13,51,48,0.35)',
      margin: '32px 0 12px',
    }}>
      {children}
    </h2>
  )
}

function ListCard({ title, items, valueKey = 'y', labelKey = 'x', formatVal }) {
  const max = Math.max(...(items || []).map(i => i[valueKey] || 0), 1)
  return (
    <div style={{
      background: 'var(--a-surface)',
      border: '0.5px solid var(--a-border)',
      borderRadius: 12,
      padding: '18px 20px',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(13,51,48,0.5)', marginBottom: 14, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {title}
      </div>
      {!items?.length ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(13,51,48,0.25)', fontSize: 12 }}>
          Chưa có dữ liệu
        </div>
      ) : items.slice(0, 8).map((item, i) => {
        const val = item[valueKey] || 0
        const pct = Math.round((val / max) * 100)
        return (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: 'var(--a-text)', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item[labelKey] || '(không rõ)'}
              </span>
              <span style={{ color: 'rgba(13,51,48,0.5)', fontWeight: 600 }}>
                {formatVal ? formatVal(val) : fmtNum(val)}
              </span>
            </div>
            <div style={{ height: 3, background: 'rgba(13,51,48,0.07)', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--a-green)', borderRadius: 99, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DeviceDonut({ data }) {
  const desktop = data?.desktop || 0
  const mobile  = data?.mobile  || 0
  const tablet  = data?.tablet  || 0
  const total   = desktop + mobile + tablet || 1

  const items = [
    { label: 'Desktop', val: desktop, color: '#4a9e3f' },
    { label: 'Mobile',  val: mobile,  color: '#b8862e' },
    { label: 'Tablet',  val: tablet,  color: '#3a7a8a' },
  ]

  return (
    <div style={{
      background: 'var(--a-surface)',
      border: '0.5px solid var(--a-border)',
      borderRadius: 12,
      padding: '18px 20px',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(13,51,48,0.5)', marginBottom: 14, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Thiết bị
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item => (
          <div key={item.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: 'var(--a-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.label === 'Desktop' ? <Monitor size={11} /> : <Smartphone size={11} />}
                {item.label}
              </span>
              <span style={{ color: 'rgba(13,51,48,0.5)', fontWeight: 600 }}>
                {Math.round((item.val / total) * 100)}%
              </span>
            </div>
            <div style={{ height: 3, background: 'rgba(13,51,48,0.07)', borderRadius: 99 }}>
              <div style={{
                height: '100%',
                width: `${Math.round((item.val / total) * 100)}%`,
                background: item.color,
                borderRadius: 99,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0d3330', border: '0.5px solid rgba(74,158,63,0.3)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#faf8f3',
    }}>
      <div style={{ marginBottom: 4, opacity: 0.6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: p.color }}>{p.name}:</span>
          <span>{fmtNum(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── NOT CONFIGURED STATE ─────────────────────────────────────────────────────
function NotConfigured() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'rgba(74,158,63,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, color: 'var(--a-green)',
      }}>
        <BarChart2 size={24} />
      </div>
      <h2 style={{ fontFamily: 'var(--a-font-serif)', fontSize: 22, color: 'var(--a-text)', marginBottom: 10 }}>
        Chưa cấu hình Umami
      </h2>
      <p style={{ fontSize: 13, color: 'rgba(13,51,48,0.45)', maxWidth: 420, lineHeight: 1.7, marginBottom: 28 }}>
        Thêm các biến sau vào file <code style={{ background: 'rgba(13,51,48,0.07)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>client/.env</code>:
      </p>
      <div style={{
        background: '#0d3330', borderRadius: 10, padding: '16px 24px',
        textAlign: 'left', fontFamily: 'monospace', fontSize: 12,
        color: '#c8d4cc', lineHeight: 2, width: '100%', maxWidth: 500,
      }}>
        <span style={{ color: '#4a9e3f' }}>VITE_UMAMI_URL</span>=https://your-umami.onrender.com<br />
        <span style={{ color: '#4a9e3f' }}>VITE_UMAMI_SITE_ID</span>=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx<br />
        <span style={{ color: '#4a9e3f' }}>VITE_UMAMI_USER</span>=admin<br />
        <span style={{ color: '#4a9e3f' }}>VITE_UMAMI_PASS</span>=mật_khẩu_của_bạn
      </div>
      <p style={{ fontSize: 12, color: 'rgba(13,51,48,0.35)', marginTop: 20 }}>
        Token sẽ được tự động lấy qua API — không cần tạo API Key thủ công.
      </p>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [period,   setPeriod]   = useState('7d')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [realtime, setRealtime] = useState(null)

  // Data states
  const [summary,   setSummary]   = useState(null)
  const [pageviews, setPageviews] = useState([])
  const [pages,     setPages]     = useState([])
  const [countries, setCountries] = useState([])
  const [cities,    setCities]    = useState([])
  const [devices,   setDevices]   = useState({})
  const [referrers, setReferrers] = useState([])

  const isConfigured = !!(UMAMI_URL && SITE_ID && UMAMI_PASS)
  const periodOpt    = PERIOD_OPTIONS.find(p => p.value === period)

  // Fetch all data
  const fetchAll = useCallback(async () => {
    if (!isConfigured) return
    setLoading(true)
    setError(null)
    try {
      const { startAt, endAt } = getRange(period)
      // /pageviews cần unit + timezone; /metrics chỉ cần startAt + endAt + type
      const pvParams      = { startAt, endAt, unit: periodOpt.unit, timezone: 'Asia/Ho_Chi_Minh' }
      const metricsParams = { startAt, endAt }

      const [sumData, pvData, pagesData, countriesData, citiesData, devData, refData] = await Promise.all([
        umamiGet('/stats',     { startAt, endAt }),
        umamiGet('/pageviews', pvParams),
        umamiGet('/metrics',   { ...metricsParams, type: 'url' }),
        umamiGet('/metrics',   { ...metricsParams, type: 'country' }),
        umamiGet('/metrics',   { ...metricsParams, type: 'city' }),
        umamiGet('/metrics',   { ...metricsParams, type: 'device' }),
        umamiGet('/metrics',   { ...metricsParams, type: 'referrer' }),
      ])

      setSummary(sumData)
      // Merge pageviews + sessions into chart data
      const pvArr = pvData?.pageviews?.data || []
      const ssArr = pvData?.sessions?.data  || []
      const merged = pvArr.map((pv, i) => ({
        date: new Date(pv.x).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' }),
        'Lượt xem': pv.y,
        'Người dùng': ssArr[i]?.y || 0,
      }))
      setPageviews(merged)
      setPages(pagesData || [])
      setCountries(countriesData || [])
      setCities(citiesData || [])
      setDevices(
        (devData || []).reduce((acc, d) => {
          acc[d.x?.toLowerCase() || 'other'] = d.y
          return acc
        }, {})
      )
      setReferrers(refData || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [period, isConfigured, periodOpt])

  // Realtime active users
  useEffect(() => {
    if (!isConfigured) return
    const fetchRealtime = async () => {
      try {
        const data = await umamiGet('/active')
        setRealtime(data?.x ?? data?.visitors ?? 0)
      } catch { /* silent */ }
    }
    fetchRealtime()
    const iv = setInterval(fetchRealtime, 30000) // mỗi 30s
    return () => clearInterval(iv)
  }, [isConfigured])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <AdminLayout>
      {/* ── Header ── */}
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Analytics</p>
          <h1 className="a-page-title">Thống kê <em>Truy cập</em></h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Period tabs */}
          <div style={{
            display: 'flex', background: 'rgba(13,51,48,0.05)',
            borderRadius: 8, padding: 3, gap: 2,
          }}>
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                style={{
                  fontSize: 12, fontWeight: 500, padding: '5px 12px',
                  borderRadius: 6, border: 'none', cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: period === opt.value ? 'var(--a-green)' : 'transparent',
                  color: period === opt.value ? '#fff' : 'rgba(13,51,48,0.5)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Refresh */}
          <button
            className="a-topbar-btn"
            onClick={fetchAll}
            disabled={loading}
            title="Làm mới dữ liệu"
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ── Not configured ── */}
      {!isConfigured && <NotConfigured />}

      {/* ── Error ── */}
      {isConfigured && error && (
        <div style={{
          background: 'rgba(192,80,80,0.08)', border: '0.5px solid rgba(192,80,80,0.25)',
          borderRadius: 10, padding: '12px 16px', fontSize: 13,
          color: '#c05050', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20,
        }}>
          <WifiOff size={14} /> Không kết nối được Umami: {error}
        </div>
      )}

      {isConfigured && (
        <>
          {/* ── Realtime badge ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: realtime > 0 ? 'rgba(74,158,63,0.1)' : 'rgba(13,51,48,0.05)',
              border: `0.5px solid ${realtime > 0 ? 'rgba(74,158,63,0.3)' : 'var(--a-border)'}`,
              borderRadius: 999, padding: '6px 14px',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: realtime > 0 ? '#4a9e3f' : 'rgba(13,51,48,0.2)',
                boxShadow: realtime > 0 ? '0 0 0 3px rgba(74,158,63,0.2)' : 'none',
                animation: realtime > 0 ? 'pulse 2s infinite' : 'none',
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: realtime > 0 ? 'var(--a-green)' : 'rgba(13,51,48,0.4)' }}>
                {realtime != null ? `${realtime} người đang online` : 'Đang kết nối...'}
              </span>
              <Wifi size={11} style={{ color: 'rgba(13,51,48,0.3)' }} />
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <StatCard
              icon={TrendingUp} label="Tổng lượt xem" accent
              value={fmtNum(summary?.pageviews?.value)}
              sub={`vs ${fmtNum(summary?.pageviews?.change)} kỳ trước`}
            />
            <StatCard
              icon={Users} label="Người dùng"
              value={fmtNum(summary?.visitors?.value)}
              sub={`+${fmtNum(summary?.visitors?.change)} mới`}
            />
            <StatCard
              icon={Activity} label="Phiên truy cập"
              value={fmtNum(summary?.visits?.value)}
            />
            <StatCard
              icon={Clock} label="Thời gian TB"
              value={fmtDur(summary?.totaltime?.value)}
            />
            <StatCard
              icon={FileText} label="Tỷ lệ thoát"
              value={summary?.bounces?.value != null
                ? `${Math.round((summary.bounces.value / (summary.visits?.value || 1)) * 100)}%`
                : '—'}
            />
          </div>

          {/* ── Pageviews chart ── */}
          <SectionTitle>Lượt xem theo thời gian</SectionTitle>
          <div style={{
            background: 'var(--a-surface)',
            border: '0.5px solid var(--a-border)',
            borderRadius: 12, padding: '20px 16px',
          }}>
            {pageviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(13,51,48,0.25)', fontSize: 13 }}>
                {loading ? 'Đang tải...' : 'Chưa có dữ liệu'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={pageviews} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4a9e3f" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4a9e3f" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#b8862e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#b8862e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,51,48,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(13,51,48,0.35)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(13,51,48,0.35)' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Lượt xem"   stroke="#4a9e3f" fill="url(#gPV)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="Người dùng" stroke="#b8862e" fill="url(#gSS)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Top pages + Referrers ── */}
          <SectionTitle>Trang & Nguồn truy cập</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ListCard title="Trang xem nhiều nhất" items={pages} labelKey="x" valueKey="y" />
            <ListCard title="Nguồn giới thiệu"     items={referrers} labelKey="x" valueKey="y" />
          </div>

          {/* ── Countries + Cities + Devices ── */}
          <SectionTitle>Địa lý & Thiết bị</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <ListCard title="Quốc gia" items={countries} labelKey="x" valueKey="y" />
            <ListCard title="Thành phố" items={cities}   labelKey="x" valueKey="y" />
            <DeviceDonut data={devices} />
          </div>

          {/* ── Countries bar chart ── */}
          {countries.length > 0 && (
            <>
              <SectionTitle>Top quốc gia</SectionTitle>
              <div style={{
                background: 'var(--a-surface)',
                border: '0.5px solid var(--a-border)',
                borderRadius: 12, padding: '20px 16px',
              }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={countries.slice(0, 10)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,51,48,0.06)" />
                    <XAxis dataKey="x" tick={{ fontSize: 10, fill: 'rgba(13,51,48,0.35)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(13,51,48,0.35)' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="y" name="Lượt xem" fill="#4a9e3f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(74,158,63,0.2) }
          50%       { box-shadow: 0 0 0 6px rgba(74,158,63,0.08) }
        }
      `}</style>
    </AdminLayout>
  )
}