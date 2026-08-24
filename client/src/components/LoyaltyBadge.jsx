import { useState } from "react";
import { formatPrice } from "../utils/helpers";
import "./assets/css/loyaltyBadge.css";

const formatArea = (km2) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(km2)} km²`;

const perkLines = (tier) => {
  const lines = [];
  if (tier.discountPercent > 0) {
    lines.push(
      `Giảm ${tier.discountPercent}% mỗi đơn (tối đa ${formatPrice(tier.maxDiscountPerOrder)})`,
    );
  } else {
    lines.push("Chưa có ưu đãi giảm giá trực tiếp");
  }
  lines.push(
    tier.freeShipThreshold > 0
      ? `Miễn phí ship cho đơn từ ${formatPrice(tier.freeShipThreshold)}`
      : "Miễn phí ship mọi đơn hàng",
  );
  return lines;
};

// tier: { name, roman, mergedFrom, areaKm2, discountPercent, maxDiscountPerOrder, freeShipThreshold, color, colorSoft, tagline }
// progress (optional, chỉ truyền cho hạng hiện tại của user): { nextTier, amountToNext, progressPercent, isMaxTier }
export default function LoyaltyBadge({
  tier,
  progress = null,
  variant = "light",
  align = "left",
  showDot = true,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  if (!tier) return null;

  return (
    <span
      className={`lb-badge lb-${variant} ${open ? "lb-open" : ""}`}
      style={{ "--lb-accent": tier.color, "--lb-accent-soft": tier.colorSoft }}
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
    >
      <span className={`lb-chip ${className}`}>
        {showDot && <span className="lb-dot" />}
        <span className="lb-name">{tier.name}</span>
      </span>

      <div className={`lb-panel lb-align-${align}`} role="tooltip">
        <div className="lb-panel-head">
          <span className="lb-panel-roman">Hạng {tier.roman}</span>
          <span className="lb-panel-title">{tier.name}</span>
          {tier.tagline && <span className="lb-panel-tagline">{tier.tagline}</span>}
        </div>

        <div className="lb-panel-row">
          <span className="lb-panel-label">Diện tích tượng trưng</span>
          <span className="lb-panel-value">{formatArea(tier.areaKm2)}</span>
        </div>
        <div className="lb-panel-row">
          <span className="lb-panel-label">Hợp nhất từ</span>
          <span className="lb-panel-value">{tier.mergedFrom}</span>
        </div>

        <div className="lb-panel-divider" />

        <ul className="lb-panel-perks">
          {perkLines(tier).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        {progress && (
          <>
            <div className="lb-panel-divider" />
            {progress.isMaxTier ? (
              <p className="lb-panel-max">
                Hạng cao nhất — cảm ơn bạn đã đồng hành cùng Earthoria!
              </p>
            ) : (
              <div className="lb-panel-progress">
                <div className="lb-progress-track">
                  <div
                    className="lb-progress-fill"
                    style={{ width: `${progress.progressPercent}%` }}
                  />
                </div>
                <p className="lb-panel-next">
                  Chi thêm <strong>{formatPrice(progress.amountToNext)}</strong> để lên{" "}
                  <strong>{progress.nextTier?.name}</strong>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </span>
  );
}