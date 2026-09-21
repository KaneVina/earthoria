import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { authService } from "../../services/authService";
import { settingsService } from "../../services/settingsService";
import { useAuthStore } from "../../store/authStore";
import "../../components/assets/css/adminPortal.css";

const WEEKDAYS_VI = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatClock(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDate(date) {
  return `${WEEKDAYS_VI[date.getDay()]}, ${pad(date.getDate())}/${pad(
    date.getMonth() + 1,
  )}/${date.getFullYear()}`;
}

// Sinh vị trí + độ trễ ngẫu nhiên (nhưng ổn định trong suốt vòng đời trang) cho
// các đốm sáng trôi nổi phía sau - chỉ để tạo chiều sâu, không mang thông tin.
function makeFireflies(count = 16) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.round(Math.random() * 100)}%`,
    top: `${Math.round(Math.random() * 100)}%`,
    delay: `${(Math.random() * 8).toFixed(2)}s`,
    duration: `${(9 + Math.random() * 10).toFixed(2)}s`,
    size: `${(2 + Math.random() * 3).toFixed(1)}px`,
  }));
}

export default function AdminPortalLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  // Google OAuth có thể bounce ngược về đây kèm ?error=forbidden (tài khoản
  // không phải admin/staff) hoặc ?error=google_failed (bị huỷ/không hợp lệ).
  // Đọc thẳng từ URL ngay trong lazy initializer của useState thay vì
  // useEffect+setState, tránh render lồng không cần thiết ngay khi mount.
  const [formError, setFormError] = useState(() => {
    const err = searchParams.get("error");
    if (err === "forbidden") {
      return "Tài khoản Google này không có quyền truy cập khu vực quản trị. Vui lòng đăng nhập bằng tài khoản Quản trị viên hoặc Nhân viên.";
    }
    if (err === "google_failed") {
      return "Đăng nhập Google thất bại hoặc đã bị huỷ. Vui lòng thử lại.";
    }
    return null;
  });
  const [accessGranted, setAccessGranted] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null);
  const [now, setNow] = useState(() => new Date());

  const fireflies = useMemo(() => makeFireflies(16), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { data: siteSettings } = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: () => settingsService.getPublic().then((r) => r.data.data),
    staleTime: 30 * 1000,
    retry: 1,
  });
  const maintenanceOn = Boolean(siteSettings?.maintenanceActive);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const onSubmit = async (data) => {
    setFormError(null);
    try {
      setLoading(true);
      const res = await authService.staffLogin(data);
      const { user, accessToken } = res.data.data;
      setPendingAuth({ user, accessToken });
      setAccessGranted(true);
    } catch (err) {
      setLoading(false);
      const message =
        err.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      setFormError(message);
    }
  };

  const handleGoogleClick = () => {
    setFormError(null);
    const apiUrl =
      import.meta.env.VITE_API_URL || "https://earthoria.onrender.com/api/v1";
    window.location.href = `${apiUrl}/auth/google?portal=admin`;
  };

  const handleAccessGrantedComplete = () => {
    if (pendingAuth) setAuth(pendingAuth.user, pendingAuth.accessToken);
    navigate("/dashboard", { replace: true });
  };

  // Giữ màn "truy cập được cấp" hiển thị một nhịp ngắn rồi mới điều hướng,
  // tách khỏi thời lượng animation fade-in để không phụ thuộc framer-motion.
  useEffect(() => {
    if (!accessGranted) return;
    const t = setTimeout(handleAccessGrantedComplete, 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessGranted]);

  return (
    <main className="ap-root">
      {/* Nền: gradient tối + lưới kỹ thuật + đốm sáng trôi nổi */}
      <div className="ap-bg" aria-hidden="true">
        <div className="ap-bg-grid" />
        <div className="ap-bg-glow ap-bg-glow-1" />
        <div className="ap-bg-glow ap-bg-glow-2" />
        {fireflies.map((f) => (
          <span
            key={f.id}
            className="ap-firefly"
            style={{
              left: f.left,
              top: f.top,
              width: f.size,
              height: f.size,
              animationDelay: f.delay,
              animationDuration: f.duration,
            }}
          />
        ))}
        <div className="ap-bg-vignette" />
      </div>

      {/* Thanh trên cùng */}
      <div className="ap-topbar">
        <Link to="/" className="ap-back-link">
          <ArrowLeft size={14} />
          <span>Về trang chủ Earthoria</span>
        </Link>

        <div className="ap-status-cluster">
          <span
            className={`ap-status-pill${maintenanceOn ? " is-warning" : ""}`}
          >
            <span className="ap-status-dot" />
            {maintenanceOn
              ? "Hệ thống đang bảo trì"
              : "Hệ thống hoạt động ổn định"}
          </span>
          <span className="ap-clock">
            <span className="ap-clock-time">{formatClock(now)}</span>
            <span className="ap-clock-date">{formatDate(now)}</span>
          </span>
        </div>
      </div>

      {/* Thẻ đăng nhập */}
      <div className="ap-stage">
        <motion.div
          className="ap-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="ap-card-ring" aria-hidden="true" />

          <div className="ap-badge">
            <span className="ap-badge-ring" />
            <img src="/logo-nho.png" alt="" className="ap-badge-logo" />
            <span className="ap-badge-shield">
              <ShieldCheck size={13} strokeWidth={2.4} />
            </span>
          </div>

          <div className="ap-eyebrow">
            <span className="ap-eyebrow-line" />
            <span>Cổng Quản Trị Nội Bộ</span>
            <span className="ap-eyebrow-line" />
          </div>

          <h1 className="ap-title">
            Đăng nhập vào <em>hệ thống</em>
          </h1>
          <p className="ap-subtitle">
            Dành riêng cho Quản trị viên &amp; Nhân viên Earthoria. Mọi yêu cầu
            truy cập đều được ghi nhận và giám sát.
          </p>

          <AnimatePresence>
            {formError && (
              <motion.div
                className="ap-alert"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 18 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
              >
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            className="ap-google-btn"
            onClick={handleGoogleClick}
            disabled={loading || accessGranted}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Tiếp tục với Google
          </button>

          <div className="ap-divider">
            <span className="ap-divider-line" />
            <span className="ap-divider-text">hoặc dùng tài khoản nội bộ</span>
            <span className="ap-divider-line" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="ap-field">
              <label htmlFor="ap-email">Email quản trị</label>
              <div
                className={`ap-input-wrap${errors.email ? " has-error" : ""}`}
              >
                <Mail size={16} className="ap-input-icon" />
                <input
                  id="ap-email"
                  type="email"
                  autoComplete="username"
                  placeholder="ten@earthoria.id.vn"
                  {...register("email", { required: "Vui lòng nhập email" })}
                />
              </div>
              {errors.email && (
                <p className="ap-field-error">{errors.email.message}</p>
              )}
            </div>

            <div className="ap-field">
              <label htmlFor="ap-password">Mật khẩu</label>
              <div
                className={`ap-input-wrap${errors.password ? " has-error" : ""}`}
              >
                <Lock size={16} className="ap-input-icon" />
                <input
                  id="ap-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Mật khẩu của bạn"
                  {...register("password", {
                    required: "Vui lòng nhập mật khẩu",
                  })}
                />
                <button
                  type="button"
                  className="ap-pw-toggle"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="ap-field-error">{errors.password.message}</p>
              )}
            </div>

            <div className="ap-row-between">
              <label className="ap-remember">
                <input type="checkbox" {...register("remember")} />
                <span className="ap-checkbox">
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <polyline
                      points="2 6 5 9 10 3"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      fill="none"
                    />
                  </svg>
                </span>
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="ap-forgot-link">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              className="ap-submit"
              disabled={loading || accessGranted}
            >
              {loading ? (
                <Loader2 size={17} className="ap-spin" />
              ) : (
                <>
                  <span>Truy cập bảng điều khiển</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="ap-footnote">
            <ShieldCheck size={13} />
            <span>
              Kết nối được mã hoá &amp; mọi phiên đăng nhập được lưu vết bảo
              mật.
            </span>
          </div>
        </motion.div>

        <p className="ap-copyright">
          © {now.getFullYear()} Earthoria · Hệ thống nội bộ, không dành cho
          khách hàng
        </p>
      </div>

      {/* Hiệu ứng "truy cập được cấp" khi đăng nhập thành công */}
      <AnimatePresence>
        {accessGranted && (
          <motion.div
            className="ap-grant-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="ap-grant-ring">
              <span className="ap-grant-pulse" />
              <span className="ap-grant-pulse ap-grant-pulse-2" />
              <CheckCircle2 size={40} strokeWidth={1.6} />
            </div>
            <p className="ap-grant-title">Truy cập được cấp</p>
            <p className="ap-grant-sub">Đang chuyển đến bảng điều khiển…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
