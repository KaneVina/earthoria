/**
 * SearchOverlay — command-palette style search
 * ─────────────────────────────────────────────
 * • Tìm kiếm sản phẩm thật từ API: GET /api/v1/books?search=...&category=...&limit=7
 * • Tìm kiếm trang / chức năng (Hồ sơ, Đơn hàng, Giỏ hàng...) ngay lập tức
 * • Debounce 280ms, skeleton loading, highlight match tiếng Việt
 * • Lịch sử tìm kiếm có TTL 7 ngày, tự dọn khi quá hạn
 * • Keyboard navigation: ↑↓ Enter Esc / Ctrl+K / Cmd+K
 * • Auth-aware: hiện trang cá nhân chỉ khi đăng nhập
 *
 * Props:
 *  isOpen          boolean
 *  onClose         () => void
 *  onOpen          () => void   — bật phím tắt
 *  isAuthenticated boolean
 *  isAdmin         boolean
 *  onLogout        () => void
 *  getProductLink  (book) => string   — default: /books/:slug/:hashId
 */

import {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, X, Clock, TrendingUp, ArrowRight, SearchX,
  BookOpen, Boxes, Sparkles, Tag, LayoutGrid, User,
  Package, Heart, ShoppingCart, Settings, Home, Store,
  Info, ShieldCheck, LogOut, LogIn, Zap,
} from "lucide-react";
import { bookService } from "../../services/bookService";

/* ════════════════════════════════════════════════
   CẤU HÌNH
   ════════════════════════════════════════════════ */

const CATEGORIES = [
  { id: "all",       label: "Tất cả" },
  { id: "book",      label: "Sách AR" },
  { id: "kit",       label: "Bộ dụng cụ" },
  { id: "ar",        label: "Trải nghiệm AR" },
  { id: "accessory", label: "Phụ kiện" },
];

const QUICK_CATEGORIES = [
  { id: "book",      label: "Sách AR",          desc: "Câu chuyện sống động",    icon: BookOpen },
  { id: "kit",       label: "Bộ dụng cụ",       desc: "Học mà chơi, chơi mà học", icon: Boxes },
  { id: "ar",        label: "Trải nghiệm AR",   desc: "Khám phá thế giới 3D",    icon: Sparkles },
  { id: "accessory", label: "Phụ kiện",         desc: "Kính AR, túi, thẻ bài",   icon: Tag },
];

const TRENDING = ["khủng long", "bé 3 tuổi", "hệ mặt trời", "kính AR", "flashcard động vật"];

const PUBLIC_PAGES = [
  { id: "home",  label: "Trang chủ",    desc: "Quay lại trang chủ",                  icon: Home,        path: "/",         keywords: ["trang chu", "home"] },
  { id: "shop",  label: "Cửa hàng",     desc: "Khám phá tất cả sản phẩm",            icon: Store,       path: "/shop",     keywords: ["cua hang", "shop", "san pham", "mua sam"] },
  { id: "tech",  label: "Công nghệ AR", desc: "Tìm hiểu trải nghiệm thực tế ảo",    icon: Sparkles,    path: "/technology", keywords: ["cong nghe", "ar", "thuc te ao", "technology"] },
  { id: "blog",  label: "Blog",         desc: "Bài viết & kiến thức cho bé",         icon: BookOpen,    path: "/blog",     keywords: ["blog", "bai viet", "kien thuc"] },
  { id: "about", label: "Về chúng tôi", desc: "Câu chuyện thương hiệu Earthoria",    icon: Info,        path: "/about",    keywords: ["ve chung toi", "about", "gioi thieu"] },
];

const AUTH_PAGES = [
  { id: "profile",  label: "Hồ sơ của tôi",       desc: "Thông tin & tài khoản cá nhân", icon: User,         path: "/profile",  keywords: ["ho so", "profile", "tai khoan", "thong tin ca nhan"] },
  { id: "orders",   label: "Đơn hàng",             desc: "Lịch sử & trạng thái đơn hàng", icon: Package,      path: "/profile",  keywords: ["don hang", "orders", "lich su mua hang"] },
  { id: "wishlist", label: "Sản phẩm yêu thích",  desc: "Danh sách bạn đã lưu",          icon: Heart,        path: "/wishlist", keywords: ["yeu thich", "wishlist", "da luu"] },
  { id: "cart",     label: "Giỏ hàng",            desc: "Xem giỏ hàng hiện tại",         icon: ShoppingCart, path: "/cart",     keywords: ["gio hang", "cart"] },
  { id: "settings", label: "Cài đặt tài khoản",   desc: "Đổi mật khẩu, thông tin liên hệ", icon: Settings,   path: "/profile",  keywords: ["cai dat", "settings", "doi mat khau"] },
];

