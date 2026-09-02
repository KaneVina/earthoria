import { useState, useEffect, useRef } from "react";
import { Shield, Pencil, Check, X, Eye, EyeOff } from "lucide-react";

export function maskEmail(email) {
  if (!email) return email;
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const visible = local.slice(0, Math.min(4, local.length));
  return `${visible}${"*".repeat(4)}@${domain}`;
}

export default function EditableField({
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
    <div
      className={`a-field ${editing ? "is-editing" : ""} ${locked ? "is-locked" : ""}`}
    >
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
        <div
          className="a-field-display"
          onClick={locked ? undefined : startEdit}
        >
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
