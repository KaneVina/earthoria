import { Check } from "lucide-react";

const STEPS = [
  { n: 1, label: "Giỏ hàng" },
  { n: 2, label: "Thiết lập đơn hàng" },
  { n: 3, label: "Thanh toán" },
  { n: 4, label: "Xác nhận" },
  { n: 5, label: "Hoàn tất" },
];

const STEPS_DIGITAL = [
  { n: 1, label: "Giỏ hàng" },
  { n: 2, label: "Thanh toán" },
  { n: 3, label: "Xác nhận" },
  { n: 4, label: "Hoàn tất" },
];

export default function StepBar({ current, digital }) {
  const steps = digital ? STEPS_DIGITAL : STEPS;
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 48 }}>
      {steps.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div
            key={s.n}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < steps.length - 1 ? 1 : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: done || active ? "var(--forest)" : "transparent",
                  border: `0.5px solid ${done || active ? "var(--forest)" : "var(--border)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.35s",
                  color: done || active ? "var(--ivory)" : "var(--text-muted)",
                  fontFamily: "Playfair Display, serif",
                  fontSize: 15,
                }}
              >
                {done ? <Check size={15} strokeWidth={2.5} /> : s.n}
              </div>
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: active
                    ? "var(--forest)"
                    : done
                      ? "var(--gold)"
                      : "var(--text-muted)",
                  fontWeight: active ? 500 : 300,
                  transition: "color 0.35s",
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 0.5,
                  margin: "0 18px",
                  background: done ? "var(--gold)" : "var(--border)",
                  transition: "background 0.5s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
