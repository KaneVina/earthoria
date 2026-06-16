import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Lock, Unlock } from 'lucide-react'
import api from '../../services/api'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

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
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 100px' }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div className="eyebrow-line"></div>
            <span className="eyebrow-text">Quản lý</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 300, color: 'var(--forest)' }}>
            Người <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Dùng</em>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Sản phẩm', href: '/admin/products' },
            { label: 'Đơn hàng', href: '/admin/orders' },
            { label: 'Người dùng', href: '/admin/users' },
            { label: 'Mã giảm giá', href: '/admin/coupons' },
          ].map(tab => (
            <a key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
              <button className={`pill ${tab.href === '/admin/users' ? 'active' : ''}`}>{tab.label}</button>
            </a>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '400px' }}>
          <Search size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm kiếm người dùng..."
            style={{ background: 'var(--ivory)', border: '0.5px solid var(--border)', padding: '10px 14px 10px 40px', fontSize: '13px', color: 'var(--forest)', outline: 'none', width: '100%' }}
          />
        </div>

        <div style={{ background: 'var(--white)', border: '0.5px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Người dùng', 'Vai trò', 'Đơn hàng', 'Ngày đăng ký', 'Trạng thái', ''].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
              ) : data?.users?.map(user => (
                <tr key={user.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display,serif', fontSize: '16px', color: 'var(--gold)', flexShrink: 0 }}>
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--forest)', fontWeight: 400 }}>{user.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '4px 10px', background: user.role === 'ADMIN' ? 'rgba(13,51,48,0.08)' : 'var(--pale)', color: user.role === 'ADMIN' ? 'var(--forest)' : 'var(--text-muted)' }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--forest)' }}>{user._count?.orders || 0}</td>
                  <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(user.createdAt)}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: '9px', padding: '4px 10px', background: user.isActive ? 'var(--gold-pale)' : 'rgba(192,80,80,0.08)', color: user.isActive ? 'var(--gold)' : '#c05050', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {user.role !== 'ADMIN' && (
                      <button
                        onClick={() => toggleMutation.mutate(user.id)}
                        style={{ width: '32px', height: '32px', border: `0.5px solid ${user.isActive ? 'rgba(192,80,80,0.3)' : 'var(--border-gold)'}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: user.isActive ? '#c05050' : 'var(--gold)' }}
                      >
                        {user.isActive ? <Lock size={12}/> : <Unlock size={12}/>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}