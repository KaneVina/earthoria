// Products.jsx — Admin: khu vực "Sản phẩm" với 3 tab ngang: Sách / Phụ kiện / Danh mục.
// Tab "Sách" giữ nguyên logic danh sách + tìm kiếm + lọc cũ (chỉ chuyển vào trong 1 tab-panel).
// 2 tab mới (Phụ kiện, Danh mục) được tách thành 2 file riêng, import ngang hàng và render vào đây.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  X,
  Upload,
  PackagePlus,
} from "lucide-react";
import api from "../../../services/api";
import { formatPrice } from "../../../utils/helpers";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import ProductsAccessories from "./ProductsAccessories";
import ProductsCategories from "./ProductsCategories";

const EMPTY_FILTERS = {
  categoryId: "",
  language: "",
  status: "",
  ageMin: "",
  ageMax: "",
};

/* % giảm hiển thị dạng badge, vd giá gốc 420.000 -> giá bán 260.400 => -38% */
const calcDiscountPercent = (base, sale) => {
  const b = Number(base),
    s = Number(sale);
  if (!b || !s || s >= b) return 0;
  return Math.round((1 - s / b) * 100);
};

const TABS = [
  { key: "books", label: "Sách", crumb: "Sách" },
  { key: "accessories", label: "Phụ kiện", crumb: "Phụ kiện" },
  { key: "categories", label: "Danh mục", crumb: "Danh mục" },
];

