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
} from "lucide-react";

import "../components/assets/css/profile.css";
import "../components/assets/css/parentDashboard.css";

/* ═══════════════════════ MOCK DATA ═══════════════════════ */

const MOCK_CHILDREN = [
  { id: "c1", name: "Bống", age: 7, letter: "B" },
  { id: "c2", name: "Tôm", age: 10, letter: "T" },
];

const MOCK_TODAY_MINUTES = { c1: 42, c2: 78 };

const MOCK_DEVICE_STATUS = {
  c1: { online: true, lastActiveLabel: "đang hoạt động" },
  c2: { online: false, lastActiveLabel: "hoạt động lần cuối 54 phút trước" },
};

const WEEK_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const TODAY_INDEX = 5; // demo cố định — thứ Bảy, để cột "hôm nay" có gì đó để nổi bật

const MOCK_WEEKLY_MINUTES = {
  c1: [30, 45, 20, 60, 50, 42, 25],
  c2: [70, 80, 60, 90, 85, 78, 30],
};

const MOCK_SESSIONS = {
  c1: [
    { id: "s1", title: "Thế Giới Đại Dương", letter: "Đ", minutes: 18, date: "Hôm nay, 16:20" },
    { id: "s2", title: "Khu Rừng Nhiệt Đới", letter: "K", minutes: 24, date: "Hôm qua, 19:05" },
    { id: "s3", title: "Hệ Mặt Trời Của Bé", letter: "H", minutes: 15, date: "18/06, 20:10" },
  ],
  c2: [
    { id: "s4", title: "Khủng Long Kỷ Jura", letter: "K", minutes: 33, date: "Hôm nay, 20:02" },
    { id: "s5", title: "Thế Giới Đại Dương", letter: "Đ", minutes: 45, date: "Hôm qua, 18:40" },
  ],
};

const MOCK_AUDIT_LOG = {
  c1: [
    { id: "a1", type: "unlock", text: "Bạn đã mở khóa AR", time: "Hôm qua, 19:32" },
    { id: "a2", type: "settings", text: "Đã đổi giới hạn ngày thành 60 phút", time: "2 ngày trước" },
    { id: "a3", type: "lock", text: "Bạn đã khóa AR (giờ ăn tối)", time: "3 ngày trước" },
  ],
  c2: [
    { id: "a4", type: "settings", text: "Đã bật quy tắc 20-20-20", time: "Hôm qua, 08:15" },
    { id: "a5", type: "unlock", text: "Bạn đã mở khóa AR", time: "4 ngày trước" },
  ],
};

const EYE_TIPS = [
  { Icon: Timer, text: "Giữ màn hình cách mắt 50–70cm nhé!" },
  { Icon: Eye, text: "Đặt màn hình hơi thấp hơn tầm mắt một chút sẽ đỡ mỏi cổ hơn đó" },
  { Icon: Sun, text: "Phòng tối quá? Bật thêm đèn để mắt đỡ phải điều tiết nhiều" },
  { Icon: Sparkles, text: "Màn hình đang chói không? Thử giảm độ sáng hoặc đổi góc ngồi xem" },
  { Icon: Moon, text: "Đã tối rồi, bật chế độ lọc ánh sáng xanh cho dễ chịu hơn nhé" },
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
  { id: "eye-care", label: "Bảo vệ mắt" },
  { id: "security", label: "Bảo mật & khóa" },
];

// PIN mock — thực tế PIN không bao giờ được lưu dạng plaintext, phải
// hash bằng Argon2/bcrypt ở backend và so khớp qua API, không so trực
// tiếp ở client như bản mock này.
const MOCK_CORRECT_PIN = "1234";
const MAX_PIN_ATTEMPTS = 5;

/* ═══════════════════════ HELPERS ═══════════════════════ */

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

/* ═══════════════════════ SMALL UI PIECES ═══════════════════════ */

