// ProductFormFields.jsx — Toàn bộ field nhập liệu của 1 cuốn sách.
// Dùng chung cho trang "Thêm sách mới" (ProductCreate) và trang
// "Chi tiết sách" (ProductDetail, edit ngay tại chỗ) để không phải
// duy trì 2 bộ field lệch nhau ở 2 nơi.
import { computeModePrice } from "./productFormUtils";
import { formatPrice } from "../../utils/helpers";

const ModeToggle = ({ mode, onChange }) => (
  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
    {[
      ["direct", "Nhập giá"],
      ["percent", "Theo % giảm"],
    ].map(([val, label]) => (
      <button
        key={val}
        type="button"
        onClick={() => onChange(val)}
        style={{
          padding: "4px 10px",
          fontSize: 11,
          borderRadius: 6,
          cursor: "pointer",
          border: "1px solid #e8e5de",
          background: mode === val ? "#0D3330" : "#fff",
          color: mode === val ? "#fff" : "#0D3330",
        }}
      >
        {label}
      </button>
    ))}
  </div>
);

export default function ProductFormFields({ form, setForm, categories = [] }) {
  const f = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="a-form-grid">
      {/* Title */}
      <div className="a-form-group span-2">
        <label className="a-form-label">Tên sách *</label>
        <input
          className="a-input"
          value={form.title}
          onChange={f("title")}
          placeholder="Nhập tên sách..."
          required
        />
      </div>

      {/* Authors */}
      <div className="a-form-group span-2">
        <label className="a-form-label">Tác giả *</label>
        <input
          className="a-input"
          value={form.authors}
          onChange={f("authors")}
          placeholder="Nguyễn Nhật Ánh, Tô Hoài..."
          required
        />
        <span style={{ fontSize: 10, color: "rgba(13,51,48,0.4)" }}>
          Nhiều tác giả cách nhau bằng dấu phẩy
        </span>
      </div>

      {/* Price - giá gốc */}
      <div className="a-form-group">
        <label className="a-form-label">Giá gốc *</label>
        <input
          className="a-input"
          type="number"
          value={form.price}
          onChange={f("price")}
          placeholder="420000"
          required
          min={0}
        />
      </div>

      {/* Stock */}
      <div className="a-form-group">
        <label className="a-form-label">Tồn kho *</label>
        <input
          className="a-input"
          type="number"
          value={form.stock}
          onChange={f("stock")}
          placeholder="50"
          required
          min={0}
        />
      </div>

      {/* Sale price (giá bán khách) */}
      <div className="a-form-group">
        <label className="a-form-label">Giá bán khách hàng</label>
        <ModeToggle
          mode={form.saleMode}
          onChange={(v) => setForm((p) => ({ ...p, saleMode: v }))}
        />
        {form.saleMode === "direct" ? (
          <input
            className="a-input"
            type="number"
            min={0}
            value={form.salePrice}
            onChange={f("salePrice")}
            placeholder="260000"
          />
        ) : (
          <>
            <input
              className="a-input"
              type="number"
              min={0}
              max={100}
              value={form.salePercent}
              onChange={f("salePercent")}
              placeholder="% giảm, vd 38"
            />
            <span style={{ fontSize: 10, color: "rgba(13,51,48,0.5)" }}>
              Giá sau giảm:{" "}
              {formatPrice(
                computeModePrice("percent", form.salePercent, "", form.price) ?? 0
              )}
            </span>
          </>
        )}
      </div>

      {/* Dealer price (giá bán đại lý) */}
      <div className="a-form-group">
        <label className="a-form-label">Giá bán đại lý</label>
        <ModeToggle
          mode={form.dealerMode}
          onChange={(v) => setForm((p) => ({ ...p, dealerMode: v }))}
        />
        {form.dealerMode === "direct" ? (
          <input
            className="a-input"
            type="number"
            min={0}
            value={form.dealerPrice}
            onChange={f("dealerPrice")}
            placeholder="200000"
          />
        ) : (
          <>
            <input
              className="a-input"
              type="number"
              min={0}
              max={100}
              value={form.dealerPercent}
              onChange={f("dealerPercent")}
              placeholder="% chiết khấu, vd 50"
            />
            <span style={{ fontSize: 10, color: "rgba(13,51,48,0.5)" }}>
              Giá đại lý:{" "}
              {formatPrice(
                computeModePrice("percent", form.dealerPercent, "", form.price) ?? 0
              )}
            </span>
          </>
        )}
      </div>

      {/* Category */}
      <div className="a-form-group span-2">
        <label className="a-form-label">Danh mục *</label>
        <select
          className="a-input a-select"
          value={form.categoryId}
          onChange={f("categoryId")}
          required
        >
          <option value="">Chọn danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="a-form-group span-2">
        <label className="a-form-label">Mô tả</label>
        <textarea
          className="a-input a-textarea"
          value={form.description}
          onChange={f("description")}
          placeholder="Mô tả ngắn về cuốn sách..."
        />
      </div>

      {/* Visibility */}
      <div className="a-form-group span-2">
        <label className="a-form-label">Hiển thị</label>
        <div className="a-checkbox-group">
          <label className="a-checkbox-label">
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isVisible: e.target.checked }))
              }
            />
            Hiển thị trên cửa hàng
          </label>
        </div>
      </div>

      {/* ── Section: Thông số kỹ thuật ── */}
      <div
        className="a-form-group span-2"
        style={{ borderTop: "1px solid #e8e5de", paddingTop: 14, marginTop: 4 }}
      >
        <label className="a-form-label" style={{ fontWeight: 600, fontSize: 13 }}>
          Thông số kỹ thuật
        </label>
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Nhà xuất bản</label>
        <input
          className="a-input"
          value={form.publisher}
          onChange={f("publisher")}
          placeholder="Earthoria Publishing"
        />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Năm xuất bản</label>
        <input
          className="a-input"
          type="number"
          value={form.publishYear}
          onChange={f("publishYear")}
          placeholder="2026"
        />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Số trang</label>
        <input
          className="a-input"
          type="number"
          min={0}
          value={form.pages}
          onChange={f("pages")}
          placeholder="120"
        />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Kích thước (dài x rộng x cao)</label>
        <input
          className="a-input"
          value={form.dimensions}
          onChange={f("dimensions")}
          placeholder="21 x 28 x 1.2 cm"
        />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Trọng lượng (gram)</label>
        <input
          className="a-input"
          type="number"
          min={0}
          value={form.weightGrams}
          onChange={f("weightGrams")}
          placeholder="680"
        />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Bìa sách</label>
        <input
          className="a-input"
          value={form.coverType}
          onChange={f("coverType")}
          placeholder="Cứng, chống nước"
        />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Giấy in</label>
        <input
          className="a-input"
          value={form.paperType}
          onChange={f("paperType")}
          placeholder="FSC Certified 150gsm"
        />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Ngôn ngữ</label>
        <select className="a-input a-select" value={form.language} onChange={f("language")}>
          <option value="VI">VI</option>
          <option value="EN">EN</option>
          <option value="VI/EN">VI/EN</option>
        </select>
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Độ tuổi</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="a-input"
            type="number"
            min={0}
            value={form.ageMin}
            onChange={f("ageMin")}
            placeholder="Từ"
          />
          <input
            className="a-input"
            type="number"
            min={0}
            value={form.ageMax}
            onChange={f("ageMax")}
            placeholder="Đến"
          />
        </div>
      </div>
    </div>
  );
}