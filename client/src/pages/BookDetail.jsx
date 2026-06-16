import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const THUMB_IMGS = [
  'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=900&q=80',
  'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=900&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
]

const FAQS = [
  { q: 'Ứng dụng AR có miễn phí không?', a: 'Có, ứng dụng Earthoria AR hoàn toàn miễn phí trên App Store và Google Play. Bạn chỉ cần mua sách và tải app về là có thể sử dụng ngay.' },
  { q: 'Cần kết nối internet để dùng AR không?', a: 'Sau khi tải nội dung lần đầu (khoảng 2.4GB), toàn bộ trải nghiệm AR hoạt động 100% offline. Chỉ tính năng AI Tutor cần kết nối internet.' },
  { q: 'Thiết bị nào tương thích?', a: 'iPhone/iPad chạy iOS 14.0 trở lên và Android 10.0 trở lên với tối thiểu 3GB RAM. Thiết bị hỗ trợ ARKit hoặc ARCore sẽ cho trải nghiệm tốt nhất.' },
  { q: '"Cập nhật nội dung miễn phí 24 tháng" có nghĩa là gì?', a: 'Trong 24 tháng từ ngày mua, bạn sẽ nhận được tất cả các bản cập nhật nội dung mới — loài mới, câu chuyện mới và thử thách khám phá mới — hoàn toàn miễn phí.' },
  { q: 'Chính sách đổi trả như thế nào?', a: 'Sản phẩm còn nguyên vẹn có thể đổi trả trong 30 ngày kể từ ngày nhận hàng. Với sản phẩm lỗi kỹ thuật, chúng tôi hỗ trợ đổi mới trong toàn bộ thời gian bảo hành 12 tháng.' },
]

