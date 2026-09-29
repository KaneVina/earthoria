import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

// Khớp PAYMENT_SESSION_TTL_MS ở server (paymentController.js) - chỉ dùng làm
// giá trị dự phòng khi server không trả về thời gian còn lại.
const DEFAULT_TTL_MS = 15 * 60 * 1000;

const COLOR_OK = "#4a9e3f";
const COLOR_WARN = "#b8862e"; // còn <= 5 phút
const COLOR_DANGER = "#c0392b"; // còn <= 1 phút

/**
 * Gắn mốc hết hạn (theo đồng hồ của máy khách) vào dữ liệu QR trả về từ server.
 *
 * Ưu tiên `expiresInMs` (thời gian còn lại do server tính) để không bị lệch khi
 * đồng hồ máy khách chạy sai; nếu server chưa trả về thì suy ra từ `expiresAt`.
 * Gọi ngay lúc nhận response, KHÔNG gọi trong lúc render - nếu không đồng hồ sẽ
 * bị đặt lại mỗi lần component mount lại.
 */
export function withBankQrDeadline(qr) {
  if (!qr) return qr;

  let totalMs = Number(qr.expiresInMs);
  if (!Number.isFinite(totalMs) || totalMs <= 0) {
    const fromExpiresAt = qr.expiresAt
      ? new Date(qr.expiresAt).getTime() - Date.now()
      : NaN;
    totalMs =
      Number.isFinite(fromExpiresAt) && fromExpiresAt > 0
        ? fromExpiresAt
        : DEFAULT_TTL_MS;
  }

  return { ...qr, deadlineMs: Date.now() + totalMs, totalMs };
}

const pad = (n) => String(n).padStart(2, "0");

/**
 * Đồng hồ đếm ngược thời gian hiệu lực của mã QR chuyển khoản.
 * Việc chuyển sang trạng thái "hết hạn" vẫn do server quyết định (polling
 * trạng thái đơn); component này chỉ hiển thị thời gian còn lại.
 */
export default function BankQrCountdown({
  deadlineMs,
  totalMs = DEFAULT_TTL_MS,
  marginTop = 16,
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Tính lại từ Date.now() mỗi nhịp (thay vì trừ dần) để không bị trôi khi
    // tab chạy nền bị trình duyệt làm chậm timer.
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!Number.isFinite(deadlineMs)) return null;

  const remainingMs = Math.max(0, deadlineMs - now);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const isExpired = remainingMs <= 0;
  const pct = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));

  const color = isExpired
    ? COLOR_DANGER
    : remainingSec <= 60
      ? COLOR_DANGER
      : remainingSec <= 300
        ? COLOR_WARN
        : COLOR_OK;

  return (
    <div
      role="timer"
      aria-live="off"
      style={{ width: "100%", maxWidth: 260, marginTop }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: 12.5,
          color,
          fontWeight: 400,
        }}
      >
        <Clock size={14} strokeWidth={1.5} style={{ flexShrink: 0 }} />
        {isExpired ? (
          <span>Mã QR đã hết hạn - đang cập nhật trạng thái…</span>
        ) : (
          <>
            <span>Mã QR hết hạn sau</span>
            <strong
              style={{
                fontSize: 16,
                letterSpacing: "0.04em",
                fontVariantNumeric: "tabular-nums",
                minWidth: 46,
                textAlign: "left",
              }}
            >
              {pad(Math.floor(remainingSec / 60))}:{pad(remainingSec % 60)}
            </strong>
          </>
        )}
      </div>
      <div
        style={{
          height: 2,
          marginTop: 8,
          background: "var(--border)",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            transition: "width 1s linear, background 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}