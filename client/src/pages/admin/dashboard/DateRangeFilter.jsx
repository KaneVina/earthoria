import { useState } from "react";
import { Calendar } from "lucide-react";
import { T } from "./dashboardShared";

const PRESETS = [
  { key: "7d", label: "7 ngày", days: 7 },
  { key: "30d", label: "30 ngày", days: 30 },
  { key: "90d", label: "90 ngày", days: 90 },
];

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

export function rangeFromPreset(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  return { from: toISODate(from), to: toISODate(to) };
}

// Bộ lọc khoảng thời gian dùng chung cho các tab có biểu đồ theo ngày (Người dùng, Kinh doanh, Hỗ trợ).
// value: { preset: "7d"|"30d"|"90d"|"custom", from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
export default function DateRangeFilter({ value, onChange }) {
  const [draftFrom, setDraftFrom] = useState(value.from);
  const [draftTo, setDraftTo] = useState(value.to);

  const applyPreset = (preset) => {
    const range = rangeFromPreset(preset.days);
    onChange({ preset: preset.key, ...range });
  };

  const applyCustom = () => {
    if (!draftFrom || !draftTo) return;
    if (draftFrom > draftTo) return; // ngày bắt đầu không thể sau ngày kết thúc
    onChange({ preset: "custom", from: draftFrom, to: draftTo });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 20,
        padding: "10px 14px",
        background: "rgba(13,51,48,0.03)",
        borderRadius: 10,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11.5,
          color: "rgba(13,51,48,0.55)",
          marginRight: 4,
        }}
      >
        <Calendar size={13} /> Khoảng thời gian:
      </span>

      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => applyPreset(p)}
          style={{
            padding: "5px 12px",
            fontSize: 11.5,
            borderRadius: 999,
            border: `1px solid ${value.preset === p.key ? T.forest : "rgba(13,51,48,0.15)"}`,
            background: value.preset === p.key ? T.forest : "transparent",
            color: value.preset === p.key ? "#fff" : "rgba(13,51,48,0.65)",
            cursor: "pointer",
            fontWeight: value.preset === p.key ? 600 : 400,
            transition: "all 0.15s ease",
          }}
        >
          {p.label}
        </button>
      ))}

      <span
        style={{
          width: 1,
          height: 18,
          background: "rgba(13,51,48,0.12)",
          margin: "0 2px",
        }}
      />

      <input
        type="date"
        value={draftFrom}
        max={draftTo}
        onChange={(e) => setDraftFrom(e.target.value)}
        style={{
          fontSize: 11.5,
          padding: "5px 8px",
          borderRadius: 6,
          border: "1px solid rgba(13,51,48,0.15)",
          color: T.forest,
          fontFamily: "inherit",
        }}
      />
      <span style={{ fontSize: 11, color: "rgba(13,51,48,0.4)" }}>đến</span>
      <input
        type="date"
        value={draftTo}
        min={draftFrom}
        max={toISODate(new Date())}
        onChange={(e) => setDraftTo(e.target.value)}
        style={{
          fontSize: 11.5,
          padding: "5px 8px",
          borderRadius: 6,
          border: "1px solid rgba(13,51,48,0.15)",
          color: T.forest,
          fontFamily: "inherit",
        }}
      />
      <button
        type="button"
        onClick={applyCustom}
        style={{
          padding: "5px 12px",
          fontSize: 11.5,
          borderRadius: 999,
          border: `1px solid ${value.preset === "custom" ? T.forest : "rgba(13,51,48,0.15)"}`,
          background: value.preset === "custom" ? T.forest : "transparent",
          color: value.preset === "custom" ? "#fff" : "rgba(13,51,48,0.65)",
          cursor: "pointer",
          fontWeight: value.preset === "custom" ? 600 : 400,
        }}
      >
        Áp dụng
      </button>
    </div>
  );
}

