import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ScanLine,
  Sprout,
  Gamepad2,
  Users,
  Sparkles,
  Tablet,
  RotateCw,
  ArrowRight,
  Leaf,
} from "lucide-react";
import "../components/assets/css/ecosystem.css";

/* Root of the ecosystem tree */
const ROOT = {
  id: "earthoria",
  name: "Earthoria",
  tagline: "Hệ sinh thái giáo dục gốc",
  logo: "/logo/logo-mau/logo-chinh.png",
  desc: "Earthoria là hệ sinh thái giáo dục gốc, kết hợp sách giấy, trí tuệ nhân tạo và công nghệ thực tế tăng cường để mở ra một cách học hoàn toàn mới cho trẻ em Việt Nam.",
  to: "/home",
  cta: "Về trang chủ",
};

/* Level 1 — the three studios reporting directly to Earthoria.
   Family Studio manages Knowledge Farm; Immersive Studio manages
   AR / AI / E-book, which have no dedicated logo of their own. */
const LEVEL1 = [
  {
    id: "family-studio",
    name: "Family Studio",
    tagline: "Nội dung & trải nghiệm gia đình",
    logo: "/logo/logo-mau/lg-m-family-studio.png",
    desc: "Gắn kết cha mẹ và con qua từng trang sách — theo dõi hành trình học tập, nhận quà tặng và cùng nhau tham gia các hoạt động chung của cả nhà.",
    to: "/family",
    cta: "Không gian gia đình",
    children: [
      {
        id: "knowledge-farm",
        name: "Knowledge Farm",
        tagline: "Nông trại tri thức",
        logo: "/logo/logo-mau/lg-kf-big.png",
        desc: "Trực thuộc Family Studio — nơi ươm mầm kiến thức mở rộng với bài viết, thư viện chủ đề và nội dung giáo dục đồng hành cùng mỗi cuốn sách.",
        to: "/blog",
        cta: "Đọc tin tức & tri thức",
      },
    ],
  },
  {
    id: "cce-studio",
    name: "Commerce & Customer Experience",
    tagline: "Thương mại & trải nghiệm khách hàng",
    logo: "/logo/logo-mau/lg-m-cce.png",
    desc: "Vận hành toàn bộ hành trình mua sắm — từ đặt sách, thanh toán đến hậu mãi — đảm bảo mỗi gia đình đều nhận được trải nghiệm mượt mà và tận tâm nhất.",
    to: "/shop",
    cta: "Trải nghiệm mua sắm",
    children: [],
  },
  {
    id: "game-studio",
    name: "Game Studio",
    tagline: "Xưởng sản xuất trò chơi",
    logo: "/logo/logo-mau/lg-m-game-studio.png",
    desc: "Biến kiến thức trong từng trang sách thành các minigame tương tác, giúp trẻ vừa học vừa chơi ngay trên thiết bị quen thuộc của mình.",
    to: "/shop",
    cta: "Khám phá trò chơi",
    children: [],
  },
  {
    id: "immersive-studio",
    name: "Immersive Studio",
    tagline: "Công nghệ trải nghiệm tương tác",
    logo: "/logo/logo-mau/lg-m-im.png",
    desc: "Đội ngũ đứng sau ba trụ cột công nghệ biến trang sách tĩnh thành thế giới sống động: thực tế tăng cường, trí tuệ nhân tạo và sách điện tử.",
    to: "/technology",
    cta: "Trải nghiệm công nghệ AR",
    children: [
      {
        id: "ar",
        name: "Thực Tế Tăng Cường",
        tagline: "AR",
        icon: ScanLine,
        desc: "Quét trang sách bằng camera để nhân vật và mô hình 3D bước ra khỏi trang giấy, chuyển động sống động ngay trước mắt trẻ.",
        to: "/technology",
        cta: "Xem công nghệ AR",
      },
      {
        id: "ai",
        name: "Trợ Lý AI · Eira",
        tagline: "AI",
        icon: Sparkles,
        desc: "Eira — trợ lý AI đồng hành cùng bé, trả lời câu hỏi, gợi ý nội dung và cá nhân hoá hành trình học tập theo từng trẻ.",
        to: "/technology",
        cta: "Tìm hiểu về Eira",
      },
      {
        id: "ebook",
        name: "Sách Điện Tử",
        tagline: "E-BOOK",
        icon: Tablet,
        desc: "Phiên bản số hoá của sách giấy với minh hoạ động và tương tác, đọc được mọi lúc trên mọi thiết bị của gia đình.",
        to: "/shop",
        cta: "Khám phá sách điện tử",
      },
    ],
  },
];

