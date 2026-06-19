import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookService } from '../services/bookService'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { formatPrice, formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

// ── Fallback images khi chưa có ảnh từ API ──
const FALLBACK_IMGS = [
  'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=900&q=80',
  'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=900&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
]

const RELATED_FALLBACK = [
  { img: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=500&q=80', badge: 'Mới', badgeGold: false, name: 'Đại Dương Huyền Bí', short: '80 loài sinh vật biển sâu trong môi trường AR sống động', price: 350000, rating: 47 },
  { img: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=500&q=80', badge: 'Đặc biệt', badgeGold: true, name: 'Hành Trình Vũ Trụ', short: 'Du hành qua 8 hành tinh với mô hình không gian 3D', price: 420000, rating: 62 },
  { img: 'https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?w=500&q=80', badge: 'Giới hạn', badgeGold: true, name: 'Khủng Long Trỗi Dậy', short: 'Hồi sinh 30 loài khủng long theo tỉ lệ thực', price: 460000, rating: 114 },
  { img: 'https://images.unsplash.com/photo-1537721664796-76f77222a5d0?w=500&q=80', badge: 'Hot', badgeGold: false, name: 'Cơ Thể Con Người', short: 'Bóc tách cơ thể người qua mô hình AR độ nét cao', price: 390000, rating: 88 },
]

const FAQS = [
  { q: 'Ứng dụng AR có miễn phí không?', a: 'Có, ứng dụng Earthoria AR hoàn toàn miễn phí trên App Store và Google Play. Bạn chỉ cần mua sách và tải app về là có thể sử dụng ngay.' },
  { q: 'Cần kết nối internet để dùng AR không?', a: 'Sau khi tải nội dung lần đầu (khoảng 2.4GB), toàn bộ trải nghiệm AR hoạt động 100% offline. Chỉ tính năng AI Tutor cần kết nối internet.' },
  { q: 'Thiết bị nào tương thích?', a: 'iPhone/iPad chạy iOS 14.0 trở lên và Android 10.0 trở lên với tối thiểu 3GB RAM. Thiết bị hỗ trợ ARKit hoặc ARCore sẽ cho trải nghiệm tốt nhất.' },
  { q: '"Cập nhật nội dung miễn phí 24 tháng" có nghĩa là gì?', a: 'Trong 24 tháng từ ngày mua, bạn sẽ nhận được tất cả các bản cập nhật nội dung mới — loài mới, câu chuyện mới và thử thách khám phá mới — hoàn toàn miễn phí.' },
  { q: 'Chính sách đổi trả như thế nào?', a: 'Sản phẩm còn nguyên vẹn có thể đổi trả trong 30 ngày kể từ ngày nhận hàng. Với sản phẩm lỗi kỹ thuật, chúng tôi hỗ trợ đổi mới trong toàn bộ thời gian bảo hành 12 tháng.' },
]

// ── SVG Icons ──
const IconCart = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconHeart = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const IconPlay = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)
const IconShare = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
)
const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconChevronUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M18 15l-6-6-6 6"/>
  </svg>
)
const IconStar = () => <span className="star">★</span>

// ── Stars component ──
function Stars({ rating = 5, max = 5 }) {
  return (
    <div className="stars">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < Math.round(rating) ? 'star' : 'star empty'}>★</span>
      ))}
    </div>
  )
}

