import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { bookService } from "../services/bookService";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useWishlistStore } from "../store/wishlistStore";
import {
  formatPrice,
  getBookUrl,
  getPreferredCartFormat,
} from "../utils/helpers";
import { flyToCart } from "../utils/flyToCart";
import { useHeartBurst, WishlistParticles } from "../hooks/useWishlistBurst";
import { flyHeartToWishlist } from "../components/FlyingWishlistHeart";
import toast from "react-hot-toast";
import {
  Truck,
  Gift,
  BookOpen,
  Star,
  ShieldCheck,
  Users,
  RotateCcw,
} from "lucide-react";
import StickyScrollTransition from "./StickyScrollTransition";
import HeroBanner from "../components/HeroBanner";
import EcosystemStrip from "../components/EcosystemStrip";
import { lazy, Suspense } from "react";
import { SkeletonProductGrid } from "../components/skeletons/SkeletonShop";
const SproutModel = lazy(() => import("../components/SproutModel"));

/*COUNTDOWN PRICE */
function CountdownPrice({ from, to, duration = 1200 }) {
  const [display, setDisplay] = useState(from);
  const rafRef = useRef(null);
  const wrapRef = useRef(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayedRef.current) {
          hasPlayedRef.current = true;

          if (from === to) {
            setDisplay(to);
            observer.disconnect();
            return;
          }

          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(from - (from - to) * eased);
            setDisplay(current);
            if (progress < 1) {
              rafRef.current = requestAnimationFrame(tick);
            }
          };
          rafRef.current = requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [from, to, duration]);

  return <span ref={wrapRef}>{formatPrice(display)}</span>;
}

/* PRODUCT CARD COMPONENT */
function CartIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function StarRating({ rating, count }) {
  return (
    <div className="product-rating">
      <div className="product-rating-stars">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="star"
            style={i > rating ? { color: "var(--border)" } : {}}
          >
            ★
          </span>
        ))}
      </div>
      <span className="product-rating-count">({count})</span>
    </div>
  );
}

function AddToCartBtn({ onAdd, disabled }) {
  const [added, setAdded] = useState(false);
  const btnRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    setAdded(true);
    onAdd && onAdd(e);
    setTimeout(() => setAdded(false), 1400);
  };

  const handleMouseEnter = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + window.scrollY + 8,
        left: r.left + window.scrollX + r.width / 2,
      });
    }
    setHovered(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        className="add-cart"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        disabled={disabled}
        style={{
          ...(added
            ? { background: "var(--forest)", color: "var(--ivory)" }
            : {}),
          ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
        }}
      >
        {added ? <CheckIcon /> : <CartIcon />}
      </button>
      {hovered &&
        !added &&
        createPortal(
          <span
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              transform: "translateX(-50%)",
              background: "var(--forest, #0d2b1e)",
              color: "var(--ivory, #faf8f3)",
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: "11px",
              fontWeight: 300,
              letterSpacing: "0.06em",
              padding: "6px 12px",
              border: "0.5px solid rgba(180,150,80,0.3)",
              pointerEvents: "none",
              zIndex: 99999,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                border: "5px solid transparent",
                borderBottomColor: "var(--forest, #0d2b1e)",
              }}
            />
            Thêm vào giỏ hàng
          </span>,
          document.body,
        )}
    </>
  );
}

