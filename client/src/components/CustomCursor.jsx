import { useEffect, useRef } from "react";

/* ─── Vẽ lá cây bằng canvas path ─── */
function drawLeaf(ctx, x, y, size, angle, alpha, colorStr) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  /* thân lá: bezier cong 2 bên */
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo( size * 0.8, -size * 0.4,  size * 0.8,  size * 0.4, 0,  size);
  ctx.bezierCurveTo(-size * 0.8,  size * 0.4, -size * 0.8, -size * 0.4, 0, -size);
  ctx.fillStyle = colorStr;
  ctx.fill();
  /* gân lá giữa */
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.85);
  ctx.lineTo(0,  size * 0.85);
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = size * 0.08;
  ctx.stroke();
  ctx.restore();
}

/* Palette lá — xanh rừng nhiều sắc */
const LEAF_COLORS = [
  "rgba(34,90,44,{a})",
  "rgba(56,120,54,{a})",
  "rgba(80,145,60,{a})",
  "rgba(44,110,38,{a})",
  "rgba(100,160,70,{a})",
  "rgba(28,72,30,{a})",
  "rgba(120,170,55,{a})",
];

function leafColor(idx, alpha) {
  return LEAF_COLORS[idx % LEAF_COLORS.length].replace("{a}", alpha.toFixed(3));
}

let _setEnabled = null;
export function toggleCursorEffect() { _setEnabled?.(v => !v); }
export function setCursorEffect(on) { _setEnabled?.(on); }