export default function Products() {
  const [activeTab, setActiveTab] = useState("books");

  /*  Sliding underline indicator  */
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  // Cập nhật lại vị trí indicator khi resize (vd thu gọn sidebar làm đổi độ rộng)
  useEffect(() => {
    const onResize = () => {
      const el = tabRefs.current[activeTab];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeTab]);

  const activeCrumb = TABS.find((t) => t.key === activeTab)?.crumb ?? "";

  return (
    <AdminLayout>
      {/*  Breadcrumb  */}
      <div className="a-breadcrumb" style={{ marginBottom: 14 }}>
        <span>Quản lý</span>
        <span className="a-breadcrumb-sep">/</span>
        <span className="a-breadcrumb-link" style={{ cursor: "default" }}>
          Sản phẩm
        </span>
        <span className="a-breadcrumb-sep">/</span>
        <span className="a-breadcrumb-current">{activeCrumb}</span>
      </div>

      {/*  Page header  */}
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Quản lý</p>
          <h1 className="a-page-title">
            Sản <em>Phẩm</em>
          </h1>
        </div>

        {activeTab === "books" && (
          <div style={{ display: "flex", gap: 8 }}>
            <BooksImportButtons />
          </div>
        )}
      </div>

      {/*  Tab bar  */}
      <div className="a-tabbar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            ref={(el) => (tabRefs.current[tab.key] = el)}
            className={`a-tab${activeTab === tab.key ? " active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
        <span
          className="a-tab-indicator"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
          }}
        />
      </div>

      {/*  Tab panels  */}
      {activeTab === "books" && (
        <div className="a-tab-panel" key="books">
          <BooksTab />
        </div>
      )}
      {activeTab === "accessories" && (
        <div className="a-tab-panel" key="accessories">
          <ProductsAccessories />
        </div>
      )}
      {activeTab === "categories" && (
        <div className="a-tab-panel" key="categories">
          <ProductsCategories />
        </div>
      )}
    </AdminLayout>
  );
}

/* Nút "Nhập kho" / "Thêm sách mới" ở góc phải header — chỉ hiện khi đang ở tab Sách */
function BooksImportButtons() {
  const navigate = useNavigate();
  return (
    <>
      <button
        className="a-btn-ghost"
        onClick={() => navigate("/dashboard/products/inventory-import")}
      >
        <PackagePlus size={13} />
        Nhập kho
      </button>
      <button
        className="a-btn-primary"
        onClick={() => navigate("/dashboard/products/new")}
      >
        <Plus size={13} />
        Thêm sách mới
      </button>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB: SÁCH — danh sách, tìm kiếm, lọc, xóa (logic gốc giữ nguyên)
   ══════════════════════════════════════════════════════════ */
function BooksTab() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };
  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  /*  Queries
     `search` khớp theo tên sách, nhà xuất bản, VÀ mã sách (productCode) — xử lý ở backend. */
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page, search, filters],
    queryFn: () =>
      api
        .get("/admin/products", {
          params: { page, limit: 12, search, ...filters },
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/categories").then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success("Đã xóa sách!");
      qc.invalidateQueries(["admin-products"]);
      setConfirmDelete(null);
    },
    onError: (e) => {
      if (e.response?.status === 409 && e.response?.data?.softDeleted) {
        toast(e.response.data.message, { icon: "⚠️" });
        qc.invalidateQueries(["admin-products"]);
        setConfirmDelete(null);
      } else {
        toast.error(e.response?.data?.message || "Xóa thất bại!");
      }
    },
  });

  const products = data?.products ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.total ?? 0;

  return (
    <>
      {/*  Search + Filters (gộp chung 1 hàng, wrap khi hẹp)  */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div
          className="a-search-wrap"
          style={{ marginBottom: 0, flex: "1 1 260px", maxWidth: 360 }}
        >
          <Search size={13} className="a-search-icon" />
          <input
            className="a-input"
            type="text"
            placeholder="Tìm theo tên sách / mã sách / nhà xuất bản..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="a-input a-select"
          style={{ maxWidth: 180 }}
          value={filters.categoryId}
          onChange={(e) => updateFilter("categoryId", e.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="a-input a-select"
          style={{ maxWidth: 140 }}
          value={filters.language}
          onChange={(e) => updateFilter("language", e.target.value)}
        >
          <option value="">Mọi ngôn ngữ</option>
          <option value="VI">VI</option>
          <option value="EN">EN</option>
          <option value="VI/EN">VI/EN</option>
        </select>

        <select
          className="a-input a-select"
          style={{ maxWidth: 160 }}
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
        >
          <option value="">Mọi trạng thái</option>
          <option value="active">Đang hiển thị</option>
          <option value="inactive">Đã ẩn</option>
        </select>

        <input
          className="a-input"
          type="number"
          style={{ maxWidth: 100 }}
          placeholder="Từ tuổi"
          min={0}
          value={filters.ageMin}
          onChange={(e) => updateFilter("ageMin", e.target.value)}
        />
        <input
          className="a-input"
          type="number"
          style={{ maxWidth: 100 }}
          placeholder="Đến tuổi"
          min={0}
          value={filters.ageMax}
          onChange={(e) => updateFilter("ageMax", e.target.value)}
        />

        {hasActiveFilters && (
          <button type="button" className="a-btn-ghost" onClick={resetFilters}>
            Xóa lọc
          </button>
        )}
      </div>

      {/*  Table  */}
      <div className="a-table-card" style={{ marginTop: 16 }}>
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {[
                  "Sách",
                  "Danh mục",
                  "Giá",
                  "Tồn kho",
                  "Đã bán",
                  "Mã AR",
                  "Trạng thái",
                  "",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : !products.length ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Không tìm thấy sách nào
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const discount = calcDiscountPercent(p.price, p.salePrice);
                  const mainPrice = p.salePrice ?? p.price;
                  return (
                    <tr
                      key={p.id}
                      className="a-row-clickable"
                      onClick={() => navigate(`/dashboard/products/${p.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Book info */}
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 11,
                          }}
                        >
                          <div className="a-book-thumb">
                            {p.coverImage ? (
                              <img src={p.coverImage} alt={p.title} />
                            ) : (
                              <Upload size={12} />
                            )}
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 500,
                                fontSize: 12,
                                color: "var(--a-ink)",
                              }}
                            >
                              {p.title}
                            </div>
                            <div className="a-td-muted">
                              {(p.authors ?? []).join(", ") || "—"}
                            </div>
                            <div
                              style={{
                                fontFamily: "monospace",
                                fontSize: 9,
                                color: "rgba(13,51,48,0.4)",
                                marginTop: 1,
                              }}
                            >
                              {p.productCode ?? "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="a-badge neutral">
                          {p.category?.name ?? "—"}
                        </span>
                      </td>

                      {/* Price */}
                      <td>
                        <div className="a-td-sans">
                          {formatPrice(mainPrice)}
                        </div>
                        {p.salePrice ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 11,
                              marginTop: 1,
                            }}
                          >
                            <span
                              style={{
                                color: "rgba(13,51,48,0.35)",
                                textDecoration: "line-through",
                              }}
                            >
                              {formatPrice(p.price)}
                            </span>
                            {discount > 0 && (
                              <span
                                className="a-badge danger"
                                style={{ fontSize: 9, padding: "1px 5px" }}
                              >
                                -{discount}%
                              </span>
                            )}
                          </div>
                        ) : null}
                        {p.dealerPrice ? (
                          <div
                            style={{
                              fontSize: 10,
                              color: "rgba(13,51,48,0.4)",
                              marginTop: 2,
                            }}
                          >
                            Đại lý: {formatPrice(p.dealerPrice)}
                          </div>
                        ) : null}
                      </td>

                      {/* Stock */}
                      <td>
                        <span
                          className={p.stock <= 10 ? "a-td-danger" : ""}
                          style={{ fontWeight: 600 }}
                        >
                          {p.stock}
                        </span>
                      </td>

                      {/* Sold */}
                      <td className="a-td-muted">
                        {p._count?.orderItems ?? 0}
                      </td>
                      {/* AR codes count */}
                      <td>
                        <span className="a-badge info" style={{ fontSize: 10 }}>
                          {p._count?.arCodes ?? 0} mã
                        </span>
                      </td>
                      {/* Status */}
                      <td>
                        <span
                          className={`a-badge ${p.isVisible ? "success" : "neutral"}`}
                        >
                          {p.isVisible ? "Hiển thị" : "Đã ẩn"}
                        </span>
                      </td>

                      {/* Actions — chỉ còn 1 nút Chi tiết (xem + sửa gộp chung) + nút Xóa */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="a-btn-icon edit"
                            onClick={() =>
                              navigate(`/dashboard/products/${p.id}`)
                            }
                            aria-label="Chi tiết"
                            title="Xem & sửa chi tiết"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            className="a-btn-icon delete"
                            onClick={() => setConfirmDelete(p)}
                            aria-label="Xóa"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="a-pagination">
          <span className="a-pagination-info">Tổng {totalCount} sách</span>
          <div className="a-pagination-btns">
            <button
              className="a-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  className={`a-page-btn${p === page ? " active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="a-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* ══ DELETE CONFIRM MODAL ══ */}
      {confirmDelete && (
        <div
          className="a-modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setConfirmDelete(null)
          }
        >
          <div className="a-modal" style={{ maxWidth: 420 }}>
            <div className="a-modal-header">
              <h3 className="a-modal-title">Xác nhận xóa</h3>
              <button
                className="a-modal-close"
                onClick={() => setConfirmDelete(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="a-modal-body">
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(13,51,48,0.7)",
                  lineHeight: 1.6,
                }}
              >
                Bạn có chắc muốn xóa sách{" "}
                <strong>"{confirmDelete.title}"</strong>? Hành động này không
                thể hoàn tác.
              </p>
            </div>
            <div className="a-modal-footer">
              <button
                className="a-btn-primary"
                style={{ background: "#c05050" }}
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa sách"}
              </button>
              <button
                className="a-btn-ghost"
                onClick={() => setConfirmDelete(null)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
