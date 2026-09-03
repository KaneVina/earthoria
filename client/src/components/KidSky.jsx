import { useEffect, useMemo, useState, useId } from "react";
import { Moon, Sunrise, Sunset, Star, Sparkles } from "lucide-react";

// Bầu trời sống động theo giờ thực (mặt trời/mặt trăng lên xuống, mây trôi,
// sao lấp lánh ban đêm...) — dùng chung cho mọi trang thuộc khu vực của bé
// (KidAccess, Vườn Tri Thức...) để cả app luôn có chung một "linh hồn".

const SUNRISE_HOUR = 6; // 06:00 — mặt trời mọc
const SUNSET_HOUR = 18; // 18:00 — mặt trời lặn
const NIGHT_SKY_STOPS = [
  "#050B1F",
  "#0B1B3A",
  "#16294F",
  "#20386A",
  "#2B4570",
  "#182647",
];
const DAY_SKY_STOPS = [
  "#063A57",
  "#1AAEE8",
  "#12A8E0",
  "#6FD3F2",
  "#EAF8FF",
  "#F5FBFF",
];

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(a, b, t) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function arcPosition(h, start, end) {
  let span = end - start;
  if (span <= 0) span += 24;
  let hh = h - start;
  if (hh < 0) hh += 24;
  const progress = clamp01(hh / span);
  const elevation = Math.sin(progress * Math.PI); // 0 chân trời → 1 đỉnh trời
  return {
    progress,
    elevation,
    x: 6 + progress * 88,
    y: 88 - elevation * 80,
  };
}

function computeSkyState(date) {
  const h = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  const dayness = Math.cos(((h - 12) / 12) * Math.PI);
  const dayT = clamp01((dayness + 0.15) / 0.3); // 0 = màu đêm, 1 = màu ngày
  const edge = clamp01(1 - Math.abs(dayness) * 2.2); // đỉnh đúng lúc rạng đông/hoàng hôn

  const stops = NIGHT_SKY_STOPS.map((c, i) =>
    mixHex(c, DAY_SKY_STOPS[i], dayT),
  );

  const sunVisible = h >= SUNRISE_HOUR && h <= SUNSET_HOUR;
  const sunArc = arcPosition(h, SUNRISE_HOUR, SUNSET_HOUR);
  const sunOpacity = sunVisible ? clamp01(sunArc.elevation * 4) : 0;

  const moonVisible = !sunVisible;
  const moonArc = arcPosition(h, SUNSET_HOUR, SUNRISE_HOUR + 24);
  const moonOpacity = moonVisible ? clamp01(moonArc.elevation * 4) : 0;

  const starOpacity = clamp01(1 - dayT * 1.35);

  let phase = "day";
  if (dayT <= 0.15) phase = "night";
  else if (dayT < 0.85) phase = h < 12 ? "dawn" : "dusk";

  return {
    phase,
    stops,
    starOpacity,
    warmOpacity: edge,
    warmX: sunVisible ? sunArc.x : moonArc.x,
    sun: { visible: sunVisible, opacity: sunOpacity, x: sunArc.x, y: sunArc.y },
    moon: {
      visible: moonVisible,
      opacity: moonOpacity,
      x: moonArc.x,
      y: moonArc.y,
    },
  };
}

export function useSkyState() {
  const [date, setDate] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  return useMemo(() => computeSkyState(date), [date]);
}

// Mặt trời "thật" hơn bản line-icon mặc định của lucide: có gradient vàng
// cam ở lõi, quầng sáng mềm lan toả, và các tia nắng thon nhỏ dần ra ngoài
// thay vì que thẳng đều — nhìn ấm và có chiều sâu hơn.
function RealisticSunIcon({ size = 18, className }) {
  const gid = useId();
  const coreId = `sun-core-${gid}`;
  const glowId = `sun-glow-${gid}`;
  const rays = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={coreId} cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="45%" stopColor="#ffd35c" />
          <stop offset="100%" stopColor="#ffa63d" />
        </radialGradient>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffcf5c" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffcf5c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill={`url(#${glowId})`} />
      {rays.map((deg) => (
        <path
          key={deg}
          d="M12 2.6 L13.1 5.9 L10.9 5.9 Z"
          fill="#ffb545"
          opacity="0.9"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
      <circle
        cx="12"
        cy="12"
        r="6.4"
        fill={`url(#${coreId})`}
        stroke="#ff9d2e"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function PhaseIcon({ phase, ...props }) {
  if (phase === "night") return <Moon {...props} />;
  if (phase === "dawn") return <Sunrise {...props} />;
  if (phase === "dusk") return <Sunset {...props} />;
  return <RealisticSunIcon {...props} />;
}

export function DynamicSky({ skyState, minimal = false }) {
  const { stops, sun, moon, starOpacity, warmOpacity, warmX, phase } = skyState;
  const skyStyle = {
    "--sky-s1": stops[0],
    "--sky-s2": stops[1],
    "--sky-s3": stops[2],
    "--sky-s4": stops[3],
    "--sky-s5": stops[4],
    "--sky-s6": stops[5],
    "--warm-opacity": warmOpacity,
    "--warm-x": `${warmX}%`,
  };

  return (
    <div
      className="kid-sky"
      aria-hidden="true"
      style={skyStyle}
      data-phase={phase}
    >
      <div className="kid-sky-wash" />
      <div className="kid-sky-warm" />

      {sun.opacity > 0.01 && (
        <span
          className="kid-sun"
          style={{ left: `${sun.x}%`, top: `${sun.y}%`, opacity: sun.opacity }}
        />
      )}

      {moon.opacity > 0.01 && (
        <span
          className="kid-moon"
          style={{
            left: `${moon.x}%`,
            top: `${moon.y}%`,
            opacity: moon.opacity,
          }}
        >
          <span className="kid-moon-crater c1" />
          <span className="kid-moon-crater c2" />
          <span className="kid-moon-crater c3" />
        </span>
      )}

      <span className="kid-cloud kid-cloud-1" />
      <span className="kid-cloud kid-cloud-2" />
      <span className="kid-cloud kid-cloud-3" />

      <div className="kid-stars-layer" style={{ opacity: starOpacity }}>
        <span className="kid-star kid-star-1" />
        <span className="kid-star kid-star-2" />
        <span className="kid-star kid-star-3" />
        <span className="kid-star kid-star-4" />
        <span className="kid-star kid-star-5" />
        <span className="kid-star kid-star-6" />
        <span className="kid-star kid-star-7" />
        <span className="kid-star kid-star-8" />
        {starOpacity > 0.45 && <span className="kid-shooting-star" />}
      </div>

      {!minimal && (
        <>
          <span className="kid-float-icon kid-float-icon-1">
            <Star size={18} fill="currentColor" />
          </span>
          <span className="kid-float-icon kid-float-icon-2">
            <Sparkles size={20} />
          </span>
        </>
      )}

      <div className="kid-sky-grain" />
    </div>
  );
}
