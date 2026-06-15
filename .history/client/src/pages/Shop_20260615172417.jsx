import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookService } from '../services/bookService'
import { useCartStore } from '../store/cartStore'
import { formatPrice, getBookUrl } from '../utils/helpers'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { key: 'all', label: 'Tất cả sản phẩm', count: 18 },
  { key: 'nature', label: 'Thiên Nhiên', count: 8 },
  { key: 'space', label: 'Vũ Trụ', count: 5 },
  { key: 'science', label: 'Khoa Học', count: 5 },
]

const AGE_TAGS = ['3–5 tuổi', '6–8 tuổi', '9–12 tuổi', 'Mọi lứa tuổi']

const FEATURES = [
  { label: 'Có AR', count: 18 },
  { label: 'Có AI Chat', count: 12 },
  { label: 'Âm thanh 3D', count: 9 },
  { label: 'Bộ sưu tập', count: 4 },
]

const TOOLBAR_PILLS = ['Tất cả', 'Thiên nhiên', 'Vũ trụ', 'Khoa học', 'Bộ sưu tập']

const TRUST_ITEMS = [
  {
    title: 'Giao hàng toàn quốc',
    sub: 'Miễn phí đơn từ 300k',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    title: 'Bảo hành 12 tháng',
    sub: 'Đổi trả trong 30 ngày',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    title: 'Thanh toán an toàn',
    sub: 'Mã hoá SSL 256-bit',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    title: 'Hỗ trợ 7 ngày/tuần',
    sub: 'Chat trực tiếp hoặc email',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

const CAT_BANNERS = [
  {
    label: 'Bán chạy nhất',
    title: 'Thế Giới Thiên Nhiên',
    count: '8 sản phẩm',
    img: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&q=80',
  },
  {
    label: 'Mới nhất',
    title: 'Khám Phá Vũ Trụ',
    count: '5 sản phẩm',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
  },
  {
    label: 'Phổ biến',
    title: 'Khoa Học Kỳ Diệu',
    count: '5 sản phẩm',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  },
]

// Static fallback product cards when API returns empty
const STATIC_PRODUCTS = [
  {
    id: 'dai-duong',
    title: 'Đại Dương Huyền Bí',
    desc: '80 loài sinh vật biển sâu hiện ra sinh động. Khám phá rạn san hô, đáy đại dương và dòng hải lưu.',
    price: '350.000đ', oldPrice: '380.000đ', discount: '-8%',
    badge: 'Mới', category: 'Thiên Nhiên',
    rating: 5, reviewCount: 47,
    tags: ['AR', 'AI Tutor'],
    img: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=500&q=80',
  },
  {
    id: 'hanh-trinh-vu-tru',
    title: 'Hành Trình Vũ Trụ',
    desc: 'Du hành qua 8 hành tinh, hàng trăm ngôi sao và dải Ngân Hà với mô hình không gian 3D có âm thanh vòm.',
    price: '420.000đ',
    badge: 'Đặc biệt', badgeGold: true, category: 'Vũ Trụ',
    rating: 5, reviewCount: 62,
    tags: ['AR', '3D Audio', 'AI Tutor'],
    img: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=500&q=80',
  },
  {
    id: 'con-trung',
    title: 'Côn Trùng Kỳ Diệu',
    desc: 'Phóng to 50 loài côn trùng tới kích thước khổng lồ, quan sát từng chi tiết cánh, xúc tu và chu kỳ sống.',
    price: '290.000đ', category: 'Thiên Nhiên',
    rating: 4, reviewCount: 31,
    tags: ['AR'],
    img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&q=80',
  },
  {
    id: 'co-the-con-nguoi',
    title: 'Cơ Thể Con Người',
    desc: 'Bóc tách từng lớp của cơ thể người — xương, cơ, nội tạng — với mô hình AR tương tác độ nét cao.',
    price: '390.000đ', oldPrice: '450.000đ', discount: '-13%',
    badge: 'Hot', category: 'Khoa Học',
    rating: 5, reviewCount: 88,
    tags: ['AR', 'AI Tutor', '3D Audio'],
    img: 'https://images.unsplash.com/photo-1537721664796-76f77222a5d0?w=500&q=80',
  },
  {
    id: 'khung-long',
    title: 'Khủng Long Trỗi Dậy',
    desc: 'Hồi sinh 30 loài khủng long theo tỉ lệ thực. Cảm nhận tiếng gầm rú và chuyển động ngay trong phòng khách.',
    price: '460.000đ',
    badge: 'Phiên bản giới hạn', badgeGold: true, category: 'Thiên Nhiên',
    rating: 5, reviewCount: 114,
    tags: ['AR', '3D Audio'],
    img: 'https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?w=500&q=80',
    wishlisted: true,
  },
  {
    id: 'thuc-vat',
    title: 'Thực Vật Kỳ Bí',
    desc: 'Quan sát quá trình thụ phấn, nảy mầm và phát triển của 60 loài thực vật bằng hoạt hình AR thời gian thực.',
    price: '310.000đ', category: 'Thiên Nhiên',
    rating: 4, reviewCount: 28,
    tags: ['AR', 'AI Tutor'],
    img: 'https://images.unsplash.com/photo-1530983822321-fcac2d3c0f06?w=500&q=80',
  },
]

function CartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}

function StarRating({ rating, count }) {
  return (
    <div className="product-rating">
      <div className="product-rating-stars">
        {[1,2,3,4,5].map(i => (
          <span key={i} className="star" style={i > rating ? {color:'var(--border)'} : {}}>★</span>
        ))}
      </div>
      <span className="product-rating-count">({count})</span>
    </div>
  )
}

function AddToCartBtn({ onAdd }) {
  const [added, setAdded] = useState(false)

  const handleClick = (e) => {
    e.stopPropagation()
    setAdded(true)
    onAdd && onAdd()
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <button
      className="add-cart"
      onClick={handleClick}
      style={added ? { background: 'var(--forest)', color: 'var(--ivory)' } : {}}
    >
      {added ? <CheckIcon /> : <CartIcon />}
    </button>
  )
}

function ProductCard({ book, onAddToCart, delay }) {
  const [wishlisted, setWishlisted] = useState(book.wishlisted || false)

  return (
    <div className={`product-card reveal${delay ? ` reveal-delay-${delay}` : ''}`}>
      <div className="product-img-wrap">
        <img src={book.img || book.coverImage} alt={book.title} />
        <div className="product-img-overlay">
          <button className="overlay-btn primary">Xem chi tiết</button>
          <button className="overlay-btn">Demo AR</button>
        </div>
        {book.badge && (
          <span className={`product-badge${book.badgeGold ? ' gold' : ''}`}>{book.badge}</span>
        )}
        {book.category && (
          <span className="product-category">{book.category?.name || book.category}</span>
        )}
        <button
          className={`card-wishlist${wishlisted ? ' active' : ''}`}
          onClick={(e) => { e.stopPropagation(); setWishlisted(w => !w) }}
          style={wishlisted ? { opacity: 1, transform: 'translateY(0)' } : {}}
        >
          <HeartIcon filled={wishlisted} />
        </button>
      </div>
      <div className="product-body">
        <StarRating rating={book.rating} count={book.reviewCount} />
        {book.tags && (
          <div className="product-tags">
            {book.tags.map(tag => (
              <span key={tag} className="product-tag">{tag}</span>
            ))}
          </div>
        )}
        <div className="product-title">{book.title}</div>
        <p className="product-desc">{book.desc || book.description?.slice(0,100) + '...'}</p>
        <div className="product-footer">
      {book.oldPrice ? (
  <div className="product-price-wrap">
    <div className="product-price-old-row">
      <span className="product-price-old">{book.oldPrice}</span>
      <span className="product-price-discount">{book.discount}</span>
    </div>
    <span className="product-price">{book.price || formatPrice(book.salePrice || book.basePrice)}</span>
  </div>
) : (
  <span className="product-price">{book.price || formatPrice(book.salePrice || book.basePrice)}</span>
)}
          <AddToCartBtn onAdd={() => onAddToCart && onAddToCart(book.hashId || book.id)} />
        </div>
      </div>
    </div>
  )
}

export default function Shop() {
  const { addToCart } = useCartStore()

  const [activeCategory, setActiveCategory] = useState('all')
  const [activeFeatures, setActiveFeatures] = useState(['Có AR'])
  const [activeTags, setActiveTags] = useState(['3–5 tuổi'])
  const [activeToolbarPill, setActiveToolbarPill] = useState('Tất cả')
  const [gridCols, setGridCols] = useState(3)
  const [sortValue, setSortValue] = useState('Nổi bật')
  const [activePage, setActivePage] = useState(1)

  const { data: books = [] } = useQuery({
    queryKey: ['shop-books', activeCategory, sortValue],
    queryFn: () => bookService.getAll({ category: activeCategory, sort: sortValue }).then(r => r.data.data),
  })

  // Reveal on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [books])

  const handleAddToCart = async (id) => {
    try {
      await addToCart(id, 1)
      toast.success('Đã thêm vào giỏ hàng')
    } catch {
      toast.error('Vui lòng đăng nhập để mua hàng')
    }
  }

  const displayBooks = books.length > 0 ? books : STATIC_PRODUCTS

  return (
    <>
      {/* SHOP HERO */}
      <div style={{ background: 'var(--ivory)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/asset/img/image.png')",
          backgroundSize: 'cover', backgroundPosition: 'center right',
          opacity: 0.35, zIndex: 0
        }} />
        <div className="shop-hero" style={{ position: 'relative', zIndex: 1 }}>
          <div className="shop-hero-left">
            <div className="page-eyebrow">
              <div className="page-eyebrow-line" />
              <span className="page-eyebrow-text">Bộ Sưu Tập Earthoria</span>
            </div>
            <h1 className="shop-hero-title reveal">
              Khám Phá<br/>
              <em>Thư Viện</em><br/>
              Sách AR
            </h1>
            <p className="shop-hero-sub reveal reveal-delay-1">
              Mỗi cuốn sách là một cổng thông tin sống động — nơi thiên nhiên hiện ra qua lăng kính công nghệ tăng cường và trí tuệ nhân tạo.
            </p>
          </div>
          <div className="shop-hero-right reveal">
            <div className="shop-result-count">18</div>
            <div className="shop-result-label">Sản phẩm</div>
          </div>
        </div>
      </div>

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">Trang chủ</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Cửa hàng</span>
      </div>

      {/* MARQUEE */}
      <div className="marquee-section">
        <div className="marquee-track">
          {['Sách AR Thiên Nhiên','AI Storytelling','Mô Hình 3D','Giáo Dục Sinh Thái','Thực Tế Tăng Cường','Khám Phá Thiên Nhiên',
            'Sách AR Thiên Nhiên','AI Storytelling','Mô Hình 3D','Giáo Dục Sinh Thái','Thực Tế Tăng Cường','Khám Phá Thiên Nhiên'
          ].map((item, i) => (
            <div className="marquee-item" key={i}>
              {item} <div className="marquee-dot" />
            </div>
          ))}
        </div>
      </div>

      {/* TRUST STRIP */}
      <div className="trust-strip">
        <div className="trust-strip-inner">
          {TRUST_ITEMS.map((item, i) => (
            <div className="trust-item" key={i}>
              <div className="trust-icon">{item.icon}</div>
              <div>
                <div className="trust-title">{item.title}</div>
                <div className="trust-sub">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORY BANNER */}
      <div className="cat-banner-section">
        <div className="section-header" style={{ marginBottom: '40px' }}>
          <div className="section-eyebrow">
            <div className="section-eyebrow-line" />
            <span className="section-eyebrow-text">Danh Mục</span>
            <div className="section-eyebrow-line" />
          </div>
          <h2 className="section-title reveal">Khám Phá Theo <em>Chủ Đề</em></h2>
        </div>
        <div className="cat-banner-grid reveal">
          {CAT_BANNERS.map((cat, i) => (
            <div className="cat-banner-card" key={i}>
              <img src={cat.img} alt={cat.title} />
              <div className="cat-banner-overlay" />
              <div className="cat-banner-body">
                <div className="cat-banner-label">{cat.label}</div>
                <div className="cat-banner-title">{cat.title}</div>
                <div className="cat-banner-count">{cat.count}</div>
              </div>
              <div className="cat-banner-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SHOP LAYOUT */}
      <div className="shop-layout">

        {/* SIDEBAR */}
        <aside className="shop-sidebar">

          <div className="sidebar-section">
            <div className="sidebar-title">Danh Mục</div>
            <div className="sidebar-pills">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  className={`sidebar-pill${activeCategory === cat.key ? ' active' : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  {cat.label}
                  <span className="sidebar-pill-count">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">Giá (VNĐ)</div>
            <div className="price-range-wrap">
              <div className="price-range-track">
                <div className="price-range-fill" />
              </div>
              <div className="price-range-labels">
                <span className="price-range-value">150k</span>
                <span className="price-range-value">450k</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">Độ Tuổi</div>
            <div className="age-tags">
              {AGE_TAGS.map(tag => (
                <button
                  key={tag}
                  className={`age-tag${activeTags.includes(tag) ? ' active' : ''}`}
                  onClick={() => setActiveTags(prev =>
                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">Tính Năng</div>
            <div className="sidebar-pills">
              {FEATURES.map(feat => (
                <button
                  key={feat.label}
                  className={`sidebar-pill${activeFeatures.includes(feat.label) ? ' active' : ''}`}
                  onClick={() => setActiveFeatures(prev =>
                    prev.includes(feat.label) ? prev.filter(f => f !== feat.label) : [...prev, feat.label]
                  )}
                >
                  {feat.label}
                  <span className="sidebar-pill-count">{feat.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">Đánh Giá</div>
            <div className="sidebar-pills">
              {[5, 4, 3].map(stars => (
                <button key={stars} className="sidebar-pill">
                  <span style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ fontSize: '11px', color: i <= stars ? 'var(--gold)' : 'var(--border)' }}>★</span>
                    ))}
                  </span>
                  <span className="sidebar-pill-count">{stars === 5 ? 6 : stars === 4 ? 9 : 3}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main>
          {/* TOOLBAR */}
          <div className="shop-toolbar">
            <div className="toolbar-pills">
              {TOOLBAR_PILLS.map(pill => (
                <button
                  key={pill}
                  className={`pill${activeToolbarPill === pill ? ' active' : ''}`}
                  onClick={() => setActiveToolbarPill(pill)}
                >
                  {pill}
                </button>
              ))}
            </div>
            <div className="toolbar-right">
              <span className="sort-label">Sắp xếp</span>
              <select className="sort-select" value={sortValue} onChange={e => setSortValue(e.target.value)}>
                <option>Nổi bật</option>
                <option>Mới nhất</option>
                <option>Giá tăng dần</option>
                <option>Giá giảm dần</option>
                <option>Đánh giá cao</option>
              </select>
              <div className="view-toggle">
                <button
                  className={`view-btn${gridCols === 3 ? ' active' : ''}`}
                  onClick={() => setGridCols(3)}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="0" y="0" width="4" height="4" fill="currentColor" rx="0.5"/>
                    <rect x="6" y="0" width="4" height="4" fill="currentColor" rx="0.5"/>
                    <rect x="12" y="0" width="4" height="4" fill="currentColor" rx="0.5"/>
                    <rect x="0" y="6" width="4" height="4" fill="currentColor" rx="0.5"/>
                    <rect x="6" y="6" width="4" height="4" fill="currentColor" rx="0.5"/>
                    <rect x="12" y="6" width="4" height="4" fill="currentColor" rx="0.5"/>
                  </svg>
                </button>
                <button
                  className={`view-btn${gridCols === 2 ? ' active' : ''}`}
                  onClick={() => setGridCols(2)}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="0" y="0" width="6" height="6" fill="currentColor" rx="0.5"/>
                    <rect x="10" y="0" width="6" height="6" fill="currentColor" rx="0.5"/>
                    <rect x="0" y="10" width="6" height="6" fill="currentColor" rx="0.5"/>
                    <rect x="10" y="10" width="6" height="6" fill="currentColor" rx="0.5"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* PRODUCTS GRID */}
          <div className={`products-grid grid-${gridCols}`}>

            {/* FEATURED WIDE CARD */}
            <div className="featured-product-card reveal">
              <div className="product-img-wrap">
                <img src="https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=700&q=80" alt="Bí Mật Rừng Mưa" />
                <div className="product-img-overlay" />
                <span className="product-badge gold">Bán chạy</span>
              </div>
              <div className="featured-product-body">
                <div className="featured-label">Sản phẩm nổi bật</div>
                <h2 className="featured-title">Bí Mật<br/><em>Rừng Mưa</em></h2>
                <p className="featured-desc">
                  Khám phá 120+ loài động thực vật nhiệt đới qua mô hình AR sinh động. Công nghệ nhận diện hình ảnh và AI Tutor tích hợp trả lời mọi câu hỏi của bé.
                </p>
                <div className="featured-specs">
                  {[
                    { label: 'Độ tuổi', val: '6–12 tuổi' },
                    { label: 'Mô hình AR', val: '120+' },
                    { label: 'Ngôn ngữ', val: 'VI / EN' },
                    { label: 'AI Tutor', val: 'Có' },
                  ].map(spec => (
                    <div className="featured-spec-item" key={spec.label}>
                      <div className="featured-spec-label">{spec.label}</div>
                      <div className="featured-spec-val">{spec.val}</div>
                    </div>
                  ))}
                </div>
                <div className="featured-cta">
                  <button className="btn-add-cart" onClick={() => toast.success('Đã thêm vào giỏ hàng')}>
                    <CartIcon />
                    Thêm vào giỏ — 390k
                  </button>
                  <button className="btn-ar-preview">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Demo AR
                  </button>
                </div>
              </div>
            </div>

            {/* PROMO STRIP */}
            <div className="promo-strip reveal">
              <div className="promo-left">
                <div className="promo-eyebrow">Ưu đãi tháng 6</div>
                <div className="promo-title">Mua 2 cuốn —<br/><em>Giảm ngay 15%</em></div>
              </div>
              <button className="promo-btn">Mua ngay →</button>
            </div>

            {/* PRODUCT CARDS */}
            {displayBooks.map((book, i) => (
              <ProductCard
                key={book.id || book.slug || i}
                book={book}
                onAddToCart={handleAddToCart}
                delay={((i % 3) + 1)}
              />
            ))}

          </div>

          {/* PAGINATION */}
          <div className="shop-pagination reveal">
            <button className="page-btn prev-next">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Trước
            </button>
            {[1, 2, 3].map(p => (
              <button
                key={p}
                className={`page-btn${activePage === p ? ' active' : ''}`}
                onClick={() => setActivePage(p)}
              >
                {p}
              </button>
            ))}
            <span className="page-dots">···</span>
            <button className="page-btn" onClick={() => setActivePage(9)}>9</button>
            <button className="page-btn prev-next">
              Tiếp
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </main>
      </div>

      {/* ORNAMENT DIVIDER */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 100px' }}>
        <div className="ornament-divider">
          <div className="ornament-divider-line" />
          <div className="ornament-divider-mark" />
          <div className="ornament-divider-line" />
        </div>
      </div>

      {/* CTA */}
      <section className="cta-section" id="cta-section" style={{ padding: '100px' }}>
        <div style={{
          position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
          width:'600px',height:'600px',border:'0.5px solid rgba(255,255,255,0.04)',
          borderRadius:'50%',pointerEvents:'none'
        }} />
        <div style={{
          position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
          width:'350px',height:'350px',border:'0.5px solid rgba(74,158,63,0.08)',
          borderRadius:'50%',pointerEvents:'none'
        }} />
        <div className="cta-bg-text">Earthoria</div>
        <span className="cta-eyebrow reveal">Chưa tìm thấy sản phẩm ưng ý?</span>
        <h2 className="cta-headline reveal">
          Tham gia cộng đồng —<br/><em>Nhận thông báo sản phẩm mới</em>
        </h2>
        <p className="cta-sub reveal">
          Đăng ký nhận bản tin để được ưu tiên thông báo khi bộ sưu tập mới ra mắt và nhận mã giảm giá độc quyền.
        </p>
        <div className="cta-btns reveal" style={{ flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', maxWidth: '420px', width: '100%' }}>
            <input
              type="email"
              placeholder="Email của bạn"
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.15)', borderRight: 'none',
                padding: '14px 18px', fontSize: '13px', color: 'rgba(255,255,255,0.7)',
                fontFamily: "'Be Vietnam Pro',sans-serif", outline: 'none'
              }}
            />
            <button className="cta-btn-main" style={{ padding: '14px 28px', whiteSpace: 'nowrap' }}>
              Đăng ký →
            </button>
          </div>
          <Link to="/">
            <button className="cta-btn-out">Về trang chủ</button>
          </Link>
        </div>
      </section>
    </>
  )
}