/* The content lifecycle loop shown beneath the tree */
const CYCLE = [
  { id: "book", label: "Sách giấy Earthoria", icon: BookOpen },
  { id: "ar", label: "Quét AR · Immersive Studio", icon: ScanLine },
  { id: "ai", label: "Trợ lý Eira gợi ý · Immersive Studio", icon: Sparkles },
  { id: "ebook", label: "Đọc mọi lúc · E-book", icon: Tablet },
  { id: "knowledge", label: "Mở rộng tri thức · Knowledge Farm", icon: Sprout },
  { id: "game", label: "Học qua chơi · Game Studio", icon: Gamepad2 },
  { id: "family", label: "Gắn kết gia đình · Family Studio", icon: Users },
];

/* flat traversal order used for the scroll-reveal stagger */
const REVEAL_ORDER = [
  ROOT.id,
  ...LEVEL1.flatMap((b) => [b.id, ...b.children.map((c) => c.id)]),
];

/* circular layout for the lifecycle wheel — positions in percent of a
   square container, plus tangential arrow rotation for a clockwise
   "flow" reading around the ring */
const CYCLE_RADIUS = 40;
const CYCLE_STEP_DEG = 360 / CYCLE.length;

const CYCLE_POSITIONS = CYCLE.map((_, i) => {
  const angle = -90 + i * CYCLE_STEP_DEG;
  const rad = (angle * Math.PI) / 180;
  return {
    x: 50 + CYCLE_RADIUS * Math.cos(rad),
    y: 50 + CYCLE_RADIUS * Math.sin(rad),
  };
});