const ADMIN_PAGES = [
  { id: "admin-dash",     label: "Tổng quan",        desc: "Dashboard quản trị",              icon: ShieldCheck, path: "/dashboard",          keywords: ["admin", "quan tri", "dashboard"] },
  { id: "admin-products", label: "Quản lý sản phẩm", desc: "Thêm, sửa, xoá sản phẩm",        icon: Boxes,       path: "/dashboard/products", keywords: ["quan ly san pham", "products"] },
  { id: "admin-orders",   label: "Quản lý đơn hàng", desc: "Xem & xử lý đơn hàng",           icon: Package,     path: "/dashboard/orders",   keywords: ["quan ly don hang", "orders"] },
  { id: "admin-users",    label: "Quản lý người dùng", desc: "Tài khoản & phân quyền",        icon: User,        path: "/dashboard/users",    keywords: ["quan ly nguoi dung", "users"] },
];

const LOGOUT_PAGE = {
  id: "logout", label: "Đăng xuất", desc: "Thoát khỏi tài khoản",
  icon: LogOut, action: "logout", keywords: ["dang xuat", "logout", "thoat"],
};

/* ════════════════════════════════════════════════
   LỊCH SỬ TÌM KIẾM — TTL 7 NGÀY
   ════════════════════════════════════════════════ */

const HISTORY_KEY  = "earthoria_search_history";
const MAX_HISTORY  = 8;
const TTL_MS       = 7 * 24 * 60 * 60 * 1000;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    const now = Date.now();
    return items.filter(i => now - i.ts < TTL_MS);
  } catch { return []; }
}

