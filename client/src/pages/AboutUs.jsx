import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function AboutUs() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

    // Values sticky number update
    const rows = document.querySelectorAll('.about-value-row[data-val-num]')
    const stickyNum = document.getElementById('about-val-num')
    if (rows.length && stickyNum) {
      const valObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const num = e.target.dataset.valNum
            if (num) stickyNum.textContent = num
          }
        })
      }, { threshold: 0.6 })
      rows.forEach(r => valObserver.observe(r))
    }

    return () => observer.disconnect()
  }, [])

  const handleFormSubmit = (e) => {
    e.preventDefault()
    const btn = e.target.querySelector('.form-submit')
    const original = btn.innerHTML
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg> Đã gửi thành công!'
    btn.style.background = 'var(--forest-mid)'
    setTimeout(() => {
      btn.innerHTML = original
      btn.style.background = ''
      e.target.reset()
    }, 3200)
  }

  return (
    <>
      {/* ABOUT HERO */}
      <section className="about-hero">
        <div className="about-hero-left">
          <div className="about-hero-eyebrow">
            <div className="about-hero-eyebrow-line"></div>
            <span className="about-hero-eyebrow-text">Về Chúng Tôi</span>
          </div>
          <h1 className="about-hero-headline reveal">
            Chúng Tôi Là<br/>
            <em>Earthoria</em> —<br/>
            Nơi Sách Gặp<br/>
            Công Nghệ
          </h1>
          <p className="about-hero-sub reveal reveal-delay-1">
            Một nhóm sinh viên FPT University Campus Cần Thơ với niềm đam mê cháy bỏng về giáo dục sáng tạo và công nghệ tương lai. Chúng tôi tin rằng mỗi đứa trẻ xứng đáng được khám phá thế giới theo cách riêng của mình.
          </p>
          <div className="about-hero-meta reveal reveal-delay-2">
            {[
              { label: 'Thành lập', value: '25', suffix: '/05/2026' },
              { label: 'Thành viên', value: '6', suffix: ' người' },
              { label: 'Trụ sở', value: 'Cần Thơ', suffix: ', VN', small: true }
            ].map((m, i) => (
              <div className="about-meta-item" key={i}>
                <div className="about-meta-label">{m.label}</div>
                <div className="about-meta-value" style={m.small ? { fontSize: '14px' } : {}}>
                  {m.value}<span>{m.suffix}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="about-hero-right">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqQsaKpsl853jkb7LVw_tM_N8sMdr2NavI4-ZchB0m3ruBxPqPN9Nn1PjntGV8mbHhTCbatFXPkgD9K2O337Rz8tyz54di0oxbMeLKFo9EKZpeTCdJSA9WaYDYPY48Qyuj4ia-Qyx2BSlkrdByVMyYwY45va3kPZc_VLc3XAV5cTeIrzFVJefKSJq-LlyJKf2Hkxp5_ggisUBAX7ScOO6BIoEeLX_PYCXzQsMXIHjj5TOJSHtXbyrwJHYS68H_vFC9uwDrV6Vbqik" alt="Earthoria team"/>
          <div className="about-hero-right-overlay"></div>
          <div className="about-hero-tag reveal reveal-delay-1">
            <div className="about-hero-tag-label">Dự án sinh viên — EXE101</div>
            {[
              'FPT University Campus Cần Thơ',
              'Summer 2026 · Group 05',
              'Lớp EXE101_G03_SU26'
            ].map((t, i) => (
              <div className="about-hero-tag-line" key={i}>
                <div className="about-hero-tag-dot"></div>
                <span className="about-hero-tag-text">{t}</span>
              </div>
            ))}
          </div>
          <span className="about-hero-vertical-text">EARTHORIA — EARTH &amp; STORY</span>
        </div>
      </section>

      {/* MISSION */}
      <section className="mission-section">
        <div className="mission-inner">
          <div className="mission-grid">
            <div className="mission-left reveal">
              <div className="section-eyebrow" style={{ justifyContent: 'flex-start', marginBottom: '32px' }}>
                <div className="section-eyebrow-line"></div>
                <span className="section-eyebrow-text">Sứ Mệnh</span>
              </div>
              <blockquote className="mission-quote">
                "Chúng tôi không chỉ tạo ra một cuốn sách —<br/>chúng tôi tạo ra một <em>cánh cửa</em> để trẻ em bước vào thế giới tri thức."
              </blockquote>
              <p className="mission-desc">
                Trong bối cảnh công nghệ số phát triển vũ bão, trẻ em ngày càng bị thu hút bởi các thiết bị điện tử và nội dung giải trí ngắn thay vì đọc sách. Earthoria ra đời từ trăn trở đó — để tái kết nối tình yêu đọc sách với sức mạnh của AI và Thực tế Tăng cường.
              </p>
              <p className="mission-desc">
                Chúng tôi tin rằng khi công nghệ được sử dụng đúng mục đích, nó không chỉ không làm hại việc học mà còn khuếch đại khả năng khám phá tự nhiên của trẻ lên gấp nhiều lần.
              </p>
              <div className="mission-signature">
                <div className="mission-sig-line"></div>
                <span className="mission-sig-text">Nguyễn Đoàn Quốc Thái — CEO, Earthoria</span>
              </div>
            </div>

            <div className="mission-right reveal reveal-delay-1">
              {[
                {
                  title: 'Tầm Nhìn',
                  desc: 'Trở thành nền tảng giáo dục tương tác hàng đầu Việt Nam, nơi mỗi cuốn sách là một hệ sinh thái học tập kết hợp AI, AR và trải nghiệm thực tế cho trẻ em 5–12 tuổi.',
                  icon: <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>,
                  icon2: <circle cx="12" cy="12" r="3"/>
                },
                {
                  title: 'Sứ Mệnh',
                  desc: 'Trao cho trẻ em Việt Nam công cụ học tập tiên tiến nhất — kết hợp giữa trang sách truyền thống và công nghệ số hiện đại — để nuôi dưỡng trí tò mò, sáng tạo và tình yêu thiên nhiên.',
                  icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                },
                {
                  title: 'Giá Trị',
                  desc: 'Đặt trải nghiệm trẻ em lên trên hết. Mọi quyết định sản phẩm — từ độ khó của câu đố, màu sắc minh họa đến cách AI trả lời câu hỏi — đều được thiết kế với tiêu chí "phù hợp với trẻ nhất có thể".',
                  icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                },
                {
                  title: 'Mục Tiêu',
                  desc: 'Trong giai đoạn MVP, đưa sản phẩm đến tay 1.000+ gia đình, thu thập phản hồi thực tế và hoàn thiện hệ sinh thái học tập cho các lứa tuổi và chủ đề tiếp theo.',
                  icon: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>
                }
              ].map((p, i) => (
                <div className="mission-pillar" key={i}>
                  <div className="mission-pillar-header">
                    <h3 className="mission-pillar-title">{p.title}</h3>
                    <div className="mission-pillar-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {p.icon}
                        {p.icon2}
                      </svg>
                    </div>
                  </div>
                  <p className="mission-pillar-text">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STORY / TIMELINE */}
      <section className="story-section">
        <div className="story-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line" style={{ background: 'rgba(74,158,63,0.5)' }}></div>
              <span className="section-eyebrow-text">Hành Trình</span>
              <div className="section-eyebrow-line" style={{ background: 'rgba(74,158,63,0.5)' }}></div>
            </div>
            <h2 className="section-title" style={{ color: 'var(--ivory)' }}>Câu Chuyện <em>Earthoria</em></h2>
            <p className="section-subtitle" style={{ color: 'rgba(250,248,243,0.5)' }}>Từ một ý tưởng trong lớp học đến sản phẩm giáo dục công nghệ đầy tham vọng.</p>
          </div>

          <div className="story-timeline">
            {[
              {
                date: 'Tháng 5', dateSub: 'Tuần 1 · 2026',
                title: 'Khởi Nguồn Ý Tưởng',
                desc: 'Trong tiết học EXE101, nhóm nhận ra một khoảng trống lớn trên thị trường: sách giáo dục truyền thống không đủ hấp dẫn với trẻ em thời đại số, trong khi các ứng dụng học tập thiếu chiều sâu kiến thức. Earthoria được thai nghén từ chính khoảng trống đó.',
                tag: 'Nghiên cứu thị trường', delay: ''
              },
              {
                date: '20/05', dateSub: 'Ngày thành lập',
                title: <>Earthoria Ra Đời &amp; Định Hình <em>Thương Hiệu</em></>,
                desc: 'Nhóm chính thức đặt tên "Earthoria" — kết hợp Earth (Trái Đất) và Story (Câu Chuyện). Logo mang hình lá cây tích hợp chữ E được thiết kế, thể hiện ba giá trị cốt lõi: Education, Environment và Exploration. Website earthoria.id.vn và fanpage Facebook được khai trương.',
                tag: 'Brand Identity hoàn thiện', delay: 'reveal-delay-1'
              },
              {
                date: 'Tuần 2–3', dateSub: 'Thiết kế nội dung',
                title: 'Thiết Kế Nội Dung & Hệ Thống Câu Đố',
                desc: 'Nhóm CPO Lê Tuân và CDO Lê Anh Song Đường dẫn dắt giai đoạn thiết kế nội dung cho cuốn sách đầu tiên với chủ đề "Bảo vệ Trái Đất". Hệ thống câu đố, trang trả lời và nội dung học mở rộng được xây dựng cho 15–20 trang, kèm QR code liên kết AR.',
                tag: 'Content manuscript hoàn thành', delay: 'reveal-delay-2'
              },
              {
                date: 'Tuần 3–4', dateSub: 'Phát triển kỹ thuật',
                title: <>Tích Hợp <em>AI &amp; AR</em> — Trái Tim Sản Phẩm</>,
                desc: 'CTO Nguyễn Phúc Khang và team bắt đầu phát triển hai công nghệ cốt lõi: Trợ lý AI đóng vai nhà tự nhiên học ảo, giải đáp câu hỏi bằng ngôn ngữ phù hợp lứa tuổi. Song song đó, 5–10 mô hình AR 3D đầu tiên về động vật và môi trường tự nhiên được hoàn thiện.',
                tag: 'AI & AR prototype sẵn sàng', delay: ''
              },
              {
                date: 'Tuần 5–6', dateSub: 'MVP hoàn thiện',
                title: 'MVP Ra Mắt — Kiểm Nghiệm Thực Tế',
                desc: 'Sản phẩm MVP hoàn chỉnh được đưa vào kiểm thử với 10–20 người dùng thực tế gồm học sinh tiểu học, phụ huynh và sinh viên FPT. Nhóm thu thập phản hồi về độ rõ ràng nội dung, mức độ tương tác AR, hiệu quả AI và ý định mua hàng để cải tiến sản phẩm.',
                tag: 'User testing report', delay: 'reveal-delay-1'
              },
              {
                date: 'Tháng 6', dateSub: 'Hiện tại',
                title: <>Bước Tiếp Theo — <em>Hướng Tới Tương Lai</em></>,
                desc: 'Sau giai đoạn MVP, Earthoria hướng tới mở rộng nội dung sang các chủ đề đại dương, văn hóa và di sản. Nền tảng AI được nâng cấp cá nhân hóa hành trình học theo từng trẻ. Mục tiêu dài hạn: xây dựng hệ sinh thái giáo dục số tích hợp toàn diện nhất dành cho trẻ em Việt Nam.',
                tag: 'Expansion roadmap · Đang triển khai', delay: 'reveal-delay-2'
              }
            ].map((ev, i) => (
              <div className={`story-event reveal ${ev.delay}`} key={i}>
                <div className="story-event-date">
                  {ev.date}<span>{ev.dateSub}</span>
                </div>
                <div className="story-event-body">
                  <h3 className="story-event-title">{ev.title}</h3>
                  <p className="story-event-desc">{ev.desc}</p>
                  <span className="story-event-tag">
                    <span className="story-event-tag-dot"></span> {ev.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="team-section">
        <div className="team-inner">
          <div className="team-intro">
            <div className="reveal">
              <div className="section-eyebrow" style={{ justifyContent: 'flex-start', marginBottom: '20px' }}>
                <div className="section-eyebrow-line"></div>
                <span className="section-eyebrow-text">Đội Ngũ</span>
              </div>
              <h2 className="section-title" style={{ textAlign: 'left' }}>Những Người <em>Kiến Tạo</em><br/>Earthoria</h2>
              <p className="section-subtitle" style={{ textAlign: 'left', marginLeft: 0, marginTop: '20px' }}>
                Sáu sinh viên FPT với năng lực đa dạng từ thiết kế, lập trình đến marketing — cùng nhau đặt nền móng cho một sản phẩm giáo dục đột phá.
              </p>
            </div>
            <div className="team-intro-right reveal reveal-delay-1">
              {[
                { num: '6', suffix: '+', label: 'Chuyên môn kết hợp' },
                { num: '2', suffix: ' tháng', label: 'Thời gian phát triển MVP' },
                { num: '1', suffix: 'st', label: 'Dự án startup AI+AR' }
              ].map((s, i) => (
                <div className="team-intro-stat" key={i}>
                  <div className="team-intro-stat-num">{s.num}<span>{s.suffix}</span></div>
                  <div className="team-intro-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CEO */}
          <div className="team-card team-card-ceo reveal">
            <div>
              <div className="team-card-role">CEO — Chief Executive Officer</div>
              <div className="team-avatar">
                <div className="team-avatar-letter">T</div>
                <div className="team-avatar-ring"></div>
              </div>
            </div>
            <div>
              <div className="team-name">Nguyễn Đoàn Quốc Thái</div>
              <div className="team-code">CS191282 · FPT University Cần Thơ</div>
              <p className="team-card-desc">Người đề xuất ý tưởng dự án, định hướng chiến lược và là linh hồn của Earthoria. Phụ trách toàn bộ quản lý dự án, phân công nhiệm vụ, giám sát tiến độ và đại diện nhóm trong mọi buổi báo cáo với giảng viên và mentor. Trực tiếp biên soạn và hoàn thiện báo cáo dự án.</p>
              <div className="team-card-skills">
                {['Project Management', 'Strategic Planning', 'Content Development', 'Team Leadership'].map(s => (
                  <span className="skill-tag" key={s}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
            {[
              { role: 'COO — Operations', name: 'Nguyễn Việt Mỹ Hương', code: 'CS191212', letter: 'H', desc: 'Lập kế hoạch dự án, điều phối hoạt động giữa các bộ phận và đảm bảo tiến độ thực thi hiệu quả. Đóng vai trò kết nối và quản lý workflow toàn nhóm.', skills: ['Operations', 'Planning', 'Coordination'], delay: 'reveal-delay-1', border: { borderTop: 'none' } },
              { role: 'CDO — Design', name: 'Lê Anh Song Đường', code: 'CE190621', letter: 'D', desc: 'Định hướng visual toàn bộ dự án: thiết kế logo, layout sách, minh họa và slide thuyết trình. Đảm bảo tính nhất quán thẩm mỹ trên mọi ấn phẩm.', skills: ['Visual Design', 'Illustration', 'Branding'], delay: 'reveal-delay-2', border: { borderTop: 'none', borderRight: 'none', borderLeft: 'none' } },
              { role: 'CTO — Technology', name: 'Nguyễn Phúc Khang', code: 'CE181578', letter: 'K', desc: 'Phát triển và quản lý công nghệ AI, AR tích hợp vào sách. Xây dựng mô hình 3D, hệ thống AI tương tác và đảm bảo trải nghiệm người dùng liền mạch.', skills: ['AR/3D Dev', 'AI Integration', 'Web Dev'], delay: 'reveal-delay-3', border: { borderTop: 'none' } },
            ].map((m, i) => (
              <div className={`team-card reveal ${m.delay}`} style={m.border} key={i}>
                <div className="team-card-role">{m.role}</div>
                <div className="team-avatar">
                  <div className="team-avatar-letter">{m.letter}</div>
                  <div className="team-avatar-ring"></div>
                </div>
                <div className="team-name">{m.name}</div>
                <div className="team-code">{m.code}</div>
                <p className="team-card-desc">{m.desc}</p>
                <div className="team-card-skills">
                  {m.skills.map(s => <span className="skill-tag" key={s}>{s}</span>)}
                </div>
              </div>
            ))}
          </div>

          {/* Row 3 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
            {[
              { role: 'CMO — Marketing', name: 'Lữ Quốc Tài', code: 'CS191616', letter: 'L', desc: 'Nghiên cứu thị trường, phân tích khách hàng mục tiêu và xây dựng chiến lược marketing. Quản lý fanpage và các chiến dịch truyền thông cho Earthoria.', skills: ['Market Research', 'Social Media', 'Strategy'], delay: 'reveal-delay-1', border: { borderTop: 'none' } },
              { role: 'CPO — Product', name: 'Lê Tuân', code: 'CE180824', letter: 'T', desc: 'Phát triển concept và chiến lược nội dung sách. Thiết kế hệ thống câu đố, hoạt động tương tác và đề xuất tích hợp AI & AR vào trải nghiệm học tập.', skills: ['Product Dev', 'Content Design', 'UX Research'], delay: 'reveal-delay-2', border: { borderTop: 'none', borderRight: 'none', borderLeft: 'none' } },
            ].map((m, i) => (
              <div className={`team-card reveal ${m.delay}`} style={m.border} key={i}>
                <div className="team-card-role">{m.role}</div>
                <div className="team-avatar">
                  <div className="team-avatar-letter">{m.letter}</div>
                  <div className="team-avatar-ring"></div>
                </div>
                <div className="team-name">{m.name}</div>
                <div className="team-code">{m.code}</div>
                <p className="team-card-desc">{m.desc}</p>
                <div className="team-card-skills">
                  {m.skills.map(s => <span className="skill-tag" key={s}>{s}</span>)}
                </div>
              </div>
            ))}
            <div className="team-card reveal reveal-delay-3" style={{ borderTop: 'none', background: 'linear-gradient(135deg,#0d3330 0%,#1a5c52 100%)', borderColor: 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '16px', cursor: 'default' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--gold)' }}>Cùng Nhau</div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '36px', fontWeight: 300, color: 'var(--ivory)', lineHeight: 1 }}>6</div>
              <div style={{ width: '32px', height: '0.5px', background: 'rgba(74,158,63,0.5)' }}></div>
              <div style={{ fontSize: '13px', color: 'rgba(250,248,243,0.55)', fontWeight: 300, maxWidth: '160px', lineHeight: 1.7 }}>Trí tuệ và đam mê<br/>kết hợp thành một</div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['AI', 'AR', 'EDU'].map(t => (
                  <span key={t} style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', border: '0.5px solid rgba(74,158,63,0.3)', color: 'rgba(212,232,220,0.7)' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES EXTENDED */}
      <section className="about-values-section">
        <div className="about-values-inner">
          <div className="about-values-layout">
            <div className="about-values-sticky reveal">
              <div className="about-values-sticky-num" id="about-val-num">01</div>
              <div className="section-eyebrow" style={{ justifyContent: 'flex-start', marginBottom: '20px' }}>
                <div className="section-eyebrow-line"></div>
                <span className="section-eyebrow-text">Triết Lý</span>
              </div>
              <h2 className="about-values-sticky-title">Nguyên Tắc<br/><em>Dẫn Đường</em></h2>
              <p className="about-values-sticky-desc">Mỗi quyết định thiết kế, mỗi tính năng công nghệ và mỗi trang sách đều được định hướng bởi sáu triết lý cốt lõi này.</p>
            </div>

            <div className="about-values-list">
              {[
                {
                  num: '01',
                  title: 'An Toàn Trên Hết',
                  desc: 'Mọi nội dung AI đều được kiểm duyệt kỹ lưỡng để phù hợp với tâm lý trẻ em. Không có thông tin tiêu cực, không có nội dung gây hoang mang. Earthoria là không gian an toàn để khám phá.',
                  icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                },
                {
                  num: '02',
                  title: 'Học Qua Trải Nghiệm',
                  desc: 'Chúng tôi không tin vào học thuộc lòng. Mỗi bài học được thiết kế để trẻ tự khám phá — qua câu đố, qua AR 3D, qua cuộc trò chuyện với AI — để kiến thức thấm sâu và bền vững hơn.',
                  icon: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>
                },
                {
                  num: '03',
                  title: 'Công Nghệ Phục Vụ Giáo Dục',
                  desc: 'AI và AR không phải là mục đích, chúng là phương tiện. Chúng tôi không thêm công nghệ để "trông hiện đại" — mỗi tính năng kỹ thuật phải chứng minh được giá trị giáo dục cụ thể trước khi được tích hợp.',
                  icon: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>
                },
                {
                  num: '04',
                  title: 'Lắng Nghe Liên Tục',
                  desc: 'Người dùng cuối của chúng tôi là trẻ em — nhóm không thể tự phản ánh đầy đủ bằng lời. Chúng tôi quan sát hành vi, lắng nghe phụ huynh và giáo viên, và liên tục cải tiến dựa trên dữ liệu thực tế.',
                  icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                },
                {
                  num: '05',
                  title: 'Khả Năng Mở Rộng',
                  desc: 'Từ ngày đầu, Earthoria được thiết kế như một nền tảng, không phải một sản phẩm đơn lẻ. Kiến trúc kỹ thuật, hệ thống nội dung và thương hiệu đều được xây dựng để dễ dàng nhân rộng sang các chủ đề và độ tuổi mới.',
                  icon: <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>
                },
                {
                  num: '06',
                  title: 'Bền Vững & Có Trách Nhiệm',
                  desc: 'Earthoria không chỉ dạy trẻ em về thiên nhiên — chúng tôi cũng thực hành điều đó. Chất liệu in thân thiện môi trường, nội dung số hóa giảm thiểu in ấn và 1% doanh thu sẽ đóng góp cho các dự án bảo tồn thiên nhiên.',
                  icon: <><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M4.93 4.93l14.14 14.14"/></>
                }
              ].map((v, i) => (
                <div className="about-value-row reveal" data-val-num={v.num} key={i}>
                  <div className="about-value-row-num">{v.num}</div>
                  <div className="about-value-row-content">
                    <div className="about-value-row-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {v.icon}
                      </svg>
                    </div>
                    <h3 className="about-value-row-title">{v.title}</h3>
                    <p className="about-value-row-desc">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ADVISOR */}
      <section className="advisor-section">
        <div className="advisor-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line"></div>
              <span className="section-eyebrow-text">Cố Vấn &amp; Giảng Viên</span>
              <div className="section-eyebrow-line"></div>
            </div>
            <h2 className="section-title">Những Người <em>Đồng Hành</em></h2>
            <p className="section-subtitle">Earthoria được dẫn dắt bởi những người thầy tâm huyết tại FPT University, mang đến định hướng và kinh nghiệm thực tiễn quý báu.</p>
          </div>
          <div className="advisor-grid">
            {[
              {
                type: 'Giảng viên hướng dẫn', letter: 'D',
                name: 'Lê Vũ Duy', title: 'Lecturer · FPT University Can Tho',
                desc: 'Giảng viên phụ trách môn Experiential Entrepreneurship 1 (EXE101), người trực tiếp hướng dẫn nhóm trong toàn bộ hành trình xây dựng Earthoria từ ý tưởng đến sản phẩm hoàn chỉnh.',
                quote: '"Earthoria là một ví dụ điển hình về cách sinh viên có thể biến kiến thức lớp học thành giải pháp thực tế có tác động xã hội."',
                delay: 'reveal-delay-1'
              },
              {
                type: 'Mentor dự án', letter: 'A',
                name: 'Võ Thiên Ân', title: 'Mentor · EXE101_G03_SU26',
                desc: 'Mentor trực tiếp của nhóm, cung cấp phản hồi chuyên sâu về chiến lược sản phẩm, khả năng thương mại hóa và định hướng phát triển dài hạn cho Earthoria trong môi trường startup giáo dục Việt Nam.',
                quote: '"Nhóm Earthoria thể hiện sự kết hợp hiếm có giữa tư duy kỹ thuật và nhạy cảm giáo dục — đúng những gì EdTech cần."',
                delay: 'reveal-delay-2'
              }
            ].map((a, i) => (
              <div className={`advisor-card reveal ${a.delay}`} key={i}>
                <div className="advisor-card-type">{a.type}</div>
                <div className="advisor-avatar">
                  <div className="advisor-avatar-letter">{a.letter}</div>
                </div>
                <div className="advisor-name">{a.name}</div>
                <div className="advisor-title">{a.title}</div>
                <div className="advisor-desc">
                  {a.desc}
                  <blockquote className="advisor-quote">{a.quote}</blockquote>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact-section">
        <div className="contact-inner">
          <div className="contact-grid">
            <div className="contact-left">
              <div className="section-eyebrow" style={{ justifyContent: 'flex-start', marginBottom: '20px' }}>
                <div className="section-eyebrow-line"></div>
                <span className="section-eyebrow-text">Liên Hệ</span>
              </div>
              <h2 className="section-title reveal" style={{ textAlign: 'left' }}>Kết Nối Với <em>Chúng Tôi</em></h2>
              <div className="contact-info-list">
                {[
                  { label: 'Địa chỉ', value: '600 Nguyễn Văn Cừ, Phường Ninh Kiều, Cần Thơ', delay: 'reveal-delay-1' },
                  { label: 'Email', value: 'earthoriavn@gmail.com', href: 'mailto:earthoriavn@gmail.com', delay: 'reveal-delay-2' },
                  { label: 'Website', value: 'http://earthoria.id.vn/', href: 'http://earthoria.id.vn/', delay: 'reveal-delay-3' },
                  { label: 'Fanpage', value: 'facebook.com/Earthoriavn', href: 'https://www.facebook.com/Earthoriavn', delay: 'reveal-delay-1' },
                  { label: 'Thành lập', value: '25 tháng 5, 2026 · Cần Thơ', delay: 'reveal-delay-2' }
                ].map((item, i) => (
                  <div className={`contact-info-item reveal ${item.delay}`} key={i}>
                    <div className="contact-info-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    </div>
                    <div>
                      <div className="contact-info-label">{item.label}</div>
                      {item.href
                        ? <a className="contact-info-value" href={item.href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>{item.value}</a>
                        : <div className="contact-info-value">{item.value}</div>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <div className="contact-map-placeholder reveal">
                <div className="contact-map-grid"></div>
                <div className="contact-map-pin">
                  <svg width="32" height="40" viewBox="0 0 24 30" fill="none">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 18 12 18s12-9 12-18c0-6.627-5.373-12-12-12z" fill="var(--gold)" opacity="0.9"/>
                    <circle cx="12" cy="12" r="4" fill="white"/>
                  </svg>
                </div>
                <div className="contact-map-label" style={{ marginTop: '60px' }}>
                  <div className="contact-map-label-main">FPT University Cần Thơ</div>
                  <div className="contact-map-label-sub">600 Nguyễn Văn Cừ · Ninh Kiều · Cần Thơ</div>
                </div>
              </div>
            </div>

            <div className="contact-right reveal reveal-delay-1">
              <div className="section-eyebrow" style={{ justifyContent: 'flex-start', marginBottom: '20px' }}>
                <div className="section-eyebrow-line"></div>
                <span className="section-eyebrow-text">Gửi Tin Nhắn</span>
              </div>
              <h3 className="section-title" style={{ textAlign: 'left', fontSize: 'clamp(28px,2.5vw,40px)' }}>Hãy <em>Nói Chuyện</em></h3>
              <p className="section-subtitle" style={{ textAlign: 'left', marginLeft: 0, marginTop: '16px', maxWidth: '100%' }}>
                Bạn là phụ huynh, giáo viên, hay nhà đầu tư? Chúng tôi luôn sẵn sàng lắng nghe.
              </p>
              <form className="contact-form" onSubmit={handleFormSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Họ và tên</label>
                    <input type="text" placeholder="Nguyễn Văn A" required/>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" placeholder="ban@email.com" required/>
                  </div>
                </div>
                <div className="form-group">
                  <label>Bạn là</label>
                  <select>
                    <option value="" disabled defaultValue="">Chọn vai trò của bạn</option>
                    <option>Phụ huynh</option>
                    <option>Giáo viên / Nhà giáo dục</option>
                    <option>Nhà đầu tư / Đối tác</option>
                    <option>Báo chí / Truyền thông</option>
                    <option>Khác</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Chủ đề</label>
                  <input type="text" placeholder="Tôi muốn tìm hiểu về..."/>
                </div>
                <div className="form-group">
                  <label>Tin nhắn</label>
                  <textarea placeholder="Chia sẻ suy nghĩ của bạn về Earthoria, hỏi về sản phẩm, hoặc đề xuất hợp tác..."></textarea>
                </div>
                <p className="form-note">Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.</p>
                <button className="form-submit" type="submit">
                  Gửi tin nhắn
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="community-section">
        <div className="community-inner">
          <div className="community-left reveal">
            <div className="tech-eyebrow" style={{ marginBottom: '32px' }}>
              <div className="eyebrow-line"></div>
              <span className="tech-eyebrow-text">Cộng Đồng</span>
            </div>
            <h2 className="community-title">Theo Dõi Hành Trình<br/>Của <em>Earthoria</em></h2>
            <p className="community-sub">Cập nhật mới nhất về sản phẩm, sự kiện ra mắt, nội dung AR miễn phí và cộng đồng các gia đình yêu thiên nhiên.</p>
          </div>
          <div className="community-right reveal reveal-delay-1">
            {[
              { platform: 'Facebook', name: 'Earthoria VN', handle: '@Earthoriavn', href: 'https://www.facebook.com/Earthoriavn/' },
              { platform: 'Website', name: 'earthoria.id.vn', handle: 'Khám phá ngay', href: 'http://earthoria.id.vn/' },
              { platform: 'Email', name: 'Liên hệ trực tiếp', handle: 'earthoriavn@gmail.com', href: 'mailto:earthoriavn@gmail.com' },
              { platform: 'Liên hệ đối tác', name: 'Hợp tác B2B', handle: 'Trường học · Nhà xuất bản', href: '#' },
            ].map((s, i) => (
              <a className="social-card" href={s.href} target="_blank" rel="noreferrer" key={i}>
                <div className="social-card-platform">{s.platform}</div>
                <div className="social-card-name">{s.name}</div>
                <div className="social-card-handle">{s.handle}</div>
                <div className="social-card-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M7 17L17 7M7 7h10v10"/>
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}