const CYCLE_ARROWS = CYCLE.map((_, i) => {
  const angleMid = -90 + i * CYCLE_STEP_DEG + CYCLE_STEP_DEG / 2;
  const rad = (angleMid * Math.PI) / 180;
  const rotate = (Math.atan2(Math.cos(rad), -Math.sin(rad)) * 180) / Math.PI;
  return {
    x: 50 + CYCLE_RADIUS * Math.cos(rad),
    y: 50 + CYCLE_RADIUS * Math.sin(rad),
    rotate,
  };
});

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
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.dataset.emId;
          const delay = id === ROOT.id ? 0 : REVEAL_ORDER.indexOf(id) * 80;
          setTimeout(() => {
            setRevealed((prev) => new Set(prev).add(id));
          }, delay);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -60px 0px" },
    );
    Object.entries(nodeEls.current).forEach(([id, el]) => {
      el.dataset.emId = id;
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  /* draw connectors: root → level1, and level1 → its own children (if any) */
  const drawConnectors = useCallback(() => {
    const svg = svgRef.current;
    const chartEl = chartRef.current;
    if (!svg || !chartEl) return;

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
    const addFlowDot = (pathD, delay) => {
      const dot = document.createElementNS(svgNS, "circle");
      dot.setAttribute("r", "3.2");
      dot.setAttribute("class", "em-flow-dot");
      const anim = document.createElementNS(svgNS, "animateMotion");
      anim.setAttribute("dur", "3.6s");
      anim.setAttribute("repeatCount", "indefinite");
      anim.setAttribute("begin", `${delay}s`);
      anim.setAttribute("path", pathD);
      dot.appendChild(anim);
      svg.appendChild(dot);
    };
    const center = (r) => ({
      x: r.left + r.width / 2 - chartRect.left,
      y: r.top - chartRect.top,
    });

    let flowIndex = 0;
    const connectGroup = (parentEl, childEls) => {
      if (!parentEl || !childEls.length) return;
      const parentRect = parentEl.getBoundingClientRect();
      const parentBottom = {
        x: parentRect.left + parentRect.width / 2 - chartRect.left,
        y: parentRect.bottom - chartRect.top,
      };
      const childTops = childEls.map((el) =>
        center(el.getBoundingClientRect()),
      );
      const minY = Math.min(...childTops.map((p) => p.y));
      const midY = parentBottom.y + (minY - parentBottom.y) * 0.5;

      addLine(parentBottom.x, parentBottom.y, parentBottom.x, midY);
      addDot(parentBottom.x, parentBottom.y);

      if (childTops.length > 1) {
        const minX = Math.min(...childTops.map((p) => p.x));
        const maxX = Math.max(...childTops.map((p) => p.x));
        addLine(minX, midY, maxX, midY);
      }

      childTops.forEach((p) => {
        addLine(p.x, midY, p.x, p.y);
        addDot(p.x, p.y);
        /* a soft pulse of light travels root → node, a small creative
           touch that reads as data / life flowing through the ecosystem */
        const pathD = `M ${parentBottom.x} ${parentBottom.y} L ${parentBottom.x} ${midY} L ${p.x} ${midY} L ${p.x} ${p.y}`;
        addFlowDot(pathD, (flowIndex % 5) * 0.5);
        flowIndex += 1;
      });
    };

    const rootEl = nodeEls.current[ROOT.id];
    const level1Els = LEVEL1.map((b) => nodeEls.current[b.id]).filter(Boolean);
    connectGroup(rootEl, level1Els);

    LEVEL1.forEach((branch) => {
      if (!branch.children.length) return;
      const parentEl = nodeEls.current[branch.id];
      const childEls = branch.children
        .map((c) => nodeEls.current[c.id])
        .filter(Boolean);
      connectGroup(parentEl, childEls);
    });

    requestAnimationFrame(() => {
      svg.querySelectorAll("line").forEach((l) => l.classList.add("em-drawn"));
      svg
        .querySelectorAll("circle:not(.em-flow-dot)")
        .forEach((c) => c.classList.add("em-drawn"));
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
      <div className="em-aurora" aria-hidden="true">
        <span className="em-aurora-blob b1" />
        <span className="em-aurora-blob b2" />
        <span className="em-aurora-blob b3" />
        <span className="em-aurora-blob b4" />
      </div>
      <div className="em-blueprint" aria-hidden="true" />
      <div className="em-vignette" aria-hidden="true" />
      <div className="em-grain" aria-hidden="true" />

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="em-header">
        <div className="em-eyebrow">
          <span className="em-eyebrow-line" />
          <Leaf size={11} strokeWidth={1.6} className="em-eyebrow-mark" />
          <span className="em-eyebrow-text">Earthoria · Hệ Sinh Thái</span>
          <span className="em-eyebrow-line" />
        </div>
        <h1 className="em-title">
          Sơ Đồ Hệ Sinh Thái <em>Earthoria</em>
        </h1>
        <p className="em-subtitle">
          Từ một trang sách giấy đến một thế giới học tập sống động — mỗi studio
          trong hệ sinh thái Earthoria đảm nhận một vai trò, cùng nhau tạo nên
          trải nghiệm giáo dục liền mạch cho trẻ em và gia đình Việt.
        </p>
        <div className="em-hint">Chạm vào từng ô để xem chi tiết</div>
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
          {LEVEL1.map((branch, i) => (
            <div className="em-branch-col" key={branch.id}>
              <EcoNode
                data={branch}
                index={i + 1}
                registerRef={registerRef}
                expanded={expandedId === branch.id}
                onToggle={toggle}
                revealed={revealed.has(branch.id)}
              />
              {branch.children.length > 0 && (
                <div className="em-sub-branch">
                  {branch.children.map((child) => (
                    <EcoNode
                      key={child.id}
                      data={child}
                      leaf
                      registerRef={registerRef}
                      expanded={expandedId === child.id}
                      onToggle={toggle}
                      revealed={revealed.has(child.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Brand divider — plain dark backdrop + wordmark, pinned
           in place as the bottom-most layer while sections scroll
           over it. No photo — CSS gradient + text only. ─────── */}
      <div className="em-divider" aria-hidden="true">
        <span className="em-divider-word">Earthoria</span>
      </div>

      {/* ── Lifecycle loop ─────────────────────────────────── */}
      <section className="em-cycle">
        <div className="em-cycle-inner">
          <div className="em-eyebrow">
            <span className="em-eyebrow-line" />
            <Leaf size={11} strokeWidth={1.6} className="em-eyebrow-mark" />
            <span className="em-eyebrow-text">Vòng Tuần Hoàn Trải Nghiệm</span>
            <span className="em-eyebrow-line" />
          </div>
          <h2 className="em-cycle-title">
            Một cuốn sách, <em>bảy hành trình</em>
          </h2>
          <p className="em-cycle-subtitle">
            Nội dung không dừng lại ở trang giấy — nó luân chuyển qua từng
            studio rồi quay về, khép thành một vòng lặp học tập không ngừng.
          </p>

          <div className="em-cycle-wheel">
            <svg
              className="em-wheel-ring"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <circle cx="50" cy="50" r={CYCLE_RADIUS} />
            </svg>

            <div className="em-wheel-center">
              <RotateCw size={24} strokeWidth={1.3} />
              <span>Học tập</span>
              <span>không ngừng</span>
            </div>

            {CYCLE_ARROWS.map((a, i) => (
              <span
                key={`arrow-${i}`}
                className="em-wheel-arrow"
                style={{
                  left: `${a.x}%`,
                  top: `${a.y}%`,
                  transform: `translate(-50%, -50%) rotate(${a.rotate}deg)`,
                }}
              >
                <ArrowRight size={13} strokeWidth={2} />
              </span>
            ))}

            {CYCLE.map((step, i) => {
              const Icon = step.icon;
              const pos = CYCLE_POSITIONS[i];
              return (
                <div
                  key={step.id}
                  className="em-wheel-node"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className="em-cycle-icon">
                    <Icon size={18} strokeWidth={1.6} />
                  </div>
                  <span className="em-cycle-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────── */}
      <section className="em-cta">
        <svg
          className="em-cta-circuit"
          viewBox="0 0 600 400"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <path d="M 0,70 L 66,70 L 66,26 L 122,26" />
          <path d="M 600,70 L 534,70 L 534,26 L 478,26" />
          <path d="M 0,330 L 74,330 L 74,374 L 136,374" />
          <path d="M 600,330 L 526,330 L 526,374 L 464,374" />
          <path d="M 0,200 L 40,200" />
          <path d="M 600,200 L 560,200" />

          <circle className="em-circuit-pad" cx="66" cy="70" r="3" />
          <circle className="em-circuit-pad" cx="66" cy="26" r="3" />
          <circle className="em-circuit-pad" cx="122" cy="26" r="4" />
          <circle className="em-circuit-pad" cx="534" cy="70" r="3" />
          <circle className="em-circuit-pad" cx="534" cy="26" r="3" />
          <circle className="em-circuit-pad" cx="478" cy="26" r="4" />
          <circle className="em-circuit-pad" cx="74" cy="330" r="3" />
          <circle className="em-circuit-pad" cx="74" cy="374" r="3" />
          <circle className="em-circuit-pad" cx="136" cy="374" r="4" />
          <circle className="em-circuit-pad" cx="526" cy="330" r="3" />
          <circle className="em-circuit-pad" cx="526" cy="374" r="3" />
          <circle className="em-circuit-pad" cx="464" cy="374" r="4" />
          <circle className="em-circuit-pad" cx="40" cy="200" r="3" />
          <circle className="em-circuit-pad" cx="560" cy="200" r="3" />

          <circle r="3" className="em-flow-dot">
            <animateMotion
              dur="3.4s"
              repeatCount="indefinite"
              path="M 0,70 L 66,70 L 66,26 L 122,26"
            />
          </circle>
          <circle r="3" className="em-flow-dot">
            <animateMotion
              dur="3.8s"
              repeatCount="indefinite"
              begin="1.2s"
              path="M 600,330 L 526,330 L 526,374 L 464,374"
            />
          </circle>
        </svg>

        <div className="em-cta-content">
          <Sparkles className="em-cta-icon" size={26} strokeWidth={1.4} />
          <h3 className="em-cta-title">
            Sẵn sàng bước vào hệ sinh thái Earthoria?
          </h3>
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
        </div>
      </section>
    </div>
  );
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

function EcoNode({
  data,
  isRoot,
  leaf,
  index,
  registerRef,
  expanded,
  onToggle,
  revealed,
}) {
  const Icon = data.icon;

  return (
    <div
      ref={(el) => registerRef(data.id, el)}
      className={`em-node${isRoot ? " root" : ""}${leaf ? " leaf" : ""}${expanded ? " expanded" : ""}${revealed ? " in" : ""}`}
      onClick={() => onToggle(data.id)}
    >
      <span className="em-node-status" aria-hidden="true" />
      {index && <span className="em-node-index">{ROMAN[index - 1]}</span>}
      {data.logo ? (
        <div className="em-node-logo-wrap">
          <img src={data.logo} alt={data.name} draggable="false" />
        </div>
      ) : (
        <div className="em-node-icon-wrap">
          <Icon size={22} strokeWidth={1.5} />
        </div>
      )}
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