function saveHistory(term) {
  if (!term.trim()) return [];
  try {
    const existing = loadHistory().filter(i => i.term.toLowerCase() !== term.toLowerCase());
    const next = [{ term: term.trim(), ts: Date.now() }, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch { return []; }
}

function removeFromHistory(term) {
  try {
    const next = loadHistory().filter(i => i.term !== term);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch { return []; }
}

/* ════════════════════════════════════════════════
   TIỆN ÍCH
   ════════════════════════════════════════════════ */

const VN_MAP = {
  à:"a",á:"a",ạ:"a",ả:"a",ã:"a",â:"a",ầ:"a",ấ:"a",ậ:"a",ẩ:"a",ẫ:"a",ă:"a",ằ:"a",ắ:"a",ặ:"a",ẳ:"a",ẵ:"a",
  è:"e",é:"e",ẹ:"e",ẻ:"e",ẽ:"e",ê:"e",ề:"e",ế:"e",ệ:"e",ể:"e",ễ:"e",
  ì:"i",í:"i",ị:"i",ỉ:"i",ĩ:"i",
  ò:"o",ó:"o",ọ:"o",ỏ:"o",õ:"o",ô:"o",ồ:"o",ố:"o",ộ:"o",ổ:"o",ỗ:"o",ơ:"o",ờ:"o",ớ:"o",ợ:"o",ở:"o",ỡ:"o",
  ù:"u",ú:"u",ụ:"u",ủ:"u",ũ:"u",ư:"u",ừ:"u",ứ:"u",ự:"u",ử:"u",ữ:"u",
  ỳ:"y",ý:"y",ỵ:"y",ỷ:"y",ỹ:"y",đ:"d",
};

function nvn(str) {
  return String(str).toLowerCase().split("").map(c => VN_MAP[c] || c).join("");
}

function formatPrice(price) {
  if (!price || price === 0) return "Miễn phí";
  return price.toLocaleString("vi-VN") + "đ";
}

function categoryLabel(id) {
  return CATEGORIES.find(c => c.id === id)?.label || id;
}

/** Highlight phần khớp trong text — hỗ trợ tiếng Việt có dấu */
function Highlight({ text, query }) {
  if (!query.trim() || !text) return <>{text}</>;
  const norm  = nvn(text);
  const normQ = nvn(query.trim());
  const idx   = norm.indexOf(normQ);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="so-mark">{text.slice(idx, idx + query.trim().length)}</mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

/** Thời gian tương đối: "vừa xong", "3 giờ trước", "hôm qua"... */
function relativeTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d === 1) return "hôm qua";
  return `${d} ngày trước`;
}

/* ════════════════════════════════════════════════
   COMPONENT CHÍNH
   ════════════════════════════════════════════════ */

export default function SearchOverlay({
  isOpen,
  onClose,
  onOpen,
  isAuthenticated = false,
  isAdmin = false,
  onLogout,
  getProductLink = (b) => `/books/${b.slug}/${b.hashId}`,
}) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const inputRef  = useRef(null);
  const panelRef  = useRef(null);
  const abortRef  = useRef(null);

  const [query,          setQuery]         = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [results,        setResults]        = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [activeIndex,    setActiveIndex]    = useState(-1);
  const [history,        setHistory]        = useState([]);
  const [apiError,       setApiError]       = useState(false);

  const hasQuery = query.trim().length > 0;

  /* ─── Danh sách trang theo auth ─── */
  const availablePages = useMemo(() => {
    const pages = [...PUBLIC_PAGES];
    if (isAuthenticated) {
      pages.unshift(...AUTH_PAGES);
      pages.push(LOGOUT_PAGE);
    }
    if (isAuthenticated && isAdmin) pages.splice(-1, 0, ...ADMIN_PAGES);
    return pages;
  }, [isAuthenticated, isAdmin]);

  const matchedPages = useMemo(() => {
    if (!hasQuery) return [];
    const nq = nvn(query.trim());
    return availablePages
      .filter(p => {
        const hay = nvn(`${p.label} ${p.desc} ${(p.keywords || []).join(" ")}`);
        return hay.includes(nq);
      })
      .slice(0, 4);
  }, [hasQuery, query, availablePages]);

  const flatItems = useMemo(() => [
    ...matchedPages.map(p => ({ ...p, _type: "page" })),
    ...results.map(r => ({ ...r, _type: "product" })),
  ], [matchedPages, results]);

  /* ─── Khóa scroll + focus + load history khi mở ─── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setHistory(loadHistory());
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
    document.body.style.overflow = "";
  }, [isOpen]);

  /* ─── Reset khi đóng ─── */
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setQuery("");
        setActiveCategory("all");
        setResults([]);
        setActiveIndex(-1);
        setApiError(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* ─── Tìm kiếm sản phẩm qua API thật — debounce 280ms ─── */
  useEffect(() => {
    if (!hasQuery) {
      setResults([]);
      setLoading(false);
      setApiError(false);
      return;
    }
    setLoading(true);
    setApiError(false);

    // Huỷ request cũ nếu có
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const t = setTimeout(async () => {
      try {
        const params = {
          search: query.trim(),
          limit: 7,
          ...(activeCategory !== "all" && { category: activeCategory }),
        };
        const res = await bookService.getBooks(params);
        // Tuỳ backend trả về res.data.data hoặc res.data.books — điều chỉnh nếu cần
        const books = res.data?.data?.books ?? res.data?.data ?? res.data?.books ?? [];
        setResults(books);
      } catch (err) {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
          setApiError(true);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, activeCategory, hasQuery]);

  /* ─── Reset activeIndex khi query/category thay đổi ─── */
  useEffect(() => { setActiveIndex(-1); }, [query, activeCategory]);

  /* ─── Activate một item ─── */
  const handleActivate = useCallback((item) => {
    if (!item) return;
    if (item._type === "page") {
      if (item.action === "logout") { onLogout?.(); onClose(); return; }
      navigate(item.path);
      onClose();
      return;
    }
    // product
    setHistory(saveHistory(query));
    navigate(getProductLink(item));
    onClose();
  }, [query, navigate, getProductLink, onClose, onLogout]);

  /* ─── Submit → tới /shop?search=...&category=... ─── */
  const handleSubmit = useCallback(() => {
    if (!hasQuery) return;
    setHistory(saveHistory(query));
    const p = new URLSearchParams({ search: query.trim() });
    if (activeCategory !== "all") p.set("category", activeCategory);
    navigate(`/shop?${p.toString()}`);
    onClose();
  }, [hasQuery, query, activeCategory, navigate, onClose]);

  /* ─── Keyboard ─── */
  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;

      if (isOpen) {
        if (e.key === "Escape") { onClose(); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, flatItems.length - 1)); return; }
        if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)); return; }
        if (e.key === "Enter") {
          e.preventDefault();
          if (activeIndex >= 0 && flatItems[activeIndex]) handleActivate(flatItems[activeIndex]);
          else if (hasQuery) handleSubmit();
          return;
        }
        return;
      }
      if (!typing && onOpen) {
        if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
          e.preventDefault(); onOpen();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, activeIndex, flatItems, hasQuery, handleActivate, handleSubmit, onClose, onOpen]);

  /* ─── Helper ─── */
  const removeHistoryItem = (e, term) => {
    e.stopPropagation();
    setHistory(removeFromHistory(term));
  };

  const quickAccessPages = isAuthenticated ? AUTH_PAGES.slice(0, 4) : [];

  /* ════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════ */
  return (
    <>
      {/* ── CSS toàn cục ── */}
      <style>{CSS}</style>

      <div
        className={`so-backdrop ${isOpen ? "so-open" : ""}`}
        onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
        aria-hidden={!isOpen}
      >
        <div
          ref={panelRef}
          className="so-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Tìm kiếm"
        >
          {/* ── HEADER ── */}
          <div className="so-header">
            <div className="so-input-wrap">
              <Search size={18} className="so-input-icon" />
              <input
                ref={inputRef}
                type="text"
                className="so-input"
                placeholder="Tìm sản phẩm, trang, chức năng..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoComplete="off"
                spellCheck="false"
              />
              {hasQuery && (
                <button
                  type="button"
                  className="so-clear"
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  aria-label="Xoá"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="button" className="so-close-btn" onClick={onClose}>
              <X size={16} />
              <span>ESC</span>
            </button>
          </div>

          {/* ── CATEGORY PILLS ── */}
          <div className="so-pills" role="tablist">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={`so-pill ${activeCategory === cat.id ? "so-pill-active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* ── BODY ── */}
          <div className="so-body">
            {!hasQuery ? (
              /* ══ MÀN HÌNH MẶC ĐỊNH ══ */
              <div className="so-default">

                {/* Lịch sử tìm kiếm */}
                {history.length > 0 && (
                  <div className="so-section">
                    <div className="so-section-title">
                      <Clock size={13} /> Tìm kiếm gần đây
                    </div>
                    <div className="so-history-list">
                      {history.map(item => (
                        <button
                          key={item.term}
                          type="button"
                          className="so-history-row"
                          onClick={() => setQuery(item.term)}
                        >
                          <Clock size={13} className="so-history-icon" />
                          <span className="so-history-term">{item.term}</span>
                          <span className="so-history-time">{relativeTime(item.ts)}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            className="so-history-remove"
                            onClick={e => removeHistoryItem(e, item.term)}
                            onKeyDown={e => { if (e.key === "Enter") removeHistoryItem(e, item.term); }}
                            aria-label={`Xoá "${item.term}"`}
                          >
                            <X size={11} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Truy cập nhanh (auth) hoặc prompt đăng nhập */}
                {isAuthenticated ? (
                  <div className="so-section">
                    <div className="so-section-title">
                      <Zap size={13} /> Truy cập nhanh
                    </div>
                    <div className="so-quick-grid">
                      {quickAccessPages.map(page => {
                        const Icon = page.icon;
                        const active = location.pathname === page.path;
                        return (
                          <button
                            key={page.id}
                            type="button"
                            className={`so-quick-card ${active ? "so-quick-card-active" : ""}`}
                            onClick={() => { navigate(page.path); onClose(); }}
                          >
                            <span className="so-quick-icon"><Icon size={17} /></span>
                            <span className="so-quick-label">{page.label}</span>
                            {active && <span className="so-badge-current">Đang xem</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="so-login-prompt">
                    <LogIn size={16} />
                    <p><strong>Đăng nhập</strong> để truy cập nhanh hồ sơ, đơn hàng và sản phẩm yêu thích</p>
                    <button type="button" onClick={() => { navigate("/login"); onClose(); }}>
                      Đăng nhập
                    </button>
                  </div>
                )}

                {/* Trending */}
                <div className="so-section">
                  <div className="so-section-title">
                    <TrendingUp size={13} /> Tìm kiếm phổ biến
                  </div>
                  <div className="so-chip-row">
                    {TRENDING.map(t => (
                      <button key={t} type="button" className="so-chip" onClick={() => setQuery(t)}>{t}</button>
                    ))}
                  </div>
                </div>

                {/* Quick categories */}
                <div className="so-section">
                  <div className="so-section-title">Khám phá theo danh mục</div>
                  <div className="so-cat-list">
                    {QUICK_CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className="so-cat-row"
                          onClick={() => { navigate(`/shop?category=${cat.id}`); onClose(); }}
                        >
                          <span className="so-cat-icon"><Icon size={18} /></span>
                          <span className="so-cat-info">
                            <span className="so-cat-label">{cat.label}</span>
                            <span className="so-cat-desc">{cat.desc}</span>
                          </span>
                          <ArrowRight size={14} className="so-cat-arrow" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* ══ MÀN HÌNH KẾT QUẢ ══ */
              <>
                {/* Kết quả trang — hiện ngay, không loading */}
                {matchedPages.length > 0 && (
                  <div className="so-section">
                    <div className="so-section-title">
                      <LayoutGrid size={13} /> Trang & chức năng
                    </div>
                    <div className="so-page-list" role="listbox">
                      {matchedPages.map((page, i) => {
                        const Icon = page.icon;
                        const isActive = i === activeIndex;
                        const isCurrent = !page.action && location.pathname === page.path;
                        return (
                          <button
                            key={page.id}
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            className={`so-page-row ${isActive ? "so-row-active" : ""} ${page.action === "logout" ? "so-row-logout" : ""}`}
                            onMouseEnter={() => setActiveIndex(i)}
                            onClick={() => handleActivate({ ...page, _type: "page" })}
                          >
                            <span className="so-page-icon"><Icon size={16} /></span>
                            <span className="so-page-info">
                              <span className="so-page-label"><Highlight text={page.label} query={query} /></span>
                              <span className="so-page-desc">{page.desc}</span>
                            </span>
                            {isCurrent && <span className="so-badge-current">Đang xem</span>}
                            <ArrowRight size={13} className="so-row-arrow" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Kết quả sản phẩm */}
                {loading ? (
                  <div className="so-section">
                    {matchedPages.length > 0 && <div className="so-section-title">Sản phẩm</div>}
                    <div className="so-loading-label">
                      <span className="so-spinner" />
                      Đang tìm sản phẩm cho &ldquo;{query.trim()}&rdquo;...
                    </div>
                    <div className="so-skeleton-list">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="so-skeleton-row">
                          <div className="so-skeleton-thumb" />
                          <div className="so-skeleton-lines">
                            <div className="so-skeleton-line" style={{ width: `${60 + i * 12}%` }} />
                            <div className="so-skeleton-line so-skeleton-short" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : apiError ? (
                  <div className="so-error-state">
                    <SearchX size={28} />
                    <p>Không thể kết nối máy chủ. Vui lòng thử lại.</p>
                    <button type="button" onClick={() => setQuery(q => q + " ")}>Thử lại</button>
                  </div>
                ) : results.length > 0 ? (
                  <div className="so-section">
                    {matchedPages.length > 0 && <div className="so-section-title">Sản phẩm</div>}
                    <div className="so-product-list" role="listbox">
                      {results.map((book, i) => {
                        const flatIdx = matchedPages.length + i;
                        const isActive = flatIdx === activeIndex;
                        const title = book.title ?? book.name ?? "";
                        const cover = book.coverImage ?? book.cover ?? null;
                        return (
                          <button
                            key={book.id ?? book.hashId}
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            className={`so-product-row ${isActive ? "so-row-active" : ""}`}
                            onMouseEnter={() => setActiveIndex(flatIdx)}
                            onClick={() => handleActivate({ ...book, _type: "product" })}
                          >
                            <span className="so-product-thumb" aria-hidden>
                              {cover
                                ? <img src={cover} alt="" />
                                : <span className="so-product-thumb-letter">{title.charAt(0)}</span>
                              }
                            </span>
                            <span className="so-product-info">
                              <span className="so-product-name"><Highlight text={title} query={query} /></span>
                              <span className="so-product-meta">
                                {book.category && <span className="so-tag">{categoryLabel(book.category)}</span>}
                                {book.ageRange && <span className="so-age">{book.ageRange}</span>}
                              </span>
                            </span>
                            <span className="so-product-price">{formatPrice(book.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : matchedPages.length === 0 ? (
                  <div className="so-empty">
                    <SearchX size={32} className="so-empty-icon" />
                    <p className="so-empty-title">Không có kết quả cho &ldquo;{query.trim()}&rdquo;</p>
                    <p className="so-empty-sub">Thử từ khoá khác hoặc kiểm tra chính tả</p>
                    <div className="so-chip-row so-chip-row-center">
                      {TRENDING.slice(0, 4).map(t => (
                        <button key={t} type="button" className="so-chip" onClick={() => setQuery(t)}>{t}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="so-no-product">Không có sản phẩm khớp với &ldquo;{query.trim()}&rdquo;</p>
                )}
              </>
            )}
          </div>

          {/* ── FOOTER ── */}
          {hasQuery && !loading && results.length > 0 && (
            <div className="so-footer">
              <button type="button" className="so-view-all" onClick={handleSubmit}>
                Xem tất cả kết quả cho &ldquo;{query.trim()}&rdquo;
                <ArrowRight size={14} />
              </button>
              <span className="so-footer-hint">
                <kbd>↑</kbd><kbd>↓</kbd> di chuyển &nbsp;·&nbsp; <kbd>↵</kbd> chọn &nbsp;·&nbsp; <kbd>ESC</kbd> đóng
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════
   CSS — EARTHORIA SEARCH OVERLAY
   Design: dark glass panel, green accent (#3ecf4d),
   Inter font, micro-animations, accessible focus rings
   ════════════════════════════════════════════════ */

const CSS = `
/* ── Variables ── */
.so-backdrop {
  --so-bg:          rgba(10, 14, 20, 0.72);
  --so-panel-bg:    #0e1117;
  --so-panel-bd:    rgba(255,255,255,0.08);
  --so-surface:     rgba(255,255,255,0.04);
  --so-surface-hov: rgba(255,255,255,0.07);
  --so-accent:      #3ecf4d;
  --so-accent-dim:  rgba(62,207,77,0.15);
  --so-text-1:      #f0f0f0;
  --so-text-2:      #8a8f98;
  --so-text-3:      #555c68;
  --so-red:         #ef4444;
  --so-radius:      14px;
  --so-radius-sm:   8px;
  --so-transition:  0.18s cubic-bezier(.4,0,.2,1);
}

/* ── Backdrop ── */
.so-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 5vh 16px 24px;
  background: var(--so-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--so-transition);
}
.so-backdrop.so-open {
  opacity: 1;
  pointer-events: all;
}

/* ── Panel ── */
.so-panel {
  width: 100%;
  max-width: 660px;
  background: var(--so-panel-bg);
  border: 1px solid var(--so-panel-bd);
  border-radius: var(--so-radius);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.04),
    0 24px 64px rgba(0,0,0,0.65),
    0 0 48px rgba(62,207,77,0.04);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  overflow: hidden;
  transform: translateY(-8px) scale(0.985);
  transition: transform var(--so-transition);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
.so-backdrop.so-open .so-panel {
  transform: translateY(0) scale(1);
}

/* ── Header ── */
.so-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--so-panel-bd);
  flex-shrink: 0;
}
.so-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--so-surface);
  border: 1px solid var(--so-panel-bd);
  border-radius: var(--so-radius-sm);
  padding: 0 12px;
  gap: 10px;
  transition: border-color var(--so-transition), box-shadow var(--so-transition);
}
.so-input-wrap:focus-within {
  border-color: var(--so-accent);
  box-shadow: 0 0 0 3px var(--so-accent-dim);
}
.so-input-icon { color: var(--so-text-2); flex-shrink: 0; }
.so-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--so-text-1);
  font-size: 15px;
  font-family: inherit;
  padding: 11px 0;
  caret-color: var(--so-accent);
}
.so-input::placeholder { color: var(--so-text-3); }
.so-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--so-text-2);
  background: var(--so-surface);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  transition: color var(--so-transition), background var(--so-transition);
  flex-shrink: 0;
}
.so-clear:hover { color: var(--so-text-1); background: var(--so-surface-hov); }
.so-close-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 11px;
  background: var(--so-surface);
  border: 1px solid var(--so-panel-bd);
  border-radius: var(--so-radius-sm);
  color: var(--so-text-2);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--so-transition), background var(--so-transition);
}
.so-close-btn:hover { color: var(--so-text-1); background: var(--so-surface-hov); }

