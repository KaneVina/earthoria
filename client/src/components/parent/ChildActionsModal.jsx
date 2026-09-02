import { useEffect } from "react";
import { Lock, Unlock, Trash2, X } from "lucide-react";
import KidLinkCard from "./KidLinkCard";

export default function ChildActionsModal({
  child,
  onClose,
  onLock,
  onUnlock,
  onDelete,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!child) return null;

  return (
    <div
      className="pf-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="pf-confirm pkd-modal pkd-modal-wide pkd-actions-modal"
        role="dialog"
        aria-modal="true"
      >
        <button
          className="pkd-wizard-close"
          onClick={onClose}
          type="button"
          aria-label="Đóng"
        >
          <X size={16} />
        </button>

        <div className="pkd-actions-modal-head">
          <span
            className="pkd-child-avatar"
            style={{ background: child.avatarColor }}
          >
            {child.avatarEmoji}
          </span>
          <div>
            <h3 className="pf-confirm-title" style={{ marginBottom: 4 }}>
              {child.name}
            </h3>
            <span
              className={`pkd-actions-modal-status ${child.isLocked ? "is-locked" : "is-active"}`}
            >
              {child.isLocked ? (
                <>
                  <Lock size={11} /> Đang khoá AR
                </>
              ) : (
                <>
                  <Unlock size={11} /> Đang mở AR
                </>
              )}
            </span>
          </div>
        </div>

        <div className="pkd-actions-modal-section">
          <KidLinkCard childId={child.id} childName={child.name} />
        </div>

        <div className="pkd-actions-modal-footer">
          {child.isLocked ? (
            <button
              className="pkd-lock-btn is-unlock pf-btn-tactile"
              onClick={onUnlock}
              type="button"
            >
              <Unlock size={15} /> Mở khoá cho {child.name}
            </button>
          ) : (
            <button
              className="pkd-lock-btn is-lock pf-btn-tactile"
              onClick={onLock}
              type="button"
            >
              <Lock size={15} /> Khoá ngay cho {child.name}
            </button>
          )}
          <button
            className="pkd-actions-modal-delete"
            onClick={onDelete}
            type="button"
          >
            <Trash2 size={13} /> Xoá vĩnh viễn hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
}
