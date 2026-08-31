import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ScanLine,
  Sprout,
  Gamepad2,
  Users,
  Baby,
  QrCode,
  RotateCw,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import "../components/assets/css/ecosystem.css";

/* Root of the ecosystem tree */
const ROOT = {
  id: "earthoria",
  name: "Earthoria",
  tagline: "Hệ sinh thái giáo dục gốc",
  logo: "/logo/logo-mau/lg-m-chinh.png",
  desc: "Earthoria là hệ sinh thái giáo dục gốc, kết hợp sách giấy, trí tuệ nhân tạo và công nghệ thực tế tăng cường để mở ra một cách học hoàn toàn mới cho trẻ em Việt Nam.",
  to: "/home",
  cta: "Về trang chủ",
};

/* The six branches, sourced from the brand's own studio marks */
const BRANCHES = [
  {
    id: "family-studio",
    name: "Family Studio",
    tagline: "Nội dung & trải nghiệm gia đình",
    logo: "/logo/logo-mau/lg-m-family-studio.png",
    desc: "Gắn kết cha mẹ và con qua từng trang sách — theo dõi hành trình học tập, nhận quà tặng và cùng nhau tham gia các hoạt động chung của cả nhà.",
    to: "/family",
    cta: "Không gian gia đình",
  },
  {
    id: "kid-studio",
    name: "Kid Studio",
    tagline: "Không gian riêng dành cho bé",
    logo: "/logo/logo-mau/lg-m-kid-studio.png",
    desc: "Khu vực an toàn, có mã PIN bảo vệ, dành riêng cho trẻ — nơi bé tự do khám phá Vườn Tri Thức, trò chơi và những câu chuyện theo đúng tốc độ của mình.",
    to: "/family",
    cta: "Tạo không gian cho bé",
  },
  {
    id: "game-studio",
    name: "Game Studio",
    tagline: "Xưởng sản xuất trò chơi",
    logo: "/logo/logo-mau/lg-m-game-studio.png",
    desc: "Biến kiến thức trong từng trang sách thành các minigame tương tác, giúp trẻ vừa học vừa chơi ngay trên thiết bị quen thuộc của mình.",
    to: "/shop",
    cta: "Khám phá trò chơi",
  },
  {
    id: "knowledge-farm",
    name: "Knowledge Farm",
    tagline: "Nông trại tri thức",
    logo: "/logo/logo-mau/lg-kf-big.png",
    desc: "Nơi ươm mầm kiến thức mở rộng — bài viết, thư viện chủ đề và nội dung giáo dục đồng hành cùng mỗi cuốn sách Earthoria.",
    to: "/blog",
    cta: "Đọc tin tức & tri thức",
  },
  {
    id: "immersive-studio",
    name: "Immersive Studio",
    tagline: "Công nghệ trải nghiệm tương tác",
    logo: "/logo/logo-mau/lg-m-im.png",
    desc: "Đội ngũ đứng sau AI, mô hình 3D và thực tế tăng cường — biến trang sách tĩnh thành một thế giới sống động chỉ với một lần quét.",
    to: "/technology",
    cta: "Trải nghiệm công nghệ AR",
  },
  {
    id: "code-studio",
    name: "AR Code Studio",
    tagline: "Cầu nối sách giấy & thế giới số",
    logo: "/logo/logo-mau/lg-m-qr-studio.png",
    desc: "Thiết kế và vận hành hệ thống mã quét độc quyền trên từng trang sách, đảm bảo mỗi lần quét là một cánh cửa mở đúng nội dung số tương ứng.",
    to: "/technology",
    cta: "Tìm hiểu công nghệ quét mã",
  },
];

/* The content lifecycle loop shown beneath the tree */
const CYCLE = [
  { id: "book", label: "Sách giấy Earthoria", icon: BookOpen },
  { id: "scan", label: "Quét mã · AR Code Studio", icon: QrCode },
  { id: "immersive", label: "Sống động hoá · Immersive Studio", icon: ScanLine },
  { id: "knowledge", label: "Mở rộng tri thức · Knowledge Farm", icon: Sprout },
  { id: "game", label: "Học qua chơi · Game Studio", icon: Gamepad2 },
  { id: "kid", label: "Không gian của bé · Kid Studio", icon: Baby },
  { id: "family", label: "Gắn kết gia đình · Family Studio", icon: Users },
];