/* ── Category pills ── */
.so-pills {
  display: flex;
  gap: 6px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--so-panel-bd);
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.so-pills::-webkit-scrollbar { display: none; }
.so-pill {
  padding: 5px 14px;
  border-radius: 99px;
  font-size: 12.5px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--so-panel-bd);
  background: var(--so-surface);
  color: var(--so-text-2);
  white-space: nowrap;
  transition: all var(--so-transition);
}
.so-pill:hover { color: var(--so-text-1); background: var(--so-surface-hov); }
.so-pill-active {
  background: var(--so-accent-dim);
  border-color: var(--so-accent);
  color: var(--so-accent);
}

/* ── Body ── */
.so-body {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: var(--so-surface-hov) transparent;
}
.so-body::-webkit-scrollbar { width: 4px; }
.so-body::-webkit-scrollbar-thumb { background: var(--so-surface-hov); border-radius: 4px; }

/* ── Section ── */
.so-section { padding: 14px 14px 4px; }
.so-section + .so-section { padding-top: 2px; }
.so-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--so-text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

/* ── History ── */
.so-history-list { display: flex; flex-direction: column; gap: 1px; }
.so-history-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--so-radius-sm);
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background var(--so-transition);
  font-family: inherit;
}
.so-history-row:hover { background: var(--so-surface-hov); }
.so-history-icon { color: var(--so-text-3); flex-shrink: 0; }
.so-history-term { flex: 1; font-size: 13.5px; color: var(--so-text-1); }
.so-history-time { font-size: 11px; color: var(--so-text-3); white-space: nowrap; }
.so-history-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: var(--so-text-3);
  cursor: pointer;
  transition: color var(--so-transition), background var(--so-transition);
  flex-shrink: 0;
}
.so-history-remove:hover { color: var(--so-red); background: rgba(239,68,68,0.1); }

