import { useState } from "react";
import { Trash2, ShieldCheck } from "lucide-react";
import { childService } from "../../services/childService";

const PIN_ERROR_CODES = ["NO_PIN", "LOCKED_OUT", "INVALID_FORMAT", "WRONG_PIN"];

export default function DeleteChildModal({ childId, childName, onClose, onDeleted }) {
  const [step, setStep] = useState("pin"); // 'pin' -> 'name'
  const [pin, setPin] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pinValid = /^[0-9]{4}$/.test(pin);
  const nameMatches = confirmName.trim() === childName;

  // Bước 1 chỉ kiểm tra định dạng ở client, không gọi API
  const goToNameStep = () => {
    if (!pinValid) return;
    setError("");
    setStep("name");
  };

  const handleDelete = async () => {
    if (!nameMatches) return;
    setLoading(true);
    setError("");
    try {
      await childService.deletePermanently(childId, pin, confirmName.trim());
      onDeleted?.();
      onClose?.();
    } catch (err) {
      const code = err?.response?.data?.data?.code;
      const message = err?.response?.data?.message || "Không xoá được, thử lại sau.";
      if (PIN_ERROR_CODES.includes(code)) {
        // Lỗi thuộc về PIN → đưa người dùng về lại bước nhập PIN thay vì
        // hiện lỗi ở bước tên, để thông báo đúng chỗ gây ra nó.
        setPin("");
        setStep("pin");
        setError(message);
      } else {
        setError(message);
      }
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
                onClick={goToNameStep}
                type="button"
              >
                Tiếp tục
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
              <button
                className="pf-confirm-cancel pf-btn-tactile"
                onClick={() => setStep("pin")}
                disabled={loading}
                type="button"
              >
                Quay lại
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