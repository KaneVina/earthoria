import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookService } from '../services/bookService'
import { useCartStore } from '../store/cartStore'
import { formatPrice, getBookUrl } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function Home() {
// Thêm useRef cho cta section
const ctaRef = useRef(null)

// Thêm useEffect firefly SAU các useEffect hiện có
useEffect(() => {
  const section = ctaRef.current
  if (!section) return

  const configs = [
    { x:'8%',  y:'20%', dx1:'40px',  dy1:'-30px', dx2:'20px',  dy2:'60px',  dx3:'-30px', dy3:'20px',  dur:'7s',  opacity:'0.9' },
    { x:'15%', y:'70%', dx1:'-20px', dy1:'-50px', dx2:'50px',  dy2:'-20px', dx3:'10px',  dy3:'40px',  dur:'9s',  opacity:'0.7' },
    { x:'25%', y:'40%', dx1:'30px',  dy1:'40px',  dx2:'-40px', dy2:'20px',  dx3:'20px',  dy3:'-50px', dur:'11s', opacity:'0.85'},
    { x:'40%', y:'15%', dx1:'-50px', dy1:'30px',  dx2:'30px',  dy2:'50px',  dx3:'-20px', dy3:'-30px', dur:'8s',  opacity:'0.6' },
    { x:'55%', y:'80%', dx1:'20px',  dy1:'-60px', dx2:'-30px', dy2:'-20px', dx3:'50px',  dy3:'30px',  dur:'13s', opacity:'0.8' },
    { x:'65%', y:'30%', dx1:'-40px', dy1:'50px',  dx2:'60px',  dy2:'-30px', dx3:'-20px', dy3:'40px',  dur:'10s', opacity:'0.75'},
    { x:'75%', y:'60%', dx1:'50px',  dy1:'-40px', dx2:'-20px', dy2:'50px',  dx3:'30px',  dy3:'-20px', dur:'12s', opacity:'0.9' },
    { x:'85%', y:'25%', dx1:'-30px', dy1:'-20px', dx2:'20px',  dy2:'-50px', dx3:'-50px', dy3:'30px',  dur:'9s',  opacity:'0.65'},
    { x:'90%', y:'75%', dx1:'20px',  dy1:'30px',  dx2:'-50px', dy2:'20px',  dx3:'30px',  dy3:'-40px', dur:'14s', opacity:'0.8' },
    { x:'50%', y:'50%', dx1:'-60px', dy1:'-40px', dx2:'40px',  dy2:'-60px', dx3:'60px',  dy3:'40px',  dur:'16s', opacity:'0.5' },
    { x:'33%', y:'85%', dx1:'40px',  dy1:'-20px', dx2:'-20px', dy2:'-40px', dx3:'10px',  dy3:'30px',  dur:'11s', opacity:'0.7' },
    { x:'70%', y:'10%', dx1:'-20px', dy1:'60px',  dx2:'40px',  dy2:'20px',  dx3:'-30px', dy3:'-40px', dur:'8s',  opacity:'0.85'},
  ]

  const fireflies = configs.map((c, i) => {
    const el = document.createElement('div')
    el.className = 'firefly'
    el.style.cssText = `
      --x:${c.x}; --y:${c.y};
      --dx1:${c.dx1}; --dy1:${c.dy1};
      --dx2:${c.dx2}; --dy2:${c.dy2};
      --dx3:${c.dx3}; --dy3:${c.dy3};
      --dur:${c.dur};
      --max-opacity:${c.opacity};
      animation-delay:${(i * 1.3).toFixed(1)}s;
    `
    section.appendChild(el)
    return el
  })

  return () => fireflies.forEach(el => el.remove())
}, []) // chạy 1 lần sau khi render


  const { addToCart } = useCartStore()

  const { data: featuredBooks = [] } = useQuery({
    queryKey: ['featured-books'],
    queryFn: () => bookService.getFeatured().then(r => r.data.data)
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => bookService.getCategories().then(r => r.data.data)
  })

  // Counter animation
  useEffect(() => {
    const counters = document.querySelectorAll('.stat-count')
    counters.forEach(counter => {
      const target = +counter.dataset.target
      if (!target) return
      let count = 0
      const step = target / 100
      const timer = setInterval(() => {
        count += step
        if (count >= target) { count = target; clearInterval(timer) }
        counter.textContent = Math.round(count).toLocaleString('vi-VN')
      }, 20)
    })
  }, [])

  // Reveal on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [featuredBooks])

  const handleAddToCart = async (hashId) => {
    try {
      await addToCart(hashId, 1)
      toast.success('Đã thêm vào giỏ hàng')
    } catch {
      toast.error('Vui lòng đăng nhập để mua hàng')
    }
  }

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <div className="eyebrow-line"></div>
            <span className="eyebrow-text">Sách Giáo Dục Tương Tác AR × AI</span>
          </div>
          <h1 className="hero-headline reveal">
            Mở Sách —<br/>
            <em>Mở Ra</em><br/>
            Thế Giới
          </h1>
          <p className="hero-sub reveal reveal-delay-1">
            Hành trình khám phá thiên nhiên qua lăng kính công nghệ thực tế tăng cường và trí tuệ nhân tạo.
          </p>
          <div className="hero-cta-group reveal reveal-delay-2">
            <Link to="/shop">
              <button className="cta-main">
                Khám phá bộ sưu tập
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </Link>
            <button className="cta-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Xem demo AR
            </button>
          </div>
        </div>

        <div className="hero-right">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqQsaKpsl853jkb7LVw_tM_N8sMdr2NavI4-ZchB0m3ruBxPqPN9Nn1PjntGV8mbHhTCbatFXPkgD9K2O337Rz8tyz54di0oxbMeLKFo9EKZpeTCdJSA9WaYDYPY48Qyuj4ia-Qyx2BSlkrdByVMyYwY45va3kPZc_VLc3XAV5cTeIrzFVJefKSJq-LlyJKf2Hkxp5_ggisUBAX7ScOO6BIoEeLX_PYCXzQsMXIHjj5TOJSHtXbyrwJHYS68H_vFC9uwDrV6Vbqik"
            alt="Book"
            className="hero-right-img"
          />
          <div className="hero-right-overlay"></div>
          <div className="hero-floatcard">
            <div className="floatcard-label">Đồng hành cùng</div>
            <div className="floatcard-value">1.000<span style={{fontSize:'22px',color:'var(--gold)'}}>+</span></div>
            <div className="floatcard-desc">gia đình khám phá mỗi ngày</div>
            <div style={{display:'flex',gap:'8px',marginTop:'16px',paddingTop:'16px',borderTop:'0.5px solid var(--border-gold)'}}>
              <div style={{flex:1,textAlign:'center'}}>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:'20px',color:'var(--forest)',fontWeight:300}}>5★</div>
                <div style={{fontSize:'9px',letterSpacing:'0.14em',color:'var(--text-muted)',textTransform:'uppercase',marginTop:'2px'}}>Đánh giá</div>
              </div>
              <div style={{width:'0.5px',background:'var(--border)'}}></div>
              <div style={{flex:1,textAlign:'center'}}>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:'20px',color:'var(--forest)',fontWeight:300}}>3</div>
                <div style={{fontSize:'9px',letterSpacing:'0.14em',color:'var(--text-muted)',textTransform:'uppercase',marginTop:'2px'}}>Chủ đề</div>
              </div>
              <div style={{width:'0.5px',background:'var(--border)'}}></div>
              <div style={{flex:1,textAlign:'center'}}>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:'20px',color:'var(--forest)',fontWeight:300}}>AR</div>
                <div style={{fontSize:'9px',letterSpacing:'0.14em',color:'var(--text-muted)',textTransform:'uppercase',marginTop:'2px'}}>Công nghệ</div>
              </div>
            </div>
          </div>
          <div className="hero-ornament"></div>
        </div>

        <div className="scroll-hint">
          <div className="scroll-line"></div>
          <span>Khám phá</span>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-section">
        <div className="marquee-track">
          {['Sách AR Thiên Nhiên','AI Storytelling','Mô Hình 3D','Giáo Dục Sinh Thái','Thực Tế Tăng Cường','Khám Phá Thiên Nhiên',
            'Sách AR Thiên Nhiên','AI Storytelling','Mô Hình 3D','Giáo Dục Sinh Thái','Thực Tế Tăng Cường','Khám Phá Thiên Nhiên'
          ].map((item, i) => (
            <div className="marquee-item" key={i}>
              {item} <div className="marquee-dot"></div>
            </div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section className="stats-section reveal">
        <div className="stats-inner">
          {[
            { label: 'Trẻ em khám phá', value: '1.000+', count: 1000 },
            { label: 'Chủ đề sinh thái', value: '5', count: 5, gold: true },
            { label: 'Tương tác thực tế', value: 'AI+AR', noCount: true },
            { label: 'Giá trị giáo dục', value: '100%', count: 100 }
          ].map((stat, i) => (
            <div className="stat-item" key={i} style={{'--bar-width': '85%'}}>
              <div className="stat-top">
                <div style={{fontSize:'9px',letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)'}}>
                  {stat.label}
                </div>
              </div>
              <div className={`stat-number ${stat.gold ? 'stat-gold' : ''}`}>
                {stat.noCount ? stat.value : (
                  <><span className="stat-count" data-target={stat.count}>0</span>{stat.value.replace(/\d+/g,'')}</>
                )}
              </div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-bar"><div className="stat-bar-fill"></div></div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="how-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line"></div>
              <span className="section-eyebrow-text">Cách Hoạt Động</span>
              <div className="section-eyebrow-line"></div>
            </div>
            <h2 className="section-title">Hành Trình <em>Ba Bước</em></h2>
            <p className="section-subtitle">Thế giới tự nhiên sẽ hiện ra sống động ngay trước mắt bé chỉ trong vài giây.</p>
          </div>
          <div className="how-grid">
            {[
              { num: '01', title: 'Mở Sách', desc: 'Bắt đầu hành trình với những trang sách minh họa tuyệt đẹp về thế giới tự nhiên.' },
              { num: '02', title: 'Quét AR', desc: 'Sử dụng ứng dụng Earthoria để quét các trang sách có biểu tượng AR đặc biệt.' },
              { num: '03', title: 'Tương Tác 3D', desc: 'Ngắm nhìn sinh vật sống động hiện ra trong không gian thực và trò chuyện với AI.' }
            ].map((step, i) => (
              <div className={`how-step reveal reveal-delay-${i+1}`} key={i}>
                <span className="step-num">{step.num} — Bước {i+1}</span>
                <div className="step-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="products-section">
        <div className="products-inner">
          <div className="products-top reveal">
            <div>
              <div className="section-eyebrow" style={{marginBottom:'16px'}}>
                <div className="section-eyebrow-line"></div>
                <span className="section-eyebrow-text">Bộ Sưu Tập</span>
              </div>
              <h2 className="section-title" style={{textAlign:'left'}}>Tuyển Tập <em>Sinh Thái</em></h2>
            </div>
            <Link to="/shop" className="view-all">
              Xem toàn bộ
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          <div className="products-grid">
            {featuredBooks.length === 0 ? (
              [1,2,3].map(i => (
                <div key={i} className="product-card" style={{minHeight:'400px',opacity:0.5}}>
                  <div className="product-img-wrap" style={{background:'var(--pale)'}}></div>
                  <div className="product-body">
                    <div style={{height:'20px',background:'var(--pale)',borderRadius:'4px',marginBottom:'8px'}}></div>
                    <div style={{height:'14px',background:'var(--pale)',borderRadius:'4px'}}></div>
                  </div>
                </div>
              ))
            ) : (
              featuredBooks.map(book => (
                <div className="product-card reveal" key={book.id}>
                  <div className="product-img-wrap">
                    <img src={book.coverImage || 'https://via.placeholder.com/400x320'} alt={book.title}/>
                    <div className="product-img-overlay">
                      <Link to={getBookUrl(book.slug, book.hashId)}>
                        <button className="overlay-btn primary">Xem chi tiết</button>
                      </Link>
                      <button className="overlay-btn" onClick={() => handleAddToCart(book.hashId)}>
                        Thêm vào giỏ
                      </button>
                    </div>
                    {book.isFeatured && <span className="product-badge gold">Bán Chạy</span>}
                    <span className="product-category">{book.category?.name}</span>
                  </div>
                  <div className="product-body">
                    <h3 className="product-title">{book.title}</h3>
                    <p className="product-desc">{book.description?.slice(0,100)}...</p>
                    <div className="product-footer">
                      <span className="product-price">{formatPrice(book.salePrice || book.price)}</span>
                      <button className="add-cart" onClick={() => handleAddToCart(book.hashId)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="values-section">
        <div className="values-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line"></div>
              <span className="section-eyebrow-text">Giá Trị Cốt Lõi</span>
              <div className="section-eyebrow-line"></div>
            </div>
            <h2 className="section-title">Phát Triển <em>Toàn Diện</em></h2>
            <p className="section-subtitle">Thiết kế dựa trên phương pháp giáo dục hiện đại.</p>
          </div>
          <div className="values-grid">
            {[
              { num:'01', title:'Khơi Dậy Sáng Tạo', desc:'Hình ảnh 3D chân thực kích thích trí tưởng tượng.' },
              { num:'02', title:'Tư Duy Phản Biện', desc:'Thông qua tương tác hỏi đáp với AI, trẻ rèn luyện kỹ năng phân tích.' },
              { num:'03', title:'Kiến Thức Bền Vững', desc:'Xây dựng tình yêu thiên nhiên và ý thức bảo vệ môi trường.' }
            ].map((v, i) => (
              <div className={`value-item reveal reveal-delay-${i+1}`} key={i}>
                <div className="value-num">{v.num}</div>
                <h3 className="value-title">{v.title}</h3>
                <p className="value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="cta-section" ref={ctaRef}>
        <div className="cta-bg-text">Earthoria</div>
        <span className="cta-eyebrow reveal">Bắt Đầu Hành Trình</span>
        <h2 className="cta-headline reveal">
          Mỗi trang sách là một cánh cửa —<br/>
          <em>Mở ra thế giới mới</em>
        </h2>
        <p className="cta-sub reveal">Hãy để Earthoria đồng hành cùng bé trên hành trình khám phá tri thức.</p>
        <div className="cta-btns reveal">
          <Link to="/register">
            <button className="cta-btn-main">Tham gia ngay hôm nay</button>
          </Link>
          <Link to="/shop">
            <button className="cta-btn-out">Khám phá thư viện</button>
          </Link>
        </div>
      </section>
    </>
  )
}