import { Plus, Trash2 } from "lucide-react";
import { formatPrice } from "../../../utils/helpers";
import { generateProductCode } from "../../../utils/generateProductCode";
import {
  FORMAT_LABEL,
  computeModePrice,
  emptyVariant,
} from "./productFormUtils";

const ALL_FORMATS = ["PHYSICAL", "DIGITAL"];

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

export default function ProductVariantsEditor({
  variants,
  setVariants,
  onDeleteVariant,
}) {
  const usedFormats = variants.map((v) => v.format);
  const availableFormats = ALL_FORMATS.filter((f) => !usedFormats.includes(f));

  const updateVariant = (key, patch) => {
    setVariants((prev) =>
      prev.map((v) => (v._key === key ? { ...v, ...patch } : v)),
    );
  };

  const addVariant = (format) =>
    setVariants((prev) => [...prev, emptyVariant(format)]);

  const removeVariant = async (variant) => {
    if (variant.id) {
      await onDeleteVariant?.(variant);
    } else {
      setVariants((prev) => prev.filter((v) => v._key !== variant._key));
    }
  };

  return (
    <div className="a-form-group span-2" style={{ marginTop: 4 }}>
      <label className="a-form-label" style={{ fontWeight: 600, fontSize: 13 }}>
        Định dạng bán *
      </label>
      <p
        style={{
          fontSize: 11,
          color: "rgba(13,51,48,0.5)",
          marginTop: -4,
          marginBottom: 10,
        }}
      >
        Mỗi sách bán được tối đa 2 định dạng: Sách giấy và/hoặc Sách điện tử.
      </p>

      {variants.length === 0 && (
        <div
          style={{
            padding: "16px 14px",
            fontSize: 12,
            color: "rgba(13,51,48,0.5)",
            border: "1px dashed #e8e5de",
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          Chưa có định dạng bán nào — thêm ít nhất 1 định dạng bên dưới.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {variants.map((v) => (
          <VariantCard
            key={v._key}
            variant={v}
            onChange={(patch) => updateVariant(v._key, patch)}
            onRemove={() => removeVariant(v)}
            canRemove={variants.length > 1}
          />
        ))}
      </div>

      {availableFormats.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {availableFormats.map((f) => (
            <button
              key={f}
              type="button"
              className="a-btn-ghost"
              onClick={() => addVariant(f)}
            >
              <Plus size={13} /> Thêm {FORMAT_LABEL[f]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantCard({ variant, onChange, onRemove, canRemove }) {
  const isNew = !variant.id;

  return (
    <div style={{ border: "1px solid #e8e5de", borderRadius: 12, padding: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="a-badge info">{FORMAT_LABEL[variant.format]}</span>
          <VariantCodePreview variant={variant} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isNew && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "rgba(13,51,48,0.6)",
              }}
            >
              <input
                type="checkbox"
                checked={variant.isActive}
                onChange={(e) => onChange({ isActive: e.target.checked })}
              />
              Đang bán
            </label>
          )}
          {canRemove && (
            <button
              type="button"
              className="a-btn-icon delete"
              title="Xóa định dạng này"
              onClick={onRemove}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="a-form-grid">
        <div className="a-form-group">
          <label className="a-form-label">Giá gốc *</label>
          <input
            className="a-input"
            type="number"
            min={0}
            value={variant.price}
            onChange={(e) => onChange({ price: e.target.value })}
            placeholder="420000"
            required
          />
        </div>

        <div className="a-form-group">
          <label className="a-form-label">Đơn vị</label>
          <input
            className="a-input"
            value={variant.unit}
            onChange={(e) => onChange({ unit: e.target.value })}
            placeholder="Cuốn / Bản..."
          />
        </div>

        <div className="a-form-group">
          <label className="a-form-label">Tồn kho</label>
          {variant.format === "DIGITAL" ? (
            <div
              className="a-input"
              style={{
                display: "flex",
                alignItems: "center",
                color: "rgba(13,51,48,0.5)",
              }}
            >
              Không giới hạn (sách điện tử)
            </div>
          ) : (
            <input
              className="a-input"
              type="number"
              min={0}
              value={variant.stock}
              onChange={(e) => onChange({ stock: e.target.value })}
              placeholder="50"
              required
            />
          )}
        </div>

        {!isNew && (
          <div className="a-form-group">
            <label className="a-form-label">Đã bán</label>
            <div style={{ fontSize: 13, fontWeight: 600, padding: "8px 0" }}>
              {variant.sold ?? 0}
            </div>
          </div>
        )}

        <div className="a-form-group">
          <label className="a-form-label">Giá bán khách hàng</label>
          <ModeToggle
            mode={variant.saleMode}
            onChange={(m) => onChange({ saleMode: m })}
          />
          {variant.saleMode === "direct" ? (
            <input
              className="a-input"
              type="number"
              min={0}
              value={variant.salePrice}
              onChange={(e) => onChange({ salePrice: e.target.value })}
              placeholder="260000"
            />
          ) : (
            <>
              <input
                className="a-input"
                type="number"
                min={0}
                max={100}
                value={variant.salePercent}
                onChange={(e) => onChange({ salePercent: e.target.value })}
                placeholder="% giảm, vd 38"
              />
              <span style={{ fontSize: 10, color: "rgba(13,51,48,0.5)" }}>
                Giá sau giảm:{" "}
                {formatPrice(
                  computeModePrice(
                    "percent",
                    variant.salePercent,
                    "",
                    variant.price,
                  ) ?? 0,
                )}
              </span>
            </>
          )}
        </div>

        <div className="a-form-group">
          <label className="a-form-label">Giá bán đại lý</label>
          <ModeToggle
            mode={variant.dealerMode}
            onChange={(m) => onChange({ dealerMode: m })}
          />
          {variant.dealerMode === "direct" ? (
            <input
              className="a-input"
              type="number"
              min={0}
              value={variant.dealerPrice}
              onChange={(e) => onChange({ dealerPrice: e.target.value })}
              placeholder="200000"
            />
          ) : (
            <>
              <input
                className="a-input"
                type="number"
                min={0}
                max={100}
                value={variant.dealerPercent}
                onChange={(e) => onChange({ dealerPercent: e.target.value })}
                placeholder="% chiết khấu, vd 50"
              />
              <span style={{ fontSize: 10, color: "rgba(13,51,48,0.5)" }}>
                Giá đại lý:{" "}
                {formatPrice(
                  computeModePrice(
                    "percent",
                    variant.dealerPercent,
                    "",
                    variant.price,
                  ) ?? 0,
                )}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function VariantCodePreview({ variant }) {
  if (variant.id) {
    return (
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 11,
          background: "#f5f3ee",
          padding: "2px 8px",
          borderRadius: 5,
          color: "#0D3330",
        }}
      >
        {variant.productCode ?? "—"}
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 11,
        color: "rgba(13,51,48,0.4)",
      }}
      title="Mã minh họa — mã thật sẽ do hệ thống cấp khi lưu"
    >
      {generateProductCode()} (preview)
    </span>
  );
}
