import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Sun, Moon } from "lucide-react";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../../hooks/useTheme";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await authService.login(data);
      setAuth(res.data.data.user, res.data.data.token);
      toast.success("Đăng nhập thành công!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      {/* LEFT */}
      <div className="auth-visual">
        <div className="auth-visual-bg"></div>
        <div className="auth-visual-grid"></div>
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>

        <Link to="/" className="auth-visual-logo">
          <div className="auth-visual-mark">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2L14 8L8 14L2 8L8 2Z"
                stroke="#4a9e3f"
                strokeWidth="1"
                fill="none"
              />
              <path d="M8 5L11 8L8 11L5 8L8 5Z" fill="#4a9e3f" />
            </svg>
          </div>
          <span className="auth-visual-wordmark">EARTHORIA</span>
        </Link>

        <div className="auth-visual-content">
          <p className="auth-visual-tagline">Chào mừng trở lại</p>
          <h2 className="auth-visual-headline">
            Tiếp tục
            <br />
            hành trình
            <br />
            <em>khám phá</em>
          </h2>
          <div className="auth-visual-perks">
            {[
              {
                text: (
                  <>
                    <strong>Thư viện sách AR</strong> — hơn 2.400 đầu sách tương
                    tác.
                  </>
                ),
              },
              {
                text: (
                  <>
                    <strong>Học không giới hạn</strong> — đồng bộ trên mọi thiết
                    bị.
                  </>
                ),
              },
              {
                text: (
                  <>
                    <strong>Cộng đồng 180.000+</strong> — chia sẻ và khám phá
                    cùng nhau.
                  </>
                ),
              },
            ].map((p, i) => (
              <div className="auth-perk" key={i}>
                <div className="auth-perk-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="auth-perk-text">{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-visual-quote">
          <p className="auth-quote-text">
            Lời khuyên của tôi là hãy đọc mọi thứ trong tầm mắt và hãy bắt đầu
            từ khi còn rất trẻ.
          </p>
          <span className="auth-quote-author">— Warren Buffett</span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <div className="auth-form-eyebrow">
              <div className="auth-form-eyebrow-line"></div>
              <span className="auth-form-eyebrow-text">Đăng nhập</span>
            </div>
            <h1 className="auth-form-title">
              Xin chào,
              <br />
              <em>người bạn đọc</em>
            </h1>
            <p className="auth-form-subtitle">
              Nhập thông tin để tiếp tục khám phá thư viện của bạn.
            </p>
          </div>

          {/* Google */}
          <div className="auth-social">
            <button
              className="auth-social-btn google-btn"
              type="button"
              onClick={() =>
                (window.location.href =
                  "http://localhost:5000/api/v1/auth/google")
              }
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
          </div>

          <div className="auth-divider">
            <div className="auth-divider-line"></div>
            <span className="auth-divider-text">hoặc đăng nhập bằng email</span>
            <div className="auth-divider-line"></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                marginBottom: "8px",
              }}
            >
              <div className="form-group">
                <label>Địa chỉ email</label>
                <input
                  type="email"
                  placeholder="ten@example.com"
                  className={errors.email ? "error" : ""}
                  {...register("email", { required: "Vui lòng nhập email" })}
                />
                {errors.email && (
                  <p className="field-error">{errors.email.message}</p>
                )}
              </div>

              <div className="form-group">
                <label>Mật khẩu</label>
                <div className="auth-password-wrap">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Mật khẩu của bạn"
                    className={errors.password ? "error" : ""}
                    {...register("password", {
                      required: "Vui lòng nhập mật khẩu",
                    })}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="field-error">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "16px 0 28px",
              }}
            >
              <label className="auth-check-group">
                <input type="checkbox" {...register("remember")} />
                <div className="auth-checkbox">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <polyline points="2 6 5 9 10 3" />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontWeight: 300,
                  }}
                >
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "12px",
                  color: "var(--gold)",
                  textDecoration: "none",
                }}
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ animation: "spin .7s linear infinite" }}
                >
                  <path d="M21 12a9 9 0 1 1-6.22-8.56" />
                </svg>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <svg
                    className="auth-submit-arrow"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="auth-login-link">
            Chưa có tài khoản? <Link to="/register">Đăng ký miễn phí</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
