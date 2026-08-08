import { useState } from "react";
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box danger" onClick={(e) => e.stopPropagation()}>
        <h3>Xoá vĩnh viễn hồ sơ của {childName}?</h3>
        <p>
          Hành động này <b>không thể hoàn tác</b>. Toàn bộ hồ sơ, cài đặt,
          nhật ký hoạt động và link/QR riêng của bé sẽ bị xoá hoàn toàn khỏi
          hệ thống.
        </p>
        <p>
          Để xác nhận, hãy gõ chính xác tên bé: <b>{childName}</b>
        </p>
        <input
          autoFocus
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          placeholder="Nhập tên bé để xác nhận"
        />
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <button onClick={onClose} disabled={loading}>
            Huỷ
          </button>
          <button
            className="danger"
            disabled={!matches || loading}
            onClick={handleDelete}
          >
            {loading ? "Đang xoá..." : "Xoá vĩnh viễn"}
          </button>
        </div>
      </div>
    </div>
  );
}