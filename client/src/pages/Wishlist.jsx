import { useEffect, useState, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart, ShoppingCart, Trash2, ArrowRight,
  PackageOpen, Loader2, ArrowUpDown, Share2, Check,
  Search, X, CheckSquare, Square, AlertTriangle, ListChecks, Undo2,
} from 'lucide-react'
import { useWishlistStore } from '../store/wishlistStore'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { formatPrice, getPreferredCartFormat } from '../utils/helpers'
import { flyToCart } from '../utils/flyToCart'
import toast from 'react-hot-toast'

const PAGE_SIZE = 12

// ─ Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="wl-card">
      <div className="skeleton wl-card-img-wrap" style={{ background: 'none' }} />
      <div className="wl-card-body">
        <div className="skeleton" style={{ width: '60px', height: '10px', marginBottom: '10px' }} />
        <div className="skeleton" style={{ width: '80%', height: '20px', marginBottom: '6px' }} />
        <div className="skeleton" style={{ width: '55%', height: '20px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ width: '100%', height: '13px', marginBottom: '6px' }} />
        <div className="skeleton" style={{ width: '70%', height: '13px', marginBottom: '24px' }} />
        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
          <div className="skeleton" style={{ flex: 1, height: '44px' }} />
          <div className="skeleton" style={{ width: '44px', height: '44px' }} />
        </div>
      </div>
    </div>
  )
}

