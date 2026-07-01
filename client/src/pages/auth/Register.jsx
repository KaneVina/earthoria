import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Shield } from "lucide-react";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import ThreeBookModel from "./ThreeBookModel";

const maskEmail = (email) => {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(4, local.length));
  return `${visible}***@${domain}`;
};

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // ── Register form state ──
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const password = watch("password", "");

  // ── OTP flow state ──
  const [step, setStep] = useState("register"); // "register" | "otp"
  const [pendingData, setPendingData] = useState(null); // { user, token }
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState(null);
  const otpRefs = useRef([]);

  // ── Resend countdown ──
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // ── Auto-focus ô đầu khi vào màn OTP ──
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // ── Password strength ──
  const checkStrength = (val) => {
    let s = 0;
    if (val.length >= 8 && val.length <= 16) s++;
    if (/[A-Z]/.test(val)) s++;
    if (/[a-z]/.test(val)) s++;
    if (/[^A-Za-z0-9]/.test(val)) s++;
    setStrength(s);
  };

  const strengthLabels = ["", "Yếu", "Trung bình", "Tốt", "Mạnh"];
  const strengthColors = [
    "",
    "#e05c5c",
    "#e0a840",
    "var(--sage)",
    "var(--gold)",
  ];
  const strengthClasses = ["", "weak", "fair", "good", "strong"];

  const pwChecks = (val) => ({
    length: val.length >= 8 && val.length <= 16,
    upper: /[A-Z]/.test(val),
    lower: /[a-z]/.test(val),
    special: /[^A-Za-z0-9]/.test(val),
  });
  const checks = pwChecks(password);

  // ════════════════════════════════════════
  // Step 1: Register → sendOtp → vào màn OTP
  // ════════════════════════════════════════
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const email = data.email.trim().toLowerCase();
      const name = `${data.firstname} ${data.lastname}`;

      // Lưu tạm thông tin form để dùng lại khi resend
      setPendingData({ email, name, password: data.password });

      // Gửi OTP — user chưa được tạo trong DB
      await authService.sendRegisterOtp({
        name,
        email,
        password: data.password,
      });

      toast.success(`Mã OTP đã gửi về ${maskEmail(email)}`);
      setResendCooldown(60);
      setStep("otp");
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════
  // Step 2: OTP input handlers
  // ════════════════════════════════════════
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setOtpError(null);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    // Auto-submit khi điền đủ 6 số
    if (next.every((d) => d) && next.join("").length === 6) {
      submitOtp(next.join(""));
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(next);
    if (pasted.length === 6) {
      submitOtp(pasted);
    } else {
      otpRefs.current[pasted.length]?.focus();
    }
  };

  const submitOtp = async (otpStr) => {
    try {
      setOtpLoading(true);
      // Xác thực OTP → backend tạo user thật → trả { user, token }
      const res = await authService.verifyRegisterOtp({
        email: pendingData.email,
        otp: otpStr,
      });
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(`Chào mừng đến với Earthoria, ${user.name}! 🌿`);
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.message || "OTP không đúng hoặc đã hết hạn";
      setOtpError(msg);
      toast.error(msg);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    const otpStr = otp.join("");
    if (otpStr.length < 6) {
      setOtpError("Vui lòng nhập đủ 6 số");
      return;
    }
    submitOtp(otpStr);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !pendingData) return;
    try {
      await authService.sendRegisterOtp({
        name: pendingData.name,
        email: pendingData.email,
        password: pendingData.password,
      });
      toast.success("Đã gửi lại mã OTP!");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setOtpError(null);
      otpRefs.current[0]?.focus();
    } catch (err) {
      toast.error("Không thể gửi lại OTP, thử lại sau.");
    }
  };

  // ════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════
  return (
    <main className="auth-page">
      {/* LEFT — giữ nguyên */}
      <div className="auth-visual">
        <div className="auth-visual-bg"></div>
        <div className="auth-visual-grid"></div>
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
        <div className="auth-visual-content">
          <Link to="/" className="auth-visual-logo">
            <img
              src="/logo-dai-trang.png"
              alt="Earthoria"
              style={{
                height: "36px",
                width: "auto",
                objectFit: "contain",
                marginBottom: "8px",
              }}
            />
          </Link>

          <p className="auth-visual-tagline">Hành trình tri thức</p>
          <h2 className="auth-visual-headline">
            Mở ra
            <br />
            thế giới
            <br />
            <em>vô tận</em>
          </h2>
          <div className="auth-visual-perks">
            {[
              {
                text: (
                  <>
                    <strong>Truy cập toàn bộ thư viện</strong> — hơn 2.400 đầu
                    sách AR tương tác.
                  </>
                ),
              },
              {
                text: (
                  <>
                    <strong>Học không giới hạn thiết bị</strong> — đồng bộ tiến
                    độ tự động.
                  </>
                ),
              },
              {
                text: (
                  <>
                    <strong>Cộng đồng 180.000+</strong> — thảo luận và chia sẻ
                    cùng nhau.
                  </>
                ),
              },
              {
                text: (
                  <>
                    <strong>Miễn phí 30 ngày đầu</strong> — không cần thẻ tín
                    dụng.
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

        {/* ── 3D Book Model ── lấp khoảng trống giữa perks và quote */}
        <ThreeBookModel />

        <div className="auth-visual-quote">
          <p className="auth-quote-text">
            Không phải tất cả độc giả đều là lãnh đạo, nhưng tất cả lãnh đạo đều
            là độc giả.
          </p>
          <span className="auth-quote-author">— Harry Truman</span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          {/* ══════════ BƯỚC OTP ══════════ */}
          {step === "otp" ? (
            <div className="auth-otp-step">
              <div className="auth-form-header">
                <div className="auth-form-eyebrow">
                  <div className="auth-form-eyebrow-line"></div>
                  <span className="auth-form-eyebrow-text">Xác thực email</span>
                </div>
                <h1 className="auth-form-title">
                  Nhập mã
                  <br />
                  <em>xác thực</em>
                </h1>
                <p className="auth-form-subtitle">
                  Chúng tôi đã gửi mã 6 chữ số đến
                </p>
              </div>

              {/* Email bị che */}
              {pendingData && (
                <div className="otp-email-mask">
                  {maskEmail(pendingData.email)}
                </div>
              )}

              {/* 6 ô OTP */}
              <div className="otp-inputs">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    className={`otp-input${digit ? " filled" : ""}${otpError ? " error" : ""}`}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    disabled={otpLoading}
                  />
                ))}
              </div>

              {/* Lỗi OTP */}
              {otpError && (
                <p
                  className="field-error"
                  style={{
                    textAlign: "center",
                    marginTop: "-16px",
                    marginBottom: "12px",
                  }}
                >
                  {otpError}
                </p>
              )}

              {/* Nút xác nhận */}
              <button
                className="auth-submit"
                onClick={handleVerifyOtp}
                disabled={otpLoading || otp.join("").length < 6}
              >
                {otpLoading ? (
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
                    <span>Xác nhận</span>
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

              {/* Gửi lại OTP */}
              <div className="otp-resend">
                <span>Không nhận được mã? </span>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || otpLoading}
                >
                  {resendCooldown > 0
                    ? `Gửi lại sau ${resendCooldown}s`
                    : "Gửi lại OTP"}
                </button>
              </div>

              {/* Quay lại đăng ký */}
              <p className="auth-login-link" style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--gold)",
                    fontFamily: "inherit",
                    fontSize: "inherit",
                    padding: 0,
                    fontWeight: 500,
                  }}
                  onClick={() => {
                    setStep("register");
                    setOtp(["", "", "", "", "", ""]);
                    setOtpError(null);
                  }}
                >
                  ← Quay lại đăng ký
                </button>
              </p>
            </div>
          ) : (
            /* ══════════ BƯỚC ĐĂNG KÝ (giữ nguyên) ══════════ */
            <>
              <div className="auth-form-header">
                <div className="auth-form-eyebrow">
                  <div className="auth-form-eyebrow-line"></div>
                  <span className="auth-form-eyebrow-text">
                    Đăng ký miễn phí
                  </span>
                </div>
                <h1 className="auth-form-title">
                  Tạo tài khoản
                  <br />
                  <em>Earthoria</em>
                </h1>
                <p className="auth-form-subtitle">
                  Bắt đầu hành trình khám phá sách trong 60 giây.
                </p>
              </div>

              <div className="auth-trust-badge">
                <Shield size={14} />
                <span>
                  Dữ liệu được mã hóa an toàn.{" "}
                  <strong>Không chia sẻ cho bên thứ ba.</strong>
                </span>
              </div>

              <div className="auth-social">
                <button
                  className="auth-social-btn google-btn"
                  type="button"
                  onClick={() =>
                (window.location.href =
                  `${import.meta.env.VITE_API_URL || "https://earthoria.onrender.com/api/v1"}/auth/google`)
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
                <span className="auth-divider-text">
                  hoặc đăng ký bằng email
                </span>
                <div className="auth-divider-line"></div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                  }}
                >
                  <div className="auth-field-row">
                    <div className="form-group">
                      <label>Họ</label>
                      <input
                        type="text"
                        placeholder="Nguyễn"
                        className={errors.firstname ? "error" : ""}
                        {...register("firstname", {
                          required: "Vui lòng nhập họ",
                        })}
                      />
                      {errors.firstname && (
                        <p className="field-error">
                          {errors.firstname.message}
                        </p>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Tên</label>
                      <input
                        type="text"
                        placeholder="An"
                        className={errors.lastname ? "error" : ""}
                        {...register("lastname", {
                          required: "Vui lòng nhập tên",
                        })}
                      />
                      {errors.lastname && (
                        <p className="field-error">{errors.lastname.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Địa chỉ email</label>
                    <input
                      type="email"
                      placeholder="earthoria@gmail.com"
                      className={errors.email ? "error" : ""}
                      {...register("email", {
                        required: "Vui lòng nhập email",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Email không hợp lệ",
                        },
                      })}
                    />
                    {errors.email && (
                      <p className="field-error">{errors.email.message}</p>
                    )}
                  </div>

                  {/* MẬT KHẨU */}
                  <div className="form-group">
                    <label>Mật khẩu</label>
                    <div className="auth-password-wrap">
                      <input
                        type={showPw ? "text" : "password"}
                        placeholder="8–16 ký tự, chữ hoa, ký tự đặc biệt"
                        className={errors.password ? "error" : ""}
                        {...register("password", {
                          required: "Vui lòng nhập mật khẩu",
                          minLength: {
                            value: 8,
                            message: "Mật khẩu tối thiểu 8 ký tự",
                          },
                          maxLength: {
                            value: 16,
                            message: "Mật khẩu tối đa 16 ký tự",
                          },
                          validate: {
                            hasUpper: (v) =>
                              /[A-Z]/.test(v) || "Cần ít nhất 1 chữ hoa (A-Z)",
                            hasLower: (v) =>
                              /[a-z]/.test(v) ||
                              "Cần ít nhất 1 chữ thường (a-z)",
                            hasSpecial: (v) =>
                              /[^A-Za-z0-9]/.test(v) ||
                              "Cần ít nhất 1 ký tự đặc biệt (!@#...)",
                          },
                          onChange: (e) => checkStrength(e.target.value),
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

                    {password && (
                      <>
                        <div className="auth-strength-bar">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`auth-strength-seg ${i < strength ? strengthClasses[strength] : ""}`}
                            />
                          ))}
                        </div>
                        <p
                          className="auth-strength-label"
                          style={{ color: strengthColors[strength] }}
                        >
                          {strengthLabels[strength]}
                        </p>
                      </>
                    )}
                    {errors.password && (
                      <p className="field-error">{errors.password.message}</p>
                    )}

                    <div className="pw-requirements">
                      {[
                        {
                          key: "length",
                          label: "8 – 16 ký tự",
                          ok: checks.length,
                        },
                        {
                          key: "upper",
                          label: "Ít nhất 1 chữ HOA (A-Z)",
                          ok: checks.upper,
                        },
                        {
                          key: "lower",
                          label: "Ít nhất 1 chữ thường (a-z)",
                          ok: checks.lower,
                        },
                        {
                          key: "special",
                          label: "Ít nhất 1 ký tự đặc biệt (!@#…)",
                          ok: checks.special,
                        },
                      ].map((c) => (
                        <div
                          key={c.key}
                          className={`pw-req ${c.ok ? "ok" : ""}`}
                        >
                          {c.ok ? (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                          )}
                          <span>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* XÁC NHẬN MẬT KHẨU */}
                  <div className="form-group">
                    <label>Xác nhận mật khẩu</label>
                    <div className="auth-password-wrap">
                      <input
                        type={showPw2 ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        className={errors.password2 ? "error" : ""}
                        {...register("password2", {
                          required: "Vui lòng xác nhận mật khẩu",
                          validate: (v) =>
                            v === password || "Mật khẩu không khớp",
                        })}
                      />
                      <button
                        type="button"
                        className="auth-pw-toggle"
                        onClick={() => setShowPw2(!showPw2)}
                      >
                        {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password2 && (
                      <p className="field-error">{errors.password2.message}</p>
                    )}
                  </div>

                  <label className="auth-check-group">
                    <input
                      type="checkbox"
                      {...register("terms", { required: true })}
                    />
                    <div
                      className="auth-checkbox"
                      style={{
                        borderColor: errors.terms ? "#c0392b" : undefined,
                      }}
                    >
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
                    <span className="auth-check-label">
                      Tôi đồng ý với <a href="/terms">Điều khoản dịch vụ</a> và{" "}
                      <a href="privacy">Chính sách bảo mật</a> của Earthoria.
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                  >
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
                        <span>Tạo tài khoản miễn phí</span>
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
                </div>
              </form>

              <p className="auth-login-link">
                Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}