function Stepper({ value, onChange, min = 5, max = 240, step = 5, suffix = "phút" }) {
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

function SwitchRow({ title, desc, checked, onChange }) {
  return (
    <div className="pkd-switch-row">
      <div className="pkd-switch-row-text">
        <div className="pkd-switch-row-title">{title}</div>
        {desc && <div className="pkd-switch-row-desc">{desc}</div>}
      </div>
      <label className="pf-switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="pf-switch-track">
          <span className="pf-switch-thumb" />
        </span>
      </label>
    </div>
  );
}

function ModalShell({ onClose, children, wide }) {
  // Đóng bằng phím Esc — hành vi chuẩn cho mọi hộp thoại
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
      <div className={`pf-confirm pkd-modal ${wide ? "pkd-modal-wide" : ""}`} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

// Card bao ngoài gắn class .reveal — tự thêm "in" khi cuộn tới, tái dùng
// animation .reveal/.reveal.in đã có sẵn trong main.css.
function RevealCard({ as: Tag = "div", className = "", delay, children, ...rest }) {
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
      { threshold: 0.15 }
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

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

export default function ParentDashboard() {
  const [activeChildId, setActiveChildId] = useState(MOCK_CHILDREN[0].id);
  const [activeSection, setActiveSection] = useState("overview");
  const [pillsStuck, setPillsStuck] = useState(false);

  const [settingsByChild, setSettingsByChild] = useState(() =>
    Object.fromEntries(MOCK_CHILDREN.map((c) => [c.id, { ...DEFAULT_SETTINGS }]))
  );
  const [lockByChild, setLockByChild] = useState(() =>
    Object.fromEntries(MOCK_CHILDREN.map((c) => [c.id, { isLocked: false, lockedAt: null }]))
  );
  const [auditByChild, setAuditByChild] = useState(() =>
    Object.fromEntries(MOCK_CHILDREN.map((c) => [c.id, [...(MOCK_AUDIT_LOG[c.id] ?? [])]]))
  );

  const settings = settingsByChild[activeChildId];
  const lockState = lockByChild[activeChildId];
  const auditLog = auditByChild[activeChildId] ?? [];

  const pushAuditEntry = (childId, entry) => {
    setAuditByChild((prev) => ({
      ...prev,
      [childId]: [{ id: `a${Date.now()}`, time: "Vừa xong", ...entry }, ...(prev[childId] ?? [])].slice(0, 8),
    }));
  };

  /*  Autosave feedback  */
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved
  const saveTimers = useRef({ toSaved: null, toIdle: null });

  const updateSettings = (patch) => {
    setSettingsByChild((prev) => ({
      ...prev,
      [activeChildId]: { ...prev[activeChildId], ...patch },
    }));
    // TODO API: PATCH /api/v1/parental/children/:childId/settings { ...patch }
    // → cần model Prisma `ParentalSettings` (1-1 với ChildProfile), lưu server-side
    // để chống lách bằng cách đổi giờ máy/thoát app/gỡ cài lại.
    clearTimeout(saveTimers.current.toSaved);
    clearTimeout(saveTimers.current.toIdle);
    setSaveStatus("saving");
    saveTimers.current.toSaved = setTimeout(() => setSaveStatus("saved"), 450);
    saveTimers.current.toIdle = setTimeout(() => setSaveStatus("idle"), 2600);
  };

  useEffect(() => {
    return () => {
      clearTimeout(saveTimers.current.toSaved);
      clearTimeout(saveTimers.current.toIdle);
    };
  }, []);

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

  const requestLock = () => setLockConfirmOpen(true);
  const confirmLock = () => {
    setLockByChild((prev) => ({
      ...prev,
      [activeChildId]: { isLocked: true, lockedAt: new Date() },
    }));
    pushAuditEntry(activeChildId, { type: "lock", text: `Bạn đã khóa AR cho ${activeChild.name}` });
    setLockConfirmOpen(false);
    toast.success(`Đã khóa AR trên thiết bị của ${activeChild.name}`);
    // TODO API: POST /api/v1/parental/children/:childId/lock
    // → nên đẩy qua push notification (FCM/APNs) tới thiết bị con để có
    // hiệu lực ngay cả khi app không mở; nếu thiết bị mất mạng, lệnh cần
    // được xếp hàng đợi và áp dụng ngay khi có mạng trở lại.
  };

  const requestUnlock = () => setUnlockPinOpen(true);
  const confirmUnlock = () => {
    setLockByChild((prev) => ({
      ...prev,
      [activeChildId]: { isLocked: false, lockedAt: null },
    }));
    pushAuditEntry(activeChildId, { type: "unlock", text: `Bạn đã mở khóa AR cho ${activeChild.name}` });
    setUnlockPinOpen(false);
    toast.success("Đã mở khóa");
    // TODO API: POST /api/v1/parental/children/:childId/unlock (kèm PIN đã xác thực)
  };

  const activeChild = MOCK_CHILDREN.find((c) => c.id === activeChildId);
  const deviceStatus = MOCK_DEVICE_STATUS[activeChildId] ?? { online: false, lastActiveLabel: "" };
  const todayMinutes = MOCK_TODAY_MINUTES[activeChildId] ?? 0;
  const weeklyMinutes = MOCK_WEEKLY_MINUTES[activeChildId] ?? [];
  const sessions = MOCK_SESSIONS[activeChildId] ?? [];
  const weekMax = Math.max(...weeklyMinutes, settings.dailyLimitMinutes, 1);
  const weekTotal = weeklyMinutes.reduce((a, b) => a + b, 0);
  const weekAvg = weeklyMinutes.length ? weekTotal / weeklyMinutes.length : 0;

  // Xu hướng hôm nay so với trung bình tuần — quy ra badge tăng/giảm
  const trendDeltaPct = weekAvg > 0 ? Math.round(((todayMinutes - weekAvg) / weekAvg) * 100) : 0;
  const trendDirection = trendDeltaPct <= -5 ? "down" : trendDeltaPct >= 5 ? "up" : "flat";

  /*  PIN change modal  */
  const [pinModal, setPinModal] = useState(null); // null | 'old' | 'otp' | 'new' | 'confirm'
  const [isForgotFlow, setIsForgotFlow] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));
  const [otpSending, setOtpSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const openChangePin = () => {
    setIsForgotFlow(false);
    setOldPin("");
    setPinError("");
    setPinModal("old");
  };
  const openForgotPin = () => {
    setIsForgotFlow(true);
    setPinError("");
    sendOtp();
    setPinModal("otp");
  };
  const closePinModal = () => {
    setPinModal(null);
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
    setOtpValues(Array(6).fill(""));
    setPinError("");
  };

  const submitOldPin = () => {
    // TODO API: POST /api/v1/parental/pin/verify { pin: oldPin }
    if (oldPin !== MOCK_CORRECT_PIN) {
      setPinError("Mã PIN cũ không đúng.");
      return;
    }
    setPinError("");
    sendOtp();
    setPinModal("otp");
  };

  const sendOtp = () => {
    setOtpSending(true);
    setOtpValues(Array(6).fill(""));
    // TODO API: POST /api/v1/parental/pin/otp/send — dùng lại sendOtpEmail() ở
    // emailService.js hiện có, TTL 10 phút, one-time-use, rate-limit số lần gửi.
    setTimeout(() => {
      setOtpSending(false);
      setResendCooldown(60);
      toast.success("Đã gửi mã OTP tới email của bạn");
    }, 700);
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
    // TODO API: POST /api/v1/parental/pin/otp/verify { code }
    setPinError("");
    setPinModal("new");
  };

  const submitNewPin = () => {
    if (!/^[0-9]{4}$/.test(newPin)) {
      setPinError("Mã PIN gồm đúng 4 chữ số.");
      return;
    }
    setPinError("");
    setPinModal("confirm");
  };
  const submitConfirmPin = () => {
    if (confirmPin !== newPin) {
      setPinError("Hai mã PIN không khớp, thử lại nhé.");
      return;
    }
    // TODO API: POST /api/v1/parental/pin/change { newPinHash }
    // → hash Argon2/bcrypt ở backend trước khi lưu, KHÔNG BAO GIỜ lưu plaintext.
    pushAuditEntry(activeChildId, {
      type: "settings",
      text: isForgotFlow ? "Bạn đã đặt lại mã PIN mới" : "Bạn đã đổi mã PIN",
    });
    toast.success(isForgotFlow ? "Đã đặt lại mã PIN mới" : "Đã đổi mã PIN thành công");
    closePinModal();
  };

  /*  Unlock PIN attempt (mini flow)  */
  const [unlockPinDigits, setUnlockPinDigits] = useState(["", "", "", ""]);
  const [unlockAttempts, setUnlockAttempts] = useState(0);
  const [unlockError, setUnlockError] = useState("");
  const unlockRefs = useRef([]);
  const isLockedOut = unlockAttempts >= MAX_PIN_ATTEMPTS;

  const handleUnlockDigit = (idx, val) => {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    setUnlockPinDigits((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < 3) unlockRefs.current[idx + 1]?.focus();
  };
  const submitUnlockPin = () => {
    const pin = unlockPinDigits.join("");
    if (pin.length < 4) return;
    if (pin !== MOCK_CORRECT_PIN) {
      // TODO API: giới hạn số lần nhập sai PIN/OTP ở backend, sau nhiều lần
      // sai thì tạm khóa (không chỉ chặn ở client như bản mock này).
      setUnlockAttempts((n) => n + 1);
      setUnlockError("Mã PIN không đúng.");
      setUnlockPinDigits(["", "", "", ""]);
      unlockRefs.current[0]?.focus();
      return;
    }
    setUnlockError("");
    setUnlockAttempts(0);
    setUnlockPinDigits(["", "", "", ""]);
    confirmUnlock();
  };

  /*  Scrollspy: mục lục tự nhận diện section đang xem + trạng thái "dính"  */
  useEffect(() => {
    const sectionEls = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!sectionEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] }
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
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  return (
    <div className="pkd-page">
      {/*  Header  */}
      <div className="pkd-header">
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
                Quản lý giờ xem AR, quy tắc 20-20-20, và bảo vệ mắt cho con của bạn.
              </p>
            </div>

            <div className="pkd-sync-wrap">
              <span className="pkd-device-status">
                <span className={`pkd-status-dot ${deviceStatus.online ? "" : "is-offline"}`} />
                {deviceStatus.online ? <Wifi size={12} /> : <WifiOff size={12} />}
                Thiết bị của {activeChild.name}: {deviceStatus.lastActiveLabel}
              </span>
              <span className={`pkd-autosave ${saveStatus !== "idle" ? "is-visible" : ""} is-${saveStatus}`} aria-live="polite">
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

          {/* Child switcher */}
          <div className="pkd-child-row">
            {MOCK_CHILDREN.map((child) => {
              const mins = MOCK_TODAY_MINUTES[child.id] ?? 0;
              const limit = settingsByChild[child.id]?.dailyLimitMinutes ?? 60;
              const pct = clamp((mins / limit) * 100, 0, 100);
              const locked = lockByChild[child.id]?.isLocked;
              const status = MOCK_DEVICE_STATUS[child.id];
              return (
                <button
                  key={child.id}
                  className={`pkd-child-card ${activeChildId === child.id ? "is-active" : ""}`}
                  onClick={() => setActiveChildId(child.id)}
                  type="button"
                >
                  <span className="pkd-child-avatar-wrap">
                    <span className="pkd-child-avatar">{child.letter}</span>
                    <span className={`pkd-child-status-dot ${status?.online ? "" : "is-offline"}`} />
                  </span>
                  <span className="pkd-child-info">
                    <span className="pkd-child-name">
                      {child.name}
                      {locked && (
                        <span className="pkd-child-lock-tag">
                          <Lock size={9} /> Đã khóa
                        </span>
                      )}
                    </span>
                    <span className="pkd-child-meta">
                      {child.age} tuổi <span className="pkd-child-meta-sep">·</span> {status?.online ? "Đang hoạt động" : "Ngoại tuyến"}
                    </span>
                    <span className="pkd-child-bar">
                      <span className={`pkd-child-bar-fill ${pct >= 100 ? "is-over" : ""}`} style={{ width: `${pct}%` }} />
                    </span>
                    <span className="pkd-child-mins">
                      {formatMinutes(mins)} / {formatMinutes(limit)} hôm nay
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section quick-nav — dính lại khi cuộn, tự nhận diện mục đang xem */}
        <div className="pkd-header-inner" style={{ paddingBottom: 0 }}>
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
        </div>
        <div style={{ height: 32 }} />
      </div>

      <div className="pkd-body">
        {/* ═══════════ OVERVIEW ═══════════ */}
        <section id="overview" className="pkd-section">
          <RevealCard as="div" className="pkd-section-head">
            <span className="pkd-section-eyebrow">Hôm nay</span>
            <h2 className="pkd-section-title">Tổng quan</h2>
          </RevealCard>
          <div className="pkd-overview-grid">
            <RevealCard className="pkd-stat-card">
              <div className="pkd-stat-icon-row">
                <span className="pkd-stat-icon-box">
                  <Clock size={16} />
                </span>
                {trendDirection !== "flat" && (
                  <span className={`pkd-trend is-${trendDirection}`}>
                    {trendDirection === "down" ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
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
              <div className="pkd-stat-label">Đã xem hôm nay · so với TB tuần</div>
            </RevealCard>

            <RevealCard className="pkd-stat-card" delay={60}>
              <div className="pkd-stat-icon-row">
                <span className="pkd-stat-icon-box">
                  <CalendarClock size={16} />
                </span>
              </div>
              <div className="pkd-stat-val">{formatMinutes(settings.dailyLimitMinutes)}</div>
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

            <RevealCard className={`pkd-stat-card ${lockState.isLocked ? "is-danger" : ""}`} delay={180}>
              <div className="pkd-stat-icon-row">
                <span className="pkd-stat-icon-box">
                  {lockState.isLocked ? (
                    <Lock size={16} className="pkd-icon-danger" />
                  ) : (
                    <ShieldCheck size={16} className="pkd-icon-ok" />
                  )}
                </span>
              </div>
              <div className="pkd-stat-val">{lockState.isLocked ? "Đã khóa" : "Đang mở"}</div>
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
              <button className="pkd-mini-btn pf-btn-tactile" onClick={requestUnlock} type="button">
                <Unlock size={13} /> Mở khóa
              </button>
            </RevealCard>
          )}
        </section>

        {/* ═══════════ TIME RULES ═══════════ */}
        <section id="time-rules" className="pkd-section">
          <RevealCard as="div" className="pkd-section-head">
            <span className="pkd-section-eyebrow">Tuỳ chỉnh</span>
            <h2 className="pkd-section-title">Quản lý giờ giấc</h2>
            <p className="pkd-section-sub">
              Mọi giới hạn được tính theo giờ máy chủ và đồng bộ theo tài khoản, không phụ thuộc
              vào giờ trên thiết bị của con — nên không thể "lách" bằng cách chỉnh giờ máy, thoát
              app, hay gỡ cài lại.
            </p>
          </RevealCard>

          <RevealCard className="pkd-card">
            <div className="pkd-card-title-row">
              <Clock size={16} />
              <span>Giới hạn thời gian mỗi ngày</span>
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
              title="Quy tắc 20-20-20"
              desc="Cứ mỗi khoảng thời gian xem, hiện popup nhắc nhìn xa kèm đếm ngược. Trẻ có thể tắt popup, hoặc bạn tắt hẳn quy tắc này ở đây."
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
              title="Khung giờ được phép xem"
              desc="Ngoài khung giờ này, AR sẽ không mở được — dù còn hạn mức trong ngày."
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
                      value={settings.allowStart}
                      onChange={(e) => updateSettings({ allowStart: e.target.value })}
                    />
                  </div>
                  <ChevronRight size={14} className="pkd-time-arrow" />
                  <div className="pkd-time-field">
                    <label>Đến</label>
                    <input
                      type="time"
                      value={settings.allowEnd}
                      onChange={(e) => updateSettings({ allowEnd: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pkd-timeline">
                  <div className="pkd-timeline-head">
                    <span>Trực quan 24 giờ</span>
                    <span>Hiện tại: {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="pkd-timeline-track">
                    <div
                      className="pkd-timeline-allowed"
                      style={{ left: `${startPct}%`, width: `${Math.max(endPct - startPct, 1)}%` }}
                    />
                    <div className="pkd-timeline-now" style={{ left: `${nowPct}%` }} />
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
                    onChange={(v) => updateSettings({ breakDurationMinutes: v })}
                    min={5}
                    max={30}
                    step={5}
                  />
                </div>
              </div>
            )}
          </RevealCard>
        </section>

        {/* ═══════════ REPORTS ═══════════ */}
        <section id="reports" className="pkd-section">
          <RevealCard as="div" className="pkd-section-head">
            <span className="pkd-section-eyebrow">Dữ liệu 7 ngày</span>
            <h2 className="pkd-section-title">Báo cáo & theo dõi</h2>
          </RevealCard>

          <RevealCard className="pkd-card">
            <div className="pkd-card-title-row">
              <span>Thời gian xem trong tuần</span>
              <span className="pkd-week-total">{formatMinutes(weekTotal)} tổng cộng</span>
            </div>
            <div className="pkd-chart-plot">
              <div className="pkd-chart">
                <div
                  className="pkd-chart-avg-line"
                  style={{ bottom: `${clamp((weekAvg / weekMax) * 100, 0, 100)}%` }}
                >
                  <span className="pkd-chart-avg-label">TB {formatMinutes(Math.round(weekAvg))}</span>
                </div>
                {weeklyMinutes.map((mins, i) => {
                  const h = clamp((mins / weekMax) * 100, 4, 100);
                  const overLimit = mins > settings.dailyLimitMinutes;
                  const isToday = i === TODAY_INDEX;
                  return (
                    <div className={`pkd-chart-col ${isToday ? "is-today" : ""}`} key={i}>
                      <div className="pkd-chart-bar-wrap">
                        <div className="pkd-chart-tooltip">
                          <strong>{WEEK_LABELS[i]}</strong> · {formatMinutes(mins)}
                        </div>
                        <div className={`pkd-chart-bar ${overLimit ? "is-over" : ""}`} style={{ height: `${h}%` }} />
                      </div>
                      <span className="pkd-chart-label">{isToday ? "Hôm nay" : WEEK_LABELS[i]}</span>
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
              <BookOpen size={16} />
              <span>Sách AR đã xem gần đây</span>
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
                    <span className="pkd-book-mins">{formatMinutes(s.minutes)}</span>
                  </div>
                ))}
              </div>
            )}
          </RevealCard>

          <RevealCard className="pkd-card">
            <div className="pkd-card-title-row">
              <History size={16} />
              <span>Nhật ký hoạt động</span>
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
                    <span className={`pkd-audit-icon ${a.type === "lock" ? "is-danger" : ""}`}>{auditIcon(a.type)}</span>
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
              <Bell size={16} />
              <span>Thông báo cho phụ huynh</span>
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
                  onChange={(e) => updateSettings({ notifyOnLimitExceeded: e.target.checked })}
                />
                Khi con vượt giới hạn thời gian trong ngày
              </label>
              <label className="pkd-checkbox-row">
                <input
                  type="checkbox"
                  checked={settings.notifyOnSkippedRest}
                  onChange={(e) => updateSettings({ notifyOnSkippedRest: e.target.checked })}
                />
                Khi con bỏ qua nhắc nghỉ mắt nhiều lần
              </label>
            </div>
          </RevealCard>
        </section>

        {/* ═══════════ EYE CARE ═══════════ */}
        <section id="eye-care" className="pkd-section">
          <RevealCard as="div" className="pkd-section-head">
            <span className="pkd-section-eyebrow">Sức khoẻ thị lực</span>
            <h2 className="pkd-section-title">Nhắc bảo vệ mắt</h2>
            <p className="pkd-section-sub">
              Chỉ là gợi ý mềm hiển thị dạng thẻ nhỏ, không chặn màn hình — không cần quyền camera
              hay cảm biến của thiết bị.
            </p>
          </RevealCard>

          <RevealCard className="pkd-card">
            <SwitchRow
              title="Hiện thẻ mẹo bảo vệ mắt"
              desc="Xoay vòng các mẹo ngắn về khoảng cách, tư thế và ánh sáng màn hình."
              checked={settings.tipsEnabled}
              onChange={(v) => updateSettings({ tipsEnabled: v })}
            />
            {settings.tipsEnabled && (
              <>
                <div className="pkd-subfield pkd-subfield-block">
                  <label>Tần suất hiện</label>
                  <select
                    className="pkd-select"
                    value={settings.tipsFrequency}
                    onChange={(e) => updateSettings({ tipsFrequency: e.target.value })}
                  >
                    <option value="open">Mỗi lần mở app</option>
                    <option value="interval">Mỗi 15 phút</option>
                    <option value="rest">Mỗi lần đến giờ nghỉ mắt</option>
                  </select>
                </div>

                <div className="pkd-tip-preview">
                  <div className="pkd-tip-preview-head">
                    <Info size={13} /> Xem trước thẻ mẹo
                  </div>
                  <div className={`pkd-tip-card ${tipCycling ? "is-cycling" : ""}`}>
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
                  <button type="button" className="pkd-mini-btn pf-btn-tactile" onClick={cycleTip}>
                    <RefreshCcw size={12} /> Xem mẫu khác
                  </button>
                </div>
              </>
            )}
          </RevealCard>
        </section>

        {/* ═══════════ SECURITY ═══════════ */}
        <section id="security" className="pkd-section">
          <RevealCard as="div" className="pkd-section-head">
            <span className="pkd-section-eyebrow">Kiểm soát truy cập</span>
            <h2 className="pkd-section-title">Bảo mật & khóa từ xa</h2>
          </RevealCard>

          <RevealCard className="pkd-trust-badge">
            <ShieldCheck size={18} />
            <span>
              <strong>Mọi lệnh khóa và mã PIN đều được mã hoá.</strong> PIN được băm (hash) trước
              khi lưu — không ai, kể cả Earthoria, có thể xem lại mã gốc.
            </span>
          </RevealCard>

          <RevealCard className="pkd-card">
            <div className="pkd-card-title-row">
              <ShieldCheck size={16} />
              <span>Điều khiển tức thời</span>
            </div>
            <p className="pkd-section-sub" style={{ marginBottom: 18 }}>
              Dùng khi cần tạm dừng ngay lập tức (họp phụ huynh, giờ ăn đột xuất...). Lệnh khóa
              được gửi ngay khi thiết bị có mạng; nếu đang mất mạng, lệnh sẽ được áp dụng ngay khi
              thiết bị kết nối trở lại.
            </p>
            {lockState.isLocked ? (
              <button className="pkd-lock-btn is-unlock pf-btn-tactile" onClick={requestUnlock}>
                <Unlock size={16} /> Mở khóa cho {activeChild.name}
              </button>
            ) : (
              <button className="pkd-lock-btn is-lock pf-btn-tactile" onClick={requestLock}>
                <Lock size={16} /> Khóa ngay cho {activeChild.name}
              </button>
            )}
          </RevealCard>

          <RevealCard className="pkd-card">
            <div className="pkd-card-title-row">
              <KeyRound size={16} />
              <span>Mã PIN phụ huynh</span>
            </div>
            <p className="pkd-section-sub" style={{ marginBottom: 18 }}>
              Mã PIN dùng để mở khóa AR và xác nhận các thao tác quan trọng.
            </p>
            <div className="pkd-pin-actions">
              <button className="pkd-mini-btn pf-btn-tactile" onClick={openChangePin} type="button">
                <KeyRound size={13} /> Đổi mã PIN
              </button>
              <button className="pkd-text-link" onClick={openForgotPin} type="button">
                Quên mã PIN?
              </button>
            </div>
          </RevealCard>
        </section>
      </div>

      {/* ═══════════ MODAL: Xác nhận khóa ═══════════ */}
      {lockConfirmOpen && (
        <ModalShell onClose={() => setLockConfirmOpen(false)}>
          <div className="pf-confirm-icon danger">
            <Lock size={18} />
          </div>
          <h3 className="pf-confirm-title">Khóa AR ngay bây giờ?</h3>
          <p className="pf-confirm-msg">
            {activeChild.name} sẽ không thể mở sách AR nào cho đến khi bạn mở khóa lại bằng mã PIN.
          </p>
          <div className="pf-confirm-actions">
            <button className="pf-confirm-cancel pf-btn-tactile" onClick={() => setLockConfirmOpen(false)}>
              Hủy
            </button>
            <button className="pf-confirm-ok danger pf-btn-tactile" onClick={confirmLock}>
              Khóa ngay
            </button>
          </div>
        </ModalShell>
      )}

      {/* ═══════════ MODAL: Nhập PIN để mở khóa ═══════════ */}
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
          <p className="pf-confirm-msg">Chỉ phụ huynh mới mở khóa được. Trẻ không thể tự bấm mở.</p>

          {isLockedOut ? (
            <div className="pkd-lockout-msg">
              <AlertTriangle size={14} /> Bạn đã nhập sai quá {MAX_PIN_ATTEMPTS} lần. Vui lòng thử
              lại sau ít phút hoặc dùng "Quên mã PIN?".
            </div>
          ) : (
            <>
              <div className="otp-inputs" style={{ maxWidth: 220, margin: "20px auto" }}>
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
              {unlockError && <p className="pf-field-error" style={{ textAlign: "center" }}>{unlockError}</p>}
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
              <button className="pf-confirm-ok pf-btn-tactile" onClick={submitUnlockPin}>
                Xác nhận
              </button>
            )}
          </div>
        </ModalShell>
      )}

      {/* ═══════════ MODAL: Đổi / Quên mã PIN (multi-step) ═══════════ */}
      {pinModal && (
        <ModalShell onClose={closePinModal} wide>
          {/* Step indicator */}
          <div className="pkd-pin-steps">
            {(isForgotFlow ? ["otp", "new", "confirm"] : ["old", "otp", "new", "confirm"]).map(
              (step) => (
                <span key={step} className={`pkd-pin-step-dot ${pinModal === step ? "is-active" : ""}`} />
              )
            )}
          </div>

          {pinModal === "old" && (
            <div className="auth-otp-step">
              <div className="pf-confirm-icon">
                <KeyRound size={18} />
              </div>
              <h3 className="pf-confirm-title">Nhập mã PIN hiện tại</h3>
              <p className="pf-confirm-msg">Xác nhận mã PIN cũ trước khi đặt mã mới.</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                className={`pf-pw-input ${pinError ? "has-error" : ""}`}
                placeholder="••••"
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/[^0-9]/g, ""))}
                style={{ textAlign: "center", letterSpacing: "10px", fontSize: 20 }}
              />
              {pinError && <p className="pf-field-error">{pinError}</p>}
              <div className="pf-confirm-actions">
                <button className="pf-confirm-cancel pf-btn-tactile" onClick={closePinModal}>
                  Hủy
                </button>
                <button className="pf-confirm-ok pf-btn-tactile" onClick={submitOldPin}>
                  Tiếp tục
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
              <p className="pf-confirm-msg">Mã xác thực đã được gửi tới email của bạn.</p>
              <div className="otp-email-mask">p•••••@earthoria.id.vn</div>
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
              {pinError && <p className="pf-field-error" style={{ textAlign: "center" }}>{pinError}</p>}
              <div className="otp-resend">
                Chưa nhận được mã?
                <button type="button" disabled={resendCooldown > 0} onClick={sendOtp}>
                  {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : "Gửi lại mã"}
                </button>
              </div>
              <div className="pf-confirm-actions">
                <button className="pf-confirm-cancel pf-btn-tactile" onClick={closePinModal}>
                  Hủy
                </button>
                <button className="pf-confirm-ok pf-btn-tactile" onClick={submitOtp} disabled={otpSending}>
                  {otpSending ? <Loader2 size={14} className="pkd-spin" /> : "Xác nhận"}
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
              <p className="pf-confirm-msg">Chọn 4 chữ số dễ nhớ nhưng không quá đơn giản.</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                className={`pf-pw-input ${pinError ? "has-error" : ""}`}
                placeholder="••••"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ""))}
                style={{ textAlign: "center", letterSpacing: "10px", fontSize: 20 }}
              />
              {pinError && <p className="pf-field-error">{pinError}</p>}
              <div className="pf-confirm-actions">
                <button className="pf-confirm-cancel pf-btn-tactile" onClick={closePinModal}>
                  Hủy
                </button>
                <button className="pf-confirm-ok pf-btn-tactile" onClick={submitNewPin}>
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
              <p className="pf-confirm-msg">Xác nhận lại để chắc chắn không gõ nhầm.</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                className={`pf-pw-input ${pinError ? "has-error" : ""}`}
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ""))}
                style={{ textAlign: "center", letterSpacing: "10px", fontSize: 20 }}
              />
              {pinError && <p className="pf-field-error">{pinError}</p>}
              <div className="pf-confirm-actions">
                <button className="pf-confirm-cancel pf-btn-tactile" onClick={closePinModal}>
                  Hủy
                </button>
                <button className="pf-confirm-ok pf-btn-tactile" onClick={submitConfirmPin}>
                  <Check size={14} /> Lưu mã PIN
                </button>
              </div>
            </div>
          )}
        </ModalShell>
      )}
    </div>
  );
}