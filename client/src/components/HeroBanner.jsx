import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

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
    video:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4",
    badge: "Bestseller",
    ctaLabel: "Khám phá bộ sưu tập",
    ctaLink: "/shop",
  },
  {
    id: 2,
    eyebrow: "Bộ Sưu Tập Mới 2025",
    headline: [
      "Khám Phá —",
      <br key="br2" />,
      <em key="em2">Kiến Thức</em>,
      <br key="br2b" />,
      "Kỳ Diệu",
    ],
    sub: "Học thêm được nhiều kiến thức hay qua từng trang sách được tái hiện hoàn toàn bằng công nghệ AR 3D.",
    video:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4",
    badge: "Mới Ra Mắt",
    ctaLabel: "Xem bộ sưu tập",
    ctaLink: "/shop?cat=new",
  },
  {
    id: 3,
    eyebrow: "Mở Khóa Tiềm Năng",
    headline: [
      "Tiềm Năng —",
      <br key="br3" />,
      <em key="em3">Vô Hạn</em>,
      <br key="br3b" />,
      "Trong Tay Bé",
    ],
    sub: "Mở khóa tiềm năng vô hạn — hơn 80 loài động vật bước ra từ trang sách, kể chuyện bằng giọng AI thân thiện.",
    video:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4",
    badge: "Yêu Thích",
    ctaLabel: "Khám phá ngay",
    ctaLink: "/shop?cat=forest",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [thumbsLoaded, setThumbsLoaded] = useState(false);
  const timerRef = useRef(null);
  const videoRefs = useRef([]);
  const wrapRef = useRef(null);
  const thumbsRef = useRef(null);
  const total = HERO_SLIDES.length;

  /* Chỉ tải/phát video chính khi banner thực sự hiện trên màn hình */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Thumbnail bên phải: chỉ bắt đầu tải video khi người dùng cuộn gần tới (tránh tải ngầm lúc trang vừa mở) */
  useEffect(() => {
    const el = thumbsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setThumbsLoaded(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setThumbsLoaded(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const goTo = useCallback(
    (idx) => {
      if (animating || idx === current) return;
      setAnimating(true);
      setPrev(current);
      setCurrent(idx);
      setTimeout(() => {
        setPrev(null);
        setAnimating(false);
      }, 900);
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

  /* Auto-advance */
  useEffect(() => {
    if (paused || !inView) return;
    timerRef.current = setInterval(next, 7000);
    return () => clearInterval(timerRef.current);
  }, [next, paused, inView]);

  /* Play / pause video on slide change — chỉ phát khi banner đang hiển thị */
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === current && inView) {
        if (v.currentTime > 0.05) v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [current, inView]);

  return (
    <>
      <style>{`
        /* ── keyframes ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sliderProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }

        /* ── wrapper ── */
        .hb-wrap {
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 720px;
          overflow: hidden;
          background: #0d2b1e;
        }

        /* ── video layer ── */
        .hb-bg {
          position: absolute; inset: 0; z-index: 0;
          overflow: hidden;
          background: #0d2b1e;
        }
        .hb-bg video {
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center center;
          filter: saturate(0.75) brightness(0.52);
          transition: opacity 0.9s ease;
        }
        .hb-bg video.hb-bg-active { opacity: 1; }
        .hb-bg video.hb-bg-exit   { opacity: 0; }

        /* ── overlays ── */
       .hb-overlay-left {
  position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(
    105deg,
    rgba(13,43,30,0.92) 0%,
    rgba(13,43,30,0.72) 35%,
    rgba(13,43,30,0.12) 58%,
    transparent 100%
  );
}
        .hb-overlay-bottom {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 2;
          height: 200px;
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
          display: flex; flex-direction: column; justify-content: flex-start;
          padding: 120px 100px 220px;
          max-width: 820px;
        }

        /* eyebrow */
        .hb-eyebrow {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 28px;
        }
        .hb-eyebrow-line {
          width: 36px; height: 0.5px;
          background: var(--gold); flex-shrink: 0;
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
          font-size: clamp(44px, 5.5vw, 82px);
          font-weight: 300; line-height: 1.04;
          color: var(--ivory); letter-spacing: -0.015em;
          margin-bottom: 18px;
          text-shadow: 0 2px 40px rgba(0,0,0,0.4);
        }
        .hb-headline em { font-style: italic; color: var(--gold); }

        /* sub */
        .hb-sub {
          font-size: 15px; line-height: 1.8;
          color: rgba(250,248,243,0.72);
          font-weight: 300;
          max-width: 480px;
          margin-bottom: 28px;
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
          background: var(--gold-light); gap: 20px;
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
          bottom: 110px; left: 100px;
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
        .hb-dot.active { width: 40px; background: var(--gold); }

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
          flex-shrink: 0; position: relative;
          background: rgba(255,255,255,0.06);
        }
        .hb-thumb video {
          width: 100%; height: 100%;
          object-fit: cover;
          pointer-events: none;
        }
        .hb-thumb.active, .hb-thumb:hover {
          border-color: var(--gold);
          opacity: 1; filter: saturate(1) brightness(1);
        }
        .hb-thumb-label {
          position: absolute; bottom: 0; left: 0; right: 0;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--gold); text-align: center;
          background: rgba(0,0,0,0.45); padding: 2px 0;
          opacity: 0; transition: opacity 0.3s;
        }
        .hb-thumb.active .hb-thumb-label { opacity: 1; }

        /* ── Progress bar ── */
        .hb-progress-rail {
          position: absolute; top: 0; left: 0; right: 0;
          height: 1.5px; background: rgba(255,255,255,0.08); z-index: 5;
        }
        .hb-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gold), var(--gold-light));
        }

        /* ── Vertical slide label ── */
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

        /* ── Mute button ── */
        .hb-mute-btn {
          position: absolute; top: 100px; right: 52px; z-index: 4;
          width: 40px; height: 40px;
          border: 0.5px solid rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(10px);
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s;
        }
        .hb-mute-btn:hover {
          border-color: var(--gold);
          background: rgba(74,158,63,0.18);
          color: var(--gold);
        }

        /* responsive */
        @media (max-width: 900px) {
          .hb-content { padding: 100px 36px 140px; }
          .hb-controls { left: 36px; bottom: 36px; }
          .hb-thumbs   { display: none; }
          .hb-slide-label { display: none; }
          .hb-scroll  { display: none; }
          .hb-mute-btn { right: 16px; top: 90px; }
        }
        @media (max-width: 600px) {
          .hb-headline { font-size: clamp(32px, 8.5vw, 51px); }
          .hb-cta-row  { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <section
        className="hb-wrap"
        ref={wrapRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Progress rail */}
        <div className="hb-progress-rail">
          <div
            key={current}
            className="hb-progress-fill"
            style={{
              animation: paused ? "none" : "sliderProgress 7s linear forwards",
            }}
          />
        </div>

        {/* VIDEO backgrounds — chỉ mount video thật cho slide đang chạy / vừa rời đi / sắp tới, tránh tải+giải mã đồng thời cả 3 */}
        {HERO_SLIDES.map((s, i) => {
          const isCurrent = i === current;
          const isPrev = i === prev;
          const isNext = i === (current + 1) % total;
          const shouldMount = isCurrent || isPrev || isNext;
          return (
            <div
              key={s.id}
              className="hb-bg"
              style={{
                opacity: isCurrent ? 1 : isPrev ? 1 : 0,
                transition: "opacity 0.9s ease",
                zIndex: isCurrent ? 0 : isPrev ? 0 : -1,
              }}
            >
              {shouldMount && (
                <video
                  ref={(el) => (videoRefs.current[i] = el)}
                  className={isCurrent ? "hb-bg-active" : "hb-bg-exit"}
                  src={s.video}
                  loop
                  muted
                  playsInline
                  preload={isCurrent ? "auto" : "metadata"}
                />
              )}
            </div>
          );
        })}

        {/* Left vignette */}
        <div className="hb-overlay-left" />

        {/* Bottom gradient */}
        <div className="hb-overlay-bottom" />

        {/* SLIDE CONTENT */}
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
            <div className="hb-eyebrow">
              <div className="hb-eyebrow-line" />
              <span className="hb-eyebrow-text">{s.eyebrow}</span>
              {s.badge && <span className="hb-badge">{s.badge}</span>}
            </div>

            <h1 className="hb-headline">{s.headline}</h1>

            <p className="hb-sub">{s.sub}</p>

            <div className="hb-cta-row">
              <Link to={s.ctaLink}>
                <button className="hb-btn-main">
                  {s.ctaLabel}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
              <button className="hb-btn-ghost">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Xem demo AR
              </button>
            </div>
          </div>
        ))}

        {/* CONTROLS (bottom-left) */}
        <div className="hb-controls">
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

          <span className="hb-counter">
            {String(current + 1).padStart(2, "0")}{" "}
            <span style={{ color: "rgba(255,255,255,0.18)", margin: "0 4px" }}>/</span>{" "}
            {String(total).padStart(2, "0")}
          </span>

          <div className="hb-arrows">
            <button className="hb-arrow" onClick={prev_} aria-label="Previous">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="hb-arrow" onClick={next} aria-label="Next">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Vertical slide label */}
        <div className="hb-slide-label">{HERO_SLIDES[current].eyebrow}</div>

        {/* Thumbnails (right side) — hiển thị poster frame đầu video */}
        <div className="hb-thumbs" ref={thumbsRef}>
          {HERO_SLIDES.map((s, i) => (
            <div
              key={s.id}
              className={`hb-thumb ${i === current ? "active" : ""}`}
              onClick={() => goTo(i)}
            >
              {thumbsLoaded && (
                <video
                  src={s.video}
                  muted
                  playsInline
                  loop
                  preload="metadata"
                  autoPlay={i === current}
                  style={{ pointerEvents: "none" }}
                  ref={(el) => {
                    if (!el) return;
                    if (i === current) el.play().catch(() => {});
                    else el.pause();
                  }}
                />
              )}
              <div className="hb-thumb-label">{String(i + 1).padStart(2, "0")}</div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="hb-scroll">
          <div className="hb-scroll-line" />
          <span className="hb-scroll-text">Scroll</span>
        </div>
      </section>
    </>
  );
}