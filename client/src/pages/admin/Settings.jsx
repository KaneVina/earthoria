// Settings.jsx — Admin account settings page
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Mail,
  Phone,
  Cake,
  Shield,
  Sun,
  Moon,
  LogOut,
  Pencil,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { useAdminTheme } from "../../hooks/useAdminTheme";
import AdminLayout from "./AdminLayout";

/* ── Ẩn bớt email dạng "khang****@edu.vn" ── */
function maskEmail(email) {
  if (!email) return email;
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const visible = local.slice(0, Math.min(4, local.length));
  return `${visible}${"*".repeat(4)}@${domain}`;
}

/* ── Trường thông tin có thể sửa inline (bấm bút chì → input → lưu) ── */
function EditableField({
  label,
  value,
  icon: Icon,
  onSave,
  placeholder = "Chưa cập nhật",
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
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => setDraft(value || ""), [value]);
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
      if (err) return setError(err);
    }
    if (draft === (value || "")) return setEditing(false);
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Cập nhật thất bại");
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
    <div className={`a-field ${editing ? "is-editing" : ""} ${locked ? "is-locked" : ""}`}>
      <div className="a-field-label">
        <Icon size={13} strokeWidth={1.6} className="a-field-icon" />
        {label}
        {locked && (
          <span className="a-field-lock" title={lockedHint}>
            <Shield size={11} strokeWidth={1.6} />
          </span>
        )}
      </div>

      {!editing ? (
        <div className="a-field-display" onClick={locked ? undefined : startEdit}>
          <span className={`a-field-value ${!value ? "is-empty" : ""}`}>
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
              className="a-field-edit-btn"
              onClick={startEdit}
              aria-label={`Sửa ${label}`}
            >
              <Pencil size={12} strokeWidth={1.6} />
            </button>
          )}
          {locked && masked && value && (
            <button
              type="button"
              className="a-field-edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                setRevealed((r) => !r);
              }}
              aria-label={revealed ? "Ẩn email" : "Hiện đầy đủ email"}
            >
              {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}
        </div>
      ) : (
        <div className="a-field-edit-row">
          {options ? (
            <select
              ref={inputRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
              onKeyDown={handleKey}
              className={`a-input a-select ${error ? "has-error" : ""}`}
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
              className={`a-input ${error ? "has-error" : ""}`}
              placeholder={placeholder}
              disabled={saving}
            />
          )}
          <div className="a-field-edit-actions">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="a-btn-icon toggle-on"
              aria-label="Lưu"
            >
              {saving ? <span className="a-spinner-sm" /> : <Check size={13} />}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={cancel}
              className="a-btn-icon"
              aria-label="Hủy"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
      {error && <div className="a-field-error">{error}</div>}
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout, updateUser } = useAuthStore();
  const { isDark, toggle } = useAdminTheme();

  const { data: profile } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: () => authService.getMe().then((r) => r.data.data),
    initialData: user,
    initialDataUpdatedAt: 0,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (patch) => authService.updateProfile(patch),
    onSuccess: (_res, patch) => {
      const updated = { ...profile, ...patch };
      updateUser(updated);
      queryClient.setQueryData(["admin-profile"], updated);
      toast.success("Đã cập nhật thông tin");
    },
  });

  const saveField = useCallback(
    (field) => async (val) => {
      await updateProfileMutation.mutateAsync({ [field]: val });
    },
    [updateProfileMutation]
  );

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
    navigate("/");
  };

  if (!profile) return null;

  return (
    <AdminLayout>
      <div style={{ marginBottom: 26 }}>
        <p className="a-page-eyebrow">Tài khoản</p>
        <h1 className="a-page-title">
          Cài Đặt <em>Hệ Thống</em>
        </h1>
      </div>

      {/* ── 1. THÔNG TIN CÁ NHÂN ── */}
      <div className="a-chart-card" style={{ marginBottom: 20 }}>
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Thông Tin <em>Cá Nhân</em>
          </h3>
          <p className="a-chart-sub">Nhấn vào biểu tượng bút để chỉnh sửa</p>
        </div>

        <div className="a-fields-grid">
          <EditableField
            label="Họ"
            icon={User}
            value={profile.lastName}
            onSave={saveField("lastName")}
            validate={(v) => (!v.trim() ? "Họ không được để trống" : null)}
          />
          <EditableField
            label="Tên"
            icon={User}
            value={profile.firstName}
            onSave={saveField("firstName")}
            validate={(v) => (!v.trim() ? "Tên không được để trống" : null)}
          />
          <EditableField
            label="Email"
            icon={Mail}
            value={profile.email}
            locked
            masked
            lockedHint="Email dùng để đăng nhập, không thể thay đổi"
            onSave={() => {}}
          />
          <EditableField
            label="Số điện thoại"
            icon={Phone}
            value={profile.phone}
            type="tel"
            onSave={saveField("phone")}
            validate={(v) =>
              v && !/^[0-9+\s-]{8,15}$/.test(v) ? "Số điện thoại không hợp lệ" : null
            }
          />
          <EditableField
            label="Ngày sinh"
            icon={Cake}
            value={profile.dob ? profile.dob.slice(0, 10) : ""}
            type="date"
            onSave={saveField("dob")}
          />
          <EditableField
            label="Giới tính"
            icon={User}
            value={profile.gender}
            options={[
              { value: "MALE", label: "Nam" },
              { value: "FEMALE", label: "Nữ" },
              { value: "OTHER", label: "Khác" },
            ]}
            onSave={saveField("gender")}
          />
        </div>
      </div>

      {/* ── 2. GIAO DIỆN (DARK/LIGHT) ── */}
      <div className="a-chart-card" style={{ marginBottom: 20 }}>
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Giao Diện <em>Hiển Thị</em>
          </h3>
          <p className="a-chart-sub">Chọn chế độ sáng hoặc tối cho trang quản trị</p>
        </div>

        <div className="a-theme-row">
          <div>
            <div className="a-theme-row-title">Chế độ tối</div>
            <div className="a-theme-row-desc">
              {isDark ? "Đang bật — dịu mắt hơn khi làm việc ban đêm" : "Đang tắt — giao diện sáng mặc định"}
            </div>
          </div>
          <label className="a-switch">
            <input type="checkbox" checked={isDark} onChange={toggle} />
            <span className="a-switch-track">
              <span className="a-switch-thumb">
                {isDark ? <Moon size={12} /> : <Sun size={12} />}
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* ── 3. ĐĂNG XUẤT ── */}
      <div className="a-chart-card">
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Phiên <em>Đăng Nhập</em>
          </h3>
          <p className="a-chart-sub">Đăng xuất khỏi tài khoản quản trị hiện tại</p>
        </div>
        <button onClick={handleLogout} className="a-btn-ghost" style={{ color: "#c05050", borderColor: "rgba(192,80,80,0.3)" }}>
          <LogOut size={14} /> Đăng Xuất
        </button>
      </div>
    </AdminLayout>
  );
}