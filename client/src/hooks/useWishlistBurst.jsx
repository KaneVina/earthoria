import { useCallback, useRef, useState } from "react";
const PARTICLE_COUNT = 6;
const BURST_DURATION = 560; // ms — khớp với animation CSS wl-particle / wl-pop bên dưới

export function useHeartBurst() {
  const [bursting, setBursting] = useState(false);
  const [particles, setParticles] = useState([]);
  const timeoutRef = useRef(null);
  const burstIdRef = useRef(0);

  const trigger = useCallback((willBeLiked) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setBursting(true);
    if (willBeLiked) {
      const id = ++burstIdRef.current;
      const next = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        key: `${id}-${i}`,
        angle: (360 / PARTICLE_COUNT) * i + (Math.random() * 24 - 12),
        distance: 16 + Math.random() * 10,
        delay: Math.random() * 40,
      }));
      setParticles(next);
    } else {
      setParticles([]);
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
          className="wl-particle"
          style={{
            "--wl-angle": `${p.angle}deg`,
            "--wl-distance": `${p.distance}px`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </span>
  );
}