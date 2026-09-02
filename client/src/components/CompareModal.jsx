import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookService } from "../services/bookService";
import { useCompareStore } from "../store/compareStore";
import { formatPrice } from "../utils/helpers";
import toast from "react-hot-toast";

//  Icons
function IconCheck() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconX({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
// Thay IconScale (hay bị vỡ font ⚖ trên một số trình duyệt/hệ điều hành) bằng icon mũi tên so sánh an toàn
function IconCompareArrow() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M8 3L4 7l4 4" />
      <path d="M4 7h16" />
      <path d="M16 21l4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  );
}
function IconSearchIco() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function toCompareItem(p) {
  return {
    hashId: p.hashId,
    slug: p.slug,
    title: p.title,
    coverImage: p.coverImage,
    price: p.price,
    salePrice: p.salePrice,
    category: p.category,
    ageMin: p.ageMin,
    ageMax: p.ageMax,
    pages: p.pages,
    dimensions: p.dimensions,
    weightGrams: p.weightGrams,
    coverType: p.coverType,
    paperType: p.paperType,
    language: p.language,
    publisher: p.publisher,
    hasAR: p.hasAR,
    hasAI: p.hasAI,
    has3DAudio: p.has3DAudio,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
  };
}

export default function CompareModal({ open, onClose, currentBook }) {
  const navigate = useNavigate();
  const { items, isSelected, toggleItem, removeItem, maxCompare } =
    useCompareStore();

  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!open) return;
    bookService
      .getCategories()
      .then((r) => setCategories(r.data.data || r.data || []))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    const params = { limit: 24 };
    if (activeCategory !== "all") params.category = activeCategory;
    if (debouncedSearch) params.search = debouncedSearch;

    bookService
      .getBooks(params)
      .then((r) => {
        if (cancelled) return;
        let list = r.data.data.books || [];
        if (currentBook?.hashId) {
          list = list.filter((b) => b.hashId !== currentBook.hashId);
        }
        setAllProducts(list);
      })
      .catch(() => {
        if (!cancelled) toast.error("Không tải được danh sách sản phẩm");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, activeCategory, debouncedSearch, currentBook]);

  useEffect(() => {
    if (!open) {
      setSearchInput("");
      setDebouncedSearch("");
      setActiveCategory("all");
    }
  }, [open]);

  const selectedHashIds = useMemo(
    () => new Set(items.map((i) => i.hashId)),
    [items],
  );

  if (!open) return null;

  const handleToggle = (product) => {
    const result = toggleItem(toCompareItem(product));
    if (result.limitReached) {
      toast.error(`Chỉ có thể so sánh tối đa ${maxCompare} sản phẩm`);
    }
  };

  const handleCompareNow = () => {
    if (items.length < 2) {
      toast.error("Chọn ít nhất 2 sản phẩm để so sánh");
      return;
    }
    onClose();
    navigate("/compare");
  };

  return (
    <div
      className="search-overlay-backdrop open"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="search-panel" style={{ maxWidth: "860px" }}>
        {/*  Header  */}
        <div className="search-panel-header" style={{ padding: "26px 28px 0" }}>
          <div style={{ flex: 1 }}>
            <div className="info-eyebrow" style={{ marginBottom: "8px" }}>
              <div className="info-eyebrow-line"></div>
              <span className="info-eyebrow-text">So Sánh Sản Phẩm</span>
            </div>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 400,
                fontSize: "26px",
                color: "var(--forest)",
                lineHeight: 1.2,
              }}
            >
              Chọn Sản Phẩm{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                So Sánh
              </em>
            </h3>
          </div>
          <button className="search-close-btn" onClick={onClose}>
            <IconX />
            <span className="search-close-label">Đóng</span>
          </button>
        </div>

        <p className="search-panel-hint">
          Chọn tối đa <em>{maxCompare} sản phẩm</em> để so sánh chi tiết giá,
          thông số và tính năng.
        </p>

        {/*  Search input  */}
        <div className="search-panel-header" style={{ padding: "18px 28px 0" }}>
          <div className="search-input-wrap" style={{ height: "48px" }}>
            <span className="search-input-icon">
              <IconSearchIco />
            </span>
            <input
              className="search-input"
              style={{ fontSize: "14px" }}
              placeholder="Tìm sách để thêm vào so sánh..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoFocus
            />
            {searchInput && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchInput("")}
              >
                <IconX size={14} />
              </button>
            )}
          </div>
        </div>

        {/*  Category tabs  */}
        <div className="search-category-tabs" style={{ padding: "16px 28px" }}>
          <button
            className={`pill search-cat-pill${activeCategory === "all" ? " active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              className={`pill search-cat-pill${activeCategory === c.slug ? " active" : ""}`}
              onClick={() => setActiveCategory(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/*  Selected strip  */}
        {items.length > 0 && (
          <div
            style={{
              padding: "0 28px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {items.map((item) => (
              <div
                key={item.hashId}
                className="search-chip"
                style={{
                  paddingRight: "8px",
                  background: "var(--gold-pale)",
                  borderColor: "var(--border-gold)",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "var(--forest)",
                  }}
                >
                  {item.coverImage && (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    maxWidth: "140px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.title}
                </span>
                <span
                  className="search-chip-remove"
                  onClick={() => removeItem(item.hashId)}
                  style={{ cursor: "pointer", display: "flex" }}
                >
                  <IconX size={13} />
                </span>
              </div>
            ))}
            {Array.from({ length: maxCompare - items.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  width: "36px",
                  height: "36px",
                  border: "1px dashed var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--pale)",
                  flexShrink: 0,
                }}
              >
                <IconPlus />
              </div>
            ))}
          </div>
        )}

        {/*  Body: product list  */}
        {/* FIX: bỏ inline minHeight cố định (từng gây khóa cứng 320px, làm nội dung dài hơn bị tràn ra ngoài panel).
            Chiều cao/scroll giờ do class .search-panel-body trong CSS kiểm soát hoàn toàn. */}
        <div className="search-panel-body">
          {loading ? (
            <div className="search-loading-state">
              <div className="search-spinner">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </div>
              Đang tải sản phẩm...
            </div>
          ) : allProducts.length === 0 ? (
            <div className="search-empty-state">
              <div className="search-empty-icon">
                <IconCompareArrow />
              </div>
              <div className="search-empty-title">
                Không tìm thấy sản phẩm phù hợp
              </div>
              <div className="search-empty-sub">
                Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác
              </div>
            </div>
          ) : (
            <div className="search-results-list">
              {allProducts.map((p) => {
                const selected = selectedHashIds.has(p.hashId);
                const disabled = !selected && items.length >= maxCompare;
                const hasSale = p.salePrice && p.salePrice < p.price;
                return (
                  <button
                    key={p.hashId}
                    className={`search-result-row${selected ? " active" : ""}`}
                    onClick={() => !disabled && handleToggle(p)}
                    style={
                      disabled ? { opacity: 0.4, cursor: "not-allowed" } : {}
                    }
                    title={
                      disabled ? `Đã chọn đủ ${maxCompare} sản phẩm` : undefined
                    }
                  >
                    <div
                      className="search-result-thumb"
                      style={{
                        padding: 0,
                        overflow: "hidden",
                        background: "var(--forest)",
                      }}
                    >
                      {p.coverImage ? (
                        <img
                          src={p.coverImage}
                          alt={p.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        p.title?.[0]
                      )}
                    </div>
                    <div className="search-result-info">
                      <span className="search-result-name">{p.title}</span>
                      <div className="search-result-meta">
                        {p.category?.name && (
                          <span className="search-result-cat-tag">
                            {p.category.name}
                          </span>
                        )}
                        {hasSale && (
                          <span
                            style={{
                              fontSize: "10px",
                              letterSpacing: "0.1em",
                              color: "#c05050",
                              background: "rgba(192,80,80,0.08)",
                              padding: "2px 6px",
                            }}
                          >
                            -{Math.round((1 - p.salePrice / p.price) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="search-result-price">
                      {formatPrice(hasSale ? p.salePrice : p.price)}
                    </span>
                    {/* Bỏ margin-left cứng 12px gây cảm giác nút "+"/check trôi xa giá;
                        khoảng cách giờ do gap của .search-result-row (đã set trong CSS) đảm nhiệm */}
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `0.5px solid ${selected ? "var(--gold)" : "var(--border)"}`,
                        background: selected ? "var(--gold)" : "transparent",
                        color: selected ? "var(--ivory)" : "var(--text-muted)",
                        transition: "all 0.25s",
                      }}
                    >
                      {selected ? <IconCheck /> : <IconPlus />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/*  Footer  */}
        <div className="search-panel-footer">
          <span className="search-footer-hint">
            Đã chọn{" "}
            <strong style={{ color: "var(--forest)" }}>{items.length}</strong> /{" "}
            {maxCompare} sản phẩm
          </span>
          <button
            className="search-view-all-btn"
            onClick={handleCompareNow}
            disabled={items.length < 2}
            style={
              items.length < 2
                ? {
                    opacity: 0.4,
                    cursor: "not-allowed",
                    background: "var(--text-muted)",
                  }
                : { background: "var(--gold)", color: "var(--ink)" }
            }
          >
            <IconCompareArrow /> So sánh ngay
          </button>
        </div>
      </div>
    </div>
  );
}
