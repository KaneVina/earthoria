import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCompareStore } from "../store/compareStore";
import { formatPrice, getBookUrl } from "../utils/helpers";
import { useCartStore } from "../store/cartStore";
import toast from "react-hot-toast";

// ── Icons ──
function IconX({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconCheck({ color = "#4a9e3f" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconDash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconPrint() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function IconCrown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 18h20l-2-8-5 4-3-8-3 8-5-4-2 8z" />
    </svg>
  );
}

const ROWS = [
  { key: "price", label: "Giá", type: "price" },
  { key: "category", label: "Danh mục", type: "category" },
  { key: "age", label: "Độ tuổi", type: "age" },
  { key: "rating", label: "Đánh giá", type: "rating" },
  { key: "pages", label: "Số trang", type: "text", suffix: " trang" },
  { key: "dimensions", label: "Kích thước", type: "text" },
  { key: "weightGrams", label: "Trọng lượng", type: "text", suffix: "g" },
  { key: "coverType", label: "Bìa sách", type: "text" },
  { key: "paperType", label: "Giấy in", type: "text" },
  { key: "language", label: "Ngôn ngữ", type: "text" },
  { key: "publisher", label: "Nhà xuất bản", type: "text" },
  { key: "hasAR", label: "Công nghệ AR", type: "bool" },
  { key: "hasAI", label: "AI Tutor", type: "bool" },
  { key: "has3DAudio", label: "Âm thanh 3D", type: "bool" },
];

function effectivePrice(item) {
  return item.salePrice && item.salePrice < item.price ? item.salePrice : item.price;
}

export default function Compare() {
  const { items, removeItem, clear } = useCompareStore();
  const { addToCart } = useCartStore();
  const [showStickyHeader, setShowStickyHeader] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowStickyHeader(window.scrollY > 420);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bestPriceHashId = useMemo(() => {
    if (items.length < 2) return null;
    let best = items[0];
    for (const it of items) {
      if (effectivePrice(it) < effectivePrice(best)) best = it;
    }
    return best.hashId;
  }, [items]);

  const bestRatingHashId = useMemo(() => {
    if (items.length < 2) return null;
    const rated = items.filter((it) => it.avgRating);
    if (rated.length < 2) return null;
    let best = rated[0];
    for (const it of rated) {
      if (parseFloat(it.avgRating) > parseFloat(best.avgRating)) best = it;
    }
    return best.hashId;
  }, [items]);

  const rowHasDifference = (row) => {
    if (items.length < 2) return false;
    const values = items.map((it) => {
      if (row.type === "bool") return !!it[row.key];
      if (row.type === "price") return effectivePrice(it);
      if (row.type === "category") return it.category?.name || it.category || "";
      if (row.type === "age") return `${it.ageMin ?? ""}-${it.ageMax ?? ""}`;
      if (row.type === "rating") return it.avgRating || "";
      return it[row.key] ?? "";
    });
    return new Set(values.map((v) => JSON.stringify(v))).size > 1;
  };

  const handleAdd = async (hashId, title) => {
    try {
      await addToCart(hashId, 1);
      toast.success(`Đã thêm "${title}" vào giỏ hàng`);
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handlePrint = () => window.print();

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Đã sao chép liên kết so sánh");
  };

  const renderCell = (row, item) => {
    const val = item[row.key];
    const isBestPrice = row.type === "price" && item.hashId === bestPriceHashId;
    const isBestRating = row.type === "rating" && item.hashId === bestRatingHashId;

    switch (row.type) {
      case "price": {
        const hasSale = item.salePrice && item.salePrice < item.price;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {hasSale && (
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "line-through" }}>
                {formatPrice(item.price)}
              </span>
            )}
            <span className="price-main" style={{ fontSize: "22px" }}>
              {formatPrice(effectivePrice(item))}
            </span>
            {isBestPrice && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  background: "var(--gold-pale)",
                  border: "0.5px solid var(--border-gold)",
                  padding: "3px 9px",
                  width: "fit-content",
                }}
              >
                <IconCrown /> Giá tốt nhất
              </span>
            )}
          </div>
        );
      }
      case "category":
        return item.category?.name || item.category || "—";
      case "age":
        return item.ageMin || item.ageMax ? `${item.ageMin ?? "?"}–${item.ageMax ?? "?"} tuổi` : "—";
      case "rating":
        return item.avgRating ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span>
              <span style={{ color: "var(--gold)" }}>★</span> {parseFloat(item.avgRating).toFixed(1)}{" "}
              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>({item.reviewCount || 0})</span>
            </span>
            {isBestRating && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  background: "var(--gold-pale)",
                  border: "0.5px solid var(--border-gold)",
                  padding: "3px 9px",
                  width: "fit-content",
                }}
              >
                <IconCrown /> Đánh giá cao nhất
              </span>
            )}
          </div>
        ) : (
          "—"
        );
      case "bool":
        return val ? <IconCheck /> : <IconDash />;
      case "text":
        return val ? `${val}${row.suffix || ""}` : "—";
      default:
        return val || "—";
    }
  };

  return (
    <div style={{ minHeight: "100vh", paddingTop: "60px" }}>
      {/* ── Sticky mini header khi cuộn ── */}
      {items.length >= 2 && (
        <div
          className="compare-sticky-header"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 850,
            background: "rgba(250,248,243,0.96)",
            backdropFilter: "blur(16px)",
            borderBottom: "0.5px solid var(--border-gold)",
            padding: "14px 40px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            transform: showStickyHeader ? "translateY(0)" : "translateY(-100%)",
            transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "15px",
              color: "var(--forest)",
              flexShrink: 0,
              marginRight: "8px",
            }}
          >
            So sánh
          </span>
          {items.map((item) => (
            <div key={item.hashId} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", overflow: "hidden", background: "var(--forest)", flexShrink: 0 }}>
                {item.coverImage && (
                  <img src={item.coverImage} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-body)",
                  maxWidth: "140px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.title}
              </span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="btn-secondary"
            style={{ padding: "8px 18px", fontSize: "10px" }}
          >
            Lên đầu trang
          </button>
        </div>
      )}

      <div className="breadcrumb" style={{ padding: "40px 100px 0" }}>
        <Link to="/" className="breadcrumb-item">Trang chủ</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/shop" className="breadcrumb-item">Cửa hàng</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">So sánh sản phẩm</span>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 100px 100px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "48px",
          }}
        >
          <div>
            <div className="section-eyebrow" style={{ justifyContent: "flex-start" }}>
              <div className="section-eyebrow-line"></div>
              <span className="section-eyebrow-text">So Sánh</span>
            </div>
            <h1 className="section-title" style={{ fontSize: "clamp(32px, 4vw, 48px)", textAlign: "left" }}>
              Bảng So Sánh <em>Chi Tiết</em>
            </h1>
          </div>

          {items.length >= 2 && (
            <div style={{ display: "flex", gap: "10px" }} className="compare-actions-noprint">
              <button className="btn-secondary" onClick={handleCopyLink}>
                <IconLink /> Sao chép liên kết
              </button>
              <button className="btn-secondary" onClick={handlePrint}>
                <IconPrint /> In bảng so sánh
              </button>
            </div>
          )}
        </div>

        {items.length < 2 ? (
          <div
            style={{
              textAlign: "center",
              padding: "100px 20px",
              border: "0.5px solid var(--border)",
              background: "var(--cream)",
            }}
          >
            <p style={{ fontSize: "15px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Bạn cần chọn ít nhất 2 sản phẩm để so sánh.
            </p>
            <Link to="/shop">
              <button className="btn-primary" style={{ padding: "14px 32px" }}>Quay lại cửa hàng</button>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }} id="compare-print-area">
            {/* FIX: khi chỉ có 2 sản phẩm, table width:100% kéo cột quá rộng làm ảnh bìa bị giãn xấu.
                Giới hạn max-width theo số cột và căn giữa để cột luôn có tỉ lệ đẹp, không phụ thuộc số lượng chọn. */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "700px",
                maxWidth: `${220 + items.length * 280}px`,
                margin: "0 auto",
              }}
            >
              <thead>
                <tr>
                  <td style={{ width: "220px", padding: "16px" }}></td>
                  {items.map((item) => (
                    <td
                      key={item.hashId}
                      style={{
                        padding: "20px",
                        verticalAlign: "top",
                        border: "0.5px solid var(--border)",
                        background: "var(--white)",
                        minWidth: "220px",
                        position: "relative",
                      }}
                    >
                      <button
                        onClick={() => removeItem(item.hashId)}
                        className="compare-actions-noprint"
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          width: "28px",
                          height: "28px",
                          border: "0.5px solid var(--border)",
                          background: "var(--ivory)",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconX />
                      </button>
                      {/* FIX: thêm style reset để bỏ underline xanh dương mặc định của trình duyệt
                          (trước đây Link không có style -> browser tự áp a{color:blue;text-decoration:underline}) */}
                      <Link
                        to={getBookUrl ? getBookUrl(item) : `/books/${item.slug}/${item.hashId}`}
                        style={{ textDecoration: "none", color: "inherit", display: "block" }}
                      >
                        <div style={{ height: "160px", overflow: "hidden", marginBottom: "16px", background: "var(--forest)" }}>
                          {item.coverImage && (
                            <img
                              src={item.coverImage}
                              alt={item.title}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          )}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "17px",
                            color: "var(--forest)",
                            lineHeight: 1.3,
                            marginBottom: "14px",
                            minHeight: "44px",
                          }}
                        >
                          {item.title}
                        </div>
                      </Link>
                      <button
                        className="btn-add-main compare-actions-noprint"
                        style={{ width: "100%", height: "40px", fontSize: "10px" }}
                        onClick={() => handleAdd(item.hashId, item.title)}
                      >
                        Thêm vào giỏ
                      </button>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const diff = rowHasDifference(row);
                  return (
                    <tr key={row.key}>
                      <td
                        style={{
                          padding: "16px",
                          fontSize: "11px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--text-muted)",
                          fontWeight: 400,
                          borderBottom: "0.5px solid var(--border)",
                          verticalAlign: "middle",
                          borderLeft: diff ? "2px solid var(--gold)" : "2px solid transparent",
                        }}
                      >
                        {row.label}
                      </td>
                      {items.map((item) => (
                        <td
                          key={item.hashId}
                          style={{
                            padding: "16px 20px",
                            fontSize: "14px",
                            color: "var(--forest)",
                            fontWeight: 400,
                            borderBottom: "0.5px solid var(--border)",
                            borderLeft: "0.5px solid var(--border)",
                            borderRight: "0.5px solid var(--border)",
                            background: diff ? "var(--gold-pale)" : "transparent",
                          }}
                        >
                          {renderCell(row, item)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* FIX: khu vực nút cũng phải giới hạn maxWidth + căn giữa giống bảng phía trên,
                nếu không nó vẫn kéo full chiều rộng dù bảng đã thu hẹp lại */}
            <div
              className="compare-actions-noprint"
              style={{
                marginTop: "32px",
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                maxWidth: `${220 + items.length * 280}px`,
                margin: "32px auto 0",
              }}
            >
              <button className="btn-secondary" onClick={clear}>Xóa tất cả</button>
              <Link to="/shop">
                <button className="btn-secondary">+ Thêm sản phẩm khác</button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          nav, footer, #back-top, .breadcrumb, .compare-actions-noprint, .compare-sticky-header,
          .sticky-bar, #progress {
            display: none !important;
          }
          #compare-print-area {
            overflow: visible !important;
          }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}