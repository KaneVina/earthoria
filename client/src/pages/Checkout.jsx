import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Lock,
  MapPin,
  Phone,
  Mail,
  Truck,
  FileText,
  CreditCard,
  Wallet,
  Package,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Tag,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { formatPrice } from "../utils/helpers";
import toast from "react-hot-toast";
import { orderService } from "../services/orderService";
import api from "../services/api";
import { addressService } from '../services/addressService'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})
// ── helpers ──
function stripDiacritics(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

// ── hooks địa chỉ 2 cấp ──
function useProvinces() {
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/v2/p/")
      .then((r) => r.json())
      .then((data) =>
        setProvinces((data || []).map((p) => ({ code: p.code, name: p.name }))),
      )
      .catch(() => toast.error("Không tải được danh sách tỉnh/thành"))
      .finally(() => setLoading(false));
  }, []);
  return { provinces, loading };
}

function useWards(provinceCode) {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      return;
    }
    setLoading(true);
    fetch(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`)
      .then((r) => r.json())
      .then((data) =>
        setWards(
          (data?.wards || []).map((w) => ({ code: w.code, name: w.name })),
        ),
      )
      .catch(() => toast.error("Không tải được danh sách phường/xã"))
      .finally(() => setLoading(false));
  }, [provinceCode]);
  return { wards, loading };
}

// ── LocationCombobox ──
function LocationCombobox({
  label,
  placeholder,
  value,
  options,
  loading,
  disabled,
  disabledHint,
  onSelect,
  error,
}) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) =>
        stripDiacritics(o.name).includes(stripDiacritics(query)),
      )
    : options;

  const handleSelect = (opt) => {
    onSelect(opt);
    setQuery(opt.name);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlight]) handleSelect(filtered[highlight]);
    }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div style={{ position: "relative" }} ref={wrapRef}>
      <label
        style={{
          display: "block",
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {label} <span style={{ color: "var(--gold)", fontSize: 12 }}>*</span>
      </label>

      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder={disabled ? disabledHint : placeholder}
          onFocus={() => !disabled && setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
            if (value) onSelect(null);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: disabled ? "var(--parchment)" : "var(--white)",
            border: `0.5px solid ${error ? "#c0392b" : "var(--border)"}`,
            padding: "13px 40px 13px 16px",
            fontFamily: "Be Vietnam Pro, sans-serif",
            fontSize: 13,
            color: disabled ? "var(--mist)" : "var(--forest)",
            outline: "none",
            cursor: disabled ? "not-allowed" : "text",
            opacity: disabled ? 0.65 : 1,
          }}
        />
        {/* spinner hoặc check */}
        <div
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            display: "flex",
          }}
        >
          {loading ? (
            <Loader2
              size={14}
              style={{
                animation: "spin 0.8s linear infinite",
                color: "var(--gold)",
              }}
            />
          ) : value ? (
            <Check size={14} style={{ color: "var(--gold)" }} />
          ) : (
            <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
              <path
                d="M1 1l5 5 5-5"
                stroke="var(--text-muted)"
                strokeWidth="1"
              />
            </svg>
          )}
        </div>
      </div>

      {/* error */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: "#c0392b",
            marginTop: 4,
          }}
        >
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {/* dropdown */}
      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 60,
            background: "var(--white)",
            border: "0.5px solid var(--border-gold)",
            boxShadow: "0 20px 44px rgba(13,43,30,0.14)",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "14px 16px",
                fontSize: 12,
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              Không tìm thấy kết quả
            </div>
          ) : (
            filtered.slice(0, 60).map((opt, i) => (
              <div
                key={opt.code}
                onMouseDown={() => handleSelect(opt)}
                onMouseEnter={() => setHighlight(i)}
                style={{
                  padding: "10px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  borderBottom: "0.5px solid var(--border)",
                  background:
                    i === highlight
                      ? "var(--gold-pale)"
                      : opt.name === value
                        ? "var(--cream)"
                        : "transparent",
                  color: opt.name === value ? "var(--gold)" : "var(--forest)",
                  fontWeight: opt.name === value ? 500 : 300,
                  transition: "background 0.15s",
                }}
              >
                {opt.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const FREE_SHIP_THRESHOLD = 300_000;
const SHIP_FEE = 30_000;

const COUPONS = {
  EARTH15: { label: "Giảm 15%", pct: 0.15 },
  EARTH20: { label: "Giảm 20%", pct: 0.2 },
  NEWUSER: { label: "Tân khách − 10%", pct: 0.1 },
};

const PAYMENT_OPTIONS = [
  {
    id: "cod",
    icon: Truck,
    label: "Thanh toán khi nhận hàng",
    sub: "Trả tiền mặt cho shipper",
  },
  {
    id: "vnpay",
    icon: CreditCard,
    label: "VNPay",
    sub: "Cổng thanh toán nội địa",
  },
  {
    id: "momo",
    icon: Wallet,
    label: "Ví MoMo",
    sub: "Ví điện tử MoMo",
  },
  {
    id: "card",
    icon: CreditCard,
    label: "Thẻ quốc tế",
    sub: "Visa / Mastercard / JCB",
  },
];

/* ─────────────────────────────────────────
   PROVINCE API  (provinces.open-api.vn)
───────────────────────────────────────── */
const API = "https://provinces.open-api.vn/api";

const fetchProvinces = () =>
  fetch(`${API}/?depth=1`).then((r) => {
    if (!r.ok) throw new Error();
    return r.json();
  });

const fetchDistricts = (code) =>
  fetch(`${API}/p/${code}?depth=2`)
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((d) => d.districts || []);

const fetchWards = (code) =>
  fetch(`${API}/d/${code}?depth=2`)
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((d) => d.wards || []);

/* ─────────────────────────────────────────
   VALIDATION
───────────────────────────────────────── */
function validateShipping(f, mode = 'shipping') {
  const e = {}
  if (!f.fullName.trim() || f.fullName.trim().length < 2)
    e.fullName = 'Vui lòng nhập họ tên (tối thiểu 2 ký tự)'
  if (!/^(0[3-9]\d{8}|\+84[3-9]\d{8})$/.test(f.phone.replace(/\s/g, '')))
    e.phone = 'Số điện thoại Việt Nam không hợp lệ'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
    e.email = 'Địa chỉ email không hợp lệ'
  if (mode === 'shipping') {
    if (!f.provinceCode && !f.provinceName) e.province = 'Chọn tỉnh / thành phố'
    if (!f.wardCode && !f.wardName)         e.ward     = 'Chọn phường / xã'
    if (!f.street.trim())                   e.street   = 'Nhập số nhà và tên đường'
  }
  return e
}

function validatePayment(method, card) {
  const e = {};
  if (!method) {
    e.method = "Vui lòng chọn phương thức thanh toán";
    return e;
  }
  if (method === "card") {
    if (!/^\d{16}$/.test(card.number.replace(/\s/g, "")))
      e.number = "Số thẻ phải gồm 16 chữ số";
    if (!card.holder.trim()) e.holder = "Nhập tên chủ thẻ";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry))
      e.expiry = "Định dạng MM/YY";
    if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = "CVV không hợp lệ";
  }
  return e;
}

/* ─────────────────────────────────────────
   TINY HELPERS
───────────────────────────────────────── */
const fmtCard = (v) =>
  v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
const fmtExpiry = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */

/** Step indicator bar */
function StepBar({ current }) {
  const steps = [
    { n: 1, label: "Giao hàng" },
    { n: 2, label: "Thanh toán" },
    { n: 3, label: "Xác nhận" },
  ];
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
            {/* circle + label */}
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
                }}
              >
                {s.label}
              </span>
            </div>
            {/* connector */}
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

/** Section header inside form */
function SectionHead({ icon: Icon, title }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: "0.5px solid var(--border-gold)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--gold)",
          flexShrink: 0,
        }}
      >
        <Icon size={16} strokeWidth={1.5} />
      </div>
      <h2
        style={{
          fontFamily: "Playfair Display, serif",
          fontSize: 22,
          fontWeight: 400,
          color: "var(--forest)",
          margin: 0,
        }}
      >
        {title}
      </h2>
      <div style={{ flex: 1, height: 0.5, background: "var(--border-gold)" }} />
    </div>
  );
}

/** Form field wrapper */
function Field({ label, required, error, children }) {
  return (
    <div
      className="form-group"
      style={{ display: "flex", flexDirection: "column", gap: 6 }}
    >
      <label
        style={{
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          fontWeight: 400,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--gold)", fontSize: 12 }}>*</span>
        )}
      </label>
      {children}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: "#c0392b",
            marginTop: 2,
          }}
        >
          <AlertCircle size={12} /> {error}
        </div>
      )}
    </div>
  );
}

/** Styled native select with chevron */
function AppSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  error,
  loading,
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        style={{
          width: "100%",
          background: disabled || loading ? "var(--parchment)" : "var(--white)",
          border: `0.5px solid ${error ? "#c0392b" : "var(--border)"}`,
          padding: "13px 40px 13px 16px",
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 13,
          fontWeight: 300,
          color: value ? "var(--forest)" : "var(--mist)",
          outline: "none",
          appearance: "none",
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: disabled || loading ? 0.65 : 1,
          transition: "border-color 0.25s, box-shadow 0.25s",
          borderRadius: 0,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.code} value={String(o.code)}>
            {o.name}
          </option>
        ))}
      </select>
      <div
        style={{
          position: "absolute",
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--text-muted)",
          display: "flex",
        }}
      >
        {loading ? (
          <Loader2
            size={14}
            style={{ animation: "spin 0.8s linear infinite" }}
          />
        ) : (
          <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
            <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1" />
          </svg>
        )}
      </div>
    </div>
  );
}

/** Next / Back buttons row */
function NavRow({
  onBack,
  onNext,
  backLabel = "Quay lại",
  nextLabel,
  loading,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 40,
        paddingTop: 32,
        borderTop: "0.5px solid var(--border)",
      }}
    >
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          border: "0.5px solid var(--border)",
          padding: "13px 24px",
          cursor: "pointer",
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          transition: "all 0.25s",
        }}
      >
        <ArrowLeft size={13} /> {backLabel}
      </button>
      <button
        onClick={onNext}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: loading ? "var(--sage)" : "var(--forest)",
          border: "none",
          padding: "15px 40px",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--ivory)",
          transition: "background 0.3s",
        }}
      >
        {loading ? (
          <>
            <Loader2
              size={14}
              style={{ animation: "spin 0.8s linear infinite" }}
            />{" "}
            Đang xử lý...
          </>
        ) : (
          <>
            {nextLabel} <ChevronRight size={14} />
          </>
        )}
      </button>
    </div>
  );
}

/** Review block on step 3 */
function ReviewBlock({ title, icon: Icon, onEdit, rows, children }) {
  return (
    <div
      style={{
        border: "0.5px solid var(--border)",
        background: "var(--white)",
        marginBottom: 16,
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 20px",
          background: "var(--ivory)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon size={14} strokeWidth={1.5} style={{ color: "var(--gold)" }} />
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            {title}
          </span>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--gold)",
              fontFamily: "Be Vietnam Pro, sans-serif",
            }}
          >
            Sửa
          </button>
        )}
      </div>
      {/* rows */}
      <div style={{ padding: "16px 20px" }}>
        {rows &&
          rows.map(
            (r, i) =>
              r.value && (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "8px 0",
                    borderBottom:
                      i < rows.length - 1
                        ? "0.5px solid var(--border)"
                        : "none",
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontWeight: 300,
                      flexShrink: 0,
                    }}
                  >
                    {r.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--forest)",
                      textAlign: "right",
                    }}
                  >
                    {r.value}
                  </span>
                </div>
              ),
          )}
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ORDER SUMMARY SIDEBAR
   (luôn hiển thị bên phải, sync với cart)
───────────────────────────────────────── */
function OrderSummary({
  items,
  subtotal,
  discount,
  couponApplied,
  shippingFee,
  total,
  couponInput,
  setCouponInput,
  onApply,
  onRemoveCoupon,
}) {
  const afterDiscount = subtotal - discount;
  const pct = Math.min((afterDiscount / FREE_SHIP_THRESHOLD) * 100, 100);

  return (
    <aside
      style={{
        position: "sticky",
        top: 100,
        background: "var(--white)",
        border: "0.5px solid var(--border)",
      }}
    >
      {/* shipping progress */}
      <div style={{ background: "var(--forest)", padding: "18px 22px" }}>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
            marginBottom: 10,
            fontWeight: 300,
          }}
        >
          {afterDiscount >= FREE_SHIP_THRESHOLD ? (
            <span>
              <Truck size={16} color="var(--forest)" /> Bạn được{" "}
              <strong style={{ color: "var(--ivory)" }}>
                miễn phí giao hàng!
              </strong>
            </span>
          ) : (
            <>
              Mua thêm{" "}
              <strong style={{ color: "var(--ivory)" }}>
                {formatPrice(FREE_SHIP_THRESHOLD - afterDiscount)}
              </strong>{" "}
              để <span style={{ color: "var(--gold)" }}>miễn phí ship</span>
            </>
          )}
        </div>
        <div
          style={{
            height: 2,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 1,
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 1,
              background: "linear-gradient(90deg, #4a9e3f, #5cb84f)",
              width: `${pct}%`,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* item list */}
      <div
        style={{
          padding: "18px 22px",
          borderBottom: "0.5px solid var(--border)",
          maxHeight: 240,
          overflowY: "auto",
        }}
      >
        {items.map((item) => {
          const price = item.book?.salePrice || item.book?.price || 0;
          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 14,
                alignItems: "flex-start",
              }}
            >
              {/* thumbnail + qty badge */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={
                    item.book?.coverImage ||
                    "https://placehold.co/52x68/e8e4dc/0d3330?text=Book"
                  }
                  alt={item.book?.title}
                  style={{
                    width: 52,
                    height: 68,
                    objectFit: "cover",
                    border: "0.5px solid var(--border)",
                    display: "block",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--forest)",
                    color: "var(--ivory)",
                    fontSize: 10,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.quantity}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: 13,
                    color: "var(--forest)",
                    lineHeight: 1.35,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    marginBottom: 4,
                  }}
                >
                  {item.book?.title}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {formatPrice(price)} × {item.quantity}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: 14,
                  color: "var(--forest)",
                  flexShrink: 0,
                }}
              >
                {formatPrice(price * item.quantity)}
              </div>
            </div>
          );
        })}
      </div>

      {/* coupon input */}
      <div
        style={{
          padding: "14px 22px",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        {couponApplied ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 12px",
              background: "var(--gold-pale)",
              border: "0.5px solid var(--border-gold)",
            }}
          >
            <Tag size={13} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, color: "var(--forest)" }}>
              <strong>{couponApplied.code}</strong> — {couponApplied.label}
            </span>
            <button
              onClick={onRemoveCoupon}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex" }}>
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && onApply()}
              placeholder="Mã giảm giá"
              style={{
                flex: 1,
                background: "var(--ivory)",
                border: "0.5px solid var(--border)",
                borderRight: "none",
                padding: "9px 12px",
                fontFamily: "Be Vietnam Pro, sans-serif",
                fontSize: 12,
                color: "var(--forest)",
                outline: "none",
                letterSpacing: "0.06em",
              }}
            />
            <button
              onClick={onApply}
              style={{
                background: "var(--forest)",
                border: "none",
                padding: "9px 16px",
                cursor: "pointer",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ivory)",
                fontFamily: "Be Vietnam Pro, sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              Áp dụng
            </button>
          </div>
        )}
      </div>

      {/* totals */}
      <div style={{ padding: "18px 22px" }}>
        {[
          {
            label: `Tạm tính (${items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)`,
            val: formatPrice(subtotal),
            color: "var(--forest)",
          },
          discount > 0 && {
            label: `Giảm giá (${couponApplied?.label})`,
            val: `−${formatPrice(discount)}`,
            color: "#4a9e3f",
          },
          {
            label: "Phí giao hàng",
            val: shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee),
            color: shippingFee === 0 ? "#4a9e3f" : "var(--forest)",
          },
        ]
          .filter(Boolean)
          .map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              <span style={{ color: "var(--text-muted)", fontWeight: 300 }}>
                {line.label}
              </span>
              <span style={{ color: line.color, fontWeight: 400 }}>
                {line.val}
              </span>
            </div>
          ))}

        <div
          style={{ height: 0.5, background: "var(--border)", margin: "14px 0" }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 16,
              color: "var(--forest)",
            }}
          >
            Tổng cộng
          </span>
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 30,
              fontWeight: 300,
              color: "var(--forest)",
            }}
          >
            {formatPrice(total)}
          </span>
        </div>
        <div
          style={{
            textAlign: "right",
            fontSize: 10,
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          Đã bao gồm VAT (nếu có)
        </div>
      </div>

      {/* trust signals */}
      <div
        style={{
          padding: "14px 22px",
          background: "var(--cream)",
          borderTop: "0.5px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {[
          [Lock, "Thanh toán bảo mật SSL 256‑bit"],
          [RotateCcw, "Đổi trả miễn phí trong 30 ngày"],
          [Package, "Giao hàng 2–4 ngày toàn quốc"],
          [ShieldCheck, "Bảo vệ quyền lợi người mua"],
        ].map(([Icon, text], i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: "var(--text-muted)",
            }}
          >
            <Icon
              size={12}
              strokeWidth={1.5}
              style={{ color: "var(--gold)", flexShrink: 0 }}
            />
            {text}
          </div>
        ))}
      </div>

      {/* accepted payments */}
      <div
        style={{
          padding: "12px 22px",
          borderTop: "0.5px solid var(--border)",
          display: "flex",
          gap: 6,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {["VISA", "MC", "JCB", "VNPAY", "MOMO", "COD"].map((p) => (
          <span
            key={p}
            style={{
              padding: "3px 8px",
              border: "0.5px solid var(--border)",
              fontSize: 9,
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
            }}
          >
            {p}
          </span>
        ))}
      </div>
    </aside>
  );
}
function MapClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) } })
  return null
}
/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function Checkout() {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCartStore();

  /* ── step state ── */
  const [step, setStep] = useState(1);

  /* ── shipping form ── */
  const [ship, setShip] = useState({
    fullName: "",
    phone: "",
    email: "",
    provinceCode: "",
    provinceName: "",
    wardCode: "",
    wardName: "",
    street: "",
    note: "",
  });
  const [shipErr, setShipErr] = useState({});
  const { provinces, loading: provincesLoading } = useProvinces();
  const { wards, loading: wardsLoading } = useWards(ship.provinceCode);
  /* ── payment ── */
  const [method, setMethod] = useState("");
  const [card, setCard] = useState({
    number: "",
    holder: "",
    expiry: "",
    cvc: "",
  });
  const [cardErr, setCardErr] = useState({});
  const [showCvc, setShowCvc] = useState(false);
  const [payErr, setPayErr] = useState({});

  /* ── coupon ── */
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);

  /* ── submission ── */
  const [placing, setPlacing] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState('shipping')
const [savedAddresses, setSavedAddresses] = useState([])
const [selectedAddressId, setSelectedAddressId] = useState(null)
const [showMapModal, setShowMapModal] = useState(false)
const [mapPin, setMapPin] = useState(null)
const [mapSearch, setMapSearch] = useState('')
const [mapSearching, setMapSearching] = useState(false)
const [mapStep, setMapStep] = useState('map')
const [newAddrForm, setNewAddrForm] = useState({
  fullName: '', phone: '', street: '', province: '', ward: '', isDefault: false,
})
const [savingAddr, setSavingAddr] = useState(false)
  const [deliveryCoords, setDeliveryCoords] = useState({
    lat: null,
    lng: null,
  });
  /* ── scroll helper ── */
  const topRef = useRef(null);
  const scrollTop = () =>
    topRef.current?.scrollIntoView({ behavior: "smooth" });

  /* ── fetch cart on mount ── */
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);
const applyAddress = (addr) => {
  setSelectedAddressId(addr.id)
  setShip(f => ({
    ...f,
    fullName:     addr.fullName,
    phone:        addr.phone,
    provinceName: addr.province,
    provinceCode: f.provinceCode,
    wardName:     addr.ward,
    wardCode:     f.wardCode,
    street:       addr.street,
  }))
  if (addr.lat && addr.lng) {
    setDeliveryCoords({ lat: addr.lat, lng: addr.lng })
    const currentSubtotal = (cart?.items || []).reduce(
      (s, i) => s + (i.book?.salePrice || i.book?.price || 0) * i.quantity, 0
    )
    api.post('/orders/shipping-fee', { lat: addr.lat, lng: addr.lng, subtotal: currentSubtotal })
      .then(({ data }) => setShipCalc({ ...data.data, loading: false }))
      .catch(() => {})
  }
}

useEffect(() => {
  addressService.getAll()
    .then(({ data }) => {
      const list = data.data || []
      setSavedAddresses(list)
      const def = list.find(a => a.isDefault)
      if (def) applyAddress(def)
    })
    .catch(() => {})
}, [])

  /* ── items & totals ── */
  const items = cart?.items || [];
  const subtotal = items.reduce(
    (s, i) => s + (i.book?.salePrice || i.book?.price || 0) * i.quantity,
    0,
  );
  const discount = couponApplied ? Math.round(subtotal * couponApplied.pct) : 0;
  const [shipCalc, setShipCalc] = useState({
    km: null,
    fee: 30_000,
    free: false,
    loading: false,
  });
  const [showPriceModal, setShowPriceModal] = useState(false);

  const afterDiscount = subtotal - discount;
  const shippingFee =
    afterDiscount >= FREE_SHIP_THRESHOLD ? 0 : shipCalc.fee || SHIP_FEE;
  const total = afterDiscount + shippingFee;
  const selectProvince = (opt) => {
    setShip((f) => ({
      ...f,
      provinceCode: opt ? opt.code : "",
      provinceName: opt ? opt.name : "",
      wardCode: "",
      wardName: "", // reset ward khi đổi tỉnh
    }));
  };

  const selectWard = async (opt) => {
    setShip((f) => ({
      ...f,
      wardCode: opt ? opt.code : "",
      wardName: opt ? opt.name : "",
    }));
    if (!opt) return;

    setShipCalc((s) => ({ ...s, loading: true }));

    // Nominatim geocode để lấy lat/lng
    let lat = null,
      lng = null;
    try {
      const query = `${opt.name}, ${ship.provinceName}, Vietnam`;
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { "Accept-Language": "vi" } },
      );
      const geoData = await geoRes.json();
      if (geoData[0]) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
        setDeliveryCoords({ lat, lng });
      }
    } catch {
      /* bỏ qua */
    }

    // Gọi backend tính phí
    try {
      const { data } = await api.post("/orders/shipping-fee", {
        lat,
        lng,
        subtotal,
      });
      setShipCalc({ ...data.data, loading: false });
    } catch {
      setShipCalc({
        km: null,
        fee: 30_000,
        isNoiO: false,
        free: false,
        loading: false,
      });
    }
  };

  /* ── coupon ── */
  const applyCoupon = () => {
    const key = couponInput.trim().toUpperCase();
    if (COUPONS[key]) {
      setCouponApplied({ code: key, ...COUPONS[key] });
      toast.success(`Áp dụng ${key} thành công!`);
    } else {
      toast.error("Mã giảm giá không hợp lệ");
    }
  };

  /* ── step navigation ── */
  const goToStep2 = () => {
    const e = validateShipping(ship, deliveryMode);
    setShipErr(e);
    if (Object.keys(e).length) {
      toast.error("Vui lòng điền đủ thông tin giao hàng");
      return;
    }
    setStep(2);
    scrollTop();
  };

  const goToStep3 = () => {
    const e = validatePayment(method, card);
    if (method === "card") setCardErr(e);
    setPayErr(e);
    if (Object.keys(e).length) {
      toast.error("Vui lòng hoàn tất thông tin thanh toán");
      return;
    }
    setStep(3);
    scrollTop();
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      await orderService.createOrder({
        shipping: {
          fullName: ship.fullName,
          phone: ship.phone,
          email: ship.email,
          province: ship.provinceName,
          ward: ship.wardName,
          provinceCode: ship.provinceCode,
          wardCode: ship.wardCode,
          street: ship.street,
          note: ship.note,
        },
        paymentMethod: method,
        couponCode: couponApplied?.code || null,
        note: ship.note || null,
      });
      toast.success("Đặt hàng thành công!");
      navigate("/order-success");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Đặt hàng thất bại, thử lại!",
      );
    } finally {
      setPlacing(false);
    }
  };

  /* ── empty cart guard ── */
  if (!cart || items.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          paddingTop: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--ivory)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              border: "0.5px solid var(--border-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gold)",
              margin: "0 auto 24px",
            }}
          >
            <Package size={28} strokeWidth={1} />
          </div>
          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 26,
              fontWeight: 300,
              color: "var(--forest)",
              marginBottom: 12,
            }}
          >
            Giỏ hàng{" "}
            <em style={{ color: "var(--gold)", fontStyle: "italic" }}>
              đang trống
            </em>
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 32,
            }}
          >
            Thêm sản phẩm vào giỏ trước khi thanh toán.
          </p>
          <Link to="/shop">
            <button className="btn-primary" style={{ padding: "14px 32px" }}>
              Khám phá cửa hàng →
            </button>
          </Link>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div
      ref={topRef}
      style={{ minHeight: "100vh", paddingTop: 80, background: "var(--ivory)" }}
    >
      {/* ── keyframes (inline so no external CSS needed) ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .co-step { animation: fadeUp 0.38s cubic-bezier(0.16,1,0.3,1) both; }
        .co-input:focus { border-color: var(--gold) !important; box-shadow: 0 0 0 3px rgba(74,158,63,0.1); }
        .co-input.error  { border-color: #c0392b !important; }
        .pay-tile { transition: all 0.25s; cursor: pointer; }
        .pay-tile:hover  { border-color: var(--border-gold) !important; background: var(--gold-pale) !important; }
        .pay-tile.active { border-color: var(--gold) !important; background: var(--gold-pale) !important; }
      `}</style>

      {/* breadcrumb */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">
          Trang chủ
        </Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/shop" className="breadcrumb-item">
          Cửa hàng
        </Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/cart" className="breadcrumb-item">
          Giỏ hàng
        </Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Thanh toán</span>
      </div>

      {/* page title */}
      <div
        style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 100px 0" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 10,
          }}
        >
          <div className="eyebrow-line" />
          <span className="eyebrow-text">Thanh toán an toàn</span>
          <Lock size={11} style={{ color: "var(--gold)" }} />
        </div>
        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(36px,5vw,64px)",
            fontWeight: 300,
            color: "var(--forest)",
            marginBottom: 40,
          }}
        >
          Đặt{" "}
          <em style={{ fontStyle: "italic", color: "var(--gold)" }}>Hàng</em>
        </h1>

        <StepBar current={step} />
      </div>

      {/* main 2-col layout */}
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "8px 100px 120px",
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: 60,
          alignItems: "start",
        }}
      >
        {/* ══════════════════════════════════════
            LEFT COLUMN — steps
        ══════════════════════════════════════ */}
        <div>
          {/* ┌──────────────────────────────────┐
              │  STEP 1 — Thông tin giao hàng    │
              └──────────────────────────────────┘ */}
{step === 1 && (
            <div className="co-step">
              <SectionHead icon={MapPin} title="Thông tin giao hàng" />

              {/* ── Tile chọn hình thức ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                {[
                  { id: 'pickup', icon: Package, label: 'Lấy tại shop', sub: '600 Nguyễn Văn Cừ, An Bình, Cần Thơ', fee: 'Miễn phí' },
                  { id: 'shipping', icon: Truck, label: 'Giao hàng tận nơi', sub: 'Toàn quốc · GHTK / GHN', fee: 'Tính theo khoảng cách' },
                ].map((opt) => {
                  const Icon = opt.icon
                  const active = deliveryMode === opt.id
                  return (
                    <button key={opt.id} onClick={() => {
                      setDeliveryMode(opt.id)
                      if (opt.id === 'pickup') setShipCalc({ km: 0, fee: 0, free: true, isNoiO: true, loading: false })
                    }} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '18px 20px', textAlign: 'left', cursor: 'pointer',
                      background: active ? 'var(--gold-pale)' : 'var(--white)',
                      border: `${active ? '1.5px' : '0.5px'} solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                      fontFamily: 'Be Vietnam Pro, sans-serif', transition: 'all 0.25s',
                    }}>
                      <div style={{
                        width: 40, height: 40, flexShrink: 0,
                        border: '0.5px solid var(--border-gold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: active ? 'var(--gold)' : 'var(--text-muted)', transition: 'color 0.25s',
                      }}>
                        <Icon size={18} strokeWidth={1.5} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--forest)', fontWeight: active ? 500 : 300, marginBottom: 3 }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{opt.sub}</div>
                        <div style={{ fontSize: 10, letterSpacing: '0.12em', color: active ? 'var(--gold)' : 'var(--text-muted)', textTransform: 'uppercase' }}>{opt.fee}</div>
                      </div>
                      {active && <Check size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>

              {/* ── PICKUP ── */}
              {deliveryMode === 'pickup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{
                    padding: '14px 18px', background: 'rgba(74,158,63,0.06)',
                    border: '0.5px solid rgba(74,158,63,0.25)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <MapPin size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--forest)', fontWeight: 400 }}>Earthoria Store — FPT University Cần Thơ</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>600 Nguyễn Văn Cừ (nối dài), Phường An Bình · Giờ mở cửa: 8:00 – 21:00</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Họ và tên" required error={shipErr.fullName}>
                      <input className={`co-input${shipErr.fullName ? ' error' : ''}`}
                        value={ship.fullName} onChange={e => setShip(f => ({ ...f, fullName: e.target.value }))}
                        placeholder="Nguyễn Văn An"
                        style={{ border: `0.5px solid ${shipErr.fullName ? '#c0392b' : 'var(--border)'}` }} />
                    </Field>
                    <Field label="Số điện thoại" required error={shipErr.phone}>
                      <input className={`co-input${shipErr.phone ? ' error' : ''}`}
                        value={ship.phone} type="tel" onChange={e => setShip(f => ({ ...f, phone: e.target.value }))}
                        placeholder="0912 345 678"
                        style={{ border: `0.5px solid ${shipErr.phone ? '#c0392b' : 'var(--border)'}` }} />
                    </Field>
                  </div>
                  <Field label="Email nhận xác nhận đơn hàng" required error={shipErr.email}>
                    <input className={`co-input${shipErr.email ? ' error' : ''}`}
                      value={ship.email} type="email" onChange={e => setShip(f => ({ ...f, email: e.target.value }))}
                      placeholder="ten@email.com"
                      style={{ border: `0.5px solid ${shipErr.email ? '#c0392b' : 'var(--border)'}` }} />
                  </Field>
                  <Field label="Ghi chú (không bắt buộc)">
                    <textarea value={ship.note} onChange={e => setShip(f => ({ ...f, note: e.target.value }))}
                      placeholder="Thời gian đến lấy dự kiến…"
                      style={{ background: 'var(--white)', border: '0.5px solid var(--border)', padding: '13px 16px', fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 13, color: 'var(--forest)', fontWeight: 300, outline: 'none', resize: 'vertical', minHeight: 72, width: '100%', boxSizing: 'border-box', borderRadius: 0 }} />
                  </Field>
                </div>
              )}

              {/* ── SHIPPING ── */}
              {deliveryMode === 'shipping' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Email — chung cả 2 mode */}
                  <Field label="Email nhận xác nhận đơn hàng" required error={shipErr.email}>
                    <input className={`co-input${shipErr.email ? ' error' : ''}`}
                      value={ship.email} type="email" onChange={e => setShip(f => ({ ...f, email: e.target.value }))}
                      placeholder="ten@email.com"
                      style={{ border: `0.5px solid ${shipErr.email ? '#c0392b' : 'var(--border)'}` }} />
                  </Field>

                  {/* Danh sách địa chỉ đã lưu */}
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Địa chỉ giao hàng <span style={{ color: 'var(--gold)' }}>*</span>
                    </div>

                    {savedAddresses.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {savedAddresses.map(addr => (
                          <div key={addr.id} onClick={() => applyAddress(addr)} style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 16px', cursor: 'pointer',
                            border: `${selectedAddressId === addr.id ? '1.5px' : '0.5px'} solid ${selectedAddressId === addr.id ? 'var(--gold)' : 'var(--border)'}`,
                            background: selectedAddressId === addr.id ? 'var(--gold-pale)' : 'var(--white)',
                            transition: 'all 0.2s',
                          }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                              border: `2px solid ${selectedAddressId === addr.id ? 'var(--gold)' : 'var(--border)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {selectedAddressId === addr.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                <span style={{ fontSize: 13, color: 'var(--forest)', fontWeight: 400 }}>{addr.fullName}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{addr.phone}</span>
                                {addr.isDefault && <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', background: 'var(--forest)', padding: '2px 7px' }}>Mặc định</span>}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {[addr.street, addr.ward, addr.province].filter(Boolean).join(', ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {savedAddresses.length === 0 && (
                      <div style={{ padding: '16px', textAlign: 'center', border: '0.5px dashed var(--border)', marginBottom: 12, fontSize: 13, color: 'var(--text-muted)', fontWeight: 300 }}>
                        Chưa có địa chỉ nào được lưu
                      </div>
                    )}

                    {/* Nút thêm địa chỉ */}
                    <button onClick={() => { setShowMapModal(true); setMapStep('map') }} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'transparent', border: '0.5px dashed var(--border-gold)',
                      padding: '12px 20px', cursor: 'pointer', width: '100%',
                      justifyContent: 'center', fontFamily: 'Be Vietnam Pro, sans-serif',
                      fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--gold)', transition: 'all 0.25s',
                    }}>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Thêm địa chỉ mới
                    </button>
                  </div>

                  {/* Địa chỉ đã chọn summary */}
                  {selectedAddressId && (
                    <div style={{ padding: '14px 18px', background: 'var(--cream)', border: '0.5px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                        Giao đến —{' '}
                        <button onClick={() => setSelectedAddressId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: 11, padding: 0 }}>Thay đổi</button>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--forest)' }}>{ship.fullName} · {ship.phone}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                        {[ship.street, ship.wardName, ship.provinceName].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Phí ship box */}
                  {ship.wardName && (
                    <div style={{
                      padding: '14px 18px',
                      background: shipCalc.free ? 'rgba(74,158,63,0.06)' : 'var(--cream)',
                      border: `0.5px solid ${shipCalc.free ? 'rgba(74,158,63,0.3)' : 'var(--border)'}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--forest)', fontWeight: 400 }}>Phí giao hàng</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                          {shipCalc.loading ? 'Đang tính...'
                            : shipCalc.free ? 'Miễn phí'
                            : shipCalc.isNoiO ? `Nội ô · ${shipCalc.km} km · `
                            : shipCalc.km ? `${shipCalc.km} km · `
                            : 'Không xác định · '}
                          {!shipCalc.loading && !shipCalc.free && (
                            <button onClick={() => setShowPriceModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: 11, padding: 0, textDecoration: 'underline', fontFamily: 'Be Vietnam Pro, sans-serif' }}>Xem bảng giá</button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: shipCalc.free ? '#4a9e3f' : 'var(--forest)', minWidth: 80, textAlign: 'right' }}>
                        {shipCalc.loading ? '...' : shipCalc.free ? 'Miễn phí' : `${(shipCalc.fee || 30000).toLocaleString('vi-VN')}đ`}
                      </div>
                    </div>
                  )}

                  <Field label="Ghi chú đơn hàng (không bắt buộc)">
                    <textarea value={ship.note} onChange={e => setShip(f => ({ ...f, note: e.target.value }))}
                      placeholder="Giao giờ hành chính, gọi trước khi giao…"
                      style={{ background: 'var(--white)', border: '0.5px solid var(--border)', padding: '13px 16px', fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 13, color: 'var(--forest)', fontWeight: 300, outline: 'none', resize: 'vertical', minHeight: 72, width: '100%', boxSizing: 'border-box', borderRadius: 0 }} />
                  </Field>
                </div>
              )}

              <NavRow onBack={() => navigate('/cart')} backLabel="Giỏ hàng" onNext={goToStep2} nextLabel="Tiếp: Thanh toán" />

              {/* ══ MAP MODAL ══ */}
              {showMapModal && (
                <div onClick={() => setShowMapModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,14,12,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <div onClick={e => e.stopPropagation()} style={{ background: 'var(--ivory)', border: '0.5px solid var(--border-gold)', width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 80px rgba(13,43,30,0.35)' }}>

                    {/* Modal header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
                      <div>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 400, color: 'var(--forest)', margin: 0 }}>
                          Chọn <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>địa chỉ</em> trên bản đồ
                        </h3>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>Click vào bản đồ để ghim vị trí, hoặc tìm kiếm địa chỉ</p>
                      </div>
                      <button onClick={() => setShowMapModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22 }}>✕</button>
                    </div>

                    {mapStep === 'map' ? (
                      <>
                        {/* Search */}
                        <div style={{ padding: '14px 24px', borderBottom: '0.5px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
                          <input value={mapSearch} onChange={e => setMapSearch(e.target.value)}
                            onKeyDown={async e => {
                              if (e.key !== 'Enter' || !mapSearch.trim()) return
                              setMapSearching(true)
                              try {
                                const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mapSearch + ', Vietnam')}&format=json&limit=1`, { headers: { 'Accept-Language': 'vi' } })
                                const d = await r.json()
                                if (d[0]) setMapPin({ lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) })
                              } catch {}
                              setMapSearching(false)
                            }}
                            placeholder="Tìm địa chỉ, nhấn Enter để tìm…"
                            style={{ flex: 1, background: 'var(--white)', border: '0.5px solid var(--border)', padding: '10px 14px', fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 13, color: 'var(--forest)', outline: 'none', borderRadius: 0 }}
                          />
                          <button onClick={async () => {
                            if (!mapSearch.trim()) return
                            setMapSearching(true)
                            try {
                              const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mapSearch + ', Vietnam')}&format=json&limit=1`, { headers: { 'Accept-Language': 'vi' } })
                              const d = await r.json()
                              if (d[0]) setMapPin({ lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) })
                            } catch {}
                            setMapSearching(false)
                          }} style={{ background: 'var(--forest)', border: 'none', padding: '10px 20px', cursor: 'pointer', fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ivory)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {mapSearching && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />} Tìm
                          </button>
                        </div>

                        {/* Map */}
                        <div style={{ flex: 1, minHeight: 340, position: 'relative' }}>
                          <MapContainer
                            center={mapPin ? [mapPin.lat, mapPin.lng] : [10.0124518, 105.7324316]}
                            zoom={mapPin ? 16 : 13}
                            style={{ width: '100%', height: '100%', minHeight: 340 }}
                            key={mapPin ? `${mapPin.lat},${mapPin.lng}` : 'default'}
                          >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                            <MapClickHandler onPick={pin => setMapPin(pin)} />
                            {mapPin && <Marker position={[mapPin.lat, mapPin.lng]} />}
                          </MapContainer>
                          {!mapPin && (
                            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(13,51,48,0.85)', backdropFilter: 'blur(8px)', color: 'var(--ivory)', padding: '10px 20px', fontSize: 12, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                              👆 Click vào bản đồ để chọn vị trí
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ padding: '16px 24px', borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {mapPin ? `📍 ${mapPin.lat.toFixed(5)}, ${mapPin.lng.toFixed(5)}` : 'Chưa chọn vị trí'}
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setShowMapModal(false)} style={{ background: 'none', border: '0.5px solid var(--border)', padding: '10px 20px', cursor: 'pointer', fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Huỷ</button>
                            <button disabled={!mapPin} onClick={() => setMapStep('confirm')} style={{ background: mapPin ? 'var(--forest)' : 'var(--border)', border: 'none', padding: '10px 28px', cursor: mapPin ? 'pointer' : 'not-allowed', fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ivory)' }}>
                              Tiếp theo →
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* ── Bước confirm: điền thông tin ── */
                      <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ padding: '12px 16px', background: 'rgba(74,158,63,0.06)', border: '0.5px solid rgba(74,158,63,0.25)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <MapPin size={13} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                          Vị trí: {mapPin?.lat.toFixed(5)}, {mapPin?.lng.toFixed(5)}
                          <button onClick={() => setMapStep('map')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: 11, padding: 0, textDecoration: 'underline' }}>Chọn lại</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          {[
                            { key: 'fullName', label: 'Họ tên', placeholder: 'Nguyễn Văn An' },
                            { key: 'phone', label: 'Điện thoại', placeholder: '0912 345 678' },
                          ].map(f => (
                            <div key={f.key} className="form-group">
                              <label style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>{f.label} <span style={{ color: 'var(--gold)' }}>*</span></label>
                              <input value={newAddrForm[f.key]} onChange={e => setNewAddrForm(p => ({ ...p, [f.key]: e.target.value }))}
                                placeholder={f.placeholder}
                                style={{ width: '100%', boxSizing: 'border-box', border: '0.5px solid var(--border)', padding: '12px 14px', fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 13, color: 'var(--forest)', outline: 'none', background: 'var(--white)', borderRadius: 0 }} />
                            </div>
                          ))}
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Số nhà, tên đường <span style={{ color: 'var(--gold)' }}>*</span></label>
                          <input value={newAddrForm.street} onChange={e => setNewAddrForm(p => ({ ...p, street: e.target.value }))}
                            placeholder="123 Đường Lê Lợi"
                            style={{ width: '100%', boxSizing: 'border-box', border: '0.5px solid var(--border)', padding: '12px 14px', fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 13, color: 'var(--forest)', outline: 'none', background: 'var(--white)', borderRadius: 0 }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          {[
                            { key: 'province', label: 'Tỉnh / Thành phố', placeholder: 'Cần Thơ' },
                            { key: 'ward', label: 'Phường / Xã', placeholder: 'An Bình' },
                          ].map(f => (
                            <div key={f.key} className="form-group">
                              <label style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>{f.label} <span style={{ color: 'var(--gold)' }}>*</span></label>
                              <input value={newAddrForm[f.key]} onChange={e => setNewAddrForm(p => ({ ...p, [f.key]: e.target.value }))}
                                placeholder={f.placeholder}
                                style={{ width: '100%', boxSizing: 'border-box', border: '0.5px solid var(--border)', padding: '12px 14px', fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 13, color: 'var(--forest)', outline: 'none', background: 'var(--white)', borderRadius: 0 }} />
                            </div>
                          ))}
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <input type="checkbox" checked={newAddrForm.isDefault} onChange={e => setNewAddrForm(p => ({ ...p, isDefault: e.target.checked }))} style={{ display: 'none' }} />
                          <div style={{ width: 18, height: 18, border: `0.5px solid ${newAddrForm.isDefault ? 'var(--forest)' : 'var(--border)'}`, background: newAddrForm.isDefault ? 'var(--forest)' : 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
                            {newAddrForm.isDefault && <Check size={11} style={{ color: 'var(--ivory)' }} />}
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 300 }}>Đặt làm địa chỉ mặc định</span>
                        </label>

                        <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '0.5px solid var(--border)' }}>
                          <button onClick={() => setMapStep('map')} style={{ flex: 1, background: 'none', border: '0.5px solid var(--border)', padding: 13, cursor: 'pointer', fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>← Chọn lại vị trí</button>
                          <button disabled={savingAddr} onClick={async () => {
                            if (!newAddrForm.fullName || !newAddrForm.phone || !newAddrForm.street || !newAddrForm.province || !newAddrForm.ward) {
                              toast.error('Vui lòng điền đầy đủ thông tin'); return
                            }
                            setSavingAddr(true)
                            try {
                              const { data } = await addressService.create({ ...newAddrForm, lat: mapPin?.lat, lng: mapPin?.lng })
                              const newAddr = data.data
                              setSavedAddresses(prev => [...prev, newAddr])
                              applyAddress(newAddr)
                              setShowMapModal(false)
                              setMapStep('map')
                              setMapPin(null)
                              setMapSearch('')
                              setNewAddrForm({ fullName: '', phone: '', street: '', province: '', ward: '', isDefault: false })
                              toast.success('Đã lưu địa chỉ!')
                            } catch { toast.error('Lưu địa chỉ thất bại') }
                            finally { setSavingAddr(false) }
                          }} style={{ flex: 2, background: savingAddr ? 'var(--sage)' : 'var(--forest)', border: 'none', padding: 13, cursor: savingAddr ? 'not-allowed' : 'pointer', fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {savingAddr && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
                            Lưu địa chỉ & sử dụng
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ┌──────────────────────────────────┐
              │  STEP 2 — Phương thức thanh toán │
              └──────────────────────────────────┘ */}
          {step === 2 && (
            <div className="co-step">
              <SectionHead icon={CreditCard} title="Phương thức thanh toán" />

              {/* payment tiles */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                {PAYMENT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = method === opt.id;
                  return (
                    <button
                      key={opt.id}
                      className={`pay-tile${active ? " active" : ""}`}
                      onClick={() => {
                        setMethod(opt.id);
                        setPayErr({});
                        setCardErr({});
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "18px 20px",
                        textAlign: "left",
                        background: active
                          ? "var(--gold-pale)"
                          : "var(--white)",
                        border: `${active ? "1.5px" : "0.5px"} solid ${active ? "var(--gold)" : "var(--border)"}`,
                        fontFamily: "Be Vietnam Pro, sans-serif",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          border: "0.5px solid var(--border-gold)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: active ? "var(--gold)" : "var(--text-muted)",
                          flexShrink: 0,
                          transition: "color 0.25s",
                        }}
                      >
                        <Icon size={18} strokeWidth={1.5} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            color: "var(--forest)",
                            fontWeight: active ? 500 : 300,
                          }}
                        >
                          {opt.label}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            marginTop: 2,
                          }}
                        >
                          {opt.sub}
                        </div>
                      </div>
                      {active && (
                        <Check
                          size={15}
                          style={{ color: "var(--gold)", flexShrink: 0 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* method error */}
              {payErr.method && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    color: "#c0392b",
                    marginBottom: 16,
                  }}
                >
                  <AlertCircle size={13} /> {payErr.method}
                </div>
              )}

              {/* ── Card form ── */}
              {method === "card" && (
                <div
                  style={{
                    border: "0.5px solid var(--border-gold)",
                    padding: 24,
                    marginTop: 20,
                    background: "var(--cream)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                      marginBottom: 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Lock size={12} /> Thông tin thẻ — mã hoá bảo mật
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <Field label="Số thẻ" required error={cardErr.number}>
                      <input
                        className={`co-input${cardErr.number ? " error" : ""}`}
                        value={card.number}
                        onChange={(e) =>
                          setCard((c) => ({
                            ...c,
                            number: fmtCard(e.target.value),
                          }))
                        }
                        placeholder="0000  0000  0000  0000"
                        maxLength={19}
                        style={{
                          border: `0.5px solid ${cardErr.number ? "#c0392b" : "var(--border)"}`,
                          letterSpacing: "0.12em",
                        }}
                      />
                    </Field>
                    <Field label="Tên chủ thẻ" required error={cardErr.holder}>
                      <input
                        className={`co-input${cardErr.holder ? " error" : ""}`}
                        value={card.holder}
                        onChange={(e) =>
                          setCard((c) => ({
                            ...c,
                            holder: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="NGUYEN VAN AN"
                        style={{
                          border: `0.5px solid ${cardErr.holder ? "#c0392b" : "var(--border)"}`,
                          letterSpacing: "0.06em",
                        }}
                      />
                    </Field>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 14,
                      }}
                    >
                      <Field
                        label="Ngày hết hạn"
                        required
                        error={cardErr.expiry}
                      >
                        <input
                          className={`co-input${cardErr.expiry ? " error" : ""}`}
                          value={card.expiry}
                          onChange={(e) =>
                            setCard((c) => ({
                              ...c,
                              expiry: fmtExpiry(e.target.value),
                            }))
                          }
                          placeholder="MM/YY"
                          maxLength={5}
                          style={{
                            border: `0.5px solid ${cardErr.expiry ? "#c0392b" : "var(--border)"}`,
                          }}
                        />
                      </Field>
                      <Field label="CVV / CVC" required error={cardErr.cvc}>
                        <div style={{ position: "relative" }}>
                          <input
                            className={`co-input${cardErr.cvc ? " error" : ""}`}
                            value={card.cvc}
                            type={showCvc ? "text" : "password"}
                            onChange={(e) =>
                              setCard((c) => ({
                                ...c,
                                cvc: e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 4),
                              }))
                            }
                            placeholder="•••"
                            style={{
                              border: `0.5px solid ${cardErr.cvc ? "#c0392b" : "var(--border)"}`,
                              paddingRight: 40,
                              width: "100%",
                              boxSizing: "border-box",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCvc((v) => !v)}
                            style={{
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-muted)",
                              display: "flex",
                            }}
                          >
                            {showCvc ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* ── COD info ── */}
              {method === "cod" && (
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "16px 20px",
                    marginTop: 16,
                    background: "var(--gold-pale)",
                    border: "0.5px solid var(--border-gold)",
                  }}
                >
                  <Truck
                    size={15}
                    strokeWidth={1.5}
                    style={{
                      color: "var(--gold)",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--forest)",
                        fontWeight: 400,
                        marginBottom: 4,
                      }}
                    >
                      Thanh toán khi nhận hàng (COD)
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        fontWeight: 300,
                      }}
                    >
                      Chuẩn bị tiền mặt khi shipper giao hàng. Phụ phí thu hộ có
                      thể phát sinh tuỳ khu vực.
                    </div>
                  </div>
                </div>
              )}

              {/* ── MoMo / VNPay placeholder ── */}
              {(method === "momo" || method === "vnpay") && (
                <div
                  style={{
                    padding: "16px 20px",
                    marginTop: 16,
                    background: "var(--cream)",
                    border: "0.5px solid var(--border)",
                    fontSize: 13,
                    color: "var(--text-muted)",
                    fontWeight: 300,
                  }}
                >
                  Bạn sẽ được chuyển sang cổng thanh toán{" "}
                  <strong style={{ color: "var(--forest)" }}>
                    {method === "momo" ? "MoMo" : "VNPay"}
                  </strong>{" "}
                  sau khi xác nhận đơn hàng.
                </div>
              )}

              {/* shipping method display */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 20px",
                  marginTop: 24,
                  background: "var(--white)",
                  border: "0.5px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Truck
                    size={16}
                    strokeWidth={1.5}
                    style={{ color: "var(--gold)" }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--forest)",
                        fontWeight: 400,
                      }}
                    >
                      Giao hàng tiêu chuẩn
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      2–4 ngày làm việc · Đối tác GHTK / GHN
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: 18,
                    color: shippingFee === 0 ? "#4a9e3f" : "var(--forest)",
                  }}
                >
                  {shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}
                </div>
              </div>

              <NavRow
                onBack={() => {
                  setStep(1);
                  scrollTop();
                }}
                backLabel="Địa chỉ"
                onNext={goToStep3}
                nextLabel="Xem xác nhận"
              />
            </div>
          )}

          {/* ┌──────────────────────────────────┐
              │  STEP 3 — Xác nhận đơn hàng      │
              └──────────────────────────────────┘ */}
          {step === 3 && (
            <div className="co-step">
              <SectionHead icon={ShieldCheck} title="Xác nhận đơn hàng" />

              {/* ── Review: shipping ── */}
              <ReviewBlock
                title="Địa chỉ giao hàng"
                icon={MapPin}
                onEdit={() => {
                  setStep(1);
                  scrollTop();
                }}
                rows={[
                  { label: "Người nhận", value: ship.fullName },
                  { label: "Điện thoại", value: ship.phone },
                  { label: "Email", value: ship.email },
                  {
                    label: "Địa chỉ",
                    value: [ship.street, ship.wardName, ship.provinceName]
                      .filter(Boolean)
                      .join(", "),
                  },
                  ship.note && { label: "Ghi chú", value: ship.note },
                ].filter(Boolean)}
              />

              {/* ── Review: payment ── */}
              <ReviewBlock
                title="Thanh toán"
                icon={CreditCard}
                onEdit={() => {
                  setStep(2);
                  scrollTop();
                }}
                rows={[
                  {
                    label: "Hình thức",
                    value: PAYMENT_OPTIONS.find((o) => o.id === method)?.label,
                  },
                  method === "card" &&
                    card.number && {
                      label: "Số thẻ",
                      value: `**** **** **** ${card.number.replace(/\s/g, "").slice(-4)}`,
                    },
                  {
                    label: "Phí giao hàng",
                    value:
                      shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee),
                  },
                ].filter(Boolean)}
              />

              {/* ── Review: items ── */}
              <ReviewBlock title="Sản phẩm" icon={Package}>
                {items.map((item, i) => {
                  const price = item.book?.salePrice || item.book?.price || 0;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "12px 0",
                        borderBottom:
                          i < items.length - 1
                            ? "0.5px solid var(--border)"
                            : "none",
                      }}
                    >
                      <img
                        src={
                          item.book?.coverImage ||
                          "https://placehold.co/44x56/e8e4dc/0d3330?text=Book"
                        }
                        alt={item.book?.title}
                        style={{
                          width: 44,
                          height: 56,
                          objectFit: "cover",
                          border: "0.5px solid var(--border)",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "Playfair Display, serif",
                            fontSize: 14,
                            color: "var(--forest)",
                          }}
                        >
                          {item.book?.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            marginTop: 3,
                          }}
                        >
                          {formatPrice(price)} × {item.quantity}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: "Playfair Display, serif",
                          fontSize: 15,
                          color: "var(--forest)",
                        }}
                      >
                        {formatPrice(price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </ReviewBlock>

              {/* ── Big confirm CTA ── */}
              <div
                style={{
                  marginTop: 24,
                  padding: "28px 32px",
                  background: "var(--forest)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 32,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: 6,
                    }}
                  >
                    Tổng thanh toán
                  </div>
                  <div
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: 38,
                      fontWeight: 300,
                      color: "var(--ivory)",
                      lineHeight: 1,
                    }}
                  >
                    {formatPrice(total)}
                  </div>
                  {couponApplied && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.45)",
                        marginTop: 5,
                      }}
                    >
                      Đã áp dụng mã {couponApplied.code} (−
                      {formatPrice(discount)})
                    </div>
                  )}
                </div>

                <button
                  onClick={placeOrder}
                  disabled={placing}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: placing
                      ? "rgba(255,255,255,0.1)"
                      : "var(--gold)",
                    border: "none",
                    padding: "18px 44px",
                    cursor: placing ? "not-allowed" : "pointer",
                    fontFamily: "Be Vietnam Pro, sans-serif",
                    fontSize: 12,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: placing ? "rgba(255,255,255,0.5)" : "var(--ink)",
                    transition: "all 0.3s",
                    flexShrink: 0,
                  }}
                >
                  {placing ? (
                    <>
                      <Loader2
                        size={15}
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />{" "}
                      Đang xử lý…
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} /> Xác nhận đặt hàng
                    </>
                  )}
                </button>
              </div>

              {/* SSL note */}
              <div
                style={{
                  marginTop: 12,
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                <Lock size={11} style={{ color: "var(--gold)" }} />
                Giao dịch được mã hoá và bảo vệ bởi SSL 256‑bit
              </div>

              {/* back link */}
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button
                  onClick={() => {
                    setStep(2);
                    scrollTop();
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    fontFamily: "Be Vietnam Pro, sans-serif",
                  }}
                >
                  <ArrowLeft size={12} /> Sửa phương thức thanh toán
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════
            RIGHT COLUMN — Order Summary
            (luôn hiển thị, sync realtime)
        ══════════════════════════════════════ */}
        {showPriceModal && (
          <div
            onClick={() => setShowPriceModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(10,14,12,0.55)",
              backdropFilter: "blur(3px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--ivory)",
                border: "0.5px solid var(--border-gold)",
                maxWidth: 460,
                width: "100%",
                padding: "36px 32px",
                boxShadow: "0 40px 80px rgba(13,43,30,0.3)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: 22,
                    fontWeight: 400,
                    color: "var(--forest)",
                    margin: 0,
                  }}
                >
                  Bảng Giá{" "}
                  <em style={{ color: "var(--gold)", fontStyle: "italic" }}>
                    Giao Hàng
                  </em>
                </h3>
                <button
                  onClick={() => setShowPriceModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    fontSize: 20,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* NỘI Ô */}
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: 10,
                }}
              >
                Nội ô Cần Thơ (≤ 15 km)
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  marginBottom: 20,
                  background: shipCalc.isNoiO
                    ? "rgba(74,158,63,0.10)"
                    : "transparent",
                  border: shipCalc.isNoiO
                    ? "0.5px solid rgba(74,158,63,0.35)"
                    : "0.5px solid var(--border)",
                  transition: "background 0.3s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--forest)" }}>
                    Toàn bộ khu vực nội ô
                  </span>
                  {shipCalc.isNoiO && (
                    <span
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "#fff",
                        background: "#4a9e3f",
                        padding: "2px 8px",
                      }}
                    >
                      Của bạn
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--forest)",
                    fontWeight: 500,
                  }}
                >
                  15.000đ
                </span>
              </div>

              {/* NGOẠI Ô */}
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: 10,
                }}
              >
                Ngoại ô & Toàn quốc (theo km đường)
              </div>
              {[
                { label: "≤ 10 km", maxKm: 10, fee: "25.000đ" },
                { label: "10 – 30 km", maxKm: 30, fee: "35.000đ" },
                { label: "30 – 60 km", maxKm: 60, fee: "45.000đ" },
                { label: "60 – 100 km", maxKm: 100, fee: "55.000đ" },
                { label: "100 – 200 km", maxKm: 200, fee: "70.000đ" },
                { label: "200 – 500 km", maxKm: 500, fee: "90.000đ" },
                { label: "Trên 500 km", maxKm: Infinity, fee: "120.000đ" },
              ].map((row, i) => {
                const km = shipCalc.km;
                const isActive =
                  !shipCalc.isNoiO &&
                  km !== null &&
                  ((i === 0 && km <= 10) ||
                    (i === 1 && km > 10 && km <= 30) ||
                    (i === 2 && km > 30 && km <= 60) ||
                    (i === 3 && km > 60 && km <= 100) ||
                    (i === 4 && km > 100 && km <= 200) ||
                    (i === 5 && km > 200 && km <= 500) ||
                    (i === 6 && km > 500));
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "11px 14px",
                      borderBottom:
                        i < 6 ? "0.5px solid var(--border)" : "none",
                      background: isActive
                        ? "rgba(74,158,63,0.10)"
                        : "transparent",
                      border: isActive
                        ? "0.5px solid rgba(74,158,63,0.35)"
                        : "transparent",
                      transition: "background 0.3s",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ fontSize: 13, color: "var(--forest)" }}>
                        {row.label}
                      </span>
                      {isActive && (
                        <span
                          style={{
                            fontSize: 9,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: "#fff",
                            background: "#4a9e3f",
                            padding: "2px 8px",
                          }}
                        >
                          Của bạn
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--forest)",
                        fontWeight: 500,
                      }}
                    >
                      {row.fee}
                    </span>
                  </div>
                );
              })}

              {/* Footer */}
              <div
                style={{
                  marginTop: 20,
                  padding: "12px 14px",
                  background: "rgba(74,158,63,0.06)",
                  border: "0.5px solid rgba(74,158,63,0.2)",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Truck
                  size={16}
                  color="var(--forest)"
                  style={{ flexShrink: 0 }}
                />

                <span>
                  Miễn phí giao hàng cho đơn từ{" "}
                  <strong style={{ color: "var(--forest)" }}>300.000đ</strong>
                </span>
              </div>
              {shipCalc.km && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "var(--gold)",
                    textAlign: "center",
                  }}
                >
                  Địa chỉ của bạn: ~{shipCalc.km} km →{" "}
                  <strong>
                    {shipCalc.isNoiO
                      ? "15.000đ (nội ô)"
                      : `${(shipCalc.fee || 30000).toLocaleString("vi-VN")}đ`}
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}
        <OrderSummary
          items={items}
          subtotal={subtotal}
          discount={discount}
          couponApplied={couponApplied}
          shippingFee={shippingFee}
          total={total}
          couponInput={couponInput}
          setCouponInput={setCouponInput}
          onApply={applyCoupon}
          onRemoveCoupon={() => {
            setCouponApplied(null);
            setCouponInput("");
          }}
        />
      </div>
    </div>
  );
}
