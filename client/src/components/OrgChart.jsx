import { useEffect, useRef, useState, useCallback } from "react";

const MEMBERS = [
  {
    id: "ceo",
    isCeo: true,
    role: "CEO — Chief Executive Officer",
    name: "Nguyễn Đoàn Quốc Thái",
    code: "CS191282",
    letter: "T",
    img: "members/quoc-thai",
    cutout: "members/quoc-thai-rb",
    desc: "Người đề xuất ý tưởng, định hướng chiến lược và là linh hồn của Earthoria. Phụ trách toàn bộ quản lý dự án, phân công nhiệm vụ, giám sát tiến độ.",
  },
  {
    id: "coo",
    role: "COO — Operations",
    name: "Nguyễn Việt Mỹ Hương",
    code: "CS191212",
    letter: "H",
    img: "members/my-huong",
    cutout: "members/my-huong-rb",
    desc: "Lập kế hoạch dự án, điều phối hoạt động giữa các bộ phận và đảm bảo tiến độ thực thi hiệu quả.",
  },
  {
    id: "cpo",
    role: "CPO — Product",
    name: "Lê Tuấn",
    code: "CE180824",
    letter: "T",
    img: "members/le-tuan",
    cutout: "members/le-tuan-rb",
    desc: "Phát triển concept và chiến lược nội dung sách. Thiết kế hệ thống câu đố, hoạt động tương tác.",
  },
  {
    id: "cmo",
    role: "CMO — Marketing",
    name: "Lữ Quốc Tài",
    code: "CS191616",
    letter: "T",
    img: "members/quoc-tai",
    cutout: "members/quoc-tai-rb",
    desc: "Nghiên cứu thị trường, phân tích khách hàng mục tiêu và xây dựng chiến lược marketing.",
  },
  {
    id: "cdo",
    role: "CDO — Design",
    name: "Lê Anh Song Đường",
    code: "CE190621",
    letter: "D",
    img: "members/song-duong",
    cutout: "members/song-duong-rb",
    desc: "Định hướng visual toàn bộ dự án: thiết kế logo, layout sách, minh họa và slide thuyết trình.",
  },
  {
    id: "cto",
    role: "CTO — Technology",
    name: "Nguyễn Phúc Khang",
    code: "CE181578",
    letter: "K",
    img: "members/phuc-khangv2",
    cutout: "members/phuc-khang-rb",
    desc: "Phát triển và quản lý công nghệ AI, AR tích hợp vào sách. Xây dựng mô hình 3D, hệ thống AI tương tác.",
  },
];