export default function BookDetail() {
  const { slug, hashId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const heroRef = useRef(null)

  // ── State ──
  const [activeThumb, setActiveThumb] = useState(0)
  const [imgFading, setImgFading] = useState(false)
  const [qty, setQty] = useState(1)
  const [wishlist, setWishlist] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [openFaq, setOpenFaq] = useState(null)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [backTopVisible, setBackTopVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' })

  // ── Fetch book ──
  const { data: book, isLoading, isError } = useQuery({
    queryKey: ['book', slug, hashId],
    queryFn: () => bookService.getBook(slug, hashId).then(r => r.data.data),
    retry: 1,
  })

  // ── Add review mutation ──
  const reviewMutation = useMutation({
    mutationFn: (data) => bookService.addReview(slug, hashId, data),
    onSuccess: () => {
      toast.success('Cảm ơn bạn đã đánh giá!')
      setReviewForm({ rating: 5, title: '', content: '' })
      queryClient.invalidateQueries(['book', slug, hashId])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Đánh giá thất bại!'),
  })

  // ── Scroll effects ──
  useEffect(() => {
    const revObserver = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revObserver.observe(el))

    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
      setProgress(height > 0 ? (winScroll / height) * 100 : 0)
      setBackTopVisible(winScroll > 600)
      if (heroRef.current) {
        setStickyVisible(heroRef.current.getBoundingClientRect().bottom < 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => { window.removeEventListener('scroll', handleScroll); revObserver.disconnect() }
  }, [book])

  // ── Sync wishlist from book data ──
  useEffect(() => {
    if (book?.isWishlisted !== undefined) setWishlist(book.isWishlisted)
  }, [book])

  // ── Derived data ──
  const images = book
    ? [book.coverImage, ...(book.images || [])].filter(Boolean)
    : FALLBACK_IMGS

  const currentImg = images[activeThumb] || FALLBACK_IMGS[0]
  const thumbImages = images.length > 1 ? images : FALLBACK_IMGS
  const avgRating = parseFloat(book?.avgRating) || 4.9
  const reviewCount = book?._count?.reviews || 0
  const discountedPrice = book?.discountPrice || book?.price
  const originalPrice = book?.price
  const hasDiscount = book?.discountPrice && book.discountPrice < book.price
  const discountPct = hasDiscount
    ? Math.round((1 - book.discountPrice / book.price) * 100)
    : 0

  // ── Handlers ──
  const changeImg = (idx) => {
    if (idx === activeThumb) return
    setImgFading(true)
    setTimeout(() => { setActiveThumb(idx); setImgFading(false) }, 200)
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập để mua hàng!'); navigate('/login'); return }
    if (addedToCart) return
    try {
      await addToCart(hashId, qty)
      setAddedToCart(true)
      toast.success('Đã thêm vào giỏ hàng!')
      setTimeout(() => setAddedToCart(false), 1800)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thêm vào giỏ thất bại!')
    }
  }

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập!'); return }
    const prev = wishlist
    setWishlist(!prev) // optimistic
    try {
      await bookService.toggleWishlist(slug, hashId)
      toast.success(!prev ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích')
    } catch {
      setWishlist(prev) // rollback
      toast.error('Thao tác thất bại!')
    }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập để đánh giá!'); return }
    if (!reviewForm.title.trim() || !reviewForm.content.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin!'); return
    }
    reviewMutation.mutate(reviewForm)
  }

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i)

  // ── Loading state ──
  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 300, color: 'var(--forest)', marginBottom: '12px' }}>
          Đang tải...
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Vui lòng chờ một chút</div>
      </div>
    </div>
  )

  // ── Error state ──
  if (isError || !book) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', paddingTop: '80px' }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '48px', fontWeight: 300, color: 'var(--pale)', lineHeight: 1 }}>404</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 300, color: 'var(--forest)' }}>
        Không tìm thấy sách
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 300 }}>Sách này có thể đã bị xóa hoặc đường dẫn không đúng.</p>
      <Link to="/shop">
        <button className="btn-primary" style={{ padding: '14px 32px' }}>Về cửa hàng</button>
      </Link>
    </div>
  )

  return (
    <>
      {/* Progress bar */}
      <div id="progress" style={{ width: `${progress}%` }}></div>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">Trang chủ</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/shop" className="breadcrumb-item">Cửa hàng</Link>
        <span className="breadcrumb-sep">›</span>
        {book.category && (
          <>
            <Link to={`/shop?category=${book.category.slug}`} className="breadcrumb-item">
              {book.category.name}
            </Link>
            <span className="breadcrumb-sep">›</span>
          </>
        )}
        <span className="breadcrumb-current">{book.title}</span>
      </div>

      {/* ══ HERO SPLIT ══ */}
      <div className="product-hero" id="product-hero" ref={heroRef}>

        {/* LEFT: Gallery */}
        <div className="gallery-wrap reveal-left">
          <div className="gallery-main">
            <img
              src={currentImg}
              alt={book.title}
              style={{
                opacity: imgFading ? 0 : 1,
                transform: imgFading ? 'scale(1.03)' : 'scale(1)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = imgFading ? 'scale(1.03)' : 'scale(1)' }}
            />
            <div className="gallery-badge-group">
              {book.isFeatured && <span className="g-badge gold">Bán chạy</span>}
              {book.hasAR && <span className="g-badge forest">AR + AI</span>}
            </div>
            <button className="gallery-ar-btn" onClick={() => toast.success('Tính năng AR Demo đang được phát triển!')}>
              <div className="gallery-ar-pulse"></div>
              <IconPlay />
              Xem Demo AR
            </button>
          </div>

          <div className="gallery-thumbs">
            {thumbImages.slice(0, 4).map((src, i) => (
              <div
                key={i}
                className={`gallery-thumb${activeThumb === i ? ' active' : ''}`}
                onClick={() => changeImg(i)}
              >
                <img
                  src={src.includes('unsplash') ? src.replace('w=900', 'w=200') : src}
                  alt={`${book.title} ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Product Info */}
        <div className="product-info reveal-right">
          <div className="info-eyebrow">
            <div className="info-eyebrow-line"></div>
            <span className="info-eyebrow-text">
              {book.category?.name || 'Sách AR'} · {book.ageRange || 'Mọi lứa tuổi'}
            </span>
          </div>

          <h1 className="product-title-main">
            {book.title?.split(' ').slice(0, -1).join(' ') || book.title}
            <br/>
            <em>{book.title?.split(' ').slice(-1)[0]}</em>
          </h1>
          <p className="product-subtitle">
            {book.subtitle || 'Khám phá thế giới qua công nghệ tăng cường'}
          </p>

          {/* Rating row */}
          <div className="rating-row">
            <Stars rating={avgRating} />
            <span className="rating-num">{avgRating.toFixed(1)}</span>
            <div className="rating-sep"></div>
            <span className="rating-count">{reviewCount} đánh giá</span>
            {book.soldCount > 0 && (
              <>
                <div className="rating-sep"></div>
                <span className="rating-count">{book.soldCount} đã bán</span>
              </>
            )}
            <div className="rating-sep"></div>
            <span className="verified-badge">✓ Đã xác minh</span>
          </div>

          {/* Tags */}
          <div className="product-tags">
            {book.hasAR && <span className="product-tag">AR Tương Tác</span>}
            {book.hasAI && <span className="product-tag">AI Tutor</span>}
            {book.has3DAudio && <span className="product-tag">Âm Thanh 3D</span>}
            {book.languages?.map(lang => (
              <span key={lang} className="product-tag">{lang}</span>
            ))}
            {book.ageRange && <span className="product-tag">{book.ageRange}</span>}
            {/* Fallback tags nếu không có data */}
            {!book.hasAR && !book.hasAI && (
              <>
                <span className="product-tag">AR Tương Tác</span>
                <span className="product-tag">AI Tutor</span>
                <span className="product-tag">VI / EN</span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="product-desc-main">
            {book.description || 'Mở trang sách — thế giới hiện ra. Công nghệ AR thế hệ mới biến từng trang sách thành một cổng thông tin sống động với độ trung thực cao nhất.'}
          </p>

          {/* Quick specs */}
          <div className="quick-specs">
            {[
              ['Độ tuổi', book.ageRange || '6–12 tuổi'],
              ['Mô hình AR', book.arModelCount ? `${book.arModelCount}+ mô hình` : '120+ loài'],
              ['Số trang', book.pages ? `${book.pages} trang` : '128 trang'],
              ['Ngôn ngữ', book.language || 'VI / EN'],
              ['Kích thước', book.dimensions || '21 × 28 cm'],
              ['Cập nhật nội dung', book.updatePeriod || 'Miễn phí / 24T'],
            ].map(([label, val]) => (
              <div key={label} className="spec-cell">
                <span className="spec-label">{label}</span>
                <span className="spec-val">{val}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="price-block">
            <div>
              {hasDiscount && (
                <div className="price-old">{formatPrice(originalPrice)}</div>
              )}
              <div className="price-main">{formatPrice(discountedPrice)}</div>
            </div>
            {hasDiscount && (
              <span className="price-save">
                Tiết kiệm {formatPrice(originalPrice - discountedPrice)} · −{discountPct}%
              </span>
            )}
          </div>

          {/* Qty + Add to cart */}
          <div className="purchase-row">
            <div className="qty-wrap">
              <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <input className="qty-num" type="number" value={qty} readOnly />
              <button className="qty-btn" onClick={() => setQty(q => Math.min(99, q + 1))}>+</button>
            </div>
            <button
              className="btn-add-main"
              onClick={handleAddToCart}
              disabled={addedToCart}
              style={addedToCart ? { background: 'var(--gold)' } : {}}
            >
              {addedToCart ? <><IconCheck /> Đã thêm vào giỏ!</> : <><IconCart /> Thêm vào giỏ hàng</>}
            </button>
            <button
              className={`btn-wishlist-main${wishlist ? ' active' : ''}`}
              onClick={handleWishlist}
              title={wishlist ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
            >
              <IconHeart filled={wishlist} />
            </button>
          </div>

          {/* Secondary CTAs */}
          <div className="secondary-cta">
            <button className="btn-secondary" onClick={() => toast.success('Tính năng đang phát triển!')}>
              <IconPlay size={13} /> Xem demo AR
            </button>
            <button className="btn-secondary" onClick={() => {
              navigator.clipboard?.writeText(window.location.href)
              toast.success('Đã sao chép link!')
            }}>
              <IconShare /> Chia sẻ
            </button>
            <button className="btn-secondary" onClick={() => toast.success('Tính năng đang phát triển!')}>
              <IconSearch /> So sánh
            </button>
          </div>

          {/* Trust micro */}
          <div className="trust-micro">
            {[
              [<svg key="t" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, 'Giao hàng toàn quốc — miễn phí từ 300k'],
              [<svg key="s" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, 'Bảo hành 12 tháng · Đổi trả trong 30 ngày'],
              [<svg key="p" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, 'Thanh toán an toàn · Mã hoá SSL 256-bit'],
            ].map(([icon, text], i) => (
              <div key={i} className="trust-micro-item">{icon} {text}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ TABS ══ */}
      <div className="tabs-section">
        <div className="tabs-nav">
          {[
            { id: 'details', label: 'Chi Tiết Sản Phẩm' },
            { id: 'chapters', label: 'Nội Dung Sách' },
            { id: 'reviews', label: `Đánh Giá (${reviewCount})` },
            { id: 'faq', label: 'Câu Hỏi Thường Gặp' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Chi tiết */}
        {activeTab === 'details' && (
          <div className="tab-panel active">
            <div className="details-grid">
              <div>
                <h3 className="details-col-title">Thông Số <em>Kỹ Thuật</em></h3>
                <div className="details-list">
                  {[
                    ['Tên sách', book.title],
                    ['Nhà xuất bản', book.publisher || 'Earthoria Publishing'],
                    ['Năm xuất bản', book.publishYear || '2026'],
                    ['Số trang', book.pages ? `${book.pages} trang` : '128 trang'],
                    ['Kích thước', book.dimensions || '21 × 28 × 1.2 cm'],
                    ['Trọng lượng', book.weight || '680g'],
                    ['Bìa sách', book.cover || 'Cứng, chống nước'],
                    ['Giấy in', book.paper || 'FSC Certified 150gsm'],
                    ['Ngôn ngữ', book.language || 'Tiếng Việt / Tiếng Anh'],
                    ['Độ tuổi', book.ageRange || '6–12 tuổi'],
                  ].map(([k, v]) => (
                    <div key={k} className="details-row">
                      <span className="details-key">{k}</span>
                      <span className="details-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="details-col-title">Yêu Cầu <em>Ứng Dụng</em></h3>
                <div className="details-list">
                  {[
                    ['Ứng dụng', 'Earthoria AR (miễn phí)'],
                    ['iOS', '14.0 trở lên'],
                    ['Android', '10.0 trở lên'],
                    ['RAM tối thiểu', '3GB'],
                    ['Kết nối', 'Offline 100% sau tải'],
                    ['Dung lượng app', '2.4 GB'],
                    ['Mô hình AR', book.arModelCount ? `${book.arModelCount}+ mô hình` : '120+ mô hình'],
                    ['AI Tutor', book.hasAI ? 'Có (cần internet)' : 'Không'],
                    ['Cập nhật nội dung', 'Miễn phí trong 24 tháng'],
                    ['Hỗ trợ', '7 ngày / tuần'],
                  ].map(([k, v]) => (
                    <div key={k} className="details-row">
                      <span className="details-key">{k}</span>
                      <span className="details-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Nội dung sách */}
        {activeTab === 'chapters' && (
          <div className="tab-panel active">
            <div style={{ maxWidth: '760px' }}>
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 300, color: 'var(--forest)', marginBottom: '12px' }}>
                  Hành Trình{' '}
                  <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>
                    {book.chapters?.length || 8} Chương
                  </em>
                </h3>
                <p style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--text-muted)' }}>
                  {book.chapterIntro || 'Mỗi chương là một thế giới riêng biệt với hệ thống mô hình AR và câu chuyện độc lập.'}
                </p>
              </div>
              <div className="chapter-list">
                {(book.chapters?.length > 0 ? book.chapters : [
                  { title: 'Tán Rừng — Nơi Ánh Sáng Sinh Sống', info: '18 loài · 14 trang' },
                  { title: 'Lớp Tán Giữa — Vương Quốc Của Linh Trưởng', info: '22 loài · 18 trang' },
                  { title: 'Tầng Bụi Rậm — Nơi Kẻ Săn Mồi Rình Rập', info: '19 loài · 16 trang' },
                  { title: 'Lòng Suối — Hệ Sinh Thái Nước Ngọt', info: '16 loài · 14 trang' },
                  { title: 'Thế Giới Côn Trùng — Những Kỹ Sư Vô Hình', info: '24 loài · 20 trang' },
                  { title: 'Hoa Và Thụ Phấn — Giao Ước Cổ Xưa', info: '15 loài · 12 trang' },
                  { title: 'Nấm Và Rễ — Mạng Lưới Ngầm Của Rừng', info: '10 loài · 10 trang' },
                  { title: 'Rừng Và Con Người — Bảo Tồn Hay Mất Mát', info: 'Đặc biệt · 8 trang' },
                ]).map((ch, i) => (
                  <div key={i} className="chapter-item">
                    <div className="chapter-num">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="chapter-title">{ch.title}</div>
                    <span className="chapter-count">{ch.info || ch.count || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Đánh giá */}
        {activeTab === 'reviews' && (
          <div className="tab-panel active">
            <div className="reviews-layout">
              {/* Summary */}
              <div className="reviews-summary">
                <div className="reviews-big-num">{avgRating.toFixed(1)}</div>
                <div className="reviews-stars-big">
                  <Stars rating={avgRating} />
                </div>
                <div className="reviews-total">Dựa trên {reviewCount} đánh giá</div>
                <div className="rating-bars">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = book.ratingBreakdown?.[star] || 0
                    const pct = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : (star === 5 ? 88 : star === 4 ? 9 : star === 3 ? 2 : star === 2 ? 1 : 0)
                    return (
                      <div key={star} className="rating-bar-row">
                        <span>{star}★</span>
                        <div className="rating-bar-track">
                          <div className="rating-bar-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span>{pct}%</span>
                      </div>
                    )
                  })}
                </div>

                {/* Write review form */}
                {isAuthenticated && (
                  <form onSubmit={handleReview} style={{ marginTop: '32px', paddingTop: '24px', borderTop: '0.5px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      Viết đánh giá
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s} type="button"
                          onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: s <= reviewForm.rating ? 'var(--gold)' : 'var(--pale)', transition: 'color 0.2s' }}
                        >★</button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Tiêu đề đánh giá"
                      value={reviewForm.title}
                      onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', border: '0.5px solid var(--border)', background: 'var(--ivory)', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', outline: 'none', marginBottom: '10px' }}
                    />
                    <textarea
                      placeholder="Chia sẻ trải nghiệm của bạn..."
                      value={reviewForm.content}
                      onChange={e => setReviewForm(f => ({ ...f, content: e.target.value }))}
                      rows={3}
                      style={{ width: '100%', padding: '10px 14px', border: '0.5px solid var(--border)', background: 'var(--ivory)', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', outline: 'none', resize: 'vertical', marginBottom: '12px' }}
                    />
                    <button
                      type="submit"
                      disabled={reviewMutation.isPending}
                      style={{ width: '100%', background: 'var(--forest)', color: 'var(--ivory)', border: 'none', padding: '12px', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      {reviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                  </form>
                )}
              </div>

              {/* Review list */}
              <div className="review-list">
                {(book.reviews?.length > 0 ? book.reviews : [
                  { user: { firstName: 'Minh', lastName: 'Anh' }, rating: 5, title: 'Con tôi không chịu rời cuốn sách này ra', content: 'Mua cho bé 9 tuổi và thực sự không ngờ lại hay đến vậy. Mỗi tối đều ngồi ôm sách mở AR ra xem, hỏi đủ thứ câu hỏi. AI Tutor trả lời rất tự nhiên, không khô khan như sách giáo khoa.', createdAt: '2026-05-12', helpfulCount: 38 },
                  { user: { firstName: 'Thùy', lastName: 'Linh' }, rating: 5, title: 'Quà sinh nhật hoàn hảo nhất từ trước đến nay', content: 'Tặng cho cháu 7 tuổi, cháu thích đến mức nhờ tôi đọc cho nghe mỗi đêm rồi cùng quét AR. Sách đóng bìa cứng, giấy dày, in màu cực kỳ sắc nét.', createdAt: '2026-04-03', helpfulCount: 24 },
                  { user: { firstName: 'Hoàng', lastName: 'Khải' }, rating: 5, title: 'Giáo viên giới thiệu và tôi không hối hận khi mua', content: 'Con tôi 10 tuổi, giáo viên khoa học ở trường đề xuất dùng sách AR. AI Tutor biết điều chỉnh cách giải thích cho phù hợp — rất tiện luyện ngoại ngữ.', createdAt: '2026-03-19', helpfulCount: 19 },
                ]).map((r, i) => (
                  <div key={i} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {(r.user?.firstName || r.initial || '?')[0]}
                        </div>
                        <div>
                          <div className="reviewer-name">
                            {r.user ? `${r.user.firstName} ${r.user.lastName?.charAt(0)}.` : r.name}
                          </div>
                          <div className="reviewer-date">
                            {r.createdAt ? formatDate(r.createdAt) : r.date}
                          </div>
                        </div>
                      </div>
                      <div className="review-stars">
                        {Array.from({ length: r.rating || 5 }).map((_, j) => (
                          <span key={j} className="star">★</span>
                        ))}
                      </div>
                    </div>
                    <div className="review-title">{r.title}</div>
                    <div className="review-body">{r.content || r.body}</div>
                    <div className="review-helpful">
                      <span>Đánh giá này có hữu ích không?</span>
                      <button className="helpful-btn">👍 Có ({r.helpfulCount || 0})</button>
                      <button className="helpful-btn">Không</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: FAQ */}
        {activeTab === 'faq' && (
          <div className="tab-panel active">
            <div style={{ maxWidth: '720px' }}>
              {FAQS.map((faq, i) => (
                <div key={i} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <button
                    onClick={() => toggleFaq(i)}
                    style={{
                      width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                      padding: '22px 0', cursor: 'pointer', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center', gap: '20px'
                    }}
                  >
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', fontWeight: 400, color: 'var(--forest)' }}>
                      {faq.q}
                    </span>
                    <span style={{
                      color: 'var(--gold)', fontSize: '20px', flexShrink: 0,
                      transition: 'transform 0.3s',
                      transform: openFaq === i ? 'rotate(45deg)' : 'none'
                    }}>+</span>
                  </button>
                  <div style={{
                    maxHeight: openFaq === i ? '200px' : '0',
                    overflow: 'hidden', transition: 'max-height 0.4s ease'
                  }}>
                    <p style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--text-muted)', paddingBottom: '20px', fontWeight: 300 }}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ RELATED PRODUCTS ══ */}
      <div className="related-section">
        <div className="related-inner">
          <div className="section-header" style={{ marginBottom: '52px' }}>
            <div className="section-eyebrow">
              <div className="section-eyebrow-line"></div>
              <span className="section-eyebrow-text">Có Thể Bạn Cũng Thích</span>
              <div className="section-eyebrow-line"></div>
            </div>
            <h2 className="section-title reveal">Khám Phá Thêm <em>Sách AR</em></h2>
          </div>
          <div className="related-grid">
            {RELATED_FALLBACK.map((p, i) => (
              <RelatedCard key={i} {...p} delay={i > 0 ? `reveal-delay-${i}` : ''} />
            ))}
          </div>
        </div>
      </div>

      {/* ══ STICKY BAR ══ */}
      <div className={`sticky-bar${stickyVisible ? ' visible' : ''}`}>
        <div className="sticky-bar-inner">
          <div>
            <div className="sticky-product-name">
              {book.title?.split(' ').slice(0, -1).join(' ') || book.title}{' '}
              <em>{book.title?.split(' ').slice(-1)[0]}</em>
            </div>
            <div className="sticky-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="star">★</span>
              ))}
              <span>{avgRating.toFixed(1)} · {reviewCount} đánh giá</span>
            </div>
          </div>
          <div className="sticky-price">{formatPrice(discountedPrice)}</div>
          <button
            className="sticky-btn"
            onClick={handleAddToCart}
            disabled={addedToCart}
          >
            <IconCart size={14} />
            {addedToCart ? 'Đã thêm!' : 'Thêm vào giỏ hàng'}
          </button>
        </div>
      </div>

      {/* Back to top */}
      <button
        id="back-top"
        className={backTopVisible ? 'visible' : ''}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <IconChevronUp />
      </button>
    </>
  )
}

// ── Related Card component ──
function RelatedCard({ img, badge, badgeGold, name, short, price, rating, delay }) {
  const [added, setAdded] = useState(false)

  const handleAdd = (e) => {
    e.stopPropagation()
    if (added) return
    setAdded(true)
    toast.success(`Đã thêm "${name}" vào giỏ!`)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div className={`product-card reveal ${delay || ''}`}>
      <div className="product-img-wrap">
        <img src={img} alt={name} />
        <div className="product-overlay">
          <button className="overlay-btn">Xem chi tiết</button>
        </div>
        <span className={`product-card-badge${badgeGold ? ' gold' : ''}`}>{badge}</span>
      </div>
      <div className="product-body">
        <div className="product-rating-mini">
          {Array.from({ length: 5 }).map((_, i) => <span key={i} className="star" style={{ fontSize: '10px' }}>★</span>)}
          <span>({rating})</span>
        </div>
        <div className="product-name">{name}</div>
        <div className="product-short">{short}</div>
        <div className="product-card-footer">
          <span className="product-price">{formatPrice(price)}</span>
          <button className="add-cart-mini" onClick={handleAdd}>
            {added
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            }
          </button>
        </div>
      </div>
    </div>
  )
}