/* ── Quick access grid ── */
.so-quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}
.so-quick-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--so-radius-sm);
  background: var(--so-surface);
  border: 1px solid var(--so-panel-bd);
  cursor: pointer;
  transition: all var(--so-transition);
  font-family: inherit;
  text-align: left;
  position: relative;
  overflow: hidden;
}
.so-quick-card:hover {
  background: var(--so-surface-hov);
  border-color: rgba(255,255,255,0.13);
  transform: translateY(-1px);
}
.so-quick-card-active {
  border-color: var(--so-accent);
  background: var(--so-accent-dim);
}
.so-quick-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--so-accent-dim);
  color: var(--so-accent);
  flex-shrink: 0;
}
.so-quick-label { font-size: 13px; font-weight: 500; color: var(--so-text-1); }

/* ── Login prompt ── */
.so-login-prompt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin: 0 14px 4px;
  background: var(--so-accent-dim);
  border: 1px solid rgba(62,207,77,0.25);
  border-radius: var(--so-radius-sm);
  color: var(--so-text-2);
  font-size: 13px;
}
.so-login-prompt svg { color: var(--so-accent); flex-shrink: 0; }
.so-login-prompt p { flex: 1; margin: 0; line-height: 1.5; }
.so-login-prompt strong { color: var(--so-text-1); }
.so-login-prompt button {
  padding: 7px 14px;
  background: var(--so-accent);
  color: #0e1117;
  border: none;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: opacity var(--so-transition);
}
.so-login-prompt button:hover { opacity: 0.88; }

