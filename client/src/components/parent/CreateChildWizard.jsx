import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Mail,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  ShieldCheck,
  Smile,
  X,
  Lock,
  FileText,
} from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import { childService } from "../../services/childService";
import { parentPinService } from "../../services/parentPinService";

const BASE_STEPS = ["intro", "email", "info", "terms"];

const AVATAR_CHOICES = [
  { emoji: "🦊", color: "#c9793f" },
  { emoji: "🐼", color: "#4a4a4a" },
  { emoji: "🐯", color: "#d98a2b" },
  { emoji: "🐰", color: "#b06fa8" },
  { emoji: "🦁", color: "#c99a2e" },
  { emoji: "🐧", color: "#3f7ea6" },
  { emoji: "🦄", color: "#a875c9" },
  { emoji: "🐢", color: "#4a9e3f" },
];

// Tính tuổi ngay ở client để hiển thị tức thời khi phụ huynh gõ ngày sinh —
// server vẫn tính lại độc lập, đây chỉ là UX, không phải nguồn sự thật.
function calcAge(dobStr) {
  if (!dobStr) return null;
  const birth = new Date(dobStr);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

// Vector minh họa nhỏ, dễ thương, tông xanh lá — dùng cho bước giới thiệu.
// Vẽ thuần bằng shape cơ bản, không phụ thuộc ảnh ngoài.
function IntroIllustration() {
  return (
    <svg
      viewBox="0 0 220 170"
      width="180"
      height="140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pkd-wizard-illustration"
      aria-hidden="true"
    >
      <ellipse cx="110" cy="150" rx="72" ry="10" fill="var(--gold-pale)" />
      <circle cx="110" cy="76" r="58" fill="var(--gold-pale)" />
      <circle cx="110" cy="90" r="34" fill="var(--forest-light)" />
      <circle cx="110" cy="90" r="34" fill="var(--forest-light)" opacity="0.001" />
      {/* Thân mascot lá cây */}
      <path
        d="M110 56C130 56 146 72 146 92C146 112 130 128 110 128C90 128 74 112 74 92C74 72 90 56 110 56Z"
        fill="var(--forest)"
      />
      {/* Hai lá trên đầu */}
      <path d="M96 54C90 40 96 26 110 22C108 38 106 48 96 54Z" fill="var(--gold)" />
      <path d="M124 54C130 40 124 26 110 22C112 38 114 48 124 54Z" fill="var(--gold)" />
      {/* Mắt */}
      <circle cx="98" cy="94" r="5" fill="var(--ivory)" />
      <circle cx="122" cy="94" r="5" fill="var(--ivory)" />
      <circle cx="99" cy="95" r="2.4" fill="var(--forest)" />
      <circle cx="123" cy="95" r="2.4" fill="var(--forest)" />
      {/* Má hồng */}
      <circle cx="90" cy="104" r="4" fill="var(--gold)" opacity="0.5" />
      <circle cx="130" cy="104" r="4" fill="var(--gold)" opacity="0.5" />
      {/* Miệng cười */}
      <path d="M100 108C104 114 116 114 120 108" stroke="var(--ivory)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Tay vẫy */}
      <circle cx="150" cy="80" r="9" fill="var(--forest)" />
      <path d="M150 71V52" stroke="var(--forest)" strokeWidth="8" strokeLinecap="round" />
      {/* Sparkles xung quanh */}
      <circle cx="40" cy="50" r="4" fill="var(--gold)" />
      <circle cx="176" cy="46" r="3" fill="var(--gold)" />
      <circle cx="182" cy="112" r="4" fill="var(--forest-light)" />
      <circle cx="34" cy="112" r="3" fill="var(--forest-light)" />
    </svg>
  );
}

export default function CreateChildWizard({ isOpen, onClose, onCreated, hasPin, onPinCreated }) {
  const user = useAuthStore((s) => s.user);
  // Chưa có PIN thì chèn bước "pin" ngay sau intro — bắt buộc thiết lập
  // trước khi tạo hồ sơ trẻ, vì PIN là thứ duy nhất bảo vệ các hành động
  // nhạy cảm (mở khoá AR, xoá hồ sơ...) sau này.
  const STEPS = hasPin ? BASE_STEPS : ["intro", "pin", "email", "info", "terms"];
  const [stepIdx, setStepIdx] = useState(0);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [avatar, setAvatar] = useState(AVATAR_CHOICES[0]);
  const [agreeGuardian, setAgreeGuardian] = useState(false);
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSubmitting, setPinSubmitting] = useState(false);

  const age = useMemo(() => calcAge(dob), [dob]);
  const maxDob = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const minDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 17);
    return d.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStepIdx(0);
      setName("");
      setDob("");
      setAvatar(AVATAR_CHOICES[0]);
      setAgreeGuardian(false);
      setAgreePolicy(false);
      setError("");
      setNewPin("");
      setConfirmPin("");
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const step = STEPS[stepIdx];

  const goNext = () => {
    setError("");
    if (step === "info") {
      if (!name.trim()) return setError("Vui lòng nhập tên của bé.");
      if (!dob) return setError("Vui lòng chọn ngày sinh của bé.");
      if (age === null || age < 0 || age > 17) {
        return setError("Ngày sinh không hợp lệ. Áp dụng cho bé từ 0–17 tuổi.");
      }
    }
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  };
  const goBack = () => {
    setError("");
    setStepIdx((i) => Math.max(i - 1, 0));
  };

  const submitPinStep = async () => {
    if (!/^[0-9]{4}$/.test(newPin)) return setError("Mã PIN gồm đúng 4 chữ số.");
    if (newPin !== confirmPin) return setError("Hai mã PIN không khớp, thử lại nhé.");
    setPinSubmitting(true);
    setError("");
    try {
      await parentPinService.set(newPin);
      onPinCreated?.();
      setStepIdx((i) => i + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể lưu mã PIN, thử lại nhé.");
    } finally {
      setPinSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!agreeGuardian) return setError("Bạn cần đồng ý với điều khoản công bố phía trên để tiếp tục.");
    if (!agreePolicy) return setError("Bạn cần đồng ý với Chính sách quyền riêng tư & Điều khoản dịch vụ.");
    setSubmitting(true);
    setError("");
    try {
      const res = await childService.create({
        name: name.trim(),
        dob,
        avatarEmoji: avatar.emoji,
        avatarColor: avatar.color,
        agreeTerms: true,
      });
      toast.success(res.data.message || "Đã tạo tài khoản cho bé!");
      onCreated?.(res.data.data.child);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể tạo tài khoản cho bé. Thử lại nhé.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="pf-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pf-confirm pkd-modal pkd-modal-wide" role="dialog" aria-modal="true">
        <button className="pkd-wizard-close" onClick={onClose} type="button" aria-label="Đóng">
          <X size={16} />
        </button>

        {step !== "intro" && (
          <div className="pkd-pin-steps">
            {STEPS.filter((s) => s !== "intro").map((s, i) => (
              <span
                key={s}
                className={`pkd-pin-step-dot ${STEPS.indexOf(s) === stepIdx ? "is-active" : ""}`}
              />
            ))}
          </div>
        )}

        {step === "intro" && (
          <div className="auth-otp-step pkd-wizard-intro">
            <IntroIllustration />
            <h3 className="pf-confirm-title">
              Hãy nhờ cha mẹ đăng ký tài khoản <em>E-Kid</em> cho bạn
            </h3>
            <p className="pf-confirm-msg">
              Chỉ mất khoảng 1 phút. Cha mẹ sẽ tạo hồ sơ riêng, giới hạn giờ xem AR và bật các quy
              tắc bảo vệ mắt phù hợp với độ tuổi của bé.
            </p>
            <div className="pf-confirm-actions" style={{ justifyContent: "center" }}>
              <button className="pf-confirm-ok pf-btn-tactile" onClick={goNext}>
                Bắt đầu <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === "pin" && (
          <div className="auth-otp-step">
            <div className="pf-confirm-icon">
              <Lock size={18} />
            </div>
            <h3 className="pf-confirm-title">Thiết lập mã PIN phụ huynh</h3>
            <p className="pf-confirm-msg">
              Mã PIN gồm 4 số dùng để mở khoá AR và xác nhận các thao tác nhạy cảm (ví dụ xoá hồ
              sơ của bé). <b>Đây là lớp bảo vệ quan trọng nhất</b> cho tài khoản trẻ em — hãy chọn
              mã bạn nhớ được nhưng người khác khó đoán, và đừng chia sẻ với bé.
            </p>
            <div className="pkd-wizard-field">
              <label>Mã PIN mới</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className="pf-pw-input pkd-wizard-input"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
            <div className="pkd-wizard-field">
              <label>Nhập lại mã PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className="pf-pw-input pkd-wizard-input"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
            {error && <p className="pf-field-error">{error}</p>}
            <div className="pf-confirm-actions">
              <button className="pf-confirm-cancel pf-btn-tactile" onClick={onClose} disabled={pinSubmitting}>
                Hủy
              </button>
              <button className="pf-confirm-ok pf-btn-tactile" onClick={submitPinStep} disabled={pinSubmitting}>
                {pinSubmitting ? <Loader2 size={14} className="pkd-spin" /> : "Lưu mã PIN"} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === "email" && (
          <div className="auth-otp-step">
            <div className="pf-confirm-icon">
              <Mail size={18} />
            </div>
            <h3 className="pf-confirm-title">Xác nhận email phụ huynh</h3>
            <p className="pf-confirm-msg">
              Tài khoản trẻ em sẽ được gắn với email đăng ký hiện tại của bạn.
            </p>
            <div className="pkd-wizard-email-box">
              <Mail size={14} />
              <span>{user?.email || "—"}</span>
            </div>
            <p className="pkd-wizard-email-note">
              Mọi thông báo quan trọng — cảnh báo vượt giờ xem, yêu cầu mở khóa, đặt lại mã PIN,
              và các cập nhật liên quan đến tài khoản của bé — đều sẽ được gửi về đúng địa chỉ
              email này. Vui lòng kiểm tra kỹ trước khi tiếp tục để không bỏ lỡ thông báo.
            </p>
            <div className="pf-confirm-actions">
              <button className="pf-confirm-cancel pf-btn-tactile" onClick={onClose}>
                Hủy
              </button>
              <button className="pf-confirm-ok pf-btn-tactile" onClick={goNext}>
                Đúng, tiếp tục <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === "info" && (
          <div className="auth-otp-step">
            <div className="pf-confirm-icon">
              <Smile size={18} />
            </div>
            <h3 className="pf-confirm-title">Thông tin của bé</h3>
            <p className="pf-confirm-msg">Nhập tên và ngày sinh — hệ thống sẽ tự tính tuổi cho bé.</p>

            <div className="pkd-wizard-row">
              <div className="pkd-wizard-avatar-group">
                <label>Biểu tượng</label>
                <div className="pkd-wizard-avatar-row">
                  {AVATAR_CHOICES.map((a) => (
                    <button
                      key={a.emoji}
                      type="button"
                      className={`pkd-wizard-avatar-btn ${avatar.emoji === a.emoji ? "is-active" : ""}`}
                      style={{ "--avatar-color": a.color }}
                      onClick={() => setAvatar(a)}
                      aria-label={`Chọn biểu tượng ${a.emoji}`}
                    >
                      {a.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pkd-wizard-field pkd-wizard-field-name">
                <label>Tên của bé</label>
                <input
                  type="text"
                  className="pf-pw-input pkd-wizard-input"
                  placeholder="VD: Bống"
                  value={name}
                  maxLength={50}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="pkd-wizard-field">
              <label>Ngày sinh</label>
              <input
                type="date"
                className="pf-pw-input pkd-wizard-input"
                value={dob}
                min={minDob}
                max={maxDob}
                onChange={(e) => setDob(e.target.value)}
              />
              {age !== null && (
                <span className="pkd-wizard-age-badge">
                  <Sparkles size={12} /> {age} tuổi
                </span>
              )}
            </div>

            <p className="pkd-wizard-note">
              <Sparkles size={13} />
              Chúng tôi sẽ tự động tuỳ chỉnh trải nghiệm tài khoản E-Kid theo đúng độ tuổi của con
              bạn. Chỉ bạn và con bạn thấy được những thông tin này.
            </p>

            {error && <p className="pf-field-error">{error}</p>}

            <div className="pf-confirm-actions">
              <button className="pf-confirm-cancel pf-btn-tactile" onClick={goBack}>
                <ChevronLeft size={14} /> Quay lại
              </button>
              <button className="pf-confirm-ok pf-btn-tactile" onClick={goNext}>
                Tiếp tục <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === "terms" && (
          <div className="auth-otp-step">
            <h3 className="pf-confirm-title">Điều khoản công bố</h3>
            <p className="pf-confirm-msg">
              Trước khi tạo hồ sơ cho <strong>{name || "bé"}</strong>{" "}
              ({age !== null ? `${age} tuổi` : "—"}), bạn cần xác nhận là phụ huynh/người giám hộ
              hợp pháp và đồng ý để Earthoria tạo hồ sơ, lưu tiến trình đọc, cũng như áp dụng các
              quy tắc bảo vệ mắt và giới hạn thời gian do chính bạn thiết lập cho bé.
            </p>

            <div className="pkd-wizard-terms-group">
              <label className="pkd-wizard-terms-row">
                <input
                  type="checkbox"
                  checked={agreeGuardian}
                  onChange={(e) => setAgreeGuardian(e.target.checked)}
                />
                <span className="pkd-wizard-terms-icon">
                  <FileText size={14} />
                </span>
                <span className="pkd-wizard-terms-text">
                  Tôi xác nhận là phụ huynh/người giám hộ hợp pháp của bé và đồng ý với{" "}
                  <strong>điều khoản công bố</strong> nêu trên.
                </span>
              </label>

              <label className="pkd-wizard-terms-row">
                <input
                  type="checkbox"
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                />
                <span className="pkd-wizard-terms-icon">
                  <Lock size={14} />
                </span>
                <span className="pkd-wizard-terms-text">
                  Tôi đồng ý với{" "}
                  <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer">
                    Chính sách quyền riêng tư
                  </Link>{" "}
                  và{" "}
                  <Link to="/legal/terms" target="_blank" rel="noopener noreferrer">
                    Điều khoản dịch vụ
                  </Link>{" "}
                  của Earthoria.
                </span>
              </label>
            </div>

            {error && <p className="pf-field-error">{error}</p>}

            <div className="pf-confirm-actions">
              <button className="pf-confirm-cancel pf-btn-tactile" onClick={goBack} disabled={submitting}>
                <ChevronLeft size={14} /> Quay lại
              </button>
              <button
                className="pf-confirm-ok pf-btn-tactile"
                onClick={handleCreate}
                disabled={submitting || !agreeGuardian || !agreePolicy}
              >
                {submitting ? (
                  <Loader2 size={14} className="pkd-spin" />
                ) : (
                  <Check size={14} />
                )}{" "}
                Tạo tài khoản cho bé
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}