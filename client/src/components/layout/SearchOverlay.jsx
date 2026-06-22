import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  ArrowRight,
  SearchX,
  BookOpen,
  Boxes,
  Sparkles,
  Tag,
  LayoutGrid,
  User,
  Package,
  Heart,
  ShoppingCart,
  Settings,
  Home,
  Store,
  Info,
  ShieldCheck,
  LogOut,
  LogIn,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════
   CẤU HÌNH — chỉnh sửa tại đây cho khớp với dữ liệu thực tế
   ════════════════════════════════════════════════════════════ */

// Danh mục sản phẩm hiển thị trên thanh filter. "id" phải khớp
// với field `category` trả về từ API sản phẩm của bạn.
const CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "book", label: "Sách AR" },
  { id: "kit", label: "Bộ dụng cụ" },
  { id: "ar", label: "Trải nghiệm AR" },
  { id: "accessory", label: "Phụ kiện" },
];

const QUICK_CATEGORIES = [
  { id: "book", label: "Sách AR", desc: "Câu chuyện sống động", icon: BookOpen },
  { id: "kit", label: "Bộ dụng cụ", desc: "Học mà chơi, chơi mà học", icon: Boxes },
  { id: "ar", label: "Trải nghiệm AR", desc: "Khám phá thế giới 3D", icon: Sparkles },
  { id: "accessory", label: "Phụ kiện", desc: "Kính AR, túi, thẻ bài", icon: Tag },
];

const TRENDING_SEARCHES = [
  "khủng long",
  "bé 3 tuổi",
  "hệ mặt trời",
  "kính AR",
  "flashcard động vật",
];

// Các trang / chức năng có thể tìm thấy qua ô search (giống Cmd+K).
// Sửa "path" cho khớp route thật của bạn. type "action" dùng cho
// thao tác không phải điều hướng (ví dụ đăng xuất).
const PUBLIC_PAGES = [
  { id: "home", label: "Trang chủ", desc: "Quay lại trang chủ", icon: Home, path: "/home", keywords: ["trang chu", "home"] },
  { id: "shop", label: "Cửa hàng", desc: "Khám phá tất cả sản phẩm", icon: Store, path: "/shop", keywords: ["cua hang", "shop", "san pham", "mua sam"] },
  { id: "ar", label: "Công nghệ AR", desc: "Tìm hiểu trải nghiệm thực tế ảo", icon: Sparkles, path: "/ar", keywords: ["cong nghe", "ar", "thuc te ao"] },
  { id: "about", label: "Về chúng tôi", desc: "Câu chuyện thương hiệu Earthoria", icon: Info, path: "/about", keywords: ["ve chung toi", "about", "gioi thieu", "cau chuyen"] },
];
const AUTH_PAGES = [
  { id: "profile", label: "Hồ sơ của tôi", desc: "Thông tin & tài khoản cá nhân", icon: User, path: "/profile", keywords: ["ho so", "profile", "tai khoan", "thong tin ca nhan"] },
  { id: "orders", label: "Đơn hàng", desc: "Lịch sử & trạng thái đơn hàng", icon: Package, path: "/orders", keywords: ["don hang", "orders", "lich su mua hang", "theo doi don hang"] },
  { id: "wishlist", label: "Sản phẩm yêu thích", desc: "Danh sách bạn đã lưu", icon: Heart, path: "/wishlist", keywords: ["yeu thich", "wishlist", "da luu"] },
  { id: "cart", label: "Giỏ hàng", desc: "Xem giỏ hàng hiện tại", icon: ShoppingCart, path: "/cart", keywords: ["gio hang", "cart"] },
  // TODO: đổi path nếu bạn có trang /settings riêng (đang trỏ tạm về /profile)
  { id: "settings", label: "Cài đặt tài khoản", desc: "Đổi mật khẩu, thông tin liên hệ", icon: Settings, path: "/profile", keywords: ["cai dat", "settings", "doi mat khau", "bao mat"] },
];
const ADMIN_PAGES = [
  { id: "admin", label: "Trang quản trị", desc: "Quản lý sản phẩm & đơn hàng", icon: ShieldCheck, path: "/admin", keywords: ["admin", "quan tri", "quan ly"] },
];
const LOGOUT_PAGE = {
  id: "logout",
  label: "Đăng xuất",
  desc: "Thoát khỏi tài khoản hiện tại",
  icon: LogOut,
  action: "logout",
  keywords: ["dang xuat", "logout", "thoat"],
};

const RECENT_SEARCH_KEY = "earthoria_recent_searches";
const MAX_RECENT = 6;
const MAX_PAGE_RESULTS = 5;

