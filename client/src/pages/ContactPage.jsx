import { useEffect, useRef, useState } from "react";
import {
  Mail, Phone, MapPin, Clock, ArrowRight, ShieldCheck,
  CheckCheck, MessageCircle, ChevronDown, Send, Users,
  Headphones, FileText, Link2, Zap,
  PhoneCall, MessageSquare, AtSign, Globe,
} from "lucide-react";
import "../assets/css/contactpage.css";

/* ─── Thông tin thực Earthoria ─── */
const CONTACT_CARDS = [
  {
    icon: Phone, type: "Điện thoại",
    value: "083 286 2229",
    sub: "0849 324 423",
    href: "tel:0832862229",
  },
  {
    icon: Mail, type: "Email chính",
    value: "earthoriavn@gmail.com",
    sub: "helpdesk.earthoria@gmail.com",
    href: "mailto:earthoriavn@gmail.com",
  },
  {
    icon: MapPin, type: "Địa chỉ",
    value: "600 Nguyễn Văn Cừ Nối Dài",
    sub: "An Bình, Cần Thơ 900000",
    href: "https://maps.google.com/?q=10.0127,105.7309",
  },
  {
    icon: Clock, type: "Giờ làm việc",
    value: "T2–T6: 7:00 – 18:00",
    sub: "T7–CN: 8:00 – 16:00",
    href: null,
  },
];

/* ─── Chủ đề + field bổ sung khi chọn ─── */
const SUBJECTS = [
  {
    label: "Tư vấn sản phẩm",
    icon: Send,
    extraFields: [
      { name: "product",  label: "Sản phẩm quan tâm",     placeholder: "Tên sách / danh mục...", type: "text",     required: true },
      { name: "quantity", label: "Số lượng dự kiến",       placeholder: "VD: 10 cuốn",            type: "text",     required: false },
    ],
  },
  {
    label: "Hợp tác kinh doanh",
    icon: Users,
    extraFields: [
      { name: "bizType",  label: "Loại hình hợp tác *",    placeholder: "Đại lý / Phân phối / Co-branding...", type: "text", required: true },
      { name: "website",  label: "Website / Fanpage",       placeholder: "https://...",             type: "url",      required: false },
    ],
  },
  {
    label: "Hỗ trợ kỹ thuật",
    icon: Headphones,
    extraFields: [
      { name: "orderId",  label: "Mã đơn hàng *",          placeholder: "ORD-XXXXXX",              type: "text",     required: true },
      { name: "issue",    label: "Mô tả sự cố *",           placeholder: "Lỗi gặp phải...",         type: "text",     required: true },
    ],
  },
  {
    label: "Phản hồi / Góp ý",
    icon: MessageCircle,
    extraFields: [
      { name: "rating",   label: "Mức độ hài lòng *",      placeholder: "",                        type: "rating",   required: true },
    ],
  },
  {
    label: "Khác",
    icon: FileText,
    extraFields: [],
  },
];

/* ─── Phương thức liên lạc ─── */
const CONTACT_METHODS = [
  { id: "phone",    label: "Điện thoại",  icon: PhoneCall,     hint: "083 286 2229 / 0849 324 423" },
  { id: "zalo",     label: "Zalo",        icon: MessageSquare, hint: "Zalo: 0849 324 423" },
  { id: "email",    label: "Email",       icon: AtSign,        hint: "earthoriavn@gmail.com" },
  { id: "facebook", label: "Facebook",    icon: Globe,         hint: "facebook.com/Earthoriavn" },
];

const STATS = [
  { num: "24", suffix: "h",  label: "Thời gian phản hồi" },
  { num: "5+", suffix: "",   label: "Năm kinh nghiệm" },
  { num: "98", suffix: "%",  label: "Khách hàng hài lòng" },
];

const MAP_INFO = [
  { Icon: MapPin,  text: "600 Nguyễn Văn Cừ Nối Dài, An Bình, Cần Thơ" },
  { Icon: Phone,   text: "083 286 2229  ·  0849 324 423" },
  { Icon: Clock,   text: "T2–T6: 7:00–18:00  ·  T7–CN: 8:00–16:00" },
  { Icon: Mail,    text: "earthoriavn@gmail.com" },
  { Icon: Link2,   text: "facebook.com/Earthoriavn", href: "https://www.facebook.com/Earthoriavn" },
];

