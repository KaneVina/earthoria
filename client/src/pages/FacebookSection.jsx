import { useState, useEffect, useRef, useCallback } from "react";

/* ─── CONFIG ─── */
const FB_PAGE_ID = import.meta.env.VITE_FB_PAGE_ID  || "1173249219198136";
const FB_TOKEN   = import.meta.env.VITE_FB_TOKEN    || "EAAdmI3uGZATEBR8YoZBizZCTEqFFHvFXV01xZA6B0WTh5ur3oYNByOuo5pjWe7iERYYEIv6TGzVSSwCmpZCrO5iQDyPNcUxN7C4a4QfnmOdoZCazZC44raFYCwNdf7qaDHIBdrep3XT6UgmeftUnZACCKahklaavZAoMrSg7ZAitB33zkZBxCRYnfIdd425o3Mbgo14VvzOZChxJlqRmIKtagCFee81O";
const CARD_WIDTH = 276; // px — bao gồm gap
const GAP        = 16;
const AUTO_MS    = 3200;

/* ─── TOKENS ─── */
const T = {
  forest:      "#0d3330",
  forestMid:   "#1a5c52",
  forestLight: "#256b5e",
  gold:        "#4a9e3f",
  goldPale:    "rgba(74,158,63,0.08)",
  border:      "rgba(10,46,40,0.10)",
  borderGold:  "rgba(74,158,63,0.25)",
  textBody:    "#283228",
  textMuted:   "#506358",
  ivory:       "#faf7f1",
  cream:       "#f3f0e8",
  white:       "#ffffff",
  fb:          "#1877F2",
};

const GRADIENTS = [
  "linear-gradient(135deg,#0d3330 0%,#256b5e 60%,#4a9e3f 100%)",
  "linear-gradient(135deg,#0a2e28 0%,#1a5c52 70%,#50ad44 100%)",
  "linear-gradient(135deg,#04342c 0%,#1d9e75 60%,#4a9e3f 100%)",
  "linear-gradient(135deg,#0f1510 0%,#0d3330 55%,#1a5c52 100%)",
  "linear-gradient(135deg,#082014 0%,#205c42 65%,#3d9132 100%)",
  "linear-gradient(135deg,#0a2e1a 0%,#1a5c38 60%,#4a9e3f 100%)",
];

/* ─── MOCK DATA (fallback khi API lỗi) ─── */
const MOCK_POSTS = [
  { id:"1", message:"🌿 Đất là mẹ của vạn vật. Mỗi sản phẩm Earthoria là một lời tri ân thiên nhiên — được tạo ra từ những vùng đất nguyên sinh, chắt lọc từ bàn tay thủ công của các nghệ nhân địa phương.", permalink_url:"https://www.facebook.com/Earthoriavn", full_picture:null, created_time:"2025-06-20T08:00:00Z" },
  { id:"2", message:"Khám phá bộ sưu tập mới nhất — lấy cảm hứng từ rừng nhiệt đới và hệ sinh thái đa dạng của Việt Nam. Mỗi sản phẩm kể câu chuyện về sự bền vững và vẻ đẹp tự nhiên 🍃", permalink_url:"https://www.facebook.com/Earthoriavn", full_picture:null, created_time:"2025-06-18T10:30:00Z" },
  { id:"3", message:"Chúng tôi tin rằng sự xa xỉ thực sự không đến từ vật chất, mà từ kết nối sâu sắc với thiên nhiên. Earthoria — nơi đất trời gặp gỡ tinh hoa ✨", permalink_url:"https://www.facebook.com/Earthoriavn", full_picture:null, created_time:"2025-06-15T14:00:00Z" },
  { id:"4", message:"Cảm ơn cộng đồng Earthoria đã đồng hành! Mỗi lựa chọn của bạn là một bước tiến cho một hành tinh tốt đẹp hơn 🌍", permalink_url:"https://www.facebook.com/Earthoriavn", full_picture:null, created_time:"2025-06-12T09:15:00Z" },
  { id:"5", message:"Hành trình xanh bắt đầu từ những điều nhỏ nhất. Chúng tôi cam kết mang đến những sản phẩm không chỉ đẹp mà còn có trách nhiệm với môi trường 🌱", permalink_url:"https://www.facebook.com/Earthoriavn", full_picture:null, created_time:"2025-06-10T07:00:00Z" },
  { id:"6", message:"Thiên nhiên là người thầy vĩ đại nhất. Mỗi ngày chúng tôi học từ đất, từ cây, từ con người — để tạo ra những giá trị trường tồn cùng thời gian.", permalink_url:"https://www.facebook.com/Earthoriavn", full_picture:null, created_time:"2025-06-08T11:00:00Z" },
];

/* ─── HELPERS ─── */
function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric", month: "long", year: "numeric",
  });
}
function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function trimMsg(str, n = 130) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "…" : str;
}

/* ─── ICONS ─── */
const FbIcon = ({ size = 15, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);
const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const CommentIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);
const ShareIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

