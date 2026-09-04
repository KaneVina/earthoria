import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/**
 * LogoFireworks
 * Canvas pháo hoa "tung tóe" phủ lên logo header.
 * Gọi ref.burst() để bắn 1-2 quả pháo hoa nổ tung thành nhiều tia sáng.
 *
 * Thiết kế nhẹ, chỉ chạy requestAnimationFrame khi có hạt đang sống,
 * tự resize theo devicePixelRatio để nét trên mọi màn hình.
 */

const PALETTE = [
  "#ffd76a", // gold
  "#b8862e", // deep gold (brand)
  "#4a9e3f", // green (brand)
  "#2a78d6", // blue (brand)
  "#7a4fb5", // purple (brand)
  "#ff6b81", // pink
  "#5be0c0", // teal/cyan
  "#ffffff", // white sparkle
];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

const LogoFireworks = forwardRef(function LogoFireworks(
  { className = "", style = {} },
  ref,
) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const dprRef = useRef(1);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Setup canvas sizing + resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      dprRef.current = dpr;
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("resize", resize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const ensureLoop = () => {
    if (rafRef.current) return;
    const loop = () => {
      const ctx = ctxRef.current;
      const { w, h } = sizeRef.current;
      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;

        if (p.type === "rocket") {
          p.vy += p.gravity;
          p.x += p.vx;
          p.y += p.vy;

          // trail
          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.85;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // faint trail dot behind
          ctx.beginPath();
          ctx.globalAlpha = 0.35;
          ctx.arc(
            p.x - p.vx * 1.4,
            p.y - p.vy * 1.4,
            p.size * 0.6,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          if (p.vy >= p.explodeAt || p.life > p.maxLife) {
            spawnBurst(p.x, p.y, p.burstColorSet, p.power);
            particles.splice(i, 1);
          }
          continue;
        }

        // spark particle
        p.vy += p.gravity;
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.x += p.vx;
        p.y += p.vy;
        const lifeRatio = p.life / p.maxLife;
        p.alpha = Math.max(0, 1 - lifeRatio);

        if (p.alpha <= 0.02 || p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        const r = Math.max(0.4, p.size * (1 - lifeRatio * 0.6));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.glow;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;

      if (particles.length > 0) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const spawnBurst = (x, y, colorSet, power = 1) => {
    const count = Math.round(rand(26, 36) * power);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + rand(-0.18, 0.18);
      const speed = rand(1.4, 4.2) * power;
      particlesRef.current.push({
        type: "spark",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: rand(0.045, 0.07),
        friction: rand(0.945, 0.972),
        size: rand(1.4, 3),
        glow: rand(4, 9),
        color: pick(colorSet),
        life: 0,
        maxLife: rand(38, 62),
        alpha: 1,
      });
    }
    // small sparkle core flash
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        type: "spark",
        x,
        y,
        vx: rand(-0.6, 0.6),
        vy: rand(-0.6, 0.6),
        gravity: 0.01,
        friction: 0.94,
        size: rand(2, 3.4),
        glow: 10,
        color: "#ffffff",
        life: 0,
        maxLife: rand(14, 20),
        alpha: 1,
      });
    }
  };

  const launchRocket = (originX, originY, targetYRatio) => {
    const { h } = sizeRef.current;
    const colorSet = [pick(PALETTE), pick(PALETTE), pick(PALETTE), "#ffffff"];
    const targetY = h * targetYRatio;
    particlesRef.current.push({
      type: "rocket",
      x: originX,
      y: originY,
      vx: rand(-0.5, 0.5),
      vy: rand(-6.4, -5.2),
      gravity: 0.14,
      explodeAt: -rand(0.2, 0.9), // explode once vy crosses this (near apex)
      color: pick(colorSet),
      size: rand(1.6, 2.2),
      life: 0,
      maxLife: 60,
      burstColorSet: colorSet,
      power: rand(0.85, 1.15),
    });
    void targetY;
  };

  const burst = () => {
    const { w, h } = sizeRef.current;
    if (!w || !h) return;

    const rockets = 2 + (Math.random() > 0.5 ? 1 : 0);
    for (let i = 0; i < rockets; i++) {
      const originX = w * rand(0.28, 0.72);
      const delay = i * rand(90, 170);
      setTimeout(() => {
        launchRocket(originX, h * 0.92, rand(0.15, 0.4));
      }, delay);
    }
    // kick the loop immediately + after delays via ensureLoop calls
    ensureLoop();
    for (let i = 1; i < rockets; i++) {
      setTimeout(ensureLoop, i * 90 + 10);
    }
  };

  useImperativeHandle(ref, () => ({ burst }));

  return (
    <canvas
      ref={canvasRef}
      className={`logo-fireworks-canvas ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
});

export default LogoFireworks;