/* ─── Rating stars helper ─── */
function StarRating({ value, onChange }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-btn${value >= n ? " active" : ""}`}
          onClick={() => onChange(String(n))}
          aria-label={`${n} sao`}
        >
          ★
        </button>
      ))}
      {value && (
        <span className="star-label">
          {["", "Rất tệ", "Tạm được", "Bình thường", "Hài lòng", "Xuất sắc"][+value]}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
export default function ContactPage() {
  const [activeSubject,  setActiveSubject]  = useState(0);
  const [submitting,     setSubmitting]     = useState(false);
  const [showSuccess,    setShowSuccess]    = useState(false);
  const [contactMethods, setContactMethods] = useState([]);
  const [extraValues,    setExtraValues]    = useState({});
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", message: "",
  });

  /* refs */
  const introContentRef = useRef(null);
  const introStatsRef   = useRef(null);
  const panelIntroRef   = useRef(null);
  const infoPanelRef    = useRef(null);
  const formWrapRef     = useRef(null);
  const cardsRef        = useRef([]);
  const fieldsRef       = useRef([]);
  const mapSectionRef   = useRef(null);
  const mapPinRef       = useRef(null);
  const stRef           = useRef([]);

  /* Reset extra fields khi đổi chủ đề */
  const handleSubjectChange = (i) => {
    setActiveSubject(i);
    setExtraValues({});
  };

  /* Toggle contact method */
  const toggleMethod = (id) => {
    setContactMethods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  /* ── GSAP ── */
  useEffect(() => {
    let gsap, ScrollTrigger, lenis;

    const init = async () => {
      try {
        const gsapMod = await import("gsap");
        const stMod   = await import("gsap/ScrollTrigger");
        gsap          = gsapMod.gsap;
        ScrollTrigger = stMod.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
      } catch (e) { return; }

      try {
        const { default: Lenis } = await import("lenis");
        lenis = new Lenis({ duration: 1.4, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        lenis.on("scroll", ScrollTrigger.update);
      } catch (_) {}

      /* 1. Scrub exit */
      const exitTL = gsap.timeline({
        scrollTrigger: { trigger: ".scroll-spacer", start: "top top", end: "bottom top", scrub: 1.2 },
      });
      exitTL.to(introContentRef.current, { scale: 0.72, x: "-18vw", rotationY: -12, opacity: 0, transformPerspective: 1000, ease: "none" }, 0);
      exitTL.to(introStatsRef.current,   { x: "-10vw", scale: 0.85, opacity: 0, ease: "none" }, 0);
      exitTL.to(panelIntroRef.current,   { backgroundColor: "#0a1a14", ease: "none" }, 0);
      stRef.current.push(exitTL.scrollTrigger);

      /* 2. Info panel parallax */
      gsap.fromTo(infoPanelRef.current, { x: -80, opacity: 0 }, {
        x: 0, opacity: 1, immediateRender: false,
        scrollTrigger: { trigger: ".panel-form", start: "top 82%", end: "top 40%", scrub: 0.8 },
      });

      /* 3. Form parallax */
      gsap.fromTo(formWrapRef.current, { x: 80, opacity: 0 }, {
        x: 0, opacity: 1, immediateRender: false,
        scrollTrigger: { trigger: ".panel-form", start: "top 78%", end: "top 36%", scrub: 0.8 },
      });

      /* 4. Cards stagger */
      cardsRef.current.filter(Boolean).forEach((card, i) => {
        gsap.fromTo(card, { x: -40, opacity: 0, rotationX: 8 }, {
          x: 0, opacity: 1, rotationX: 0, duration: 0.7, ease: "power2.out", immediateRender: false,
          delay: i * 0.08,
          scrollTrigger: { trigger: infoPanelRef.current, start: `top ${75 - i * 3}%`, toggleActions: "play none none none" },
        });
      });

      /* 5. Fields stagger */
      const fields = fieldsRef.current.filter(Boolean);
      if (fields.length) {
        gsap.fromTo(fields, { y: 30, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.7, ease: "power2.out", stagger: 0.07, delay: 0.15, immediateRender: false,
          scrollTrigger: { trigger: formWrapRef.current, start: "top 74%", toggleActions: "play none none none" },
        });
      }

      /* 6. Map scrub */
      gsap.fromTo(mapSectionRef.current, { y: 60, opacity: 0 }, {
        y: 0, opacity: 1, immediateRender: false,
        scrollTrigger: { trigger: mapSectionRef.current, start: "top 90%", end: "top 55%", scrub: 0.6 },
      });

      /* 7. Pin spring */
      gsap.fromTo(mapPinRef.current, { scale: 0, opacity: 0, y: -20 }, {
        scale: 1, opacity: 1, y: 0, duration: 0.9, ease: "back.out(1.8)", delay: 0.3, immediateRender: false,
        scrollTrigger: { trigger: mapSectionRef.current, start: "top 70%", toggleActions: "play none none none" },
      });

      ScrollTrigger.refresh();
    };

    init();
    return () => {
      stRef.current.forEach((t) => t?.kill());
      import("gsap/ScrollTrigger").then(({ ScrollTrigger: ST }) => ST?.getAll().forEach((t) => t.kill())).catch(() => {});
      lenis?.destroy();
    };
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleExtraChange = (e) => setExtraValues((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (contactMethods.length === 0) {
      alert("Vui lòng chọn ít nhất một phương thức liên lạc.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setShowSuccess(true);
      setForm({ name: "", email: "", phone: "", company: "", message: "" });
      setExtraValues({});
      setActiveSubject(0);
      setContactMethods([]);
    }, 1200);
  };

  const currentSubject = SUBJECTS[activeSubject];

  return (
    <>
      <div className="contact-wrapper">

        {/* ── PANEL 1: INTRO ── */}
        <section className="panel-intro" ref={panelIntroRef}>
          <div className="ci-bg-grid" />
          <div className="ci-orb ci-orb-1" />
          <div className="ci-orb ci-orb-2" />

          <div className="intro-stats" ref={introStatsRef}>
            {STATS.map((s, i) => (
              <div className="stat-float" key={i}>
                <div className="stat-float-num">{s.num}<span>{s.suffix}</span></div>
                <div className="stat-float-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="intro-content" ref={introContentRef}>
            <div className="intro-eyebrow">
              <span className="intro-eyebrow-line" />
              <span className="intro-eyebrow-text">Liên Hệ Với Chúng Tôi</span>
              <span className="intro-eyebrow-line" />
            </div>
            <h1 className="intro-headline">
              Hãy cùng <em>kiến tạo</em><br />điều tuyệt vời
            </h1>
            <p className="intro-sub">
              Mỗi cuộc hành trình bắt đầu bằng một cuộc trò chuyện.
              Chúng tôi lắng nghe, thấu hiểu và đồng hành cùng bạn.
            </p>
            <div className="intro-scroll-hint">
              <div className="scroll-track" />
              <ChevronDown className="scroll-chevron" size={14} strokeWidth={1.5} />
              <span className="scroll-hint-text">Cuộn để tiếp tục</span>
            </div>
          </div>
        </section>

        <div className="scroll-spacer" />

        {/* ── PANEL 2: FORM ── */}
        <section className="panel-form">
          <div className="form-section-inner">

            {/* ── LEFT: Info panel ── */}
            <div className="contact-info-panel" ref={infoPanelRef}>
              <div className="info-eyebrow">
                <span className="info-eyebrow-line" />
                <span className="info-eyebrow-text">Thông Tin Liên Hệ</span>
              </div>
              <h2 className="info-title">
                Gửi tin nhắn,<br />nhận <em>câu trả lời</em>
              </h2>
              <p className="info-desc">
                Đội ngũ Earthoria luôn sẵn sàng hỗ trợ bạn từ thứ Hai đến
                Chủ nhật — từ tư vấn sách đến hợp tác kinh doanh.
              </p>

              <div className="contact-cards">
                {CONTACT_CARDS.map(({ icon: Icon, type, value, sub, href }, i) => (
                  <div
                    className="contact-card"
                    key={i}
                    ref={(el) => (cardsRef.current[i] = el)}
                    onClick={() => href && window.open(href, "_blank")}
                    style={{ cursor: href ? "pointer" : "default" }}
                  >
                    <div className="card-icon">
                      <Icon size={15} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="card-type">{type}</div>
                      <div className="card-value">{value}</div>
                      {sub && <div className="card-sub">{sub}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social links */}
              <div className="social-row">
                <a
                  href="https://www.facebook.com/Earthoriavn"
                  target="_blank"
                  rel="noreferrer"
                  className="ci-social-btn ci-social-link"
                  title="Facebook"
                >
                  <Globe size={14} strokeWidth={1.5} />
                  <span>Facebook</span>
                </a>
                <a
                  href="https://zalo.me/0849324423"
                  target="_blank"
                  rel="noreferrer"
                  className="ci-social-btn ci-social-link"
                  title="Zalo"
                >
                  <MessageSquare size={14} strokeWidth={1.5} />
                  <span>Zalo</span>
                </a>
                <a
                  href="mailto:earthoriavn@gmail.com"
                  className="ci-social-btn ci-social-link"
                  title="Email"
                >
                  <Mail size={14} strokeWidth={1.5} />
                  <span>Email</span>
                </a>
              </div>

              {/* Quick response badge */}
              <div className="quick-response-badge">
                <Zap size={12} strokeWidth={2} />
                <span>Thường phản hồi trong vòng <strong>2 giờ</strong></span>
              </div>
            </div>

            {/* ── RIGHT: Form ── */}
            <div className="contact-form-wrap" ref={formWrapRef}>
              <div className="form-header" ref={(el) => (fieldsRef.current[0] = el)}>
                <div className="form-label-eyebrow">Gửi Yêu Cầu</div>
                <h3 className="form-title-h">
                  Chia sẻ <em>câu chuyện</em> của bạn
                </h3>
                <p className="form-header-desc">
                  Điền thông tin bên dưới và chúng tôi sẽ liên hệ trong vòng 24 giờ làm việc.
                </p>
              </div>

              <form className="contact-form" onSubmit={handleSubmit}>

                {/* ── Họ tên + Email ── */}
                <div className="form-row-grid" ref={(el) => (fieldsRef.current[1] = el)}>
                  <div className="f-group">
                    <label htmlFor="ci-name">Họ và tên *</label>
                    <input id="ci-name" name="name" type="text" placeholder="Nguyễn Văn A"
                      value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="f-group">
                    <label htmlFor="ci-email">Email *</label>
                    <input id="ci-email" name="email" type="email" placeholder="email@example.com"
                      value={form.email} onChange={handleChange} required />
                  </div>
                </div>

                {/* ── SĐT + Công ty ── */}
                <div className="form-row-grid" ref={(el) => (fieldsRef.current[2] = el)}>
                  <div className="f-group">
                    <label htmlFor="ci-phone">Số điện thoại</label>
                    <input id="ci-phone" name="phone" type="tel" placeholder="+84 ..."
                      value={form.phone} onChange={handleChange} />
                  </div>
                  <div className="f-group">
                    <label htmlFor="ci-company">Công ty / Tổ chức</label>
                    <input id="ci-company" name="company" type="text" placeholder="Tên công ty (nếu có)"
                      value={form.company} onChange={handleChange} />
                  </div>
                </div>

                {/* ── Chủ đề ── */}
                <div className="f-group" ref={(el) => (fieldsRef.current[3] = el)}>
                  <label>Chủ đề yêu cầu *</label>
                  <div className="subject-pills">
                    {SUBJECTS.map(({ label, icon: Icon }, i) => (
                      <button
                        type="button" key={label}
                        className={`subject-pill${activeSubject === i ? " active" : ""}`}
                        onClick={() => handleSubjectChange(i)}
                      >
                        <Icon size={11} strokeWidth={1.8} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Fields động theo chủ đề ── */}
                {currentSubject.extraFields.length > 0 && (
                  <div className="extra-fields-block" ref={(el) => (fieldsRef.current[4] = el)}>
                    <div className="extra-fields-label">
                      <currentSubject.icon size={12} strokeWidth={1.8} />
                      Thông tin thêm cho <strong>{currentSubject.label}</strong>
                    </div>
                    <div className="extra-fields-inner">
                      {currentSubject.extraFields.map((field) => (
                        <div className="f-group" key={field.name}>
                          <label htmlFor={`ci-${field.name}`}>
                            {field.label}{field.required ? " *" : ""}
                          </label>
                          {field.type === "rating" ? (
                            <StarRating
                              value={extraValues[field.name] || ""}
                              onChange={(val) => setExtraValues((p) => ({ ...p, [field.name]: val }))}
                            />
                          ) : (
                            <input
                              id={`ci-${field.name}`}
                              name={field.name}
                              type={field.type}
                              placeholder={field.placeholder}
                              value={extraValues[field.name] || ""}
                              onChange={handleExtraChange}
                              required={field.required}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-divider" ref={(el) => (fieldsRef.current[5] = el)}>
                  <span className="form-divider-line" />
                  <span className="form-divider-mark" />
                  <span className="form-divider-line" />
                </div>

                {/* ── Tin nhắn ── */}
                <div className="f-group" ref={(el) => (fieldsRef.current[6] = el)}>
                  <label htmlFor="ci-message">Tin nhắn *</label>
                  <textarea id="ci-message" name="message"
                    placeholder="Mô tả chi tiết nhu cầu hoặc câu hỏi của bạn..."
                    value={form.message} onChange={handleChange} required />
                </div>

                {/* ── Phương thức liên lạc ── */}
                <div className="f-group contact-method-group" ref={(el) => (fieldsRef.current[7] = el)}>
                  <label>
                    Chúng tôi có thể liên hệ với bạn bằng cách nào? *
                  </label>
                  <p className="method-hint">Chọn một hoặc nhiều phương thức</p>
                  <div className="method-cards">
                    {CONTACT_METHODS.map(({ id, label, icon: Icon, hint }) => (
                      <button
                        type="button"
                        key={id}
                        className={`method-card${contactMethods.includes(id) ? " active" : ""}`}
                        onClick={() => toggleMethod(id)}
                      >
                        <div className="method-card-icon">
                          <Icon size={18} strokeWidth={1.5} />
                        </div>
                        <div className="method-card-body">
                          <div className="method-card-label">{label}</div>
                          <div className="method-card-hint">{hint}</div>
                        </div>
                        <div className="method-card-check">
                          {contactMethods.includes(id) && <CheckCheck size={13} strokeWidth={2} />}
                        </div>
                      </button>
                    ))}
                  </div>
                  {contactMethods.length === 0 && (
                    <p className="method-required-note">
                      ⚠ Vui lòng chọn ít nhất một phương thức
                    </p>
                  )}
                </div>

                {/* ── Privacy + Submit ── */}
                <p className="form-note" ref={(el) => (fieldsRef.current[8] = el)}>
                  <ShieldCheck size={13} strokeWidth={1.8} />
                  Thông tin của bạn được bảo mật tuyệt đối. Không spam.
                </p>

                <button
                  type="submit"
                  className="form-submit"
                  disabled={submitting}
                  ref={(el) => (fieldsRef.current[9] = el)}
                >
                  {submitting ? "Đang gửi..." : "Gửi tin nhắn"}
                  {!submitting && <ArrowRight className="submit-arrow" size={15} strokeWidth={1.5} />}
                </button>
              </form>
            </div>

          </div>

          {/* ── MAP ── */}
          <div className="map-section" ref={mapSectionRef}>
            <div className="map-section-header">
              <div className="info-eyebrow" style={{ marginBottom: "8px" }}>
                <span className="info-eyebrow-line" />
                <span className="info-eyebrow-text">Vị Trí</span>
              </div>
              <h2 className="map-section-title">Đến thăm <em>chúng tôi</em></h2>
            </div>

            <div className="map-inner">
              {/* ── Google Maps iframe ── */}
              <div className="map-visual" ref={mapPinRef}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1964.524998215646!2d105.73088664236549!3d10.0127291326702!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0882139720a77%3A0x3916a227d0b95a64!2sFPT%20University!5e0!3m2!1svi!2s!4v1782624966323!5m2!1svi!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Earthoria - FPT University Cần Thơ"
                />
                <a
                  href="https://maps.google.com/?q=10.0127,105.7309"
                  target="_blank"
                  rel="noreferrer"
                  className="map-open-btn"
                >
                  <MapPin size={13} strokeWidth={1.5} />
                  Mở Google Maps
                </a>
              </div>

              {/* ── Info panel ── */}
              <div className="map-info">
                <div className="map-info-title">Thông tin liên hệ</div>
                {MAP_INFO.map(({ Icon, text, href }, i) => (
                  <div className="map-info-item" key={i}>
                    <Icon size={14} strokeWidth={1.5} />
                    {href
                      ? <a href={href} target="_blank" rel="noreferrer">{text}</a>
                      : <span>{text}</span>
                    }
                  </div>
                ))}

                <a
                  href="https://maps.google.com/?q=10.0127,105.7309"
                  target="_blank"
                  rel="noreferrer"
                  className="map-directions-btn"
                >
                  <MapPin size={13} strokeWidth={1.5} />
                  Chỉ đường đến đây
                  <ArrowRight size={13} strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── SUCCESS OVERLAY ── */}
      <div className={`success-overlay${showSuccess ? " show" : ""}`}>
        <div className="success-icon"><CheckCheck size={36} strokeWidth={1.5} /></div>
        <h2 className="success-title">Đã gửi <em>thành công!</em></h2>
        <p className="success-sub">
          Chúng tôi sẽ liên hệ lại với bạn qua{" "}
          <strong>{contactMethods.join(", ") || "email"}</strong> trong vòng 24 giờ làm việc.
        </p>
        <button className="success-back" onClick={() => setShowSuccess(false)}>
          Quay lại trang
        </button>
      </div>
    </>
  );
}