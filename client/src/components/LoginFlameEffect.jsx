import { useEffect, useMemo, useRef } from "react";

// Sinh ngẫu nhiên các "đốm lửa" bay dọc theo 4 cạnh màn hình, tạt vào
// trong rồi tắt dần - tạo cảm giác lửa đang liếm vào màn hình thay vì
// một đường viền tĩnh, đều tăm tắp như khung ảnh.
function makeEmbers(count = 22) {
  const edges = ["top", "bottom", "left", "right"];
  const embers = [];
  for (let i = 0; i < count; i++) {
    const edge = edges[i % edges.length];
    const along = 4 + Math.random() * 92;
    const size = 3 + Math.random() * 6;
    const delay = Math.random() * 1.6;
    const dur = 1 + Math.random() * 1.1;
    const drift = 26 + Math.random() * 60;
    const jitter = (Math.random() - 0.5) * 50;

    const style = {
      "--size": `${size}px`,
      "--delay": `${delay}s`,
      "--dur": `${dur}s`,
    };

    if (edge === "top") {
      style.top = "0%";
      style.left = `${along}%`;
      style["--tx"] = `${jitter}px`;
      style["--ty"] = `${drift}px`;
    } else if (edge === "bottom") {
      style.top = "100%";
      style.left = `${along}%`;
      style["--tx"] = `${jitter}px`;
      style["--ty"] = `${-drift}px`;
    } else if (edge === "left") {
      style.top = `${along}%`;
      style.left = "0%";
      style["--tx"] = `${drift}px`;
      style["--ty"] = `${jitter}px`;
    } else {
      style.top = `${along}%`;
      style.left = "100%";
      style["--tx"] = `${-drift}px`;
      style["--ty"] = `${jitter}px`;
    }

    embers.push({ id: i, style });
  }
  return embers;
}

export default function LoginFlameEffect({
  active,
  duration = 2500,
  onComplete,
}) {
  const timeoutRef = useRef(null);
  const embers = useMemo(() => (active ? makeEmbers(22) : []), [active]);

  useEffect(() => {
    if (!active) return;
    timeoutRef.current = setTimeout(() => {
      onComplete?.();
    }, duration);
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  return (
    <div className="flame-border-overlay" aria-hidden="true">
      <svg
        className="flame-border-svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <filter
            id="flameTurbulence"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.09"
              numOctaves="3"
              seed="7"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="1.6s"
                keyTimes="0;0.5;1"
                values="0.012 0.09;0.02 0.14;0.012 0.09"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="26"
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="1.1" />
          </filter>

          {/* Gradient nhiều tông hơn: tâm nóng vàng-chanh -> xanh chuối -> xanh rêu đậm */}
          <linearGradient
            id="flameGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#eaffc2" />
            <stop offset="20%" stopColor="#baff5c" />
            <stop offset="45%" stopColor="#4a9e3f" />
            <stop offset="70%" stopColor="#1a5c52" />
            <stop offset="100%" stopColor="#baff5c" />
          </linearGradient>
        </defs>

        {/* Bo góc nhẹ để bớt cảm giác "khung ảnh" cứng nhắc. strokeWidth
            đặt sẵn = giá trị hiển thị đầy đủ ngay từ frame đầu tiên (CSS
            animation chỉ tinh chỉnh thêm), tránh phụ thuộc hoàn toàn vào
            animation để có thứ hiển thị. */}
        <rect
          className="flame-border-rect"
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="18"
          fill="none"
          stroke="url(#flameGradient)"
          strokeWidth="14"
          filter="url(#flameTurbulence)"
        />
      </svg>

      <div className="flame-border-inner-glow" />

      {embers.map((e) => (
        <span key={e.id} className="flame-ember" style={e.style} />
      ))}
    </div>
  );
}
