import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let mx = -300, my = -300;
    let pressing = false;
    let frame = 0;

    /* ── Fireflies ── */
    const N = 10;
    const flies = Array.from({ length: N }, (_, i) => ({
      x: -300, y: -300,
      vx: 0, vy: 0,
      angle: (i / N) * Math.PI * 2,
      orbitR: 24 + Math.random() * 18,
      speed:  0.014 + Math.random() * 0.022,
      size:   2.0 + Math.random() * 2.2,
      phase:  Math.random() * Math.PI * 2,
      scatter: false, gathering: false,
      sx: 0, sy: 0, st: 0,
    }));

    /* ── Burst particles ── */
    const bursts = [];

    /* ── Easing ── */
    function easeOutCubic(t)  { return 1 - Math.pow(1 - t, 3); }
    function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

    /* ── Glow dot ── */
    function glowDot(x, y, r, color, glow, alpha) {
      if (alpha <= 0 || r <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(alpha, 1);
      ctx.shadowBlur  = glow;
      ctx.shadowColor = color;
      ctx.fillStyle   = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* ── Spawn burst on click ── */
    function spawnBurst(x, y) {
      /* scatter flies */
      flies.forEach(f => {
        const a = Math.random() * Math.PI * 2;
        const d = 52 + Math.random() * 80;
        f.scatter   = true;
        f.gathering = false;
        f.sx = x + Math.cos(a) * d;
        f.sy = y + Math.sin(a) * d;
        f.st = 0;
      });

      /* spark particles */
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + Math.random() * 0.25;
        const s = 2.4 + Math.random() * 3.2;
        bursts.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 1,
          size: 2.2 + Math.random() * 2.8,
          hue: 112 + Math.random() * 38,
        });
      }

      /* two ripple rings */
      bursts.push({ ripple: true, x, y, r: 4, life: 1, delay: 0 });
      bursts.push({ ripple: true, x, y, r: 4, life: 1, delay: 0.1 });
    }

    /* ── Gather flies back after scatter ── */
    let gatherTimer = null;
    function scheduleGather() {
      clearTimeout(gatherTimer);
      gatherTimer = setTimeout(() => {
        flies.forEach(f => {
          if (f.scatter || f.gathering) {
            f.scatter   = false;
            f.gathering = true;
            f.st        = 0;
          }
        });
      }, 420);
    }

    /* ── Event listeners ── */
    const onMove  = e => { mx = e.clientX; my = e.clientY; };
    const onDown  = () => { pressing = true; };
    const onUp    = () => { pressing = false; };
    const onClick = e => { spawnBurst(e.clientX, e.clientY); scheduleGather(); };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup",   onUp);
    document.addEventListener("click",     onClick);
    document.body.style.cursor = "none";

    /* ── Main loop ── */
    let rafId;
    function tick() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const visible = mx > -200;

      /* ── Ring + dot (snap to cursor) ── */
      if (visible) {
        const ringR = pressing ? 15 : 21;

        /* outer ring */
        ctx.save();
        ctx.globalAlpha = pressing ? 0.92 : 0.58;
        ctx.strokeStyle = pressing
          ? "rgba(100,240,90,1)"
          : "rgba(74,200,63,0.88)";
        ctx.lineWidth   = pressing ? 2 : 1.4;
        ctx.shadowBlur  = pressing ? 22 : 12;
        ctx.shadowColor = "rgba(74,200,63,0.5)";
        ctx.beginPath();
        ctx.arc(mx, my, ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        /* inner faint ring */
        ctx.save();
        ctx.globalAlpha = 0.13;
        ctx.strokeStyle = "rgba(74,200,63,0.9)";
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        ctx.arc(mx, my, ringR * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        /* center dot */
        glowDot(
          mx, my,
          pressing ? 5 : 3.2,
          "#7fff78",
          pressing ? 22 : 14,
          pressing ? 1 : 0.96
        );
      }

      /* ── Fireflies ── */
      flies.forEach(f => {
        if (f.scatter) {
          /* fly outward to scatter position */
          f.st = Math.min(f.st + 0.042, 1);
          const e = easeOutCubic(f.st);
          f.x = mx + (f.sx - mx) * e;
          f.y = my + (f.sy - my) * e;
          if (f.st >= 1) {
            f.scatter   = false;
            f.gathering = true;
            f.st        = 0;
          }

        } else if (f.gathering) {
          /* drift back to orbit */
          f.st = Math.min(f.st + 0.022, 1);
          const wobble  = Math.sin(frame * 0.025 + f.phase) * 5;
          const orbitX  = mx + Math.cos(f.angle) * (f.orbitR + wobble);
          const orbitY  = my + Math.sin(f.angle) * (f.orbitR + wobble);
          const ease    = easeInOutSine(f.st);
          f.x += (orbitX - f.x) * (0.04 + ease * 0.05);
          f.y += (orbitY - f.y) * (0.04 + ease * 0.05);
          if (f.st >= 1) f.gathering = false;

        } else {
  /* normal orbit với quán tính vật lý */
  f.angle += f.speed;
  const wobble = Math.sin(frame * 0.028 + f.phase) * 5;
  const r      = f.orbitR + wobble;
  const tx     = mx + Math.cos(f.angle) * r;
  const ty     = my + Math.sin(f.angle) * r;

  // Tính velocity
  f.vx = (f.vx || 0) + (tx - f.x) * 0.055;
  f.vy = (f.vy || 0) + (ty - f.y) * 0.055;

  // Damping — giảm dần để không dao động mãi
  f.vx *= 0.72;
  f.vy *= 0.72;

  f.x += f.vx;
  f.y += f.vy;
}

        /* draw firefly */
        const blink = 0.38 + 0.62 * Math.abs(Math.sin(frame * 0.042 + f.phase));
        const sz    = f.size * (pressing ? 1.35 : 1);
        glowDot(f.x, f.y, sz,       "#4ac83f", 14, blink * 0.88);
        glowDot(f.x, f.y, sz * 0.4, "#9affaa",  6, blink * 0.5);
      });

      /* ── Burst particles ── */
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];

        if (b.delay > 0) {
          b.delay -= 0.018;
          continue;
        }

        if (b.ripple) {
          b.r    += 3.4;
          b.life -= 0.042;
          if (b.life <= 0) { bursts.splice(i, 1); continue; }
          ctx.save();
          ctx.globalAlpha = b.life * 0.65;
          ctx.strokeStyle = "rgba(80,220,74,0.9)";
          ctx.lineWidth   = 1.3;
          ctx.shadowBlur  = 10;
          ctx.shadowColor = "rgba(74,210,80,0.5)";
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

        } else {
          b.x    += b.vx;
          b.y    += b.vy;
          b.vx   *= 0.91;
          b.vy   *= 0.91;
          b.life -= 0.028;
          if (b.life <= 0) { bursts.splice(i, 1); continue; }
          glowDot(
            b.x, b.y,
            b.size * b.life,
            `hsl(${b.hue}, 85%, 62%)`,
            16,
            b.life * 0.88
          );
        }
      }

      rafId = requestAnimationFrame(tick);
    }
    tick();

    /* ── Cleanup ── */
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup",   onUp);
      document.removeEventListener("click",     onClick);
      document.body.style.cursor = "";
      clearTimeout(gatherTimer);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 999999,
      }}
    />
  );
}