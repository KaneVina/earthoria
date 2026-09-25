import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  Loader2,
  ShieldCheck,
  Layers,
  ShoppingBag,
  LifeBuoy,
  Activity,
} from "lucide-react";
import { authService } from "../../services/authService";
import { settingsService } from "../../services/settingsService";
import { useAuthStore } from "../../store/authStore";
import "../../components/assets/css/adminPortal.css";

const MODULES = [
  { icon: Layers, title: "Nội dung", desc: "Trò chơi, mã AR, Ebook, tin tức" },
  {
    icon: ShoppingBag,
    title: "Bán hàng",
    desc: "Đơn hàng, mã giảm giá, đánh giá",
  },
  { icon: LifeBuoy, title: "Hỗ trợ", desc: "Yêu cầu hỗ trợ và email" },
  { icon: Activity, title: "Vận hành", desc: "Thống kê và tình trạng máy chủ" },
];

// Các đường đồng mức địa hình (gợi ruộng bậc thang) - tính cố định, không random.
const TERRACES = Array.from({ length: 18 }, (_, i) => {
  let d = "";
  for (let x = 0; x <= 600; x += 15) {
    const y =
      40 +
      i * 18 +
      22 * Math.sin(x / 110 + i * 0.28) +
      9 * Math.sin(x / 47 + i * 0.7);
    d += `${x ? "L" : "M"}${x} ${y.toFixed(1)} `;
  }
  return d;
});

export default function AdminPortalLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  // Google OAuth có thể bounce về đây kèm ?error=forbidden | google_failed.
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
      setFormError(
        err.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
      );
    }
  };

  const handleGoogleClick = () => {
    setFormError(null);
    const apiUrl =
      import.meta.env.VITE_API_URL || "https://earthoria.onrender.com/api/v1";
    window.location.href = `${apiUrl}/auth/google?portal=admin`;
  };

  useEffect(() => {
    if (!accessGranted) return;
    const t = setTimeout(() => {
      if (pendingAuth) setAuth(pendingAuth.user, pendingAuth.accessToken);
      navigate("/dashboard", { replace: true });
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessGranted]);

  const busy = loading || accessGranted;

  return (
    <main className="ap-root">
      <aside className="ap-aside">
        <svg
          className="ap-terrain"
          viewBox="0 0 600 380"
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
        >
          {TERRACES.map((d, i) => (
            <path
              key={i}
              d={d}
              className={i % 4 === 0 ? "is-index" : undefined}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div className="ap-brand">
          <img src="/logo-nho.png" alt="" className="ap-brand-logo" />
          <span>Earthoria</span>
        </div>

        <div className="ap-aside-body">
          <h2>Quản lý mọi hoạt động của Earthoria tại một nơi.</h2>
          <p>Dành cho Quản trị viên và Nhân viên đã được cấp quyền.</p>
          <ul className="ap-modules">
            {MODULES.map(({ icon: Icon, title, desc }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.1 + i * 0.06,
                  ease: "easeOut",
                }}
              >
                <span className="ap-mod-icon">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <strong>{title}</strong>
                <span>{desc}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="ap-aside-foot">
          © {new Date().getFullYear()} Earthoria. Chỉ dành cho nhân sự nội bộ.
        </p>
      </aside>

      <section className="ap-main">
        <div className="ap-main-top">
          <Link to="/" className="ap-back">
            <ArrowLeft size={15} />
            Về trang chủ
          </Link>
          <span className={`ap-status${maintenanceOn ? " is-warn" : ""}`}>
            <i />
            {maintenanceOn ? "Đang bảo trì" : "Hệ thống bình thường"}
          </span>
        </div>

        <motion.div
          className="ap-panel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <h1>Chào mừng trở lại</h1>
          <p className="ap-lead">Đăng nhập để vào bảng điều khiển.</p>

          <AnimatePresence initial={false}>
            {formError && (
              <motion.div
                className="ap-alert"
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            className="ap-google"
            onClick={handleGoogleClick}
            disabled={busy}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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

          <div className="ap-or">
            <span>hoặc</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="ap-field">
              <label htmlFor="ap-email">Email</label>
              <div className="ap-input">
                <Mail size={17} />
                <input
                  id="ap-email"
                  type="email"
                  autoComplete="username"
                  placeholder="ten@earthoria.id.vn"
                  aria-invalid={!!errors.email}
                  {...register("email", { required: "Vui lòng nhập email" })}
                />
              </div>
              {errors.email && <p className="ap-err">{errors.email.message}</p>}
            </div>

            <div className="ap-field">
              <div className="ap-label-row">
                <label htmlFor="ap-password">Mật khẩu</label>
                <Link to="/forgot-password">Quên mật khẩu?</Link>
              </div>
              <div className="ap-input">
                <Lock size={17} />
                <input
                  id="ap-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...register("password", {
                    required: "Vui lòng nhập mật khẩu",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p className="ap-err">{errors.password.message}</p>
              )}
            </div>

            <label className="ap-check">
              <input type="checkbox" {...register("remember")} />
              Ghi nhớ đăng nhập
            </label>

            <button
              type="submit"
              className={`ap-submit${accessGranted ? " is-done" : ""}`}
              disabled={busy}
            >
              {accessGranted ? (
                <>
                  <Check size={18} /> Đăng nhập thành công
                </>
              ) : loading ? (
                <>
                  <Loader2 size={18} className="ap-spin" /> Đang đăng nhập
                </>
              ) : (
                <>
                  Đăng nhập <ArrowRight size={17} className="ap-arrow" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="ap-main-foot">
          <ShieldCheck size={14} />
          Phiên đăng nhập được mã hoá và ghi lại để bảo mật.
        </p>
      </section>
    </main>
  );
}
