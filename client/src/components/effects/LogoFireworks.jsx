import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

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

const BURST_STYLES = ["peony", "chrysanthemum", "willow", "ring", "crackle"];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const LogoFireworks = forwardRef(function LogoFireworks(
  {
    className = "",
    style = {},
    auto = true,
    minInterval = 1500,
    maxInterval = 3200,
  },
  ref,
) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const autoTimerRef = useRef(null);
  const dprRef = useRef(1);
  const sizeRef = useRef({ w: 0, h: 0 });
  const reducedMotionRef = useRef(false);

  // Setup canvas sizing + resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;
    reducedMotionRef.current = prefersReducedMotion();

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

    let mq;
    const handleMotionChange = (e) => {
      reducedMotionRef.current = e.matches;
    };
    try {
      mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener?.("change", handleMotionChange);
    } catch {
      /* ignore old browsers */
    }

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
      mq?.removeEventListener?.("change", handleMotionChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  //  Render loop
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

        //  ROCKET (tên lửa bay lên trước khi nổ)
        if (p.type === "rocket") {
          p.vy += p.gravity;
          p.x += p.vx;
          p.y += p.vy;

          // lưu vệt bay để vẽ đuôi lửa mượt
          p.trail.unshift({ x: p.x, y: p.y });
          if (p.trail.length > 7) p.trail.pop();

          ctx.lineCap = "round";
          for (let t = 0; t < p.trail.length - 1; t++) {
            const a = p.trail[t];
            const b = p.trail[t + 1];
            const trailAlpha = (1 - t / p.trail.length) * 0.55;
            ctx.beginPath();
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = trailAlpha;
            ctx.lineWidth = Math.max(0.6, p.size * (1 - t / p.trail.length));
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }

          // đầu tên lửa - lõi sáng
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          if (p.life >= p.travelLife || p.life > p.maxLife) {
            spawnFlash(p.x, p.y, p.burstColorSet);
            spawnShock(p.x, p.y, p.color);
            spawnBurst(p.x, p.y, p.burstColorSet, p.power, p.burstStyle);
            particles.splice(i, 1);
          }
          continue;
        }

        //  FLASH (chớp sáng tại tâm vụ nổ)
        if (p.type === "flash") {
          const lifeRatio = p.life / p.maxLife;
          if (lifeRatio >= 1) {
            particles.splice(i, 1);
            continue;
          }
          const radius = p.maxRadius * Math.min(1, lifeRatio * 2.2);
          const alpha = Math.max(0, 1 - lifeRatio * lifeRatio);
          const grad = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            Math.max(1, radius),
          );
          grad.addColorStop(0, "rgba(255,255,255," + alpha + ")");
          grad.addColorStop(0.4, p.colorRgba(alpha * 0.8));
          grad.addColorStop(1, p.colorRgba(0));
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.fillStyle = grad;
          ctx.arc(p.x, p.y, Math.max(1, radius), 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        //  SHOCKWAVE (vòng sóng xung kích lan ra)
        if (p.type === "shock") {
          const lifeRatio = p.life / p.maxLife;
          if (lifeRatio >= 1) {
            particles.splice(i, 1);
            continue;
          }
          const radius = p.maxRadius * lifeRatio;
          const alpha = Math.max(0, (1 - lifeRatio) * 0.6);
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(0.5, 2.2 * (1 - lifeRatio));
          ctx.arc(p.x, p.y, Math.max(1, radius), 0, Math.PI * 2);
          ctx.stroke();
          continue;
        }

        //  SPARK (tia pháo hoa chính + hạt glitter/crackle phụ)
        p.vy += p.gravity;
        p.vx *= p.friction;
        p.vy *= p.friction;
        if (p.wind) p.vx += p.wind;
        p.x += p.vx;
        p.y += p.vy;
        const lifeRatio = p.life / p.maxLife;
        p.alpha = Math.max(0, 1 - lifeRatio);

        // hạt "crackle": tới thời điểm định sẵn thì tự nổ phụ thành vài tia lấp lánh nhỏ
        if (
          p.willCrackle &&
          !p.crackled &&
          p.life >= p.crackleAt &&
          p.alpha > 0.05
        ) {
          p.crackled = true;
          spawnCrackle(p.x, p.y, p.color);
        }

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

  //  Helpers để tạo hiệu ứng phụ

  const hexToRgb = (hex) => {
    const h = hex.replace("#", "");
    const bigint = parseInt(
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h,
      16,
    );
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const spawnFlash = (x, y, colorSet) => {
    const color = pick(colorSet) || "#ffffff";
    const [r, g, b] = hexToRgb(color);
    particlesRef.current.push({
      type: "flash",
      x,
      y,
      life: 0,
      maxLife: rand(10, 16),
      maxRadius: rand(22, 34),
      colorRgba: (a) => `rgba(${r},${g},${b},${a})`,
    });
  };

  const spawnShock = (x, y, color) => {
    particlesRef.current.push({
      type: "shock",
      x,
      y,
      color,
      life: 0,
      maxLife: rand(24, 34),
      maxRadius: rand(38, 58),
    });
  };

  // Hạt "crackle" nhỏ - tạo cảm giác lấp lánh, tách tách như pháo hoa thật
  const spawnCrackle = (x, y, baseColor) => {
    const n = Math.round(rand(3, 6));
    for (let i = 0; i < n; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(0.4, 1.6);
      particlesRef.current.push({
        type: "spark",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: rand(0.02, 0.05),
        friction: rand(0.92, 0.96),
        size: rand(0.7, 1.6),
        glow: rand(5, 10),
        color: Math.random() > 0.5 ? "#ffffff" : baseColor,
        life: 0,
        maxLife: rand(10, 18),
        alpha: 1,
        willCrackle: false,
      });
    }
  };

  const spawnBurst = (x, y, colorSet, power = 1, styleName = "peony") => {
    switch (styleName) {
      case "chrysanthemum": {
        const count = Math.round(rand(34, 46) * power);
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + rand(-0.14, 0.14);
          const speed = rand(2.2, 4.8) * power;
          particlesRef.current.push({
            type: "spark",
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: rand(0.05, 0.075),
            friction: rand(0.955, 0.975),
            size: rand(1.3, 2.6),
            glow: rand(5, 10),
            color: pick(colorSet),
            life: 0,
            maxLife: rand(46, 72),
            alpha: 1,
            willCrackle: Math.random() < 0.35,
            crackleAt: rand(24, 46),
          });
        }
        break;
      }

      case "willow": {
        const count = Math.round(rand(22, 30) * power);
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + rand(-0.2, 0.2);
          const speed = rand(1.2, 2.6) * power;
          particlesRef.current.push({
            type: "spark",
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: rand(0.09, 0.13),
            friction: rand(0.975, 0.99),
            size: rand(1, 2),
            glow: rand(4, 8),
            color: pick(colorSet),
            life: 0,
            maxLife: rand(70, 100),
            alpha: 1,
            wind: rand(-0.01, 0.01),
            willCrackle: Math.random() < 0.2,
            crackleAt: rand(40, 70),
          });
        }
        break;
      }

      case "ring": {
        const count = Math.round(rand(28, 36) * power);
        const speed = rand(2.6, 3.4) * power;
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          particlesRef.current.push({
            type: "spark",
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: rand(0.05, 0.07),
            friction: rand(0.96, 0.975),
            size: rand(1.2, 2),
            glow: rand(5, 9),
            color: pick(colorSet),
            life: 0,
            maxLife: rand(36, 50),
            alpha: 1,
            willCrackle: false,
          });
        }
        break;
      }

      case "crackle": {
        const count = Math.round(rand(40, 56) * power);
        for (let i = 0; i < count; i++) {
          const angle = rand(0, Math.PI * 2);
          const speed = rand(1, 3.6) * power;
          particlesRef.current.push({
            type: "spark",
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: rand(0.04, 0.07),
            friction: rand(0.94, 0.97),
            size: rand(0.9, 1.8),
            glow: rand(4, 8),
            color: pick(colorSet),
            life: 0,
            maxLife: rand(26, 46),
            alpha: 1,
            willCrackle: Math.random() < 0.55,
            crackleAt: rand(10, 30),
          });
        }
        break;
      }

      case "peony":
      default: {
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
            willCrackle: Math.random() < 0.2,
            crackleAt: rand(20, 40),
          });
        }
        break;
      }
    }

    // lõi sáng lấp lánh ngay tâm nổ (mọi kiểu đều có)
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
        willCrackle: false,
      });
    }
  };

  // Bắn "tia mồi" tỏa ra từ đúng tâm logo (mọi hướng), bay một đoạn ngắn rồi nổ bùng ra —
  // KHÔNG phóng từ đáy canvas bay lên như tên lửa pháo hoa thật nữa.
  const launchRocket = (originX, originY, burstStyle) => {
    const colorSet = [pick(PALETTE), pick(PALETTE), pick(PALETTE), "#ffffff"];
    const angle = rand(0, Math.PI * 2);
    const speed = rand(1.6, 3.4);
    particlesRef.current.push({
      type: "rocket",
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.02, // trọng lực rất nhẹ vì quãng đường bay chỉ ngắn quanh logo
      travelLife: rand(7, 16), // số khung hình bay trước khi nổ
      color: pick(colorSet),
      size: rand(1.6, 2.2),
      life: 0,
      maxLife: 24,
      trail: [],
      burstColorSet: colorSet,
      burstStyle: burstStyle || pick(BURST_STYLES),
      power: rand(0.85, 1.15),
    });
  };

  //  Bắn thủ công (hover / click / focus / gọi từ ngoài qua ref)
  //  Xuất phát ngay tại tâm logo, tỏa ra xung quanh — không bắn từ đáy lên.
  const burst = () => {
    const { w, h } = sizeRef.current;
    if (!w || !h) return;
    const cx = w / 2;
    const cy = h / 2;

    const rockets = 2 + (Math.random() > 0.5 ? 1 : 0);
    for (let i = 0; i < rockets; i++) {
      const originX = cx + rand(-10, 10);
      const originY = cy + rand(-8, 8);
      const delay = i * rand(70, 140);
      setTimeout(() => {
        launchRocket(originX, originY);
        ensureLoop();
      }, delay);
    }
    ensureLoop();
  };

  //  Vòng lặp tự động bắn liên tục, vô hạn
  useEffect(() => {
    if (!auto) return;

    let cancelled = false;

    const fireAndSchedule = () => {
      if (cancelled) return;

      const isHidden =
        typeof document !== "undefined" && document.hidden === true;

      // Nếu người dùng bật "giảm chuyển động" thì bắn thưa hơn hẳn thay vì tắt hẳn,
      // vẫn giữ cảm giác "sống" cho logo nhưng không gây khó chịu.
      const reduced = reducedMotionRef.current;

      if (!isHidden) {
        const { w, h } = sizeRef.current;
        if (w && h) {
          const cx = w / 2;
          const cy = h / 2;
          const rockets = reduced ? 1 : 1 + (Math.random() > 0.55 ? 1 : 0);
          for (let i = 0; i < rockets; i++) {
            const originX = cx + rand(-10, 10);
            const originY = cy + rand(-8, 8);
            const delay = i * rand(110, 200);
            setTimeout(() => {
              if (cancelled) return;
              launchRocket(originX, originY);
              ensureLoop();
            }, delay);
          }
        }
      }

      const nextDelay = reduced
        ? rand(minInterval * 2.2, maxInterval * 2.6)
        : rand(minInterval, maxInterval);
      autoTimerRef.current = setTimeout(fireAndSchedule, nextDelay);
    };

    // Bắn phát đầu tiên sớm để chào mừng khi trang vừa tải
    autoTimerRef.current = setTimeout(fireAndSchedule, 700);

    return () => {
      cancelled = true;
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, minInterval, maxInterval]);

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
