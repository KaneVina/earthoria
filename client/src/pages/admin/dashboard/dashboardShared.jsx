export const T = {
  forest: "#0D3330",
  green: "#4a9e3f",
  blue: "#2a78d6",
  amber: "#edap100",
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

// Ô trống / đang tải dùng chung trong các card biểu đồ
export function EmptyState({ loading, emptyText = "Chưa có dữ liệu" }) {
  return (
    <div
      style={{
        padding: "40px 0",
        textAlign: "center",
        color: "rgba(13,51,48,0.3)",
        fontSize: 12,
      }}
    >
      {loading ? "Đang tải..." : emptyText}
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
