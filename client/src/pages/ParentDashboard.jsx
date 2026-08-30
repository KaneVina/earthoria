import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Clock,
  Timer,
  Eye,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Bell,
  BookOpen,
  Sparkles,
  Sun,
  Moon,
  RefreshCcw,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  AlertTriangle,
  Plus,
  Minus,
  CalendarClock,
  Loader2,
  ArrowLeft,
  Info,
  TrendingUp,
  TrendingDown,
  Minus as MinusIcon,
  History,
  Wifi,
  WifiOff,
  Settings2,
  UserPlus,
  Trash2,
  BookMarked,
  Smile,
  UserCog,
  Users,
  ArrowRight,
  Crown,
} from "lucide-react";

import "../components/assets/css/profile.css";
import "../components/assets/css/parentDashboard.css";
import { useAuthStore } from "../store/authStore";
import { childService } from "../services/childService";
import { parentPinService } from "../services/parentPinService";
import CreateChildWizard from "../components/parent/CreateChildWizard";
import FullScreenLoader from "../components/FullScreenLoader";
import KidLinkCard from "../components/parent/KidLinkCard";
import DeleteChildModal from "../components/parent/DeleteChildModal";

const WEEK_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
// Chủ nhật (0) xuống cuối mảng (index 6).
const TODAY_INDEX = (new Date().getDay() + 6) % 7;

const AUDIT_TYPE_MAP = {
  LOCK: "lock",
  UNLOCK: "unlock",
  SETTINGS_UPDATE: "settings",
  BOOK_VISIBILITY: "settings",
  CHILD_CREATED: "settings",
  CHILD_UPDATED: "settings",
  CHILD_ARCHIVED: "settings",
  PARENT_PIN_SET: "settings",
  PARENT_PIN_CHANGED: "settings",
  PARENT_PIN_RESET: "settings",
};

function formatRelativeTime(iso) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)
    return `Hôm nay, ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  const diffDays = Math.floor(diffH / 24);
  if (diffDays === 1)
    return `Hôm qua, ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

const EYE_TIPS = [
  { Icon: Timer, text: "Giữ màn hình cách mắt 50–70cm nhé!" },
  {
    Icon: Eye,
    text: "Đặt màn hình hơi thấp hơn tầm mắt một chút sẽ đỡ mỏi cổ hơn đó",
  },
  {
    Icon: Sun,
    text: "Phòng tối quá? Bật thêm đèn để mắt đỡ phải điều tiết nhiều",
  },
  {
    Icon: Sparkles,
    text: "Màn hình đang chói không? Thử giảm độ sáng hoặc đổi góc ngồi xem",
  },
  {
    Icon: Moon,
    text: "Đã tối rồi, bật chế độ lọc ánh sáng xanh cho dễ chịu hơn nhé",
  },
];

const DEFAULT_SETTINGS = {
  dailyLimitMinutes: 60,
  ruleEnabled: true,
  ruleIntervalMinutes: 20,
  ruleRestSeconds: 20,
  allowWindowEnabled: true,
  allowStart: "07:00",
  allowEnd: "20:30",
  mandatoryBreakEnabled: true,
  breakAfterMinutes: 45,
  breakDurationMinutes: 10,
  tipsEnabled: true,
  tipsFrequency: "rest", // 'open' | 'interval' | 'rest'
  notifyPush: true,
  notifyEmail: false,
  notifyOnLimitExceeded: true,
  notifyOnSkippedRest: true,
};

const SECTIONS = [
  { id: "overview", label: "Tổng quan" },
  { id: "time-rules", label: "Giờ giấc" },
  { id: "reports", label: "Báo cáo" },
  { id: "books", label: "Sách của bé" },
  { id: "eye-care", label: "Bảo vệ mắt" },
];