// ─ Wishlist item card ─────────────────────────────────────────────────────
function WishlistCard({ book, onRemove, onMoveToCart, isRemoving, isMoving, selectMode, selected, onToggleSelect }) {
  const navigate = useNavigate()

  const displayPrice = book.salePrice ? formatPrice(book.salePrice) : formatPrice(book.price)
  const originalPrice = book.salePrice && book.price > book.salePrice ? formatPrice(book.price) : null
  const discount = originalPrice ? `-${Math.round((1 - book.salePrice / book.price) * 100)}%` : null

  const handleCardClick = () => {
    if (selectMode) { onToggleSelect(book.hashId); return }
    if (book.slug && book.hashId) navigate(`/books/${book.slug}/${book.hashId}`)
  }

  const handleCheckboxClick = (e) => {
    e.stopPropagation()
    onToggleSelect(book.hashId)
  }

  return (
    <div className={`wl-card${isRemoving ? ' wl-card--removing' : ''}${selected ? ' wl-card--selected' : ''}`}>
      {/* Image */}
      <div className="wl-card-img-wrap" onClick={handleCardClick}>
        {selectMode && (
          <button
            className={`wl-select-check${selected ? ' checked' : ''}`}
            onClick={handleCheckboxClick}
            aria-label={selected ? 'Bỏ chọn' : 'Chọn sản phẩm'}
            aria-pressed={selected}
          >
            {selected ? <CheckSquare size={17} strokeWidth={1.8} /> : <Square size={17} strokeWidth={1.8} />}
          </button>
        )}
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} className="wl-card-img" />
        ) : (
          <div className="wl-card-img-placeholder">
            <PackageOpen size={32} strokeWidth={1} color="var(--mist)" />
          </div>
        )}
        {discount && <span className="wl-badge wl-badge--discount">{discount}</span>}
        {book.stock === 0 && <span className="wl-badge wl-badge--out">Hết hàng</span>}
        {book.stock > 0 && book.stock <= 5 && (
          <span className="wl-badge wl-badge--low">Còn {book.stock}</span>
        )}
      </div>

      {/* Body */}
      <div className="wl-card-body">
        {book.category?.name && <span className="wl-card-cat">{book.category.name}</span>}
        <h3 className="wl-card-title" onClick={handleCardClick}>{book.title}</h3>
        {book.description && (
          <p className="wl-card-desc">
            {book.description.length > 90 ? book.description.slice(0, 90) + '…' : book.description}
          </p>
        )}
        <div className="wl-card-tags">
          {book.hasAR && <span className="wl-tag">AR</span>}
          {book.hasAI && <span className="wl-tag">AI Tutor</span>}
          {book.has3DAudio && <span className="wl-tag">3D Audio</span>}
        </div>
        <div className="wl-card-price-row">
          <span className="wl-card-price">{displayPrice}</span>
          {originalPrice && <span className="wl-card-price-old">{originalPrice}</span>}
        </div>
        <div className="wl-card-actions">
          <button
            className="wl-btn-cart"
            onClick={(e) => {
              const cardImg = e.currentTarget
                .closest(".wl-card")
                ?.querySelector(".wl-card-img");
              if (cardImg) flyToCart(cardImg);
              onMoveToCart(book);
            }}
            disabled={book.stock === 0 || isMoving}
            title={book.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
          >
            {isMoving ? <Loader2 size={14} className="wl-spin" /> : <ShoppingCart size={14} strokeWidth={1.6} />}
            {book.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
          </button>
          <button
            className="wl-btn-remove"
            onClick={() => onRemove(book)}
            disabled={isRemoving}
            title="Xoá khỏi yêu thích"
            aria-label="Xoá khỏi yêu thích"
          >
            {isRemoving ? <Loader2 size={14} className="wl-spin" /> : <Trash2 size={14} strokeWidth={1.6} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─ Empty state ────────────────────────────────────────────────────────────
function EmptyWishlist({ filtered, onReset }) {
  if (filtered) {
    return (
      <div className="wl-empty">
        <div className="wl-empty-icon">
          <ArrowUpDown size={32} strokeWidth={1} color="var(--gold)" />
        </div>
        <h3 className="wl-empty-title">Không có sản phẩm nào</h3>
        <p className="wl-empty-sub">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm để xem thêm sản phẩm.</p>
        <button className="wl-empty-btn wl-empty-btn--ghost" onClick={onReset}>
          Xoá bộ lọc
        </button>
      </div>
    )
  }
  return (
    <div className="wl-empty">
      <div className="wl-empty-icon">
        <Heart size={48} strokeWidth={1} color="var(--gold)" />
      </div>
      <h3 className="wl-empty-title">Danh sách yêu thích trống</h3>
      <p className="wl-empty-sub">
        Bấm icon tim trên các sản phẩm để lưu lại những cuốn bạn quan tâm.
      </p>
      <Link to="/shop" className="wl-empty-btn">
        Khám phá cửa hàng
        <ArrowRight size={14} strokeWidth={1.6} />
      </Link>
    </div>
  )
}

// ─ Confirm dialog ─────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, loading }) {
  if (!open) return null
  return (
    <div className="wl-modal-overlay" onClick={onCancel}>
      <div className="wl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wl-modal-icon">
          <AlertTriangle size={22} strokeWidth={1.4} color="var(--gold)" />
        </div>
        <h3 className="wl-modal-title">{title}</h3>
        <p className="wl-modal-msg">{message}</p>
        <div className="wl-modal-actions">
          <button className="wl-modal-btn-cancel" onClick={onCancel} disabled={loading}>Huỷ</button>
          <button className="wl-modal-btn-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 size={14} className="wl-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─ Page ───────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'default',       label: 'Mặc định' },
  { value: 'price-asc',     label: 'Giá: Thấp → Cao' },
  { value: 'price-desc',    label: 'Giá: Cao → Thấp' },
  { value: 'name-asc',      label: 'Tên: A → Z' },
  { value: 'name-desc',     label: 'Tên: Z → A' },
  { value: 'discount-desc', label: 'Giảm giá nhiều nhất' },
  { value: 'stock-first',   label: 'Còn hàng trước' },
]

const FILTER_OPTIONS = [
  { value: 'all',      label: 'Tất cả' },
  { value: 'in-stock', label: 'Còn hàng' },
  { value: 'on-sale',  label: 'Đang giảm giá' },
  { value: 'out',      label: 'Hết hàng' },
]

export default function Wishlist() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { items, wishlistCount, loading, fetchWishlist, toggleWishlist } = useWishlistStore()
  const { addToCart } = useCartStore()

  const [removingIds, setRemovingIds] = useState(new Set())
  const [movingIds,   setMovingIds]   = useState(new Set())
  const [sort,        setSort]        = useState('default')
  const [filter,      setFilter]      = useState('all')
  const [copied,      setCopied]      = useState(false)
  const [search,      setSearch]      = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const [selectMode,  setSelectMode]  = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkRemoving, setBulkRemoving] = useState(false)
  const [bulkMoving,   setBulkMoving]   = useState(false)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [clearingAll, setClearingAll] = useState(false)

  const searchInputRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return }
    fetchWishlist()
  }, [isAuthenticated])

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  // Reset pagination whenever the visible set changes shape
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter, sort, search])

  //  Derived list ────────────────────────────────────────────────────────
  const displayedItems = useMemo(() => {
    let list = [...items]

    // Search
    const q = search.trim().toLocaleLowerCase('vi')
    if (q) list = list.filter((b) => (b.title || '').toLocaleLowerCase('vi').includes(q))

    // Filter
    if (filter === 'in-stock') list = list.filter((b) => b.stock > 0)
    if (filter === 'out')      list = list.filter((b) => b.stock === 0)
    if (filter === 'on-sale')  list = list.filter((b) => b.salePrice && b.salePrice < b.price)

    // Sort
    if (sort === 'price-asc')
      list.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price))
    else if (sort === 'price-desc')
      list.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price))
    else if (sort === 'name-asc')
      list.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi'))
    else if (sort === 'name-desc')
      list.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'vi'))
    else if (sort === 'discount-desc')
      list.sort((a, b) => {
        const da = a.salePrice && a.price ? 1 - a.salePrice / a.price : 0
        const db = b.salePrice && b.price ? 1 - b.salePrice / b.price : 0
        return db - da
      })
    else if (sort === 'stock-first')
      list.sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0))

    return list
  }, [items, sort, filter, search])

  const pagedItems = useMemo(
    () => displayedItems.slice(0, visibleCount),
    [displayedItems, visibleCount]
  )

  //  Handlers ────────────────────────────────────────────────────────────

  // Xoá 1 item — optimistic từ store, kèm tuỳ chọn hoàn tác
  const handleRemove = async (book) => {
    setRemovingIds((prev) => new Set(prev).add(book.hashId))
    try {
      await toggleWishlist(book.slug, book.hashId)
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(book.hashId); return s })
      const shortTitle = book.title?.length > 34 ? book.title.slice(0, 34) + '…' : book.title
      toast((t) => (
        <span className="wl-undo-toast">
          <span>Đã xoá "{shortTitle}"</span>
          <button
            className="wl-undo-btn"
            onClick={() => { toast.dismiss(t.id); handleUndoRemove(book) }}
          >
            <Undo2 size={12} strokeWidth={2} /> Hoàn tác
          </button>
        </span>
      ), { duration: 4500 })
    } catch {
      toast.error('Có lỗi, vui lòng thử lại')
    } finally {
      setRemovingIds((prev) => { const s = new Set(prev); s.delete(book.hashId); return s })
    }
  }

  const handleUndoRemove = async (book) => {
    try {
      await toggleWishlist(book.slug, book.hashId)
      toast.success('Đã khôi phục sản phẩm')
    } catch {
      toast.error('Không thể khôi phục, vui lòng thử lại')
    }
  }

  // Thêm 1 item vào cart → xoá khỏi wishlist → toast
  const handleMoveToCart = async (book) => {
    if (movingIds.has(book.hashId)) return
    setMovingIds((prev) => new Set(prev).add(book.hashId))
    try {
      await addToCart(book.hashId, 1, getPreferredCartFormat(book))
      await toggleWishlist(book.slug, book.hashId)   // xoá khỏi wishlist
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(book.hashId); return s })
      toast.success(`Đã thêm "${book.title}" vào giỏ hàng`)
    } catch {
      toast.error('Không thể thêm vào giỏ, vui lòng thử lại')
    } finally {
      setMovingIds((prev) => { const s = new Set(prev); s.delete(book.hashId); return s })
    }
  }

  // Thêm tất cả còn hàng vào cart → xoá từng cái → toast
  const handleMoveAll = async () => {
    const inStockItems = items.filter((b) => b.stock > 0)
    if (inStockItems.length === 0) { toast.error('Không có sản phẩm nào còn hàng'); return }

    const ids = new Set(inStockItems.map((b) => b.hashId))
    setMovingIds(ids)
    try {
      await Promise.all(inStockItems.map((b) => addToCart(b.hashId, 1, getPreferredCartFormat(b))))
      await Promise.all(inStockItems.map((b) => toggleWishlist(b.slug, b.hashId)))
      toast.success(`Đã chuyển ${inStockItems.length} sản phẩm vào giỏ hàng`)
      setSelectedIds(new Set())
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setMovingIds(new Set())
    }
  }

  // Copy link wishlist
  const handleShare = async () => {
    const url = `${window.location.origin}/wishlist`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Đã sao chép link yêu thích!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Không thể sao chép, vui lòng thử lại')
    }
  }

  //  Selection handlers ────────────────────────────────────────────────
  const handleToggleSelectMode = () => {
    setSelectMode((prev) => !prev)
    setSelectedIds(new Set())
  }

  const handleToggleSelectItem = (hashId) => {
    setSelectedIds((prev) => {
      const s = new Set(prev)
      s.has(hashId) ? s.delete(hashId) : s.add(hashId)
      return s
    })
  }

  const isAllPagedSelected = pagedItems.length > 0 && pagedItems.every((b) => selectedIds.has(b.hashId))

  const handleToggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const s = new Set(prev)
      if (isAllPagedSelected) {
        pagedItems.forEach((b) => s.delete(b.hashId))
      } else {
        pagedItems.forEach((b) => s.add(b.hashId))
      }
      return s
    })
  }

  const handleBulkRemove = async () => {
    const targets = items.filter((b) => selectedIds.has(b.hashId))
    if (targets.length === 0) return
    setBulkRemoving(true)
    try {
      await Promise.all(targets.map((b) => toggleWishlist(b.slug, b.hashId)))
      toast.success(`Đã xoá ${targets.length} sản phẩm khỏi yêu thích`)
      setSelectedIds(new Set())
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setBulkRemoving(false)
    }
  }

  const handleBulkMoveToCart = async () => {
    const targets = items.filter((b) => selectedIds.has(b.hashId) && b.stock > 0)
    if (targets.length === 0) { toast.error('Không có sản phẩm còn hàng trong lựa chọn'); return }
    setBulkMoving(true)
    try {
      await Promise.all(targets.map((b) => addToCart(b.hashId, 1, getPreferredCartFormat(b))))
      await Promise.all(targets.map((b) => toggleWishlist(b.slug, b.hashId)))
      toast.success(`Đã thêm ${targets.length} sản phẩm vào giỏ hàng`)
      setSelectedIds(new Set())
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setBulkMoving(false)
    }
  }

  const handleClearAll = async () => {
    setClearingAll(true)
    const ids = new Set(items.map((b) => b.hashId))
    setRemovingIds(ids)
    try {
      await Promise.all(items.map((b) => toggleWishlist(b.slug, b.hashId)))
      toast.success('Đã xoá toàn bộ danh sách yêu thích')
      setSelectedIds(new Set())
      setSelectMode(false)
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setRemovingIds(new Set())
      setClearingAll(false)
      setConfirmClearAll(false)
    }
  }

  const handleResetFilters = () => {
    setSearch('')
    setFilter('all')
    setSort('default')
  }

  const inStockCount = items.filter((b) => b.stock > 0).length
  const totalValue   = items.reduce((sum, b) => sum + (b.salePrice || b.price || 0), 0)
  const totalSavings = items.reduce((sum, b) => (
    b.salePrice && b.price > b.salePrice ? sum + (b.price - b.salePrice) : sum
  ), 0)
  const isFiltered   = filter !== 'all' || sort !== 'default' || search.trim() !== ''
  const selectedCount = selectedIds.size

  return (
    <>
      <style>{`
        /* ─ PAGE ─ */
        .wl-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 120px 100px 100px;
          min-height: 80vh;
        }

        /* ─ HEADER ─ */
        .wl-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 32px;
          margin-bottom: 60px;
          flex-wrap: wrap;
        }
        .wl-eyebrow {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }
        .wl-eyebrow-line { width: 36px; height: 0.5px; background: var(--gold); }
        .wl-eyebrow-text {
          font-size: 10px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--gold);
          font-family: 'Be Vietnam Pro', sans-serif;
        }
        .wl-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 300;
          color: var(--forest);
          line-height: 1.1;
          margin: 0;
        }
        .wl-title em { font-style: italic; color: var(--gold); }
        .wl-count-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-left: 14px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 300;
          vertical-align: middle;
        }
        .wl-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* ─ TOOLBAR ─ */
        .wl-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .wl-search {
          position: relative;
          display: flex;
          align-items: center;
        }
        .wl-search-icon {
          position: absolute;
          left: 13px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .wl-search-input {
          width: 220px;
          padding: 9px 32px 9px 34px;
          font-size: 12px;
          font-family: 'Be Vietnam Pro', sans-serif;
          background: var(--white);
          border: 0.5px solid var(--border);
          color: var(--forest);
          outline: none;
          transition: border-color 0.2s, width 0.25s ease;
        }
        .wl-search-input::placeholder { color: var(--text-muted); font-weight: 300; }
        .wl-search-input:focus { border-color: var(--gold); width: 260px; }
        .wl-search-clear {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          padding: 4px;
        }
        .wl-search-clear:hover { color: var(--gold); }
        .wl-filter-group {
          display: flex;
          border: 0.5px solid var(--border);
          overflow: hidden;
        }
        .wl-filter-btn {
          padding: 9px 16px;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: 'Be Vietnam Pro', sans-serif;
          background: transparent;
          border: none;
          border-right: 0.5px solid var(--border);
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s;
          white-space: nowrap;
        }
        .wl-filter-btn:last-child { border-right: none; }
        .wl-filter-btn.active {
          background: var(--forest);
          color: var(--ivory);
        }
        .wl-sort-select {
          padding: 9px 14px;
          font-size: 11px;
          letter-spacing: 0.1em;
          font-family: 'Be Vietnam Pro', sans-serif;
          background: var(--white);
          border: 0.5px solid var(--border);
          color: var(--forest);
          cursor: pointer;
          outline: none;
          appearance: none;
          padding-right: 32px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }
        .wl-select-toggle {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 16px;
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          font-family: 'Be Vietnam Pro', sans-serif;
          background: transparent;
          border: 0.5px solid var(--border);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .wl-select-toggle:hover { border-color: var(--gold); color: var(--gold); }
        .wl-select-toggle.active { background: var(--forest); color: var(--ivory); border-color: var(--forest); }
        .wl-toolbar-spacer { flex: 1; }
        .wl-result-count {
          font-size: 11px;
          color: var(--text-muted);
          font-family: 'Be Vietnam Pro', sans-serif;
          white-space: nowrap;
        }

        /* ─ ACTION BUTTONS ─ */
        .wl-btn-move-all {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          background: var(--forest); color: var(--ivory);
          border: none; padding: 13px 28px; cursor: pointer;
          transition: all 0.3s ease; white-space: nowrap;
        }
        .wl-btn-move-all:hover:not(:disabled) { background: var(--forest-mid); gap: 14px; }
        .wl-btn-move-all:disabled { opacity: 0.5; cursor: not-allowed; }

        .wl-btn-share {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          background: transparent; color: var(--forest);
          border: 0.5px solid var(--border);
          padding: 13px 20px; cursor: pointer;
          transition: all 0.3s ease; white-space: nowrap;
        }
        .wl-btn-share:hover { border-color: var(--gold); color: var(--gold); }
        .wl-btn-share.copied { border-color: var(--gold); color: var(--gold); }

        .wl-btn-clear {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          background: transparent; color: #a85d5d;
          border: 0.5px solid var(--border);
          padding: 13px 20px; cursor: pointer;
          transition: all 0.3s ease; white-space: nowrap;
        }
        .wl-btn-clear:hover { border-color: #c05050; color: #c05050; background: rgba(192,80,80,0.05); }

        .wl-btn-shop {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          background: transparent; color: var(--forest);
          border: 0.5px solid var(--border);
          padding: 13px 24px; cursor: pointer;
          transition: all 0.3s ease; text-decoration: none; white-space: nowrap;
        }
        .wl-btn-shop:hover { border-color: var(--gold); color: var(--gold); }

        /* ─ DIVIDER ─ */
        .wl-divider {
          height: 0.5px; background: var(--border);
          margin-bottom: 48px; position: relative; overflow: hidden;
        }
        .wl-divider::after {
          content: ''; position: absolute; left: 0; top: 0;
          height: 100%; width: 0;
          background: linear-gradient(90deg, var(--gold), rgba(74,158,63,0.3));
          animation: wlDividerFill 0.8s ease forwards 0.2s;
        }
        @keyframes wlDividerFill { to { width: 100%; } }

        /* ─ SUMMARY BAR ─ */
        .wl-summary-bar {
          display: flex; align-items: center; gap: 32px;
          padding: 20px 28px;
          background: var(--cream);
          border: 0.5px solid var(--border);
          margin-bottom: 40px; flex-wrap: wrap;
        }
        .wl-summary-stat { display: flex; flex-direction: column; gap: 2px; }
        .wl-summary-label {
          font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--text-muted); font-family: 'Be Vietnam Pro', sans-serif;
        }
        .wl-summary-val {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 400; color: var(--forest); line-height: 1;
        }
        .wl-summary-val--gold { color: var(--gold); }
        .wl-summary-sep { width: 0.5px; height: 36px; background: var(--border); flex-shrink: 0; }

        /* ─ BULK ACTION BAR ─ */
        .wl-bulk-bar {
          display: flex; align-items: center; gap: 20px;
          padding: 16px 24px;
          background: var(--forest);
          color: var(--ivory);
          margin-bottom: 28px; flex-wrap: wrap;
          animation: wlSlideDown 0.25s ease;
        }
        @keyframes wlSlideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .wl-bulk-select-all {
          display: flex; align-items: center; gap: 8px;
          background: none; border: none; cursor: pointer;
          color: var(--ivory); font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
        }
        .wl-bulk-count {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 12px; color: var(--ivory); opacity: 0.85;
        }
        .wl-bulk-spacer { flex: 1; }
        .wl-bulk-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .wl-bulk-btn {
          display: flex; align-items: center; gap: 7px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
          background: var(--ivory); color: var(--forest);
          border: none; padding: 9px 16px; cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
        }
        .wl-bulk-btn:hover:not(:disabled) { background: var(--gold); color: var(--ivory); }
        .wl-bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .wl-bulk-btn--danger {
          background: transparent; color: var(--ivory);
          border: 0.5px solid rgba(255,255,255,0.35);
        }
        .wl-bulk-btn--danger:hover:not(:disabled) { background: #c05050; border-color: #c05050; color: var(--ivory); }
        .wl-bulk-cancel {
          background: none; border: none; color: var(--ivory); opacity: 0.7;
          cursor: pointer; display: flex; align-items: center; padding: 6px;
        }
        .wl-bulk-cancel:hover { opacity: 1; }

        /* ─ GRID ─ */
        .wl-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        @media (max-width: 1200px) { .wl-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px)  { .wl-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px)  { .wl-grid { grid-template-columns: 1fr; } }

        /* ─ CARD ─ */
        .wl-card {
          background: var(--white);
          border: 0.5px solid var(--border);
          display: flex; flex-direction: column;
          overflow: hidden;
          transition: all 0.45s cubic-bezier(0.16,1,0.3,1);
          position: relative;
        }
        .wl-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 32px 64px rgba(13,43,30,0.1);
          border-color: var(--border-gold);
        }
        .wl-card--removing {
          opacity: 0;
          transform: scale(0.94) translateY(-8px);
          pointer-events: none;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .wl-card--selected {
          border-color: var(--gold);
          box-shadow: 0 0 0 1px var(--gold);
        }

        /* Image */
        .wl-card-img-wrap {
          position: relative; height: 240px; overflow: hidden;
          cursor: pointer; background: var(--cream); flex-shrink: 0;
        }
        .wl-card-img {
          width: 100%; height: 100%; object-fit: cover;
          filter: saturate(0.85);
          transition: transform 0.7s ease, filter 0.5s ease;
        }
        .wl-card:hover .wl-card-img { transform: scale(1.04); filter: saturate(1); }
        .wl-card-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }

        /* Select checkbox */
        .wl-select-check {
          position: absolute; top: 14px; right: 14px; z-index: 2;
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(250,248,244,0.92);
          border: 0.5px solid var(--border);
          color: var(--forest);
          cursor: pointer;
          transition: all 0.2s;
        }
        .wl-select-check:hover { border-color: var(--gold); }
        .wl-select-check.checked { background: var(--gold); border-color: var(--gold); color: var(--ivory); }

        /* Badges */
        .wl-badge {
          position: absolute; top: 14px; left: 14px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
          padding: 5px 10px;
        }
        .wl-badge--discount { background: var(--gold); color: var(--ivory); }
        .wl-badge--out { background: #c05050; color: var(--ivory); }
        .wl-badge--low { background: var(--forest); color: var(--ivory); }

        /* Body */
        .wl-card-body { padding: 22px 22px 20px; display: flex; flex-direction: column; flex: 1; }
        .wl-card-cat {
          font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gold); font-family: 'Be Vietnam Pro', sans-serif;
          margin-bottom: 8px; display: block;
        }
        .wl-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 400; color: var(--forest);
          line-height: 1.25; margin: 0 0 8px; cursor: pointer;
          transition: color 0.3s;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .wl-card-title:hover { color: var(--forest-mid); }
        .wl-card-desc {
          font-size: 12px; line-height: 1.7; color: var(--text-muted);
          font-weight: 300; margin: 0 0 12px; flex: 1;
        }
        .wl-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .wl-tag {
          font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 3px 9px; border: 0.5px solid var(--border-gold);
          color: var(--gold); font-family: 'Be Vietnam Pro', sans-serif;
        }

        /* Price */
        .wl-card-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; }
        .wl-card-price {
          font-family: 'Montserrat', sans-serif;
          font-size: 20px; font-weight: 700; color: var(--forest);
          letter-spacing: -0.01em; line-height: 1;
        }
        .wl-card-price-old { font-size: 12px; color: var(--text-muted); text-decoration: line-through; font-weight: 300; }

        /* Card actions */
        .wl-card-actions { display: flex; gap: 8px; margin-top: auto; }
        .wl-btn-cart {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
          background: var(--forest); color: var(--ivory);
          border: none; padding: 11px 16px; cursor: pointer;
          transition: all 0.3s ease; height: 44px;
        }
        .wl-btn-cart:hover:not(:disabled) { background: var(--forest-mid); }
        .wl-btn-cart:disabled { background: var(--pale); color: var(--text-muted); cursor: not-allowed; }
        .wl-btn-remove {
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: 0.5px solid var(--border);
          cursor: pointer; color: var(--text-muted);
          transition: all 0.3s ease; flex-shrink: 0;
        }
        .wl-btn-remove:hover:not(:disabled) {
          border-color: #c05050; color: #c05050; background: rgba(192,80,80,0.05);
        }
        .wl-btn-remove:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Spinner */
        .wl-spin { animation: wlSpin 0.7s linear infinite; }
        @keyframes wlSpin { to { transform: rotate(360deg); } }

        /* ─ LOAD MORE ─ */
        .wl-load-more-wrap { display: flex; justify-content: center; margin-top: 44px; }
        .wl-load-more-btn {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
          background: transparent; color: var(--forest);
          border: 0.5px solid var(--border);
          padding: 14px 36px; cursor: pointer;
          transition: all 0.3s ease;
        }
        .wl-load-more-btn:hover { border-color: var(--gold); color: var(--gold); }

        /* ─ EMPTY ─ */
        .wl-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center;
          padding: 100px 24px; gap: 16px;
        }
        .wl-empty-icon {
          width: 96px; height: 96px; border: 0.5px solid var(--border);
          display: flex; align-items: center; justify-content: center; margin-bottom: 8px;
        }
        .wl-empty-title {
          font-family: 'Playfair Display', serif; font-size: 28px;
          font-weight: 300; color: var(--forest); margin: 0;
        }
        .wl-empty-sub {
          font-size: 14px; line-height: 1.8; color: var(--text-muted);
          font-weight: 300; max-width: 360px; margin: 0;
        }
        .wl-empty-btn {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
          background: var(--forest); color: var(--ivory);
          border: none; padding: 14px 32px; cursor: pointer;
          text-decoration: none; margin-top: 8px; transition: all 0.3s ease;
        }
        .wl-empty-btn:hover { background: var(--forest-mid); gap: 16px; }
        .wl-empty-btn--ghost {
          background: transparent; color: var(--forest);
          border: 0.5px solid var(--border);
        }
        .wl-empty-btn--ghost:hover { background: transparent; border-color: var(--gold); color: var(--gold); gap: 10px; }

        /* ─ MODAL ─ */
        .wl-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(13,43,30,0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: wlFadeIn 0.2s ease;
        }
        @keyframes wlFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .wl-modal {
          background: var(--white);
          border: 0.5px solid var(--border-gold);
          padding: 40px 36px 32px;
          max-width: 400px; width: 100%;
          text-align: center;
          animation: wlModalIn 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes wlModalIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .wl-modal-icon {
          width: 56px; height: 56px; margin: 0 auto 18px;
          border: 0.5px solid var(--border-gold);
          display: flex; align-items: center; justify-content: center;
        }
        .wl-modal-title {
          font-family: 'Playfair Display', serif; font-size: 22px;
          font-weight: 400; color: var(--forest); margin: 0 0 10px;
        }
        .wl-modal-msg {
          font-size: 13px; line-height: 1.7; color: var(--text-muted);
          font-weight: 300; margin: 0 0 28px;
        }
        .wl-modal-actions { display: flex; gap: 10px; }
        .wl-modal-btn-cancel {
          flex: 1; font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          background: transparent; color: var(--forest);
          border: 0.5px solid var(--border);
          padding: 13px; cursor: pointer; transition: all 0.2s;
        }
        .wl-modal-btn-cancel:hover:not(:disabled) { border-color: var(--forest); }
        .wl-modal-btn-confirm {
          flex: 1; display: flex; align-items: center; justify-content: center;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          background: #c05050; color: var(--ivory);
          border: none; padding: 13px; cursor: pointer; transition: all 0.2s;
        }
        .wl-modal-btn-confirm:hover:not(:disabled) { background: #a84343; }
        .wl-modal-btn-cancel:disabled, .wl-modal-btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ─ UNDO TOAST ─ */
        .wl-undo-toast { display: flex; align-items: center; gap: 14px; font-family: 'Be Vietnam Pro', sans-serif; font-size: 13px; }
        .wl-undo-btn {
          display: flex; align-items: center; gap: 5px;
          background: none; border: none; cursor: pointer;
          color: var(--gold); font-weight: 600; font-size: 12px;
          letter-spacing: 0.04em; text-transform: uppercase;
          white-space: nowrap;
        }
        .wl-undo-btn:hover { text-decoration: underline; }

        /* ─ DARK MODE ─ */
        body.dark-mode .wl-title { color: #c8d4cc; }
        body.dark-mode .wl-empty-title { color: #c8d4cc; }
        body.dark-mode .wl-summary-bar { background: #141a16; border-color: rgba(255,255,255,0.06); }
        body.dark-mode .wl-summary-val { color: #c8d4cc; }
        body.dark-mode .wl-card { background: #1c2822; border-color: rgba(255,255,255,0.07); }
        body.dark-mode .wl-card:hover { border-color: rgba(74,158,63,0.3); }
        body.dark-mode .wl-card--selected { border-color: var(--gold); }
        body.dark-mode .wl-card-title { color: #c8d4cc; }
        body.dark-mode .wl-card-price { color: #c8d4cc; }
        body.dark-mode .wl-card-img-placeholder { background: #141a16; }
        body.dark-mode .wl-btn-remove { border-color: rgba(255,255,255,0.1); }
        body.dark-mode .wl-btn-remove:hover:not(:disabled) { border-color: #c05050; color: #c05050; }
        body.dark-mode .wl-filter-btn { color: #8a9e94; border-color: rgba(255,255,255,0.08); }
        body.dark-mode .wl-filter-btn.active { background: #2a4035; color: #c8d4cc; }
        body.dark-mode .wl-sort-select { background-color: #1c2822; color: #c8d4cc; border-color: rgba(255,255,255,0.08); }
        body.dark-mode .wl-search-input { background-color: #1c2822; color: #c8d4cc; border-color: rgba(255,255,255,0.08); }
        body.dark-mode .wl-select-toggle { color: #8a9e94; border-color: rgba(255,255,255,0.08); }
        body.dark-mode .wl-select-toggle.active { background: #2a4035; color: #c8d4cc; border-color: #2a4035; }
        body.dark-mode .wl-btn-share { color: #8a9e94; border-color: rgba(255,255,255,0.08); }
        body.dark-mode .wl-btn-share:hover,
        body.dark-mode .wl-btn-share.copied { color: var(--gold); border-color: var(--gold); }
        body.dark-mode .wl-btn-clear { border-color: rgba(255,255,255,0.08); }
        body.dark-mode .wl-btn-shop { color: #8a9e94; border-color: rgba(255,255,255,0.08); }
        body.dark-mode .wl-btn-shop:hover { color: var(--gold); border-color: var(--gold); }
        body.dark-mode .wl-load-more-btn { color: #8a9e94; border-color: rgba(255,255,255,0.08); }
        body.dark-mode .wl-load-more-btn:hover { color: var(--gold); border-color: var(--gold); }
        body.dark-mode .wl-empty-icon { border-color: rgba(255,255,255,0.08); }
        body.dark-mode .wl-empty-btn--ghost { color: #c8d4cc; border-color: rgba(255,255,255,0.08); }
        body.dark-mode .wl-card-body { background: #1c2822; }
        body.dark-mode .wl-filter-group { border-color: rgba(255,255,255,0.08); }
        body.dark-mode .wl-modal { background: #1c2822; border-color: rgba(255,255,255,0.1); }
        body.dark-mode .wl-modal-title { color: #c8d4cc; }
        body.dark-mode .wl-modal-icon { border-color: rgba(255,255,255,0.1); }
        body.dark-mode .wl-modal-btn-cancel { color: #c8d4cc; border-color: rgba(255,255,255,0.1); }
        body.dark-mode .wl-select-check { background: rgba(28,40,34,0.9); border-color: rgba(255,255,255,0.15); color: #c8d4cc; }

        /* ─ RESPONSIVE ─ */
        @media (max-width: 1100px) { .wl-page { padding: 120px 40px 80px; } }
        @media (max-width: 700px) {
          .wl-page { padding: 100px 20px 60px; }
          .wl-header { flex-direction: column; align-items: flex-start; }
          .wl-summary-bar { gap: 20px; }
          .wl-toolbar { gap: 8px; }
          .wl-search-input, .wl-search-input:focus { width: 100%; }
          .wl-search { width: 100%; }
          .wl-bulk-bar { gap: 12px; }
          .wl-bulk-actions { width: 100%; }
        }
      `}</style>

      <div className="wl-page">
        {/*  HEADER  */}
        <header className="wl-header reveal">
          <div>
            <div className="wl-eyebrow">
              <div className="wl-eyebrow-line" />
              <span className="wl-eyebrow-text">Của tôi</span>
            </div>
            <h1 className="wl-title">
              Sách <em>Yêu Thích</em>
              {!loading && wishlistCount > 0 && (
                <span className="wl-count-badge">— {wishlistCount} cuốn</span>
              )}
            </h1>
          </div>

          {!loading && items.length > 0 && (
            <div className="wl-header-right">
              <button
                className={`wl-btn-share${copied ? ' copied' : ''}`}
                onClick={handleShare}
                title="Sao chép link wishlist"
              >
                {copied
                  ? <><Check size={14} strokeWidth={1.6} /> Đã sao chép</>
                  : <><Share2 size={14} strokeWidth={1.6} /> Chia sẻ</>
                }
              </button>
              <button
                className="wl-btn-clear"
                onClick={() => setConfirmClearAll(true)}
                title="Xoá toàn bộ danh sách yêu thích"
              >
                <Trash2 size={14} strokeWidth={1.6} />
                Xoá tất cả
              </button>
              <button
                className="wl-btn-move-all"
                onClick={handleMoveAll}
                disabled={movingIds.size > 0 || inStockCount === 0}
              >
                <ShoppingCart size={14} strokeWidth={1.6} />
                Thêm tất cả vào giỏ
                <ArrowRight size={12} strokeWidth={1.6} />
              </button>
              <Link to="/shop" className="wl-btn-shop">Tiếp tục mua sắm</Link>
            </div>
          )}
        </header>

        <div className="wl-divider" />

        {/*  SUMMARY BAR  */}
        {loading && (
          <div className="wl-summary-bar reveal">
            {[1, 2, 3].map((i) => (
              <div className="wl-summary-stat" key={i}>
                <div className="skeleton" style={{ width: '70px', height: '9px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '50px', height: '22px' }} />
              </div>
            ))}
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="wl-summary-bar reveal">
            <div className="wl-summary-stat">
              <span className="wl-summary-label">Tổng sản phẩm</span>
              <span className="wl-summary-val">{wishlistCount}</span>
            </div>
            <div className="wl-summary-sep" />
            <div className="wl-summary-stat">
              <span className="wl-summary-label">Còn hàng</span>
              <span className="wl-summary-val">{inStockCount}</span>
            </div>
            <div className="wl-summary-sep" />
            <div className="wl-summary-stat">
              <span className="wl-summary-label">Tổng giá trị</span>
              <span className="wl-summary-val">{formatPrice(totalValue)}</span>
            </div>
            {totalSavings > 0 && (
              <>
                <div className="wl-summary-sep" />
                <div className="wl-summary-stat">
                  <span className="wl-summary-label">Tiết kiệm được</span>
                  <span className="wl-summary-val wl-summary-val--gold">{formatPrice(totalSavings)}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/*  TOOLBAR (search + sort + filter + select)  */}
        {!loading && items.length > 0 && (
          <div className="wl-toolbar">
            {/* Search */}
            <div className="wl-search">
              <Search size={14} strokeWidth={1.8} className="wl-search-icon" />
              <input
                ref={searchInputRef}
                className="wl-search-input"
                type="text"
                placeholder="Tìm trong danh sách…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Tìm kiếm trong danh sách yêu thích"
              />
              {search && (
                <button className="wl-search-clear" onClick={() => setSearch('')} aria-label="Xoá tìm kiếm">
                  <X size={13} strokeWidth={1.8} />
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="wl-filter-group">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`wl-filter-btn${filter === opt.value ? ' active' : ''}`}
                  onClick={() => setFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              className="wl-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sắp xếp"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Select mode toggle */}
            <button
              className={`wl-select-toggle${selectMode ? ' active' : ''}`}
              onClick={handleToggleSelectMode}
            >
              <ListChecks size={14} strokeWidth={1.6} />
              {selectMode ? 'Xong' : 'Chọn nhiều'}
            </button>

            <div className="wl-toolbar-spacer" />

            {isFiltered && (
              <span className="wl-result-count">
                Hiển thị {displayedItems.length} / {items.length} sản phẩm
              </span>
            )}
          </div>
        )}

        {/*  BULK ACTION BAR  */}
        {selectMode && selectedCount > 0 && (
          <div className="wl-bulk-bar">
            <button className="wl-bulk-select-all" onClick={handleToggleSelectAllVisible}>
              {isAllPagedSelected ? <CheckSquare size={16} strokeWidth={1.8} /> : <Square size={16} strokeWidth={1.8} />}
              Chọn tất cả trên trang
            </button>
            <span className="wl-bulk-count">Đã chọn {selectedCount} sản phẩm</span>
            <div className="wl-bulk-spacer" />
            <div className="wl-bulk-actions">
              <button className="wl-bulk-btn" onClick={handleBulkMoveToCart} disabled={bulkMoving || bulkRemoving}>
                {bulkMoving ? <Loader2 size={13} className="wl-spin" /> : <ShoppingCart size={13} strokeWidth={1.8} />}
                Thêm vào giỏ
              </button>
              <button className="wl-bulk-btn wl-bulk-btn--danger" onClick={handleBulkRemove} disabled={bulkMoving || bulkRemoving}>
                {bulkRemoving ? <Loader2 size={13} className="wl-spin" /> : <Trash2 size={13} strokeWidth={1.8} />}
                Xoá
              </button>
              <button className="wl-bulk-cancel" onClick={() => setSelectedIds(new Set())} aria-label="Bỏ chọn tất cả">
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        )}

        {/*  CONTENT  */}
        {loading ? (
          <div className="wl-grid">
            {Array.from({ length: wishlistCount || 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyWishlist filtered={false} />
        ) : displayedItems.length === 0 ? (
          <EmptyWishlist filtered={true} onReset={handleResetFilters} />
        ) : (
          <>
            <div className="wl-grid">
              {pagedItems.map((book) => (
                <WishlistCard
                  key={book.hashId || book.id}
                  book={book}
                  onRemove={handleRemove}
                  onMoveToCart={handleMoveToCart}
                  isRemoving={removingIds.has(book.hashId)}
                  isMoving={movingIds.has(book.hashId)}
                  selectMode={selectMode}
                  selected={selectedIds.has(book.hashId)}
                  onToggleSelect={handleToggleSelectItem}
                />
              ))}
            </div>

            {displayedItems.length > pagedItems.length && (
              <div className="wl-load-more-wrap">
                <button
                  className="wl-load-more-btn"
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                >
                  Xem thêm {Math.min(PAGE_SIZE, displayedItems.length - pagedItems.length)} sản phẩm
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmClearAll}
        title="Xoá toàn bộ danh sách?"
        message={`Bạn sắp xoá ${items.length} sản phẩm khỏi danh sách yêu thích. Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá tất cả"
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClearAll(false)}
        loading={clearingAll}
      />
    </>
  )
}