export default function CustomCursor() {
  const canvasRef = useRef(null);
  const enabledRef = useRef(true);

  useEffect(() => {
    _setEnabled = (v) => {
      enabledRef.current = typeof v === 'function' ? v(enabledRef.current) : v;
    };
    return () => { _setEnabled = null; };
  }, []);

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

    /* ══════════════════════════════════════
       LÁ CÂY RƠI — lớp phủ nền
       pointerEvents: none nên không chặn click
    ══════════════════════════════════════ */
    const LEAF_COUNT = 22;
    const leaves = Array.from({ length: LEAF_COUNT }, (_, i) => spawnLeaf(i / LEAF_COUNT));

    function spawnLeaf(yFrac) {
      return {
        x:     Math.random() * window.innerWidth,
        y:     yFrac !== undefined
                 ? yFrac * window.innerHeight
                 : -30,
        vx:    (Math.random() - 0.5) * 0.55,
        vy:    0.35 + Math.random() * 0.55,
        angle: Math.random() * Math.PI * 2,
        spin:  (Math.random() - 0.5) * 0.018,
        size:  7 + Math.random() * 11,
        sway:  Math.random() * Math.PI * 2,
        swayS: 0.006 + Math.random() * 0.010,
        swayA: 0.4 + Math.random() * 0.7,
        alpha: 0.10 + Math.random() * 0.18,  /* nhạt — chỉ là lớp phủ */
        colorIdx: Math.floor(Math.random() * LEAF_COLORS.length),
      };
    }

    function updateLeaves() {
      leaves.forEach((l, i) => {
        l.sway  += l.swayS;
        l.x     += l.vx + Math.sin(l.sway) * l.swayA;
        l.y     += l.vy;
        l.angle += l.spin;
        /* tái sinh ở trên khi ra khỏi màn hình */
        if (l.y > canvas.height + 30 || l.x < -60 || l.x > canvas.width + 60) {
          leaves[i] = spawnLeaf();
        }
      });
    }

    function drawLeaves() {
      leaves.forEach(l => {
        drawLeaf(ctx, l.x, l.y, l.size, l.angle, l.alpha, leafColor(l.colorIdx, l.alpha));
      });
    }

    /* ══════════════════════════════════════
       FIREFLIES
    ══════════════════════════════════════ */
    const N = 10;
    const flies = Array.from({ length: N }, () => ({
      x: -300, y: -300,
      vx: 0, vy: 0,
      ox: (Math.random() - 0.5) * 54,
      oy: (Math.random() - 0.5) * 54,
      wx: Math.random() * Math.PI * 2,
      wy: Math.random() * Math.PI * 2,
      wsx: 0.008 + Math.random() * 0.012,
      wsy: 0.009 + Math.random() * 0.011,
      driftAmp: 10 + Math.random() * 14,
      size:  2.0 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
      scatter: false, gathering: false,
      sx: 0, sy: 0, st: 0,
    }));

    const bursts = [];

    function easeOutCubic(t)  { return 1 - Math.pow(1 - t, 3); }
    function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

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

    function spawnBurst(x, y) {
      flies.forEach(f => {
        const a = Math.random() * Math.PI * 2;
        const d = 52 + Math.random() * 80;
        f.scatter   = true;
        f.gathering = false;
        f.sx = x + Math.cos(a) * d;
        f.sy = y + Math.sin(a) * d;
        f.st = 0;
      });
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
      bursts.push({ ripple: true, x, y, r: 4, life: 1, delay: 0 });
      bursts.push({ ripple: true, x, y, r: 4, life: 1, delay: 0.1 });
    }

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

    const onMove  = e => { mx = e.clientX; my = e.clientY; };
    const onDown  = () => { pressing = true; };
    const onUp    = () => { pressing = false; };
    const onClick = e => { spawnBurst(e.clientX, e.clientY); scheduleGather(); };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup",   onUp);
    document.addEventListener("click",     onClick);
    document.body.style.cursor = "none";

    /* ══════════════════════════════════════
       MAIN LOOP
    ══════════════════════════════════════ */
    let rafId;
    function tick() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* 1. Lá cây — vẽ trước, dưới cùng */
      if(enabledRef.current){updateLeaves();drawLeaves();}

      const visible = enabledRef.current && mx > -200;

      /* 2. Cursor ring + dot */
      if (visible) {
        const ringR = pressing ? 15 : 21;
        ctx.save();
        ctx.globalAlpha = pressing ? 0.92 : 0.58;
        ctx.strokeStyle = pressing ? "rgba(100,240,90,1)" : "rgba(74,200,63,0.88)";
        ctx.lineWidth   = pressing ? 2 : 1.4;
        ctx.shadowBlur  = pressing ? 22 : 12;
        ctx.shadowColor = "rgba(74,200,63,0.5)";
        ctx.beginPath();
        ctx.arc(mx, my, ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.13;
        ctx.strokeStyle = "rgba(74,200,63,0.9)";
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        ctx.arc(mx, my, ringR * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        glowDot(mx, my, pressing ? 5 : 3.2, "#7fff78", pressing ? 22 : 14, pressing ? 1 : 0.96);
      }

      /* 3. Fireflies */
      flies.forEach(f => {
        if (f.scatter) {
          f.st = Math.min(f.st + 0.042, 1);
          const e = easeOutCubic(f.st);
          f.x = mx + (f.sx - mx) * e;
          f.y = my + (f.sy - my) * e;
          if (f.st >= 1) { f.scatter = false; f.gathering = true; f.st = 0; }

        } else if (f.gathering) {
          f.st = Math.min(f.st + 0.022, 1);
          const driftX  = Math.sin(f.wx) * f.driftAmp;
          const driftY  = Math.cos(f.wy) * f.driftAmp;
          const targetX = mx + f.ox + driftX;
          const targetY = my + f.oy + driftY;
          const ease    = easeInOutSine(f.st);
          f.x += (targetX - f.x) * (0.04 + ease * 0.05);
          f.y += (targetY - f.y) * (0.04 + ease * 0.05);
          if (f.st >= 1) f.gathering = false;

        } else {
          f.wx += f.wsx;
          f.wy += f.wsy;
          const driftX  = Math.sin(f.wx) * f.driftAmp;
          const driftY  = Math.cos(f.wy) * f.driftAmp;
          const targetX = mx + f.ox + driftX;
          const targetY = my + f.oy + driftY;
          f.vx += (targetX - f.x) * 0.048;
          f.vy += (targetY - f.y) * 0.048;
          f.vx *= 0.78;
          f.vy *= 0.78;
          f.x  += f.vx;
          f.y  += f.vy;
        }

        const blink = 0.38 + 0.62 * Math.abs(Math.sin(frame * 0.042 + f.phase));
        const sz    = f.size * (pressing ? 1.35 : 1);
        glowDot(f.x, f.y, sz,       "#4ac83f", 14, blink * 0.88);
        glowDot(f.x, f.y, sz * 0.4, "#9affaa",  6, blink * 0.5);
      });

      /* 4. Burst particles */
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        if (b.delay > 0) { b.delay -= 0.018; continue; }

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
          glowDot(b.x, b.y, b.size * b.life, `hsl(${b.hue}, 85%, 62%)`, 16, b.life * 0.88);
        }
      }

      rafId = requestAnimationFrame(tick);
    }
    tick();

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
        pointerEvents: "none",   /* ← không chặn click bất kỳ nút nào */
        zIndex: 999999,
      }}
    />
  );
}