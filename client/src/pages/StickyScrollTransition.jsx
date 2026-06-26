import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";

export default function StickyScrollTransition() {
  const wrapRef = useRef(null);       // outer wrapper — tạo scroll height
  const sceneRef = useRef(null);      // panel ghim sticky
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);
  const [isOpen, setIsOpen] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);

  /* ── particles ── */
  const stopParticles = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    particlesRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    if (!canvas || !scene) return;
    canvas.width = scene.offsetWidth;
    canvas.height = scene.offsetHeight;
    const count = Math.min(60, Math.floor(canvas.width / 14));
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.6 + 0.15, pulse: Math.random() * Math.PI * 2,
    }));
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const loop = () => {
      if (!canvasRef.current) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.02;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        const alpha = p.a * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74,158,63,${alpha})`; ctx.fill();
      });
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 90) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(74,158,63,${0.12*(1-dist/90)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  const openPanel = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => { setCardsVisible(true); initParticles(); }, 200);
  }, [initParticles]);

  const closePanel = useCallback(() => {
    setIsOpen(false); setCardsVisible(false); stopParticles();
  }, [stopParticles]);

  /* ── Sticky scroll logic ──
     wrapper cao = 100vh (collapsed) + 400px extra
     Khi scroll tới wrapper → scene ghim top:0
     progress 0→1 trong khoảng extra scroll đó
     progress > 0.15 → mở panel; < 0.05 → đóng
  */
  useEffect(() => {
    const EXTRA = 500; // px người dùng phải scroll qua để "xem xong"
    const onScroll = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      // rect.top < 0 nghĩa là đã scroll qua top của wrapper
      const scrolled = -rect.top; // px đã scroll bên trong wrapper
      const progress = Math.max(0, Math.min(1, scrolled / EXTRA));

      if (progress > 0.15) openPanel();
      else closePanel();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // check ngay khi mount
    return () => { window.removeEventListener("scroll", onScroll); stopParticles(); };
  }, [openPanel, closePanel, stopParticles]);

  useEffect(() => {
    if (isOpen) initParticles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleResize = () => { if (isOpen) initParticles(); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, initParticles]);

  const CARDS = [
    {
      n: "01", tag: "AR Technology", name: "Thực Tế Tăng Cường",
      desc: "Quét trang sách — sinh vật 3D hiện ra sống động trong không gian thực ngay trước mắt bạn.",
      w: "88%",
      icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12h20M12 2l8 10-8 10-8-10z"/></svg>),
    },
    {
      n: "02", tag: "AI Dialogue", name: "Trò Chuyện Với AI",
      desc: "Hỏi bất kỳ sinh vật nào, nhận câu trả lời bằng giọng nói tự nhiên — như người bạn đồng hành.",
      w: "75%",
      icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
    },
    {
      n: "03", tag: "3D Visualization", name: "Mô Hình 3D Sống Động",
      desc: "80+ loài sinh vật dựng hình 3D chân thực — xoay, phóng to, khám phá từng chi tiết.",
      w: "92%",
      icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
    },
    {
      n: "04", tag: "Adaptive Learning", name: "Học Cùng Bạn Lớn",
      desc: "AI theo dõi tiến trình, điều chỉnh nội dung phù hợp với từng người — học đúng tốc độ của bạn.",
      w: "68%",
      icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>),
    },
  ];

  return (
    <>
      <style>{`
        /* ── Wrapper tạo scroll height ── */
        .eb-wrap {
          position: relative;
          height: calc(100vh + 500px);
        }

        /* ── Scene ghim sticky ── */
        .eb-scene {
          position: sticky;
          top: 0;
          overflow: hidden;
          background: linear-gradient(180deg,#0d3330 0%,#060c09 45%,#060c09 55%,#0d3330 100%);
          height: 100vh;
          border-top: 0.5px solid rgba(74,158,63,0.2);
          border-bottom: 0.5px solid rgba(74,158,63,0.2);
        }

        /* ── Panel nội dung — thu/phóng bằng scale+opacity ── */
        .eb-panel {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1);
        }

        /* Trạng thái đóng: thu nhỏ nhẹ */
        .eb-panel.collapsed {
          opacity: 1;
          transform: scale(1);
        }
        /* Trạng thái mở: full */
        .eb-panel.expanded {
          opacity: 1;
          transform: scale(1);
        }

        /* compact bar — hiện khi đóng */
        .eb-compact {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.35s, transform 0.45s;
        }
        .open .eb-compact { opacity: 0; transform: translateY(-20px); pointer-events: none; }

        /* expanded content — hiện khi mở */
        .eb-expanded {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.5s 0.15s;
        }
        .open .eb-expanded { opacity: 1; pointer-events: auto; }

        /* canvas */
        #eb-canvas {
          position: absolute; inset: 0; z-index: 0;
          opacity: 0; transition: opacity 0.8s 0.2s; pointer-events: none;
        }
        .open #eb-canvas { opacity: 1; }

        .eb-glow {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 40% at 20% 50%,rgba(13,58,34,0.6) 0%,transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 50%,rgba(74,158,63,0.08) 0%,transparent 70%);
        }
        .eb-hline {
          position: absolute; left: 80px; right: 80px; top: 50%; height: 0.5px;
          background: linear-gradient(90deg,transparent,rgba(74,158,63,0.35) 50%,transparent);
          z-index: 1; pointer-events: none;
          transition: top 0.7s cubic-bezier(0.16,1,0.3,1), opacity 0.4s;
        }
        .open .eb-hline { top: 88px; opacity: 0.3; }

        .eb-watermark {
          position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
          font-family: 'Playfair Display',serif;
          font-size: clamp(24px,4vw,48px); font-weight: 300;
          color: rgba(255,255,255,0.018); white-space: nowrap; letter-spacing: 0.22em;
          user-select: none; pointer-events: none; z-index: 0;
        }

        /* ── Compact bar ── */
        .eb-bar {
          max-width: 1200px; width: 100%; padding: 0 80px;
          display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
        }
        .eb-stat { display: flex; flex-direction: column; gap: 5px; }
        .eb-stat-l { align-items: flex-start; padding-right: 40px; }
        .eb-stat-r { align-items: flex-end; padding-left: 40px; }
        .eb-tag {
          font-family: 'Be Vietnam Pro',sans-serif;
          font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase;
          color: #4a9e3f; display: flex; align-items: center; gap: 8px;
        }
        .eb-tag::before { content:''; width:18px; height:0.5px; background:#4a9e3f; flex-shrink:0; }
        .eb-stat-r .eb-tag { flex-direction: row-reverse; }
        .eb-stat-r .eb-tag::before { order: -1; }
        .eb-num {
          font-family: 'Playfair Display',serif;
          font-size: clamp(26px,3vw,42px); font-weight: 300;
          color: rgba(255,255,255,0.07); line-height: 1;
        }
        .eb-title {
          font-family: 'Playfair Display',serif;
          font-size: 17px; font-weight: 300; color: rgba(250,248,243,0.55); line-height: 1.25;
        }
        .eb-title em { font-style: italic; color: #4a9e3f; }
        .eb-sub {
          font-family: 'Be Vietnam Pro',sans-serif;
          font-size: 11px; font-weight: 300;
          color: rgba(255,255,255,0.2); letter-spacing: 0.04em; margin-top: 1px;
        }

        /* ── Orb ── */
        .eb-orb-wrap {
          position: relative; width: 56px; height: 56px;
          display: flex; align-items: center; justify-content: center; z-index: 5;
        }
        .eb-orb-ring {
          position: absolute; border-radius: 50%;
          border: 0.5px solid rgba(74,158,63,0.18);
          animation: orbPulse 3s ease-in-out infinite;
        }
        .eb-orb-ring:nth-child(1){width:40px;height:40px;}
        .eb-orb-ring:nth-child(2){width:56px;height:56px;animation-delay:0.9s;opacity:0.6;}
        .eb-orb-ring:nth-child(3){width:72px;height:72px;animation-delay:1.8s;opacity:0.3;}
        @keyframes orbPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.1);opacity:0;}}
        .eb-orb-diamond {
          width:24px;height:24px;border:0.5px solid rgba(74,158,63,0.5);
          transform:rotate(45deg);background:rgba(74,158,63,0.08);position:relative;
        }
        .eb-orb-diamond::before{content:'';position:absolute;inset:4px;border:0.5px solid rgba(74,158,63,0.2);}
        .eb-orb-dot{
          position:absolute;width:5px;height:5px;border-radius:50%;
          background:#4a9e3f;box-shadow:0 0 12px rgba(74,158,63,0.8);
        }
        .eb-orb-label{
          font-family:'Be Vietnam Pro',sans-serif;
          font-size:8px;letter-spacing:0.3em;text-transform:uppercase;
          color:rgba(255,255,255,0.15);position:absolute;bottom:-22px;white-space:nowrap;
        }

        /* ── Scroll hint (chỉ hiện khi đóng) ── */
        .eb-scroll-hint{
          position:absolute;bottom:24px;left:50%;transform:translateX(-50%);
          display:flex;flex-direction:column;align-items:center;gap:5px;
          pointer-events:none;z-index:4;transition:opacity 0.3s;
        }
        .open .eb-scroll-hint{opacity:0;}
        .eb-scroll-hint span{
          font-family:'Be Vietnam Pro',sans-serif;
          font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(74,158,63,0.45);
        }
        .eb-scroll-line{
          width:1px;height:24px;
          background:linear-gradient(to bottom,rgba(74,158,63,0.5),transparent);
          animation:scrollDrop 1.8s ease-in-out infinite;
        }
        @keyframes scrollDrop{0%,100%{transform:translateY(0);opacity:0.5;}50%{transform:translateY(5px);opacity:1;}}
        .eb-scroll-arrow{
          width:8px;height:8px;
          border-right:1px solid rgba(74,158,63,0.5);border-bottom:1px solid rgba(74,158,63,0.5);
          transform:rotate(45deg);margin-top:-4px;
        }

        /* ── Bridge ── */
        .eb-bridge-head{
          display:flex;align-items:center;gap:20px;margin-bottom:20px;
          opacity:0;transform:translateY(12px);
          transition:opacity 0.5s 0.1s,transform 0.5s 0.1s;
        }
        .open .eb-bridge-head{opacity:1;transform:translateY(0);}
        .eb-bridge-node{display:flex;flex-direction:column;align-items:center;gap:6px;}
        .eb-bridge-icon{
          width:44px;height:44px;border:0.5px solid rgba(74,158,63,0.35);
          background:rgba(74,158,63,0.06);display:flex;align-items:center;justify-content:center;
          color:#4a9e3f;
        }
        .eb-bridge-icon.active{
          border-color:rgba(74,158,63,0.7);background:rgba(74,158,63,0.15);
          box-shadow:0 0 24px rgba(74,158,63,0.25);
        }
        .eb-bridge-label{
          font-family:'Be Vietnam Pro',sans-serif;
          font-size:9px;letter-spacing:0.2em;text-transform:uppercase;
          color:rgba(255,255,255,0.35);white-space:nowrap;
        }
        .eb-bridge-connector{display:flex;align-items:center;gap:4px;flex:1;min-width:60px;}
        .eb-connector-line{
          flex:1;height:0.5px;
          background:linear-gradient(90deg,rgba(74,158,63,0.2),rgba(74,158,63,0.5),rgba(74,158,63,0.2));
          position:relative;overflow:hidden;
        }
        .eb-connector-pulse{
          position:absolute;top:0;left:-40%;width:40%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(74,158,63,0.8),transparent);
          animation:connPulse 2.2s ease-in-out infinite;
        }
        @keyframes connPulse{0%{left:-40%;}100%{left:140%;}}
        .eb-connector-dot{width:5px;height:5px;border-radius:50%;background:#4a9e3f;box-shadow:0 0 8px rgba(74,158,63,0.6);flex-shrink:0;}

        /* ── Cards ── */
        .eb-cards{
          display:grid;grid-template-columns:repeat(4,1fr);
          gap:10px;max-width:1100px;width:100%;
          padding:0 60px;margin-bottom:20px;
        }
        .eb-card{
          border:0.5px solid rgba(74,158,63,0.2);background:rgba(255,255,255,0.025);
          padding:16px 14px 14px;display:flex;flex-direction:column;gap:8px;
          position:relative;overflow:hidden;
          opacity:0;transform:translateY(18px);
          transition:opacity 0.5s,transform 0.5s,border-color 0.35s,background 0.35s,box-shadow 0.35s;
        }
        .eb-card::after{
          content:'';position:absolute;inset:0;
          background:radial-gradient(ellipse at 50% 0%,rgba(74,158,63,0.12),transparent 70%);
          opacity:0;transition:opacity 0.35s;
        }
        .eb-card.show{opacity:1;transform:translateY(0);}
        .eb-card:nth-child(1){transition-delay:0.05s,0.05s,0s,0s,0s;}
        .eb-card:nth-child(2){transition-delay:0.12s,0.12s,0s,0s,0s;}
        .eb-card:nth-child(3){transition-delay:0.19s,0.19s,0s,0s,0s;}
        .eb-card:nth-child(4){transition-delay:0.26s,0.26s,0s,0s,0s;}
        .eb-card:hover{
          border-color:rgba(74,158,63,0.55);background:rgba(74,158,63,0.07);
          transform:translateY(-3px);
          box-shadow:0 12px 32px rgba(0,0,0,0.3),0 0 0 0.5px rgba(74,158,63,0.3);
        }
        .eb-card:hover::after{opacity:1;}
        .eb-card-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2px;}
        .eb-card-icon{
          width:32px;height:32px;border:0.5px solid rgba(74,158,63,0.3);
          display:flex;align-items:center;justify-content:center;color:#4a9e3f;flex-shrink:0;transition:all 0.35s;
        }
        .eb-card:hover .eb-card-icon{background:rgba(74,158,63,0.12);border-color:rgba(74,158,63,0.6);box-shadow:0 0 12px rgba(74,158,63,0.2);}
        .eb-card-num{font-family:'Playfair Display',serif;font-size:26px;font-weight:300;color:rgba(255,255,255,0.04);line-height:1;}
        .eb-card-tag{font-family:'Be Vietnam Pro',sans-serif;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(74,158,63,0.6);}
        .eb-card-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:400;color:rgba(250,248,243,0.82);line-height:1.2;}
        .eb-card-desc{font-family:'Be Vietnam Pro',sans-serif;font-size:11px;font-weight:300;line-height:1.6;color:rgba(250,248,243,0.38);flex:1;}
        .eb-card-bar{height:1.5px;background:rgba(255,255,255,0.06);border-radius:1px;overflow:hidden;margin-top:4px;}
        .eb-card-bar-fill{
          height:100%;border-radius:1px;
          background:linear-gradient(90deg,#4a9e3f,#5cb84f);
          width:0;transition:width 1.2s cubic-bezier(0.16,1,0.3,1) 0.4s;
        }
        .eb-card.show .eb-card-bar-fill{width:var(--bar-w,70%);}

        /* ── CTA ── */
        .eb-cta{display:flex;align-items:center;gap:10px;position:relative;z-index:5;}
        .eb-btn-primary{
          font-family:'Be Vietnam Pro',sans-serif;
          font-size:10px;letter-spacing:0.18em;text-transform:uppercase;
          color:#060c09;background:#4a9e3f;border:none;padding:12px 26px;cursor:pointer;
          display:flex;align-items:center;gap:10px;transition:all 0.3s;
          position:relative;overflow:hidden;text-decoration:none;
        }
        .eb-btn-primary::before{
          content:'';position:absolute;inset:0;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
          transform:translateX(-100%);transition:transform 0.5s;
        }
        .eb-btn-primary:hover{background:#5cb84f;gap:16px;}
        .eb-btn-primary:hover::before{transform:translateX(100%);}
        .eb-btn-secondary{
          font-family:'Be Vietnam Pro',sans-serif;
          font-size:10px;letter-spacing:0.16em;text-transform:uppercase;
          color:rgba(255,255,255,0.65);background:rgba(255,255,255,0.04);
          border:0.5px solid rgba(255,255,255,0.18);padding:11px 20px;cursor:pointer;
          display:flex;align-items:center;gap:8px;transition:all 0.3s;
        }
        .eb-btn-secondary:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.35);color:#fff;}

        /* ── Collapse hint ── */
        .eb-collapse-hint{
          position:absolute;top:12px;right:16px;z-index:10;
          font-family:'Be Vietnam Pro',sans-serif;
          font-size:9px;letter-spacing:0.18em;text-transform:uppercase;
          color:rgba(74,158,63,0.35);display:flex;align-items:center;gap:6px;
          opacity:0;transition:opacity 0.4s 0.5s;pointer-events:none;
        }
        .open .eb-collapse-hint{opacity:1;}
        .eb-collapse-hint::before{content:'';width:14px;height:0.5px;background:rgba(74,158,63,0.3);}

        /* ── Responsive ── */
        @media(max-width:1100px){.eb-bar{padding:0 40px;}.eb-cards{padding:0 40px;}.eb-hline{left:40px;right:40px;}}
        @media(max-width:768px){
          .eb-cards{grid-template-columns:repeat(2,1fr);padding:0 20px;gap:8px;}
          .eb-bar{padding:0 20px;}
          .eb-stat-l{padding-right:12px;}.eb-stat-r{padding-left:12px;}
          .eb-sub{display:none;}.eb-bridge-head{display:none;}
        }
        @media(max-width:480px){.eb-card-desc{display:none;}}
        @media(prefers-reduced-motion:reduce){
          .eb-orb-ring{animation:none!important;}
          .eb-scroll-line{animation:none!important;}
          .eb-connector-pulse{animation:none!important;}
        }
      `}</style>

      {/* Wrapper tạo scroll height để scene có chỗ "ghim" */}
      <div ref={wrapRef} className="eb-wrap">
        <div className={`eb-scene${isOpen ? " open" : ""}`} ref={sceneRef}>
          <canvas id="eb-canvas" ref={canvasRef} />
          <div className="eb-glow" />
          <div className="eb-hline" />
          <div className="eb-watermark">EARTHORIA</div>

          {/* ── Compact bar (khi đóng) ── */}
          <div className="eb-compact">
            <div className="eb-bar">
              <div className="eb-stat eb-stat-l">
                <div className="eb-tag">Người Dùng</div>
                <div className="eb-num">You</div>
                <div className="eb-title">Kết Nối <em>Công Nghệ</em></div>
                <div className="eb-sub">Earthoria là cầu nối của bạn</div>
              </div>
              <div className="eb-orb-wrap">
                <div className="eb-orb-ring"/><div className="eb-orb-ring"/><div className="eb-orb-ring"/>
                <div className="eb-orb-diamond"/>
                <div className="eb-orb-dot"/>
                <span className="eb-orb-label">Earthoria</span>
              </div>
              <div className="eb-stat eb-stat-r">
                <div className="eb-tag">Công Nghệ</div>
                <div className="eb-num">AR·AI</div>
                <div className="eb-title"><em>Tương Tác</em> 3D</div>
                <div className="eb-sub">Quét sách · Nhận diện tức thì</div>
              </div>
            </div>
          </div>

          {/* scroll hint */}
          <div className="eb-scroll-hint">
            <span>Cuộn xuống khám phá</span>
            <div className="eb-scroll-line"/>
            <div className="eb-scroll-arrow"/>
          </div>

          {/* ── Expanded (khi mở) ── */}
          <div className="eb-expanded">
            {/* Bridge */}
            <div className="eb-bridge-head">
              <div className="eb-bridge-node">
                <div className="eb-bridge-icon active">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span className="eb-bridge-label">Người Dùng</span>
              </div>
              <div className="eb-bridge-connector">
                <div className="eb-connector-dot"/>
                <div className="eb-connector-line"><div className="eb-connector-pulse"/></div>
                <div className="eb-connector-dot"/>
              </div>
              <div className="eb-bridge-node">
                <div className="eb-bridge-icon active">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
                </div>
                <span className="eb-bridge-label">Earthoria</span>
              </div>
              <div className="eb-bridge-connector">
                <div className="eb-connector-dot"/>
                <div className="eb-connector-line"><div className="eb-connector-pulse" style={{animationDelay:"0.6s"}}/></div>
                <div className="eb-connector-dot"/>
              </div>
              <div className="eb-bridge-node">
                <div className="eb-bridge-icon active">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
                </div>
                <span className="eb-bridge-label">AR · AI</span>
              </div>
            </div>

            {/* Cards */}
            <div className="eb-cards">
              {CARDS.map((card, i) => (
                <div key={i} className={`eb-card${cardsVisible ? " show" : ""}`} style={{"--bar-w": card.w}}>
                  <div className="eb-card-top">
                    <div className="eb-card-icon">{card.icon}</div>
                    <div className="eb-card-num">{card.n}</div>
                  </div>
                  <div className="eb-card-tag">{card.tag}</div>
                  <div className="eb-card-name">{card.name}</div>
                  <div className="eb-card-desc">{card.desc}</div>
                  <div className="eb-card-bar"><div className="eb-card-bar-fill"/></div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="eb-cta">
              <Link to="/technology" className="eb-btn-primary">
                Hướng Dẫn AR
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <button className="eb-btn-secondary">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Xem Demo 3D
              </button>
            </div>
          </div>

          <div className="eb-collapse-hint">Cuộn lên để thu gọn</div>
        </div>
      </div>
    </>
  );
}