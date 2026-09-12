// Thành phần UI dùng chung cho các tab dashboard mở rộng (Người dùng, Kinh doanh,
// Nội dung, Gia đình, Hỗ trợ) - tránh lặp code giữa các file tab.

import { Download } from "lucide-react";
import { AdminSkeletonLines } from "../../../components/skeletons/SkeletonAdmin";

export const T = {
  forest: "#0D3330",
  green: "#4a9e3f",
  blue: "#2a78d6",
  amber: "#eda100",
  purple: "#4a3aa7",
  red: "#e34948",
  grid: "#e8e5de",
  tick: "#8a9990",
  surface: "#FAFAF7",
};

export const PALETTE = [
  T.forest,
  T.blue,
  T.amber,
  T.purple,
  T.green,
  T.red,
  "#8a9990",
];

// Ô trống / đang tải dùng chung trong các card biểu đồ - khi đang tải hiện
// vài thanh skeleton (không phải chữ "Đang tải...") để đúng chuẩn loading
// chung của app (chỉ Skeleton hoặc FullScreenLoader).
export function EmptyState({ loading, emptyText = "Chưa có dữ liệu" }) {
  if (loading) {
    return (
      <div style={{ padding: "20px 14px" }}>
        <AdminSkeletonLines lines={4} />
      </div>
    );
  }
  return (
    <div
      style={{
        padding: "40px 0",
        textAlign: "center",
        color: "rgba(13,51,48,0.3)",
        fontSize: 12,
      }}
    >
      {emptyText}
    </div>
  );
}

// Lưới thẻ KPI nhỏ dùng ở đầu mỗi tab
export function MiniKpiGrid({ items, isLoading }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14,
        marginBottom: 24,
      }}
    >
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className="a-chart-card"
            style={{ padding: "16px 18px", marginBottom: 0 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 11.5, color: "rgba(13,51,48,0.55)" }}>
                {item.label}
              </span>
              {Icon ? <Icon size={14} color={item.color ?? T.forest} /> : null}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.forest }}>
              {isLoading ? (
                <span
                  className="a-skeleton"
                  style={{
                    display: "inline-block",
                    width: 60,
                    height: 22,
                    borderRadius: 4,
                  }}
                />
              ) : (
                item.value
              )}
            </div>
            {item.sub ? (
              <div
                style={{
                  fontSize: 10.5,
                  color: "rgba(13,51,48,0.4)",
                  marginTop: 3,
                }}
              >
                {item.sub}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// Tooltip đơn giản cho các biểu đồ trong tab mở rộng
export function SimpleTooltip({ active, payload, label, unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e5de",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      {label ? (
        <div style={{ fontWeight: 600, color: T.forest, marginBottom: 6 }}>
          {label}
        </div>
      ) : null}
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 3,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: p.fill ?? p.color,
              display: "inline-block",
            }}
          />
          <span style={{ color: "#666" }}>{p.name}:</span>
          <span style={{ fontWeight: 500, color: T.forest }}>
            {p.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

// Escape 1 ô dữ liệu cho CSV (bọc "" nếu có dấu phẩy/xuống dòng/dấu ngoặc kép)
function escapeCsvCell(value) {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Dựng chuỗi CSV từ mảng cột {key,label} và mảng dữ liệu (đã cho vào tất cả tab dùng chung)
export function buildCsv(columns, rows) {
  const headerLine = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const dataLines = rows.map((row) =>
    columns
      .map((c) =>
        escapeCsvCell(
          typeof c.value === "function" ? c.value(row) : row[c.key],
        ),
      )
      .join(","),
  );
  // Thêm BOM \uFEFF để Excel đọc đúng tiếng Việt có dấu
  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
}

export function downloadCsv(filename, columns, rows) {
  const csv = buildCsv(columns, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Nút xuất CSV nhỏ gọn, đặt trong header của card/bảng. Tự vô hiệu hoá khi chưa có dữ liệu.
export function ExportCsvButton({
  filename,
  columns,
  rows,
  label = "Xuất CSV",
}) {
  const disabled = !rows?.length;
  return (
    <button
      type="button"
      className="a-btn-ghost"
      disabled={disabled}
      onClick={() => downloadCsv(filename, columns, rows)}
      style={{
        padding: "5px 10px",
        fontSize: 10.5,
        gap: 4,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      title={disabled ? "Chưa có dữ liệu để xuất" : "Tải xuống file CSV"}
    >
      <Download size={11} />
      {label}
    </button>
  );
}

// Header chuẩn cho mọi card biểu đồ/bảng trong dashboard: tiêu đề + phụ đề bên trái,
// nút xuất CSV bên phải (chỉ hiện khi truyền exportProps). Dùng chung cho tất cả 6 tab
// để không lặp lại cùng 1 đoạn JSX ở mỗi file.
export function CardHeader({ title, sub, exportProps }) {
  return (
    <div
      className="a-chart-card-header"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <div>
        <h3 className="a-chart-title">{title}</h3>
        {sub ? <p className="a-chart-sub">{sub}</p> : null}
      </div>
      {exportProps ? <ExportCsvButton {...exportProps} /> : null}
    </div>
  );
}

// Danh sách xếp hạng đơn giản (dùng cho top sách, top game, top tỉnh...)
export function RankedList({ items, isLoading, renderRight, emptyText }) {
  if (isLoading) return <EmptyState loading />;
  if (!items?.length) return <EmptyState emptyText={emptyText} />;
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 6 }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            borderRadius: 8,
            background: i % 2 === 0 ? "rgba(13,51,48,0.03)" : "transparent",
          }}
        >
          <span
            style={{
              fontSize: 12.5,
              color: T.forest,
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(13,51,48,0.35)",
                width: 16,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.title || item.name}
            </span>
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: T.forest,
              flexShrink: 0,
            }}
          >
            {renderRight ? renderRight(item) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