const RELATED = [
  { img: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=500&q=80', badge: 'Mới', badgeGold: false, name: 'Đại Dương Huyền Bí', short: '80 loài sinh vật biển sâu trong môi trường AR sống động', price: '350.000đ', rating: 47, delay: '' },
  { img: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=500&q=80', badge: 'Đặc biệt', badgeGold: true, name: 'Hành Trình Vũ Trụ', short: 'Du hành qua 8 hành tinh với mô hình không gian 3D', price: '420.000đ', rating: 62, delay: 'reveal-delay-1' },
  { img: 'https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?w=500&q=80', badge: 'Giới hạn', badgeGold: true, name: 'Khủng Long Trỗi Dậy', short: 'Hồi sinh 30 loài khủng long theo tỉ lệ thực trong phòng khách', price: '460.000đ', rating: 114, delay: 'reveal-delay-2' },
  { img: 'https://images.unsplash.com/photo-1537721664796-76f77222a5d0?w=500&q=80', badge: 'Hot', badgeGold: false, name: 'Cơ Thể Con Người', short: 'Bóc tách cơ thể người qua mô hình AR tương tác độ nét cao', price: '390.000đ', rating: 88, delay: 'reveal-delay-3' },
]

const CHAPTERS = [
  { num: '01', title: 'Tán Rừng — Nơi Ánh Sáng Sinh Sống', count: '18 loài · 14 trang' },
  { num: '02', title: 'Lớp Tán Giữa — Vương Quốc Của Linh Trưởng', count: '22 loài · 18 trang' },
  { num: '03', title: 'Tầng Bụi Rậm — Nơi Kẻ Săn Mồi Rình Rập', count: '19 loài · 16 trang' },
  { num: '04', title: 'Lòng Suối — Hệ Sinh Thái Nước Ngọt Nhiệt Đới', count: '16 loài · 14 trang' },
  { num: '05', title: 'Thế Giới Côn Trùng — Những Kỹ Sư Vô Hình', count: '24 loài · 20 trang' },
  { num: '06', title: 'Hoa Và Thụ Phấn — Giao Ước Cổ Xưa', count: '15 loài · 12 trang' },
  { num: '07', title: 'Nấm Và Rễ — Mạng Lưới Ngầm Của Rừng', count: '10 loài · 10 trang' },
  { num: '08', title: 'Rừng Và Con Người — Bảo Tồn Hay Mất Mát', count: 'Đặc biệt · 8 trang' },
]

const REVIEWS_DATA = [
  { initial: 'M', name: 'Minh Anh N.', date: '12 tháng 5, 2026 · Hà Nội', title: 'Con tôi không chịu rời cuốn sách này ra', body: 'Mua cho bé 9 tuổi và thực sự không ngờ lại hay đến vậy. Mỗi tối đều ngồi ôm sách mở AR ra xem, hỏi đủ thứ câu hỏi. AI Tutor trả lời rất tự nhiên, không khô khan như sách giáo khoa. Chất lượng mô hình 3D đẹp hơn mình tưởng nhiều, nhìn thực sự như con vật đang đứng trên bàn.', helpful: 38 },
  { initial: 'T', name: 'Thùy Linh P.', date: '3 tháng 4, 2026 · TP.HCM', title: 'Quà sinh nhật hoàn hảo nhất từ trước đến nay', body: 'Tặng cho cháu 7 tuổi, cháu thích đến mức nhờ tôi đọc cho nghe mỗi đêm rồi cùng quét AR. Phần âm thanh vòm khi con báo gầm thực sự khiến cháu hoảng hồn nhưng rất thích. Sách đóng bìa cứng, giấy dày, in màu cực kỳ sắc nét. Hoàn toàn xứng đáng với giá tiền.', helpful: 24 },
  { initial: 'H', name: 'Hoàng Khải Đ.', date: '19 tháng 3, 2026 · Đà Nẵng', title: 'Giáo viên giới thiệu và tôi không hối hận khi mua', body: 'Con tôi 10 tuổi, giáo viên khoa học ở trường đề xuất dùng sách AR trong giờ học. Mua về thấy nội dung khoa học chính xác, có trích dẫn nguồn rõ ràng. AI Tutor biết điều chỉnh cách giải thích cho phù hợp — khi hỏi bằng tiếng Anh thì trả lời tiếng Anh, rất tiện luyện ngoại ngữ.', helpful: 19 },
]

// ── Icon SVGs ──
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

export default function ProductDetail() {
  const [mainImg, setMainImg] = useState(THUMB_IMGS[0])
  const [activeThumb, setActiveThumb] = useState(0)
  const [imgFading, setImgFading] = useState(false)
  const [qty, setQty] = useState(1)
  const [wishlist, setWishlist] = useState(false)
  const [cartCount, setCartCount] = useState(2)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [openFaq, setOpenFaq] = useState(null)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [backTopVisible, setBackTopVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const heroRef = useRef(null)

  // Scroll effects
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el))

    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
      setProgress(winScroll / height * 100)
      setBackTopVisible(winScroll > 600)

      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom
        setStickyVisible(heroBottom < 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => { window.removeEventListener('scroll', handleScroll); observer.disconnect() }
  }, [])

  const changeImg = (idx) => {
    if (idx === activeThumb) return
    setImgFading(true)
    setTimeout(() => {
      setMainImg(THUMB_IMGS[idx])
      setActiveThumb(idx)
      setImgFading(false)
    }, 200)
  }

  const handleAddToCart = () => {
    if (addedToCart) return
    setAddedToCart(true)
    setCartCount(c => c + 1)
    setTimeout(() => setAddedToCart(false), 1800)
  }

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i)

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
        <a href="#" className="breadcrumb-item">Thiên Nhiên</a>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Bí Mật Rừng Mưa</span>
      </div>

      {/* ── HERO SPLIT ── */}
      <div className="product-hero" id="product-hero" ref={heroRef}>

        {/* LEFT: Gallery */}
        <div className="gallery-wrap reveal-left">
          <div className="gallery-main">
            <img
              src={mainImg}
              alt="Bí Mật Rừng Mưa"
              style={{
                opacity: imgFading ? 0 : 1,
                transform: imgFading ? 'scale(1.03)' : 'scale(1)',
                transition: 'opacity 0.3s ease, transform 0.3s ease'
              }}
            />
            <div className="gallery-badge-group">
              <span className="g-badge gold">Bán chạy</span>
              <span className="g-badge forest">AR + AI</span>
            </div>
            <button className="gallery-ar-btn" onClick={() => alert('Tính năng demo AR sẽ mở camera và nhận diện marker. (Demo UI)')}>
              <div className="gallery-ar-pulse"></div>
              <IconPlay />
              Xem Demo AR
            </button>
          </div>
          <div className="gallery-thumbs">
            {THUMB_IMGS.map((src, i) => (
              <div
                key={i}
                className={`gallery-thumb${activeThumb === i ? ' active' : ''}`}
                onClick={() => changeImg(i)}
              >
                <img src={src.replace('w=900', 'w=200')} alt="" />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Info */}
        <div className="product-info reveal-right">
          <div className="info-eyebrow">
            <div className="info-eyebrow-line"></div>
            <span className="info-eyebrow-text">Bộ Sưu Tập Thiên Nhiên · Phiên bản 2026</span>
          </div>

          <h1 className="product-title-main">Bí Mật<br/><em>Rừng Mưa</em></h1>
          <p className="product-subtitle">Khám phá hệ sinh thái nhiệt đới sống động nhất hành tinh</p>

          <div className="rating-row">
            <div className="stars">
              {'★★★★★'.split('').map((s, i) => <span key={i} className="star">{s}</span>)}
            </div>
            <span className="rating-num">4.9</span>
            <div className="rating-sep"></div>
            <span className="rating-count">247 đánh giá</span>
            <div className="rating-sep"></div>
            <span className="verified-badge">✓ Đã xác minh</span>
          </div>

          <div className="product-tags">
            {['AR Tương Tác', 'AI Tutor', 'Âm Thanh 3D', 'VI / EN', '6–12 Tuổi'].map(t => (
              <span key={t} className="product-tag">{t}</span>
            ))}
          </div>

          <p className="product-desc-main">
            Mở trang sách — rừng mưa hiện ra. Hơn 120 loài động thực vật nhiệt đới trỗi dậy sống động qua công nghệ AR thế hệ mới. AI Tutor thông minh trả lời mọi câu hỏi của trẻ bằng tiếng Việt và tiếng Anh, biến mỗi trang sách thành một cuộc khám phá thực sự.
          </p>

          <div className="quick-specs">
            {[
              ['Độ tuổi', '6–12 tuổi'], ['Mô hình AR', '120+ loài'],
              ['Số trang', '128 trang'], ['Ngôn ngữ', 'VI / EN'],
              ['Kích thước', '21 × 28 cm'], ['Cập nhật nội dung', 'Miễn phí / 24T'],
            ].map(([label, val]) => (
              <div key={label} className="spec-cell">
                <span className="spec-label">{label}</span>
                <span className="spec-val">{val}</span>
              </div>
            ))}
          </div>

          <div className="price-block">
            <div>
              <div className="price-old">450.000đ</div>
              <div className="price-main">390.000đ</div>
            </div>
            <span className="price-save">Tiết kiệm 60.000đ · −13%</span>
          </div>

          <div className="purchase-row">
            <div className="qty-wrap">
              <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <input className="qty-num" type="number" value={qty} readOnly />
              <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
            <button className="btn-add-main" onClick={handleAddToCart}>
              {addedToCart ? <><IconCheck /> Đã thêm vào giỏ!</> : <><IconCart /> Thêm vào giỏ hàng</>}
            </button>
            <button
              className={`btn-wishlist-main${wishlist ? ' active' : ''}`}
              onClick={() => setWishlist(w => !w)}
            >
              <IconHeart filled={wishlist} />
            </button>
          </div>

          <div className="secondary-cta">
            <button className="btn-secondary" onClick={() => alert('Demo AR (Demo UI)')}>
              <IconPlay size={13} /> Xem demo AR
            </button>
            <button className="btn-secondary"><IconShare /> Chia sẻ</button>
            <button className="btn-secondary"><IconSearch /> So sánh</button>
          </div>

          <div className="trust-micro">
            {[
              [<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, 'Giao hàng toàn quốc — miễn phí từ 300k'],
              [<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, 'Bảo hành 12 tháng · Đổi trả trong 30 ngày'],
              [<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, 'Thanh toán an toàn · Mã hoá SSL 256-bit'],
            ].map(([icon, text], i) => (
              <div key={i} className="trust-micro-item">{icon} {text}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MARQUEE ── */}
      <div className="marquee-section" style={{ marginTop: '80px' }}>
        <div className="marquee-track">
          {['120+ Mô Hình AR', 'AI Tutor Thông Minh', 'Âm Thanh 3D Vòm', 'Cập Nhật Nội Dung 24T', 'Hỗ Trợ VI / EN', 'Đánh Giá 4.9 ★'].concat(
            ['120+ Mô Hình AR', 'AI Tutor Thông Minh', 'Âm Thanh 3D Vòm', 'Cập Nhật Nội Dung 24T', 'Hỗ Trợ VI / EN', 'Đánh Giá 4.9 ★']
          ).map((t, i) => (
            <div key={i} className="marquee-item">{t} <div className="marquee-dot"></div></div>
          ))}
        </div>
      </div>

      {/* ── AR SHOWCASE ── */}
      <div className="ar-section">
        <div className="section-header">
          <div className="section-eyebrow">
            <div className="section-eyebrow-line"></div>
            <span className="section-eyebrow-text">Công Nghệ AR</span>
            <div className="section-eyebrow-line"></div>
          </div>
          <h2 className="section-title reveal">Mở Sách —<br/><em>Rừng Hiện Ra</em></h2>
          <p className="section-subtitle reveal reveal-delay-1">
            Công nghệ Augmented Reality thế hệ mới biến từng trang sách thành một cổng thông tin sống động với độ trung thực cao nhất.
          </p>
        </div>

        <div className="ar-showcase reveal">
          {/* AR Visual */}
          <div className="ar-visual">
            <img src="https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=900&q=80" alt="AR Demo" />
            <div className="ar-visual-overlay"></div>
            <div className="ar-visual-ui">
              <div className="ar-hud">
                <div className="hud-corner tl"></div>
                <div className="hud-corner tr"></div>
                <div className="hud-corner bl"></div>
                <div className="hud-corner br"></div>
                <div className="hud-center">
                  <div className="hud-ring"><div className="hud-dot"></div></div>
                </div>
                <div className="hud-scanline"></div>
              </div>
            </div>
            <div className="ar-label-tag">
              <div className="gallery-ar-pulse"></div>
              AR Live Preview
            </div>
          </div>

          {/* AR Features */}
          <div className="ar-features">
            <div style={{ marginBottom: '36px' }}>
              <div className="info-eyebrow">
                <div className="info-eyebrow-line"></div>
                <span className="info-eyebrow-text">Tính Năng Nổi Bật</span>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 300, color: 'var(--forest)', lineHeight: 1.2 }}>
                Trải nghiệm<br/><em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>vượt thời gian</em>
              </h3>
            </div>
            <div className="ar-feature-list">
              {[
                { num: '01', title: 'Mô hình 3D siêu thực', desc: '120+ loài được dựng với độ chi tiết cấp độ bảo tàng — từng vảy, từng lông và màu sắc tái hiện chính xác theo dữ liệu khoa học.' },
                { num: '02', title: 'AI Tutor đa ngôn ngữ', desc: 'Trợ lý AI trả lời câu hỏi bằng tiếng Việt và tiếng Anh, điều chỉnh độ phức tạp theo độ tuổi và cấp độ hiểu biết của từng trẻ.' },
                { num: '03', title: 'Âm thanh không gian 3D', desc: 'Tiếng chim hót, tiếng mưa rừng và âm thanh sinh thái được xử lý vòm 360° — đắm chìm hoàn toàn trong thế giới rừng nhiệt đới.' },
                { num: '04', title: 'Cập nhật nội dung liên tục', desc: 'Miễn phí cập nhật nội dung mới trong 24 tháng — loài mới, câu chuyện mới, thử thách khám phá mới xuất hiện thường xuyên.' },
              ].map(f => (
                <div key={f.num} className="ar-feature-item">
                  <div className="ar-feature-num">{f.num}</div>
                  <div>
                    <div className="ar-feature-title">{f.title}</div>
                    <div className="ar-feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="tabs-section">
        <div className="tabs-nav">
          {[
            { id: 'details', label: 'Chi Tiết Sản Phẩm' },
            { id: 'chapters', label: 'Nội Dung Sách' },
            { id: 'reviews', label: 'Đánh Giá (247)' },
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

        {/* Tab: Details */}
        {activeTab === 'details' && (
          <div className="tab-panel active">
            <div className="details-grid">
              <div>
                <h3 className="details-col-title">Thông Số <em>Kỹ Thuật</em></h3>
                <div className="details-list">
                  {[
                    ['Tên sách', 'Bí Mật Rừng Mưa'], ['Nhà xuất bản', 'Earthoria Publishing'],
                    ['Phiên bản', '2026 Edition'], ['Số trang', '128 trang'],
                    ['Kích thước', '21 × 28 × 1.2 cm'], ['Trọng lượng', '680g'],
                    ['Bìa sách', 'Cứng, chống nước'], ['Giấy in', 'FSC Certified 150gsm'],
                    ['Ngôn ngữ', 'Tiếng Việt / Tiếng Anh'], ['Độ tuổi', '6–12 tuổi'],
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
                    ['Ứng dụng', 'Earthoria AR (miễn phí)'], ['iOS', '14.0 trở lên'],
                    ['Android', '10.0 trở lên'], ['RAM tối thiểu', '3GB'],
                    ['Kết nối', 'Offline 100% sau tải'], ['Dung lượng app', '2.4 GB'],
                    ['Mô hình AR', '120+ loài'], ['AI Tutor', 'Có (cần internet)'],
                    ['Cập nhật nội dung', 'Miễn phí trong 24 tháng'], ['Hỗ trợ', '7 ngày / tuần'],
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

        {/* Tab: Chapters */}
        {activeTab === 'chapters' && (
          <div className="tab-panel active">
            <div style={{ maxWidth: '760px' }}>
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 300, color: 'var(--forest)', marginBottom: '12px' }}>
                  Hành Trình <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>8 Chương</em>
                </h3>
                <p style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--text-muted)' }}>
                  Từ tán rừng trên cao xuống đến lớp đất mục dưới cùng — mỗi chương là một tầng sinh thái riêng biệt với hệ thống loài và câu chuyện độc lập.
                </p>
              </div>
              <div className="chapter-list">
                {CHAPTERS.map(ch => (
                  <div key={ch.num} className="chapter-item">
                    <div className="chapter-num">{ch.num}</div>
                    <div className="chapter-title">{ch.title}</div>
                    <span className="chapter-count">{ch.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Reviews */}
        {activeTab === 'reviews' && (
          <div className="tab-panel active">
            <div className="reviews-layout">
              <div className="reviews-summary">
                <div className="reviews-big-num">4.9</div>
                <div className="reviews-stars-big">
                  {'★★★★★'.split('').map((s, i) => <span key={i} className="star">{s}</span>)}
                </div>
                <div className="reviews-total">Dựa trên 247 đánh giá</div>
                <div className="rating-bars">
                  {[['5★', '88%', 88], ['4★', '9%', 9], ['3★', '2%', 2], ['2★', '1%', 1], ['1★', '0%', 0]].map(([label, pct, w]) => (
                    <div key={label} className="rating-bar-row">
                      <span>{label}</span>
                      <div className="rating-bar-track">
                        <div className="rating-bar-fill" style={{ width: `${w}%` }}></div>
                      </div>
                      <span>{pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="review-list">
                {REVIEWS_DATA.map((r, i) => (
                  <div key={i} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">{r.initial}</div>
                        <div>
                          <div className="reviewer-name">{r.name}</div>
                          <div className="reviewer-date">{r.date}</div>
                        </div>
                      </div>
                      <div className="review-stars">
                        {'★★★★★'.split('').map((s, j) => <span key={j} className="star">{s}</span>)}
                      </div>
                    </div>
                    <div className="review-title">{r.title}</div>
                    <div className="review-body">{r.body}</div>
                    <div className="review-helpful">
                      <span>Đánh giá này có hữu ích không?</span>
                      <button className="helpful-btn">👍 Có ({r.helpful})</button>
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
                    style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '22px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}
                  >
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', fontWeight: 400, color: 'var(--forest)' }}>{faq.q}</span>
                    <span style={{ color: 'var(--gold)', fontSize: '20px', flexShrink: 0, transition: 'transform 0.3s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                  </button>
                  <div style={{
                    maxHeight: openFaq === i ? '200px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.4s ease'
                  }}>
                    <p style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--text-muted)', paddingBottom: '20px', fontWeight: 300 }}>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RELATED PRODUCTS ── */}
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
            {RELATED.map((p, i) => (
              <RelatedCard key={i} {...p} onAddCart={() => setCartCount(c => c + 1)} />
            ))}
          </div>
        </div>
      </div>

      {/* ── STICKY BAR ── */}
      <div className={`sticky-bar${stickyVisible ? ' visible' : ''}`}>
        <div className="sticky-bar-inner">
          <div>
            <div className="sticky-product-name">Bí Mật <em>Rừng Mưa</em></div>
            <div className="sticky-stars">
              {'★★★★★'.split('').map((s, i) => <span key={i} className="star">{s}</span>)}
              <span>4.9 · 247 đánh giá</span>
            </div>
          </div>
          <div className="sticky-price">390.000đ</div>
          <button className="sticky-btn" onClick={handleAddToCart}>
            <IconCart size={14} /> Thêm vào giỏ hàng
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

// ── Related Card ──
function RelatedCard({ img, badge, badgeGold, name, short, price, rating, delay, onAddCart }) {
  const [added, setAdded] = useState(false)

  const handleAdd = (e) => {
    e.stopPropagation()
    if (added) return
    setAdded(true)
    onAddCart()
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div className={`product-card reveal ${delay}`}>
      <div className="product-img-wrap">
        <img src={img} alt={name} />
        <div className="product-overlay">
          <button className="overlay-btn">Xem chi tiết</button>
        </div>
        <span className={`product-card-badge${badgeGold ? ' gold' : ''}`}>{badge}</span>
      </div>
      <div className="product-body">
        <div className="product-rating-mini">
          {'★★★★★'.split('').map((s, i) => <span key={i} className="star">{s}</span>)}
          <span>({rating})</span>
        </div>
        <div className="product-name">{name}</div>
        <div className="product-short">{short}</div>
        <div className="product-card-footer">
          <span className="product-price">{price}</span>
          <button className="add-cart-mini" onClick={handleAdd}>
            {added
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              : <IconCart size={13} />
            }
          </button>
        </div>
      </div>
    </div>
  )
}