function WishlistBtn({ wishlisted, onToggle, disabled }) {
  const btnRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const { bursting, particles, trigger } = useHeartBurst();

  const handleMouseEnter = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + window.scrollY + 8,
        left: r.left + window.scrollX + r.width / 2,
      });
    }
    setHovered(true);
  };

  const handleClick = (e) => {
    const proceeded = onToggle(e);
    if (!proceeded) return;
    trigger(!wishlisted);
    if (!wishlisted && btnRef.current) {
      flyHeartToWishlist(btnRef.current);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        className={`card-wishlist${wishlisted ? " active" : ""}${bursting ? " wl-bursting" : ""}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        disabled={disabled}
        style={{ opacity: 1, transform: "translateY(0)", position: "relative" }}
        aria-label="Yêu thích"
      >
        <HeartIcon filled={wishlisted} />
        <WishlistParticles particles={particles} />
      </button>
      {hovered &&
        createPortal(
          <span
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              transform: "translateX(-50%)",
              background: "var(--forest, #0d2b1e)",
              color: "var(--ivory, #faf8f3)",
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: "11px",
              fontWeight: 300,
              letterSpacing: "0.06em",
              padding: "6px 12px",
              border: "0.5px solid rgba(180,150,80,0.3)",
              pointerEvents: "none",
              zIndex: 99999,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                border: "5px solid transparent",
                borderBottomColor: "var(--forest, #0d2b1e)",
              }}
            />
            {wishlisted ? "Bỏ yêu thích" : "Thêm yêu thích"}
          </span>,
          document.body,
        )}
    </>
  );
}

function BookCard({
  book,
  onAddCart,
  badge,
  badgeType = "forest",
  isAdding,
  delay,
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { isInWishlist, toggleWishlist, isToggling } = useWishlistStore();
  const wishlisted = isInWishlist(book.hashId);
  const wishlistBusy = isToggling(book.hashId);
  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để lưu yêu thích");
      return false;
    }
    if (!book.slug || !book.hashId) return false;
    toggleWishlist(book.slug, book.hashId).then((ok) => {
      if (!ok) toast.error("Có lỗi xảy ra, vui lòng thử lại");
    });
    return true;
  };

  const desc =
    book.desc || (book.description ? book.description.slice(0, 100) + "…" : "");
  const DEMO_TAGS = [
    "Khám phá",
    "Thiên nhiên",
    "AR 3D",
    "Động vật",
    "Giáo dục",
  ];
  const tags =
    book.tags || DEMO_TAGS.slice(0, Math.floor(Math.random() * 3) + 2);
  const ageLabel = book.ageRange || "4- 10 tuổi";
  const langLabel = book.language || "Tiếng Việt";

  const handleCardClick = () => {
    if (!book.slug || !book.hashId) return;
    navigate(getBookUrl(book.slug, book.hashId));
  };

  return (
    <div
      className={`product-card reveal${delay ? ` reveal-delay-${delay}` : ""}`}
      onClick={handleCardClick}
      style={{
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div className="product-img-wrap">
        <img
          src={
            book.img ||
            book.coverImage ||
            "https://placehold.co/400x320/0d3330/faf8f3?text=Earthoria"
          }
          alt={book.title}
        />
        <div className="product-img-overlay">
          <button
            className="overlay-btn primary"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            Xem chi tiết
          </button>
          <button className="overlay-btn" onClick={(e) => e.stopPropagation()}>
            Demo AR
          </button>
        </div>
        {badge && (
          <span
            className={`product-badge${badgeType === "gold" ? " gold" : ""}`}
          >
            {badge}
          </span>
        )}
        {book.category && (
          <span className="product-category">
            {book.category?.name || book.category}
          </span>
        )}
        {/* Wishlist + tooltip portal */}
        <div
          className="card-wishlist-wrap"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <WishlistBtn
            wishlisted={wishlisted}
            onToggle={handleWishlist}
            disabled={wishlistBusy}
          />
        </div>
      </div>

      {/* Body — flex grow để đẩy footer xuống đáy */}
      <div
        className="product-body"
        style={{ display: "flex", flexDirection: "column", flex: 1 }}
      >
        {/* Rating */}
        <StarRating rating={book.rating} count={book.reviewCount} />

        {/* Title — fixed height 2 lines */}
        <div
          className="product-title"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.4em",
            lineHeight: "1.2em",
            flex: "0 0 auto",
          }}
        >
          {book.title}
        </div>

        {/* Desc — cố định 2 dòng */}
        <p
          className="product-desc"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "calc(1.7em * 2)",
            flex: "0 0 auto",
          }}
        >
          {desc}
        </p>

        {/* Age + Language */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
            flexWrap: "wrap",
            flex: "0 0 auto",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              color: "var(--text-muted)",
              fontWeight: 300,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {ageLabel}
          </span>
          <span
            style={{
              width: "1px",
              height: "12px",
              background: "var(--border)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              color: "var(--text-muted)",
              fontWeight: 300,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {langLabel}
          </span>
        </div>

        {/* Tags — max 2 hàng, overflow dấu ... */}
        <div
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: "12px",
            lineHeight: "26px",
            minHeight: "52px",
            flex: "0 0 auto",
          }}
        >
          {tags.map((tag, idx) => (
            <span
              key={idx}
              style={{
                display: "inline-block",
                fontSize: "9px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "4px 10px",
                marginRight: "5px",
                marginBottom: "5px",
                border: "0.5px solid var(--border-gold)",
                color: "var(--gold)",
                background: "transparent",
                whiteSpace: "nowrap",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Spacer đẩy footer xuống */}
        <div style={{ flex: 1 }} />

        {/* Footer — giá + giỏ hàng */}
        <div className="product-footer" style={{ alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {book.price && book.salePrice && book.price > book.salePrice ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    textDecoration: "line-through",
                    lineHeight: 1,
                  }}
                >
                  {formatPrice(book.price)}
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    color: "#c05050",
                    background: "rgba(192,80,80,0.08)",
                    padding: "2px 6px",
                  }}
                >
                  -{Math.round((1 - book.salePrice / book.price) * 100)}%
                </span>
              </div>
            ) : (
              <div style={{ height: "16px" }} />
            )}
            <span className="product-price">
              {book.price && book.salePrice && book.price > book.salePrice ? (
                <CountdownPrice from={book.price} to={book.salePrice} />
              ) : (
                formatPrice(book.salePrice || book.price)
              )}
            </span>
          </div>

          {/* Cart button + tooltip */}
          <div
            className="card-action-wrap"
            style={{ position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <AddToCartBtn
              onAdd={(e) => {
                const cardImg = e.currentTarget
                  .closest(".product-card")
                  ?.querySelector(".product-img-wrap img");
                if (cardImg) flyToCart(cardImg);
                onAddCart &&
                  onAddCart(book.hashId, getPreferredCartFormat(book));
              }}
              disabled={isAdding}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/*HORIZONTAL SCROLL BOOK ROW */
function BookScrollRow({
  books,
  onAddCart,
  badgeLabel,
  badgeType,
  addingIds,
  fadeColor,
}) {
  const rowRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const rafIdRef = useRef(null);
  const autoplayTimerRef = useRef(null);
  const isPausedRef = useRef(false);

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  const checkScroll = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const onScroll = () => {
      if (rafIdRef.current) return;
      rafIdRef.current = requestAnimationFrame(() => {
        checkScroll();
        rafIdRef.current = null;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    checkScroll();
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [books, checkScroll]);

  // Auto-đẩy mỗi 5s, tự dừng khi người dùng hover hoặc đang kéo tay
  useEffect(() => {
    if (!books || books.length === 0) return;

    autoplayTimerRef.current = setInterval(() => {
      const el = rowRef.current;
      if (!el || isPausedRef.current) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 340, behavior: "smooth" });
      }
    }, 5000);

    return () => clearInterval(autoplayTimerRef.current);
  }, [books]);

  return (
    <div
      style={{
        position: "relative",
        "--scroll-fade-bg": fadeColor || "var(--cream)",
      }}
      onMouseEnter={() => (isPausedRef.current = true)}
      onMouseLeave={() => (isPausedRef.current = false)}
    >
      {/* Fade edges */}
      {canLeft && <div className="book-scroll-fade book-scroll-fade-left" />}
      {canRight && <div className="book-scroll-fade book-scroll-fade-right" />}

      {/* Arrow buttons */}
      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          className="book-scroll-arrow book-scroll-arrow-left"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {canRight && (
        <button
          onClick={() => scroll(1)}
          className="book-scroll-arrow book-scroll-arrow-right"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Scroll container */}
      <div
        ref={rowRef}
        style={{
          display: "flex",
          gap: "24px",
          overflowX: "auto",
          paddingBottom: "12px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          cursor: "grab",
          touchAction: "pan-y",
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") return;

          const el = rowRef.current;
          if (!el) return;
          isPausedRef.current = true;
          const startX = e.clientX;
          const startY = e.clientY;
          const startScrollLeft = el.scrollLeft;
          const pointerId = e.pointerId;
          let decided = false;
          let isHorizontalDrag = false;
          let pendingDx = 0;
          let dragRafId = null;

          const applyScroll = () => {
            el.scrollLeft = startScrollLeft - pendingDx;
            dragRafId = null;
          };

          const onMove = (ev) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;

            if (!decided) {
              if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
              decided = true;
              isHorizontalDrag = Math.abs(dx) > Math.abs(dy) * 1.3;
              if (isHorizontalDrag) {
                el.style.cursor = "grabbing";
                el.setPointerCapture?.(pointerId);
              }
            }

            if (isHorizontalDrag) {
              ev.preventDefault();
              pendingDx = dx;
              if (!dragRafId) dragRafId = requestAnimationFrame(applyScroll);
            }
          };

          const onUp = () => {
            el.style.cursor = "grab";
            el.releasePointerCapture?.(pointerId);
            if (dragRafId) cancelAnimationFrame(dragRafId);
            isPausedRef.current = false;
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
          };

          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
          window.addEventListener("pointercancel", onUp);
        }}
      >
        {books.map((book) => (
          <div key={book.id} style={{ flex: "0 0 280px", minWidth: 0 }}>
            <BookCard
              book={book}
              onAddCart={onAddCart}
              badge={badgeLabel}
              badgeType={badgeType}
              isAdding={addingIds?.has(book.hashId)}
            />
          </div>
        ))}
      </div>
      <style>{`::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

/*NEWSLETTER SECTION */
function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <section
      className="newsletter-section"
      style={{
        background: "var(--parchment)",
        borderTop: "0.5px solid var(--border)",
        borderBottom: "0.5px solid var(--border)",
      }}
    >
      <div
        className="newsletter-grid"
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          gap: "80px",
          alignItems: "center",
        }}
      >
        <div className="reveal">
          <div
            className="section-eyebrow"
            style={{ justifyContent: "flex-start", marginBottom: "20px" }}
          >
            <div className="section-eyebrow-line" />
            <span className="section-eyebrow-text">Đặc Quyền Thành Viên</span>
          </div>
          <h2
            className="section-title"
            style={{ textAlign: "left", marginBottom: "16px" }}
          >
            Nhận <em>Ưu Đãi</em>
            <br />
            Độc Quyền
          </h2>
          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.8",
              color: "var(--text-muted)",
              fontWeight: 300,
              maxWidth: "380px",
            }}
          >
            Đăng ký nhận thông báo về sách mới, tài liệu học tập miễn phí và ưu
            đãi đặc biệt dành riêng cho thành viên Earthoria.
          </p>
          <div style={{ display: "flex", gap: "24px", marginTop: "32px" }}>
            {[
              [<Truck size={18} />, "Miễn phí vận chuyển"],
              [<Gift size={18} />, "Quà tặng hàng tháng"],
              [<BookOpen size={18} />, "Tài liệu độc quyền"],
            ].map(([icon, label]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                {icon} {label}
              </div>
            ))}
          </div>
        </div>
        <div className="reveal reveal-delay-1">
          {sent ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                background: "var(--white)",
                border: "0.5px solid var(--border-gold)",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌿</div>
              <div
                style={{
                  fontFamily: "Playfair Display,serif",
                  fontSize: "24px",
                  color: "var(--forest)",
                  marginBottom: "8px",
                }}
              >
                Cảm ơn bạn!
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Chào mừng bạn đến với gia đình Earthoria.
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "var(--white)",
                border: "0.5px solid var(--border)",
                padding: "40px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: "20px",
                }}
              >
                Nhận ngay ưu đãi 15% cho đơn đầu tiên
              </div>
              <div style={{ display: "flex", gap: "0" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Địa chỉ email của bạn..."
                  style={{
                    flex: 1,
                    padding: "14px 18px",
                    border: "0.5px solid var(--border)",
                    background: "var(--ivory)",
                    fontFamily: "Be Vietnam Pro,sans-serif",
                    fontSize: "13px",
                    color: "var(--forest)",
                    outline: "none",
                    borderRight: "none",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && email && setSent(true)}
                />
                <button
                  onClick={() => email && setSent(true)}
                  style={{
                    background: "var(--forest)",
                    color: "var(--ivory)",
                    border: "none",
                    padding: "14px 24px",
                    cursor: "pointer",
                    fontFamily: "Be Vietnam Pro,sans-serif",
                    fontSize: "10px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    transition: "background 0.3s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "var(--forest-mid)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "var(--forest)")
                  }
                >
                  Đăng Ký
                </button>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginTop: "12px",
                  fontWeight: 300,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <ShieldCheck size={12} strokeWidth={2} />
                <span>
                  Chúng tôi cam kết bảo mật thông tin của bạn. Hủy bất cứ lúc
                  nào.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/*
   APP SHOWCASE (MOBILE AR PREVIEW)
*/
function AppShowcase() {
  return (
    <section className="tech-section">
      <div className="tech-left">
        <div className="tech-eyebrow">
          <div
            style={{
              width: "40px",
              height: "0.5px",
              background: "var(--gold)",
            }}
          />
          <span className="tech-eyebrow-text">Ứng Dụng Earthoria</span>
        </div>
        <h2 className="tech-title reveal">
          Công Nghệ <em>AR & AI</em>
          <br />
          Trong Tầm Tay
        </h2>
        <div className="tech-features">
          {[
            [
              "01",
              "Quét Mã Thông Minh",
              "Chỉ cần mở app, hướng camera vào trang sách — 3D sẽ xuất hiện tức thì.",
            ],
            [
              "02",
              "Trò Chuyện Với AI",
              "Đặt câu hỏi cho bất kỳ sinh vật nào và nhận câu trả lời bằng giọng nói tự nhiên.",
            ],
            [
              "03",
              "Học Theo Cách Của Bé",
              "AI ghi nhớ tiến trình học tập và điều chỉnh độ khó phù hợp với từng bé.",
            ],
          ].map(([num, title, desc]) => (
            <div className="tech-feat reveal" key={num}>
              <span className="tech-feat-num">{num}</span>
              <div className="tech-feat-body">
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="tech-cta">
          Tải Ứng Dụng Miễn Phí
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="tech-right">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqQsaKpsl853jkb7LVw_tM_N8sMdr2NavI4-ZchB0m3ruBxPqPN9Nn1PjntGV8mbHhTCbatFXPkgD9K2O337Rz8tyz54di0oxbMeLKFo9EKZpeTCdJSA9WaYDYPY48Qyuj4ia-Qyx2BSlkrdByVMyYwY45va3kPZc_VLc3XAV5cTeIrzFVJefKSJq-LlyJKf2Hkxp5_ggisUBAX7ScOO6BIoEeLX_PYCXzQsMXIHjj5TOJSHtXbyrwJHYS68H_vFC9uwDrV6Vbqik"
          alt=""
        />
        <div className="tech-right-overlay" />
        <div className="phone-mockup">
          <div className="phone-screen">
            <div className="phone-status">
              <span>9:41</span>
              <span>●●●</span>
            </div>
            <div className="phone-ar-label">AR ACTIVE</div>
            <div className="phone-scan-frame">
              <div className="corner tl" />
              <div className="corner tr" />
              <div className="corner bl" />
              <div className="corner br" />
              <div className="scan-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                </svg>
                <span>Đang nhận diện...</span>
              </div>
            </div>
            <div className="phone-info">
              <div className="phone-info-name">Đại Bàng Biển</div>
              <div className="phone-info-sub">
                Haliaeetus leucocephalus • Đang tải mô hình 3D
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
/* Đếm số mượt bằng easing, kích hoạt khi cuộn tới */
function CountUpMetric({
  target,
  decimals = 0,
  suffix = "",
  label,
  icon: Icon,
}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          const duration = 1400;
          const start = performance.now();
          const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setValue(target * eased);
            if (progress < 1) requestAnimationFrame(animate);
            else setValue(target);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started, target]);

  const display =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString("vi-VN");

  return (
    <div className="trust-metric-item" ref={ref}>
      <div className="trust-metric-bg" />
      <div className="trust-metric-icon-box">
        <Icon size={18} strokeWidth={1.4} />
      </div>
      <div className="trust-metric-number">
        <span>{display}</span>
        {suffix && <span className="trust-metric-suffix">{suffix}</span>}
      </div>
      <div className="trust-metric-label">{label}</div>
      <div className="trust-metric-accent" />
    </div>
  );
}
/*   TESTIMONIALS SECTION (enhanced)*/
const REVIEWS = [
  {
    name: "Nguyễn Thu Hà",
    role: "Mẹ của bé Minh, 7 tuổi",
    initial: "H",
    stars: 5,
    text: 'Con tôi mê cuốn "Rừng Nhiệt Đới" đến nỗi không chịu đi ngủ! Tính năng AR giúp bé học tên 20 loài động vật chỉ trong một tuần.',
  },
  {
    name: "Trần Văn Khoa",
    role: "Giáo viên tiểu học",
    initial: "K",
    stars: 5,
    text: "Tôi đã đưa bộ sách Earthoria vào giờ học tự nhiên. Học sinh tương tác, hỏi đáp và nhớ bài lâu hơn hẳn so với phương pháp truyền thống.",
  },
  {
    name: "Phạm Minh Châu",
    role: "Phụ huynh, Q.3 TP.HCM",
    initial: "C",
    stars: 5,
    text: "Chất lượng in ấn tuyệt vời, hình ảnh minh họa đẹp như tranh nghệ thuật. AI kể chuyện bằng giọng đọc cực kỳ tự nhiên, bé thích lắm!",
  },
];

/*   FLASH DEAL — TRI ÂM NGƯỜI DÙNG (countdown + single book)*/
function FlashDealSection({ books, onAddCart }) {
  const book = books[0];
  const [timeLeft, setTimeLeft] = useState({ h: 5, m: 59, s: 47 });
  const [claimed, setClaimed] = useState(false);
  const [stock] = useState(17);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) {
          s = 59;
          m--;
        }
        if (m < 0) {
          m = 59;
          h--;
        }
        if (h < 0) {
          h = 0;
          m = 0;
          s = 0;
          clearInterval(timer);
        }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!book) return null;
  const pad = (n) => String(n).padStart(2, "0");
  const discountedPrice = Math.round((book.salePrice || book.price) * 0.72);

  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, #0a0f0c 0%, #0d3330 40%, #1a5c52 80%, #0d3330 100%)",
        padding: "100px 100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* bg text */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          fontFamily: "Playfair Display,serif",
          fontSize: "clamp(60px,10vw,140px)",
          fontWeight: 300,
          color: "rgba(255,255,255,0.02)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          letterSpacing: "-0.02em",
        }}
      >
        FLASH DEAL
      </div>

      {/* radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(74,158,63,0.12) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* header */}
        <div
          className="reveal"
          style={{ textAlign: "center", marginBottom: "64px" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(74,158,63,0.12)",
              border: "0.5px solid rgba(74,158,63,0.35)",
              padding: "8px 24px",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--gold)",
                animation: "pulse 1.5s ease-in-out infinite",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "var(--gold)",
                fontFamily: "Be Vietnam Pro,sans-serif",
              }}
            >
              Tri Ân Người Dùng · Flash Deal
            </span>
          </div>
          <h2
            style={{
              fontFamily: "Playfair Display,serif",
              fontSize: "clamp(32px,4vw,56px)",
              fontWeight: 300,
              color: "var(--ivory)",
              lineHeight: 1.12,
              letterSpacing: "-0.01em",
            }}
          >
            Ưu Đãi Đặc Biệt —{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
              Có Giới Hạn
            </em>
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(250,248,243,0.5)",
              marginTop: "14px",
              fontWeight: 300,
            }}
          >
            Chỉ dành cho {stock} khách hàng đầu tiên trong hôm nay
          </p>
        </div>

        {/* main card */}
        <div
          className="reveal"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0",
            border: "0.5px solid rgba(74,158,63,0.25)",
            overflow: "hidden",
            boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
          }}
        >
          {/* left — book visual */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              minHeight: "460px",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <img
              src={
                book.coverImage ||
                "https://placehold.co/600x460/0d3330/faf8f3?text=Earthoria"
              }
              alt={book.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "saturate(0.7) brightness(0.6)",
                position: "absolute",
                inset: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to right, rgba(13,43,30,0.3) 0%, rgba(13,43,30,0.6) 100%)",
              }}
            />
            {/* discount badge */}
            <div
              style={{
                position: "absolute",
                top: "28px",
                left: "28px",
                background: "var(--gold)",
                color: "var(--ink)",
                fontFamily: "Playfair Display,serif",
                fontSize: "36px",
                fontWeight: 300,
                lineHeight: 1,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span>-28%</span>
              <span
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  fontFamily: "Be Vietnam Pro,sans-serif",
                  marginTop: "4px",
                }}
              >
                GIẢM GIÁ
              </span>
            </div>
            {/* stock bar */}
            <div
              style={{
                position: "absolute",
                bottom: "28px",
                left: "28px",
                right: "28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: "8px",
                  fontFamily: "Be Vietnam Pro,sans-serif",
                  textTransform: "uppercase",
                }}
              >
                <span>Còn lại</span>
                <span style={{ color: "var(--gold)" }}>{stock} cuốn</span>
              </div>
              <div
                style={{
                  height: "3px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "2px",
                }}
              >
                <div
                  style={{
                    width: `${(stock / 50) * 100}%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg, var(--gold), var(--gold-light))",
                    borderRadius: "2px",
                    transition: "width 1s ease",
                  }}
                />
              </div>
            </div>
          </div>

          {/* right — info */}
          <div
            style={{
              background: "rgba(13,43,30,0.7)",
              backdropFilter: "blur(12px)",
              padding: "52px 48px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "24px",
            }}
          >
            {/* eyebrow */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "28px",
                  height: "0.5px",
                  background: "var(--gold)",
                }}
              />
              <span
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  fontFamily: "Be Vietnam Pro,sans-serif",
                }}
              >
                {book.category?.name || "Khám Phá Thiên Nhiên"}
              </span>
            </div>

            {/* title */}
            <h3
              style={{
                fontFamily: "Playfair Display,serif",
                fontSize: "clamp(24px,2.5vw,36px)",
                fontWeight: 300,
                color: "var(--ivory)",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}
            >
              {book.title}
            </h3>

            {/* desc */}
            <p
              style={{
                fontSize: "13px",
                lineHeight: 1.8,
                color: "rgba(250,248,243,0.55)",
                fontWeight: 300,
                borderLeft: "2px solid rgba(74,158,63,0.4)",
                paddingLeft: "16px",
              }}
            >
              {book.description?.slice(0, 120) ||
                "Hành trình khám phá thiên nhiên qua lăng kính AR & AI — trải nghiệm hoàn toàn mới."}
              ...
            </p>

            {/* countdown */}
            <div>
              <div
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: "12px",
                  fontFamily: "Be Vietnam Pro,sans-serif",
                }}
              >
                Ưu đãi kết thúc sau
              </div>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                {[
                  { val: pad(timeLeft.h), label: "Giờ" },
                  { val: pad(timeLeft.m), label: "Phút" },
                  { val: pad(timeLeft.s), label: "Giây" },
                ].map(({ val, label }, idx) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "0.5px solid rgba(74,158,63,0.3)",
                        padding: "10px 14px",
                        textAlign: "center",
                        minWidth: "60px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "Montserrat,sans-serif",
                          fontSize: "28px",
                          fontWeight: 600,
                          color: "var(--ivory)",
                          lineHeight: 1,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {val}
                      </div>
                      <div
                        style={{
                          fontSize: "8px",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.35)",
                          marginTop: "4px",
                          fontFamily: "Be Vietnam Pro,sans-serif",
                        }}
                      >
                        {label}
                      </div>
                    </div>
                    {idx < 2 && (
                      <span
                        style={{
                          fontFamily: "Playfair Display,serif",
                          fontSize: "24px",
                          color: "var(--gold)",
                          lineHeight: 1,
                          animation: "pulse 1s ease-in-out infinite",
                        }}
                      >
                        :
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* price */}
            <div
              style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}
            >
              <div
                style={{
                  fontFamily: "Montserrat,sans-serif",
                  fontSize: "38px",
                  fontWeight: 700,
                  color: "var(--gold)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                <CountdownPrice
                  from={book.salePrice || book.price}
                  to={discountedPrice}
                />
              </div>
              <div
                style={{
                  fontFamily: "Montserrat,sans-serif",
                  fontSize: "18px",
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.3)",
                  textDecoration: "line-through",
                  paddingBottom: "4px",
                }}
              >
                {formatPrice(book.salePrice || book.price)}
              </div>
            </div>

            {/* CTA */}
            {claimed ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "16px 32px",
                  background: "rgba(74,158,63,0.15)",
                  border: "0.5px solid rgba(74,158,63,0.4)",
                  color: "var(--gold)",
                  fontSize: "11px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  fontFamily: "Be Vietnam Pro,sans-serif",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Đã thêm vào giỏ hàng!
              </div>
            ) : (
              <button
                onClick={() => {
                  onAddCart(book.hashId, getPreferredCartFormat(book));
                  setClaimed(true);
                  setTimeout(() => setClaimed(false), 3000);
                }}
                style={{
                  background: "var(--gold)",
                  color: "var(--ink)",
                  border: "none",
                  padding: "17px 32px",
                  cursor: "pointer",
                  fontFamily: "Be Vietnam Pro,sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  transition: "all 0.3s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  width: "100%",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "var(--gold-light)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "var(--gold)")
                }
              >
                Nhận Ưu Đãi Ngay
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* trust micro */}
            <div
              style={{
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                paddingTop: "16px",
                borderTop: "0.5px solid rgba(255,255,255,0.08)",
              }}
            >
              {[
                "🔒 Bảo mật thanh toán",
                "📦 Giao hàng miễn phí",
                "↩️ Đổi trả 30 ngày",
              ].map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.35)",
                    fontWeight: 300,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/*
   TOP RATED — sách được vote / đánh giá cao nhất
*/
function TopRatedSection({ books, onAddCart }) {
  const TOP_RATINGS = [4.9, 4.8, 4.8, 4.7, 4.7, 4.6];
  const TOP_VOTES = [1240, 987, 856, 743, 698, 521];
  const [voted, setVoted] = useState({});
  const [localVotes, setLocalVotes] = useState({});

  const handleVote = (id) => {
    if (voted[id]) return;
    setVoted((v) => ({ ...v, [id]: true }));
    setLocalVotes((v) => ({ ...v, [id]: (v[id] || 0) + 1 }));
  };

  if (!books || books.length === 0) return null;
  const displayBooks = books.slice(0, 6);

  return (
    <section style={{ padding: "120px 100px", background: "var(--white)" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* header */}
        <div className="section-header reveal">
          <div className="section-eyebrow">
            <div className="section-eyebrow-line" />
            <span className="section-eyebrow-text">Cộng Đồng Bình Chọn</span>
            <div className="section-eyebrow-line" />
          </div>
          <h2 className="section-title">
            Được Đánh Giá <em>Cao Nhất</em>
          </h2>
          <p className="section-subtitle">
            Những cuốn sách được cộng đồng Earthoria yêu thích và bình chọn
            nhiều nhất
          </p>
        </div>

        {/* grid */}
        <div
          className="top-rated-grid"
          style={{
            gap: "0",
            border: "0.5px solid var(--border)",
          }}
        >
          {displayBooks.map((book, i) => {
            const rating = TOP_RATINGS[i] || 4.5;
            const baseVotes = TOP_VOTES[i] || 300;
            const totalVotes = baseVotes + (localVotes[book.id] || 0);
            const hasVoted = !!voted[book.id];
            const filledStars = Math.round(rating);

            return (
              <div
                key={book.id}
                className={`reveal reveal-delay-${(i % 3) + 1}`}
                style={{
                  padding: "36px 32px",
                  borderRight:
                    (i + 1) % 3 !== 0 ? "0.5px solid var(--border)" : "none",
                  borderBottom: i < 3 ? "0.5px solid var(--border)" : "none",
                  background: "var(--white)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.4s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--ivory)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 16px 40px rgba(13,43,30,0.08)";
                  e.currentTarget.style.zIndex = "2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--white)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.zIndex = "1";
                }}
              >
                {/* rank ribbon */}
                {i < 3 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      right: "0",
                      width: "0",
                      height: "0",
                      borderStyle: "solid",
                      borderWidth: `0 52px 52px 0`,
                      borderColor: `transparent ${i === 0 ? "var(--gold)" : i === 1 ? "#8a9490" : "#b07830"} transparent transparent`,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "6px",
                        right: "-46px",
                        fontFamily: "Playfair Display,serif",
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "var(--ivory)",
                      }}
                    >
                      #{i + 1}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    alignItems: "flex-start",
                  }}
                >
                  {/* cover */}
                  <div
                    style={{
                      width: "72px",
                      height: "88px",
                      overflow: "hidden",
                      flexShrink: 0,
                      border: "0.5px solid var(--border)",
                    }}
                  >
                    <img
                      src={
                        book.coverImage ||
                        "https://placehold.co/72x88/0d3330/faf8f3?text=E"
                      }
                      alt={book.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  {/* info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "var(--gold)",
                        marginBottom: "6px",
                        fontFamily: "Be Vietnam Pro,sans-serif",
                      }}
                    >
                      {book.category?.name || "Thiên Nhiên"}
                    </div>
                    <div
                      style={{
                        fontFamily: "Playfair Display,serif",
                        fontSize: "17px",
                        fontWeight: 400,
                        color: "var(--forest)",
                        lineHeight: 1.25,
                        marginBottom: "8px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {book.title}
                    </div>

                    {/* stars */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "6px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "2px" }}>
                        {[...Array(5)].map((_, s) => (
                          <span
                            key={s}
                            style={{
                              fontSize: "12px",
                              color:
                                s < filledStars ? "var(--gold)" : "var(--pale)",
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span
                        style={{
                          fontFamily: "Montserrat,sans-serif",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--forest)",
                        }}
                      >
                        {rating}
                      </span>
                    </div>

                    {/* vote count */}
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        fontWeight: 300,
                      }}
                    >
                      {totalVotes.toLocaleString("vi-VN")} lượt đánh giá
                    </div>
                  </div>
                </div>

                {/* vote bar */}
                <div style={{ marginTop: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      marginBottom: "6px",
                      fontFamily: "Be Vietnam Pro,sans-serif",
                    }}
                  >
                    <span>Điểm tin cậy</span>
                    <span style={{ color: "var(--gold)", fontWeight: 500 }}>
                      {Math.round((rating / 5) * 100)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: "3px",
                      background: "var(--pale)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(rating / 5) * 100}%`,
                        height: "100%",
                        background:
                          "linear-gradient(90deg, var(--gold), var(--gold-light))",
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </div>

                {/* actions */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "20px",
                    paddingTop: "20px",
                    borderTop: "0.5px solid var(--border)",
                    alignItems: "center",
                  }}
                >
                  {/* vote button */}
                  <button
                    onClick={() => handleVote(book.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      background: hasVoted ? "var(--gold-pale)" : "transparent",
                      border: `0.5px solid ${hasVoted ? "var(--gold)" : "var(--border)"}`,
                      color: hasVoted ? "var(--gold)" : "var(--text-muted)",
                      cursor: hasVoted ? "default" : "pointer",
                      fontFamily: "Be Vietnam Pro,sans-serif",
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      transition: "all 0.3s",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill={hasVoted ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    {hasVoted ? "Đã vote" : "Vote"}
                  </button>

                  {/* price */}
                  <div
                    style={{
                      fontFamily: "Montserrat,sans-serif",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "var(--forest)",
                      flex: 1,
                      textAlign: "center",
                    }}
                  >
                    {formatPrice(book.salePrice || book.price)}
                  </div>

                  {/* add to cart */}
                  <button
                    onClick={() =>
                      onAddCart(book.hashId, getPreferredCartFormat(book))
                    }
                    style={{
                      width: "36px",
                      height: "36px",
                      background: "var(--forest)",
                      color: "var(--ivory)",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s",
                      flexShrink: 0,
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "var(--forest-mid)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "var(--forest)")
                    }
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* bottom CTA */}
        <div
          className="reveal"
          style={{ textAlign: "center", marginTop: "48px" }}
        >
          <Link
            to="/shop"
            className="view-all"
            style={{ justifyContent: "center" }}
          >
            Xem tất cả đánh giá
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

/*   MAIN HOME COMPONENT*/
export default function Home() {
  const ctaRef = useRef(null);
  const { addToCart } = useCartStore();

  const { data: featuredBooks = [], isLoading: isFeaturedLoading } = useQuery({
    queryKey: ["featured-books"],
    queryFn: () => bookService.getFeatured().then((r) => r.data.data),
  });

  const { data: newBooks = [], isLoading: isNewLoading } = useQuery({
    queryKey: ["new-books"],
    queryFn: () =>
      bookService
        .getNew?.()
        .then((r) => r.data.data)
        .catch(() => featuredBooks) ?? Promise.resolve(featuredBooks),
  });

  const { data: bestsellerBooks = [], isLoading: isBestsellerLoading } =
    useQuery({
      queryKey: ["bestseller-books"],
      queryFn: () =>
        bookService
          .getBestsellers?.()
          .then((r) => r.data.data)
          .catch(() => featuredBooks) ?? Promise.resolve(featuredBooks),
    });

  // Fireflies
  useEffect(() => {
    const section = ctaRef.current;
    if (!section) return;
    const configs = [
      {
        x: "8%",
        y: "20%",
        dx1: "40px",
        dy1: "-30px",
        dx2: "20px",
        dy2: "60px",
        dx3: "-30px",
        dy3: "20px",
        dur: "7s",
        opacity: "0.9",
      },
      {
        x: "15%",
        y: "70%",
        dx1: "-20px",
        dy1: "-50px",
        dx2: "50px",
        dy2: "-20px",
        dx3: "10px",
        dy3: "40px",
        dur: "9s",
        opacity: "0.7",
      },
      {
        x: "25%",
        y: "40%",
        dx1: "30px",
        dy1: "40px",
        dx2: "-40px",
        dy2: "20px",
        dx3: "20px",
        dy3: "-50px",
        dur: "11s",
        opacity: "0.85",
      },
      {
        x: "40%",
        y: "15%",
        dx1: "-50px",
        dy1: "30px",
        dx2: "30px",
        dy2: "50px",
        dx3: "-20px",
        dy3: "-30px",
        dur: "8s",
        opacity: "0.6",
      },
      {
        x: "55%",
        y: "80%",
        dx1: "20px",
        dy1: "-60px",
        dx2: "-30px",
        dy2: "-20px",
        dx3: "50px",
        dy3: "30px",
        dur: "13s",
        opacity: "0.8",
      },
      {
        x: "65%",
        y: "30%",
        dx1: "-40px",
        dy1: "50px",
        dx2: "60px",
        dy2: "-30px",
        dx3: "-20px",
        dy3: "40px",
        dur: "10s",
        opacity: "0.75",
      },
      {
        x: "75%",
        y: "60%",
        dx1: "50px",
        dy1: "-40px",
        dx2: "-20px",
        dy2: "50px",
        dx3: "30px",
        dy3: "-20px",
        dur: "12s",
        opacity: "0.9",
      },
      {
        x: "85%",
        y: "25%",
        dx1: "-30px",
        dy1: "-20px",
        dx2: "20px",
        dy2: "-50px",
        dx3: "-50px",
        dy3: "30px",
        dur: "9s",
        opacity: "0.65",
      },
      {
        x: "90%",
        y: "75%",
        dx1: "20px",
        dy1: "30px",
        dx2: "-50px",
        dy2: "20px",
        dx3: "30px",
        dy3: "-40px",
        dur: "14s",
        opacity: "0.8",
      },
      {
        x: "50%",
        y: "50%",
        dx1: "-60px",
        dy1: "-40px",
        dx2: "40px",
        dy2: "-60px",
        dx3: "60px",
        dy3: "40px",
        dur: "16s",
        opacity: "0.5",
      },
      {
        x: "33%",
        y: "85%",
        dx1: "40px",
        dy1: "-20px",
        dx2: "-20px",
        dy2: "-40px",
        dx3: "10px",
        dy3: "30px",
        dur: "11s",
        opacity: "0.7",
      },
      {
        x: "70%",
        y: "10%",
        dx1: "-20px",
        dy1: "60px",
        dx2: "40px",
        dy2: "20px",
        dx3: "-30px",
        dy3: "-40px",
        dur: "8s",
        opacity: "0.85",
      },
    ];
    const fireflies = configs.map((c, i) => {
      const el = document.createElement("div");
      el.className = "firefly";
      el.style.cssText = `--x:${c.x};--y:${c.y};--dx1:${c.dx1};--dy1:${c.dy1};--dx2:${c.dx2};--dy2:${c.dy2};--dx3:${c.dx3};--dy3:${c.dy3};--dur:${c.dur};--max-opacity:${c.opacity};animation-delay:${(i * 1.3).toFixed(1)}s;`;
      section.appendChild(el);
      return el;
    });
    return () => fireflies.forEach((el) => el.remove());
  }, []);

  // Counter animation
  useEffect(() => {
    const counters = document.querySelectorAll(".stat-count");
    counters.forEach((counter) => {
      const target = +counter.dataset.target;
      if (!target) return;
      let count = 0;
      const step = target / 100;
      const timer = setInterval(() => {
        count += step;
        if (count >= target) {
          count = target;
          clearInterval(timer);
        }
        counter.textContent = Math.round(count).toLocaleString("vi-VN");
      }, 20);
    });
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        }),
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [featuredBooks, newBooks, bestsellerBooks]);

  const [addingIds, setAddingIds] = useState(new Set());
  const { isAuthenticated } = useAuthStore();

  const handleAddToCart = async (hashId, format = "PHYSICAL") => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để mua hàng");
      return;
    }
    if (addingIds.has(hashId)) return;
    setAddingIds((prev) => new Set(prev).add(hashId));
    toast.success("Đã thêm vào giỏ hàng");
    try {
      await addToCart(hashId, 1, format);
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(hashId);
        return next;
      });
    }
  };

  // Fallback skeleton books
  const skeletonBooks = [1, 2, 3, 4].map((i) => ({
    id: i,
    title: "...",
    description: "",
    coverImage: null,
    category: null,
    hashId: "",
    slug: "",
    price: 0,
    salePrice: 0,
  }));

  const displayFeatured =
    featuredBooks.length > 0 ? featuredBooks : skeletonBooks;
  const displayNew =
    newBooks.length > 0
      ? newBooks
      : featuredBooks.length > 0
        ? [...featuredBooks].reverse()
        : skeletonBooks;
  const displayBest =
    bestsellerBooks.length > 0 ? bestsellerBooks : featuredBooks;

  return (
    <>
      {/*   HERO BANNER SLIDER   */}
      <HeroBanner />

      {/*   MARQUEE — flush below hero gradient   */}
      <div
        className="marquee-section"
        style={{ marginTop: "-2px", position: "relative", zIndex: 10 }}
      >
        <div className="marquee-track">
          {[
            "Sách AR Thiên Nhiên",
            "AI Storytelling",
            "Mô Hình 3D",
            "Giáo Dục Sinh Thái",
            "Thực Tế Tăng Cường",
            "Khám Phá Thiên Nhiên",
            "Sách AR Thiên Nhiên",
            "AI Storytelling",
            "Mô Hình 3D",
            "Giáo Dục Sinh Thái",
            "Thực Tế Tăng Cường",
            "Khám Phá Thiên Nhiên",
          ].map((item, i) => (
            <div className="marquee-item" key={i}>
              {item} <div className="marquee-dot" />
            </div>
          ))}
        </div>
      </div>
      {/*   STATS   */}
      <section className="stats-section reveal">
        <div className="stats-inner">
          {[
            { label: "Trẻ em khám phá", value: "1.000+", count: 1000 },
            { label: "Chủ đề sinh thái", value: "5", count: 5, gold: true },
            { label: "Tương tác thực tế", value: "AI+AR", noCount: true },
            { label: "Giá trị giáo dục", value: "100%", count: 100 },
          ].map((stat, i) => (
            <div className="stat-item" key={i} style={{ "--bar-width": "85%" }}>
              <div className="stat-top">
                <div
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                  }}
                >
                  {stat.label}
                </div>
              </div>
              <div className={`stat-number ${stat.gold ? "stat-gold" : ""}`}>
                {stat.noCount ? (
                  stat.value
                ) : (
                  <>
                    <span className="stat-count" data-target={stat.count}>
                      0
                    </span>
                    {stat.value.replace(/\d+/g, "")}
                  </>
                )}
              </div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-bar">
                <div className="stat-bar-fill" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/*   ECOSYSTEM LOGO STRIP   */}
      <EcosystemStrip />

      {/*   HOW IT WORKS   */}
      <section className="how-section">
        <div className="how-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line" />
              <span className="section-eyebrow-text">Cách Hoạt Động</span>
              <div className="section-eyebrow-line" />
            </div>
            <h2 className="section-title">
              Hành Trình <em>Ba Bước</em>
            </h2>
            <p className="section-subtitle">
              Thế giới tự nhiên sẽ hiện ra sống động ngay trước mắt bé chỉ trong
              vài giây.
            </p>
          </div>
          <div className="how-grid">
            {[
              {
                num: "01",
                title: "Mở Sách",
                desc: "Bắt đầu hành trình với những trang sách minh họa tuyệt đẹp về thế giới tự nhiên.",
              },
              {
                num: "02",
                title: "Quét AR",
                desc: "Sử dụng ứng dụng Earthoria để quét các trang sách có biểu tượng AR đặc biệt.",
              },
              {
                num: "03",
                title: "Tương Tác 3D",
                desc: "Ngắm nhìn sinh vật sống động hiện ra trong không gian thực và trò chuyện với AI.",
              },
            ].map((step, i) => (
              <div className={`how-step reveal reveal-delay-${i + 1}`} key={i}>
                <span className="step-num">
                  {step.num} — Bước {i + 1}
                </span>
                <div className="step-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*   FEATURED COLLECTION (Grid)   */}
      <section className="products-section">
        <div className="products-inner">
          <div className="products-top reveal">
            <div>
              <div className="section-eyebrow" style={{ marginBottom: "16px" }}>
                <div className="section-eyebrow-line" />
                <span className="section-eyebrow-text">Bộ Sưu Tập Nổi Bật</span>
              </div>
              <h2 className="section-title" style={{ textAlign: "left" }}>
                Tuyển Tập <em>Sinh Thái</em>
              </h2>
            </div>
            <Link to="/shop" className="view-all">
              Xem toàn bộ
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="products-grid">
            {isFeaturedLoading ? (
              <SkeletonProductGrid count={3} />
            ) : (
              displayFeatured
                .slice(0, 3)
                .map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onAddCart={handleAddToCart}
                    badge={book.isFeatured ? "Nổi Bật" : undefined}
                    badgeType="gold"
                    isAdding={addingIds.has(book.hashId)}
                  />
                ))
            )}
          </div>
        </div>
      </section>

      {/*   MỚI NHẤT — Horizontal Scroll   */}
      <section
        className="new-arrivals-section"
        style={{
          background: "var(--ivory)",
          borderTop: "0.5px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div
            className="reveal"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "48px",
            }}
          >
            <div>
              <div
                className="section-eyebrow"
                style={{ justifyContent: "flex-start", marginBottom: "16px" }}
              >
                <div className="section-eyebrow-line" />
                <span className="section-eyebrow-text">Mới Ra Mắt</span>
              </div>
              <h2 className="section-title" style={{ textAlign: "left" }}>
                Sách <em>Mới Nhất</em>
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  marginTop: "12px",
                  fontWeight: 300,
                }}
              >
                Những đầu sách vừa ra lò — tươi mới, sinh động và đầy ắp khám
                phá.
              </p>
            </div>
            <Link to="/shop?sort=newest" className="view-all">
              Tất cả sách mới
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {/* NEW badge strip */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            {["Tất cả", "Động vật", "Thực vật", "Đại dương", "Thiên văn"].map(
              (tag, i) => (
                <button
                  key={tag}
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "7px 18px",
                    border: "0.5px solid var(--border)",
                    background: i === 0 ? "var(--forest)" : "transparent",
                    color: i === 0 ? "var(--ivory)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontFamily: "Be Vietnam Pro,sans-serif",
                    transition: "all 0.3s",
                  }}
                >
                  {tag}
                </button>
              ),
            )}
          </div>
          {isNewLoading ? (
            <div style={{ display: "flex", gap: "24px", overflow: "hidden" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ flex: "0 0 280px", minWidth: 0 }}>
                  <SkeletonProductGrid count={1} />
                </div>
              ))}
            </div>
          ) : (
            <BookScrollRow
              books={displayNew}
              onAddCart={handleAddToCart}
              badgeLabel="Mới"
              badgeType="forest"
              addingIds={addingIds}
              fadeColor="var(--ivory)"
            />
          )}
        </div>
      </section>

      {/*   PROMO BANNER   */}
      <section
        style={{
          background: "var(--forest)",
          position: "relative",
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(74,158,63,0.15) 0%, transparent 55%), radial-gradient(ellipse at 80% 50%, rgba(45,122,110,0.12) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            fontFamily: "Playfair Display,serif",
            fontSize: "clamp(60px,10vw,140px)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.03)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            letterSpacing: "-0.02em",
          }}
        >
          EARTHORIA
        </div>
        <div
          className="promo-banner-grid"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            gap: "60px",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div className="reveal">
            <div
              style={{
                fontSize: "9px",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "16px",
              }}
            >
              Ưu Đãi Có Hạn
            </div>
            <h2
              style={{
                fontFamily: "Playfair Display,serif",
                fontSize: "clamp(28px,3vw,48px)",
                fontWeight: 300,
                color: "var(--ivory)",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}
            >
              Mua Bộ 3 Cuốn —<br />
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                Tiết Kiệm 30%
              </em>
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(250,248,243,0.55)",
                marginTop: "16px",
                maxWidth: "440px",
                lineHeight: 1.8,
                fontWeight: 300,
              }}
            >
              Ưu đãi áp dụng khi mua combo 3 cuốn bất kỳ. Giao hàng miễn phí
              toàn quốc. Tặng kèm poster AR độc quyền.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginTop: "12px",
              }}
            >
              {[
                { Icon: Truck, label: "Miễn phí ship" },
                { Icon: Gift, label: "Poster AR" },
                { Icon: Star, label: "Ưu tiên hỗ trợ" },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  <Icon size={16} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div
            className="reveal reveal-delay-1 promo-product-showcase"
            style={{
              position: "absolute",
              bottom: 0,
              right: "60px",
              zIndex: 2,
            }}
          >
            <Link to="/shop" style={{ display: "block", lineHeight: 0 }}>
              <img
                src="homepage/product1.png"
                alt="Combo 3 cuốn — Tiết kiệm 30%"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  display: "block",
                  height: "clamp(320px,30vw,460px)",
                  width: "auto",
                  maxWidth: "none",
                  filter: "drop-shadow(0 40px 45px rgba(0,0,0,0.4))",
                  cursor: "pointer",
                  userselect: "none",
                  webkituserselect: "none",
                  webkittouchcallout: "none",
                  pointerevents: "auto",
                }}
              />
            </Link>
          </div>
        </div>
      </section>

      {/*   BÁN CHẠY — Horizontal Scroll   */}
      <section
        className="bestseller-section"
        style={{ background: "var(--cream)" }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div
            className="reveal"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "48px",
            }}
          >
            <div>
              <div
                className="section-eyebrow"
                style={{ justifyContent: "flex-start", marginBottom: "16px" }}
              >
                <div className="section-eyebrow-line" />
                <span className="section-eyebrow-text">
                  Được Yêu Thích Nhất
                </span>
              </div>
              <h2 className="section-title" style={{ textAlign: "left" }}>
                Sách <em>Bán Chạy</em>
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  marginTop: "12px",
                  fontWeight: 300,
                }}
              >
                Những cuốn sách được hàng ngàn gia đình tin chọn và đánh giá cao
                nhất.
              </p>
            </div>
            <Link to="/shop?sort=bestseller" className="view-all">
              Xem thêm
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Bestseller rank podium — fixed */}
          {isBestsellerLoading ? (
            <div
              className="reveal"
              style={{ display: "flex", gap: "16px", marginBottom: "48px" }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0 }}>
                  <SkeletonProductGrid count={1} />
                </div>
              ))}
            </div>
          ) : (
            displayBest.length > 0 && (
              <div
                className="reveal bestseller-podium"
                style={{
                  gap: "16px",
                  marginBottom: "48px",
                  alignItems: "end",
                }}
              >
                {[displayBest[1], displayBest[0], displayBest[2]]
                  .filter(Boolean)
                  .map((book, i) => {
                    const ranks = [2, 1, 3];
                    const rank = ranks[i];
                    const isFirst = rank === 1;
                    return (
                      <div
                        key={book.id}
                        style={{
                          background: isFirst
                            ? "linear-gradient(135deg, #0d3330 0%, #1a5c52 50%, #4a9e3f 100%)"
                            : "var(--white)",
                          border: isFirst
                            ? "none"
                            : "0.5px solid var(--border)",
                          padding: isFirst
                            ? "36px 24px 28px"
                            : "28px 24px 24px",
                          textAlign: "center",
                          position: "relative",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "10px",
                          minHeight: isFirst ? "340px" : "300px",
                          justifyContent: "center",
                        }}
                      >
                        {/* rank badge */}
                        <div
                          style={{
                            position: "absolute",
                            top: "0",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background:
                              rank === 1
                                ? "var(--gold)"
                                : rank === 2
                                  ? "#8a9490"
                                  : "#b07830",
                            color: "var(--ivory)",
                            fontFamily: "Playfair Display,serif",
                            fontSize: "10px",
                            fontWeight: 500,
                            padding: "5px 20px",
                            letterSpacing: "0.12em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          #{rank}
                        </div>
                        {/* cover */}
                        <div
                          style={{
                            marginTop: "16px",
                            width: isFirst ? "90px" : "72px",
                            height: isFirst ? "112px" : "90px",
                            overflow: "hidden",
                            border: `1.5px solid ${isFirst ? "rgba(255,255,255,0.25)" : "var(--border)"}`,
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={
                              book.coverImage ||
                              "https://placehold.co/90x112/0d3330/faf8f3?text=E"
                            }
                            alt={book.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                        {/* title */}
                        <div
                          style={{
                            fontFamily: "Playfair Display,serif",
                            fontSize: isFirst ? "17px" : "14px",
                            fontWeight: 400,
                            color: isFirst ? "var(--ivory)" : "var(--forest)",
                            lineHeight: 1.3,
                            maxWidth: "180px",
                          }}
                        >
                          {book.title}
                        </div>
                        {/* category */}
                        <div
                          style={{
                            fontSize: "11px",
                            color: isFirst
                              ? "rgba(255,255,255,0.55)"
                              : "var(--text-muted)",
                          }}
                        >
                          {book.category?.name}
                        </div>
                        {/* price */}
                        <div
                          style={{
                            fontFamily: "Montserrat,sans-serif",
                            fontSize: isFirst ? "20px" : "16px",
                            fontWeight: 600,
                            color: isFirst ? "var(--gold)" : "var(--forest)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {formatPrice(book.salePrice || book.price)}
                        </div>
                        {/* CTA */}
                        <button
                          onClick={(e) => {
                            const cardImg = e.currentTarget
                              .closest("div")
                              ?.querySelector("img");
                            flyToCart(cardImg);
                            handleAddToCart(
                              book.hashId,
                              getPreferredCartFormat(book),
                            );
                          }}
                          style={{
                            background: isFirst
                              ? "var(--gold)"
                              : "var(--forest)",
                            color: isFirst ? "var(--ink)" : "var(--ivory)",
                            border: "none",
                            padding: "10px 20px",
                            cursor: "pointer",
                            fontFamily: "Be Vietnam Pro,sans-serif",
                            fontSize: "9px",
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            transition: "all 0.3s",
                            width: "100%",
                            marginTop: "4px",
                          }}
                        >
                          Thêm Vào Giỏ
                        </button>
                      </div>
                    );
                  })}
              </div>
            )
          )}

          {!isBestsellerLoading && (
            <BookScrollRow
              books={displayBest}
              onAddCart={handleAddToCart}
              badgeLabel="Bán Chạy"
              badgeType="gold"
              addingIds={addingIds}
            />
          )}
        </div>
      </section>

      <StickyScrollTransition />

      {/*   TOP RATED — sách được vote cao nhất   */}
      <TopRatedSection books={displayBest} onAddCart={handleAddToCart} />

      {/*   VALUES   */}
      <section className="values-section">
        <Suspense fallback={null}>
          <SproutModel className="values-3d-bg" />
        </Suspense>
        <div className="values-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line" />
              <span className="section-eyebrow-text">Giá Trị Cốt Lõi</span>
              <div className="section-eyebrow-line" />
            </div>
            <h2 className="section-title">
              Phát Triển <em>Toàn Diện</em>
            </h2>
            <p className="section-subtitle">
              Thiết kế dựa trên phương pháp giáo dục hiện đại.
            </p>
          </div>
          <div className="values-grid">
            {[
              {
                num: "01",
                title: "Khơi Dậy Sáng Tạo",
                desc: "Hình ảnh 3D chân thực kích thích trí tưởng tượng.",
              },
              {
                num: "02",
                title: "Tư Duy Phản Biện",
                desc: "Thông qua tương tác hỏi đáp với AI, trẻ rèn luyện kỹ năng phân tích.",
              },
              {
                num: "03",
                title: "Kiến Thức Bền Vững",
                desc: "Xây dựng tình yêu thiên nhiên và ý thức bảo vệ môi trường.",
              },
            ].map((v, i) => (
              <div
                className={`value-item reveal reveal-delay-${i + 1}`}
                key={i}
              >
                <div className="value-num">{v.num}</div>
                <h3 className="value-title">{v.title}</h3>
                <p className="value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*   JOURNEY   */}
      <section className="journey-section">
        <div className="journey-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line" />
              <span className="section-eyebrow-text">Lộ Trình Học Tập</span>
              <div className="section-eyebrow-line" />
            </div>
            <h2 className="section-title">
              Hành Trình <em>Tri Thức</em>
            </h2>
            <p className="section-subtitle">
              Từ những bước đầu tiên đến khi thành thạo với Earthoria.
            </p>
          </div>
          <div className="journey-steps">
            {[
              {
                num: "01",
                title: "Khám Phá",
                img: "homepage/kham-pha.png",
                desc: "Mở cuốn sách đầu tiên và để trí tò mò dẫn lối.",
                detail:
                  "Hơn 80 loài sinh vật được minh họa chi tiết, mỗi trang là một cánh cửa dẫn vào thế giới tự nhiên kỳ diệu.",
              },
              {
                num: "02",
                title: "Tương Tác",
                img: "homepage/tuong-tac.png",
                desc: "Trò chuyện với 3D, hỏi đáp cùng AI thông minh.",
                detail:
                  "Đặt câu hỏi cho bất kỳ sinh vật nào — AI sẽ trả lời bằng giọng nói tự nhiên, thân thiện với trẻ em.",
              },
              {
                num: "03",
                title: "Ghi Nhớ",
                img: "homepage/ghi-nho.png",
                desc: "Kiến thức hình ảnh đọng lại sâu hơn 5 lần so với đọc thông thường.",
                detail:
                  "Phương pháp học qua hình ảnh 3D và tương tác thực tế giúp não bộ ghi nhớ lâu dài và hiệu quả hơn.",
              },
              {
                num: "04",
                title: "Tiến Bộ",
                img: "homepage/tien-bo.png",
                desc: "AI theo dõi và điều chỉnh lộ trình học theo nhịp độ của từng bé.",
                detail:
                  "Hệ thống AI cá nhân hóa nội dung, ghi nhớ tiến trình và đề xuất bài học phù hợp với từng độ tuổi.",
              },
            ].map((step, i) => (
              <div
                className={`journey-step reveal reveal-delay-${i + 1}`}
                key={i}
                style={{ position: "relative", overflow: "hidden" }}
              >
                <div
                  className="journey-step-bg"
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url('/${step.img}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0,
                    transition: "opacity 0.5s ease",
                    zIndex: 0,
                  }}
                />
                <div
                  className="journey-step-gradient"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(135deg, rgba(13,51,48,0.82) 0%, rgba(26,92,82,0.75) 50%, rgba(74,158,63,0.65) 100%)",
                    opacity: 0,
                    transition: "opacity 0.5s ease",
                    zIndex: 1,
                  }}
                />
                <div style={{ position: "relative", zIndex: 2 }}>
                  <div className="journey-step-num">{step.num}</div>
                  <h3 className="journey-step-title">{step.title}</h3>
                  <p className="journey-step-desc">{step.desc}</p>
                  <p
                    className="journey-step-detail"
                    style={{
                      fontSize: "12px",
                      lineHeight: 1.8,
                      color: "rgba(250,248,243,0.75)",
                      fontWeight: 300,
                      marginTop: "14px",
                      fontStyle: "italic",
                      opacity: 0,
                      transform: "translateY(8px)",
                      transition: "all 0.4s ease 0.1s",
                    }}
                  >
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*   TESTIMONIALS   */}
      <section className="reviews-section">
        <div className="reviews-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line" />
              <span className="section-eyebrow-text">
                Phụ Huynh & Giáo Viên Nói Gì
              </span>
              <div className="section-eyebrow-line" />
            </div>
            <h2 className="section-title">
              Tin Tưởng Từ <em>Cộng Đồng</em>
            </h2>
          </div>
          <div className="reviews-grid">
            {REVIEWS.map((r, i) => (
              <div
                className={`review-card reveal reveal-delay-${i + 1}`}
                key={i}
              >
                <span className="review-quote-mark">"</span>
                <div className="review-stars">
                  {[...Array(r.stars)].map((_, j) => (
                    <span key={j} className="star">
                      ★
                    </span>
                  ))}
                </div>
                <p className="review-text">"{r.text}"</p>
                <div className="review-author">
                  <div className="review-avatar">{r.initial}</div>
                  <div>
                    <div className="review-name">{r.name}</div>
                    <div className="review-role">{r.role}</div>
                  </div>
                  <div
                    className="verified-badge"
                    style={{ marginLeft: "auto" }}
                  >
                    Đã xác minh
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust numbers below reviews */}
          <div className="reveal trust-metrics-wrap">
            <div className="trust-metrics-grid">
              <CountUpMetric
                target={98}
                suffix="%"
                label="Phụ huynh hài lòng"
                icon={ShieldCheck}
              />
              <CountUpMetric
                target={4.9}
                decimals={1}
                suffix="★"
                label="Đánh giá trung bình"
                icon={Star}
              />
              <CountUpMetric
                target={1000}
                suffix="+"
                label="Gia đình tin dùng"
                icon={Users}
              />
              <CountUpMetric
                target={30}
                suffix=" ngày"
                label="Đổi trả miễn phí"
                icon={RotateCcw}
              />
            </div>
          </div>
        </div>
      </section>

      {/*   NEWSLETTER   */}
      <NewsletterSection />

      {/*   CTA BANNER   */}
      <section className="cta-section" id="cta-section" ref={ctaRef}>
        <div className="cta-bg-text">Earthoria</div>
        <span className="cta-eyebrow reveal">Bắt Đầu Hành Trình</span>
        <h2 className="cta-headline reveal">
          Mỗi trang sách là một cánh cửa —<br />
          <em>Mở ra thế giới mới</em>
        </h2>
        <p className="cta-sub reveal">
          Hãy để Earthoria đồng hành cùng bé trên hành trình khám phá tri thức.
        </p>
        <div className="cta-btns reveal">
          <Link to="/register">
            <button className="cta-btn-main">Tham gia ngay hôm nay</button>
          </Link>
          <Link to="/shop">
            <button className="cta-btn-out">Khám phá thư viện</button>
          </Link>
        </div>
      </section>
    </>
  );
}
