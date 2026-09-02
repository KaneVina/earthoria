import { useCallback, useEffect, useRef, useState } from "react";
const PARTICLE_COUNT = 8; // số hạt khi THÊM vào yêu thích
const UNLIKE_PARTICLE_COUNT = 5; // số hạt khi BỎ yêu thích
const BURST_DURATION = 620; // ms — khớp với animation CSS wl-particle-fly / wl-particle-poof / wl-pop bên dưới

// Nhiều màu cho hiệu ứng "thêm" — cảm giác confetti thay vì 1 màu vàng đơn điệu
const LIKE_COLORS = ["var(--gold)", "#f2a65a", "#e8734a", "#ff6b9d", "#c9184a"];
const UNLIKE_COLOR = "#9ba39a"; // màu xám nhạt cho hiệu ứng "bỏ thích"

export function useHeartBurst() {
  const [bursting, setBursting] = useState(false);
  const [particles, setParticles] = useState([]);
  const timeoutRef = useRef(null);
  const burstIdRef = useRef(0);

  // Dọn timeout khi component unmount để tránh setState trên component đã unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const trigger = useCallback((willBeLiked) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setBursting(true);
    const id = ++burstIdRef.current;

    if (willBeLiked) {
      // Thêm vào yêu thích: hạt confetti nhiều màu bắn toả tròn
      const next = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        key: `${id}-${i}`,
        mode: "like",
        angle: (360 / PARTICLE_COUNT) * i + (Math.random() * 24 - 12),
        distance: 16 + Math.random() * 14,
        delay: Math.random() * 40,
        size: 4 + Math.random() * 3,
        color: LIKE_COLORS[i % LIKE_COLORS.length],
      }));
      setParticles(next);
    } else {
      // Bỏ yêu thích: hạt xám nhỏ rơi xuống rồi tan biến, khác hẳn hiệu ứng "thêm"
      const next = Array.from({ length: UNLIKE_PARTICLE_COUNT }, (_, i) => ({
        key: `${id}-u${i}`,
        mode: "unlike",
        angle: 90 + (Math.random() * 60 - 30),
        distance: 10 + Math.random() * 10,
        delay: Math.random() * 40,
        size: 3 + Math.random() * 2,
        color: UNLIKE_COLOR,
      }));
      setParticles(next);
    }

    timeoutRef.current = setTimeout(() => {
      setBursting(false);
      setParticles([]);
    }, BURST_DURATION);
  }, []);

  return { bursting, particles, trigger };
}

export function WishlistParticles({ particles }) {
  if (!particles.length) return null;
  return (
    <span className="wl-particle-field" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.key}
          className={`wl-particle${p.mode === "unlike" ? " wl-particle-unlike" : ""}`}
          style={{
            "--wl-angle": `${p.angle}deg`,
            "--wl-distance": `${p.distance}px`,
            "--wl-size": `${p.size}px`,
            background: p.color,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </span>
  );
}