export default function OrgChart() {
  const chartRef = useRef(null);
  const svgRef = useRef(null);
  const cardEls = useRef({});
  const [expandedId, setExpandedId] = useState(null);
  const [revealed, setRevealed] = useState(() => new Set());

  const registerRef = useCallback((id, el) => {
    if (el) cardEls.current[id] = el;
  }, []);

  const toggle = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Scroll-reveal (stagger) via IntersectionObserver
  useEffect(() => {
    const els = Object.entries(cardEls.current);
    const childOrder = MEMBERS.filter((m) => !m.isCeo).map((m) => m.id);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.dataset.ocId;
          const isCeo = MEMBERS.find((m) => m.id === id)?.isCeo;
          const delay = isCeo ? 0 : childOrder.indexOf(id) * 110;
          setTimeout(() => {
            setRevealed((prev) => new Set(prev).add(id));
          }, delay);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -60px 0px" },
    );

    els.forEach(([id, el]) => {
      el.dataset.ocId = id;
      io.observe(el);
    });

    return () => io.disconnect();
  }, []);

  // Connector lines — computed from real DOM positions
  const drawConnectors = useCallback(() => {
    const svg = svgRef.current;
    const chartEl = chartRef.current;
    if (!svg || !chartEl) return;

    const ceoEl = cardEls.current["ceo"];
    const childIds = MEMBERS.filter((m) => !m.isCeo).map((m) => m.id);
    const childEls = childIds.map((id) => cardEls.current[id]).filter(Boolean);
    if (!ceoEl || !childEls.length) return;

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
      return l;
    };
    const addDot = (x, y) => {
      const c = document.createElementNS(svgNS, "circle");
      c.setAttribute("cx", x);
      c.setAttribute("cy", y);
      c.setAttribute("r", "3");
      svg.appendChild(c);
      return c;
    };

    const ceoRect = ceoEl.getBoundingClientRect();
    const ceoBottom = {
      x: ceoRect.left + ceoRect.width / 2 - chartRect.left,
      y: ceoRect.bottom - chartRect.top,
    };

    const childTops = childEls.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - chartRect.left,
        y: r.top - chartRect.top,
      };
    });

    const minChildY = Math.min(...childTops.map((p) => p.y));
    const midY = ceoBottom.y + (minChildY - ceoBottom.y) * 0.5;

    addLine(ceoBottom.x, ceoBottom.y, ceoBottom.x, midY);
    addDot(ceoBottom.x, ceoBottom.y);

    const minX = Math.min(...childTops.map((p) => p.x));
    const maxX = Math.max(...childTops.map((p) => p.x));
    addLine(minX, midY, maxX, midY);

    childTops.forEach((p) => {
      addLine(p.x, midY, p.x, p.y);
      addDot(p.x, p.y);
    });

    requestAnimationFrame(() => {
      svg.querySelectorAll("line").forEach((l) => l.classList.add("oc-drawn"));
      svg
        .querySelectorAll("circle")
        .forEach((c) => c.classList.add("oc-drawn"));
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

    // Safety net while reveal transitions animate card positions
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

  const ceo = MEMBERS.find((m) => m.isCeo);
  const children = MEMBERS.filter((m) => !m.isCeo);

  return (
    <div className="oc-page">
      <header className="oc-header">
        <div className="oc-eyebrow">
          <div className="oc-eyebrow-line"></div>
          <span className="oc-eyebrow-text">Earthoria · Đội Ngũ</span>
          <div className="oc-eyebrow-line"></div>
        </div>
        <h1 className="oc-title">
          Sơ Đồ Tổ Chức <em>Dự Án</em>
        </h1>
        <div className="oc-hint">Cuộn xuống để khám phá từng thành viên</div>
      </header>

      <div className="oc-chart" ref={chartRef}>
        <svg className="oc-connector-svg" ref={svgRef}></svg>

        <div className="oc-tier oc-tier-ceo">
          <CardWithReveal
            member={ceo}
            registerRef={registerRef}
            expanded={expandedId === ceo.id}
            onToggle={toggle}
            revealed={revealed.has(ceo.id)}
          />
        </div>

        <div className="oc-tier oc-tier-children">
          {children.map((m) => (
            <CardWithReveal
              key={m.id}
              member={m}
              registerRef={registerRef}
              expanded={expandedId === m.id}
              onToggle={toggle}
              revealed={revealed.has(m.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CardWithReveal({ member, registerRef, expanded, onToggle, revealed }) {
  const avatarStyle = member.img
    ? { backgroundImage: `url('/${member.img}.png')` }
    : undefined;

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
      ref={(el) => registerRef(member.id, el)}
      className={`oc-card${member.isCeo ? " ceo" : ""}${expanded ? " expanded" : ""}${revealed ? " in" : ""}${member.cutout ? " has-cutout" : ""}`}
      onClick={() => onToggle(member.id)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {member.cutout && (
        <img
          className="oc-cutout"
          src={`/${member.cutout}.png`}
          alt={member.name}
        />
      )}
      <div className="oc-avatar-wrap">
        <div className="oc-avatar" style={avatarStyle}>
          {!member.img && member.letter}
        </div>
      </div>
      <div className="oc-role">{member.role}</div>
      <div className="oc-name">{member.name}</div>
      <div className="oc-code">{member.code} · FPT University</div>
      <div className="oc-divider" />
      <div className="oc-desc">{member.desc}</div>
      <div className="oc-expand-icon">Nhấn để xem mô tả</div>
    </div>
  );
}
