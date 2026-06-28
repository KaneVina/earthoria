// Dashboard.jsx — Admin overview with charts
import { useQuery } from '@tanstack/react-query'
import {
  Users, BookOpen, ShoppingBag, TrendingUp, ArrowUpRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import api from '../../services/api'
import { formatPrice, formatDate } from '../../utils/helpers'
import { ORDER_STATUS } from '../../utils/constants'
import AdminLayout from './AdminLayout'

/* ── Design tokens (mirror admin.css vars) ── */
const T = {
  forest:  '#0D3330',
  green:   '#4a9e3f',
  blue:    '#2a78d6',
  amber:   '#eda100',
  purple:  '#4a3aa7',
  red:     '#e34948',
  grid:    '#e8e5de',
  tick:    '#8a9990',
  surface: '#FAFAF7',
}

/* ── Order status display config ── */
const ORDER_META = {
  PENDING:   { label: 'Chờ xử lý',   cls: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'info'    },
  SHIPPING:  { label: 'Vận chuyển',  cls: 'info'    },
  DELIVERED: { label: 'Đã giao',     cls: 'success' },
  CANCELLED: { label: 'Hủy đơn',     cls: 'danger'  },
  REFUNDED:  { label: 'Hoàn tiền',   cls: 'danger'  },
}

/* ── Custom Tooltip for BarChart ── */
const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8e5de',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 600, color: T.forest, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, display: 'inline-block' }} />
          <span style={{ color: '#666' }}>{p.name}:</span>
          <span style={{ fontWeight: 500, color: T.forest }}>
            {p.dataKey === 'revenue' ? `${p.value}M` : `${p.value} đơn`}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Custom label for Pie ── */
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null
  const RADIAN = Math.PI / 180
  const r   = innerRadius + (outerRadius - innerRadius) * 0.5
  const x   = cx + r * Math.cos(-midAngle * RADIAN)
  const y   = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 11, fontWeight: 600, pointerEvents: 'none' }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => api.get('/admin/dashboard').then(r => r.data.data),
    staleTime: 60_000,
  })

  const stats = data?.stats

  /* ── Static sample data (replace with API when ready) ── */
  const revenueData = data?.revenueChart ?? [
    { month: 'T1', revenue: 18, orders: 96  },
    { month: 'T2', revenue: 22, orders: 118 },
    { month: 'T3', revenue: 19, orders: 104 },
    { month: 'T4', revenue: 28, orders: 149 },
    { month: 'T5', revenue: 24, orders: 131 },
    { month: 'T6', revenue: 31, orders: 168 },
  ]

  const orderPieData = data?.orderStatusChart ?? [
    { name: 'Chờ xử lý',   value: 18, color: T.amber  },
    { name: 'Đã xác nhận', value: 25, color: T.blue   },
    { name: 'Vận chuyển',  value: 22, color: T.purple  },
    { name: 'Đã giao',     value: 30, color: T.green  },
    { name: 'Hủy đơn',     value:  5, color: T.red    },
  ]

  const topBooksData = data?.topBooks ?? [
    { title: 'Đất Rừng Phương Nam', sold: 87 },
    { title: 'Cố Hương',            sold: 74 },
    { title: 'Nhà Giả Kim',         sold: 68 },
    { title: 'Tôi Thấy Hoa Vàng',  sold: 55 },
    { title: 'Mắt Biếc',           sold: 49 },
  ]

  const activityFeed = data?.activity ?? [
    { type: 'green',  text: 'Đơn hàng #a3f91b đã giao thành công',                    time: '5 phút trước'   },
    { type: 'amber',  text: 'Người dùng mới đăng ký: nguyenthao@gmail.com',           time: '18 phút trước'  },
    { type: 'blue',   text: 'Sách "Thiền Định & Tâm Thức" cập nhật tồn kho',         time: '1 giờ trước'    },
    { type: 'red',    text: 'Đơn hàng #c72da0 bị hủy bởi khách hàng',               time: '2 giờ trước'    },
    { type: 'green',  text: 'Thanh toán #b91ee3 xác nhận thành công — 498.000đ',      time: '3 giờ trước'    },
  ]

  const kpiCards = [
    {
      label: 'Người dùng',
      value: stats?.totalUsers  ?? '—',
      icon: Users,
      accent: 'blue',
      delta: '+12%',
      sub: 'so với tháng trước',
    },
    {
      label: 'Đầu sách',
      value: stats?.totalBooks  ?? '—',
      icon: BookOpen,
      accent: 'green',
      delta: '+4',
      sub: 'đầu sách mới',
    },
    {
      label: 'Đơn hàng',
      value: stats?.totalOrders ?? '—',
      icon: ShoppingBag,
      accent: 'amber',
      delta: '+18%',
      sub: 'so với tháng trước',
    },
    {
      label: 'Doanh thu',
      value: isLoading ? '—' : formatPrice(stats?.revenue ?? 0),
      icon: TrendingUp,
      accent: 'purple',
      delta: '+9%',
      sub: 'so với tháng trước',
    },
  ]

  return (
    <AdminLayout>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 26 }}>
        <p className="a-page-eyebrow">Tổng quan</p>
        <h1 className="a-page-title">
          Dashboard <em>Earthoria</em>
        </h1>
      </div>

      {/* ── KPI Cards ── */}
      <div className="a-kpi-grid">
        {kpiCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className={`a-kpi ${card.accent}`}>
              <div className="a-kpi-header">
                <span className="a-kpi-label">{card.label}</span>
                <div className={`a-kpi-icon ${card.accent}`}>
                  <Icon size={15} strokeWidth={1.8} />
                </div>
              </div>
              <div className="a-kpi-value">
                {isLoading ? <span className="a-skeleton" style={{ display: 'inline-block', width: 80, height: 28, borderRadius: 4 }} /> : card.value}
              </div>
              <div className="a-kpi-delta">
                <ArrowUpRight size={12} />
                <span>{card.delta} {card.sub}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Charts row 1: Revenue + Donut ── */}
      <div className="a-chart-grid-2">

        {/* Revenue Bar Chart */}
        <div className="a-chart-card">
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">Doanh thu <em>theo tháng</em></h3>
            <p className="a-chart-sub">6 tháng gần nhất (đơn vị: triệu VNĐ)</p>
          </div>
          <div className="a-chart-legend">
            <span className="a-legend-item">
              <span className="a-legend-sq" style={{ background: T.forest }} />
              Doanh thu
            </span>
            <span className="a-legend-item">
              <span className="a-legend-sq" style={{ background: T.green }} />
              Số đơn hàng
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} barCategoryGap="30%" barGap={4}>
              <CartesianGrid vertical={false} stroke={T.grid} />
              <XAxis
                dataKey="month"
                axisLine={false} tickLine={false}
                tick={{ fill: T.tick, fontSize: 11 }}
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fill: T.tick, fontSize: 11 }}
                tickFormatter={v => `${v}M`}
              />
              <Tooltip content={<RevenueTooltip />} cursor={{ fill: 'rgba(13,51,48,0.04)' }} />
              <Bar dataKey="revenue" name="Doanh thu" fill={T.forest} radius={[4, 4, 0, 0]} />
              <Bar dataKey="orders"  name="Đơn hàng"  fill={T.green}  radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order status Donut */}
        <div className="a-chart-card">
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">Phân bổ <em>đơn hàng</em></h3>
            <p className="a-chart-sub">Trạng thái hiện tại</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={orderPieData}
                cx="50%" cy="50%"
                innerRadius={46} outerRadius={72}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderPieLabel}
              >
                {orderPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name) => [`${val}%`, name]}
                contentStyle={{
                  fontSize: 12, borderRadius: 8,
                  border: '1px solid #e8e5de',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
            {orderPieData.map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', fontSize: 11,
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ color: 'rgba(13,51,48,0.6)' }}>{item.name}</span>
                </span>
                <span style={{ fontWeight: 500, color: T.forest }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts row 2: Top books + Activity ── */}
      <div className="a-chart-grid-2" style={{ marginBottom: 24 }}>

        {/* Top books horizontal bar */}
        <div className="a-chart-card">
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">Top sách <em>bán chạy</em></h3>
            <p className="a-chart-sub">Tháng này</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={topBooksData}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
            >
              <CartesianGrid horizontal={false} stroke={T.grid} />
              <XAxis
                type="number"
                axisLine={false} tickLine={false}
                tick={{ fill: T.tick, fontSize: 11 }}
              />
              <YAxis
                type="category" dataKey="title"
                axisLine={false} tickLine={false}
                tick={{ fill: T.tick, fontSize: 11 }}
                width={130}
              />
              <Tooltip
                formatter={(val) => [`${val} cuốn`, 'Đã bán']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e8e5de' }}
                cursor={{ fill: 'rgba(13,51,48,0.03)' }}
              />
              <Bar dataKey="sold" fill={T.forest} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity feed */}
        <div className="a-chart-card">
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">Hoạt động <em>hệ thống</em></h3>
            <p className="a-chart-sub">Cập nhật gần nhất</p>
          </div>
          <div className="a-activity">
            {activityFeed.map((item, i) => (
              <div key={i} className="a-activity-item">
                <div className={`a-activity-dot ${item.type}`} />
                <div>
                  <div className="a-activity-text">{item.text}</div>
                  <div className="a-activity-time">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent orders table ── */}
      <div className="a-table-card">
        <div className="a-table-head">
          <h3 className="a-table-title">Đơn hàng <em>gần đây</em></h3>
          <a href="/admin/orders" className="a-table-link">
            Xem tất cả <ArrowUpRight size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </a>
        </div>
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>
                    Đang tải...
                  </td>
                </tr>
              ) : !data?.recentOrders?.length ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              ) : data.recentOrders.map(order => {
                const meta = ORDER_META[order.status] ?? ORDER_META.PENDING
                return (
                  <tr key={order.id}>
                    <td className="a-td-mono">{order.id.slice(0, 8)}...</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{order.user?.name}</div>
                      <div className="a-td-muted">{order.user?.email}</div>
                    </td>
                    <td className="a-td-muted">{order.items?.length} sản phẩm</td>
                    <td className="a-td-serif">{formatPrice(order.total)}</td>
                    <td>
                      <span className={`a-badge ${meta.cls}`}>{meta.label}</span>
                    </td>
                    <td className="a-td-muted">{formatDate(order.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </AdminLayout>
  )
}