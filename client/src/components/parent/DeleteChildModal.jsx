import { useState } from "react";
import { Trash2, ShieldCheck } from "lucide-react";
import { childService } from "../../services/childService";
import { parentPinService } from "../../services/parentPinService";

export default function DeleteChildModal({ childId, childName, onClose, onDeleted }) {
  const [step, setStep] = useState("pin"); // 'pin' -> 'name'
  const [pin, setPin] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pinValid = /^[0-9]{4}$/.test(pin);
  const nameMatches = confirmName.trim() === childName;

  // Bước 1: xác thực PIN trước khi cho gõ tên — tránh xoá nhầm chỉ vì
  // đoán được tên bé.
  const handleVerifyPin = async () => {
    if (!pinValid) return;
    setLoading(true);
    setError("");
    try {
      await parentPinService.verify(pin);
      setStep("name");
    } catch (err) {
      setError(err?.response?.data?.message || "Mã PIN không đúng.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: gõ đúng tên bé rồi mới gọi API xoá vĩnh viễn (server vẫn kiểm
  // tra lại PIN một lần nữa để chắc chắn).
  const handleDelete = async () => {
    if (!nameMatches) return;
    setLoading(true);
    setError("");
    try {
      await childService.deletePermanently(childId, pin, confirmName.trim());
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
        {step === "pin" ? (
          <>
            <div className="pf-confirm-icon danger">
              <ShieldCheck size={18} />
            </div>
            <h3 className="pf-confirm-title">Xác thực mã PIN phụ huynh</h3>
            <p className="pf-confirm-msg">
              Xoá vĩnh viễn hồ sơ của <b>{childName}</b> là hành động nhạy cảm. Nhập mã PIN phụ
              huynh để tiếp tục.
            </p>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="pkd-wizard-input pf-pw-input"
              style={{ marginBottom: 12 }}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Mã PIN 4 số"
            />
            {error && <p className="pf-field-error">{error}</p>}
            <div className="pf-confirm-actions">
              <button className="pf-confirm-cancel pf-btn-tactile" onClick={onClose} disabled={loading} type="button">
                Huỷ
              </button>
              <button
                className="pf-confirm-ok pf-btn-tactile"
                disabled={!pinValid || loading}
                onClick={handleVerifyPin}
                type="button"
              >
                {loading ? "Đang kiểm tra..." : "Tiếp tục"}
              </button>
            </div>
          </>
        ) : (
          <>
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
                disabled={!nameMatches || loading}
                onClick={handleDelete}
                type="button"
              >
                {loading ? "Đang xoá..." : "Xoá vĩnh viễn"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}