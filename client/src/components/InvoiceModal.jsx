import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { X, Printer, Download } from "lucide-react";
import toast from "react-hot-toast";
import { settingsService } from "../services/settingsService";
import { formatPrice, formatDateTime, getOrderCode } from "../utils/helpers";

const F = {
  serif: "'Playfair Display', serif",
  sans: "'Be Vietnam Pro', sans-serif",
};

// Fallback khi admin chưa cấu hình ở /admin/settings
const COMPANY_FALLBACK = {
  siteName: "Earthoria",
  contactEmail: "helpdesk.earthoria@gmail.com",
  contactPhone: "0849 324 423",
  contactAddress: "600 Nguyễn Văn Cừ Nối Dài, An Bình, Cần Thơ",
};

const PAYMENT_METHOD_LABELS = {
  COD: "Thanh toán khi nhận hàng (COD)",
  VNPAY: "VNPay",
  MOMO: "MoMo",
  BANKQR: "Chuyển khoản ngân hàng (QR)",
  STRIPE: "Thẻ quốc tế",
};

const INK = "#0d3330";
const MUTED = "#5a6b60";
const FAINT = "#8a978f";
const GOLD = "#4a9e3f";

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: FAINT,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 6,
        fontSize: 12,
      }}
    >
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ color: highlight ? GOLD : INK, fontWeight: highlight ? 600 : 400 }}>
        {value}
      </span>
    </div>
  );
}

function TotalRow({ label, value, accent }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12.5,
        padding: "4px 0",
      }}
    >
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ color: accent ? GOLD : INK }}>{value}</span>
    </div>
  );
}

const th = (align, width) => ({
  textAlign: align,
  padding: "10px 8px",
  fontSize: 10.5,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: MUTED,
  width,
});
const td = (align) => ({ textAlign: align, padding: "10px 8px", verticalAlign: "top" });

const toolbarBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  fontSize: 11,
  fontFamily: F.sans,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  border: "1px solid rgba(13,43,30,0.15)",
  borderRadius: 8,
  background: "#fff",
  color: INK,
  cursor: "pointer",
};

