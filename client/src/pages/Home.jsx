import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { bookService } from "../services/bookService";
import { useCartStore } from "../store/cartStore";
import { formatPrice, getBookUrl } from "../utils/helpers";
import toast from "react-hot-toast";
import { Truck, Gift, BookOpen, Star } from 'lucide-react';
/* ─────────────────────────────────────────────────────────────
   HERO BANNER DATA
───────────────────────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    id: 1,
    eyebrow: "Sách Giáo Dục Tương Tác AR × AI",
    headline: [
      "Mở Sách —",
      <em key="em1">Mở Ra</em>,
      <br key="br1" />,
      "Thế Giới",
    ],
    sub: "Hành trình khám phá thiên nhiên qua lăng kính công nghệ thực tế tăng cường và trí tuệ nhân tạo.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqQsaKpsl853jkb7LVw_tM_N8sMdr2NavI4-ZchB0m3ruBxPqPN9Nn1PjntGV8mbHhTCbatFXPkgD9K2O337Rz8tyz54di0oxbMeLKFo9EKZpeTCdJSA9WaYDYPY48Qyuj4ia-Qyx2BSlkrdByVMyYwY45va3kPZc_VLc3XAV5cTeIrzFVJefKSJq-LlyJKf2Hkxp5_ggisUBAX7ScOO6BIoEeLX_PYCXzQsMXIHjj5TOJSHtXbyrwJHYS68H_vFC9uwDrV6Vbqik",
    badge: "Bestseller",
    accent: "var(--gold)",
    ctaLabel: "Khám phá bộ sưu tập",
    ctaLink: "/shop",
  },
  {
    id: 2,
    eyebrow: "Bộ Sưu Tập Mới 2025",
    headline: [
      "Đại Dương —",
      <br key="br2" />,
      <em key="em2">Huyền Bí</em>,
      " & ",
      <br key="br2b" />,
      "Kỳ Diệu",
    ],
    sub: "Khám phá đáy đại dương qua 120 loài sinh vật biển được tái hiện hoàn toàn bằng công nghệ AR 3D.",
    img: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1200&q=80&fit=crop",
    badge: "Mới Ra Mắt",
    accent: "#2d9ec0",
    ctaLabel: "Xem bộ Đại Dương",
    ctaLink: "/shop?cat=ocean",
  },
  {
    id: 3,
    eyebrow: "Bộ Sưu Tập Rừng Nhiệt Đới",
    headline: [
      "Rừng Xanh —",
      <br key="br3" />,
      <em key="em3">Ngàn Tiếng</em>,
      <br key="br3b" />,
      "Muông Thú",
    ],
    sub: "Hơn 80 loài động vật rừng nhiệt đới bước ra từ trang sách, kể chuyện bằng giọng AI thân thiện.",
    img: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80&fit=crop",
    badge: "Yêu Thích",
    accent: "var(--gold)",
    ctaLabel: "Khám phá Rừng Xanh",
    ctaLink: "/shop?cat=forest",
  },
];

/* ─────────────────────────────────────────────────────────────
   HERO BANNER SLIDER  — full-bleed redesign
───────────────────────────────────────────────────────────── */
function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const total = HERO_SLIDES.length;

  const goTo = useCallback(
    (idx) => {
      if (animating || idx === current) return;
      setAnimating(true);
      setPrev(current);
      setCurrent(idx);
      setTimeout(() => {
        setPrev(null);
        setAnimating(false);
      }, 1000);
    },
    [animating, current],
  );

  const next = useCallback(
    () => goTo((current + 1) % total),
    [goTo, current, total],
  );
  const prev_ = useCallback(
    () => goTo((current - 1 + total) % total),
    [goTo, current, total],
  );

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 6000);
    return () => clearInterval(timerRef.current);
  }, [next, paused]);

  return (
    <>
      {/* ── INLINE STYLES (hoisted once) ── */}
      <style>{`
        /* ── keyframes ── */
        @keyframes heroBgZoom {
          from { transform: scale(1.08); }
          to   { transform: scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sliderProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ── wrapper ── */
        .hb-wrap {
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 600px;
          overflow: hidden;
          background: #0a0f0c;
        }

        /* ── background image layer ── */
        .hb-bg {
          position: absolute; inset: 0; z-index: 0;
          overflow: hidden;
        }
        .hb-bg img {
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center 30%;
          filter: saturate(0.7) brightness(0.55);
          transition: opacity 1s ease;
        }
        .hb-bg img.hb-bg-enter  { animation: heroBgZoom 7s ease-out forwards; }
        .hb-bg img.hb-bg-active { opacity: 1; }
        .hb-bg img.hb-bg-exit   { opacity: 0; }

        /* ── overlays ── */
        /* left vignette — màu sắc đậm hơn để chữ dễ đọc */
        .hb-overlay-left {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(
            105deg,
            rgba(8,18,12,0.88) 0%,
            rgba(8,18,12,0.70) 38%,
            rgba(8,18,12,0.28) 65%,
            transparent 100%
          );
        }
        /* bottom gradient chạy liền vào marquee bar */
        .hb-overlay-bottom {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 2;
          height: 220px;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(8,18,12,0.55) 40%,
            rgba(8,18,12,0.82) 70%,
            #0d3330 100%
          );
          pointer-events: none;
        }

        /* ── content ── */
        .hb-content {
          position: absolute; inset: 0; z-index: 3;
          display: flex; flex-direction: column; justify-content: center;
          padding: 120px 100px 160px;
          max-width: 820px;
        }

        /* eyebrow */
        .hb-eyebrow {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 28px;
        }
        .hb-eyebrow-line {
          width: 36px; height: 0.5px;
          background: var(--gold);
          flex-shrink: 0;
        }
        .hb-eyebrow-text {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase;
          color: var(--gold); font-weight: 400;
        }
        .hb-badge {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--ivory); background: var(--gold);
          padding: 5px 14px; margin-left: 8px;
        }

        /* headline */
        .hb-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(52px, 6.5vw, 96px);
          font-weight: 300; line-height: 1.04;
          color: var(--ivory); letter-spacing: -0.015em;
          margin-bottom: 24px;
          text-shadow: 0 2px 40px rgba(0,0,0,0.4);
        }
        .hb-headline em {
          font-style: italic; color: var(--gold);
        }

        /* sub */
        .hb-sub {
          font-size: 15px; line-height: 1.8;
          color: rgba(250,248,243,0.72);
          font-weight: 300;
          max-width: 480px;
          margin-bottom: 44px;
          text-shadow: 0 1px 12px rgba(0,0,0,0.5);
        }

        /* CTA row */
        .hb-cta-row {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .hb-btn-main {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--ivory); background: var(--gold);
          border: none; padding: 16px 36px; cursor: pointer;
          transition: all 0.35s ease;
          display: inline-flex; align-items: center; gap: 12px;
          font-weight: 400;
          box-shadow: 0 8px 32px rgba(74,158,63,0.35);
        }
        .hb-btn-main:hover {
          background: var(--gold-light);
          gap: 20px;
          box-shadow: 0 12px 40px rgba(74,158,63,0.5);
        }
        .hb-btn-ghost {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.07);
          border: 0.5px solid rgba(255,255,255,0.28);
          backdrop-filter: blur(12px);
          padding: 15px 28px; cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex; align-items: center; gap: 10px;
        }
        .hb-btn-ghost:hover {
          background: rgba(255,255,255,0.13);
          border-color: rgba(255,255,255,0.5);
          color: #fff;
        }

        /* ── slide content fade animations ── */
        .hb-slide-active .hb-eyebrow   { animation: fadeUp 0.75s 0.05s both cubic-bezier(0.16,1,0.3,1); }
        .hb-slide-active .hb-headline  { animation: fadeUp 0.75s 0.18s both cubic-bezier(0.16,1,0.3,1); }
        .hb-slide-active .hb-sub       { animation: fadeUp 0.75s 0.30s both cubic-bezier(0.16,1,0.3,1); }
        .hb-slide-active .hb-cta-row   { animation: fadeUp 0.75s 0.42s both cubic-bezier(0.16,1,0.3,1); }

        /* ── Controls bar (bottom-left) ── */
        .hb-controls {
          position: absolute;
          bottom: 52px; left: 100px;
          z-index: 4;
          display: flex; align-items: center; gap: 20px;
        }

        /* dots */
        .hb-dots { display: flex; align-items: center; gap: 8px; }
        .hb-dot {
          height: 3px; border: none; padding: 0;
          cursor: pointer; border-radius: 2px;
          transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
          background: rgba(255,255,255,0.25);
          width: 8px;
        }
        .hb-dot.active {
          width: 40px;
          background: var(--gold);
        }

        /* counter */
        .hb-counter {
          font-family: 'Playfair Display', serif;
          font-size: 13px; letter-spacing: 0.12em;
          color: rgba(255,255,255,0.35);
          user-select: none;
        }

        /* arrow buttons */
        .hb-arrows { display: flex; gap: 6px; }
        .hb-arrow {
          width: 40px; height: 40px;
          border: 0.5px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          color: rgba(255,255,255,0.65);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s ease;
        }
        .hb-arrow:hover {
          border-color: var(--gold);
          background: rgba(74,158,63,0.18);
          color: var(--gold);
        }

        /* ── Thumbnail strip (right side) ── */
        .hb-thumbs {
          position: absolute;
          right: 52px; top: 50%;
          transform: translateY(-50%);
          z-index: 4;
          display: flex; flex-direction: column; gap: 10px;
        }
        .hb-thumb {
          width: 72px; height: 52px;
          overflow: hidden; cursor: pointer;
          border: 1.5px solid transparent;
          opacity: 0.4; filter: saturate(0.4) brightness(0.8);
          transition: all 0.35s ease;
          flex-shrink: 0;
        }
        .hb-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hb-thumb.active, .hb-thumb:hover {
          border-color: var(--gold);
          opacity: 1; filter: saturate(1) brightness(1);
        }
        /* thumb label */
        .hb-thumb-label {
          position: absolute; bottom: -18px; left: 0; right: 0;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--gold); text-align: center;
          opacity: 0; transition: opacity 0.3s;
        }
        .hb-thumb.active .hb-thumb-label { opacity: 1; }

        /* ── Progress bar (top of section, thin) ── */
        .hb-progress-rail {
          position: absolute; top: 0; left: 0; right: 0;
          height: 1.5px; background: rgba(255,255,255,0.08); z-index: 5;
        }
        .hb-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gold), var(--gold-light));
        }

        /* ── Vertical slide label (right edge) ── */
        .hb-slide-label {
          position: absolute;
          right: 148px; bottom: 56px;
          z-index: 4;
          writing-mode: vertical-rl;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase;
          color: rgba(255,255,255,0.22);
          user-select: none;
          transition: color 0.4s;
        }

        /* ── Scroll hint ── */
        .hb-scroll {
          position: absolute; bottom: 56px;
          left: 50%; transform: translateX(-50%);
          z-index: 4;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .hb-scroll-line {
          width: 1px; height: 48px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.4), transparent);
          animation: scrollPulse 2s ease-in-out infinite;
        }
        @keyframes scrollPulse {
          0%,100% { opacity: 0.3; transform: scaleY(1); }
          50%      { opacity: 1;   transform: scaleY(1.1); }
        }
        .hb-scroll-text {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase;
          color: rgba(255,255,255,0.3);
        }

        /* ── seamless bottom-to-marquee connector ── */
        .hb-bottom-connector {
          height: 0;   /* zero height — just the gradient overlapping below */
          position: relative; z-index: 20;
          margin-top: -56px; /* pull marquee up to blend */
          pointer-events: none;
        }

        /* responsive */
        @media (max-width: 900px) {
          .hb-content { padding: 100px 36px 140px; }
          .hb-controls { left: 36px; bottom: 36px; }
          .hb-thumbs   { display: none; }
          .hb-slide-label { display: none; }
          .hb-scroll  { display: none; }
        }
        @media (max-width: 600px) {
          .hb-headline { font-size: clamp(38px, 10vw, 60px); }
          .hb-cta-row  { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* ══════════════════ SECTION ══════════════════ */}
      <section
        className="hb-wrap"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Progress rail */}
        <div className="hb-progress-rail">
          <div
            key={current}
            className="hb-progress-fill"
            style={{
              animation: paused ? "none" : "sliderProgress 6s linear forwards",
            }}
          />
        </div>

        {/* BG images — Ken Burns on active */}
        {HERO_SLIDES.map((s, i) => (
          <div
            key={s.id}
            className="hb-bg"
            style={{
              opacity: i === current ? 1 : i === prev ? 1 : 0,
              transition: "opacity 1s ease",
              zIndex: i === current ? 0 : i === prev ? 0 : -1,
            }}
          >
            <img
              src={s.img}
              alt=""
              className={
                i === current ? "hb-bg-enter hb-bg-active" : "hb-bg-exit"
              }
              key={`img-${i}-${i === current}`}
            />
          </div>
        ))}

        {/* Left vignette */}
        <div className="hb-overlay-left" />

        {/* Bottom gradient → seamless into marquee */}
        <div className="hb-overlay-bottom" />

        {/* ── SLIDE CONTENT ── */}
        {HERO_SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`hb-content ${i === current ? "hb-slide-active" : ""}`}
            style={{
              opacity: i === current ? 1 : 0,
              pointerEvents: i === current ? "auto" : "none",
              transition: "opacity 0.6s ease",
            }}
          >
            {/* eyebrow */}
            <div className="hb-eyebrow">
              <div className="hb-eyebrow-line" />
              <span className="hb-eyebrow-text">{s.eyebrow}</span>
              {s.badge && <span className="hb-badge">{s.badge}</span>}
            </div>

            {/* headline */}
            <h1 className="hb-headline">{s.headline}</h1>

            {/* sub */}
            <p className="hb-sub">{s.sub}</p>

            {/* CTAs */}
            <div className="hb-cta-row">
              <Link to={s.ctaLink}>
                <button className="hb-btn-main">
                  {s.ctaLabel}
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
              <button className="hb-btn-ghost">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Xem demo AR
              </button>
            </div>
          </div>
        ))}

        {/* ── CONTROLS BAR (bottom-left) ── */}
        <div className="hb-controls">
          {/* dots */}
          <div className="hb-dots">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                className={`hb-dot ${i === current ? "active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* counter */}
          <span className="hb-counter">
            {String(current + 1).padStart(2, "0")}{" "}
            <span style={{ color: "rgba(255,255,255,0.18)", margin: "0 4px" }}>
              /
            </span>{" "}
            {String(total).padStart(2, "0")}
          </span>

          {/* arrows */}
          <div className="hb-arrows">
            <button className="hb-arrow" onClick={prev_} aria-label="Previous">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="hb-arrow" onClick={next} aria-label="Next">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Vertical current slide name ── */}
        <div className="hb-slide-label">{HERO_SLIDES[current].eyebrow}</div>

        {/* ── Thumbnails (right side) ── */}
        <div className="hb-thumbs">
          {HERO_SLIDES.map((s, i) => (
            <div
              key={s.id}
              className={`hb-thumb ${i === current ? "active" : ""}`}
              onClick={() => goTo(i)}
              style={{ position: "relative" }}
            >
              <img src={s.img} alt={`Slide ${i + 1}`} />
              <div className="hb-thumb-label">
                {String(i + 1).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        {/* ── Scroll hint ── */}
        <div className="hb-scroll">
          <div className="hb-scroll-line" />
          <span className="hb-scroll-text">Scroll</span>
        </div>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   PRODUCT CARD COMPONENT
───────────────────────────────────────────────────────────── */
function BookCard({ book, onAddCart, badge, badgeType = "forest" }) {
  const [wishlisted, setWishlisted] = useState(false);
  return (
    <div className="product-card reveal">
      <div className="product-img-wrap">
        <img
          src={book.coverImage || "https://via.placeholder.com/400x320"}
          alt={book.title}
        />
        <div className="product-img-overlay">
          <Link to={getBookUrl(book.slug, book.hashId)}>
            <button className="overlay-btn primary">Xem chi tiết</button>
          </Link>
          <button
            className="overlay-btn"
            onClick={() => onAddCart(book.hashId)}
          >
            Thêm vào giỏ
          </button>
        </div>
        {badge && (
          <span
            className={`product-badge ${badgeType === "gold" ? "gold" : ""}`}
          >
            {badge}
          </span>
        )}
        <span className="product-category">{book.category?.name}</span>
        <button
          className={`card-wishlist ${wishlisted ? "active" : ""}`}
          onClick={() => setWishlisted((w) => !w)}
          style={{ opacity: 1, transform: "translateY(0)" }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={wishlisted ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <div className="product-body">
        <div
          className="product-rating"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            marginBottom: "8px",
          }}
        >
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="star"
              style={{
                fontSize: "11px",
                color: i < (book.rating || 5) ? "var(--gold)" : "var(--pale)",
              }}
            >
              ★
            </span>
          ))}
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            ({book.reviewCount || Math.floor(Math.random() * 200) + 50})
          </span>
        </div>
        <h3 className="product-title">{book.title}</h3>
        <p className="product-desc">{book.description?.slice(0, 90)}...</p>
        <div className="product-footer">
          <div>
            {book.originalPrice && book.originalPrice > book.salePrice && (
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  textDecoration: "line-through",
                  lineHeight: 1,
                }}
              >
                {formatPrice(book.originalPrice)}
              </div>
            )}
            <span className="product-price">
              {formatPrice(book.salePrice || book.price)}
            </span>
          </div>
          <button className="add-cart" onClick={() => onAddCart(book.hashId)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HORIZONTAL SCROLL BOOK ROW
───────────────────────────────────────────────────────────── */
function BookScrollRow({ books, onAddCart, badgeLabel, badgeType }) {
  const rowRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  const checkScroll = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, [books]);

  return (
    <div style={{ position: "relative" }}>
      {/* Fade edges */}
      {canLeft && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "80px",
            background: "linear-gradient(to right, var(--cream), transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      )}
      {canRight && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "80px",
            background: "linear-gradient(to left, var(--cream), transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Arrow buttons */}
      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          style={{
            position: "absolute",
            left: "-20px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 3,
            width: "44px",
            height: "44px",
            background: "var(--white)",
            border: "0.5px solid var(--border-gold)",
            color: "var(--gold)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s",
            boxShadow: "0 8px 24px rgba(13,43,30,0.1)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {canRight && (
        <button
          onClick={() => scroll(1)}
          style={{
            position: "absolute",
            right: "-20px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 3,
            width: "44px",
            height: "44px",
            background: "var(--white)",
            border: "0.5px solid var(--border-gold)",
            color: "var(--gold)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s",
            boxShadow: "0 8px 24px rgba(13,43,30,0.1)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Scroll container */}
      <div
        ref={rowRef}
        style={{
          display: "flex",
          gap: "24px",
          overflowX: "auto",
          paddingBottom: "12px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          cursor: "grab",
        }}
        onMouseDown={(e) => {
          const el = rowRef.current;
          let startX = e.pageX - el.offsetLeft;
          let scrollLeft = el.scrollLeft;
          el.style.cursor = "grabbing";
          const onMove = (ev) => {
            el.scrollLeft = scrollLeft - (ev.pageX - el.offsetLeft - startX);
          };
          const onUp = () => {
            el.style.cursor = "grab";
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      >
        {books.map((book) => (
          <div key={book.id} style={{ flex: "0 0 280px", minWidth: 0 }}>
            <BookCard
              book={book}
              onAddCart={onAddCart}
              badge={badgeLabel}
              badgeType={badgeType}
            />
          </div>
        ))}
      </div>
      <style>{`::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   NEWSLETTER SECTION
───────────────────────────────────────────────────────────── */
function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <section
      style={{
        background: "var(--parchment)",
        padding: "80px 100px",
        borderTop: "0.5px solid var(--border)",
        borderBottom: "0.5px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "center",
        }}
      >
        <div className="reveal">
          <div
            className="section-eyebrow"
            style={{ justifyContent: "flex-start", marginBottom: "20px" }}
          >
            <div className="section-eyebrow-line" />
            <span className="section-eyebrow-text">Đặc Quyền Thành Viên</span>
          </div>
          <h2
            className="section-title"
            style={{ textAlign: "left", marginBottom: "16px" }}
          >
            Nhận <em>Ưu Đãi</em>
            <br />
            Độc Quyền
          </h2>
          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.8",
              color: "var(--text-muted)",
              fontWeight: 300,
              maxWidth: "380px",
            }}
          >
            Đăng ký nhận thông báo về sách mới, tài liệu học tập miễn phí và ưu
            đãi đặc biệt dành riêng cho thành viên Earthoria.
          </p>
          <div style={{ display: "flex", gap: "24px", marginTop: "32px" }}>
            {[
              [<Truck size={18} />, "Miễn phí vận chuyển"],
              [<Gift size={18} />, "Quà tặng hàng tháng"],
              [<BookOpen size={18} />, "Tài liệu độc quyền"],
            ].map(([icon, label]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                {icon} {label}
              </div>
            ))}
          </div>
        </div>
        <div className="reveal reveal-delay-1">
          {sent ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                background: "var(--white)",
                border: "0.5px solid var(--border-gold)",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌿</div>
              <div
                style={{
                  fontFamily: "Playfair Display,serif",
                  fontSize: "24px",
                  color: "var(--forest)",
                  marginBottom: "8px",
                }}
              >
                Cảm ơn bạn!
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Chào mừng bạn đến với gia đình Earthoria.
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "var(--white)",
                border: "0.5px solid var(--border)",
                padding: "40px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: "20px",
                }}
              >
                Nhận ngay ưu đãi 15% cho đơn đầu tiên
              </div>
              <div style={{ display: "flex", gap: "0" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Địa chỉ email của bạn..."
                  style={{
                    flex: 1,
                    padding: "14px 18px",
                    border: "0.5px solid var(--border)",
                    background: "var(--ivory)",
                    fontFamily: "Be Vietnam Pro,sans-serif",
                    fontSize: "13px",
                    color: "var(--forest)",
                    outline: "none",
                    borderRight: "none",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && email && setSent(true)}
                />
                <button
                  onClick={() => email && setSent(true)}
                  style={{
                    background: "var(--forest)",
                    color: "var(--ivory)",
                    border: "none",
                    padding: "14px 24px",
                    cursor: "pointer",
                    fontFamily: "Be Vietnam Pro,sans-serif",
                    fontSize: "10px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    transition: "background 0.3s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "var(--forest-mid)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "var(--forest)")
                  }
                >
                  Đăng Ký
                </button>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginTop: "12px",
                  fontWeight: 300,
                }}
              >
                🔒 Chúng tôi cam kết bảo mật thông tin của bạn. Hủy bất cứ lúc
                nào.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   APP SHOWCASE (MOBILE AR PREVIEW)
───────────────────────────────────────────────────────────── */
function AppShowcase() {
  return (
    <section className="tech-section">
      <div className="tech-left">
        <div className="tech-eyebrow">
          <div
            style={{
              width: "40px",
              height: "0.5px",
              background: "var(--gold)",
            }}
          />
          <span className="tech-eyebrow-text">Ứng Dụng Earthoria</span>
        </div>
        <h2 className="tech-title reveal">
          Công Nghệ <em>AR & AI</em>
          <br />
          Trong Tầm Tay
        </h2>
        <div className="tech-features">
          {[
            [
              "01",
              "Quét Mã Thông Minh",
              "Chỉ cần mở app, hướng camera vào trang sách — 3D sẽ xuất hiện tức thì.",
            ],
            [
              "02",
              "Trò Chuyện Với AI",
              "Đặt câu hỏi cho bất kỳ sinh vật nào và nhận câu trả lời bằng giọng nói tự nhiên.",
            ],
            [
              "03",
              "Học Theo Cách Của Bé",
              "AI ghi nhớ tiến trình học tập và điều chỉnh độ khó phù hợp với từng bé.",
            ],
          ].map(([num, title, desc]) => (
            <div className="tech-feat reveal" key={num}>
              <span className="tech-feat-num">{num}</span>
              <div className="tech-feat-body">
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="tech-cta">
          Tải Ứng Dụng Miễn Phí
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="tech-right">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqQsaKpsl853jkb7LVw_tM_N8sMdr2NavI4-ZchB0m3ruBxPqPN9Nn1PjntGV8mbHhTCbatFXPkgD9K2O337Rz8tyz54di0oxbMeLKFo9EKZpeTCdJSA9WaYDYPY48Qyuj4ia-Qyx2BSlkrdByVMyYwY45va3kPZc_VLc3XAV5cTeIrzFVJefKSJq-LlyJKf2Hkxp5_ggisUBAX7ScOO6BIoEeLX_PYCXzQsMXIHjj5TOJSHtXbyrwJHYS68H_vFC9uwDrV6Vbqik"
          alt=""
        />
        <div className="tech-right-overlay" />
        <div className="phone-mockup">
          <div className="phone-screen">
            <div className="phone-status">
              <span>9:41</span>
              <span>●●●</span>
            </div>
            <div className="phone-ar-label">AR ACTIVE</div>
            <div className="phone-scan-frame">
              <div className="corner tl" />
              <div className="corner tr" />
              <div className="corner bl" />
              <div className="corner br" />
              <div className="scan-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                </svg>
                <span>Đang nhận diện...</span>
              </div>
            </div>
            <div className="phone-info">
              <div className="phone-info-name">Đại Bàng Biển</div>
              <div className="phone-info-sub">
                Haliaeetus leucocephalus • Đang tải mô hình 3D
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   TESTIMONIALS SECTION (enhanced)
───────────────────────────────────────────────────────────── */
const REVIEWS = [
  {
    name: "Nguyễn Thu Hà",
    role: "Mẹ của bé Minh, 7 tuổi",
    initial: "H",
    stars: 5,
    text: 'Con tôi mê cuốn "Rừng Nhiệt Đới" đến nỗi không chịu đi ngủ! Tính năng AR giúp bé học tên 20 loài động vật chỉ trong một tuần.',
  },
  {
    name: "Trần Văn Khoa",
    role: "Giáo viên tiểu học",
    initial: "K",
    stars: 5,
    text: "Tôi đã đưa bộ sách Earthoria vào giờ học tự nhiên. Học sinh tương tác, hỏi đáp và nhớ bài lâu hơn hẳn so với phương pháp truyền thống.",
  },
  {
    name: "Phạm Minh Châu",
    role: "Phụ huynh, Q.3 TP.HCM",
    initial: "C",
    stars: 5,
    text: "Chất lượng in ấn tuyệt vời, hình ảnh minh họa đẹp như tranh nghệ thuật. AI kể chuyện bằng giọng đọc cực kỳ tự nhiên, bé thích lắm!",
  },
];

/* ─────────────────────────────────────────────────────────────
   MAIN HOME COMPONENT
───────────────────────────────────────────────────────────── */
export default function Home() {
  const ctaRef = useRef(null);
  const { addToCart } = useCartStore();

  const { data: featuredBooks = [] } = useQuery({
    queryKey: ["featured-books"],
    queryFn: () => bookService.getFeatured().then((r) => r.data.data),
  });

  const { data: newBooks = [] } = useQuery({
    queryKey: ["new-books"],
    queryFn: () =>
      bookService
        .getNew?.()
        .then((r) => r.data.data)
        .catch(() => featuredBooks) ?? Promise.resolve(featuredBooks),
  });

  const { data: bestsellerBooks = [] } = useQuery({
    queryKey: ["bestseller-books"],
    queryFn: () =>
      bookService
        .getBestsellers?.()
        .then((r) => r.data.data)
        .catch(() => featuredBooks) ?? Promise.resolve(featuredBooks),
  });

  // Fireflies
  useEffect(() => {
    const section = ctaRef.current;
    if (!section) return;
    const configs = [
      {
        x: "8%",
        y: "20%",
        dx1: "40px",
        dy1: "-30px",
        dx2: "20px",
        dy2: "60px",
        dx3: "-30px",
        dy3: "20px",
        dur: "7s",
        opacity: "0.9",
      },
      {
        x: "15%",
        y: "70%",
        dx1: "-20px",
        dy1: "-50px",
        dx2: "50px",
        dy2: "-20px",
        dx3: "10px",
        dy3: "40px",
        dur: "9s",
        opacity: "0.7",
      },
      {
        x: "25%",
        y: "40%",
        dx1: "30px",
        dy1: "40px",
        dx2: "-40px",
        dy2: "20px",
        dx3: "20px",
        dy3: "-50px",
        dur: "11s",
        opacity: "0.85",
      },
      {
        x: "40%",
        y: "15%",
        dx1: "-50px",
        dy1: "30px",
        dx2: "30px",
        dy2: "50px",
        dx3: "-20px",
        dy3: "-30px",
        dur: "8s",
        opacity: "0.6",
      },
      {
        x: "55%",
        y: "80%",
        dx1: "20px",
        dy1: "-60px",
        dx2: "-30px",
        dy2: "-20px",
        dx3: "50px",
        dy3: "30px",
        dur: "13s",
        opacity: "0.8",
      },
      {
        x: "65%",
        y: "30%",
        dx1: "-40px",
        dy1: "50px",
        dx2: "60px",
        dy2: "-30px",
        dx3: "-20px",
        dy3: "40px",
        dur: "10s",
        opacity: "0.75",
      },
      {
        x: "75%",
        y: "60%",
        dx1: "50px",
        dy1: "-40px",
        dx2: "-20px",
        dy2: "50px",
        dx3: "30px",
        dy3: "-20px",
        dur: "12s",
        opacity: "0.9",
      },
      {
        x: "85%",
        y: "25%",
        dx1: "-30px",
        dy1: "-20px",
        dx2: "20px",
        dy2: "-50px",
        dx3: "-50px",
        dy3: "30px",
        dur: "9s",
        opacity: "0.65",
      },
      {
        x: "90%",
        y: "75%",
        dx1: "20px",
        dy1: "30px",
        dx2: "-50px",
        dy2: "20px",
        dx3: "30px",
        dy3: "-40px",
        dur: "14s",
        opacity: "0.8",
      },
      {
        x: "50%",
        y: "50%",
        dx1: "-60px",
        dy1: "-40px",
        dx2: "40px",
        dy2: "-60px",
        dx3: "60px",
        dy3: "40px",
        dur: "16s",
        opacity: "0.5",
      },
      {
        x: "33%",
        y: "85%",
        dx1: "40px",
        dy1: "-20px",
        dx2: "-20px",
        dy2: "-40px",
        dx3: "10px",
        dy3: "30px",
        dur: "11s",
        opacity: "0.7",
      },
      {
        x: "70%",
        y: "10%",
        dx1: "-20px",
        dy1: "60px",
        dx2: "40px",
        dy2: "20px",
        dx3: "-30px",
        dy3: "-40px",
        dur: "8s",
        opacity: "0.85",
      },
    ];
    const fireflies = configs.map((c, i) => {
      const el = document.createElement("div");
      el.className = "firefly";
      el.style.cssText = `--x:${c.x};--y:${c.y};--dx1:${c.dx1};--dy1:${c.dy1};--dx2:${c.dx2};--dy2:${c.dy2};--dx3:${c.dx3};--dy3:${c.dy3};--dur:${c.dur};--max-opacity:${c.opacity};animation-delay:${(i * 1.3).toFixed(1)}s;`;
      section.appendChild(el);
      return el;
    });
    return () => fireflies.forEach((el) => el.remove());
  }, []);

  // Counter animation
  useEffect(() => {
    const counters = document.querySelectorAll(".stat-count");
    counters.forEach((counter) => {
      const target = +counter.dataset.target;
      if (!target) return;
      let count = 0;
      const step = target / 100;
      const timer = setInterval(() => {
        count += step;
        if (count >= target) {
          count = target;
          clearInterval(timer);
        }
        counter.textContent = Math.round(count).toLocaleString("vi-VN");
      }, 20);
    });
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        }),
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [featuredBooks, newBooks, bestsellerBooks]);

  const handleAddToCart = async (hashId) => {
    try {
      await addToCart(hashId, 1);
      toast.success("Đã thêm vào giỏ hàng");
    } catch {
      toast.error("Vui lòng đăng nhập để mua hàng");
    }
  };

  // Fallback skeleton books
  const skeletonBooks = [1, 2, 3, 4].map((i) => ({
    id: i,
    title: "...",
    description: "",
    coverImage: null,
    category: null,
    hashId: "",
    slug: "",
    price: 0,
    salePrice: 0,
  }));

  const displayFeatured =
    featuredBooks.length > 0 ? featuredBooks : skeletonBooks;
  const displayNew =
    newBooks.length > 0
      ? newBooks
      : featuredBooks.length > 0
        ? [...featuredBooks].reverse()
        : skeletonBooks;
  const displayBest =
    bestsellerBooks.length > 0 ? bestsellerBooks : featuredBooks;

  return (
    <>
      {/* ═══ HERO BANNER SLIDER ═══ */}
      <HeroBanner />

      {/* ═══ MARQUEE — flush below hero gradient ═══ */}
      <div
        className="marquee-section"
        style={{ marginTop: "-2px", position: "relative", zIndex: 10 }}
      >
        <div className="marquee-track">
          {[
            "Sách AR Thiên Nhiên",
            "AI Storytelling",
            "Mô Hình 3D",
            "Giáo Dục Sinh Thái",
            "Thực Tế Tăng Cường",
            "Khám Phá Thiên Nhiên",
            "Sách AR Thiên Nhiên",
            "AI Storytelling",
            "Mô Hình 3D",
            "Giáo Dục Sinh Thái",
            "Thực Tế Tăng Cường",
            "Khám Phá Thiên Nhiên",
          ].map((item, i) => (
            <div className="marquee-item" key={i}>
              {item} <div className="marquee-dot" />
            </div>
          ))}
        </div>
      </div>

      {/* ═══ STATS ═══ */}
      <section className="stats-section reveal">
        <div className="stats-inner">
          {[
            { label: "Trẻ em khám phá", value: "1.000+", count: 1000 },
            { label: "Chủ đề sinh thái", value: "5", count: 5, gold: true },
            { label: "Tương tác thực tế", value: "AI+AR", noCount: true },
            { label: "Giá trị giáo dục", value: "100%", count: 100 },
          ].map((stat, i) => (
            <div className="stat-item" key={i} style={{ "--bar-width": "85%" }}>
              <div className="stat-top">
                <div
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                  }}
                >
                  {stat.label}
                </div>
              </div>
              <div className={`stat-number ${stat.gold ? "stat-gold" : ""}`}>
                {stat.noCount ? (
                  stat.value
                ) : (
                  <>
                    <span className="stat-count" data-target={stat.count}>
                      0
                    </span>
                    {stat.value.replace(/\d+/g, "")}
                  </>
                )}
              </div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-bar">
                <div className="stat-bar-fill" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="how-section">
        <div className="how-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line" />
              <span className="section-eyebrow-text">Cách Hoạt Động</span>
              <div className="section-eyebrow-line" />
            </div>
            <h2 className="section-title">
              Hành Trình <em>Ba Bước</em>
            </h2>
            <p className="section-subtitle">
              Thế giới tự nhiên sẽ hiện ra sống động ngay trước mắt bé chỉ trong
              vài giây.
            </p>
          </div>
          <div className="how-grid">
            {[
              {
                num: "01",
                title: "Mở Sách",
                desc: "Bắt đầu hành trình với những trang sách minh họa tuyệt đẹp về thế giới tự nhiên.",
              },
              {
                num: "02",
                title: "Quét AR",
                desc: "Sử dụng ứng dụng Earthoria để quét các trang sách có biểu tượng AR đặc biệt.",
              },
              {
                num: "03",
                title: "Tương Tác 3D",
                desc: "Ngắm nhìn sinh vật sống động hiện ra trong không gian thực và trò chuyện với AI.",
              },
            ].map((step, i) => (
              <div className={`how-step reveal reveal-delay-${i + 1}`} key={i}>
                <span className="step-num">
                  {step.num} — Bước {i + 1}
                </span>
                <div className="step-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED COLLECTION (Grid) ═══ */}
      <section className="products-section">
        <div className="products-inner">
          <div className="products-top reveal">
            <div>
              <div className="section-eyebrow" style={{ marginBottom: "16px" }}>
                <div className="section-eyebrow-line" />
                <span className="section-eyebrow-text">Bộ Sưu Tập Nổi Bật</span>
              </div>
              <h2 className="section-title" style={{ textAlign: "left" }}>
                Tuyển Tập <em>Sinh Thái</em>
              </h2>
            </div>
            <Link to="/shop" className="view-all">
              Xem toàn bộ
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="products-grid">
            {displayFeatured.slice(0, 3).map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onAddCart={handleAddToCart}
                badge={book.isFeatured ? "Nổi Bật" : undefined}
                badgeType="gold"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MỚI NHẤT — Horizontal Scroll ═══ */}
      <section
        style={{
          padding: "100px 100px",
          background: "var(--ivory)",
          borderTop: "0.5px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div
            className="reveal"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "48px",
            }}
          >
            <div>
              <div
                className="section-eyebrow"
                style={{ justifyContent: "flex-start", marginBottom: "16px" }}
              >
                <div className="section-eyebrow-line" />
                <span className="section-eyebrow-text">Mới Ra Mắt</span>
              </div>
              <h2 className="section-title" style={{ textAlign: "left" }}>
                Sách <em>Mới Nhất</em>
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  marginTop: "12px",
                  fontWeight: 300,
                }}
              >
                Những đầu sách vừa ra lò — tươi mới, sinh động và đầy ắp khám
                phá.
              </p>
            </div>
            <Link to="/shop?sort=newest" className="view-all">
              Tất cả sách mới
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {/* NEW badge strip */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            {["Tất cả", "Động vật", "Thực vật", "Đại dương", "Thiên văn"].map(
              (tag, i) => (
                <button
                  key={tag}
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "7px 18px",
                    border: "0.5px solid var(--border)",
                    background: i === 0 ? "var(--forest)" : "transparent",
                    color: i === 0 ? "var(--ivory)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontFamily: "Be Vietnam Pro,sans-serif",
                    transition: "all 0.3s",
                  }}
                >
                  {tag}
                </button>
              ),
            )}
          </div>
          <BookScrollRow
            books={displayNew}
            onAddCart={handleAddToCart}
            badgeLabel="Mới"
            badgeType="forest"
          />
        </div>
      </section>

      {/* ═══ PROMO BANNER ═══ */}
      <section
        style={{
          background: "var(--forest)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(74,158,63,0.15) 0%, transparent 55%), radial-gradient(ellipse at 80% 50%, rgba(45,122,110,0.12) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            fontFamily: "Playfair Display,serif",
            fontSize: "clamp(60px,10vw,140px)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.03)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            letterSpacing: "-0.02em",
          }}
        >
          EARTHORIA
        </div>
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "80px 100px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "60px",
            alignItems: "center",
          }}
        >
          <div className="reveal">
            <div
              style={{
                fontSize: "9px",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "16px",
              }}
            >
              Ưu Đãi Có Hạn
            </div>
            <h2
              style={{
                fontFamily: "Playfair Display,serif",
                fontSize: "clamp(28px,3vw,48px)",
                fontWeight: 300,
                color: "var(--ivory)",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}
            >
              Mua Bộ 3 Cuốn —<br />
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                Tiết Kiệm 30%
              </em>
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(250,248,243,0.55)",
                marginTop: "16px",
                maxWidth: "440px",
                lineHeight: 1.8,
                fontWeight: 300,
              }}
            >
              Ưu đãi áp dụng khi mua combo 3 cuốn bất kỳ. Giao hàng miễn phí
              toàn quốc. Tặng kèm poster AR độc quyền.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginTop: "12px",
              }}
            >
             {[
  [<Truck size={16} />, 'Miễn phí ship'],
  [<Gift size={16} />, 'Poster AR'],
  [<Star size={16} />, 'Ưu tiên hỗ trợ'],
].map(
                (item) => (
                  <span
                    key={item}
                    style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
          <div
            className="reveal reveal-delay-1"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                textAlign: "center",
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid rgba(74,158,63,0.3)",
                padding: "24px 36px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: "8px",
                }}
              >
                Tiết kiệm đến
              </div>
              <div
                style={{
                  fontFamily: "Playfair Display,serif",
                  fontSize: "64px",
                  fontWeight: 300,
                  color: "var(--ivory)",
                  lineHeight: 1,
                }}
              >
                30
                <span style={{ color: "var(--gold)", fontSize: "36px" }}>
                  %
                </span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.35)",
                  marginTop: "8px",
                }}
              >
                Khi mua combo 3 cuốn
              </div>
            </div>
            <Link to="/shop">
              <button
                style={{
                  background: "var(--gold)",
                  color: "var(--ink)",
                  border: "none",
                  padding: "16px 36px",
                  cursor: "pointer",
                  fontFamily: "Be Vietnam Pro,sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  transition: "all 0.3s",
                  width: "100%",
                }}
              >
                Mua Combo Ngay
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ BÁN CHẠY — Horizontal Scroll ═══ */}
      <section style={{ padding: "100px 100px", background: "var(--cream)" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div
            className="reveal"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "48px",
            }}
          >
            <div>
              <div
                className="section-eyebrow"
                style={{ justifyContent: "flex-start", marginBottom: "16px" }}
              >
                <div className="section-eyebrow-line" />
                <span className="section-eyebrow-text">
                  Được Yêu Thích Nhất
                </span>
              </div>
              <h2 className="section-title" style={{ textAlign: "left" }}>
                Sách <em>Bán Chạy</em>
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  marginTop: "12px",
                  fontWeight: 300,
                }}
              >
                Những cuốn sách được hàng ngàn gia đình tin chọn và đánh giá cao
                nhất.
              </p>
            </div>
            <Link to="/shop?sort=bestseller" className="view-all">
              Xem thêm
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Bestseller rank podium */}
          {displayBest.length > 0 && (
            <div
              className="reveal"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.1fr 1fr",
                gap: "16px",
                marginBottom: "48px",
              }}
            >
              {[displayBest[1], displayBest[0], displayBest[2]]
                .filter(Boolean)
                .map((book, i) => {
                  const ranks = [2, 1, 3];
                  const rank = ranks[i];
                  const sizes = ["normal", "large", "normal"];
                  return (
                    <div
                      key={book.id}
                      style={{
                        background:
                          rank === 1
                            ? "linear-gradient(135deg, #0d3330 0%, #1a5c52 50%, #4a9e3f 100%)"
                            : "var(--white)",
                        border:
                          rank === 1 ? "none" : "0.5px solid var(--border)",
                        padding: "28px 24px",
                        textAlign: "center",
                        transform: rank === 1 ? "none" : "none",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "-8px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          background:
                            rank === 1
                              ? "var(--gold)"
                              : rank === 2
                                ? "#a0a8a4"
                                : "#c08840",
                          color: "var(--ivory)",
                          fontFamily: "Playfair Display,serif",
                          fontSize: "11px",
                          fontWeight: 500,
                          padding: "4px 16px",
                          letterSpacing: "0.1em",
                        }}
                      >
                        #{rank}
                      </div>
                      <div
                        style={{
                          marginTop: "12px",
                          width: "80px",
                          height: "100px",
                          overflow: "hidden",
                          border:
                            "2px solid " +
                            (rank === 1
                              ? "rgba(255,255,255,0.2)"
                              : "var(--border)"),
                        }}
                      >
                        <img
                          src={
                            book.coverImage ||
                            "https://via.placeholder.com/80x100"
                          }
                          alt={book.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontFamily: "Playfair Display,serif",
                          fontSize: rank === 1 ? "18px" : "15px",
                          fontWeight: 400,
                          color: rank === 1 ? "var(--ivory)" : "var(--forest)",
                          lineHeight: 1.3,
                        }}
                      >
                        {book.title}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color:
                            rank === 1
                              ? "rgba(255,255,255,0.6)"
                              : "var(--text-muted)",
                        }}
                      >
                        {book.category?.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "Playfair Display,serif",
                          fontSize: "20px",
                          color: rank === 1 ? "var(--gold)" : "var(--forest)",
                        }}
                      >
                        {formatPrice(book.salePrice || book.price)}
                      </div>
                      <button
                        onClick={() => handleAddToCart(book.hashId)}
                        style={{
                          background:
                            rank === 1 ? "var(--gold)" : "var(--forest)",
                          color: rank === 1 ? "var(--ink)" : "var(--ivory)",
                          border: "none",
                          padding: "10px 24px",
                          cursor: "pointer",
                          fontFamily: "Be Vietnam Pro,sans-serif",
                          fontSize: "10px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          transition: "all 0.3s",
                          width: "100%",
                        }}
                      >
                        Thêm Vào Giỏ
                      </button>
                    </div>
                  );
                })}
            </div>
          )}

          <BookScrollRow
            books={displayBest}
            onAddCart={handleAddToCart}
            badgeLabel="Bán Chạy"
            badgeType="gold"
          />
        </div>
      </section>

      {/* ═══ APP SHOWCASE (TECH SECTION) ═══ */}
      <AppShowcase />

      {/* ═══ VALUES ═══ */}
      <section className="values-section">
        <div className="values-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line" />
              <span className="section-eyebrow-text">Giá Trị Cốt Lõi</span>
              <div className="section-eyebrow-line" />
            </div>
            <h2 className="section-title">
              Phát Triển <em>Toàn Diện</em>
            </h2>
            <p className="section-subtitle">
              Thiết kế dựa trên phương pháp giáo dục hiện đại.
            </p>
          </div>
          <div className="values-grid">
            {[
              {
                num: "01",
                title: "Khơi Dậy Sáng Tạo",
                desc: "Hình ảnh 3D chân thực kích thích trí tưởng tượng.",
              },
              {
                num: "02",
                title: "Tư Duy Phản Biện",
                desc: "Thông qua tương tác hỏi đáp với AI, trẻ rèn luyện kỹ năng phân tích.",
              },
              {
                num: "03",
                title: "Kiến Thức Bền Vững",
                desc: "Xây dựng tình yêu thiên nhiên và ý thức bảo vệ môi trường.",
              },
            ].map((v, i) => (
              <div
                className={`value-item reveal reveal-delay-${i + 1}`}
                key={i}
              >
                <div className="value-num">{v.num}</div>
                <h3 className="value-title">{v.title}</h3>
                <p className="value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ JOURNEY ═══ */}
      <section className="journey-section">
        <div className="journey-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line" />
              <span className="section-eyebrow-text">Lộ Trình Học Tập</span>
              <div className="section-eyebrow-line" />
            </div>
            <h2 className="section-title">
              Hành Trình <em>Tri Thức</em>
            </h2>
            <p className="section-subtitle">
              Từ những bước đầu tiên đến khi thành thạo — Earthoria đồng hành
              mỗi chặng đường.
            </p>
          </div>
          <div className="journey-steps">
            {[
              {
                num: "01",
                title: "Khám Phá",
                desc: "Mở cuốn sách đầu tiên và để trí tò mò dẫn lối.",
              },
              {
                num: "02",
                title: "Tương Tác",
                desc: "Trò chuyện với 3D, hỏi đáp cùng AI thông minh.",
              },
              {
                num: "03",
                title: "Ghi Nhớ",
                desc: "Kiến thức hình ảnh đọng lại sâu hơn 5 lần so với đọc thông thường.",
              },
              {
                num: "04",
                title: "Tiến Bộ",
                desc: "AI theo dõi và điều chỉnh lộ trình học theo nhịp độ của từng bé.",
              },
            ].map((step, i) => (
              <div
                className={`journey-step reveal reveal-delay-${i + 1}`}
                key={i}
              >
                <div className="journey-step-num">{step.num}</div>
                <h3 className="journey-step-title">{step.title}</h3>
                <p className="journey-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="reviews-section">
        <div className="reviews-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line" />
              <span className="section-eyebrow-text">
                Phụ Huynh & Giáo Viên Nói Gì
              </span>
              <div className="section-eyebrow-line" />
            </div>
            <h2 className="section-title">
              Tin Tưởng Từ <em>Cộng Đồng</em>
            </h2>
          </div>
          <div className="reviews-grid">
            {REVIEWS.map((r, i) => (
              <div
                className={`review-card reveal reveal-delay-${i + 1}`}
                key={i}
              >
                <span className="review-quote-mark">"</span>
                <div className="review-stars">
                  {[...Array(r.stars)].map((_, j) => (
                    <span key={j} className="star">
                      ★
                    </span>
                  ))}
                </div>
                <p className="review-text">"{r.text}"</p>
                <div className="review-author">
                  <div className="review-avatar">{r.initial}</div>
                  <div>
                    <div className="review-name">{r.name}</div>
                    <div className="review-role">{r.role}</div>
                  </div>
                  <div
                    className="verified-badge"
                    style={{ marginLeft: "auto" }}
                  >
                    Đã xác minh
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust numbers below reviews */}
          <div
            className="reveal"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "0",
              marginTop: "64px",
              border: "0.5px solid var(--border)",
            }}
          >
            {[
              ["98%", "Phụ huynh hài lòng"],
              ["4.9★", "Đánh giá trung bình"],
              ["1,000+", "Gia đình tin dùng"],
              ["30 ngày", "Đổi trả miễn phí"],
            ].map(([val, label], i, arr) => (
              <div
                key={label}
                style={{
                  padding: "32px 28px",
                  textAlign: "center",
                  borderRight:
                    i < arr.length - 1 ? "0.5px solid var(--border)" : "none",
                  background: "var(--ivory)",
                }}
              >
                <div
                  style={{
                    fontFamily: "Playfair Display,serif",
                    fontSize: "36px",
                    fontWeight: 300,
                    color: "var(--forest)",
                    marginBottom: "6px",
                  }}
                >
                  {val}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ NEWSLETTER ═══ */}
      <NewsletterSection />

      {/* ═══ CTA BANNER ═══ */}
      <section className="cta-section" id="cta-section" ref={ctaRef}>
        <div className="cta-bg-text">Earthoria</div>
        <span className="cta-eyebrow reveal">Bắt Đầu Hành Trình</span>
        <h2 className="cta-headline reveal">
          Mỗi trang sách là một cánh cửa —<br />
          <em>Mở ra thế giới mới</em>
        </h2>
        <p className="cta-sub reveal">
          Hãy để Earthoria đồng hành cùng bé trên hành trình khám phá tri thức.
        </p>
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
  );
}
