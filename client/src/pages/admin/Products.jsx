// Products.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import { formatPrice } from '../../utils/helpers'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'

const inputStyle = {
  background: '#F7F6F2', border: '1px solid rgba(13,51,48,0.12)',
  borderRadius: 6, padding: '9px 13px', fontSize: 13, color: '#0D3330',
  outline: 'none', width: '100%', fontFamily: 'Be Vietnam Pro, sans-serif',
  transition: 'border-color 0.15s',
}
const labelStyle = {
  fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
  color: 'rgba(13,51,48,0.45)', marginBottom: 6, display: 'block', fontWeight: 500,
}

export default function Products() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editBook, setEditBook] = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', price: '', salePrice: '',
    stock: '', categoryId: '', coverImage: '', publisher: '',
    pages: '', language: 'VI', hasAR: true, hasAI: true, isFeatured: false
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-books', page, search],
    queryFn: () => api.get('/admin/books', { params: { page, limit: 15, search } }).then(r => r.data.data)
  })
  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/books', data),
    onSuccess: () => { toast.success('Tạo sách thành công!'); qc.invalidateQueries(['admin-books']); resetForm() },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/books/${id}`, data),
    onSuccess: () => { toast.success('Cập nhật thành công!'); qc.invalidateQueries(['admin-books']); resetForm() },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/books/${id}`),
    onSuccess: () => { toast.success('Đã xóa sách!'); qc.invalidateQueries(['admin-books']) },
    onError: () => toast.error('Xóa thất bại!')
  })

  const resetForm = () => {
    setShowForm(false); setEditBook(null)
    setForm({ title: '', description: '', price: '', salePrice: '', stock: '', categoryId: '', coverImage: '', publisher: '', pages: '', language: 'VI', hasAR: true, hasAI: true, isFeatured: false })
  }
  const handleEdit = (book) => {
    setEditBook(book)
    setForm({ title: book.title, description: book.description || '', price: book.price, salePrice: book.salePrice || '', stock: book.stock, categoryId: book.categoryId, coverImage: book.coverImage || '', publisher: book.publisher || '', pages: book.pages || '', language: book.language, hasAR: book.hasAR, hasAI: book.hasAI, isFeatured: book.isFeatured })
    setShowForm(true)
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    editBook ? updateMutation.mutate({ id: editBook.id, data: form }) : createMutation.mutate(form)
  }

  return (
    <AdminLayout currentPath="/admin/products">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)', marginBottom: 6 }}>Quản lý</p>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px,2.5vw,34px)', fontWeight: 300, color: '#0D3330' }}>
            Sản <em style={{ fontStyle: 'italic', color: '#C9A84C' }}>Phẩm</em>
          </h1>
        </div>
        <button onClick={() => setShowForm(true)} style={primaryBtnStyle}>
          <Plus size={13} /> Thêm sách mới
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
        <Search size={13} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(13,51,48,0.35)' }} />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Tìm kiếm sách..."
          style={{ ...inputStyle, paddingLeft: 38 }}
          onFocus={e => e.target.style.borderColor = '#C9A84C'}
          onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'}
        />
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'auto', borderRadius: 12, boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(13,51,48,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 400, color: '#0D3330' }}>{editBook ? 'Chỉnh sửa sách' : 'Thêm sách mới'}</h3>
              <button onClick={resetForm} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: 'rgba(13,51,48,0.35)', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Tên sách *</label>
                  <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Giá gốc *</label>
                  <input style={inputStyle} type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required placeholder="150000"
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Giá sale</label>
                  <input style={inputStyle} type="number" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: e.target.value })} placeholder="120000"
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Tồn kho *</label>
                  <input style={inputStyle} type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Danh mục *</label>
                  <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
                    <option value="">Chọn danh mục</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Ảnh bìa (URL)</label>
                  <input style={inputStyle} value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..."
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Nhà xuất bản</label>
                  <input style={inputStyle} value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })}
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Số trang</label>
                  <input style={inputStyle} type="number" value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })}
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Mô tả</label>
                  <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 20 }}>
                  {[{ key: 'hasAR', label: 'Có AR' }, { key: 'hasAI', label: 'Có AI Tutor' }, { key: 'isFeatured', label: 'Nổi bật' }].map(cb => (
                    <label key={cb.key} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: '#0D3330' }}>
                      <input type="checkbox" checked={form[cb.key]} onChange={e => setForm({ ...form, [cb.key]: e.target.checked })} style={{ accentColor: '#C9A84C', width: 14, height: 14 }} />
                      {cb.label}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="submit" style={primaryBtnStyle} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editBook ? 'Cập nhật' : 'Tạo sách'}
                </button>
                <button type="button" onClick={resetForm} style={ghostBtnStyle}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(13,51,48,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAF8' }}>
              {['Sách', 'Danh mục', 'Giá', 'Tồn kho', 'Đã bán', 'Trạng thái', ''].map(h => (
                <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)', fontSize: 13 }}>Đang tải...</td></tr>
            ) : data?.books?.map(book => (
              <tr key={book.id} style={{ borderTop: '1px solid rgba(13,51,48,0.06)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '13px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 38, height: 50, borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(13,51,48,0.1)', flexShrink: 0 }}>
                      <img src={book.coverImage || 'https://via.placeholder.com/38x50'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: '#0D3330', fontWeight: 500, marginBottom: 2 }}>{book.title}</div>
                      <div style={{ fontSize: 10, color: 'rgba(13,51,48,0.35)', fontFamily: 'monospace' }}>{book.hashId}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '13px 18px', fontSize: 12, color: 'rgba(13,51,48,0.5)' }}>{book.category?.name}</td>
                <td style={{ padding: '13px 18px' }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, color: '#0D3330' }}>{formatPrice(book.salePrice || book.price)}</div>
                  {book.salePrice && <div style={{ fontSize: 11, color: 'rgba(13,51,48,0.35)', textDecoration: 'line-through' }}>{formatPrice(book.price)}</div>}
                </td>
                <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 500, color: book.stock < 10 ? '#B84040' : '#0D3330' }}>{book.stock}</td>
                <td style={{ padding: '13px 18px', fontSize: 13, color: 'rgba(13,51,48,0.5)' }}>{book.sold}</td>
                <td style={{ padding: '13px 18px' }}>
                  <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, fontWeight: 500, background: book.isActive ? 'rgba(50,160,100,0.12)' : 'rgba(13,51,48,0.07)', color: book.isActive ? '#288A55' : 'rgba(13,51,48,0.4)' }}>
                    {book.isActive ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </td>
                <td style={{ padding: '13px 18px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleEdit(book)} style={tableActionBtn('#C9A84C')}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => { if (confirm('Xóa sách này?')) deleteMutation.mutate(book.id) }} style={tableActionBtn('#B84040')}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.pagination && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(13,51,48,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(13,51,48,0.4)' }}>Tổng {data.pagination.total} sách</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtn(false)}><ChevronLeft size={13} /></button>
              {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={pageBtn(p === page)}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))} disabled={page === data.pagination.totalPages} style={pageBtn(false)}><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

const primaryBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 20px', borderRadius: 7,
  background: '#0D3330', color: '#F0EDE6',
  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  fontFamily: 'Be Vietnam Pro, sans-serif', letterSpacing: '0.01em',
  transition: 'opacity 0.15s',
}
const ghostBtnStyle = {
  display: 'inline-flex', alignItems: 'center',
  padding: '9px 18px', borderRadius: 7,
  background: 'transparent', color: 'rgba(13,51,48,0.6)',
  border: '1px solid rgba(13,51,48,0.15)', cursor: 'pointer', fontSize: 13,
  fontFamily: 'Be Vietnam Pro, sans-serif',
}
const tableActionBtn = (color) => ({
  width: 30, height: 30, borderRadius: 6,
  border: `1px solid ${color}33`,
  background: `${color}0D`,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color,
})
const pageBtn = (active) => ({
  minWidth: 30, height: 30, borderRadius: 6, border: '1px solid rgba(13,51,48,0.12)',
  background: active ? '#0D3330' : 'transparent',
  color: active ? '#F0EDE6' : 'rgba(13,51,48,0.5)',
  cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '0 6px',
})