/* ─── SKELETON ─── */
function SkeletonCard() {
  return (
    <div style={{
      flex: `0 0 ${CARD_WIDTH - GAP}px`,
      background: T.white,
      border: `.5px solid ${T.border}`,
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{ height: 150, background: "#ebebeb", animation: "fbSkel 1.4s ease-in-out infinite" }} />
      <div style={{ padding: "14px 16px" }}>
        {[55, 90, 70].map((w, i) => (
          <div key={i} style={{
            height: 8, borderRadius: 4,
            background: "#ebebeb",
            width: `${w}%`,
            marginBottom: 7,
            animation: "fbSkel 1.4s ease-in-out infinite",
          }} />
        ))}
      </div>
    </div>
  );
}

/* ─── CARD ─── */
function FbCard({ post, index }) {
  const reactions = (post.id.charCodeAt(0) * 7) % 200 + 18;
  const comments  = (post.id.charCodeAt(1) * 3) % 52 + 3;
  const date      = fmtDate(post.created_time);
  const href      = post.permalink_url || `https://www.facebook.com/${FB_PAGE_ID}`;
  const msg       = trimMsg(post.message);
  const gradient  = GRADIENTS[index % GRADIENTS.length];

  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: `0 0 ${CARD_WIDTH - GAP}px`,
        background: T.white,
        border: `.5px solid ${hovered ? "rgba(10,46,40,0.22)" : T.border}`,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hovered ? "0 14px 36px rgba(13,43,30,0.11)" : "none",
        transition: "transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s, border-color .3s",
        cursor: "pointer",
      }}
    >
      {/* ── IMAGE ── */}
      <div style={{ position: "relative", height: 150, overflow: "hidden", flexShrink: 0 }}>
        {post.full_picture ? (
          <img
            src={post.full_picture}
            alt=""
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              filter: hovered ? "saturate(1)" : "saturate(.82)",
              transform: hovered ? "scale(1.06)" : "scale(1)",
              transition: "transform .6s cubic-bezier(.16,1,.3,1), filter .4s",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FbIcon size={20} color="rgba(255,255,255,.55)" />
            </div>
          </div>
        )}
        {/* overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,30,20,.5) 0%, transparent 55%)", pointerEvents: "none" }} />
        {/* date tag */}
        {date && (
          <span style={{
            position: "absolute", bottom: 9, left: 11,
            background: "rgba(10,30,20,.72)",
            border: ".5px solid rgba(255,255,255,.13)",
            padding: "3px 9px",
            fontSize: 10, letterSpacing: ".07em",
            color: "rgba(255,255,255,.82)", fontWeight: 300,
            borderRadius: 2,
          }}>
            {date}
          </span>
        )}
      </div>

      {/* ── BODY ── */}
      <div style={{ padding: "14px 16px 13px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, background: T.fb, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FbIcon size={15} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: T.textBody, lineHeight: 1.1 }}>Earthoria</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{date || "Vừa đăng"}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <FbIcon size={13} color={T.fb} />
          </div>
        </div>

        {/* text */}
        <p style={{
          fontSize: 12, lineHeight: 1.72, color: T.textMuted, fontWeight: 300,
          flex: 1, marginBottom: 12,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {msg || <em style={{ color: T.textMuted }}>Bài viết không có nội dung.</em>}
        </p>

        {/* divider */}
        <div style={{ height: ".5px", background: T.border, marginBottom: 10 }} />

        {/* actions */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* reactions */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {["#1877F2","#E0325C","#F7B928"].map((bg, ri) => (
              <div key={ri} style={{
                width: 17, height: 17, borderRadius: "50%",
                background: bg, border: "1.5px solid " + T.white,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, marginLeft: ri === 0 ? 0 : -4,
              }}>
                {["👍","❤️","😮"][ri]}
              </div>
            ))}
            <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 6, fontWeight: 300 }}>{reactions}</span>
          </div>
          {/* right */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: T.textMuted }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><CommentIcon />{comments}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><ShareIcon /></span>
          </div>
        </div>
      </div>
    </a>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function FacebookSection() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const trackRef  = useRef(null);
  const timerRef  = useRef(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);
  const hovered   = useRef(false);

  /* ── fetch ── */
  useEffect(() => {
    const CACHE_KEY = "ef_fb_v1";
    const CACHE_TTL = 1000 * 60 * 30;
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL && data?.length) {
          setPosts(data); setLoading(false); return;
        }
      }
    } catch (_) {}
    const url =
      `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/posts` +
      `?fields=id,message,created_time,full_picture,permalink_url&limit=6&access_token=${FB_TOKEN}`;
    fetch(url)
      .then(r => r.json())
      .then(json => {
        const data = json.data?.length ? json.data : MOCK_POSTS;
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
        setPosts(data);
      })
      .catch(() => setPosts(MOCK_POSTS))
      .finally(() => setLoading(false));
  }, []);

  /* ── inject keyframe ── */
  useEffect(() => {
    const id = "fb-carousel-kf";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = `@keyframes fbSkel{0%,100%{opacity:1}50%{opacity:.4}}`;
      document.head.appendChild(s);
    }
    return () => document.getElementById("fb-carousel-kf")?.remove();
  }, []);

  const total = posts.length;

  const goTo = useCallback((idx, animated = true) => {
    if (!trackRef.current || total === 0) return;
    const safeIdx = ((idx % total) + total) % total;
    setCurrent(safeIdx);
    trackRef.current.style.transition = animated
      ? "transform .55s cubic-bezier(.25,.8,.25,1)"
      : "none";
    trackRef.current.style.transform = `translateX(${-safeIdx * CARD_WIDTH}px)`;
  }, [total]);

  const next = useCallback(() => {
    setCurrent(prev => {
      const nextIdx = (prev + 1) % total;
      if (trackRef.current) {
        trackRef.current.style.transition = "transform .55s cubic-bezier(.25,.8,.25,1)";
        trackRef.current.style.transform  = `translateX(${-nextIdx * CARD_WIDTH}px)`;
      }
      return nextIdx;
    });
  }, [total]);

  /* ── auto play ── */
  const startAuto = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!hovered.current) next();
    }, AUTO_MS);
  }, [next]);

  const stopAuto = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (total > 0 && !loading) { goTo(0, false); startAuto(); }
    return stopAuto;
  }, [total, loading, goTo, startAuto, stopAuto]);

  /* ── drag (mouse) ── */
  const onMouseDown = (e) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartOffset.current = current * CARD_WIDTH;
    if (trackRef.current) trackRef.current.style.transition = "none";
    stopAuto();
  };
  const onMouseMove = (e) => {
    if (!isDragging.current || !trackRef.current) return;
    const dx = dragStartX.current - e.clientX;
    trackRef.current.style.transform = `translateX(${-(dragStartOffset.current + dx)}px)`;
  };
  const onMouseUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dx = dragStartX.current - e.clientX;
    if (Math.abs(dx) > 60) {
      dx > 0 ? next() : goTo(Math.max(0, current - 1));
    } else {
      goTo(current);
    }
    startAuto();
  };

  /* ── drag (touch) ── */
  const touchStartX = useRef(0);
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; stopAuto(); };
  const onTouchEnd   = (e) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) dx > 0 ? next() : goTo(Math.max(0, current - 1));
    startAuto();
  };

  /* ── layout ── */
  const displayedPosts = loading ? [] : [...posts, ...posts];

  return (
    <section style={{ background: T.ivory, padding: "72px 80px", borderTop: `.5px solid ${T.border}`, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ display: "block", width: 22, height: 1, background: T.gold }} />
              <span style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: T.gold, fontWeight: 500 }}>
                Mạng xã hội
              </span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px,2.2vw,32px)", fontWeight: 300, color: T.forest, letterSpacing: "-.01em", margin: 0 }}>
              Earthoria trên{" "}
              <em style={{ fontStyle: "italic", color: T.fb }}>nền tảng Facebook</em>
            </h2>
          </div>
          <a
            href="https://www.facebook.com/Earthoriavn"
            target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: T.fb, textDecoration: "none", border: ".5px solid rgba(24,119,242,.35)", padding: "7px 14px", transition: "background .25s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(24,119,242,.07)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <FbIcon size={13} color={T.fb} /> Theo dõi
          </a>
        </div>

        {/* Track container */}
        <div
          style={{ overflow: "hidden", position: "relative", margin: "0 -2px" }}
          onMouseEnter={() => { hovered.current = true; }}
          onMouseLeave={() => { hovered.current = false; }}
        >
          {/* fade edges */}
          {["left","right"].map(side => (
            <div key={side} style={{
              position: "absolute", top: 0, bottom: 0,
              [side]: 0, width: 48, zIndex: 10, pointerEvents: "none",
              background: `linear-gradient(to ${side === "left" ? "right" : "left"}, ${T.ivory}, transparent)`,
            }} />
          ))}

          {/* scrollable track */}
          <div
            ref={trackRef}
            style={{ display: "flex", gap: GAP, padding: "6px 2px 12px", cursor: "grab", userSelect: "none", willChange: "transform" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : displayedPosts.map((p, i) => <FbCard key={`${p.id}-${i}`} post={p} index={i % posts.length} />)
            }
          </div>
        </div>

        {/* Dots */}
        {!loading && total > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 18 }}>
            {posts.map((_, i) => (
              <div
                key={i}
                onClick={() => { goTo(i); stopAuto(); setTimeout(startAuto, 4000); }}
                style={{
                  width: 5, height: 5, borderRadius: "50%", cursor: "pointer",
                  background: i === current % total ? T.gold : "rgba(10,46,40,0.18)",
                  transform: i === current % total ? "scale(1.5)" : "scale(1)",
                  transition: "background .3s, transform .3s",
                }}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <a
            href="https://www.facebook.com/Earthoriavn"
            target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "#fff", background: T.fb, textDecoration: "none", padding: "11px 26px", transition: "opacity .3s", borderRadius: 2 }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <FbIcon size={13} /> Xem thêm trên Facebook <ArrowIcon />
          </a>
        </div>

      </div>
    </section>
  );
}