/* ── Chips / Trending ── */
.so-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.so-chip-row-center { justify-content: center; }
.so-chip {
  padding: 5px 13px;
  border-radius: 99px;
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
  background: var(--so-surface);
  border: 1px solid var(--so-panel-bd);
  color: var(--so-text-2);
  transition: all var(--so-transition);
}
.so-chip:hover {
  color: var(--so-accent);
  border-color: var(--so-accent);
  background: var(--so-accent-dim);
}

/* ── Category rows ── */
.so-cat-list { display: flex; flex-direction: column; gap: 2px; }
.so-cat-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px;
  border-radius: var(--so-radius-sm);
  background: none;
  border: none;
  cursor: pointer;
  transition: background var(--so-transition);
  font-family: inherit;
  width: 100%;
  text-align: left;
}
.so-cat-row:hover { background: var(--so-surface-hov); }
.so-cat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px; height: 34px;
  border-radius: 8px;
  background: var(--so-surface);
  border: 1px solid var(--so-panel-bd);
  color: var(--so-accent);
  flex-shrink: 0;
}
.so-cat-info { display: flex; flex-direction: column; flex: 1; }
.so-cat-label { font-size: 13.5px; font-weight: 500; color: var(--so-text-1); }
.so-cat-desc { font-size: 12px; color: var(--so-text-2); margin-top: 1px; }
.so-cat-arrow { color: var(--so-text-3); flex-shrink: 0; transition: transform var(--so-transition); }
.so-cat-row:hover .so-cat-arrow { transform: translateX(3px); color: var(--so-accent); }

