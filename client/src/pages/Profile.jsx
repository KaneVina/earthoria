import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";
import { arService } from "../services/arService";
import { useAuthStore } from "../store/authStore";
import {
  formatPrice,
  formatDate,
  formatDateTime,
  getBookUrl,
  getOrderCode,
} from "../utils/helpers";
import toast from "react-hot-toast";
import "../components/assets/css/profile.css";
import LogoutConfirmModal from "../components/LogoutConfirmModal";
import InvoiceModal from "../components/InvoiceModal";

const F = {
  serif: "'Playfair Display', serif",
  sans: "'Be Vietnam Pro', sans-serif",
};

const CHAPTERS = [
  { id: "overview", label: "Hồ Sơ", roman: "I", icon: "user" },
  { id: "orders", label: "Đơn Hàng", roman: "II", icon: "package" },
  { id: "security", label: "Bảo Mật", roman: "III", icon: "lock" },
  { id: "addresses", label: "Địa Chỉ", roman: "IV", icon: "map" },
  { id: "ar", label: "Sách AR", roman: "V", icon: "compass" },
  { id: "settings", label: "Cài Đặt Hệ Thống", roman: "VI", icon: "settings" },
  {
    id: "logout",
    label: "Đăng Xuất",
    roman: "VII",
    icon: "logout",
    danger: true,
  },
];

const SYSTEM_INFO = {
  siteName: "Earthoria",
  version: "v2.4.0",
  releaseDate: "20/06/2026",
  environment: "Production",
  changelog: [
    {
      version: "v2.4.0",
      date: "20/06/2026",
      note: "Thêm sổ địa chỉ theo đơn vị hành chính 2 cấp, tối ưu tốc độ tải trang Hồ sơ.",
    },
    {
      version: "v2.3.0",
      date: "02/05/2026",
      note: "Ra mắt tính năng Sách AR - xem mô hình 3D trực tiếp từ tài khoản.",
    },
    {
      version: "v2.2.1",
      date: "14/04/2026",
      note: "Sửa lỗi hiển thị trạng thái đơn hàng, cải thiện hiệu năng trang Giỏ hàng.",
    },
    {
      version: "v2.2.0",
      date: "01/04/2026",
      note: "Thêm chế độ Sáng/Tối và trung tâm quản lý Cookie theo tiêu chuẩn mới.",
    },
    {
      version: "v2.1.0",
      date: "10/03/2026",
      note: "Ra mắt hệ thống Hồ sơ thành viên phong cách Passport.",
    },
  ],
};

const ORDER_STATUS_MAP = {
  PENDING: {
    label: "Chờ xác nhận",
    color: "#b8862e",
    bg: "rgba(184,134,46,0.08)",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    color: "#4a9e3f",
    bg: "rgba(74,158,63,0.08)",
  },
  PROCESSING: {
    label: "Đang chuẩn bị",
    color: "#4a9e3f",
    bg: "rgba(74,158,63,0.08)",
  },
  SHIPPING: {
    label: "Đang giao",
    color: "#2d7a6e",
    bg: "rgba(45,122,110,0.08)",
  },
  DELIVERED: { label: "Đã giao", color: "#4a7c5f", bg: "rgba(74,124,95,0.1)" },
  COMPLETED: {
    label: "Hoàn thành",
    color: "#4a9e3f",
    bg: "rgba(74,158,63,0.12)",
  },
  CANCELLED: { label: "Đã hủy", color: "#b25450", bg: "rgba(178,84,80,0.08)" },
};

const ORDER_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPING",
  "DELIVERED",
];

// Đơn toàn sách điện tử không có bước giao hàng — chỉ đi thẳng Chờ thanh toán -> Hoàn tất
// (khớp với luồng BE: PENDING -> COMPLETED khi thanh toán xong, bỏ qua CONFIRMED/PROCESSING/SHIPPING/DELIVERED).
const DIGITAL_ORDER_STEPS = ["PENDING", "COMPLETED"];
const DIGITAL_STEP_LABELS = {
  PENDING: "Chờ thanh toán",
  COMPLETED: "Hoàn tất",
};

// ════════════════════ ICONS ════════════════════
const Icon = {
  user: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  package: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  lock: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  map: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  edit: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  logout: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  check: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  checkSm: (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  x: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  eye: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  shield: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  family: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 9" />
    </svg>
  ),
  truck: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  plus: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  trash: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  back: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  ),
  search: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  arrowRight: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  mail: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  phone: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  cake: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
      <path d="M4 16s.5-1 2-1 2 1 3.5 1 2-1 3.5-1 2 1 3.5 1 2-1 2-1" />
      <path d="M12 11V7" />
      <path d="M9 7c0-1 .5-1.5.5-2.5S9 3 9 3" />
      <path d="M12 7c0-1 .5-1.5.5-2.5S12 3 12 3" />
      <path d="M15 7c0-1 .5-1.5.5-2.5S15 3 15 3" />
    </svg>
  ),
  star: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  copy: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="9" y="9" width="13" height="13" rx="1.5" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  alert: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  seal: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M9 13.5 7 22l5-3 5 3-2-8.5" />
    </svg>
  ),
  compass: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  ),
  menu: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  sparkle: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M12 2 13.8 9.2 21 11 13.8 12.8 12 20 10.2 12.8 3 11 10.2 9.2 12 2z" />
    </svg>
  ),
  settings: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  sun: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  cookie: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M12 2a10 10 0 1 0 9.54 13.11c-.5.16-1.03.24-1.54.24a4 4 0 0 1-4-4 3.5 3.5 0 0 1-3.5-3.5 4 4 0 0 1-4-4c0-.51.08-1.01.23-1.46A10 10 0 0 0 12 2z" />
      <circle cx="8.5" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13" cy="14.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
};

// ─ Reveal-on-scroll ─
function useReveal(deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        }),
      { threshold: 0.08 },
    );
    const els = ref.current?.querySelectorAll(".pf-reveal") || [];
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, deps);
  return ref;
}