export default function InvoiceModal({ order, buyerEmail, onClose }) {
  const [exporting, setExporting] = useState(false);
  const printRef = useRef(null);

  const { data: settings } = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: () => settingsService.getPublic().then((r) => r.data.data),
    staleTime: 30 * 1000,
  });

  const seller = {
    name: settings?.siteName || COMPANY_FALLBACK.siteName,
    email: settings?.contactEmail || COMPANY_FALLBACK.contactEmail,
    phone: settings?.contactPhone || COMPANY_FALLBACK.contactPhone,
    address: settings?.contactAddress || COMPANY_FALLBACK.contactAddress,
  };

  const orderCode = getOrderCode(order);
  const items = order.items || [];

  const addressParts = [
    order.address?.street,
    order.address?.ward,
    order.address?.province,
  ].filter(Boolean);
  const hasPhysicalAddress = addressParts.length > 0;

  const deliveryLabel = order.isDigital
    ? "Sách điện tử — giao qua tài khoản"
    : hasPhysicalAddress
      ? "Giao hàng tận nơi"
      : "Nhận tại cửa hàng";

  const paymentLabel =
    PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || "—";
  const isPaid = order.paymentStatus === "PAID";
  const docTitle = order.requestInvoice ? "HOÁ ĐƠN BÁN HÀNG" : "PHIẾU MUA HÀNG";

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const node = printRef.current;
      if (!node) return;
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`hoa-don-${orderCode || order.id}.pdf`);
    } catch {
      toast.error("Xuất PDF thất bại, vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,46,43,0.6)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 1200,
        padding: "32px 16px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 820,
          borderRadius: 14,
          boxShadow: "0 24px 70px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Thanh công cụ — không in */}
        <div
          className="eo-inv-noprint"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            padding: "16px 24px",
            borderBottom: "1px solid rgba(13,43,30,0.08)",
            background: "#faf8f3",
          }}
        >
          <div
            style={{
              fontFamily: F.sans,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            {docTitle} #{orderCode}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePrint} style={toolbarBtnStyle}>
              <Printer size={14} strokeWidth={1.5} /> In
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={exporting}
              style={{ ...toolbarBtnStyle, opacity: exporting ? 0.6 : 1 }}
            >
              {exporting ? (
                <span className="eo-inv-spin" />
              ) : (
                <Download size={14} strokeWidth={1.5} />
              )}
              {exporting ? "Đang tạo PDF…" : "Tải PDF"}
            </button>
            <button
              onClick={onClose}
              style={{ ...toolbarBtnStyle, border: "none", padding: "8px 10px" }}
              aria-label="Đóng"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Nội dung hoá đơn — vùng in / xuất PDF */}
        <div
          id="eo-invoice-print"
          ref={printRef}
          style={{
            background: "#fff",
            padding: "40px 44px",
            color: INK,
            fontFamily: F.sans,
            fontSize: 12.5,
            lineHeight: 1.6,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 24,
              paddingBottom: 24,
              borderBottom: `2px solid ${INK}`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <img
                src="/logo-chinh.png"
                alt={seller.name}
                style={{ height: 75, width: "auto", objectFit: "contain" }}
              />
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.8 }}>
                <div>{seller.address}</div>
                <div>
                  ĐT: {seller.phone} · Email: {seller.email}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: F.serif,
                  fontSize: 23,
                  fontWeight: 600,
                  color: INK,
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {docTitle}
              </div>
              {order.requestInvoice && (
                <div
                  style={{
                    fontSize: 9.5,
                    color: GOLD,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginTop: 2,
                  }}
                >
                  Theo yêu cầu xuất hoá đơn khi đặt hàng
                </div>
              )}
              <div style={{ fontSize: 12, color: MUTED, marginTop: 10 }}>
                Số: <b style={{ color: INK }}>{orderCode}</b>
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                Ngày đặt: {formatDateTime(order.createdAt)}
              </div>
              <div style={{ fontSize: 11, color: MUTED }}>
                Ngày xuất: {formatDateTime(new Date())}
              </div>
            </div>
          </div>

          {/* Người mua / chi tiết đơn hàng */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              padding: "22px 0",
              borderBottom: "1px solid rgba(13,43,30,0.12)",
            }}
          >
            <div>
              <SectionLabel>Thông tin người mua</SectionLabel>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>
                {order.address?.fullName || "—"}
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                SĐT: {order.address?.phone || "—"}
              </div>
              <div style={{ fontSize: 12, color: MUTED }}>
                Email: {buyerEmail || "—"}
              </div>
              {hasPhysicalAddress && (
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                  Địa chỉ: {addressParts.join(", ")}
                </div>
              )}
            </div>
            <div>
              <SectionLabel>Chi tiết đơn hàng</SectionLabel>
              <div style={{ marginTop: 8 }}>
                <InfoRow label="Hình thức nhận hàng" value={deliveryLabel} />
                <InfoRow label="Phương thức thanh toán" value={paymentLabel} />
                <InfoRow
                  label="Trạng thái thanh toán"
                  value={isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                  highlight={isPaid}
                />
                {order.paidAt && (
                  <InfoRow label="Thời gian thanh toán" value={formatDateTime(order.paidAt)} />
                )}
              </div>
            </div>
          </div>

          {/* Bảng sản phẩm */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 22 }}>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${INK}` }}>
                <th style={th("left", 28)}>#</th>
                <th style={th("left")}>Sản phẩm</th>
                <th style={th("center", 56)}>SL</th>
                <th style={th("right", 110)}>Đơn giá</th>
                <th style={th("right", 120)}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id || i} style={{ borderBottom: "1px solid rgba(13,43,30,0.08)" }}>
                  <td style={td("left")}>{i + 1}</td>
                  <td style={td("left")}>
                    {item.book?.title || "Sản phẩm không xác định"}
                  </td>
                  <td style={td("center")}>{item.quantity}</td>
                  <td style={td("right")}>{formatPrice(item.price)}</td>
                  <td style={td("right")}>{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tổng kết */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <div style={{ width: 270 }}>
              <TotalRow label="Tạm tính" value={formatPrice(order.subtotal ?? order.total)} />
              {(() => {
                const tierPortion = order.loyaltyDiscount || 0;
                const couponPortion = Math.max((order.discount || 0) - tierPortion, 0);
                return (
                  <>
                    {couponPortion > 0 && (
                      <TotalRow
                        label={`Giảm giá${order.couponCode ? ` (${order.couponCode})` : ""}`}
                        value={`−${formatPrice(couponPortion)}`}
                        accent
                      />
                    )}
                    {tierPortion > 0 && (
                      <TotalRow
                        label="Ưu đãi hạng thành viên"
                        value={`−${formatPrice(tierPortion)}`}
                        accent
                      />
                    )}
                  </>
                );
              })()}
              <TotalRow
                label="Phí vận chuyển"
                value={order.shippingFee ? formatPrice(order.shippingFee) : "Miễn phí"}
              />
              <div style={{ height: 1, background: INK, margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Tổng cộng</span>
                <span style={{ fontSize: 19, fontWeight: 700, color: INK, fontFamily: F.serif }}>
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer / chữ ký */}
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px dashed rgba(13,43,30,0.25)" }}>
            <div
              style={{
                fontSize: 11.5,
                color: MUTED,
                fontStyle: "italic",
                textAlign: "center",
                marginBottom: 30,
              }}
            >
              Cảm ơn bạn đã tin tưởng và mua sắm tại {seller.name}!
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Người mua hàng
                </div>
                <div style={{ height: 64 }} />
                <div style={{ fontSize: 10, color: MUTED }}>(Ký, ghi rõ họ tên)</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Đại diện {seller.name}
                </div>
                <div
                  style={{
                    height: 64,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 21, color: INK }}>
                    {seller.name}
                  </div>
                  <div style={{ fontSize: 9, color: GOLD, marginTop: 4 }}>
                    ✓ Đã ký điện tử
                  </div>
                </div>
                <div style={{ fontSize: 10, color: MUTED }}>
                  Xác thực bởi hệ thống {seller.name}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 9.5, color: FAINT, textAlign: "center", marginTop: 32 }}>
              Chứng từ được hệ thống {seller.name} tạo tự động để đối soát và lưu trữ cá nhân —
              không phải hoá đơn điện tử phát hành qua cơ quan thuế.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .eo-inv-spin {
          width: 12px; height: 12px; border-radius: 50%;
          border: 1.5px solid rgba(13,43,30,0.15); border-top-color: ${INK};
          display: inline-block; animation: eoInvSpin 0.7s linear infinite;
        }
        @keyframes eoInvSpin { to { transform: rotate(360deg); } }

        @media print {
          body * { visibility: hidden !important; }
          #eo-invoice-print, #eo-invoice-print * { visibility: visible !important; }
          #eo-invoice-print {
            position: absolute; left: 0; top: 0; width: 100%;
            padding: 16px 24px !important;
          }
        }
      `}</style>
    </div>,
    document.body,
  );
}