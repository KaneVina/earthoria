import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/* Vẽ lá cây bằng canvas path (chế độ mặc định) */
function drawLeaf(ctx, x, y, size, angle, alpha, colorStr) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  /* thân lá: bezier cong 2 bên */
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(size * 0.8, -size * 0.4, size * 0.8, size * 0.4, 0, size);
  ctx.bezierCurveTo(
    -size * 0.8,
    size * 0.4,
    -size * 0.8,
    -size * 0.4,
    0,
    -size,
  );
  ctx.fillStyle = colorStr;
  ctx.fill();
  /* gân lá giữa */
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.85);
  ctx.lineTo(0, size * 0.85);
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = size * 0.08;
  ctx.stroke();
  ctx.restore();
}

/* Palette lá — xanh rừng nhiều sắc (mặc định) */
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

/* ─ Vẽ bong bóng nhiều màu, có điểm sáng phản chiếu (chế độ /e-kid) ─ */
function drawBubble(ctx, x, y, r, alpha, hue) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createRadialGradient(
    x - r * 0.3,
    y - r * 0.3,
    r * 0.1,
    x,
    y,
    r,
  );
  grad.addColorStop(0, `hsla(${hue},95%,88%,0.85)`);
  grad.addColorStop(0.6, `hsla(${hue},90%,70%,0.5)`);
  grad.addColorStop(1, `hsla(${hue},85%,60%,0.12)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `hsla(${hue},100%,95%,0.45)`;
  ctx.lineWidth = 1;
  ctx.stroke();
  /* điểm sáng nhỏ như ánh phản chiếu trên bong bóng thật */
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, Math.max(r * 0.22, 0.8), 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fill();
  ctx.restore();
}

/* ─ Vẽ ngôi sao 5 cánh lấp lánh (chế độ /e-kid) ─ */
function drawStar(ctx, x, y, size, angle, alpha, color) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    const ox = Math.cos(outerAngle) * size;
    const oy = Math.sin(outerAngle) * size;
    const ix = Math.cos(innerAngle) * size * 0.42;
    const iy = Math.sin(innerAngle) * size * 0.42;
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/* Bảng màu tươi vui dành cho trẻ nhỏ — hồng, cam, vàng, xanh dương, tím, xanh lá */
const KID_HUES = [335, 25, 48, 195, 265, 145];

let _setEnabled = null;
export function toggleCursorEffect() {
  _setEnabled?.((v) => !v);
}
export function setCursorEffect(on) {
  _setEnabled?.(on);
}

function detectMobile() {
  if (typeof window === "undefined") return false;
  const coarse =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  return coarse || touch;
}

export default function CustomCursor() {
  const canvasRef = useRef(null);
  const enabledRef = useRef(true);
  const { pathname } = useLocation();
  const modeRef = useRef("default");
  modeRef.current = pathname.startsWith("/dashboard")
    ? "dashboard"
    : pathname.startsWith("/e-kid")
      ? "kid"
      : "default";

  useEffect(() => {
    _setEnabled = (v) => {
      enabledRef.current = typeof v === "function" ? v(enabledRef.current) : v;
    };
    return () => {
      _setEnabled = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const isMobile = detectMobile();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    let tx = -300,
      ty = -300; // target: cập nhật ngay khi có mousemove
    let mx = -300,
      my = -300; // smoothed: theo sau tx/ty một cách mượt mà
    const CURSOR_SMOOTH = { default: 0.35, kid: 0.32, dashboard: 0.98 };

    /* Vòng ring giãn nở mượt khi nhấn/nhả thay vì đổi kích thước tức thời */
    let ringR = isMobile ? 0 : 21;
    let ringTarget = 21;

    let pressing = false;
    let frame = 0;

    /* ══════════════════════════════════════
       LÁ CÂY RƠI
    ══════════════════════════════════════ */
    const LEAF_COUNT = isMobile ? 14 : 22; // giảm số lá trên mobile để nhẹ máy hơn
    const leaves = Array.from({ length: LEAF_COUNT }, (_, i) =>
      spawnLeaf(i / LEAF_COUNT),
    );

    function spawnLeaf(yFrac) {
      return {
        x: Math.random() * window.innerWidth,
        y: yFrac !== undefined ? yFrac * window.innerHeight : -30,
        vx: (Math.random() - 0.5) * 0.55,
        vy: 0.35 + Math.random() * 0.55,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.018,
        size: 7 + Math.random() * 11,
        sway: Math.random() * Math.PI * 2,
        swayS: 0.006 + Math.random() * 0.01,
        swayA: 0.4 + Math.random() * 0.7,
        alpha: 0.1 + Math.random() * 0.18 /* nhạt — chỉ là lớp phủ */,
        colorIdx: Math.floor(Math.random() * LEAF_COLORS.length),
      };
    }

    function updateLeaves() {
      leaves.forEach((l, i) => {
        l.sway += l.swayS;
        l.x += l.vx + Math.sin(l.sway) * l.swayA;
        l.y += l.vy;
        l.angle += l.spin;
        /* tái sinh ở trên khi ra khỏi màn hình */
        if (l.y > canvas.height + 30 || l.x < -60 || l.x > canvas.width + 60) {
          leaves[i] = spawnLeaf();
        }
      });
    }

    function drawLeaves() {
      leaves.forEach((l) => {
        drawLeaf(
          ctx,
          l.x,
          l.y,
          l.size,
          l.angle,
          l.alpha,
          leafColor(l.colorIdx, l.alpha),
        );
      });
    }

    /* ══════════════════════════════════════
       BONG BÓNG BAY LÊN
    ══════════════════════════════════════ */
    const BUBBLE_COUNT = isMobile ? 10 : 16;
    const bubbles = Array.from({ length: BUBBLE_COUNT }, (_, i) =>
      spawnBubble(i / BUBBLE_COUNT),
    );

    function spawnBubble(yFrac) {
      return {
        x: Math.random() * window.innerWidth,
        y:
          yFrac !== undefined
            ? yFrac * window.innerHeight
            : window.innerHeight + 40,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.3 + Math.random() * 0.5),
        sway: Math.random() * Math.PI * 2,
        swayS: 0.01 + Math.random() * 0.015,
        swayA: 0.3 + Math.random() * 0.5,
        r: 6 + Math.random() * 14,
        alpha: 0.18 + Math.random() * 0.22,
        hue: KID_HUES[Math.floor(Math.random() * KID_HUES.length)],
      };
    }

    function updateBubbles() {
      bubbles.forEach((b, i) => {
        b.sway += b.swayS;
        b.x += b.vx + Math.sin(b.sway) * b.swayA;
        b.y += b.vy;
        if (b.y < -50 || b.x < -60 || b.x > canvas.width + 60) {
          bubbles[i] = spawnBubble();
        }
      });
    }

    function drawBubbles() {
      bubbles.forEach((b) => drawBubble(ctx, b.x, b.y, b.r, b.alpha, b.hue));
    }

    /* ══════════════════════════════════════
       FIREFLIES (xanh)
    ══════════════════════════════════════ */
    const N = 10;
    const FADE_STEP = 0.045; // tốc độ mờ dần khi "biến mất" trên mobile
    const flies = Array.from({ length: N }, () => ({
      x: -300,
      y: -300,
      vx: 0,
      vy: 0,
      ox: (Math.random() - 0.5) * 54,
      oy: (Math.random() - 0.5) * 54,
      wx: Math.random() * Math.PI * 2,
      wy: Math.random() * Math.PI * 2,
      wsx: 0.008 + Math.random() * 0.012,
      wsy: 0.009 + Math.random() * 0.011,
      driftAmp: 10 + Math.random() * 14,
      size: 2.0 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
      scatter: false,
      gathering: false,
      fadeOut: false,
      fadeAlpha: 1,
      sx: 0,
      sy: 0,
      st: 0,
    }));

    /* ══════════════════════════════════════
       NGÔI SAO LẤP LÁNH NHIỀU MÀU
    ══════════════════════════════════════ */
    const kidStars = Array.from({ length: N }, (_, i) => ({
      x: -300,
      y: -300,
      vx: 0,
      vy: 0,
      ox: (Math.random() - 0.5) * 60,
      oy: (Math.random() - 0.5) * 60,
      wx: Math.random() * Math.PI * 2,
      wy: Math.random() * Math.PI * 2,
      wsx: 0.008 + Math.random() * 0.012,
      wsy: 0.009 + Math.random() * 0.011,
      driftAmp: 12 + Math.random() * 16,
      size: 3.2 + Math.random() * 2.6,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.05,
      hue: KID_HUES[i % KID_HUES.length],
      phase: Math.random() * Math.PI * 2,
      scatter: false,
      gathering: false,
      fadeOut: false,
      fadeAlpha: 1,
      sx: 0,
      sy: 0,
      st: 0,
    }));

    const bursts = [];

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }
    function easeInOutSine(t) {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    function glowDot(x, y, r, color, glow, alpha) {
      if (alpha <= 0 || r <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(alpha, 1);
      ctx.shadowBlur = glow;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function spawnBurst(x, y) {
      const mode = modeRef.current;

      if (mode === "kid") {
        /* /e-kid: các ngôi sao bắn tung toé nhiều màu + gợn sóng cầu vồng */
        kidStars.forEach((s) => {
          const a = Math.random() * Math.PI * 2;
          const d = 55 + Math.random() * 85;
          s.scatter = true;
          s.gathering = false;
          s.fadeOut = false;
          s.fadeAlpha = 1;
          s.sx = x + Math.cos(a) * d;
          s.sy = y + Math.sin(a) * d;
          s.st = 0;
          if (isMobile) {
            s.x = x;
            s.y = y;
          }
        });
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
          const s = 2.6 + Math.random() * 3.4;
          bursts.push({
            x,
            y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 1,
            size: 2.4 + Math.random() * 3.2,
            hue: KID_HUES[Math.floor(Math.random() * KID_HUES.length)],
            star: true,
          });
        }
        bursts.push({
          ripple: true,
          x,
          y,
          r: 4,
          life: 1,
          delay: 0,
          rainbow: true,
        });
        bursts.push({
          ripple: true,
          x,
          y,
          r: 4,
          life: 1,
          delay: 0.1,
          rainbow: true,
        });
        return;
      }

      /* mặc định & /dashboard: đốm sáng xanh khi bấm/chạm.
         Chỉ chế độ mặc định mới cho đom đóm bay tán loạn — /dashboard không có đom đóm. */
      if (mode === "default") {
        flies.forEach((f) => {
          const a = Math.random() * Math.PI * 2;
          const d = 52 + Math.random() * 80;
          f.scatter = true;
          f.gathering = false;
          f.fadeOut = false;
          f.fadeAlpha = 1;
          f.sx = x + Math.cos(a) * d;
          f.sy = y + Math.sin(a) * d;
          f.st = 0;
          if (isMobile) {
            f.x = x;
            f.y = y;
          }
        });
      }

      const darker = mode === "dashboard"; // màu đậm hơn ở khu quản trị
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + Math.random() * 0.25;
        const s = 2.4 + Math.random() * 3.2;
        bursts.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 1,
          size: 2.2 + Math.random() * 2.8,
          hue: darker ? 128 + Math.random() * 18 : 112 + Math.random() * 38,
        });
      }
      bursts.push({
        ripple: true,
        x,
        y,
        r: 4,
        life: 1,
        delay: 0,
        dark: darker,
      });
      bursts.push({
        ripple: true,
        x,
        y,
        r: 4,
        life: 1,
        delay: 0.1,
        dark: darker,
      });
    }

    let gatherTimer = null;
    function scheduleGather() {
      /* Trên mobile không có "gathering" quanh con trỏ (không có vị trí chuột
         cố định để tụ về) — hạt tự fadeOut ngay sau khi scatter xong.
         Nếu vẫn hẹn giờ ở đây, trên máy yếu/tụt fps, timer 420ms có thể bắn
         ra TRƯỚC KHI scatter (tính theo frame) kết thúc, ép hạt sang trạng
         thái gathering — trạng thái này lại không được xử lý trên mobile,
         khiến hạt bị kẹt đứng yên mãi mãi. Bỏ qua hẳn trên mobile để tránh. */
      if (isMobile) return;
      clearTimeout(gatherTimer);
      gatherTimer = setTimeout(() => {
        const arr = modeRef.current === "kid" ? kidStars : flies;
        arr.forEach((f) => {
          if (f.scatter || f.gathering) {
            f.scatter = false;
            f.gathering = true;
            f.st = 0;
          }
        });
      }, 420);
    }

    /*  Sự kiện chuột (desktop)  */
    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const onDown = () => {
      pressing = true;
      ringTarget = 15;
    };
    const onUp = () => {
      pressing = false;
      ringTarget = 21;
    };
    const onClick = (e) => {
      spawnBurst(e.clientX, e.clientY);
      scheduleGather();
    };

    /*  Sự kiện cảm ứng (mobile): chỉ tạo hiệu ứng "bấm", không theo dõi vị trí liên tục  */
    const onTouchStart = (e) => {
      const t = e.touches[0];
      if (!t) return;
      pressing = true;
      spawnBurst(t.clientX, t.clientY);
      scheduleGather();
    };
    const onTouchEnd = () => {
      pressing = false;
    };

    if (!isMobile) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mousedown", onDown);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("click", onClick);
      document.body.style.cursor =
        "none"; /* ẩn con trỏ mặc định, thay bằng canvas */
    } else {
      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchend", onTouchEnd, { passive: true });
      /* không đụng tới document.body.style.cursor trên mobile — không cần thiết */
    }

    /* ══════════════════════════════════════
       MAIN LOOP
    ══════════════════════════════════════ */
    let rafId;
    function tick() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mode = modeRef.current;

      /* 1. Lớp phủ nền: lá cây (mặc định) hoặc bong bóng nhiều màu (/e-kid).
         /dashboard tối giản — không có lớp phủ nền nào cả. */
      if (enabledRef.current) {
        if (mode === "default") {
          updateLeaves();
          drawLeaves();
        } else if (mode === "kid") {
          updateBubbles();
          drawBubbles();
        }
      }

      /* 2. Làm mượt vị trí con trỏ + bán kính ring (desktop only) */
      if (!isMobile) {
        const smooth = CURSOR_SMOOTH[mode] ?? CURSOR_SMOOTH.default;
        mx += (tx - mx) * smooth;
        my += (ty - my) * smooth;
        ringR += (ringTarget - ringR) * (mode === "dashboard" ? 0.6 : 0.25);
      }

      const visible = !isMobile && enabledRef.current && tx > -200;

      /* 3. Cursor ring + dot — chỉ desktop, giao diện khác nhau theo mode */
      if (visible) {
        if (mode === "kid") {
          /* /e-kid: vòng tròn đổi màu cầu vồng, to và lung linh hơn — vui mắt cho trẻ nhỏ */
          const hue = (frame * 1.1) % 360;
          const hue2 = (hue + 140) % 360;
          const r1 = ringR * 1.15;

          ctx.save();
          ctx.globalAlpha = pressing ? 0.95 : 0.78;
          ctx.strokeStyle = `hsla(${hue}, 92%, 62%, 1)`;
          ctx.lineWidth = pressing ? 3 : 2.2;
          ctx.shadowBlur = pressing ? 26 : 18;
          ctx.shadowColor = `hsla(${hue}, 92%, 62%, 0.7)`;
          ctx.beginPath();
          ctx.arc(mx, my, r1, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = `hsla(${hue2}, 90%, 68%, 0.9)`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(mx, my, r1 * 0.55, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          glowDot(
            mx,
            my,
            pressing ? 6.5 : 4.4,
            `hsl(${hue}, 95%, 68%)`,
            pressing ? 26 : 18,
            pressing ? 1 : 0.98,
          );
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#ffffff";
          drawStar(
            ctx,
            mx,
            my,
            pressing ? 3.4 : 2.4,
            frame * 0.05,
            0.9,
            "#ffffff",
          );
          ctx.restore();
        } else if (mode === "dashboard") {
          /* /dashboard: tối giản, chỉ 1 vòng + 1 chấm, màu xanh đậm, ít hiệu ứng glow */
          const r1 = ringR * 0.85;
          ctx.save();
          ctx.globalAlpha = pressing ? 0.95 : 0.8;
          ctx.strokeStyle = pressing
            ? "rgba(16,110,42,1)"
            : "rgba(14,88,36,0.95)";
          ctx.lineWidth = pressing ? 2 : 1.4;
          ctx.shadowBlur = pressing ? 8 : 4;
          ctx.shadowColor = "rgba(14,88,36,0.3)";
          ctx.beginPath();
          ctx.arc(mx, my, r1, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          glowDot(
            mx,
            my,
            pressing ? 4.6 : 3,
            "#155c2a",
            pressing ? 8 : 4,
            pressing ? 1 : 0.98,
          );
        } else {
          ctx.save();
          ctx.globalAlpha = pressing ? 0.92 : 0.58;
          ctx.strokeStyle = pressing
            ? "rgba(100,240,90,1)"
            : "rgba(74,200,63,0.88)";
          ctx.lineWidth = pressing ? 2 : 1.4;
          ctx.shadowBlur = pressing ? 22 : 12;
          ctx.shadowColor = "rgba(74,200,63,0.5)";
          ctx.beginPath();
          ctx.arc(mx, my, ringR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.13;
          ctx.strokeStyle = "rgba(74,200,63,0.9)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(mx, my, ringR * 0.55, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          glowDot(
            mx,
            my,
            pressing ? 5 : 3.2,
            "#7fff78",
            pressing ? 22 : 14,
            pressing ? 1 : 0.96,
          );
        }
      }

      /* 4. Đom đóm xanh (mặc định) hoặc ngôi sao cầu vồng (/e-kid).
         /dashboard: không vẽ gì ở đây — đúng yêu cầu "không có hiệu ứng đom đóm". */
      if (mode === "default") {
        flies.forEach((f) => {
          if (f.scatter) {
            f.st = Math.min(f.st + 0.042, 1);
            const e = easeOutCubic(f.st);
            const originX = isMobile ? f.x : mx;
            const originY = isMobile ? f.y : my;
            f.x = originX + (f.sx - originX) * e;
            f.y = originY + (f.sy - originY) * e;
            if (f.st >= 1) {
              f.scatter = false;
              if (isMobile) {
                f.fadeOut = true;
                f.fadeAlpha = 1;
              } else {
                f.gathering = true;
              }
              f.st = 0;
            }
          } else if (f.fadeOut) {
            f.fadeAlpha -= FADE_STEP;
            f.y -= 0.35;
            f.x += Math.sin(frame * 0.05 + f.phase) * 0.15;
            if (f.fadeAlpha <= 0) {
              f.fadeOut = false;
              f.fadeAlpha = 1;
              f.x = -300;
              f.y = -300;
            }
          } else if (f.gathering && isMobile) {
            /* Dự phòng: mobile không có logic "tụ lại" — nếu lỡ rơi vào đây
               thì chuyển thẳng sang fadeOut để hạt biến mất thay vì đứng yên. */
            f.gathering = false;
            f.fadeOut = true;
            f.fadeAlpha = 1;
          } else if (f.gathering && !isMobile) {
            f.st = Math.min(f.st + 0.022, 1);
            const driftX = Math.sin(f.wx) * f.driftAmp;
            const driftY = Math.cos(f.wy) * f.driftAmp;
            const targetX = mx + f.ox + driftX;
            const targetY = my + f.oy + driftY;
            const ease = easeInOutSine(f.st);
            f.x += (targetX - f.x) * (0.04 + ease * 0.05);
            f.y += (targetY - f.y) * (0.04 + ease * 0.05);
            if (f.st >= 1) f.gathering = false;
          } else if (!isMobile) {
            f.wx += f.wsx;
            f.wy += f.wsy;
            const driftX = Math.sin(f.wx) * f.driftAmp;
            const driftY = Math.cos(f.wy) * f.driftAmp;
            const targetX = mx + f.ox + driftX;
            const targetY = my + f.oy + driftY;
            f.vx += (targetX - f.x) * 0.048;
            f.vy += (targetY - f.y) * 0.048;
            f.vx *= 0.78;
            f.vy *= 0.78;
            f.x += f.vx;
            f.y += f.vy;
          }

          const blink =
            0.38 + 0.62 * Math.abs(Math.sin(frame * 0.042 + f.phase));
          const sz = f.size * (pressing ? 1.35 : 1);
          const fadeMul = f.fadeOut ? Math.max(f.fadeAlpha, 0) : 1;
          glowDot(f.x, f.y, sz, "#4ac83f", 14, blink * 0.88 * fadeMul);
          glowDot(f.x, f.y, sz * 0.4, "#9affaa", 6, blink * 0.5 * fadeMul);
        });
      } else if (mode === "kid") {
        kidStars.forEach((s) => {
          if (s.scatter) {
            s.st = Math.min(s.st + 0.042, 1);
            const e = easeOutCubic(s.st);
            const originX = isMobile ? s.x : mx;
            const originY = isMobile ? s.y : my;
            s.x = originX + (s.sx - originX) * e;
            s.y = originY + (s.sy - originY) * e;
            if (s.st >= 1) {
              s.scatter = false;
              if (isMobile) {
                s.fadeOut = true;
                s.fadeAlpha = 1;
              } else {
                s.gathering = true;
              }
              s.st = 0;
            }
          } else if (s.fadeOut) {
            s.fadeAlpha -= FADE_STEP;
            s.y -= 0.4;
            s.x += Math.sin(frame * 0.05 + s.phase) * 0.2;
            if (s.fadeAlpha <= 0) {
              s.fadeOut = false;
              s.fadeAlpha = 1;
              s.x = -300;
              s.y = -300;
            }
          } else if (s.gathering && isMobile) {
            /* Dự phòng: mobile không có logic "tụ lại" — nếu lỡ rơi vào đây
               thì chuyển thẳng sang fadeOut để hạt biến mất thay vì đứng yên. */
            s.gathering = false;
            s.fadeOut = true;
            s.fadeAlpha = 1;
          } else if (s.gathering && !isMobile) {
            s.st = Math.min(s.st + 0.022, 1);
            const driftX = Math.sin(s.wx) * s.driftAmp;
            const driftY = Math.cos(s.wy) * s.driftAmp;
            const targetX = mx + s.ox + driftX;
            const targetY = my + s.oy + driftY;
            const ease = easeInOutSine(s.st);
            s.x += (targetX - s.x) * (0.04 + ease * 0.05);
            s.y += (targetY - s.y) * (0.04 + ease * 0.05);
            if (s.st >= 1) s.gathering = false;
          } else if (!isMobile) {
            s.wx += s.wsx;
            s.wy += s.wsy;
            const driftX = Math.sin(s.wx) * s.driftAmp;
            const driftY = Math.cos(s.wy) * s.driftAmp;
            const targetX = mx + s.ox + driftX;
            const targetY = my + s.oy + driftY;
            s.vx += (targetX - s.x) * 0.048;
            s.vy += (targetY - s.y) * 0.048;
            s.vx *= 0.78;
            s.vy *= 0.78;
            s.x += s.vx;
            s.y += s.vy;
          }

          s.angle += s.spin;
          s.hue = (s.hue + 0.6) % 360; // đổi màu cầu vồng dần theo thời gian

          const blink =
            0.45 + 0.55 * Math.abs(Math.sin(frame * 0.05 + s.phase));
          const sz = s.size * (pressing ? 1.4 : 1);
          const fadeMul = s.fadeOut ? Math.max(s.fadeAlpha, 0) : 1;
          const color = `hsl(${s.hue}, 92%, 66%)`;

          ctx.save();
          ctx.globalAlpha = blink * fadeMul;
          ctx.shadowBlur = 12;
          ctx.shadowColor = color;
          drawStar(ctx, s.x, s.y, sz, s.angle, 1, color);
          ctx.restore();
        });
      }

      /* 5. Hạt hiệu ứng khi bấm/chạm — hoạt động ở mọi chế độ (đổi màu theo mode) */
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        if (b.delay > 0) {
          b.delay -= 0.018;
          continue;
        }

        if (b.ripple) {
          b.r += 3.4;
          b.life -= 0.042;
          if (b.life <= 0) {
            bursts.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = b.life * 0.65;
          if (b.rainbow) {
            const hue = (frame * 2 + b.r * 3) % 360;
            ctx.strokeStyle = `hsla(${hue}, 92%, 65%, 0.95)`;
            ctx.shadowColor = `hsla(${hue}, 92%, 65%, 0.6)`;
          } else if (b.dark) {
            ctx.strokeStyle = "rgba(16,110,42,0.9)";
            ctx.shadowColor = "rgba(16,110,42,0.4)";
          } else {
            ctx.strokeStyle = "rgba(80,220,74,0.9)";
            ctx.shadowColor = "rgba(74,210,80,0.5)";
          }
          ctx.lineWidth = 1.3;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          b.x += b.vx;
          b.y += b.vy;
          b.vx *= 0.91;
          b.vy *= 0.91;
          b.life -= 0.028;
          if (b.life <= 0) {
            bursts.splice(i, 1);
            continue;
          }
          if (b.star) {
            ctx.save();
            ctx.globalAlpha = b.life * 0.9;
            ctx.shadowBlur = 16;
            ctx.shadowColor = `hsl(${b.hue}, 90%, 65%)`;
            drawStar(
              ctx,
              b.x,
              b.y,
              b.size * b.life * 1.4,
              frame * 0.05,
              1,
              `hsl(${b.hue}, 90%, 65%)`,
            );
            ctx.restore();
          } else {
            glowDot(
              b.x,
              b.y,
              b.size * b.life,
              `hsl(${b.hue}, 85%, 62%)`,
              16,
              b.life * 0.88,
            );
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      if (!isMobile) {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mousedown", onDown);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("click", onClick);
        document.body.style.cursor = "";
      } else {
        document.removeEventListener("touchstart", onTouchStart);
        document.removeEventListener("touchend", onTouchEnd);
      }
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
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 999999,
      }}
    />
  );
}
