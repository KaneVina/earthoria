import { useCallback, useEffect, useRef, useState } from "react";

const CONFETTI_COLORS = [
  "var(--gp-leaf)",
  "var(--gp-sun)",
  "var(--gp-peach)",
  "var(--gp-berry)",
  "var(--gp-sky)",
  "var(--gp-plum)",
];

const BURST_LIFETIME_MS = 4600;

export function useConfettiBurst({ count = 46 } = {}) {
  const [pieces, setPieces] = useState([]);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const trigger = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (count <= 0) {
      setPieces([]);
      return;
    }

    // Mỗi mảnh có vị trí/độ trễ/kích thước/màu ngẫu nhiên để trông tự nhiên
    // thay vì lặp lại đều tăm tắp.
    const next = Array.from({ length: count }, (_, i) => {
      const isRound = i % 2 === 0;
      return {
        key: `${Date.now()}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2.4 + Math.random() * 1.5,
        size: 6 + Math.random() * 6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.round(Math.random() * 360),
        drift: Math.round((Math.random() - 0.5) * 160),
        shape: isRound ? "gp-confetti--round" : "gp-confetti--square",
      };
    });
    setPieces(next);
    timeoutRef.current = setTimeout(() => setPieces([]), BURST_LIFETIME_MS);
  }, [count]);

  return { pieces, trigger };
}

export function GpConfetti({ pieces }) {
  if (!pieces.length) return null;
  return (
    <div className="gp-confetti-field" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.key}
          className={`gp-confetti-piece ${p.shape}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.3,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--gp-confetti-rot": `${p.rotate}deg`,
            "--gp-confetti-drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