const MAX_PIN_ATTEMPTS = 5;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m} phút`;
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

// "07:30" → số phút kể từ 00:00, dùng để tính vị trí % trên dải 24h
function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function Stepper({
  value,
  onChange,
  min = 5,
  max = 240,
  step = 5,
  suffix = "phút",
}) {
  return (
    <div className="pkd-stepper">
      <button
        type="button"
        className="pkd-stepper-btn"
        onClick={() => onChange(clamp(value - step, min, max))}
        aria-label="Giảm"
      >
        <Minus size={14} />
      </button>
      <span className="pkd-stepper-val">
        {value} <em>{suffix}</em>
      </span>
      <button
        type="button"
        className="pkd-stepper-btn"
        onClick={() => onChange(clamp(value + step, min, max))}
        aria-label="Tăng"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function SwitchRow({ icon, title, desc, checked, onChange }) {
  return (
    <div className="pkd-switch-row">
      <div className="pkd-switch-row-text">
        <div className="pkd-switch-row-title">
          {icon && <span className="pkd-switch-row-icon">{icon}</span>}
          {title}
        </div>
        {desc && <div className="pkd-switch-row-desc">{desc}</div>}
      </div>
      <label className="pf-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="pf-switch-track">
          <span className="pf-switch-thumb" />
        </span>
      </label>
    </div>
  );
}

// Băng thông báo giới hạn hồ sơ trẻ em theo hạng thành viên — hiển thị
// "X/Y tài khoản trẻ" + gợi ý lên hạng tiếp theo ("sắp mở khóa"), kèm nút
// "Xem thêm" dẫn sang trang /loyalty. Dùng chung dữ liệu trả về từ
// GET /children (field childLimit) nên không cần gọi thêm API nào.
function ChildLimitBanner({ childLimit }) {
  if (!childLimit) return null;
  const { current, max, isMaxTier, tierRoman, nextMax } = childLimit;
  const isFull = current >= max;

  return (
    <div
      className={`pkd-child-limit-banner ${isFull && !isMaxTier ? "is-full" : ""} ${isMaxTier ? "is-max" : ""}`}
    >
      <div className="pkd-child-limit-row">
        <span className="pkd-child-limit-count">
          👨‍👩‍👧‍👦 <strong>{current}/{max}</strong> tài khoản trẻ
        </span>
        <span className="pkd-child-limit-tier">Hạng {tierRoman}</span>
      </div>
      <p className="pkd-child-limit-sub">
        {isMaxTier ? (
          <>
            <Crown size={12} /> Hạng cao nhất — đã mở khóa toàn bộ {max} tài khoản trẻ.
          </>
        ) : isFull ? (
          <>
            <Lock size={12} /> Đã đạt giới hạn Hạng {tierRoman}. Còn 1 hạng nữa để mở khóa{" "}
            <strong>{nextMax}</strong> tài khoản trẻ.
          </>
        ) : (
          <>
            <Sparkles size={12} /> Còn 1 hạng nữa để mở khóa <strong>{nextMax}</strong> tài khoản
            trẻ.
          </>
        )}
      </p>
      {!isMaxTier && (
        <Link to="/loyalty" className="pkd-child-limit-link">
          Xem thêm <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}

function ModalShell({ onClose, children, wide }) {
  // Đóng bằng phím Esc hành vi chuẩn cho mọi hộp thoại
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="pf-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`pf-confirm pkd-modal ${wide ? "pkd-modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

// Card bao ngoài gắn class .reveal tự thêm "in" khi cuộn tới, tái dùng
// animation .reveal/.reveal.in đã có sẵn trong main.css.
function RevealCard({
  as: Tag = "div",
  className = "",
  delay,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? "in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/*   ═ MAIN COMPONENT   ═ */

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [activeChildId, setActiveChildId] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [pillsStuck, setPillsStuck] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [hasPin, setHasPin] = useState(true); // mặc định true để tránh nháy UI trước khi biết chắc
  // Giới hạn số hồ sơ trẻ em theo hạng thành viên hiện tại — { current, max,
  // isMaxTier, tierRoman, tierName, nextTierRoman, nextTierName, nextMax }.
  // Trả về cùng payload với GET /children, tránh phải gọi thêm API /loyalty/me.
  const [childLimit, setChildLimit] = useState(null);

  const [dashboard, setDashboard] = useState(null); // { child, todayMinutes, weeklyMinutes, sessions, auditLog }
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);

  const loadChildren = useCallback(async () => {
    setChildrenLoading(true);
    try {
      const res = await childService.list();
      const list = res.data.data.children;
      setChildren(list);
      setChildLimit(res.data.data.childLimit ?? null);
      setActiveChildId((prev) =>
        prev && list.some((c) => c.id === prev) ? prev : (list[0]?.id ?? null),
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể tải danh sách hồ sơ trẻ em",
      );
    } finally {
      setChildrenLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChildren();
    parentPinService
      .status()
      .then((res) => setHasPin(!!res.data.data.hasPin))
      .catch(() => {});
  }, [loadChildren]);

  const dashboardReqId = useRef(0);
  const loadDashboard = useCallback(async (childId) => {
    if (!childId) return;
    const reqId = ++dashboardReqId.current;
    setDashboardLoading(true);
    try {
      const res = await childService.getDashboard(childId);
      if (reqId !== dashboardReqId.current) return; // đã có request mới hơn, bỏ kết quả cũ
      setDashboard(res.data.data);
    } catch (err) {
      if (reqId !== dashboardReqId.current) return;
      toast.error(
        err.response?.data?.message || "Không thể tải dữ liệu bảng điều khiển",
      );
    } finally {
      if (reqId === dashboardReqId.current) setDashboardLoading(false);
    }
  }, []);

  const loadBooks = useCallback(async (childId) => {
    if (!childId) return;
    setBooksLoading(true);
    try {
      const res = await childService.getBooks(childId);
      setBooks(res.data.data.books);
    } catch (err) {
      // Im lặng: không để lỗi tải sách chặn phần còn lại của dashboard
    } finally {
      setBooksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeChildId) {
      loadDashboard(activeChildId);
      loadBooks(activeChildId);
    } else {
      setDashboard(null);
      setBooks([]);
    }
  }, [activeChildId, loadDashboard, loadBooks]);

  const handleChildCreated = (child) => {
    setChildren((prev) => [...prev, { ...child, todayMinutes: 0 }]);
    setActiveChildId(child.id);
    // Cập nhật lạc quan số hồ sơ hiện có ngay lập tức — tránh banner giới
    // hạn hiển thị số liệu cũ trong lúc chờ lần load tiếp theo.
    setChildLimit((prev) => (prev ? { ...prev, current: prev.current + 1 } : prev));
  };

  const toggleBookVisibility = async (bookId, visible) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, visible } : b)),
    );
    try {
      await childService.setBookVisibility(activeChildId, bookId, visible);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể cập nhật hiển thị sách",
      );
      loadBooks(activeChildId);
    }
  };

  const activeChild = dashboard?.child ?? null;
  const settings = activeChild ?? DEFAULT_SETTINGS;
  // Nguồn dự phòng cho avatar: danh sách bé ở sidebar luôn có avatarEmoji/
  // avatarColor, phòng khi payload dashboard không kèm 2 trường này.
  const activeChildListMeta = children.find((c) => c.id === activeChildId);
  const activeChildAvatarEmoji =
    activeChild?.avatarEmoji ?? activeChildListMeta?.avatarEmoji;
  const activeChildAvatarColor =
    activeChild?.avatarColor ?? activeChildListMeta?.avatarColor;
  const lockState = {
    isLocked: !!activeChild?.isLocked,
    lockedAt: activeChild?.lockedAt ?? null,
  };
  const auditLog = (dashboard?.auditLog ?? []).map((a) => ({
    id: a.id,
    type: AUDIT_TYPE_MAP[a.type] || "settings",
    text: a.text,
    time: formatRelativeTime(a.time),
  }));
  const todayMinutes = dashboard?.todayMinutes ?? 0;
  const weeklyMinutes = dashboard?.weeklyMinutes ?? [0, 0, 0, 0, 0, 0, 0];
  const sessions = (dashboard?.sessions ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    letter: (s.title || "?").trim().charAt(0).toUpperCase() || "?",
    minutes: s.minutes,
    date: formatRelativeTime(s.date),
  }));
  const weekMax = Math.max(
    ...weeklyMinutes,
    settings.dailyLimitMinutes || 60,
    1,
  );
  const weekTotal = weeklyMinutes.reduce((a, b) => a + b, 0);
  const weekAvg = weeklyMinutes.length ? weekTotal / weeklyMinutes.length : 0;

  // Xu hướng hôm nay so với trung bình tuần quy ra badge tăng/giảm
  const trendDeltaPct =
    weekAvg > 0 ? Math.round(((todayMinutes - weekAvg) / weekAvg) * 100) : 0;
  const trendDirection =
    trendDeltaPct <= -5 ? "down" : trendDeltaPct >= 5 ? "up" : "flat";

  /*  Autosave feedback  */
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved
  const saveTimers = useRef({ toSaved: null, toIdle: null });

  const updateSettings = async (patch) => {
    if (!activeChildId) return;
    // Optimistic update để UI mượt, rollback bằng cách tải lại nếu API lỗi
    setDashboard((prev) =>
      prev ? { ...prev, child: { ...prev.child, ...patch } } : prev,
    );
    clearTimeout(saveTimers.current.toSaved);
    clearTimeout(saveTimers.current.toIdle);
    setSaveStatus("saving");
    try {
      await childService.updateSettings(activeChildId, patch);
      setChildren((prev) =>
        prev.map((c) => (c.id === activeChildId ? { ...c, ...patch } : c)),
      );
      saveTimers.current.toSaved = setTimeout(
        () => setSaveStatus("saved"),
        350,
      );
      saveTimers.current.toIdle = setTimeout(() => setSaveStatus("idle"), 2600);
    } catch (err) {
      setSaveStatus("idle");
      toast.error(
        err.response?.data?.message ||
          "Không thể lưu thay đổi, đang tải lại...",
      );
      loadDashboard(activeChildId);
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(saveTimers.current.toSaved);
      clearTimeout(saveTimers.current.toIdle);
    };
  }, []);

  const [allowStartDraft, setAllowStartDraft] = useState(settings.allowStart);
  const [allowEndDraft, setAllowEndDraft] = useState(settings.allowEnd);
  useEffect(() => {
    setAllowStartDraft(settings.allowStart);
    setAllowEndDraft(settings.allowEnd);
  }, [settings.allowStart, settings.allowEnd]);

  const [tipIndex, setTipIndex] = useState(0);
  const [tipCycling, setTipCycling] = useState(false);
  const cycleTip = () => {
    setTipCycling(true);
    setTimeout(() => {
      setTipIndex((i) => (i + 1) % EYE_TIPS.length);
      setTipCycling(false);
    }, 180);
  };

  /*  Lock / unlock  */
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [unlockPinOpen, setUnlockPinOpen] = useState(false);
  /*  Bé đang là mục tiêu của khoá/mở khoá có thể khác activeChild khi
      thao tác trực tiếp từ panel mở rộng trong danh sách chọn bé */
  const [lockTarget, setLockTarget] = useState(null); // { id, name }

  /*  Xoá vĩnh viễn hồ sơ con lưu riêng { id, name } của bé cần xoá,
      để có thể xoá nhanh ngay từ danh sách chọn bé mà không cần đợi
      dashboard của bé đó tải xong (khác activeChild) */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const handleChildDeleted = () => {
    toast.success(`Đã xoá vĩnh viễn hồ sơ của ${deleteTarget?.name}`);
    setDeleteTarget(null);
    loadChildren(); // tải lại danh sách activeChildId sẽ tự chuyển sang bé còn lại (xem loadChildren)
  };

  const requestLock = (child) => {
    setLockTarget(
      child
        ? { id: child.id, name: child.name }
        : activeChild
          ? { id: activeChildId, name: activeChild.name }
          : null,
    );
    setLockConfirmOpen(true);
  };
  const confirmLock = async () => {
    if (!lockTarget) return;
    try {
      const res = await childService.lock(lockTarget.id);
      if (lockTarget.id === activeChildId) {
        setDashboard((prev) =>
          prev ? { ...prev, child: res.data.data.child } : prev,
        );
      }
      setChildren((prev) =>
        prev.map((c) =>
          c.id === lockTarget.id ? { ...c, isLocked: true } : c,
        ),
      );
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể khóa AR");
    } finally {
      setLockConfirmOpen(false);
    }
  };

  const requestUnlock = (child) => {
    setLockTarget(
      child
        ? { id: child.id, name: child.name }
        : activeChild
          ? { id: activeChildId, name: activeChild.name }
          : null,
    );
    setUnlockPinOpen(true);
  };
  // Gọi API thật, xác thực PIN ở server (bcrypt + chống brute-force) —
  // trả về lỗi cụ thể (sai PIN/còn mấy lần thử/đã bị khóa tạm) để hiển thị.
  const confirmUnlock = async (pin) => {
    if (!lockTarget) return;
    const res = await childService.unlock(lockTarget.id, pin);
    if (lockTarget.id === activeChildId) {
      setDashboard((prev) =>
        prev ? { ...prev, child: res.data.data.child } : prev,
      );
    }
    setChildren((prev) =>
      prev.map((c) => (c.id === lockTarget.id ? { ...c, isLocked: false } : c)),
    );
    setUnlockPinOpen(false);
    toast.success(res.data.message);
  };

  /*  PIN change modal  */
  const [pinModal, setPinModal] = useState(null); // null | 'old' | 'otp' | 'new' | 'confirm'
  const [isForgotFlow, setIsForgotFlow] = useState(false);
  const [oldPinDigits, setOldPinDigits] = useState(["", "", "", ""]);
  const [newPinDigits, setNewPinDigits] = useState(["", "", "", ""]);
  const [confirmPinDigits, setConfirmPinDigits] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));
  const [otpSending, setOtpSending] = useState(false);
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState("");
  const otpRefs = useRef([]);
  const oldPinRefs = useRef([]);
  const newPinRefs = useRef([]);
  const confirmPinRefs = useRef([]);

  // Tạo cặp (onChange, onKeyDown) cho 1 bộ 4 ô số PIN dùng chung 1 kiểu
  // component với bước OTP (đã test ổn định) thay vì <input type="password">
  // gốc của trình duyệt (gây lệch dấu chấm/con trỏ khi kết hợp letter-spacing).
  const makePinDigitHandlers = (digits, setDigits, refs) => ({
    onChange: (idx, val) => {
      const digit = val.replace(/[^0-9]/g, "").slice(-1);
      setDigits((prev) => {
        const next = [...prev];
        next[idx] = digit;
        return next;
      });
      if (digit && idx < 3) refs.current[idx + 1]?.focus();
    },
    onKeyDown: (idx, e) => {
      if (e.key === "Backspace" && !digits[idx] && idx > 0) {
        refs.current[idx - 1]?.focus();
      }
    },
  });
  const oldPinHandlers = makePinDigitHandlers(
    oldPinDigits,
    setOldPinDigits,
    oldPinRefs,
  );
  const newPinHandlers = makePinDigitHandlers(
    newPinDigits,
    setNewPinDigits,
    newPinRefs,
  );
  const confirmPinHandlers = makePinDigitHandlers(
    confirmPinDigits,
    setConfirmPinDigits,
    confirmPinRefs,
  );

  // Các bước hiển thị phụ thuộc vào 2 trường hợp:
  // - Chưa từng đặt PIN (!hasPin): chỉ cần "new" → "confirm" (không có PIN cũ để xác thực, không cần OTP)
  // - Quên PIN (isForgotFlow): "otp" → "new" → "confirm" (xác thực qua email)
  // - Đổi PIN bình thường: "old" → "new" → "confirm" (PIN cũ chính là yếu tố xác thực)
  const pinFlowSteps = !hasPin
    ? ["new", "confirm"]
    : isForgotFlow
      ? ["otp", "new", "confirm"]
      : ["old", "new", "confirm"];

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const openChangePin = () => {
    setIsForgotFlow(false);
    setOldPinDigits(["", "", "", ""]);
    setPinError("");
    setPinModal(hasPin ? "old" : "new");
  };
  const openForgotPin = () => {
    setIsForgotFlow(true);
    setPinError("");
    setPinModal("otp");
    sendOtp();
  };
  const closePinModal = () => {
    setPinModal(null);
    setOldPinDigits(["", "", "", ""]);
    setNewPinDigits(["", "", "", ""]);
    setConfirmPinDigits(["", "", "", ""]);
    setOtpValues(Array(6).fill(""));
    setPinError("");
    setPinSubmitting(false);
  };

  const submitOldPin = async () => {
    const oldPin = oldPinDigits.join("");
    if (!/^[0-9]{4}$/.test(oldPin)) {
      setPinError("Mã PIN gồm đúng 4 chữ số.");
      return;
    }
    setPinSubmitting(true);
    try {
      await parentPinService.verify(oldPin);
      setPinError("");
      setPinModal("new");
    } catch (err) {
      setPinError(err.response?.data?.message || "Mã PIN cũ không đúng.");
      setOldPinDigits(["", "", "", ""]);
      oldPinRefs.current[0]?.focus();
    } finally {
      setPinSubmitting(false);
    }
  };

  const sendOtp = async () => {
    setOtpSending(true);
    setOtpValues(Array(6).fill(""));
    try {
      const res = await parentPinService.sendForgotOtp();
      setMaskedEmail(res.data.data?.maskedEmail || "");
      setResendCooldown(60);
      toast.success("Đã gửi mã OTP tới email của bạn");
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi mã OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    setOtpValues((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpValues[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };
  const submitOtp = () => {
    const code = otpValues.join("");
    if (code.length < 6) {
      setPinError("Vui lòng nhập đủ 6 số.");
      return;
    }
    setPinError("");
    setPinModal("new");
  };

  const submitNewPin = () => {
    const newPin = newPinDigits.join("");
    if (!/^[0-9]{4}$/.test(newPin)) {
      setPinError("Mã PIN gồm đúng 4 chữ số.");
      return;
    }
    setPinError("");
    setPinModal("confirm");
  };
  const submitConfirmPin = async () => {
    const newPin = newPinDigits.join("");
    const confirmPin = confirmPinDigits.join("");
    if (confirmPin !== newPin) {
      setPinError("Hai mã PIN không khớp, thử lại nhé.");
      setConfirmPinDigits(["", "", "", ""]);
      confirmPinRefs.current[0]?.focus();
      return;
    }
    setPinSubmitting(true);
    try {
      if (isForgotFlow) {
        await parentPinService.resetWithOtp(otpValues.join(""), newPin);
      } else if (!hasPin) {
        await parentPinService.set(newPin);
      } else {
        await parentPinService.change(oldPinDigits.join(""), newPin);
      }
      setHasPin(true);
      toast.success(
        isForgotFlow ? "Đã đặt lại mã PIN mới" : "Đã đổi mã PIN thành công",
      );
      closePinModal();
    } catch (err) {
      setPinError(
        err.response?.data?.message || "Không thể lưu mã PIN, thử lại nhé.",
      );
    } finally {
      setPinSubmitting(false);
    }
  };

  /*  Unlock PIN attempt (mini flow)  */
  const [unlockPinDigits, setUnlockPinDigits] = useState(["", "", "", ""]);
  const [unlockSubmitting, setUnlockSubmitting] = useState(false);
  const [unlockLockedUntil, setUnlockLockedUntil] = useState(null);
  const [unlockError, setUnlockError] = useState("");
  const unlockRefs = useRef([]);
  const isLockedOut = !!unlockLockedUntil && unlockLockedUntil > Date.now();

  const handleUnlockDigit = (idx, val) => {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    setUnlockPinDigits((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < 3) unlockRefs.current[idx + 1]?.focus();
  };
  const submitUnlockPin = async () => {
    const pin = unlockPinDigits.join("");
    if (pin.length < 4) return;
    setUnlockSubmitting(true);
    try {
      await confirmUnlock(pin);
      setUnlockError("");
      setUnlockPinDigits(["", "", "", ""]);
    } catch (err) {
      const data = err.response?.data;
      setUnlockError(data?.message || "Mã PIN không đúng.");
      if (data?.data?.code === "LOCKED_OUT") {
        setUnlockLockedUntil(Date.now() + 15 * 60 * 1000);
      }
      setUnlockPinDigits(["", "", "", ""]);
      unlockRefs.current[0]?.focus();
    } finally {
      setUnlockSubmitting(false);
    }
  };

  /*  Scrollspy: mục lục tự nhận diện section đang xem + trạng thái "dính"  */
  useEffect(() => {
    const sectionEls = SECTIONS.map((s) =>
      document.getElementById(s.id),
    ).filter(Boolean);
    if (!sectionEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sectionEls.forEach((el) => observer.observe(el));

    const onScroll = () => setPillsStuck(window.scrollY > 260);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Chọn bé để cài đặt: đổi bé đang active và báo rõ ràng cho phụ huynh
  // biết họ vừa chuyển sang cài đặt cho ai. Toàn bộ khu quản lý (link/QR,
  // khóa AR, xóa hồ sơ) hiện ra ngay bên phải cho bé đang chọn, không cần
  // bấm thêm thao tác nào.
  const selectChild = (child) => {
    if (child.id === activeChildId) return;
    setActiveChildId(child.id);
    toast.success(`Đang cài đặt cho bé ${child.name}`);
  };

  // Vị trí % của khung giờ được phép trên dải 24h, để vẽ timeline
  const startPct = (timeToMinutes(settings.allowStart) / (24 * 60)) * 100;
  const endPct = (timeToMinutes(settings.allowEnd) / (24 * 60)) * 100;
  const [nowPct, setNowPct] = useState(() => {
    const now = new Date();
    return ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;
  });
  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setNowPct(((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100);
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const auditIcon = (type) => {
    if (type === "lock") return <Lock size={13} />;
    if (type === "unlock") return <Unlock size={13} />;
    return <Settings2 size={13} />;
  };

  /* ── Trạng thái tải/rỗng: chưa có hồ sơ con nào, hoặc đang tải ── */
  if (childrenLoading) {
    return (
      <FullScreenLoader
        eyebrow="Vui lòng chờ"
        message="Đang tải bảng điều khiển phụ huynh…"
      />
    );
  }

  if (children.length === 0) {
    return (
      <div className="pkd-page">
        <div className="pkd-header">
          <div className="pkd-header-inner">
            <Link to="/profile" className="pkd-back-link">
              <ArrowLeft size={14} /> Quay lại hồ sơ
            </Link>
            <div className="page-eyebrow">
              <span className="page-eyebrow-line" />
              <span className="page-eyebrow-text">Earthoria · Gia đình</span>
            </div>
            <h1 className="pkd-title">
              Bảng điều khiển <em>phụ huynh</em>
            </h1>
          </div>
        </div>
        <div className="pkd-empty-state">
          <Smile size={40} strokeWidth={1.2} />
          <h3>Chưa có hồ sơ trẻ em nào</h3>
          <p>
            Tạo hồ sơ riêng cho từng bé như YouTube Kids để quản lý sách,
            giờ xem AR và bảo vệ mắt cho con bạn.
          </p>
          <button
            className="pf-confirm-ok pf-btn-tactile"
            onClick={() => setWizardOpen(true)}
          >
            <UserPlus size={15} /> Tạo hồ sơ đầu tiên cho bé
          </button>
        </div>
        <CreateChildWizard
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onCreated={handleChildCreated}
          hasPin={hasPin}
          onPinCreated={() => setHasPin(true)}
          childLimit={childLimit}
        />
      </div>
    );
  }

  if (!activeChildId || (dashboardLoading && !dashboard)) {
    return (
      <FullScreenLoader
        eyebrow="Vui lòng chờ"
        message="Đang tải dữ liệu của bé…"
      />
    );
  }

  if (!activeChild) {
    return (
      <FullScreenLoader
        eyebrow="Vui lòng chờ"
        message="Đang tải dữ liệu của bé…"
      />
    );
  }

  const lastSessionLabel = sessions[0]?.date || "Chưa có hoạt động";

  return (
    <div className="pkd-page">
      {/*  Header  */}
      <div
        className="pkd-header"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty(
            "--mx",
            `${e.clientX - rect.left}px`,
          );
          e.currentTarget.style.setProperty(
            "--my",
            `${e.clientY - rect.top}px`,
          );
        }}
      >
        <div className="pkd-header-bg" aria-hidden="true">
          <div className="pkd-header-bg-sharp" />
          <span className="pkd-firefly" />
          <span className="pkd-firefly" />
          <span className="pkd-firefly" />
          <span className="pkd-firefly" />
          <span className="pkd-firefly" />
          <span className="pkd-firefly" />
          <span className="pkd-firefly" />
        </div>
        <div className="pkd-header-inner">
          <Link to="/profile" className="pkd-back-link">
            <ArrowLeft size={14} /> Quay lại hồ sơ
          </Link>
          <div className="pkd-header-row">
            <div>
              <div className="page-eyebrow">
                <span className="page-eyebrow-line" />
                <span className="page-eyebrow-text">Earthoria · Gia đình</span>
              </div>
              <h1 className="pkd-title">
                Bảng điều khiển <em>phụ huynh</em>
              </h1>
              <p className="pkd-sub">
              Trải nghiệm độc quyền dành cho chủ sở hữu sách điện tử Earthoria.
              </p>
            </div>

            <div className="pkd-sync-wrap">
              <span className="pkd-device-status">
                <span className="pkd-status-dot" />
                <Wifi size={12} />
                Hoạt động gần nhất của {activeChild.name}: {lastSessionLabel}
              </span>
              <span
                className={`pkd-autosave ${saveStatus !== "idle" ? "is-visible" : ""} is-${saveStatus}`}
                aria-live="polite"
              >
                {saveStatus === "saving" ? (
                  <>
                    <Loader2 size={12} /> Đang lưu…
                  </>
                ) : (
                  <>
                    <Check size={12} /> Đã lưu tự động
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/*   SIDEBAR (danh sách bé) + MAIN (thiết lập)   */}
      <div className="pkd-body pkd-body-top">
        <div className="pkd-layout">
          {/* ── SIDEBAR: danh sách tài khoản E-kid ── */}
          <aside className="pkd-sidebar">
            <RevealCard as="div" className="pkd-sidebar-head">
              <div className="pkd-sidebar-head-row">
                <div className="pkd-sidebar-head-text">
                  <span className="pkd-section-eyebrow">
                    Danh sách tài khoản E-kid
                  </span>
                  <h2 className="pkd-section-title">Thiết lập tài khoản</h2>
                </div>
                <button
                  type="button"
                  className={`pkd-sidebar-add-btn ${childLimit && childLimit.current >= childLimit.max ? "is-limit" : ""}`}
                  onClick={() => setWizardOpen(true)}
                  title={
                    childLimit && childLimit.current >= childLimit.max
                      ? "Đã đạt giới hạn hồ sơ trẻ em của hạng hiện tại"
                      : "Thêm hồ sơ cho bé"
                  }
                  aria-label="Thêm hồ sơ cho bé"
                >
                  {childLimit && childLimit.current >= childLimit.max ? (
                    <Lock size={16} />
                  ) : (
                    <Plus size={18} />
                  )}
                </button>
              </div>
              <p className="pkd-section-sub">
                Mỗi tài khoản có thể thiết lập <b>riêng</b>.
              </p>
              <ChildLimitBanner childLimit={childLimit} />
            </RevealCard>

            <RevealCard as="div" className="pkd-child-picker-list">
              {children.map((child) => {
                const mins = child.todayMinutes ?? 0;
                const limit = child.dailyLimitMinutes ?? 60;
                const pct = clamp((mins / limit) * 100, 0, 100);
                const isActive = activeChildId === child.id;
                return (
                  <div
                    key={child.id}
                    className={`pkd-picker-item ${isActive ? "is-active" : ""}`}
                  >
                    <button
                      type="button"
                      className="pkd-picker-row"
                      onClick={() => selectChild(child)}
                    >
                      <span className="pkd-child-avatar-wrap">
                        <span
                          className="pkd-child-avatar"
                          style={{ background: child.avatarColor }}
                        >
                          {child.avatarEmoji}
                        </span>
                      </span>
                      <span className="pkd-child-info">
                        <span className="pkd-child-name">
                          {child.name}
                          {child.isLocked && (
                            <span className="pkd-child-lock-tag">
                              <Lock size={9} /> Đã khóa
                            </span>
                          )}
                          {isActive && (
                            <span className="pkd-child-active-tag">
                              <Check size={9} /> Đang chọn
                            </span>
                          )}
                        </span>
                        <span className="pkd-child-meta">{child.age} tuổi</span>
                        <span className="pkd-child-bar">
                          <span
                            className={`pkd-child-bar-fill ${pct >= 100 ? "is-over" : ""}`}
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span className="pkd-child-mins">
                          {formatMinutes(mins)} / {formatMinutes(limit)} hôm nay
                        </span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </RevealCard>
          </aside>

          {/* ── MAIN: thiết lập cho bé đang chọn ── */}
          <div className="pkd-main">
            {/* Băng thông báo: đang cài đặt cho bé nào */}
            <RevealCard as="div" className="pkd-active-child-banner">
              <UserCog size={16} />
              <span>
                Bạn đang cài đặt cho tài khoản bé: <strong>{activeChild.name}</strong>
              </span>
            </RevealCard>

            {/* Quản lý link & QR riêng, khóa AR, xoá hồ sơ — hiện ngay cho bé
                đang chọn, không cần bấm thêm thao tác nào */}
            <RevealCard as="div" className="pkd-card pkd-manage-card">
              <div className="pkd-card-title-row">
                <span className="pkd-card-title-left">
                  <Sparkles size={16} />
                  Link, QR &amp; bảo mật AR cho {activeChild.name}
                </span>
              </div>
              <KidLinkCard
                childId={activeChildId}
                childName={activeChild.name}
                childAge={activeChild.age}
                avatarEmoji={activeChildAvatarEmoji}
                avatarColor={activeChildAvatarColor}
              />

              <div className="pkd-manage-card-lock">
                {lockState.isLocked ? (
                  <button
                    className="pkd-lock-btn is-unlock pf-btn-tactile"
                    onClick={() => requestUnlock()}
                    type="button"
                  >
                    <Unlock size={15} /> Mở khóa cho {activeChild.name}
                  </button>
                ) : (
                  <button
                    className="pkd-lock-btn is-lock pf-btn-tactile"
                    onClick={() => requestLock()}
                    type="button"
                  >
                    <Lock size={15} /> Khóa ngay cho {activeChild.name}
                  </button>
                )}
              </div>

              <div className="pkd-manage-card-danger">
                <button
                  className="pkd-picker-delete-btn"
                  onClick={() =>
                    setDeleteTarget({ id: activeChildId, name: activeChild.name })
                  }
                  type="button"
                >
                  <Trash2 size={14} /> Xoá vĩnh viễn hồ sơ của {activeChild.name}
                </button>
              </div>
            </RevealCard>

            {/* Section quick-nav dính lại khi cuộn, tự nhận diện mục đang xem */}
            <div className={`pkd-pills-wrap ${pillsStuck ? "is-stuck" : ""}`}>
              <div className="filter-pills pkd-pills">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    className={`pill ${activeSection === s.id ? "active" : ""}`}
                    onClick={() => scrollToSection(s.id)}
                    type="button"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/*   OVERVIEW   */}
        <section id="overview" className="pkd-section">
          <RevealCard as="div" className="pkd-section-head">
            <span className="pkd-section-eyebrow">Hôm nay</span>
            <h2 className="pkd-section-title">Tổng quan</h2>
          </RevealCard>
          <div className="pkd-overview-grid">
            <RevealCard
              className={`pkd-stat-card ${todayMinutes > settings.dailyLimitMinutes ? "is-danger" : ""}`}
            >
              <div className="pkd-stat-icon-row">
                <span className="pkd-stat-icon-box">
                  <Clock size={16} />
                </span>
                {trendDirection !== "flat" && (
                  <span className={`pkd-trend is-${trendDirection}`}>
                    {trendDirection === "down" ? (
                      <TrendingDown size={11} />
                    ) : (
                      <TrendingUp size={11} />
                    )}
                    {Math.abs(trendDeltaPct)}%
                  </span>
                )}
                {trendDirection === "flat" && (
                  <span className="pkd-trend is-flat">
                    <MinusIcon size={11} /> Ổn định
                  </span>
                )}
              </div>
              <div className="pkd-stat-val">{formatMinutes(todayMinutes)}</div>
              <div className="pkd-stat-label">
                Đã xem hôm nay · so với TB tuần
              </div>
            </RevealCard>

            <RevealCard className="pkd-stat-card" delay={60}>
              <div className="pkd-stat-icon-row">
                <span className="pkd-stat-icon-box">
                  <CalendarClock size={16} />
                </span>
              </div>
              <div className="pkd-stat-val">
                {formatMinutes(settings.dailyLimitMinutes)}
              </div>
              <div className="pkd-stat-label">Giới hạn mỗi ngày</div>
            </RevealCard>

            <RevealCard className="pkd-stat-card" delay={120}>
              <div className="pkd-stat-icon-row">
                <span className="pkd-stat-icon-box">
                  <BookOpen size={16} />
                </span>
              </div>
              <div className="pkd-stat-val">{sessions.length}</div>
              <div className="pkd-stat-label">Lượt xem gần đây</div>
            </RevealCard>

            <RevealCard
              className={`pkd-stat-card ${lockState.isLocked ? "is-danger" : ""}`}
              delay={180}
            >
              <div className="pkd-stat-icon-row">
                <span className="pkd-stat-icon-box">
                  {lockState.isLocked ? (
                    <Lock size={16} className="pkd-icon-danger" />
                  ) : (
                    <ShieldCheck size={16} className="pkd-icon-ok" />
                  )}
                </span>
              </div>
              <div className="pkd-stat-val">
                {lockState.isLocked ? "Đã khóa" : "Đang mở"}
              </div>
              <div className="pkd-stat-label">Trạng thái AR</div>
            </RevealCard>
          </div>

          {lockState.isLocked && (
            <RevealCard className="pkd-locked-banner">
              <Lock size={16} />
              <div>
                <strong>AR đang bị tạm khóa cho {activeChild.name}.</strong>
                <div>Chỉ phụ huynh mới có thể mở khóa bằng mã PIN.</div>
              </div>
              <button
                className="pkd-mini-btn pf-btn-tactile"
                onClick={() => requestUnlock()}
                type="button"
              >
                <Unlock size={13} /> Mở khóa
              </button>
            </RevealCard>
          )}

          <RevealCard className="pkd-card pkd-pin-card-top">
            <div className="pkd-card-title-row">
              <span className="pkd-card-title-left">
                <KeyRound size={16} />
                Mã PIN phụ huynh
              </span>
            </div>
            <p className="pkd-card-note" style={{ marginBottom: 18 }}>
              Mã PIN dùng chung cho mọi bé để mở khóa AR và xác nhận các thao
              tác quan trọng.
            </p>
            <div className="pkd-pin-actions">
              <button
                className="pkd-mini-btn pf-btn-tactile"
                onClick={openChangePin}
                type="button"
              >
                <KeyRound size={13} /> Đổi mã PIN
              </button>
              <button
                className="pkd-text-link"
                onClick={openForgotPin}
                type="button"
              >
                Quên mã PIN?
              </button>
            </div>
          </RevealCard>
        </section>

        {/*   TIME RULES   */}
        <section id="time-rules" className="pkd-section">
          <RevealCard as="div" className="pkd-section-head">
            <span className="pkd-section-eyebrow">Tuỳ chỉnh</span>
            <h2 className="pkd-section-title">Quản lý giờ giấc</h2>
            <p className="pkd-section-sub">
             Thiết lập thời gian sử dụng phù hợp cho bé. Mọi giới hạn được đồng bộ tự động và tính theo thời gian máy chủ Earthoria, giúp thiết lập luôn chính xác trên mọi thiết bị.
            </p>
          </RevealCard>

          <RevealCard className="pkd-card">
            <div className="pkd-card-title-row">
              <span className="pkd-card-title-left">
                <Clock size={16} />
                Giới hạn thời gian mỗi ngày
              </span>
            </div>
            <div className="pkd-preset-row">
              {[30, 60, 90, 120].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`pkd-preset-chip ${settings.dailyLimitMinutes === v ? "is-active" : ""}`}
                  onClick={() => updateSettings({ dailyLimitMinutes: v })}
                >
                  {v} phút
                </button>
              ))}
            </div>
            <Stepper
              value={settings.dailyLimitMinutes}
              onChange={(v) => updateSettings({ dailyLimitMinutes: v })}
              min={10}
              max={240}
              step={5}
            />
          </RevealCard>

          <RevealCard className="pkd-card">
            <SwitchRow
              icon={<Timer size={15} />}
              title="Nghỉ mắt định kỳ"
              desc="Cứ mỗi khoảng thời gian xem, hiện popup nhắc nhìn xa kèm đếm ngược."
              checked={settings.ruleEnabled}
              onChange={(v) => updateSettings({ ruleEnabled: v })}
            />
            {settings.ruleEnabled && (
              <div className="pkd-subfields">
                <div className="pkd-subfield">
                  <label>Nhắc nghỉ mỗi</label>
                  <Stepper
                    value={settings.ruleIntervalMinutes}
                    onChange={(v) => updateSettings({ ruleIntervalMinutes: v })}
                    min={5}
                    max={60}
                    step={5}
                  />
                </div>
                <div className="pkd-subfield">
                  <label>Thời gian nhìn xa</label>
                  <Stepper
                    value={settings.ruleRestSeconds}
                    onChange={(v) => updateSettings({ ruleRestSeconds: v })}
                    min={10}
                    max={60}
                    step={5}
                    suffix="giây"
                  />
                </div>
              </div>
            )}
          </RevealCard>

          <RevealCard className="pkd-card">
            <SwitchRow
              icon={<CalendarClock size={15} />}
              title="Khung giờ được phép xem"
              desc="Ngoài khung giờ này, AR sẽ không mở được dù còn hạn mức trong ngày."
              checked={settings.allowWindowEnabled}
              onChange={(v) => updateSettings({ allowWindowEnabled: v })}
            />
            {settings.allowWindowEnabled && (
              <>
                <div className="pkd-time-range">
                  <div className="pkd-time-field">
                    <label>Từ</label>
                    <input
                      type="time"
                      value={allowStartDraft}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAllowStartDraft(val);
                        if (!val) return;
                        updateSettings({ allowStart: val });
                      }}
                    />
                  </div>
                  <ChevronRight size={14} className="pkd-time-arrow" />
                  <div className="pkd-time-field">
                    <label>Đến</label>
                    <input
                      type="time"
                      value={allowEndDraft}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAllowEndDraft(val);
                        if (!val) return;
                        updateSettings({ allowEnd: val });
                      }}
                    />
                  </div>
                </div>

                <div className="pkd-timeline">
                  <div className="pkd-timeline-head">
                    <span>Trực quan thời gian</span>
                    <span>
                      Hiện tại:{" "}
                      {new Date().toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="pkd-timeline-track">
                    <div
                      className="pkd-timeline-allowed"
                      style={{
                        left: `${startPct}%`,
                        width: `${Math.max(endPct - startPct, 1)}%`,
                      }}
                    />
                    <div
                      className="pkd-timeline-now"
                      style={{ left: `${nowPct}%` }}
                    />
                  </div>
                  <div className="pkd-timeline-labels">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                  </div>
                </div>
              </>
            )}
          </RevealCard>

          <RevealCard className="pkd-card">
            <SwitchRow
              icon={<Lock size={15} />}
              title="Giờ nghỉ bắt buộc"
              desc="Sau một khoảng thời gian xem liên tục, khóa màn hình AR vài phút mới cho xem tiếp."
              checked={settings.mandatoryBreakEnabled}
              onChange={(v) => updateSettings({ mandatoryBreakEnabled: v })}
            />
            {settings.mandatoryBreakEnabled && (
              <div className="pkd-subfields">
                <div className="pkd-subfield">
                  <label>Xem liên tục quá</label>
                  <Stepper
                    value={settings.breakAfterMinutes}
                    onChange={(v) => updateSettings({ breakAfterMinutes: v })}
                    min={15}
                    max={120}
                    step={5}
                  />
                </div>
                <div className="pkd-subfield">
                  <label>Thì khóa trong</label>
                  <Stepper
                    value={settings.breakDurationMinutes}
                    onChange={(v) =>
                      updateSettings({ breakDurationMinutes: v })
                    }
                    min={5}
                    max={30}
                    step={5}
                  />
                </div>
              </div>
            )}
          </RevealCard>
        </section>

        {/*   REPORTS   */}
        <section id="reports" className="pkd-section">
          <RevealCard as="div" className="pkd-section-head">
            <span className="pkd-section-eyebrow">Dữ liệu 7 ngày</span>
            <h2 className="pkd-section-title">Báo cáo & theo dõi</h2>
          </RevealCard>

          <RevealCard className="pkd-card">
            <div className="pkd-card-title-row">
              <span className="pkd-card-title-left">
                <TrendingUp size={16} />
                Thời gian xem trong tuần
              </span>
              <span className="pkd-week-total">
                {formatMinutes(weekTotal)} tổng cộng
              </span>
            </div>
            <div className="pkd-chart-plot">
              <div className="pkd-chart">
                <div
                  className="pkd-chart-avg-line"
                  style={{
                    bottom: `${clamp((weekAvg / weekMax) * 100, 0, 100)}%`,
                  }}
                >
                  <span className="pkd-chart-avg-label">
                    TB {formatMinutes(Math.round(weekAvg))}
                  </span>
                </div>
                {weeklyMinutes.map((mins, i) => {
                  const h = clamp((mins / weekMax) * 100, 4, 100);
                  const overLimit = mins > settings.dailyLimitMinutes;
                  const isToday = i === TODAY_INDEX;
                  return (
                    <div
                      className={`pkd-chart-col ${isToday ? "is-today" : ""}`}
                      key={i}
                    >
                      <div className="pkd-chart-bar-wrap">
                        <div className="pkd-chart-tooltip">
                          <strong>{WEEK_LABELS[i]}</strong> ·{" "}
                          {formatMinutes(mins)}
                        </div>
                        <div
                          className={`pkd-chart-bar ${overLimit ? "is-over" : ""}`}
                          style={{ height: `${h}%` }}
                        />
                      </div>
                      <span className="pkd-chart-label">
                        {isToday ? "Hôm nay" : WEEK_LABELS[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="pkd-chart-legend">
              <span className="pkd-legend-dot" /> Trong hạn mức
              <span className="pkd-legend-dot is-over" /> Vượt hạn mức ngày
              <span className="pkd-legend-line" /> Trung bình tuần
            </div>
          </RevealCard>

          <RevealCard className="pkd-card">
            <div className="pkd-card-title-row">
              <span className="pkd-card-title-left">
                <BookOpen size={16} />
                Sách AR đã xem gần đây
              </span>
            </div>
            {sessions.length === 0 ? (
              <div className="pkd-empty-mini">
                <BookOpen size={22} />
                Chưa có lượt xem nào trong tuần này.
              </div>
            ) : (
              <div className="pkd-book-list">
                {sessions.map((s) => (
                  <div className="pkd-book-row" key={s.id}>
                    <span className="pkd-book-letter">{s.letter}</span>
                    <span className="pkd-book-info">
                      <span className="pkd-book-title">{s.title}</span>
                      <span className="pkd-book-date">{s.date}</span>
                    </span>
                    <span className="pkd-book-mins">
                      {formatMinutes(s.minutes)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </RevealCard>

          <RevealCard className="pkd-card">
            <div className="pkd-card-title-row">
              <span className="pkd-card-title-left">
                <History size={16} />
                Nhật ký hoạt động
              </span>
            </div>
            {auditLog.length === 0 ? (
              <div className="pkd-empty-mini">
                <History size={22} />
                Chưa có hoạt động nào được ghi nhận.
              </div>
            ) : (
              <div className="pkd-audit-list">
                {auditLog.map((a) => (
                  <div className="pkd-audit-row" key={a.id}>
                    <span
                      className={`pkd-audit-icon ${a.type === "lock" ? "is-danger" : ""}`}
                    >
                      {auditIcon(a.type)}
                    </span>
                    <span className="pkd-audit-body">
                      <span className="pkd-audit-text">{a.text}</span>
                      <div className="pkd-audit-time">{a.time}</div>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </RevealCard>

          <RevealCard className="pkd-card">
            <div className="pkd-card-title-row">
              <span className="pkd-card-title-left">
                <Bell size={16} />
                Thông báo cho phụ huynh
              </span>
            </div>
            <SwitchRow
              title="Thông báo đẩy (push)"
              checked={settings.notifyPush}
              onChange={(v) => updateSettings({ notifyPush: v })}
            />
            <SwitchRow
              title="Thông báo qua email"
              checked={settings.notifyEmail}
              onChange={(v) => updateSettings({ notifyEmail: v })}
            />
            <div className="pkd-checklist">
              <label className="pkd-checkbox-row">
                <input
                  type="checkbox"
                  checked={settings.notifyOnLimitExceeded}
                  onChange={(e) =>
                    updateSettings({ notifyOnLimitExceeded: e.target.checked })
                  }
                />
                Khi con vượt giới hạn thời gian trong ngày
              </label>
              <label className="pkd-checkbox-row">
                <input
                  type="checkbox"
                  checked={settings.notifyOnSkippedRest}
                  onChange={(e) =>
                    updateSettings({ notifyOnSkippedRest: e.target.checked })
                  }
                />
                Khi con bỏ qua nhắc nghỉ mắt nhiều lần
              </label>
            </div>
          </RevealCard>
        </section>

        {/*   SÁCH CỦA BÉ   */}
        <section id="books" className="pkd-section">
          <RevealCard as="div" className="pkd-section-head">
            <span className="pkd-section-eyebrow">Thư viện riêng</span>
            <h2 className="pkd-section-title">Sách của {activeChild.name}</h2>
            <p className="pkd-section-sub">
              {activeChild.name} chỉ có thể xem những sách bạn đã mua VÀ bật
              hiển thị ở đây. Ẩn bớt để lọc theo độ tuổi hoặc chủ đề bạn muốn
              con tập trung.
            </p>
          </RevealCard>

          <RevealCard as="div" className="pkd-card">
            {booksLoading ? (
              <div className="pkd-empty-state" style={{ padding: "32px 0" }}>
                <Loader2 size={20} className="pkd-spin" />
              </div>
            ) : books.length === 0 ? (
              <div className="pkd-empty-state" style={{ padding: "32px 0" }}>
                <BookMarked size={28} strokeWidth={1.2} />
                <p>
                  Bạn chưa mua sách nào. Sách sau khi mua sẽ tự động xuất hiện ở
                  đây.
                </p>
                <Link to="/products" className="pf-confirm-ok pf-btn-tactile">
                  Khám phá sách
                </Link>
              </div>
            ) : (
              books.map((book) => (
                <div key={book.id} className="pkd-book-visible-row">
                  <div className="pkd-book-visible-info">
                    {book.coverImage && (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="pkd-book-visible-cover"
                      />
                    )}
                    <div>
                      <div className="pkd-book-visible-title">{book.title}</div>
                      {(book.ageMin || book.ageMax) && (
                        <div className="pkd-child-meta">
                          {book.ageMin ?? 0}–{book.ageMax ?? "∞"} tuổi
                        </div>
                      )}
                    </div>
                  </div>
                  <label className="pf-switch">
                    <input
                      type="checkbox"
                      checked={book.visible}
                      onChange={(e) =>
                        toggleBookVisibility(book.id, e.target.checked)
                      }
                    />
                    <span className="pf-switch-track">
                      <span className="pf-switch-thumb" />
                    </span>
                  </label>
                </div>
              ))
            )}
          </RevealCard>
        </section>

        {/*   EYE CARE   */}
        <section id="eye-care" className="pkd-section">
          <RevealCard as="div" className="pkd-section-head">
            <span className="pkd-section-eyebrow">Sức khoẻ thị lực</span>
            <h2 className="pkd-section-title">Nhắc bảo vệ mắt</h2>
            <p className="pkd-section-sub">
              Gợi ý hiển thị dạng thẻ nhỏ, không chặn màn hình.
            </p>
          </RevealCard>

          <RevealCard className="pkd-card">
            <SwitchRow
              icon={<Sparkles size={15} />}
              title="Hiện thẻ mẹo bảo vệ mắt"
              desc="Xoay vòng các mẹo ngắn về khoảng cách, tư thế và ánh sáng màn hình."
              checked={settings.tipsEnabled}
              onChange={(v) => updateSettings({ tipsEnabled: v })}
            />
            {settings.tipsEnabled && (
              <>
                <div className="pkd-tip-freq-row">
                  <div className="pkd-subfield pkd-subfield-block">
                    <label>Tần suất hiện</label>
                    <select
                      className="pkd-select"
                      value={settings.tipsFrequency}
                      onChange={(e) =>
                        updateSettings({ tipsFrequency: e.target.value })
                      }
                    >
                      <option value="open">Mỗi lần mở app</option>
                      <option value="interval">Mỗi 15 phút</option>
                      <option value="rest">Mỗi lần đến giờ nghỉ mắt</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="pkd-mini-btn pf-btn-tactile pkd-tip-refresh-btn"
                    onClick={cycleTip}
                  >
                    <RefreshCcw size={12} /> Xem mẫu khác
                  </button>
                </div>

                <div className="pkd-tip-preview">
                  <div className="pkd-tip-preview-head">
                    <Info size={13} /> Xem trước thẻ mẹo
                  </div>
                  <div
                    className={`pkd-tip-card ${tipCycling ? "is-cycling" : ""}`}
                  >
                    {(() => {
                      const Tip = EYE_TIPS[tipIndex];
                      const Icon = Tip.Icon;
                      return (
                        <>
                          <Icon size={16} />
                          <span>{Tip.text}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}
          </RevealCard>
        </section>
          </div>
        </div>
      </div>

      {/*   MODAL: Xác nhận khóa   */}
      {lockConfirmOpen && (
        <ModalShell onClose={() => setLockConfirmOpen(false)}>
          <div className="pf-confirm-icon danger">
            <Lock size={18} />
          </div>
          <h3 className="pf-confirm-title">Khóa AR ngay bây giờ?</h3>
          <p className="pf-confirm-msg">
            {lockTarget?.name} sẽ không thể mở sách AR nào cho đến khi bạn mở
            khóa lại bằng mã PIN.
          </p>
          <div className="pf-confirm-actions">
            <button
              className="pf-confirm-cancel pf-btn-tactile"
              onClick={() => setLockConfirmOpen(false)}
            >
              Hủy
            </button>
            <button
              className="pf-confirm-ok danger pf-btn-tactile"
              onClick={confirmLock}
            >
              Khóa ngay
            </button>
          </div>
        </ModalShell>
      )}

      {/*   MODAL: Nhập PIN để mở khóa   */}
      {unlockPinOpen && (
        <ModalShell
          onClose={() => {
            setUnlockPinOpen(false);
            setUnlockError("");
            setUnlockPinDigits(["", "", "", ""]);
          }}
        >
          <div className="pf-confirm-icon">
            <Unlock size={18} />
          </div>
          <h3 className="pf-confirm-title">Nhập mã PIN để mở khóa</h3>
          <p className="pf-confirm-msg">
            Mở khóa AR cho {lockTarget?.name}. Chỉ phụ huynh mới mở khóa được.
          </p>

          {isLockedOut ? (
            <div className="pkd-lockout-msg">
              <AlertTriangle size={14} /> Bạn đã nhập sai quá {MAX_PIN_ATTEMPTS}{" "}
              lần. Vui lòng thử lại sau ít phút hoặc dùng "Quên mã PIN?".
            </div>
          ) : (
            <>
              <div
                className="otp-inputs"
                style={{ maxWidth: 220, margin: "20px auto" }}
              >
                {unlockPinDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (unlockRefs.current[i] = el)}
                    className={`otp-input ${d ? "filled" : ""} ${unlockError ? "error" : ""}`}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleUnlockDigit(i, e.target.value)}
                  />
                ))}
              </div>
              {unlockError && (
                <p className="pf-field-error" style={{ textAlign: "center" }}>
                  {unlockError}
                </p>
              )}
            </>
          )}

          <div className="pf-confirm-actions">
            <button
              className="pf-confirm-cancel pf-btn-tactile"
              onClick={() => {
                setUnlockPinOpen(false);
                setUnlockError("");
                setUnlockPinDigits(["", "", "", ""]);
              }}
            >
              Hủy
            </button>
            {!isLockedOut && (
              <button
                className="pf-confirm-ok pf-btn-tactile"
                onClick={submitUnlockPin}
                disabled={unlockSubmitting}
              >
                {unlockSubmitting ? (
                  <Loader2 size={14} className="pkd-spin" />
                ) : (
                  "Xác nhận"
                )}
              </button>
            )}
          </div>
        </ModalShell>
      )}

      {/*   MODAL: Đổi / Quên mã PIN (multi-step)   */}
      {pinModal && (
        <ModalShell onClose={closePinModal} wide>
          {/* Step indicator */}
          <div className="pkd-pin-steps">
            {pinFlowSteps.map((step) => (
              <span
                key={step}
                className={`pkd-pin-step-dot ${pinModal === step ? "is-active" : ""}`}
              />
            ))}
          </div>

          {pinModal === "old" && (
            <div className="auth-otp-step">
              <div className="pf-confirm-icon">
                <KeyRound size={18} />
              </div>
              <h3 className="pf-confirm-title">Nhập mã PIN hiện tại</h3>
              <p className="pf-confirm-msg">
                Xác nhận mã PIN cũ trước khi đặt mã mới.
              </p>
              <div
                className="otp-inputs"
                style={{ maxWidth: 220, margin: "20px auto" }}
              >
                {oldPinDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (oldPinRefs.current[i] = el)}
                    className={`otp-input ${d ? "filled" : ""} ${pinError ? "error" : ""}`}
                    inputMode="numeric"
                    maxLength={1}
                    autoFocus={i === 0}
                    value={d}
                    onChange={(e) => oldPinHandlers.onChange(i, e.target.value)}
                    onKeyDown={(e) => oldPinHandlers.onKeyDown(i, e)}
                  />
                ))}
              </div>
              {pinError && (
                <p className="pf-field-error" style={{ textAlign: "center" }}>
                  {pinError}
                </p>
              )}
              <div className="pf-confirm-actions">
                <button
                  className="pf-confirm-cancel pf-btn-tactile"
                  onClick={closePinModal}
                >
                  Hủy
                </button>
                <button
                  className="pf-confirm-ok pf-btn-tactile"
                  onClick={submitOldPin}
                  disabled={pinSubmitting}
                >
                  {pinSubmitting ? (
                    <Loader2 size={14} className="pkd-spin" />
                  ) : (
                    "Tiếp tục"
                  )}
                </button>
              </div>
            </div>
          )}

          {pinModal === "otp" && (
            <div className="auth-otp-step">
              <div className="pf-confirm-icon">
                <Bell size={18} />
              </div>
              <h3 className="pf-confirm-title">Nhập mã OTP</h3>
              <p className="pf-confirm-msg">
                Mã xác thực đã được gửi tới email của bạn.
              </p>
              <div className="otp-email-mask">
                {maskedEmail || "email của bạn"}
              </div>
              <div className="otp-inputs">
                {otpValues.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    className={`otp-input ${d ? "filled" : ""} ${pinError ? "error" : ""}`}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    disabled={otpSending}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>
              {pinError && (
                <p className="pf-field-error" style={{ textAlign: "center" }}>
                  {pinError}
                </p>
              )}
              <div className="otp-resend">
                Chưa nhận được mã?
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={sendOtp}
                >
                  {resendCooldown > 0
                    ? `Gửi lại (${resendCooldown}s)`
                    : "Gửi lại mã"}
                </button>
              </div>
              <div className="pf-confirm-actions">
                <button
                  className="pf-confirm-cancel pf-btn-tactile"
                  onClick={closePinModal}
                >
                  Hủy
                </button>
                <button
                  className="pf-confirm-ok pf-btn-tactile"
                  onClick={submitOtp}
                  disabled={otpSending}
                >
                  {otpSending ? (
                    <Loader2 size={14} className="pkd-spin" />
                  ) : (
                    "Xác nhận"
                  )}
                </button>
              </div>
            </div>
          )}

          {pinModal === "new" && (
            <div className="auth-otp-step">
              <div className="pf-confirm-icon">
                <KeyRound size={18} />
              </div>
              <h3 className="pf-confirm-title">Đặt mã PIN mới</h3>
              <p className="pf-confirm-msg">
                Chọn 4 chữ số dễ nhớ nhưng không quá đơn giản.
              </p>
              <div
                className="otp-inputs"
                style={{ maxWidth: 220, margin: "20px auto" }}
              >
                {newPinDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (newPinRefs.current[i] = el)}
                    className={`otp-input ${d ? "filled" : ""} ${pinError ? "error" : ""}`}
                    inputMode="numeric"
                    maxLength={1}
                    autoFocus={i === 0}
                    value={d}
                    onChange={(e) => newPinHandlers.onChange(i, e.target.value)}
                    onKeyDown={(e) => newPinHandlers.onKeyDown(i, e)}
                  />
                ))}
              </div>
              {pinError && (
                <p className="pf-field-error" style={{ textAlign: "center" }}>
                  {pinError}
                </p>
              )}
              <div className="pf-confirm-actions">
                <button
                  className="pf-confirm-cancel pf-btn-tactile"
                  onClick={closePinModal}
                >
                  Hủy
                </button>
                <button
                  className="pf-confirm-ok pf-btn-tactile"
                  onClick={submitNewPin}
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          )}

          {pinModal === "confirm" && (
            <div className="auth-otp-step">
              <div className="pf-confirm-icon">
                <Check size={18} />
              </div>
              <h3 className="pf-confirm-title">Nhập lại mã PIN mới</h3>
              <p className="pf-confirm-msg">
                Xác nhận lại để chắc chắn không gõ nhầm.
              </p>
              <div
                className="otp-inputs"
                style={{ maxWidth: 220, margin: "20px auto" }}
              >
                {confirmPinDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (confirmPinRefs.current[i] = el)}
                    className={`otp-input ${d ? "filled" : ""} ${pinError ? "error" : ""}`}
                    inputMode="numeric"
                    maxLength={1}
                    autoFocus={i === 0}
                    value={d}
                    onChange={(e) =>
                      confirmPinHandlers.onChange(i, e.target.value)
                    }
                    onKeyDown={(e) => confirmPinHandlers.onKeyDown(i, e)}
                  />
                ))}
              </div>
              {pinError && (
                <p className="pf-field-error" style={{ textAlign: "center" }}>
                  {pinError}
                </p>
              )}
              <div className="pf-confirm-actions">
                <button
                  className="pf-confirm-cancel pf-btn-tactile"
                  onClick={closePinModal}
                >
                  Hủy
                </button>
                <button
                  className="pf-confirm-ok pf-btn-tactile"
                  onClick={submitConfirmPin}
                  disabled={pinSubmitting}
                >
                  {pinSubmitting ? (
                    <Loader2 size={14} className="pkd-spin" />
                  ) : (
                    <>
                      <Check size={14} /> Lưu mã PIN
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {deleteTarget && (
        <DeleteChildModal
          childId={deleteTarget.id}
          childName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleChildDeleted}
        />
      )}

      <CreateChildWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={handleChildCreated}
        hasPin={hasPin}
        onPinCreated={() => setHasPin(true)}
        childLimit={childLimit}
      />
    </div>
  );
}