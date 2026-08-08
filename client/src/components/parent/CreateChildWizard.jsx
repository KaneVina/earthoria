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
} from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import { childService } from "../../services/childService";

const STEPS = ["email", "info", "terms"];

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

export default function CreateChildWizard({ isOpen, onClose, onCreated }) {
  const user = useAuthStore((s) => s.user);
  const [stepIdx, setStepIdx] = useState(0);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [avatar, setAvatar] = useState(AVATAR_CHOICES[0]);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      setAgreeTerms(false);
      setError("");
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

  const handleCreate = async () => {
    if (!agreeTerms) return setError("Bạn cần đồng ý với điều khoản để tiếp tục.");
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
        <div className="pkd-pin-steps">
          {STEPS.map((s, i) => (
            <span key={s} className={`pkd-pin-step-dot ${i === stepIdx ? "is-active" : ""}`} />
          ))}
        </div>

        {step === "email" && (
          <div className="auth-otp-step">
            <div className="pf-confirm-icon">
              <Mail size={18} />
            </div>
            <h3 className="pf-confirm-title">Xác nhận email phụ huynh</h3>
            <p className="pf-confirm-msg">
              Tài khoản trẻ em sẽ được gắn với email đăng ký hiện tại của bạn. Mọi thông báo và
              quyền quản lý sẽ gửi về email này.
            </p>
            <div className="pkd-wizard-email-box">
              <Mail size={14} />
              <span>{user?.email || "—"}</span>
            </div>
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

            <div className="pkd-wizard-field">
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
            <div className="pf-confirm-icon">
              <ShieldCheck size={18} />
            </div>
            <h3 className="pf-confirm-title">Đồng ý điều khoản</h3>
            <p className="pf-confirm-msg">
              Bạn xác nhận là phụ huynh/người giám hộ hợp pháp của <strong>{name || "bé"}</strong>{" "}
              ({age !== null ? `${age} tuổi` : "—"}) và đồng ý để Earthoria tạo hồ sơ, lưu tiến
              trình đọc và áp dụng các quy tắc bảo vệ mắt do bạn thiết lập.
            </p>

            <label className="pkd-wizard-terms-row">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>
                Tôi đã đọc và đồng ý với{" "}
                <Link to="/legal/terms" target="_blank" rel="noopener noreferrer">
                  Điều khoản sử dụng
                </Link>{" "}
                và{" "}
                <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer">
                  Chính sách quyền riêng tư trẻ em
                </Link>
                .
              </span>
            </label>

            {error && <p className="pf-field-error">{error}</p>}

            <div className="pf-confirm-actions">
              <button className="pf-confirm-cancel pf-btn-tactile" onClick={goBack} disabled={submitting}>
                <ChevronLeft size={14} /> Quay lại
              </button>
              <button
                className="pf-confirm-ok pf-btn-tactile"
                onClick={handleCreate}
                disabled={submitting || !agreeTerms}
              >
                {submitting ? <Loader2 size={14} className="pkd-spin" /> : <Check size={14} />}
                Tạo tài khoản cho bé
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}