// ─ Count-up ─
function useCountUp(end, duration = 900, enabled = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const safeEnd = Number.isFinite(end) ? end : 0;
    if (!enabled) {
      setValue(safeEnd);
      return;
    }
    let raf,
      startTime = null;
    const step = (ts) => {
      if (startTime === null) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(safeEnd * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [end, duration, enabled]);
  return value;
}
// ─ Passport 3D interaction: tilt theo chuột + parallax nền + holo sheen ─
// zoneRef bọc toàn bộ hero (điều khiển parallax nền: watermark, glow blobs)
// cardRef bọc riêng tấm thẻ (điều khiển tilt 3D + holographic sheen)
function usePassportInteraction(maxTilt = 5, parallax = 16) {
  const zoneRef = useRef(null);
  const cardRef = useRef(null);

  const shouldSkip = () =>
    typeof window !== "undefined" &&
    (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches);

  const onMouseMove = useCallback(
    (e) => {
      if (shouldSkip()) return;
      const zone = zoneRef.current;
      const card = cardRef.current;
      if (!zone || !card) return;

      // Parallax nền: watermark + glow trôi ngược hướng chuột, tạo chiều sâu
      const zRect = zone.getBoundingClientRect();
      const zx = (e.clientX - zRect.left) / zRect.width - 0.5;
      const zy = (e.clientY - zRect.top) / zRect.height - 0.5;
      zone.style.setProperty("--pz-x", `${zx * parallax}px`);
      zone.style.setProperty("--pz-y", `${zy * parallax}px`);

      // Tilt 3D + holo sheen: tính riêng theo vị trí chuột trong chính tấm thẻ
      const cRect = card.getBoundingClientRect();
      const cx = (e.clientX - cRect.left) / cRect.width;
      const cy = (e.clientY - cRect.top) / cRect.height;
      card.style.setProperty("--mx", `${cx * 100}%`);
      card.style.setProperty("--my", `${cy * 100}%`);
      card.style.setProperty("--rx", `${(0.5 - cy) * maxTilt * 2}deg`);
      card.style.setProperty("--ry", `${(cx - 0.5) * maxTilt * 2}deg`);
      card.style.setProperty("--glow", "1");
    },
    [maxTilt, parallax],
  );

  const onMouseLeave = useCallback(() => {
    const zone = zoneRef.current;
    const card = cardRef.current;
    zone?.style.setProperty("--pz-x", "0px");
    zone?.style.setProperty("--pz-y", "0px");
    card?.style.setProperty("--rx", "0deg");
    card?.style.setProperty("--ry", "0deg");
    card?.style.setProperty("--glow", "0");
  }, []);

  return { zoneRef, cardRef, onMouseMove, onMouseLeave };
}
// ─ Pointer-reactive "sheen" — tracks the cursor over a card and exposes
function useSheen() {
  const ref = useRef(null);
  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${mx}%`);
    el.style.setProperty("--my", `${my}%`);
  }, []);
  const onMouseEnter = useCallback(() => {
    ref.current?.style.setProperty("--glow", "1");
  }, []);
  const onMouseLeave = useCallback(() => {
    ref.current?.style.setProperty("--glow", "0");
  }, []);
  return { ref, onMouseMove, onMouseEnter, onMouseLeave };
}

// ─ Confirm dialog ─
function useConfirm() {
  const [state, setState] = useState(null);
  const confirm = (opts) =>
    new Promise((resolve) => setState({ ...opts, resolve }));
  const close = (result) => {
    state?.resolve(result);
    setState(null);
  };

  const dialog = state ? (
    <div className="pf-overlay" onClick={() => close(false)}>
      <div className="pf-confirm" onClick={(e) => e.stopPropagation()}>
        <div className={`pf-confirm-icon ${state.danger ? "danger" : ""}`}>
          {state.danger ? Icon.alert : Icon.shield}
        </div>
        <div className="pf-confirm-title">{state.title}</div>
        <div className="pf-confirm-msg">{state.message}</div>
        <div className="pf-confirm-actions">
          <button
            type="button"
            className="pf-btn-tactile pf-confirm-cancel"
            onClick={() => close(false)}
          >
            {state.cancelLabel || "Hủy"}
          </button>
          <button
            type="button"
            className={`pf-btn-tactile pf-confirm-ok ${state.danger ? "danger" : ""}`}
            onClick={() => close(true)}
          >
            {state.confirmLabel || "Xác Nhận"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}

// ─ Copy button ─
function CopyButton({ text, label = "Sao Chép", compact = false }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      setCopied(true);
      toast.success("Đã sao chép");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Không thể sao chép, vui lòng thử lại");
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`pf-btn-tactile pf-copy-btn ${compact ? "compact" : ""} ${copied ? "copied" : ""}`}
    >
      {copied ? Icon.checkSm : Icon.copy}{" "}
      {!compact && (copied ? "Đã chép" : label)}
    </button>
  );
}

// ─ Inline-editable field ─
// Click pencil → field becomes an input; Enter/blur-check saves, Esc cancels.
function EditableField({
  label,
  value,
  icon,
  onSave,
  placeholder = "Không có thông tin. Bấm vào đây để cập nhật",
  type = "text",
  options,
  validate,
  locked = false,
  lockedHint,
  masked = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    if (locked) return;
    setDraft(value || "");
    setError("");
    setEditing(true);
  };
  const cancel = () => {
    setEditing(false);
    setError("");
    setDraft(value || "");
  };

  const save = async () => {
    if (validate) {
      const err = validate(draft);
      if (err) {
        setError(err);
        return;
      }
    }
    if (draft === (value || "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
      // Nhá viền vàng-xanh nhẹ để xác nhận đã lưu, tự tắt sau ~1s — phản hồi
      // tức thời hơn là chỉ dựa vào toast ở góc màn hình.
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1000);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Cập nhật thất bại, vui lòng thử lại",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  return (
    <div
      className={`pf-field ${editing ? "is-editing" : ""} ${locked ? "is-locked" : ""} ${justSaved ? "is-saved" : ""}`}
    >
      <div className="pf-field-label">
        <span className="pf-field-icon">{icon}</span>
        {label}
        {locked && (
          <span className="pf-field-lock-badge" title={lockedHint}>
            {Icon.lock}
          </span>
        )}
      </div>

      {!editing ? (
        <div
          className="pf-field-display"
          onClick={locked ? undefined : startEdit}
        >
          <span className={`pf-field-value ${!value ? "is-empty" : ""}`}>
            {options
              ? options.find((o) => o.value === value)?.label || placeholder
              : value
                ? masked && !revealed
                  ? maskEmail(value)
                  : value
                : placeholder}
          </span>
          {!locked && (
            <button
              type="button"
              className="pf-btn-tactile pf-field-edit-btn"
              onClick={startEdit}
              aria-label={`Sửa ${label}`}
            >
              {Icon.edit}
            </button>
          )}
          {locked && masked && value && (
            <button
              type="button"
              className="pf-btn-tactile pf-field-edit-btn pf-field-reveal-btn"
              onClick={(e) => {
                e.stopPropagation();
                setRevealed((r) => !r);
              }}
              aria-label={revealed ? `Ẩn ${label}` : `Hiện đầy đủ ${label}`}
              title={revealed ? `Ẩn ${label}` : `Hiện đầy đủ ${label}`}
            >
              {revealed ? Icon.eyeOff : Icon.eye}
            </button>
          )}
        </div>
      ) : (
        <div className="pf-field-edit-row">
          {options ? (
            <select
              ref={inputRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
              onKeyDown={handleKey}
              className={`pf-field-input ${error ? "has-error" : ""}`}
              disabled={saving}
            >
              <option value="">{placeholder}</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              ref={inputRef}
              type={type}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
              onKeyDown={handleKey}
              className={`pf-field-input ${error ? "has-error" : ""}`}
              placeholder={placeholder}
              disabled={saving}
            />
          )}
          <div className="pf-field-edit-actions">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="pf-btn-tactile pf-field-save"
              aria-label="Lưu"
            >
              {saving ? <span className="pf-spinner-sm" /> : Icon.checkSm}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={cancel}
              className="pf-btn-tactile pf-field-cancel"
              aria-label="Hủy"
            >
              {Icon.x}
            </button>
          </div>
        </div>
      )}
      {error && <div className="pf-field-error">{error}</div>}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, logout, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "overview");
  const [selectedOrderId, setSelectedOrderId] = useState(
    location.state?.orderId || null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const containerRef = useReveal([activeTab, selectedOrderId]);
  const contentTopRef = useRef(null);
  const { confirm, dialog } = useConfirm();

  // Khoá scroll nền + cho phép nhấn Esc để đóng khi drawer sidebar (mobile) đang mở
  useEffect(() => {
    if (!sidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sidebarOpen]);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => authService.getMe().then((r) => r.data.data),
    initialData: user,
    initialDataUpdatedAt: 0,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => orderService.getOrders().then((r) => r.data.data),
    enabled: activeTab === "orders" || activeTab === "overview",
  });

  const {
    data: orderDetail,
    isLoading: orderDetailLoading,
    refetch: refetchOrderDetail,
  } = useQuery({
    queryKey: ["order", selectedOrderId],
    queryFn: () =>
      orderService.getOrder(selectedOrderId).then((r) => r.data.data),
    enabled: !!selectedOrderId,
  });

  const { data: arCodes = [], isLoading: arLoading } = useQuery({
    queryKey: ["my-ar-codes"],
    queryFn: () => arService.getMyArBooks().then((r) => r.data.data),
    enabled: activeTab === "ar",
  });

  const updateProfileMutation = useMutation({
    mutationFn: (patch) => authService.updateProfile(patch),
    onSuccess: (res, patch) => {
      const updated = { ...profile, ...patch };
      updateUser(updated);
      queryClient.setQueryData(["profile"], updated);
      toast.success("Đã cập nhật thông tin");
    },
  });

  const saveField = useCallback(
    (field) => async (val) => {
      await updateProfileMutation.mutateAsync({ [field]: val });
    },
    [updateProfileMutation],
  );

  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const totalSpent = completedOrders.reduce(
    (sum, o) => sum + (o.total || 0),
    0,
  );
  const animatedOrderCount = useCountUp(orders.length, 900, !ordersLoading);
  const animatedSpent = useCountUp(totalSpent, 1100, !ordersLoading);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const doLogout = async () => {
    setShowLogoutModal(false);
    try {
      await authService.logout(); // gọi POST /auth/logout — clear cookie + revoke token ở DB
    } catch (err) {
      console.error("Logout API failed:", err);
    }

    logout(); // clear Zustand state
    toast.success("Đã đăng xuất");
    navigate("/");
  };

  if (!profile) return <GuestState />;

  const initials =
    `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() ||
    "U";
  const memberTier =
    totalSpent > 3000000
      ? "Thành Viên Bạch Kim"
      : totalSpent > 1000000
        ? "Thành Viên Vàng"
        : "Thành Viên Mới";
  // const accountCode = (profile.memberCode || profile.id || "").toString();
  const formattedCode = profile.userCode || "—";
  // const formattedCode = formatAccountCode(accountCode);
  const recentOrders = orders.slice(0, 3);

  const currentChapter = CHAPTERS.find((c) => c.id === activeTab);

  const selectTab = (id) => {
    if (id === "logout") {
      setSidebarOpen(false);
      handleLogout();
      return;
    }
    setActiveTab(id);
    setSelectedOrderId(null);
    setSidebarOpen(false);
    if (typeof window !== "undefined" && window.scrollY > 60) {
      contentTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="pf-shell"
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        paddingTop: "92px",
      }}
    >
      <PassportHero
        profile={profile}
        initials={initials}
        memberTier={memberTier}
        formattedCode={formattedCode}
        animatedOrderCount={ordersLoading ? "—" : animatedOrderCount}
        animatedSpent={ordersLoading ? "—" : formatPrice(animatedSpent)}
        onLogout={handleLogout}
      />

      <div className="pf-body">
        <div
          className={`pf-sidebar-backdrop ${sidebarOpen ? "is-visible" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        <SidebarNav
          activeTab={activeTab}
          onSelectTab={selectTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="pf-main">
          <div ref={contentTopRef} className="pf-scroll-anchor" />
          <div className="pf-mobile-topbar">
            <button
              onClick={() => setSidebarOpen(true)}
              className="pf-btn-tactile pf-mobile-menu-btn"
              aria-label="Mở menu"
            >
              {Icon.menu}
            </button>
            <span className="pf-mobile-topbar-title">
              {currentChapter?.label}
            </span>
          </div>

          <div
            key={`${activeTab}-${selectedOrderId || "list"}`}
            className="pf-main-inner pf-tab-transition"
          >
            {activeTab === "overview" && (
              <OverviewTab
                profile={profile}
                recentOrders={recentOrders}
                ordersLoading={ordersLoading}
                saveField={saveField}
                onViewOrders={() => selectTab("orders")}
                onViewOrder={(id) => {
                  setActiveTab("orders");
                  setSelectedOrderId(id);
                }}
              />
            )}
            {activeTab === "orders" && !selectedOrderId && (
              <OrdersTab
                orders={orders}
                loading={ordersLoading}
                onSelect={setSelectedOrderId}
              />
            )}
            {activeTab === "orders" && selectedOrderId && (
              <OrderDetailTab
                order={orderDetail}
                loading={orderDetailLoading}
                onBack={() => setSelectedOrderId(null)}
                onSessionExpire={refetchOrderDetail}
              />
            )}
            {activeTab === "security" && (
              <SecurityTab
                hasPassword={profile?.hasPassword}
                email={profile?.email}
              />
            )}
            {activeTab === "addresses" && (
              <AddressesTab profile={profile} confirm={confirm} />
            )}
            {activeTab === "ar" && (
              <ArTab arCodes={arCodes} loading={arLoading} />
            )}
            {activeTab === "settings" && <SettingsTab />}
          </div>
        </div>
      </div>

      <FooterHelp />

      {dialog}
      <LogoutConfirmModal
        open={showLogoutModal}
        onConfirm={doLogout}
        onCancel={() => setShowLogoutModal(false)}
        seconds={10}
      />
    </div>
  );
}

// Ẩn bớt email dạng "khang****@edu.vn" để bảo vệ thông tin cá nhân khi hiển thị.
function maskEmail(email) {
  if (!email) return email;
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const visible = local.slice(0, Math.min(4, local.length));
  return `${visible}${"*".repeat(4)}@${domain}`;
}

function formatAccountCode(raw) {
  if (!raw) return "—";
  // Build a stable, passport-style code: EARTH- + 8 hex chars from id, grouped.
  const clean = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const base = (clean || "00000000").slice(0, 8).padEnd(8, "0");
  return `EARTH-${base.slice(0, 4)}-${base.slice(4, 8)}`;
}

function GuestState() {
  return (
    <div className="pf-guest-wrap">
      <div className="pf-guest-card pf-reveal in">
        <div className="pf-guest-seal">{Icon.seal}</div>
        <h2 className="pf-guest-title">
          Vui Lòng <em>Đăng Nhập</em>
        </h2>
        <p className="pf-guest-sub">
          Đăng nhập để xem hồ sơ, theo dõi đơn hàng và quản lý tài khoản của
          bạn.
        </p>
        <Link to="/login">
          <button className="pf-btn-tactile pf-btn-shine pf-guest-cta">
            Đăng Nhập Ngay
          </button>
        </Link>
      </div>
    </div>
  );
}

// ════════════════════════ PASSPORT HERO ════════════════════════
function PassportHero({
  profile,
  initials,
  memberTier,
  formattedCode,
  animatedOrderCount,
  animatedSpent,
  onLogout,
}) {
  const isAdmin = profile?.role === "ADMIN";
  const roleMeta = isAdmin
    ? { sealBg: "linear-gradient(135deg,#b8862e 0%,#d4a843 100%)" }
    : { sealBg: undefined };
  const [emailRevealed, setEmailRevealed] = useState(false);
  const { zoneRef, cardRef, onMouseMove, onMouseLeave } =
    usePassportInteraction();

  return (
    <div
      className="pf-passport-zone"
      ref={zoneRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div className="pf-passport-watermark">EARTHORIA</div>
      <div className="pf-passport-grid" />
      <div className="pf-passport-glow-a" />
      <div className="pf-passport-glow-b" />
      <span className="pf-dust pf-dust-a" />
      <span className="pf-dust pf-dust-b" />
      <span className="pf-dust pf-dust-c" />

      <div className="pf-passport-inner">
        <div className="pf-passport-card pf-card-enter">
          {/* Lớp tilt 3D + holographic sheen — tách riêng khỏi entrance
              animation của .pf-passport-card để tránh 2 transform xung đột */}
          <div className="pf-passport-tilt-surface" ref={cardRef}>
            <span className="pf-passport-sheen" aria-hidden="true" />
            <span className="pf-holo-sheen" aria-hidden="true" />

            <div className="pf-passport-card-top">
              <div className="pf-passport-left">
                <div className="pf-seal-magnetic">
                  <div
                    className="pf-passport-seal pf-seal-enter"
                    style={
                      isAdmin
                        ? {
                            background: roleMeta.sealBg,
                            borderColor: "rgba(184,134,46,0.4)",
                          }
                        : undefined
                    }
                  >
                    <div
                      className="pf-passport-seal-ring"
                      style={
                        isAdmin
                          ? { borderColor: "rgba(184,134,46,0.35)" }
                          : undefined
                      }
                    />
                    {initials}
                  </div>
                </div>
                <div className="pf-passport-id">
                  <div
                    className="pf-passport-tier pf-stagger"
                    style={{ "--d": "0.1s" }}
                  >
                    <span className="pf-tier-dot" />
                    <span className="pf-tier-shimmer-text">{memberTier}</span>
                  </div>
                  <h1
                    className="pf-passport-name pf-stagger"
                    style={{ "--d": "0.18s" }}
                  >
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <div
                    className="pf-passport-email pf-stagger"
                    style={{ "--d": "0.26s" }}
                  >
                    {Icon.mail}
                    <span>
                      {emailRevealed ? profile.email : maskEmail(profile.email)}
                    </span>
                    <button
                      type="button"
                      className="pf-btn-tactile pf-email-toggle-btn"
                      onClick={() => setEmailRevealed((r) => !r)}
                      aria-label={
                        emailRevealed ? "Ẩn email" : "Hiện đầy đủ email"
                      }
                      title={emailRevealed ? "Ẩn email" : "Hiện đầy đủ email"}
                    >
                      {emailRevealed ? Icon.eyeOff : Icon.eye}
                    </button>
                    <span className="pf-email-verified-badge">
                      {Icon.checkSm} Đã xác thực
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="pf-btn-tactile pf-passport-logout pf-stagger"
                style={{ "--d": "0.3s" }}
              >
                {Icon.logout} Đăng Xuất
              </button>
            </div>

            <div className="pf-passport-divider">
              <span className="pf-passport-divider-mark" />
            </div>

            <div className="pf-passport-bottom">
              <div
                className="pf-passport-code-block pf-stagger"
                style={{ "--d": "0.34s" }}
              >
                <div className="pf-passport-code-label">
                  Mã Số Earthoria (ETR)
                </div>
                <div className="pf-passport-code-row">
                  <span className="pf-passport-code-value">
                    {formattedCode}
                  </span>
                  <CopyButton text={formattedCode} compact />
                </div>
              </div>

              <div className="pf-passport-stats">
                <div
                  className="pf-passport-stat pf-stagger"
                  style={{ "--d": "0.38s" }}
                >
                  <div className="pf-passport-stat-val">
                    {animatedOrderCount}
                  </div>
                  <div className="pf-passport-stat-label">Đơn hàng</div>
                </div>
                <div className="pf-passport-stat-sep" />
                <div
                  className="pf-passport-stat pf-stagger"
                  style={{ "--d": "0.42s" }}
                >
                  <div className="pf-passport-stat-val">{animatedSpent}</div>
                  <div className="pf-passport-stat-label">Tổng chi tiêu</div>
                </div>
                <div className="pf-passport-stat-sep" />
                <div
                  className="pf-passport-stat pf-stagger"
                  style={{ "--d": "0.46s" }}
                >
                  <div className="pf-passport-stat-val">
                    {profile.createdAt ? formatDate(profile.createdAt) : "—"}
                  </div>
                  <div className="pf-passport-stat-label">Thành viên từ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════ SIDEBAR NAV ════════════════════════
// Chỉ chứa 5 nút chuyển chương (thay cho thanh tab ngang cũ). Đứng dọc bên
// trái, dưới PassportHero, sticky khi cuộn để menu luôn trong tầm tay.
// Điểm nhấn: một "viên thuốc" nền trượt mượt theo vị trí mục đang chọn,
// thay vì chỉ đổi màu tĩnh — đo vị trí thật của nút bằng ref rồi dịch
// chuyển bằng transform để tận dụng GPU, không giật.
function SidebarNav({ activeTab, onSelectTab, isOpen, onClose }) {
  const navRef = useRef(null);
  const itemRefs = useRef({});
  const [indicator, setIndicator] = useState({
    top: 0,
    height: 0,
    ready: false,
  });

  const measure = useCallback(() => {
    const el = itemRefs.current[activeTab];
    if (!el) return;
    setIndicator({ top: el.offsetTop, height: el.offsetHeight, ready: true });
  }, [activeTab]);

  useLayoutEffect(() => {
    measure();
  }, [measure, isOpen]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <aside className={`pf-sidebar ${isOpen ? "is-open" : ""}`}>
      <button
        onClick={onClose}
        className="pf-btn-tactile pf-sidebar-close"
        aria-label="Đóng menu"
      >
        {Icon.x}
      </button>
      <div className="pf-sidebar-eyebrow">Danh Mục</div>
      <div
        className="pf-sidebar-nav"
        role="navigation"
        aria-label="Danh mục hồ sơ"
        ref={navRef}
      >
        <span
          className={`pf-sidebar-indicator ${indicator.ready ? "is-ready" : ""}`}
          style={{
            transform: `translateY(${indicator.top}px)`,
            height: `${indicator.height}px`,
          }}
          aria-hidden="true"
        />
        {CHAPTERS.map((ch) => (
          <button
            key={ch.id}
            ref={(el) => {
              itemRefs.current[ch.id] = el;
            }}
            onClick={() => onSelectTab(ch.id)}
            className={`pf-btn-tactile pf-sidebar-link ${activeTab === ch.id ? "is-active" : ""} ${ch.danger ? "is-danger" : ""}`}
          >
            <span className="pf-sidebar-link-icon">{Icon[ch.icon]}</span>
            <span className="pf-sidebar-link-text">
              <span className="pf-sidebar-link-roman">{ch.roman}</span>
              <span className="pf-sidebar-link-label">{ch.label}</span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function FooterHelp() {
  return (
    <div className="pf-help-strip">
      <div className="pf-help-strip-inner">
        <div className="pf-help-strip-left">
          <div className="pf-help-strip-icon">{Icon.compass}</div>
          <div>
            <div className="pf-help-strip-title">Cần Hỗ Trợ?</div>
            <div className="pf-help-strip-sub">
              Đội ngũ Earthoria luôn sẵn sàng đồng hành cùng bạn trong mọi vấn
              đề.
            </div>
          </div>
        </div>
        <a href="mailto:earthoriavn@gmail.com" className="pf-help-strip-link">
          earthoriavn@gmail.com {Icon.arrowRight}
        </a>
      </div>
    </div>
  );
}

// ════════════════════════ OVERVIEW TAB ════════════════════════
function OverviewTab({
  profile,
  recentOrders,
  ordersLoading,
  saveField,
  onViewOrders,
  onViewOrder,
}) {
  return (
    <div>
      <SectionHeader
        chapter="I"
        eyebrow="Hồ Sơ"
        title="Thông Tin"
        emphasis="Cá Nhân"
        sub="Nhấn vào biểu tượng bút để chỉnh sửa từng trường thông tin"
      />

      <div className="pf-fields-grid">
        <EditableField
          label="Họ"
          icon={Icon.user}
          value={profile.lastName}
          onSave={saveField("lastName")}
          validate={(v) => (!v.trim() ? "Họ không được để trống" : null)}
        />
        <EditableField
          label="Tên"
          icon={Icon.user}
          value={profile.firstName}
          onSave={saveField("firstName")}
          validate={(v) => (!v.trim() ? "Tên không được để trống" : null)}
        />
        <EditableField
          label="Email"
          icon={Icon.mail}
          value={profile.email}
          locked
          masked
          lockedHint="Email được dùng để đăng nhập và không thể thay đổi"
          onSave={() => {}}
        />
        <EditableField
          label="Số điện thoại"
          icon={Icon.phone}
          value={profile.phone}
          type="tel"
          placeholder="Chưa cập nhật"
          onSave={saveField("phone")}
          validate={(v) =>
            v && !/^[0-9+\s-]{8,15}$/.test(v)
              ? "Số điện thoại không hợp lệ"
              : null
          }
        />
        <EditableField
          label="Ngày sinh"
          icon={Icon.cake}
          value={profile.dob ? profile.dob.slice(0, 10) : ""}
          type="date"
          placeholder="Chưa cập nhật"
          onSave={saveField("dob")}
        />

        <EditableField
          label="Giới tính"
          icon={Icon.user}
          value={profile.gender}
          placeholder="Chưa cập nhật"
          options={[
            { value: "MALE", label: "Nam" },
            { value: "FEMALE", label: "Nữ" },
            { value: "OTHER", label: "Khác" },
          ]}
          onSave={saveField("gender")}
        />

        <div className="pf-field is-locked">
          <div className="pf-field-label">
            <span className="pf-field-icon">{Icon.shield}</span>
            Mã Số Tài Khoản (MTK)
            <span
              className="pf-field-lock-badge"
              title="Mã định danh không thể thay đổi"
            >
              {Icon.lock}
            </span>
          </div>
          <div className="pf-field-display" style={{ cursor: "default" }}>
            <span className="pf-field-value pf-mono">
              {formatAccountCode(
                (profile.memberCode || profile.id || "").toString(),
              )}
            </span>
          </div>
        </div>

        <div className="pf-field is-locked">
          <div className="pf-field-label">
            <span className="pf-field-icon">{Icon.seal}</span>
            Mã Số Earthoria (ETR)
            <span
              className="pf-field-lock-badge"
              title="Mã định danh Earthoria, không thể thay đổi"
            >
              {Icon.lock}
            </span>
          </div>
          <div className="pf-field-display" style={{ cursor: "default" }}>
            <span className="pf-field-value pf-mono">
              {profile.userCode || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="pf-ornament-sm">
        <span />
        <span className="pf-ornament-mark" />
        <span />
      </div>

      <div className="pf-subheader-row">
        <h3 className="pf-subheader-title">
          Đơn Hàng <em>Gần Đây</em>
        </h3>
        <button onClick={onViewOrders} className="pf-btn-tactile pf-view-all">
          Xem tất cả {Icon.arrowRight}
        </button>
      </div>

      {ordersLoading ? (
        <div className="pf-stack-12">
          {[0, 1, 2].map((i) => (
            <MiniOrderSkeleton key={i} />
          ))}
        </div>
      ) : recentOrders.length === 0 ? (
        <EmptyState
          icon={Icon.package}
          text="Bạn chưa có đơn hàng nào"
          sub="Hãy bắt đầu hành trình khám phá sách AR đầu tiên"
        />
      ) : (
        <div className="pf-stack-12">
          {recentOrders.map((order, i) => (
            <MiniOrderCard
              key={order.id}
              order={order}
              delay={i}
              onClick={() => onViewOrder(order.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MiniOrderSkeleton() {
  return (
    <div className="pf-mini-order" style={{ cursor: "default" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          paddingLeft: "4px",
        }}
      >
        <div className="pf-skel" style={{ width: "160px", height: "13px" }} />
        <div className="pf-skel" style={{ width: "200px", height: "11px" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div className="pf-skel" style={{ width: "78px", height: "22px" }} />
        <div className="pf-skel" style={{ width: "90px", height: "20px" }} />
      </div>
    </div>
  );
}

function MiniOrderCard({ order, delay, onClick }) {
  const status = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.PENDING;
  const sheen = useSheen();
  return (
    <div
      ref={sheen.ref}
      onMouseMove={sheen.onMouseMove}
      onMouseEnter={sheen.onMouseEnter}
      onMouseLeave={sheen.onMouseLeave}
      onClick={onClick}
      className="pf-mini-order pf-sheen-surface"
      style={{ transitionDelay: `${delay * 0.05}s` }}
    >
      <span className="pf-sheen-glow" aria-hidden="true" />
      <div className="pf-mini-order-accent" />
      <div style={{ paddingLeft: "4px" }}>
        <div className="pf-mini-order-code">Đơn #{getOrderCode(order)}</div>
        <div className="pf-mini-order-meta">
          {order.items?.length || 0} sản phẩm · {formatDate(order.createdAt)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <span
          className="pf-status-pill"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
        <div className="pf-mini-order-price">{formatPrice(order.total)}</div>
      </div>
    </div>
  );
}

// ════════════════════════ ORDERS TAB ════════════════════════
function OrdersTab({ orders, loading, onSelect }) {
  const [filter, setFilter] = useState("all");
  const [lookupCode, setLookupCode] = useState("");
  const [lookupError, setLookupError] = useState("");
  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const countFor = (key) =>
    key === "all"
      ? orders.length
      : orders.filter((o) => o.status === key).length;

  const normalize = (s) => (s || "").toString().trim().toLowerCase();

  const handleLookup = (e) => {
    e.preventDefault();
    const code = normalize(lookupCode);
    if (!code) {
      setLookupError("Vui lòng nhập mã đơn hàng");
      return;
    }
    const match = orders.find(
      (o) =>
        normalize(getOrderCode(o)) === code ||
        normalize(o.id) === code ||
        normalize(o.id).startsWith(code),
    );
    if (match) {
      setLookupError("");
      onSelect(match.id);
    } else {
      setLookupError("Không tìm thấy đơn hàng với mã này");
    }
  };

  return (
    <div>
      <SectionHeader
        chapter="II"
        eyebrow="Lịch Sử Mua Sắm"
        title="Lịch Sử"
        emphasis="Đơn Hàng"
        sub={`${orders.length} đơn hàng đã đặt từ khi tham gia Earthoria`}
      />

      <form className="pf-order-lookup" onSubmit={handleLookup}>
        <span className="pf-order-lookup-label">Tra cứu nhanh mã vận đơn</span>
        <div className="pf-order-lookup-row">
          <input
            type="text"
            className="pf-order-lookup-input"
            placeholder="Nhập mã đơn hàng..."
            value={lookupCode}
            onChange={(e) => {
              setLookupCode(e.target.value);
              if (lookupError) setLookupError("");
            }}
          />
          <button
            type="submit"
            className="pf-btn-tactile pf-order-lookup-btn"
            aria-label="Tra cứu"
          >
            {Icon.search} <span>Tra cứu</span>
          </button>
        </div>
        {lookupError && (
          <div className="pf-order-lookup-error">{lookupError}</div>
        )}
      </form>

      <div className="pf-filter-row">
        {[
          ["all", "Tất cả"],
          ...Object.entries(ORDER_STATUS_MAP).map(([k, v]) => [k, v.label]),
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`pf-btn-tactile pf-filter-pill ${filter === key ? "is-active" : ""}`}
          >
            {label}
            <span className="pf-filter-count">{countFor(key)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="pf-stack-16">
          {[0, 1, 2].map((i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Icon.package}
          text="Không có đơn hàng nào"
          sub="Thử chọn bộ lọc khác để xem thêm"
        />
      ) : (
        <div className="pf-stack-16">
          {filtered.map((order, i) => (
            <OrderCard
              key={order.id}
              order={order}
              delay={i}
              onClick={() => onSelect(order.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <div className="pf-order-card">
      <div className="pf-order-card-head">
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div className="pf-skel" style={{ width: "120px", height: "13px" }} />
          <div className="pf-skel" style={{ width: "90px", height: "12px" }} />
        </div>
        <div className="pf-skel" style={{ width: "84px", height: "22px" }} />
      </div>
      <div className="pf-order-card-body">
        <div style={{ display: "flex", gap: "10px" }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="pf-skel"
              style={{ width: "54px", height: "70px" }}
            />
          ))}
        </div>
        <div
          style={{
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            alignItems: "flex-end",
          }}
        >
          <div className="pf-skel" style={{ width: "70px", height: "11px" }} />
          <div className="pf-skel" style={{ width: "100px", height: "22px" }} />
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, delay, onClick }) {
  const status = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.PENDING;
  const sheen = useSheen();
  return (
    <div
      ref={sheen.ref}
      onMouseMove={sheen.onMouseMove}
      onMouseEnter={sheen.onMouseEnter}
      onMouseLeave={sheen.onMouseLeave}
      onClick={onClick}
      className="pf-order-card pf-sheen-surface"
      style={{ transitionDelay: `${Math.min(delay, 6) * 0.04}s` }}
    >
      <span className="pf-sheen-glow" aria-hidden="true" />
      <div className="pf-order-card-head">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
            rowGap: "8px",
          }}
        >
          <span className="pf-order-code">Đơn #{getOrderCode(order)}</span>
          <CopyButton text={getOrderCode(order)} />
          <div className="pf-vdivider" />
          <span className="pf-order-date">{formatDate(order.createdAt)}</span>
        </div>
        <span
          className="pf-status-pill"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
      </div>
      <div className="pf-order-card-body">
        <div style={{ display: "flex", gap: "10px" }}>
          {(order.items || []).slice(0, 4).map((item, i) => (
            <div key={i} className="pf-thumb-cell">
              {item.book?.coverImage && (
                <img src={item.book.coverImage} alt="" />
              )}
            </div>
          ))}
          {(order.items?.length || 0) > 4 && (
            <div className="pf-thumb-cell pf-thumb-more">
              +{order.items.length - 4}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="pf-order-item-count">
            {order.items?.length || 0} sản phẩm
          </div>
          <div className="pf-order-total">{formatPrice(order.total)}</div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════ ORDER DETAIL TAB ════════════════════════
function OrderDetailSkeleton({ onBack }) {
  return (
    <div>
      <button onClick={onBack} className="pf-btn-tactile pf-back-btn">
        {Icon.back} Quay Lại Danh Sách Đơn Hàng
      </button>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "36px",
        }}
      >
        <div className="pf-skel" style={{ width: "160px", height: "11px" }} />
        <div className="pf-skel" style={{ width: "260px", height: "36px" }} />
      </div>
      <div
        className="pf-skel"
        style={{ width: "100%", height: "120px", marginBottom: "28px" }}
      />
      <div className="pf-detail-layout">
        <div className="pf-skel" style={{ width: "100%", height: "320px" }} />
        <div className="pf-skel" style={{ width: "100%", height: "260px" }} />
      </div>
    </div>
  );
}

// Đếm ngược tới order.paymentSessionExpiresAt. Không tự đổi trạng thái đơn (đó là việc của
// paymentExpiryService bên server, chạy mỗi 60s) — hết giờ ở đây chỉ để UI phản hồi ngay, rồi
// gọi onSessionExpire để refetch, tránh trường hợp job server chưa kịp chạy mà FE đã báo sai.
function PaymentSessionCountdown({ expiresAt, onExpire }) {
  const target = new Date(expiresAt).getTime();
  const [remainingMs, setRemainingMs] = useState(() => target - Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const tick = () => setRemainingMs(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  useEffect(() => {
    if (remainingMs <= 0 && !firedRef.current) {
      firedRef.current = true;
      onExpire?.();
    }
  }, [remainingMs, onExpire]);

  if (remainingMs <= 0) {
    return (
      <div className="pf-payment-badge" style={{ color: "#c0392b" }}>
        {Icon.shield} <span>Phiên thanh toán đã hết hạn</span>
      </div>
    );
  }

  const mm = Math.floor(remainingMs / 60000);
  const ss = Math.floor((remainingMs % 60000) / 1000);

  return (
    <div className="pf-payment-badge">
      {Icon.shield}
      <span>
        Còn {mm}:{String(ss).padStart(2, "0")} để hoàn tất thanh toán, quá hạn
        đơn sẽ tự huỷ và hoàn kho
      </span>
    </div>
  );
}

function OrderDetailTab({ order, loading, onBack, onSessionExpire }) {
  const [retrying, setRetrying] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [bankQrData, setBankQrData] = useState(null);
  const [bankQrMismatch, setBankQrMismatch] = useState(null);
  const { user } = useAuthStore();
  const qc = useQueryClient();

  useEffect(() => {
    if (!bankQrData || !order || order.paymentStatus === "PAID") return;

    const POLL_INTERVAL_MS = 3000;
    let cancelled = false;

    const poll = async () => {
      try {
        const { data } = await paymentService.getBankQrStatus(order.id);
        if (cancelled) return;
        const result = data.data;
        if (result.success) {
          toast.success("Thanh toán thành công!");
          setBankQrData(null);
          qc.invalidateQueries({ queryKey: ["order", order.id] });
          qc.invalidateQueries({ queryKey: ["orders"] });
        } else if (result.mismatch) {
          setBankQrMismatch({
            transferredAmount: result.transferredAmount,
            expectedAmount: result.expectedAmount,
          });
          toast.error(
            "Số tiền chuyển khoản không khớp với đơn hàng, vui lòng liên hệ hỗ trợ.",
          );
        } else if (result.expired) {
          toast.error(
            "Mã QR đã hết hạn, vui lòng bấm thanh toán lại để lấy mã mới.",
          );
          setBankQrData(null);
        }
      } catch {
        // Lỗi mạng tạm thời khi polling — chờ lượt sau tự thử lại.
      }
    };

    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [bankQrData, order?.id, order?.paymentStatus, qc]);

  const cancelMutation = useMutation({
    mutationFn: (payload) => orderService.cancelOrder(order.id, payload),
    onSuccess: () => {
      toast.success(
        "Đã huỷ đơn hàng thành công. Email xác nhận đã được gửi tới bạn.",
      );
      qc.invalidateQueries({ queryKey: ["order", order.id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      setShowCancelModal(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Huỷ đơn hàng thất bại");
    },
  });

  const confirmReceivedMutation = useMutation({
    mutationFn: () => orderService.confirmReceived(order.id),
    onSuccess: () => {
      toast.success("Đã xác nhận nhận hàng, cảm ơn bạn!");
      qc.invalidateQueries({ queryKey: ["order", order.id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Xác nhận thất bại");
    },
  });

  if (loading || !order) return <OrderDetailSkeleton onBack={onBack} />;

  const status = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.PENDING;
  const isCancelled = order.status === "CANCELLED";
  // Đơn ebook không đi qua CONFIRMED/PROCESSING/SHIPPING/DELIVERED (BE chuyển thẳng
  // PENDING -> COMPLETED khi thanh toán xong) nên dùng riêng 1 thanh tiến trình 2 bước,
  // không hiển thị các bước giao hàng vốn không áp dụng cho sách điện tử.
  const steps = order.isDigital ? DIGITAL_ORDER_STEPS : ORDER_STEPS;
  const stepIdx = order.isDigital
    ? steps.indexOf(order.status === "COMPLETED" ? "COMPLETED" : "PENDING")
    : order.status === "COMPLETED"
      ? ORDER_STEPS.length - 1
      : ORDER_STEPS.indexOf(order.status);
  const fillPct = (Math.max(0, stepIdx) / (steps.length - 1)) * 100;
  const canRetryPayment =
    ["VNPAY", "MOMO", "BANKQR"].includes(order.paymentMethod) &&
    order.paymentStatus !== "PAID" &&
    ["PENDING", "CONFIRMED"].includes(order.status);
  const canCancel =
    ["PENDING", "CONFIRMED"].includes(order.status) &&
    order.paymentStatus !== "PAID";
  // Chỉ sách giấy mới có bước DELIVERED chờ người nhận bấm xác nhận; ebook đã tự COMPLETED khi thanh toán.
  const canConfirmReceived = !order.isDigital && order.status === "DELIVERED";

  const retryPayment = async () => {
    setRetrying(true);
    if (order.paymentMethod === "BANKQR") {
      try {
        const { data } = await paymentService.createBankQrPayment(order.id);
        setBankQrData(data.data);
        setBankQrMismatch(null);
        toast.success("Đã tạo mã QR — quét để chuyển khoản");
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Không tạo được mã QR chuyển khoản",
        );
      } finally {
        setRetrying(false);
      }
      return;
    }

    try {
      const create =
        order.paymentMethod === "VNPAY"
          ? paymentService.createVnpayUrl
          : paymentService.createMomoUrl;
      const { data } = await create(order.id);
      window.location.href = data.data.paymentUrl;
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Không tạo được liên kết thanh toán",
      );
      setRetrying(false);
    }
  };

  const shippingName =
    order.shippingName || order.address?.name || "Chưa cập nhật";
  const shippingPhone =
    order.shippingPhone || order.address?.phone || "Chưa cập nhật";
  const shippingAddress =
    order.shippingAddress ||
    [
      order.address?.street,
      order.address?.wardName || order.address?.ward,
      order.address?.provinceName || order.address?.district,
      order.address?.city,
    ]
      .filter(Boolean)
      .join(", ") ||
    "Chưa cập nhật";

  return (
    <div>
      <button onClick={onBack} className="pf-btn-tactile pf-back-btn">
        {Icon.back} Quay Lại Danh Sách Đơn Hàng
      </button>

      <div className="pf-detail-head-row">
        <div>
          <div className="pf-detail-eyebrow">
            <span className="pf-detail-eyebrow-line" />
            Chi Tiết Đơn Hàng
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <h2 className="pf-detail-title">#{getOrderCode(order)}</h2>
            <CopyButton text={getOrderCode(order)} />
          </div>
          <div className="pf-detail-date">
            Đặt lúc {formatDateTime(order.createdAt)}
          </div>
        </div>
        <span
          className="pf-status-pill pf-status-pill-lg"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      {!isCancelled && (
        <div className="pf-tracker-card">
          <div className="pf-tracker-row">
            <div className="pf-tracker-line">
              <div
                className="pf-tracker-line-fill"
                style={{ width: `${fillPct}%` }}
              >
                {fillPct < 100 && <span className="pf-tracker-line-dot" />}
              </div>
            </div>
            {steps.map((s, i) => {
              const label = order.isDigital
                ? DIGITAL_STEP_LABELS[s]
                : ORDER_STATUS_MAP[s].label;
              const done = i <= stepIdx;
              const current = i === stepIdx;
              return (
                <div key={s} className="pf-tracker-step">
                  <div
                    className={`pf-tracker-dot ${done ? "done" : ""} ${current ? "current" : ""}`}
                  >
                    {done ? (
                      Icon.checkSm
                    ) : (
                      <span style={{ fontSize: "10px" }}>{i + 1}</span>
                    )}
                  </div>
                  <span className={`pf-tracker-label ${done ? "done" : ""}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="pf-cancelled-banner">
          <span style={{ color: "#b25450" }}>⊗</span>
          <span>Đơn hàng này đã bị hủy</span>
        </div>
      )}

      <div className="pf-detail-layout">
        <div>
          <div className="pf-items-card">
            <div className="pf-items-header">
              Sản Phẩm ({order.items?.length || 0})
            </div>
            {(order.items || []).map((item, i) => {
              const hasBookLink = item.book?.slug && item.book?.hashId;
              const ItemWrap = hasBookLink ? Link : "div";
              const wrapProps = hasBookLink
                ? { to: getBookUrl(item.book.slug, item.book.hashId) }
                : {};
              return (
                <ItemWrap
                  key={i}
                  {...wrapProps}
                  className={`pf-item-row${hasBookLink ? " pf-item-row-link" : ""}`}
                  style={{
                    borderBottom:
                      i < order.items.length - 1
                        ? "0.5px solid var(--border)"
                        : "none",
                    cursor: hasBookLink ? "pointer" : "default",
                  }}
                >
                  <div className="pf-item-thumb">
                    {item.book?.coverImage && (
                      <img src={item.book.coverImage} alt="" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="pf-item-title">
                      {item.book?.title || item.title}
                    </div>
                    <div className="pf-item-meta">
                      SL: {item.quantity} × {formatPrice(item.price)}
                    </div>
                  </div>
                  <div className="pf-item-total">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </ItemWrap>
              );
            })}
          </div>

          {order.isDigital ? (
            <div className="pf-shipping-card">
              <div className="pf-shipping-head">{Icon.truck} Sách điện tử</div>
              <div className="pf-shipping-detail">
                Đơn hàng chỉ gồm sách điện tử — không cần giao hàng. Sau khi
                thanh toán, bạn có thể đọc ngay trong mục Sách điện tử của tôi.
              </div>
            </div>
          ) : (
            <div className="pf-shipping-card">
              <div className="pf-shipping-head">
                {Icon.truck} Thông Tin Giao Hàng
              </div>
              <div className="pf-shipping-name">{shippingName}</div>
              <div className="pf-shipping-detail">
                {shippingPhone}
                <br />
                {shippingAddress}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="pf-summary-card">
            <div className="pf-summary-title">Tóm Tắt Thanh Toán</div>
            {[
              ["Tạm tính", formatPrice(order.subtotal || order.total)],
              [
                "Phí giao hàng",
                order.shippingFee ? formatPrice(order.shippingFee) : "Miễn phí",
              ],
              ...(order.discount
                ? [["Giảm giá", `−${formatPrice(order.discount)}`]]
                : []),
            ].map(([k, v]) => (
              <div key={k} className="pf-summary-line">
                <span style={{ color: "var(--text-muted)" }}>{k}</span>
                <span style={{ color: "var(--forest)" }}>{v}</span>
              </div>
            ))}
            <div className="pf-summary-divider" />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span className="pf-summary-total-label">Tổng cộng</span>
              <span className="pf-summary-total-val">
                {formatPrice(order.total)}
              </span>
            </div>
            <div className="pf-payment-badge">
              {Icon.shield}
              <span>
                Thanh toán: {order.paymentMethod || "COD"}
                {order.paymentMethod !== "COD" &&
                  ` — ${order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}`}
              </span>
            </div>
            {canRetryPayment && order.paymentSessionExpiresAt && (
              <PaymentSessionCountdown
                expiresAt={order.paymentSessionExpiresAt}
                onExpire={onSessionExpire}
              />
            )}
            {canRetryPayment && !bankQrData && (
              <button
                onClick={retryPayment}
                disabled={retrying}
                className="pf-btn-tactile pf-btn-shine pf-pw-submit"
                style={{ width: "100%", marginTop: 14 }}
              >
                {retrying ? (
                  <>
                    <span className="pf-spinner-sm" />{" "}
                    {order.paymentMethod === "BANKQR"
                      ? "Đang tạo mã QR…"
                      : "Đang chuyển hướng…"}
                  </>
                ) : order.paymentMethod === "BANKQR" ? (
                  "Thanh toán lại qua chuyển khoản QR"
                ) : (
                  `Thanh toán lại qua ${order.paymentMethod === "VNPAY" ? "VNPay" : "MoMo"}`
                )}
              </button>
            )}
            {canRetryPayment && bankQrData && bankQrMismatch && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: "16px 16px",
                  marginTop: 14,
                  background: "#fdf2f0",
                  border: "0.5px solid #e8b4ab",
                }}
              >
                <AlertCircle
                  size={16}
                  strokeWidth={1.5}
                  style={{ color: "#c0392b", flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--forest)",
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    Số tiền chuyển khoản không khớp
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      fontWeight: 300,
                    }}
                  >
                    Chúng tôi ghi nhận bạn đã chuyển{" "}
                    <strong style={{ color: "var(--forest)" }}>
                      {formatPrice(bankQrMismatch.transferredAmount)}
                    </strong>
                    , nhưng đơn hàng cần{" "}
                    <strong style={{ color: "var(--forest)" }}>
                      {formatPrice(bankQrMismatch.expectedAmount)}
                    </strong>
                    . Vui lòng liên hệ hỗ trợ để được đối soát và xử lý.
                  </div>
                </div>
              </div>
            )}
            {canRetryPayment && bankQrData && !bankQrMismatch && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "20px 16px",
                  marginTop: 14,
                  background: "var(--white)",
                  border: "0.5px solid var(--border-gold)",
                }}
              >
                <img
                  src={bankQrData.qrImageUrl}
                  alt="Mã QR chuyển khoản ngân hàng"
                  style={{
                    width: 180,
                    height: 180,
                    objectFit: "contain",
                    border: "0.5px solid var(--border)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 16,
                    fontSize: 12,
                    color: "var(--gold)",
                  }}
                >
                  <span className="pf-spinner-sm" />
                  Đang chờ chuyển khoản — tự động xác nhận trong ít phút
                </div>
                <div
                  style={{
                    width: "100%",
                    marginTop: 18,
                    paddingTop: 16,
                    borderTop: "0.5px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {[
                    ["Ngân hàng", bankQrData.bankCode],
                    ["Số tài khoản", bankQrData.accountNo],
                    ["Chủ tài khoản", bankQrData.accountName],
                    ["Số tiền", formatPrice(bankQrData.amount)],
                    ["Nội dung CK", bankQrData.addInfo],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>
                        {label}
                      </span>
                      <span style={{ color: "var(--forest)", fontWeight: 500 }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {canConfirmReceived && (
              <button
                onClick={() => confirmReceivedMutation.mutate()}
                disabled={confirmReceivedMutation.isPending}
                className="pf-btn-tactile pf-btn-shine pf-pw-submit"
                style={{ width: "100%", marginTop: 14 }}
              >
                {confirmReceivedMutation.isPending ? (
                  <>
                    <span className="pf-spinner-sm" /> Đang xác nhận…
                  </>
                ) : (
                  "Đã nhận được hàng"
                )}
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="pf-btn-tactile pf-btn-cancel-order"
                style={{ width: "100%", marginTop: 10 }}
              >
                Huỷ đơn hàng
              </button>
            )}
            <button
              onClick={() => setShowInvoice(true)}
              className="pf-btn-tactile"
              style={{
                width: "100%",
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "transparent",
                border: "0.5px solid var(--border-gold)",
                color: "var(--forest)",
                borderRadius: 10,
                padding: "12px 20px",
                fontFamily: F.sans,
                fontSize: 11.5,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <FileText size={14} strokeWidth={1.5} />
              {order.requestInvoice ? "Xem / In hoá đơn" : "Xem / In phiếu mua hàng"}
            </button>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelOrderModal
          order={order}
          submitting={cancelMutation.isPending}
          onClose={() => !cancelMutation.isPending && setShowCancelModal(false)}
          onConfirm={(payload) => cancelMutation.mutate(payload)}
        />
      )}

      {showInvoice && (
        <InvoiceModal
          order={order}
          buyerEmail={user?.email}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
}

// ════════════════════════ HUỶ ĐƠN HÀNG — MODAL XÁC NHẬN ════════════════════════
function CancelOrderModal({ order, onClose, onConfirm, submitting }) {
  const expectedCode = (getOrderCode(order) || "").toLowerCase();
  const [codeInput, setCodeInput] = useState("");
  const [reason, setReason] = useState("");
  const codeMatches =
    expectedCode.length > 0 && codeInput.trim().toLowerCase() === expectedCode;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,46,43,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          maxWidth: 440,
          width: "100%",
          padding: "32px 32px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <h3
          style={{
            fontFamily: F.serif,
            fontSize: 22,
            color: "var(--forest)",
            margin: "0 0 8px",
          }}
        >
          Huỷ đơn hàng #{getOrderCode(order)}
        </h3>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            lineHeight: 1.7,
            margin: "0 0 20px",
          }}
        >
          Để xác nhận, vui lòng nhập chính xác mã đơn hàng bên dưới. Hành động
          này không thể hoàn tác.
        </p>

        <label
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "var(--text-muted)",
            display: "block",
            marginBottom: 6,
          }}
        >
          Mã đơn hàng
        </label>
        <input
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          placeholder={getOrderCode(order)}
          disabled={submitting}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 8,
            border: `1.5px solid ${codeMatches ? "#4a9e3f" : "var(--border)"}`,
            fontSize: 14,
            marginBottom: 18,
            fontFamily: F.sans,
            boxSizing: "border-box",
          }}
        />

        <label
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "var(--text-muted)",
            display: "block",
            marginBottom: 6,
          }}
        >
          Lý do huỷ đơn
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={!codeMatches || submitting}
          placeholder={
            codeMatches
              ? "Cho chúng tôi biết lý do bạn huỷ đơn..."
              : "Nhập đúng mã đơn hàng ở trên để mở khoá ô này"
          }
          rows={4}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 8,
            border: "1.5px solid var(--border)",
            fontSize: 13.5,
            fontFamily: F.sans,
            resize: "vertical",
            boxSizing: "border-box",
            marginBottom: 24,
            background: codeMatches ? "#fff" : "#f5f4f0",
            color: codeMatches ? "inherit" : "#aaa",
          }}
        />

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="pf-btn-tactile pf-modal-btn-secondary"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm({
                confirmCode: codeInput.trim(),
                reason: reason.trim(),
              })
            }
            disabled={!codeMatches || !reason.trim() || submitting}
            className="pf-btn-tactile pf-modal-btn-danger"
          >
            {submitting ? "Đang huỷ…" : "Xác nhận huỷ đơn"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════ SECURITY TAB ════════════════════════
const PASSWORD_CHECKS = [
  {
    key: "len",
    label: "8 – 16 ký tự",
    test: (v) => v.length >= 8 && v.length <= 16,
  },
  {
    key: "upper",
    label: "Ít nhất 1 chữ HOA (A-Z)",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    key: "lower",
    label: "Ít nhất 1 chữ thường (a-z)",
    test: (v) => /[a-z]/.test(v),
  },
  {
    key: "special",
    label: "Ít nhất 1 ký tự đặc biệt (!@#…)",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

function SecurityTab({ hasPassword, email }) {
  if (hasPassword === false) {
    return <CreatePasswordFlow email={email} />;
  }

  return <ChangePasswordFlow />;
}

// ─ Google "G" glyph — dùng làm icon minh hoạ cho tài khoản đăng nhập Google ─
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.4 19 12 24 12c3.1 0 5.9 1.2 8 3.1l6-6C34.6 5.1 29.6 3 24 3c-7.4 0-13.7 4.2-17 10.4z"
      />
      <path
        fill="#4CAF50"
        d="M24 45c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 36 26.9 37 24 37c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.6 40.7 16.2 45 24 45z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.6 5.6C41.5 36.4 45 30.7 45 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

const CREATE_PW_OTP_LEN = 6;

// ════════ Tạo mật khẩu lần đầu cho tài khoản Google (bắt buộc xác thực OTP) ════════
function CreatePasswordFlow({ email }) {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState("intro"); // 'intro' | 'form'
  const [otp, setOtp] = useState(Array(CREATE_PW_OTP_LEN).fill(""));
  const [resendTimer, setResendTimer] = useState(0);
  const [showPw, setShowPw] = useState({ new: false, confirm: false });
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [touchedPw, setTouchedPw] = useState(false);
  const [errors, setErrors] = useState({});
  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const sendOtpMutation = useMutation({
    mutationFn: () => authService.sendCreatePasswordOtp(),
    onSuccess: () => {
      toast.success("Mã xác thực đã được gửi đến email của bạn!");
      setStage("form");
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Không thể gửi mã xác thực.");
    },
  });

  const handleResend = () => {
    if (resendTimer > 0) return;
    sendOtpMutation.mutate();
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setErrors((e) => ({ ...e, otp: null }));
    if (val && idx < CREATE_PW_OTP_LEN - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CREATE_PW_OTP_LEN);
    if (!pasted) return;
    const next = pasted
      .split("")
      .concat(Array(CREATE_PW_OTP_LEN).fill(""))
      .slice(0, CREATE_PW_OTP_LEN);
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, CREATE_PW_OTP_LEN - 1)]?.focus();
  };

  const checksResult = PASSWORD_CHECKS.map((c) => ({
    ...c,
    ok: c.test(form.newPassword),
  }));
  const strength = checksResult.filter((c) => c.ok).length;
  const isStrongEnough =
    form.newPassword.length > 0 && checksResult.every((c) => c.ok);
  const confirmMatches =
    form.confirmPassword.length > 0 &&
    form.confirmPassword === form.newPassword;
  const otpValue = otp.join("");
  const otpComplete = otpValue.length === CREATE_PW_OTP_LEN;

  const handleChange = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (field === "newPassword") setTouchedPw(true);
    setErrors((e) => ({ ...e, [field]: null }));
  };

  const createMutation = useMutation({
    mutationFn: (data) => authService.createPassword(data),
    onSuccess: () => {
      toast.success("Tạo mật khẩu thành công!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Tạo mật khẩu thất bại!";
      toast.error(msg);
      setErrors({ otp: msg });
      setOtp(Array(CREATE_PW_OTP_LEN).fill(""));
      otpRefs.current[0]?.focus();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!otpComplete) newErrors.otp = "Vui lòng nhập đủ 6 số.";
    if (!isStrongEnough)
      newErrors.newPassword = "Mật khẩu mới chưa đạt đủ các tiêu chí bên dưới";
    if (!confirmMatches)
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setTouchedPw(true);
      return;
    }
    createMutation.mutate({ otp: otpValue, newPassword: form.newPassword });
  };

  const strengthMeta = [
    { label: "", color: "var(--border)" },
    { label: "Yếu", color: "#e05c5c" },
    { label: "Trung Bình", color: "#e0a840" },
    { label: "Tốt", color: "var(--sage)" },
    { label: "Mạnh", color: "var(--gold)" },
  ][strength];

  const canSubmit =
    !createMutation.isPending &&
    otpComplete &&
    isStrongEnough &&
    confirmMatches;

  return (
    <div>
      <SectionHeader
        chapter="III"
        eyebrow="Bảo Mật Tài Khoản"
        title="Bảo Mật"
        emphasis="Tài Khoản"
        sub="Quản lý mật khẩu và các tùy chọn bảo mật đăng nhập"
      />

      <div className="pf-security-layout">
        <div className="pf-security-form-card">
          <div
            style={{
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div className="pf-lock-icon-wrap">
              <GoogleGlyph />
            </div>
            <h3 className="pf-security-title">Tạo Mật Khẩu</h3>
          </div>
          <p className="pf-security-sub">
            Tài khoản {email ? <strong>{email}</strong> : "của bạn"} hiện đang
            đăng nhập bằng Google và chưa có mật khẩu riêng. Tạo mật khẩu để có
            thêm cách đăng nhập bằng email, phòng khi bạn không đăng nhập được
            bằng Google.
          </p>

          {stage === "intro" && (
            <button
              type="button"
              onClick={() => sendOtpMutation.mutate()}
              disabled={sendOtpMutation.isPending}
              className="pf-btn-tactile pf-btn-shine pf-pw-submit"
              style={{ maxWidth: "300px" }}
            >
              {sendOtpMutation.isPending ? (
                "Đang gửi mã..."
              ) : (
                <>Gửi Mã Xác Thực {Icon.arrowRight}</>
              )}
            </button>
          )}

          {stage === "form" && (
            <form onSubmit={handleSubmit} className="pf-pw-form">
              <div>
                <label className="pf-pw-label">Mã Xác Thực (OTP)</label>
                <div className="pf-otp-row">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      className={`pf-otp-input ${errors.otp ? "has-error" : ""}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <div className="pf-field-error">{errors.otp}</div>
                )}
                <div className="pf-otp-resend-row">
                  <span>Không nhận được mã?</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendTimer > 0 || sendOtpMutation.isPending}
                    className="pf-otp-resend-btn"
                  >
                    {resendTimer > 0
                      ? `Gửi lại sau ${resendTimer}s`
                      : "Gửi lại mã"}
                  </button>
                </div>
              </div>

              <div>
                <PasswordField
                  label="Mật Khẩu Mới"
                  value={form.newPassword}
                  onChange={(v) => handleChange("newPassword", v)}
                  show={showPw.new}
                  toggle={() => setShowPw((s) => ({ ...s, new: !s.new }))}
                  error={errors.newPassword}
                  placeholder="8–16 ký tự, chữ hoa, ký tự đặc biệt"
                />
                {touchedPw && form.newPassword && (
                  <div className="pf-strength-zone">
                    <div className="pf-strength-bar">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`pf-strength-seg ${i < strength ? "is-filled" : ""}`}
                          style={{
                            background:
                              i < strength
                                ? strengthMeta.color
                                : "var(--border)",
                            transitionDelay: `${i * 0.05}s`,
                          }}
                        />
                      ))}
                    </div>
                    <div
                      className="pf-strength-label"
                      style={{ color: strengthMeta.color }}
                    >
                      {strengthMeta.label}
                    </div>
                  </div>
                )}
                <div className="pf-pw-checklist">
                  {checksResult.map((c) => (
                    <div
                      key={c.key}
                      className={`pf-pw-check-item ${c.ok ? "met" : ""}`}
                    >
                      <span className="pf-pw-dot">
                        {c.ok ? Icon.checkSm : ""}
                      </span>
                      {c.label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <PasswordField
                  label="Xác Nhận Mật Khẩu Mới"
                  value={form.confirmPassword}
                  onChange={(v) => handleChange("confirmPassword", v)}
                  show={showPw.confirm}
                  toggle={() =>
                    setShowPw((s) => ({ ...s, confirm: !s.confirm }))
                  }
                  error={errors.confirmPassword}
                  placeholder="Nhập lại mật khẩu mới"
                />
                {form.confirmPassword && (
                  <div
                    className={`pf-pw-check-item ${confirmMatches ? "met" : ""}`}
                    style={{ marginTop: "8px" }}
                  >
                    <span className="pf-pw-dot">
                      {confirmMatches ? Icon.checkSm : ""}
                    </span>
                    Khớp với mật khẩu mới
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="pf-btn-tactile pf-btn-shine pf-pw-submit"
              >
                {createMutation.isPending ? (
                  "Đang Xử Lý..."
                ) : (
                  <>Tạo Mật Khẩu {Icon.arrowRight}</>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="pf-tips-card">
          <div className="pf-tips-glow" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <div className="pf-lock-icon-wrap">{Icon.shield}</div>
              <span className="pf-tips-eyebrow">Vì Sao Nên Tạo Mật Khẩu?</span>
            </div>
            {[
              "Đăng nhập được kể cả khi không truy cập được vào tài khoản Google.",
              "Thêm một lớp bảo vệ độc lập cho tài khoản Earthoria của bạn.",
              "Mã OTP xác thực đảm bảo chỉ chính bạn mới có thể tạo mật khẩu mới.",
              "Sau khi tạo, bạn vẫn có thể tiếp tục đăng nhập bằng Google như bình thường.",
            ].map((tip, i, arr) => (
              <div
                key={i}
                className="pf-tip-row"
                style={{ marginBottom: i < arr.length - 1 ? "18px" : 0 }}
              >
                <span className="pf-tip-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordFlow() {
  const [showPw, setShowPw] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState({});

  const checksResult = PASSWORD_CHECKS.map((c) => ({
    ...c,
    ok: c.test(form.newPassword),
  }));
  const strength = checksResult.filter((c) => c.ok).length;
  const isStrongEnough =
    form.newPassword.length > 0 && checksResult.every((c) => c.ok);
  const confirmMatches =
    form.confirmPassword.length > 0 &&
    form.confirmPassword === form.newPassword;

  const handleChange = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (field === "newPassword") setTouched(true);
    setErrors((e) => ({ ...e, [field]: null }));
  };

  const mutation = useMutation({
    mutationFn: (data) => authService.changePassword(data),
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTouched(false);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Đổi mật khẩu thất bại!";
      toast.error(msg);
      setErrors({ oldPassword: msg });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.oldPassword)
      newErrors.oldPassword = "Vui lòng nhập mật khẩu hiện tại";
    if (!isStrongEnough)
      newErrors.newPassword = "Mật khẩu mới chưa đạt đủ các tiêu chí bên dưới";
    if (form.newPassword !== form.confirmPassword)
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setTouched(true);
      return;
    }
    mutation.mutate({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });
  };

  const strengthMeta = [
    { label: "", color: "var(--border)" },
    { label: "Yếu", color: "#e05c5c" },
    { label: "Trung Bình", color: "#e0a840" },
    { label: "Tốt", color: "var(--sage)" },
    { label: "Mạnh", color: "var(--gold)" },
  ][strength];

  const canSubmit =
    !mutation.isPending &&
    form.oldPassword.length > 0 &&
    isStrongEnough &&
    confirmMatches;

  return (
    <div>
      <SectionHeader
        chapter="III"
        eyebrow="Bảo Mật Tài Khoản"
        title="Bảo Mật"
        emphasis="Tài Khoản"
        sub="Quản lý mật khẩu và các tùy chọn bảo mật đăng nhập"
      />

      <div className="pf-security-layout">
        <div className="pf-security-form-card">
          <div
            style={{
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div className="pf-lock-icon-wrap">{Icon.lock}</div>
            <h3 className="pf-security-title">Đổi Mật Khẩu</h3>
          </div>
          <p className="pf-security-sub">
            Sử dụng mật khẩu mạnh mà bạn chưa từng dùng ở nơi khác để bảo vệ tài
            khoản tốt nhất.
          </p>

          <form onSubmit={handleSubmit} className="pf-pw-form">
            <PasswordField
              label="Mật Khẩu Hiện Tại"
              value={form.oldPassword}
              onChange={(v) => handleChange("oldPassword", v)}
              show={showPw.old}
              toggle={() => setShowPw((s) => ({ ...s, old: !s.old }))}
              error={errors.oldPassword}
              placeholder="Nhập mật khẩu hiện tại"
            />

            <div>
              <PasswordField
                label="Mật Khẩu Mới"
                value={form.newPassword}
                onChange={(v) => handleChange("newPassword", v)}
                show={showPw.new}
                toggle={() => setShowPw((s) => ({ ...s, new: !s.new }))}
                error={errors.newPassword}
                placeholder="8–16 ký tự, chữ hoa, ký tự đặc biệt"
              />
              {touched && form.newPassword && (
                <div className="pf-strength-zone">
                  <div className="pf-strength-bar">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`pf-strength-seg ${i < strength ? "is-filled" : ""}`}
                        style={{
                          background:
                            i < strength ? strengthMeta.color : "var(--border)",
                          transitionDelay: `${i * 0.05}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div
                    className="pf-strength-label"
                    style={{ color: strengthMeta.color }}
                  >
                    {strengthMeta.label}
                  </div>
                </div>
              )}
              <div className="pf-pw-checklist">
                {checksResult.map((c) => (
                  <div
                    key={c.key}
                    className={`pf-pw-check-item ${c.ok ? "met" : ""}`}
                  >
                    <span className="pf-pw-dot">
                      {c.ok ? Icon.checkSm : ""}
                    </span>
                    {c.label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <PasswordField
                label="Xác Nhận Mật Khẩu Mới"
                value={form.confirmPassword}
                onChange={(v) => handleChange("confirmPassword", v)}
                show={showPw.confirm}
                toggle={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                error={errors.confirmPassword}
                placeholder="Nhập lại mật khẩu mới"
              />
              {form.confirmPassword && (
                <div
                  className={`pf-pw-check-item ${confirmMatches ? "met" : ""}`}
                  style={{ marginTop: "8px" }}
                >
                  <span className="pf-pw-dot">
                    {confirmMatches ? Icon.checkSm : ""}
                  </span>
                  Khớp với mật khẩu mới
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="pf-btn-tactile pf-btn-shine pf-pw-submit"
            >
              {mutation.isPending ? (
                "Đang Xử Lý..."
              ) : (
                <>Cập Nhật Mật Khẩu {Icon.arrowRight}</>
              )}
            </button>
          </form>
        </div>

        <div className="pf-tips-card">
          <div className="pf-tips-glow" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <div className="pf-lock-icon-wrap">{Icon.shield}</div>
              <span className="pf-tips-eyebrow">Mẹo Bảo Mật</span>
            </div>
            {[
              "Sử dụng 8–16 ký tự, kết hợp chữ hoa, chữ thường và ký tự đặc biệt để tăng độ an toàn.",
              "Tránh dùng lại mật khẩu đã sử dụng cho các trang web hoặc dịch vụ khác.",
              "Không đặt mật khẩu chứa thông tin cá nhân dễ đoán như họ tên, ngày sinh hay số điện thoại.",
              "Không chia sẻ mật khẩu qua email, tin nhắn hoặc bất kỳ kênh liên lạc nào khác.",
              "Nên thay đổi mật khẩu định kỳ mỗi 3–6 tháng để duy trì mức độ bảo mật tốt nhất.",
              "Earthoria sẽ không bao giờ chủ động yêu cầu bạn cung cấp mật khẩu qua bất kỳ hình thức nào.",
            ].map((tip, i, arr) => (
              <div
                key={i}
                className="pf-tip-row"
                style={{ marginBottom: i < arr.length - 1 ? "18px" : 0 }}
              >
                <span className="pf-tip-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  toggle,
  error,
  placeholder,
}) {
  return (
    <div>
      <label className="pf-pw-label">{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pf-pw-input ${error ? "has-error" : ""}`}
        />
        <button
          type="button"
          onClick={toggle}
          className="pf-btn-tactile pf-pw-toggle"
        >
          {show ? Icon.eyeOff : Icon.eye}
        </button>
      </div>
      {error && <div className="pf-field-error">{error}</div>}
    </div>
  );
}

// ════════════════════════ ADDRESSES TAB ════════════════════════
const EMPTY_ADDR_FORM = {
  name: "",
  phone: "",
  street: "",
  provinceCode: "",
  provinceName: "",
  wardCode: "",
  wardName: "",
  isDefault: false,
};

// ─ Autocomplete combobox for Province / Ward (step-by-step) ─
// Type to filter, click or arrow+Enter to select. `disabled` locks the field
// until its prerequisite (province) is chosen — enforces the step order.
function LocationCombobox({
  label,
  placeholder,
  value,
  options,
  loading,
  disabled,
  disabledHint,
  onSelect,
}) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
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
    <div className="pf-form-input-wrap pf-combobox" ref={wrapRef}>
      <label>{label}</label>
      <div className="pf-combobox-inner">
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
        />
        {loading && <span className="pf-combobox-spinner" />}
        {!loading && value && (
          <span className="pf-combobox-check">{Icon.checkSm}</span>
        )}
      </div>
      {open && !disabled && (
        <div className="pf-combobox-dropdown">
          {filtered.length === 0 ? (
            <div className="pf-combobox-empty">Không tìm thấy kết quả</div>
          ) : (
            filtered.slice(0, 60).map((opt, i) => (
              <div
                key={opt.code}
                className={`pf-combobox-option ${i === highlight ? "is-highlight" : ""} ${opt.name === value ? "is-selected" : ""}`}
                onMouseDown={() => handleSelect(opt)}
                onMouseEnter={() => setHighlight(i)}
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

function stripDiacritics(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

// ─ Hook: fetch + cache the 34-province list (new 2-tier model) ─
function useProvinces() {
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch("https://provinces.open-api.vn/api/v2/p/")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProvinces((data || []).map((p) => ({ code: p.code, name: p.name })));
      })
      .catch(() => {
        if (!cancelled)
          toast.error("Không tải được danh sách tỉnh/thành, vui lòng thử lại");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { provinces, loading };
}

// ─ Hook: fetch wards for a given province code ─
function useWards(provinceCode) {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = (data?.wards || []).map((w) => ({
          code: w.code,
          name: w.name,
        }));
        setWards(list);
      })
      .catch(() => {
        if (!cancelled)
          toast.error("Không tải được danh sách phường/xã, vui lòng thử lại");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provinceCode]);
  return { wards, loading };
}

function AddressesTab({ profile, confirm }) {
  const storageKey = `earthoria_addresses_${profile.id || profile.email || "guest"}`;

  const [addresses, setAddresses] = useState(() => {
    try {
      const saved =
        typeof window !== "undefined"
          ? window.localStorage.getItem(storageKey)
          : null;
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore malformed cache */
    }
    return profile.addresses || [];
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ADDR_FORM);

  const { provinces, loading: provincesLoading } = useProvinces();
  const { wards, loading: wardsLoading } = useWards(form.provinceCode);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(addresses));
    } catch {
      /* storage unavailable */
    }
  }, [addresses, storageKey]);

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_ADDR_FORM);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_ADDR_FORM);
  };
  const openEditForm = (addr) => {
    setEditingId(addr.id);
    setForm({
      name: addr.name,
      phone: addr.phone,
      street: addr.street,
      provinceCode: addr.provinceCode || "",
      provinceName: addr.provinceName || addr.city || "",
      wardCode: addr.wardCode || "",
      wardName: addr.wardName || addr.ward || "",
      isDefault: !!addr.isDefault,
    });
    setShowForm(true);
  };

  const selectProvince = (opt) => {
    setForm((f) => ({
      ...f,
      provinceCode: opt ? opt.code : "",
      provinceName: opt ? opt.name : "",
      // Changing province invalidates whatever ward was chosen for the old province.
      wardCode: "",
      wardName: "",
    }));
  };
  const selectWard = (opt) => {
    setForm((f) => ({
      ...f,
      wardCode: opt ? opt.code : "",
      wardName: opt ? opt.name : "",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.provinceCode || !form.wardCode) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/Thành và Phường/Xã");
      return;
    }
    if (editingId) {
      setAddresses((a) =>
        a.map((x) => {
          if (x.id === editingId) return { ...x, ...form };
          return form.isDefault ? { ...x, isDefault: false } : x;
        }),
      );
      toast.success("Đã cập nhật địa chỉ");
    } else {
      const newAddr = { ...form, id: Date.now() };
      setAddresses((a) =>
        form.isDefault
          ? [newAddr, ...a.map((x) => ({ ...x, isDefault: false }))]
          : [...a, newAddr],
      );
      toast.success("Đã thêm địa chỉ mới!");
    }
    closeForm();
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Xóa Địa Chỉ Này?",
      message:
        "Địa chỉ sẽ bị xóa khỏi sổ địa chỉ giao hàng của bạn. Hành động này không thể hoàn tác.",
      confirmLabel: "Xóa Địa Chỉ",
      cancelLabel: "Giữ Lại",
      danger: true,
    });
    if (!ok) return;
    setAddresses((a) => a.filter((x) => x.id !== id));
    toast.success("Đã xóa địa chỉ");
  };

  const setDefault = (id) => {
    setAddresses((a) => a.map((x) => ({ ...x, isDefault: x.id === id })));
    toast.success("Đã đặt làm địa chỉ mặc định");
  };

  return (
    <div>
      <SectionHeader
        chapter="IV"
        eyebrow="Quản Lý Giao Hàng"
        title="Sổ Địa Chỉ"
        emphasis="Giao Hàng"
        sub="Quản lý các địa chỉ nhận hàng của bạn — theo đơn vị hành chính 2 cấp mới nhất"
      />

      <button
        onClick={() => (showForm ? closeForm() : openAddForm())}
        className={`pf-btn-tactile pf-btn-shine pf-add-addr-btn ${showForm ? "is-cancel" : ""}`}
      >
        {showForm ? "Hủy" : <>{Icon.plus} Thêm Địa Chỉ Mới</>}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="pf-addr-form">
          {editingId && (
            <div className="pf-addr-form-editing">Đang chỉnh sửa địa chỉ</div>
          )}
          <div className="pf-form-row-2">
            <FormInput
              label="Họ và tên người nhận"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              required
            />
            <FormInput
              label="Số điện thoại"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              required
            />
          </div>
          <FormInput
            label="Địa chỉ cụ thể (số nhà, đường)"
            value={form.street}
            onChange={(v) => setForm((f) => ({ ...f, street: v }))}
            required
            style={{ marginBottom: "18px" }}
          />

          <div className="pf-step-hint">
            <span className="pf-step-num">1</span> Chọn Tỉnh/Thành phố trước
            <span className="pf-step-arrow">{Icon.arrowRight}</span>
            <span className="pf-step-num">2</span> rồi chọn Phường/Xã
          </div>
          <div className="pf-form-row-2" style={{ marginBottom: "22px" }}>
            <LocationCombobox
              label="Tỉnh/Thành phố"
              placeholder="Gõ để tìm, ví dụ: Cần Thơ"
              value={form.provinceName}
              options={provinces}
              loading={provincesLoading}
              onSelect={selectProvince}
            />
            <LocationCombobox
              label="Phường/Xã"
              placeholder="Gõ để tìm phường/xã"
              disabledHint="Chọn Tỉnh/Thành phố trước"
              value={form.wardName}
              options={wards}
              loading={wardsLoading}
              disabled={!form.provinceCode}
              onSelect={selectWard}
            />
          </div>

          <label className="pf-addr-default-check">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) =>
                setForm((f) => ({ ...f, isDefault: e.target.checked }))
              }
            />
            Đặt làm địa chỉ mặc định
          </label>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="submit"
              className="pf-btn-tactile pf-btn-shine pf-addr-save-btn"
            >
              {editingId ? "Lưu Thay Đổi" : "Lưu Địa Chỉ"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="pf-btn-tactile pf-addr-cancel-btn"
            >
              Hủy Bỏ
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <EmptyState
          icon={Icon.map}
          text="Chưa có địa chỉ giao hàng nào"
          sub="Thêm địa chỉ để quá trình đặt hàng nhanh hơn"
        />
      ) : (
        <div className="pf-addr-grid">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              addr={addr}
              onSetDefault={() => setDefault(addr.id)}
              onEdit={() => openEditForm(addr)}
              onDelete={() => handleDelete(addr.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddressCard({ addr, onSetDefault, onEdit, onDelete }) {
  const sheen = useSheen();
  return (
    <div
      ref={sheen.ref}
      onMouseMove={sheen.onMouseMove}
      onMouseEnter={sheen.onMouseEnter}
      onMouseLeave={sheen.onMouseLeave}
      className="pf-addr-card pf-sheen-surface"
      style={{ borderColor: addr.isDefault ? "var(--gold)" : "var(--border)" }}
    >
      <span className="pf-sheen-glow" aria-hidden="true" />
      {addr.isDefault && (
        <span className="pf-addr-default-badge">Mặc Định</span>
      )}
      <div className="pf-addr-name">{addr.name}</div>
      <div className="pf-addr-phone">{addr.phone}</div>
      <div className="pf-addr-text">
        {addr.street}, {addr.wardName || addr.ward},{" "}
        {addr.provinceName || addr.city}
      </div>
      <div className="pf-addr-actions">
        {!addr.isDefault && (
          <button
            onClick={onSetDefault}
            className="pf-btn-tactile pf-addr-action-gold"
          >
            Đặt Mặc Định
          </button>
        )}
        <button onClick={onEdit} className="pf-btn-tactile pf-addr-action">
          {Icon.edit} Sửa
        </button>
        <button onClick={onDelete} className="pf-btn-tactile pf-addr-action">
          {Icon.trash} Xóa
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB: SÁCH AR CỦA TÔI
   Chỉ liệt kê ArCode thuộc sách đã mua + đơn DELIVERED (backend đã lọc
   sẵn qua endpoint /ar/my-books) — không cần lọc lại ở frontend.
   Bấm vào 1 mục sẽ đi thẳng tới /ar/:slug/:code để xem mô hình 3D,
   không cần quét lại QR giấy.
══════════════════════════════════════════════ */
function ParentDashboardBanner() {
  return (
    <Link to="/parent-dashboard" className="pkd-cta-banner">
      <div className="pkd-cta-icon">{Icon.family}</div>
      <div className="pkd-cta-text">
        <div className="pkd-cta-title">Bảng điều khiển phụ huynh</div>
        <div className="pkd-cta-desc">
          Đặt giới hạn giờ xem, bật quy tắc 20-20-20 và khóa AR từ xa cho con
          bạn.
        </div>
      </div>
      <span className="pkd-cta-btn">Mở dashboard {Icon.arrowRight}</span>
    </Link>
  );
}

function ArTab({ arCodes, loading }) {
  if (loading) {
    return (
      <div>
        <SectionHeader
          chapter="V"
          eyebrow="Trải Nghiệm AR"
          title="Sách"
          emphasis="AR Của Tôi"
          sub="Toàn bộ mô hình 3D thuộc các cuốn sách bạn đã mua và nhận hàng"
          logo="/logo/logo-mau/lg-m-family-studio.png"
        />
        <ParentDashboardBanner />
        <div
          style={{
            padding: 48,
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Đang tải...
        </div>
      </div>
    );
  }

  if (!arCodes.length) {
    return (
      <div>
        <SectionHeader
          chapter="V"
          eyebrow="Trải Nghiệm AR"
          title="Sách"
          emphasis="AR Của Tôi"
          sub="Toàn bộ mô hình 3D thuộc các cuốn sách bạn đã mua và nhận hàng"
          logo="/logo/logo-mau/lg-m-family-studio.png"
        />
        <ParentDashboardBanner />
        <EmptyState
          icon={Icon.compass}
          text="Chưa có sách AR nào"
          sub="Mua sách có AR và chờ giao hàng thành công để mở khoá mô hình 3D tại đây"
        />
      </div>
    );
  }

  // Gom các mã AR theo từng cuốn sách để hiển thị thành từng nhóm,
  // tránh trộn lẫn khi khách sở hữu nhiều sách AR cùng lúc.
  const grouped = arCodes.reduce((acc, item) => {
    const key = item.book?.id || item.bookId;
    if (!acc[key]) acc[key] = { book: item.book, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  return (
    <div>
      <SectionHeader
        chapter="V"
        eyebrow="Trải Nghiệm AR"
        title="Sách"
        emphasis="AR Của Tôi"
        sub="Toàn bộ mô hình 3D thuộc các cuốn sách bạn đã mua và nhận hàng"
      />
      <ParentDashboardBanner />

      <div className="pf-ar-book-grid">
        {Object.values(grouped).map((group) => {
          const total = group.items.length;
          const activatedCount = group.items.filter(
            (it) => (it.scanCount || 0) > 0,
          ).length;
          const allActivated = total > 0 && activatedCount === total;
          const noneActivated = activatedCount === 0;

          return (
            <div key={group.book?.id} className="pf-ar-book-card">
              <div className="pf-ar-book-cover">
                {group.book?.coverImage ? (
                  <img
                    src={group.book.coverImage}
                    alt={group.book?.title || ""}
                  />
                ) : (
                  <span className="pf-ar-book-cover-fallback">
                    {Icon.compass}
                  </span>
                )}
              </div>
              <div className="pf-ar-book-info">
                <div className="pf-ar-book-title">{group.book?.title}</div>
                <span
                  className={`pf-ar-status ${allActivated ? "is-activated" : noneActivated ? "is-pending" : "is-partial"}`}
                >
                  {allActivated
                    ? "Đã kích hoạt"
                    : noneActivated
                      ? "Chưa kích hoạt"
                      : `Đã kích hoạt ${activatedCount}/${total}`}
                </span>

                <div className="pf-ar-code-list">
                  {group.items.map((item) => {
                    const isActivated = (item.scanCount || 0) > 0;
                    return (
                      <Link
                        key={item.id}
                        to={`/ar/${group.book?.slug}/${item.code}`}
                        className={`pf-ar-code-chip ${isActivated ? "is-activated" : ""}`}
                        title={
                          isActivated
                            ? `Đã xem ${item.scanCount} lần · Bấm để xem lại`
                            : "Bấm để kích hoạt & xem mô hình 3D"
                        }
                      >
                        <span className="pf-ar-code-dot" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("earthoria-theme") === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem("earthoria-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    // Chỉ đồng bộ theo hệ điều hành nếu đây là lần đầu tiên vào web
    // (chưa từng lưu theme nào). Nếu đã có giá trị lưu rồi (kể cả mặc định
    // "light" ban đầu), tuyệt đối không ghi đè nữa mỗi khi tab này mount lại.
    const hasStoredTheme = localStorage.getItem("earthoria-theme") !== null;
    if (hasStoredTheme) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const onChange = (e) => setIsDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => setIsDark((v) => !v);

  return { isDark, toggle };
}

function useCookiePrefs() {
  const [consent, setConsent] = useState(() =>
    typeof window !== "undefined" && window.EarthoriaCookies
      ? window.EarthoriaCookies.getConsent()
      : null,
  );

  useEffect(() => {
    // Nếu module tải chậm hơn React, chủ động kiểm tra lại vài lần
    if (!window.EarthoriaCookies) {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if (window.EarthoriaCookies) {
          setConsent(window.EarthoriaCookies.getConsent());
          clearInterval(timer);
        } else if (attempts >= 10) {
          clearInterval(timer);
        }
      }, 200);
      return () => clearInterval(timer);
    }
  }, []);

  useEffect(() => {
    const onUpdate = (e) =>
      setConsent({ choices: e.detail.choices, timestamp: e.detail.timestamp });
    document.addEventListener("earthoria:cookie-consent", onUpdate);
    return () =>
      document.removeEventListener("earthoria:cookie-consent", onUpdate);
  }, []);

  return consent;
}

const COOKIE_GROUP_LABELS = {
  essential: {
    title: "Cookie thiết yếu",
    desc: "Đăng nhập, giỏ hàng, bảo mật phiên - luôn bật.",
  },
  analytics: {
    title: "Cookie phân tích",
    desc: "Giúp cải thiện trải nghiệm dựa trên hành vi sử dụng.",
  },
  marketing: {
    title: "Cookie tiếp thị",
    desc: "Cá nhân hoá quảng cáo và đo lường chiến dịch.",
  },
  functional: {
    title: "Cookie chức năng",
    desc: "Ghi nhớ chế độ hiển thị, ngôn ngữ...",
  },
};

function SettingsTab() {
  const { isDark, toggle } = useTheme();
  const consent = useCookiePrefs();
  const [expandedChangelog, setExpandedChangelog] = useState(false);

  const openCookieSettings = () => {
    if (window.EarthoriaCookies) {
      window.EarthoriaCookies.openSettings();
      return;
    }
    // Script có thể vẫn đang tải — thử lại vài lần trước khi báo lỗi hẳn
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (window.EarthoriaCookies) {
        clearInterval(timer);
        window.EarthoriaCookies.openSettings();
      } else if (attempts >= 10) {
        clearInterval(timer);
        toast.error(
          "Chưa tải được module Cookie. Vui lòng tải lại trang (F5) rồi thử lại.",
        );
      }
    }, 200);
  };

  const visibleLogs = expandedChangelog
    ? SYSTEM_INFO.changelog
    : SYSTEM_INFO.changelog.slice(0, 3);

  return (
    <div>
      <SectionHeader
        chapter="VI"
        eyebrow="Tuỳ Chỉnh Hệ Thống"
        title="Cài Đặt"
        emphasis="Hệ Thống"
        sub="Thông tin phiên bản, giao diện hiển thị và quyền riêng tư cookie"
      />

      <div className="pf-settings-card">
        <div className="pf-settings-card-head">
          <div className="pf-lock-icon-wrap">{Icon.seal}</div>
          <div>
            <h3 className="pf-settings-card-title">Thông Tin Hệ Thống</h3>
            <p className="pf-settings-card-sub">
              Phiên bản hiện tại và môi trường đang chạy
            </p>
          </div>
        </div>
        <div className="pf-settings-info-grid">
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Tên website</span>
            <span className="pf-settings-info-val">{SYSTEM_INFO.siteName}</span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Phiên bản</span>
            <span className="pf-settings-info-val pf-mono">
              {SYSTEM_INFO.version}
            </span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Ngày phát hành</span>
            <span className="pf-settings-info-val">
              {SYSTEM_INFO.releaseDate}
            </span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Môi trường</span>
            <span className="pf-settings-info-val">
              <span className="pf-env-badge">{SYSTEM_INFO.environment}</span>
            </span>
          </div>
        </div>

        <div className="pf-changelog-head">
          <span>Lịch Sử Cập Nhật</span>
          {SYSTEM_INFO.changelog.length > 3 && (
            <button
              type="button"
              className="pf-btn-tactile pf-changelog-toggle"
              onClick={() => setExpandedChangelog((v) => !v)}
            >
              {expandedChangelog ? "Thu gọn" : "Xem tất cả"}
            </button>
          )}
        </div>
        <div className="pf-changelog-list">
          {visibleLogs.map((log) => (
            <div key={log.version} className="pf-changelog-item">
              <div className="pf-changelog-dot" />
              <div className="pf-changelog-body">
                <div className="pf-changelog-meta">
                  <span className="pf-mono">{log.version}</span>
                  <span className="pf-changelog-date">{log.date}</span>
                </div>
                <p className="pf-changelog-note">{log.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pf-settings-card">
        <div className="pf-settings-card-head">
          <div className="pf-lock-icon-wrap">
            {isDark ? Icon.moon : Icon.sun}
          </div>
          <div>
            <h3 className="pf-settings-card-title">Giao Diện Hiển Thị</h3>
            <p className="pf-settings-card-sub">
              Chọn chế độ sáng, tối để phù hợp với mắt bạn
            </p>
          </div>
        </div>

        <div className="pf-theme-row">
          <div>
            <div className="pf-theme-row-title">Chế độ tối</div>
            <div className="pf-theme-row-desc">
              {isDark
                ? "Đang bật - giao diện tối, dịu mắt hơn vào ban đêm"
                : "Đang tắt - giao diện sáng mặc định"}
            </div>
          </div>
          <label className="pf-switch">
            <input type="checkbox" checked={isDark} onChange={toggle} />
            <span className="pf-switch-track">
              <span className="pf-switch-thumb">
                {isDark ? Icon.moon : Icon.sun}
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="pf-settings-card">
        <div className="pf-settings-card-head">
          <div className="pf-lock-icon-wrap">{Icon.cookie}</div>
          <div>
            <h3 className="pf-settings-card-title">
              Quyền Riêng Tư &amp; Cookie
            </h3>
            <p className="pf-settings-card-sub">
              Quản lý các nhóm cookie đang được sử dụng trên trình duyệt của bạn
            </p>
          </div>
        </div>

        {consent?.choices ? (
          <div className="pf-cookie-groups">
            {Object.entries(COOKIE_GROUP_LABELS).map(([key, meta]) => {
              const active = !!consent.choices[key];
              const locked = key === "essential";
              return (
                <div key={key} className="pf-cookie-group-row">
                  <div>
                    <div className="pf-cookie-group-title">
                      {meta.title}
                      {locked && (
                        <span className="pf-cookie-locked-tag">
                          {Icon.lock} Luôn bật
                        </span>
                      )}
                    </div>
                    <div className="pf-cookie-group-desc">{meta.desc}</div>
                  </div>
                  <span
                    className={`pf-cookie-status-dot ${active ? "on" : "off"}`}
                  >
                    {active ? "Đang bật" : "Đang tắt"}
                  </span>
                </div>
              );
            })}
            {consent.timestamp && (
              <div className="pf-cookie-updated-at">
                Cập nhật lần cuối: {formatDate(consent.timestamp)}
              </div>
            )}
          </div>
        ) : (
          <p className="pf-settings-card-sub" style={{ marginBottom: 20 }}>
            Bạn chưa thiết lập tuỳ chọn cookie trên thiết bị này.
          </p>
        )}

        <button
          type="button"
          onClick={openCookieSettings}
          className="pf-btn-tactile pf-btn-shine pf-cookie-manage-btn"
        >
          {Icon.settings} Quản Lý Cài Đặt Cookie
        </button>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, required, style }) {
  return (
    <div style={style} className="pf-form-input-wrap">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

// ════════════════════════ SHARED COMPONENTS ════════════════════════
function SectionHeader({ chapter, eyebrow, title, emphasis, sub, logo }) {
  return (
    <div className="pf-section-header">
      {logo && (
        <div
          className="pf-section-logo-wrap"
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: "#0f2318",
              borderRadius: 14,
              padding: "14px 28px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={logo}
              alt=""
              className="pf-section-logo"
              style={{ height: 32, width: "auto", display: "block" }}
            />
          </div>
        </div>
      )}
      <div className="pf-section-chapter">Chương {chapter}</div>
      <div className="pf-section-eyebrow-row">
        <span className="pf-section-eyebrow-line" />
        <span className="pf-section-eyebrow-text">{eyebrow}</span>
      </div>
      <h2 className="pf-section-title">
        {title} <em>{emphasis}</em>
      </h2>
      <p className="pf-section-sub">{sub}</p>
    </div>
  );
}

function EmptyState({ icon, text, sub }) {
  return (
    <div className="pf-empty-state">
      <div className="pf-empty-icon-wrap">{icon}</div>
      <p className="pf-empty-text">{text}</p>
      {sub && <p className="pf-empty-sub">{sub}</p>}
    </div>
  );
}