/* ── Page results ── */
.so-page-list { display: flex; flex-direction: column; gap: 1px; }
.so-page-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: var(--so-radius-sm);
  background: none;
  border: none;
  cursor: pointer;
  transition: background var(--so-transition);
  font-family: inherit;
  width: 100%;
  text-align: left;
}
.so-page-row:hover { background: var(--so-surface); }
.so-row-active { background: var(--so-surface) !important; outline: 1px solid var(--so-accent); }
.so-row-logout .so-page-icon,
.so-row-logout .so-page-label { color: var(--so-red) !important; }
.so-page-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px; height: 30px;
  border-radius: 7px;
  background: var(--so-surface);
  border: 1px solid var(--so-panel-bd);
  color: var(--so-accent);
  flex-shrink: 0;
}
.so-page-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.so-page-label { font-size: 13.5px; font-weight: 500; color: var(--so-text-1); }
.so-page-desc { font-size: 12px; color: var(--so-text-2); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.so-row-arrow { color: var(--so-text-3); flex-shrink: 0; transition: transform var(--so-transition); opacity: 0; }
.so-page-row:hover .so-row-arrow,
.so-row-active .so-row-arrow { opacity: 1; transform: translateX(2px); color: var(--so-accent); }

/* ── Badges ── */
.so-badge-current {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 99px;
  background: var(--so-accent-dim);
  color: var(--so-accent);
  border: 1px solid rgba(62,207,77,0.3);
  white-space: nowrap;
}

/* ── Product results ── */
.so-product-list { display: flex; flex-direction: column; gap: 1px; }
.so-product-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-radius: var(--so-radius-sm);
  background: none;
  border: none;
  cursor: pointer;
  transition: background var(--so-transition);
  font-family: inherit;
  width: 100%;
  text-align: left;
}
.so-product-row:hover { background: var(--so-surface); }
.so-product-thumb {
  width: 40px; height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--so-surface);
  border: 1px solid var(--so-panel-bd);
  display: flex;
  align-items: center;
  justify-content: center;
}
.so-product-thumb img { width: 100%; height: 100%; object-fit: cover; }
.so-product-thumb-letter {
  font-size: 16px;
  font-weight: 700;
  color: var(--so-accent);
  text-transform: uppercase;
}
.so-product-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.so-product-name { font-size: 13.5px; font-weight: 500; color: var(--so-text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.so-product-meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
.so-tag {
  font-size: 11px;
  padding: 1.5px 7px;
  border-radius: 99px;
  background: var(--so-accent-dim);
  color: var(--so-accent);
  font-weight: 500;
}
.so-age { font-size: 11px; color: var(--so-text-3); }
.so-product-price {
  font-size: 13px;
  font-weight: 600;
  color: var(--so-accent);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Mark highlight ── */
.so-mark {
  background: rgba(62,207,77,0.22);
  color: var(--so-accent);
  border-radius: 3px;
  padding: 0 1px;
}

/* ── Loading ── */
.so-loading-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--so-text-2);
  padding: 6px 10px 10px;
}
.so-spinner {
  width: 14px; height: 14px;
  border: 2px solid var(--so-surface-hov);
  border-top-color: var(--so-accent);
  border-radius: 50%;
  animation: so-spin 0.6s linear infinite;
  flex-shrink: 0;
}
@keyframes so-spin { to { transform: rotate(360deg); } }
.so-skeleton-list { display: flex; flex-direction: column; gap: 6px; padding: 0 10px; }
.so-skeleton-row { display: flex; align-items: center; gap: 12px; padding: 4px 0; }
.so-skeleton-thumb {
  width: 40px; height: 40px;
  border-radius: 8px;
  background: var(--so-surface);
  flex-shrink: 0;
  animation: so-pulse 1.4s ease-in-out infinite;
}
.so-skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 7px; }
.so-skeleton-line {
  height: 11px;
  border-radius: 6px;
  background: var(--so-surface);
  animation: so-pulse 1.4s ease-in-out infinite;
}
.so-skeleton-short { width: 40% !important; }
@keyframes so-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