// Dữ liệu mẫu — XOÁ khi đã nối với API thật.
const MOCK_PRODUCTS = [
  { id: "p1", name: "Sách AR Khủng Long Kỷ Jura", category: "book", price: 249000, ageRange: "5-8 tuổi" },
  { id: "p2", name: "Bộ thẻ học Bảng chữ cái AR", category: "kit", price: 189000, ageRange: "3-5 tuổi" },
  { id: "p3", name: "Sách AR Hệ Mặt Trời", category: "book", price: 269000, ageRange: "6-10 tuổi" },
  { id: "p4", name: "Trải nghiệm AR Đại Dương Kỳ Thú", category: "ar", price: 0, ageRange: "4-9 tuổi" },
  { id: "p5", name: "Bộ xếp hình Kiến Trúc Thế Giới", category: "kit", price: 329000, ageRange: "7-12 tuổi" },
  { id: "p6", name: "Sách AR Vương Quốc Côn Trùng", category: "book", price: 249000, ageRange: "5-9 tuổi" },
  { id: "p7", name: "Flashcard AR Động Vật Hoang Dã", category: "kit", price: 159000, ageRange: "2-5 tuổi" },
  { id: "p8", name: "Kính AR Earthoria Explorer", category: "accessory", price: 459000, ageRange: "6 tuổi+" },
  { id: "p9", name: "Túi Đeo Earthoria Limited", category: "accessory", price: 199000, ageRange: "Mọi lứa tuổi" },
  { id: "p10", name: "Sách AR Cơ Thể Người Kỳ Diệu", category: "book", price: 279000, ageRange: "6-11 tuổi" },
];

/**
 * Hàm tìm kiếm sản phẩm — THAY THẾ bằng API thật khi tích hợp:
 *
 *   const { data } = await axios.get("/api/products/search", {
 *     params: { q: query, category: category === "all" ? undefined : category },
 *   });
 *   return data.results;
 */
async function searchProducts(query, category) {
  await new Promise((r) => setTimeout(r, 280)); // mô phỏng độ trễ mạng — xoá khi dùng API thật
  const nq = normalizeVN(query.trim());
  return MOCK_PRODUCTS.filter((p) => {
    const matchCategory = category === "all" || p.category === category;
    const matchQuery = normalizeVN(p.name).includes(nq);
    return matchCategory && matchQuery;
  });
}

/* ── Tiện ích ── */

// Chuẩn hoá tiếng Việt có dấu -> không dấu, GIỮ NGUYÊN độ dài chuỗi
// để highlight theo index vẫn chính xác trên chuỗi gốc.
const VN_MAP = {
  à: "a", á: "a", ạ: "a", ả: "a", ã: "a", â: "a", ầ: "a", ấ: "a", ậ: "a", ẩ: "a", ẫ: "a", ă: "a", ằ: "a", ắ: "a", ặ: "a", ẳ: "a", ẵ: "a",
  è: "e", é: "e", ẹ: "e", ẻ: "e", ẽ: "e", ê: "e", ề: "e", ế: "e", ệ: "e", ể: "e", ễ: "e",
  ì: "i", í: "i", ị: "i", ỉ: "i", ĩ: "i",
  ò: "o", ó: "o", ọ: "o", ỏ: "o", õ: "o", ô: "o", ồ: "o", ố: "o", ộ: "o", ổ: "o", ỗ: "o", ơ: "o", ờ: "o", ớ: "o", ợ: "o", ở: "o", ỡ: "o",
  ù: "u", ú: "u", ụ: "u", ủ: "u", ũ: "u", ư: "u", ừ: "u", ứ: "u", ự: "u", ử: "u", ữ: "u",
  ỳ: "y", ý: "y", ỵ: "y", ỷ: "y", ỹ: "y",
  đ: "d",
};
function normalizeVN(str) {
  return str
    .toLowerCase()
    .split("")
    .map((ch) => VN_MAP[ch] || ch)
    .join("");
}

function formatPrice(value) {
  if (!value) return "Miễn phí trải nghiệm";
  return value.toLocaleString("vi-VN") + "đ";
}

function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || id;
}

function highlightMatch(text, query) {
  if (!query.trim()) return text;
  const idx = normalizeVN(text).indexOf(normalizeVN(query.trim()));
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.trim().length)}</mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

function loadRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term) {
  if (!term.trim()) return [];
  try {
    const current = loadRecentSearches().filter(
      (t) => t.toLowerCase() !== term.trim().toLowerCase()
    );
    const next = [term.trim(), ...current].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

/**
 * SearchOverlay — khung tìm kiếm kiểu command palette.
 * Tìm được cả SẢN PHẨM lẫn TRANG/CHỨC NĂNG (hồ sơ, đơn hàng, cài đặt...).
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onOpen: () => void (tuỳ chọn) — bật phím tắt "/" và Ctrl/Cmd+K
 *  - isAuthenticated: boolean — quyết định có hiện Hồ sơ/Đơn hàng/Giỏ hàng... không
 *  - isAdmin: boolean — có hiện "Trang quản trị" không
 *  - onLogout: () => void — gọi khi người dùng chọn kết quả "Đăng xuất"
 *  - getProductLink: (product) => string — đường dẫn tới trang chi tiết sản phẩm
 */
export default function SearchOverlay({
  isOpen,
  onClose,
  onOpen,
  isAuthenticated = false,
  isAdmin = false,
  onLogout,
  getProductLink = (p) => `/product/${p.id}`,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);

  const hasQuery = query.trim().length > 0;

  /* ── Danh sách trang khả dụng theo trạng thái đăng nhập ── */
  const availablePages = useMemo(() => {
    const pages = [...(isAuthenticated ? AUTH_PAGES : []), ...PUBLIC_PAGES];
    if (isAuthenticated && isAdmin) pages.push(...ADMIN_PAGES);
    if (isAuthenticated) pages.push(LOGOUT_PAGE);
    return pages;
  }, [isAuthenticated, isAdmin]);

  const matchedPages = useMemo(() => {
    if (!hasQuery) return [];
    const nq = normalizeVN(query.trim());
    return availablePages
      .filter((p) => {
        const haystack = normalizeVN(`${p.label} ${p.desc} ${(p.keywords || []).join(" ")}`);
        return haystack.includes(nq);
      })
      .slice(0, MAX_PAGE_RESULTS);
  }, [hasQuery, query, availablePages]);

  const flatItems = useMemo(
    () => [
      ...matchedPages.map((p) => ({ ...p, type: "page" })),
      ...results.map((r) => ({ ...r, type: "product" })),
    ],
    [matchedPages, results]
  );

  /* ── Khoá scroll nền + nạp lịch sử tìm kiếm khi mở ── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setRecentSearches(loadRecentSearches());
      const t = setTimeout(() => inputRef.current?.focus(), 260);
      return () => clearTimeout(t);
    }
    document.body.style.overflow = "";
  }, [isOpen]);

  /* ── Reset trạng thái mỗi lần đóng (để lần mở sau gọn gàng) ── */
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setQuery("");
        setActiveCategory("all");
        setResults([]);
        setActiveIndex(-1);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* ── Debounce tìm kiếm sản phẩm ── */
  useEffect(() => {
    if (!hasQuery) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const data = await searchProducts(query, activeCategory);
      setResults(data);
      setLoading(false);
    }, 320);
    return () => clearTimeout(t);
  }, [query, activeCategory, hasQuery]);

  /* ── activeIndex luôn nằm trong giới hạn danh sách kết hợp ── */
  useEffect(() => {
    setActiveIndex(-1);
  }, [query, activeCategory]);

  const handleActivate = useCallback(
    (item) => {
      if (!item) return;
      if (item.type === "page") {
        if (item.action === "logout") {
          onLogout?.();
          onClose();
          return;
        }
        navigate(item.path);
        onClose();
        return;
      }
      setRecentSearches(saveRecentSearch(query));
      navigate(getProductLink(item));
      onClose();
    },
    [query, navigate, getProductLink, onClose, onLogout]
  );

  const handleSubmit = useCallback(() => {
    if (!hasQuery) return;
    setRecentSearches(saveRecentSearch(query));
    const params = new URLSearchParams({ search: query.trim() });
    if (activeCategory !== "all") params.set("category", activeCategory);
    navigate(`/shop?${params.toString()}`);
    onClose();
  }, [hasQuery, query, activeCategory, navigate, onClose]);

  /* ── Phím tắt: ESC đóng, mũi tên di chuyển, Enter chọn, "/" và Ctrl/Cmd+K mở ── */
  useEffect(() => {
    function handleKeydown(e) {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;

      if (isOpen) {
        if (e.key === "Escape") {
          onClose();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, -1));
        } else if (e.key === "Enter") {
          if (activeIndex >= 0 && flatItems[activeIndex]) {
            handleActivate(flatItems[activeIndex]);
          } else if (hasQuery) {
            handleSubmit();
          }
        }
        return;
      }

      if (!isTyping && onOpen) {
        if (e.key === "/") {
          e.preventDefault();
          onOpen();
        } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          onOpen();
        }
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isOpen, activeIndex, flatItems, hasQuery, handleActivate, handleSubmit, onClose, onOpen]);

  const handleChipClick = (term) => setQuery(term);

  const removeRecent = (e, term) => {
    e.stopPropagation();
    const next = recentSearches.filter((t) => t !== term);
    setRecentSearches(next);
    try {
      localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
    } catch {
      /* no-op */
    }
  };

  const quickAccessPages = isAuthenticated ? AUTH_PAGES.slice(0, 4) : [];

  return (
    <div
      className={`search-overlay-backdrop ${isOpen ? "open" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-hidden={!isOpen}
    >
      <div className="search-panel" role="dialog" aria-modal="true" aria-label="Tìm kiếm sản phẩm và chức năng">
        {/* Header: input + nút đóng */}
        <div className="search-panel-header">
          <div className="search-input-wrap">
            <Search size={20} className="search-input-icon" />
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Tìm sản phẩm, hồ sơ, đơn hàng, cài đặt..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm kiếm sản phẩm, hồ sơ, đơn hàng, cài đặt"
              autoComplete="off"
            />
            {hasQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Xoá nội dung tìm kiếm"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button type="button" className="search-close-btn" onClick={onClose} aria-label="Đóng tìm kiếm">
            <X size={18} />
            <span className="search-close-label">Đóng</span>
          </button>
        </div>

        <p className="search-panel-hint">
          Tìm sản phẩm theo tên hoặc độ tuổi — hoặc gõ thẳng{" "}
          <em>"hồ sơ"</em>, <em>"đơn hàng"</em>, <em>"cài đặt"</em> để đi nhanh tới trang đó
        </p>

        {/* Bộ lọc danh mục sản phẩm */}
        <div className="search-category-tabs" role="tablist" aria-label="Lọc theo danh mục sản phẩm">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat.id}
              className={`pill search-cat-pill ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Nội dung chính */}
        <div className="search-panel-body">
          {!hasQuery ? (
            <div className="search-default-state">
              {recentSearches.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    <Clock size={14} /> Tìm kiếm gần đây
                  </div>
                  <div className="search-chip-row">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        className="search-chip search-chip-recent"
                        onClick={() => handleChipClick(term)}
                      >
                        {term}
                        <X size={12} className="search-chip-remove" onClick={(e) => removeRecent(e, term)} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isAuthenticated ? (
                <div className="search-section">
                  <div className="search-section-title">
                    <LayoutGrid size={14} /> Truy cập nhanh
                  </div>
                  <div className="search-quick-cats">
                    {quickAccessPages.map((page) => {
                      const Icon = page.icon;
                      const isCurrent = location.pathname === page.path;
                      return (
                        <button
                          key={page.id}
                          type="button"
                          className="search-quick-cat-card"
                          onClick={() => handleActivate({ ...page, type: "page" })}
                        >
                          <span className="search-quick-cat-icon">
                            <Icon size={20} />
                          </span>
                          <span className="search-quick-cat-text">
                            <span className="search-quick-cat-label">
                              {page.label}
                              {isCurrent && <span className="search-page-current">Đang xem</span>}
                            </span>
                            <span className="search-quick-cat-desc">{page.desc}</span>
                          </span>
                          <ArrowRight size={16} className="search-quick-cat-arrow" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="search-login-prompt">
                  <LogIn size={18} />
                  <div className="search-login-prompt-text">
                    <strong>Đăng nhập</strong> để truy cập nhanh hồ sơ, đơn hàng và sản phẩm yêu thích
                  </div>
                  <button
                    type="button"
                    className="search-login-prompt-btn"
                    onClick={() => {
                      navigate("/login");
                      onClose();
                    }}
                  >
                    Đăng nhập
                  </button>
                </div>
              )}

              <div className="search-section">
                <div className="search-section-title">
                  <TrendingUp size={14} /> Tìm kiếm phổ biến
                </div>
                <div className="search-chip-row">
                  {TRENDING_SEARCHES.map((term) => (
                    <button key={term} type="button" className="search-chip" onClick={() => handleChipClick(term)}>
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <div className="search-section">
                <div className="search-section-title">Khám phá theo danh mục</div>
                <div className="search-quick-cats">
                  {QUICK_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className="search-quick-cat-card"
                        onClick={() => {
                          navigate(`/shop?category=${cat.id}`);
                          onClose();
                        }}
                      >
                        <span className="search-quick-cat-icon">
                          <Icon size={20} />
                        </span>
                        <span className="search-quick-cat-text">
                          <span className="search-quick-cat-label">{cat.label}</span>
                          <span className="search-quick-cat-desc">{cat.desc}</span>
                        </span>
                        <ArrowRight size={16} className="search-quick-cat-arrow" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Kết quả trang & chức năng — hiện ngay lập tức, không cần chờ */}
              {matchedPages.length > 0 && (
                <div className="search-section search-section-pages">
                  <div className="search-section-title">
                    <LayoutGrid size={14} /> Trang & chức năng
                  </div>
                  <div className="search-page-list">
                    {matchedPages.map((page, i) => {
                      const Icon = page.icon;
                      const isCurrent = !page.action && location.pathname === page.path;
                      return (
                        <button
                          key={page.id}
                          type="button"
                          role="option"
                          aria-selected={i === activeIndex}
                          className={`search-page-row ${i === activeIndex ? "active" : ""} ${
                            page.action === "logout" ? "is-logout" : ""
                          }`}
                          onMouseEnter={() => setActiveIndex(i)}
                          onClick={() => handleActivate({ ...page, type: "page" })}
                        >
                          <span className="search-page-icon">
                            <Icon size={17} />
                          </span>
                          <span className="search-page-info">
                            <span className="search-page-label">{highlightMatch(page.label, query)}</span>
                            <span className="search-page-desc">{page.desc}</span>
                          </span>
                          {isCurrent && <span className="search-page-current">Đang xem</span>}
                          <ArrowRight size={15} className="search-page-arrow" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Kết quả sản phẩm */}
              {loading ? (
                <div className="search-section">
                  {matchedPages.length > 0 && (
                    <div className="search-section-title">Sản phẩm</div>
                  )}
                  <div className="search-loading-label">
                    Đang tìm sản phẩm phù hợp với "{query.trim()}"...
                  </div>
                  <div className="search-skeleton-list">
                    {[0, 1, 2].map((i) => (
                      <div className="search-skeleton-row" key={i}>
                        <div className="search-skeleton-thumb" />
                        <div className="search-skeleton-lines">
                          <div className="search-skeleton-line long" />
                          <div className="search-skeleton-line short" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="search-section">
                  {matchedPages.length > 0 && <div className="search-section-title">Sản phẩm</div>}
                  <div className="search-results-list" role="listbox" aria-label="Kết quả sản phẩm">
                    {results.map((product, i) => {
                      const flatIndex = matchedPages.length + i;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          role="option"
                          aria-selected={flatIndex === activeIndex}
                          className={`search-result-row ${flatIndex === activeIndex ? "active" : ""}`}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          onClick={() => handleActivate({ ...product, type: "product" })}
                        >
                          <span className="search-result-thumb" aria-hidden="true">
                            {product.name.charAt(0)}
                          </span>
                          <span className="search-result-info">
                            <span className="search-result-name">{highlightMatch(product.name, query)}</span>
                            <span className="search-result-meta">
                              <span className="search-result-cat-tag">{categoryLabel(product.category)}</span>
                              {product.ageRange && <span className="search-result-age">{product.ageRange}</span>}
                            </span>
                          </span>
                          <span className="search-result-price">{formatPrice(product.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : matchedPages.length === 0 ? (
                <div className="search-empty-state">
                  <SearchX size={34} className="search-empty-icon" />
                  <p className="search-empty-title">Không tìm thấy kết quả cho "{query.trim()}"</p>
                  <p className="search-empty-sub">Vui lòng thử từ khoá khác hoặc kiểm tra lại chính tả</p>
                  <div className="search-chip-row search-chip-row-center">
                    {TRENDING_SEARCHES.slice(0, 4).map((term) => (
                      <button key={term} type="button" className="search-chip" onClick={() => handleChipClick(term)}>
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="search-no-product-note">
                  Không có sản phẩm nào khớp với "{query.trim()}"
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer: xem toàn bộ kết quả sản phẩm */}
        {hasQuery && !loading && results.length > 0 && (
          <div className="search-panel-footer">
            <button type="button" className="search-view-all-btn" onClick={handleSubmit}>
              Xem tất cả kết quả cho "{query.trim()}"
              <ArrowRight size={15} />
            </button>
            <span className="search-footer-hint">
              Dùng <kbd className="search-kbd">↑</kbd>
              <kbd className="search-kbd">↓</kbd> để chọn, <kbd className="search-kbd">Enter</kbd> để xác nhận
            </span>
          </div>
        )}
      </div>
    </div>
  );
}