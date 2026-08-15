import { useState } from "react";
import { Trash2 } from "lucide-react";
import { childService } from "../../services/childService";

export default function DeleteChildModal({ childId, childName, onClose, onDeleted }) {
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const matches = confirmName.trim() === childName;

  const handleDelete = async () => {
    if (!matches) return;
    setLoading(true);
    setError("");
    try {
      await childService.deletePermanently(childId, confirmName.trim());
      onDeleted?.();
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Không xoá được, thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="pf-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="pf-confirm pkd-modal" role="dialog" aria-modal="true">
        <div className="pf-confirm-icon danger">
          <Trash2 size={18} />
        </div>
        <h3 className="pf-confirm-title">Xoá vĩnh viễn hồ sơ của {childName}?</h3>
        <p className="pf-confirm-msg">
          Hành động này <b>không thể hoàn tác</b>. Toàn bộ hồ sơ, cài đặt, nhật ký hoạt động và
          link/QR riêng của bé sẽ bị xoá hoàn toàn khỏi hệ thống.
        </p>
        <p className="pf-confirm-msg" style={{ marginBottom: 12 }}>
          Để xác nhận, hãy gõ chính xác tên bé: <b>{childName}</b>
        </p>
        <input
          autoFocus
          className="pkd-wizard-input pf-pw-input"
          style={{ marginBottom: 12 }}
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          placeholder="Nhập tên bé để xác nhận"
        />
        {error && <p className="pf-field-error">{error}</p>}
        <div className="pf-confirm-actions">
          <button className="pf-confirm-cancel pf-btn-tactile" onClick={onClose} disabled={loading} type="button">
            Huỷ
          </button>
          <button
            className="pf-confirm-ok danger pf-btn-tactile"
            disabled={!matches || loading}
            onClick={handleDelete}
            type="button"
          >
            {loading ? "Đang xoá..." : "Xoá vĩnh viễn"}
          </button>
        </div>
      </div>
    </div>
  );
}