/* ── Empty / Error ── */
.so-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 16px 24px;
  gap: 8px;
  text-align: center;
}
.so-empty-icon { color: var(--so-text-3); margin-bottom: 6px; }
.so-empty-title { font-size: 14.5px; font-weight: 600; color: var(--so-text-1); margin: 0; }
.so-empty-sub { font-size: 13px; color: var(--so-text-2); margin: 0 0 12px; }

.so-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 30px 16px;
  text-align: center;
  color: var(--so-text-2);
  font-size: 13.5px;
}
.so-error-state svg { color: var(--so-red); }
.so-error-state button {
  padding: 7px 16px;
  background: var(--so-surface);
  border: 1px solid var(--so-panel-bd);
  border-radius: var(--so-radius-sm);
  color: var(--so-text-1);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background var(--so-transition);
}
.so-error-state button:hover { background: var(--so-surface-hov); }

.so-no-product {
  font-size: 13px;
  color: var(--so-text-3);
  text-align: center;
  padding: 8px 16px 16px;
  margin: 0;
}

/* ── Footer ── */
.so-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1px solid var(--so-panel-bd);
  flex-shrink: 0;
}
.so-view-all {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--so-accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: var(--so-radius-sm);
  transition: background var(--so-transition);
}
.so-view-all:hover { background: var(--so-accent-dim); }
.so-footer-hint {
  font-size: 11px;
  color: var(--so-text-3);
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.so-footer-hint kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: var(--so-surface);
  border: 1px solid var(--so-panel-bd);
  border-radius: 4px;
  font-size: 10px;
  font-family: inherit;
  color: var(--so-text-2);
}

/* ── Default state wrapper ── */
.so-default { padding-bottom: 12px; }

/* ── Focus visible ── */
.so-panel button:focus-visible {
  outline: 2px solid var(--so-accent);
  outline-offset: 2px;
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .so-panel, .so-backdrop, .so-spinner { transition: none; animation: none; }
}

/* ── Mobile ── */
@media (max-width: 480px) {
  .so-backdrop { padding: 0; align-items: flex-end; }
  .so-panel {
    max-height: 92vh;
    border-radius: var(--so-radius) var(--so-radius) 0 0;
    transform: translateY(20px);
  }
  .so-backdrop.so-open .so-panel { transform: translateY(0); }
  .so-footer-hint { display: none; }
  .so-quick-grid { grid-template-columns: 1fr; }
}
`;