export default function Ecosystem() {
  const chartRef = useRef(null);
  const svgRef = useRef(null);
  const nodeEls = useRef({});
  const [expandedId, setExpandedId] = useState(null);
  const [revealed, setRevealed] = useState(() => new Set());

  const registerRef = useCallback((id, el) => {
    if (el) nodeEls.current[id] = el;
  }, []);

  const toggle = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  /* stagger scroll-reveal */
  useEffect(() => {
    const order = [ROOT.id, ...BRANCHES.map((b) => b.id)];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.dataset.emId;
          const delay = id === ROOT.id ? 0 : order.indexOf(id) * 90;
          setTimeout(() => {
            setRevealed((prev) => new Set(prev).add(id));
          }, delay);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -60px 0px" },
    );
    Object.entries(nodeEls.current).forEach(([id, el]) => {
      el.dataset.emId = id;
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  /* draw connectors from the root node down to every branch */
  const drawConnectors = useCallback(() => {
    const svg = svgRef.current;
    const chartEl = chartRef.current;
    if (!svg || !chartEl) return;

    const rootEl = nodeEls.current[ROOT.id];
    const branchEls = BRANCHES.map((b) => nodeEls.current[b.id]).filter(Boolean);
    if (!rootEl || !branchEls.length) return;

    svg.innerHTML = "";
    const svgNS = "http://www.w3.org/2000/svg";
    const chartRect = chartEl.getBoundingClientRect();

    const addLine = (x1, y1, x2, y2) => {
      const l = document.createElementNS(svgNS, "line");
      l.setAttribute("x1", x1);
      l.setAttribute("y1", y1);
      l.setAttribute("x2", x2);
      l.setAttribute("y2", y2);
      svg.appendChild(l);
    };
    const addDot = (x, y) => {
      const c = document.createElementNS(svgNS, "circle");
      c.setAttribute("cx", x);
      c.setAttribute("cy", y);
      c.setAttribute("r", "3");
      svg.appendChild(c);
    };

    const rootRect = rootEl.getBoundingClientRect();
    const rootBottom = {
      x: rootRect.left + rootRect.width / 2 - chartRect.left,
      y: rootRect.bottom - chartRect.top,
    };

    const branchTops = branchEls.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - chartRect.left,
        y: r.top - chartRect.top,
      };
    });

    const minY = Math.min(...branchTops.map((p) => p.y));
    const midY = rootBottom.y + (minY - rootBottom.y) * 0.5;

    addLine(rootBottom.x, rootBottom.y, rootBottom.x, midY);
    addDot(rootBottom.x, rootBottom.y);

    const minX = Math.min(...branchTops.map((p) => p.x));
    const maxX = Math.max(...branchTops.map((p) => p.x));
    addLine(minX, midY, maxX, midY);

    branchTops.forEach((p) => {
      addLine(p.x, midY, p.x, p.y);
      addDot(p.x, p.y);
    });

    requestAnimationFrame(() => {
      svg.querySelectorAll("line").forEach((l) => l.classList.add("em-drawn"));
      svg.querySelectorAll("circle").forEach((c) => c.classList.add("em-drawn"));
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(drawConnectors, 60);
    window.addEventListener("resize", drawConnectors);

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          drawConnectors();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll);

    const ivl = setInterval(drawConnectors, 400);
    const stopIvl = setTimeout(() => clearInterval(ivl), 4000);

    return () => {
      clearTimeout(t);
      clearInterval(ivl);
      clearTimeout(stopIvl);
      window.removeEventListener("resize", drawConnectors);
      window.removeEventListener("scroll", onScroll);
    };
  }, [drawConnectors, revealed]);

  return (
    <div className="em-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="em-header">
        <div className="em-eyebrow">
          <span className="em-eyebrow-line" />
          <span className="em-eyebrow-text">Earthoria · Hệ Sinh Thái</span>
          <span className="em-eyebrow-line" />
        </div>
        <h1 className="em-title">
          Sơ Đồ Hệ Sinh Thái <em>Earthoria</em>
        </h1>
        <p className="em-subtitle">
          Từ một trang sách giấy đến một thế giới học tập sống động — mỗi
          studio trong hệ sinh thái Earthoria đảm nhận một vai trò, cùng nhau
          tạo nên trải nghiệm giáo dục liền mạch cho trẻ em và gia đình Việt.
        </p>
        <div className="em-hint">Chạm vào từng nhánh để xem chi tiết</div>
      </header>

      {/* ── Tree diagram ───────────────────────────────────── */}
      <div className="em-chart" ref={chartRef}>
        <svg className="em-connector-svg" ref={svgRef}></svg>

        <div className="em-tier em-tier-root">
          <EcoNode
            data={ROOT}
            isRoot
            registerRef={registerRef}
            expanded={expandedId === ROOT.id}
            onToggle={toggle}
            revealed={revealed.has(ROOT.id)}
          />
        </div>

        <div className="em-tier em-tier-branches">
          {BRANCHES.map((b) => (
            <EcoNode
              key={b.id}
              data={b}
              registerRef={registerRef}
              expanded={expandedId === b.id}
              onToggle={toggle}
              revealed={revealed.has(b.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Lifecycle loop ─────────────────────────────────── */}
      <section className="em-cycle">
        <div className="em-cycle-inner">
          <div className="em-eyebrow">
            <span className="em-eyebrow-line" />
            <span className="em-eyebrow-text">Vòng Tuần Hoàn Trải Nghiệm</span>
            <span className="em-eyebrow-line" />
          </div>
          <h2 className="em-cycle-title">
            Một cuốn sách, <em>bảy hành trình</em>
          </h2>
          <p className="em-cycle-subtitle">
            Nội dung không dừng lại ở trang giấy — nó luân chuyển qua cả sáu
            studio rồi quay về, khép thành một vòng lặp học tập không ngừng.
          </p>

          <div className="em-cycle-row">
            {CYCLE.map((step, i) => {
              const Icon = step.icon;
              return (
                <div className="em-cycle-step-wrap" key={step.id}>
                  <div className="em-cycle-step">
                    <div className="em-cycle-icon">
                      <Icon size={20} strokeWidth={1.6} />
                    </div>
                    <span className="em-cycle-label">{step.label}</span>
                  </div>
                  {i < CYCLE.length - 1 ? (
                    <ArrowRight className="em-cycle-arrow" size={16} strokeWidth={1.5} />
                  ) : (
                    <RotateCw className="em-cycle-arrow em-cycle-loop" size={16} strokeWidth={1.5} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────── */}
      <section className="em-cta">
        <Sparkles className="em-cta-icon" size={26} strokeWidth={1.4} />
        <h3 className="em-cta-title">Sẵn sàng bước vào hệ sinh thái Earthoria?</h3>
        <p className="em-cta-text">
          Bắt đầu từ một cuốn sách, khám phá cả một thế giới học tập đang chờ
          gia đình bạn.
        </p>
        <div className="em-cta-actions">
          <Link to="/shop" className="em-cta-btn em-cta-btn-primary">
            Khám phá cửa hàng
          </Link>
          <Link to="/technology" className="em-cta-btn em-cta-btn-ghost">
            Tìm hiểu công nghệ AR
          </Link>
        </div>
      </section>
    </div>
  );
}

function EcoNode({ data, isRoot, registerRef, expanded, onToggle, revealed }) {
  const handleMouseMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--tilt-y", `${(px - 0.5) * 14}deg`);
    el.style.setProperty("--tilt-x-mouse", `${(0.5 - py) * 10}deg`);
    el.style.setProperty("--glare-x", `${px * 100}%`);
    el.style.setProperty("--glare-y", `${py * 100}%`);
  };
  const handleMouseLeave = (e) => {
    const el = e.currentTarget;
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--tilt-x-mouse", "0deg");
  };

  return (
    <div
      ref={(el) => registerRef(data.id, el)}
      className={`em-node${isRoot ? " root" : ""}${expanded ? " expanded" : ""}${revealed ? " in" : ""}`}
      onClick={() => onToggle(data.id)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="em-node-logo-wrap">
        <img src={data.logo} alt={data.name} draggable="false" />
      </div>
      <div className="em-node-tagline">{data.tagline}</div>
      <div className="em-node-name">{data.name}</div>
      <div className="em-node-divider" />
      <div className="em-node-desc">{data.desc}</div>
      <Link
        to={data.to}
        className="em-node-link"
        onClick={(e) => e.stopPropagation()}
      >
        {data.cta} <ArrowRight size={12} strokeWidth={1.8} />
      </Link>
      <div className="em-node-expand-hint">Nhấn để xem chi tiết</div>
    </div>
  );
}