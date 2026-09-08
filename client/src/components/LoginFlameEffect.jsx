import { useEffect, useRef } from "react";

export default function LoginFlameEffect({
  active,
  duration = 900,
  onComplete,
}) {
  const timeoutRef = useRef(null);

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
          {/* Turbulence làm nhiễu -> đẩy lệch pixel dọc viền -> tạo cảm giác lay động */}
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
              scale="34"
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="1.1" />
          </filter>

          <linearGradient id="flameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0af0ff" />
            <stop offset="35%" stopColor="#2b8cff" />
            <stop offset="65%" stopColor="#5b4bff" />
            <stop offset="100%" stopColor="#0af0ff" />
          </linearGradient>
        </defs>

        {/* Khung viền được turbulence bóp méo cạnh -> hiệu ứng lửa */}
        <rect
          className="flame-border-rect"
          x="14"
          y="14"
          width="calc(100% - 28px)"
          height="calc(100% - 28px)"
          rx="18"
          fill="none"
          stroke="url(#flameGradient)"
          strokeWidth="10"
          filter="url(#flameTurbulence)"
        />
      </svg>

      {/* Lớp glow mềm phía trong viền để ánh sáng lan vào màn hình */}
      <div className="flame-border-inner-glow" />
    </div>
  );
}