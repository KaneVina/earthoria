// ServerStatus.jsx — Hiển thị trạng thái server từ UptimeRobot
import { useQuery } from '@tanstack/react-query'
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react'
import api from '../../services/api'

async function fetchStatus() {
  const res  = await api.get('/admin/server-status')
  const data = res.data
  if (data.stat !== 'ok') throw new Error('UptimeRobot error')
  return data.monitors[0]
}

export default function ServerStatus() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['server-status'],
    queryFn:  fetchStatus,
    refetchInterval: 5 * 60 * 1000,
    staleTime:       4 * 60 * 1000,
  })

  const isUp   = data?.status === 2
  const isDown = data?.status === 9
  const uptime = data?.custom_uptime_ratio ?? '—'
  const avgMs  = data?.response_times?.length
    ? Math.round(data.response_times.reduce((s, r) => s + r.value, 0) / data.response_times.length)
    : null

  const statusColor = isLoading ? '#8a9990'
    : isError ? '#eda100'
    : isUp    ? '#4a9e3f'
    : isDown  ? '#e34948'
    : '#eda100'

  const statusLabel = isLoading ? 'Đang kiểm tra...'
    : isError ? 'Không thể kết nối'
    : isUp    ? 'Hoạt động tốt'
    : isDown  ? 'Đang ngừng hoạt động'
    : 'Đang kiểm tra...'

  const StatusIcon = isLoading ? Activity
    : isError ? Clock
    : isUp    ? CheckCircle
    : isDown  ? XCircle
    : Clock

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8e5de',
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      {/* Left: label + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${statusColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <StatusIcon size={16} color={statusColor} strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#8a9990', fontWeight: 500, marginBottom: 2 }}>
            TRẠNG THÁI SERVER
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>
            {statusLabel}
          </div>
        </div>
      </div>

      {/* Right: stats */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#8a9990', marginBottom: 2 }}>Uptime 30 ngày</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0D3330' }}>
            {isLoading ? '—' : `${uptime}%`}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#8a9990', marginBottom: 2 }}>Thời gian phản hồi</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0D3330' }}>
            {isLoading ? '—' : avgMs ? `${avgMs}ms` : '—'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: statusColor,
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 11, color: '#8a9990' }}>
            {isLoading ? '...' : isUp ? 'Live' : isDown ? 'Down' : '...'}
          </span>
        </div>
      </div>
    </div>
  )
}