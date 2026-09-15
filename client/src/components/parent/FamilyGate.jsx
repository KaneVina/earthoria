import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Bell,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { parentPinService } from "../../services/parentPinService";
import FullScreenLoader from "../FullScreenLoader";
import "../assets/css/profile.css";
import "../assets/css/parentDashboard.css";
import "../assets/css/familyGate.css";

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
// Đưa tab đi chỗ khác quá lâu (vd đưa máy cho con) thì tự khoá lại ngay cả
// khi cookie phiên nâng quyền server cấp (mặc định 20 phút) chưa hết hạn.
const INACTIVITY_RELOCK_MS = 2 * 60 * 1000;

const FAMILY_GATE_STATUS_KEY = ["family-gate-status"];

const emptyDigits = (n) => Array(n).fill("");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Dãy ô nhập số dùng chung cho PIN (4 số) và OTP (6 số).
 *
 * - Mỗi số vừa gõ chỉ hiện thật trong chốc lát (hoặc trong lúc ô đó đang
 *   được focus để dễ sửa) rồi tự chuyển thành "*" - số ở các ô trước đó
 *   luôn bị che ngay khi con trỏ rời sang ô kế tiếp, tránh lộ mã khi có
 *   người đứng cạnh nhìn màn hình.
 * - Gõ xong số cuối cùng sẽ tự gọi onComplete (tương đương tự bấm "Xác
 *   nhận"/"Tiếp tục"), không cần thao tác thêm.
 * - hasError bung viền đỏ cho TẤT CẢ các ô như nhau (không riêng ô nào) để
 *   không ai đoán được số nào gõ sai; hasSuccess bung xanh đậm toàn bộ khi
 *   mã đã được xác thực đúng. shake=true rung nhẹ cả hàng khi nhập sai.
 */
function DigitInputs({
  digits,
  refsArray,
  hasError,
  hasSuccess,
  shake,
  disabled,
  onChange,
  onComplete,
}) {
  const count = digits.length;
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [revealIndex, setRevealIndex] = useState(-1);
  const revealTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(revealTimerRef.current), []);

  const revealBriefly = (idx, ms = 450) => {
    setRevealIndex(idx);
    clearTimeout(revealTimerRef.current);
    revealTimerRef.current = setTimeout(
      () => setRevealIndex((cur) => (cur === idx ? -1 : cur)),
      ms,
    );
  };

  const setDigit = (idx, raw) => {
    const digit = raw.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    onChange(next);
    if (!digit) return; // vừa xoá bằng cách gõ đè - không cần hiệu ứng gì thêm

    revealBriefly(idx);
    if (idx < count - 1) {
      refsArray.current[idx + 1]?.focus();
    } else {
      refsArray.current[idx]?.blur();
      if (next.every((d) => d)) onComplete?.(next.join(""));
    }
  };

  const onKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refsArray.current[idx - 1]?.focus();
    }
  };

  // Cho phép dán nguyên chuỗi mã (vd copy từ email/SMS) vào bất kỳ ô nào.
  const onPaste = (idx, e) => {
    const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!text) return;
    e.preventDefault();
    const next = [...digits];
    let lastIdx = idx;
    for (let i = 0; i < text.length && idx + i < count; i++) {
      next[idx + i] = text[i];
      lastIdx = idx + i;
    }
    onChange(next);
    revealBriefly(lastIdx);
    if (next.every((d) => d)) {
      refsArray.current[lastIdx]?.blur();
      onComplete?.(next.join(""));
    } else {
      refsArray.current[Math.min(lastIdx + 1, count - 1)]?.focus();
    }
  };

  return (
    <div className={`otp-inputs ${shake ? "fg-pin-shake" : ""}`}>
      {digits.map((d, i) => {
        const showRealDigit = d && (i === revealIndex || i === focusedIndex);
        return (
          <input
            key={i}
            ref={(el) => (refsArray.current[i] = el)}
            className={`otp-input ${d ? "filled" : ""} ${hasError ? "error" : ""} ${hasSuccess ? "success" : ""}`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            autoFocus={i === 0}
            value={showRealDigit ? d : d ? "*" : ""}
            disabled={disabled}
            aria-label={`Chữ số thứ ${i + 1} trên ${count}`}
            onFocus={(e) => {
              setFocusedIndex(i);
              e.target.select(); // bôi đen số cũ để gõ số mới là ghi đè luôn
            }}
            onBlur={() => setFocusedIndex((cur) => (cur === i ? -1 : cur))}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={(e) => onPaste(i, e)}
          />
        );
      })}
    </div>
  );
}

/**
 * Cổng PIN bảo vệ toàn bộ khu vực /family (Bảng điều khiển phụ huynh).
 *
 * - Tài khoản CHƯA từng đặt PIN (chưa có hồ sơ con) -> coi như chưa có gì để
 *   bảo vệ, cho vào thẳng để hoàn tất onboarding.
 * - Đã có PIN -> che toàn bộ dashboard bằng màn hình nhập PIN cho tới khi
 *   xác thực đúng; server cũng chặn song song ở tầng API (xem
 *   server/src/middlewares/familyGate.js) - đây KHÔNG phải lớp bảo vệ duy
 *   nhất, chỉ là phần giao diện tương ứng.
 * - Tự khoá lại khi rời tab quá lâu, hoặc khi một API bất kỳ báo phiên đã
 *   hết hạn giữa chừng (sự kiện "family-gate:locked" từ services/api.js).
 *
 * Trạng thái "đã mở cổng hay chưa" lấy trực tiếp từ react-query
 * (giống mọi dữ liệu server khác trong ParentDashboard.jsx) thay vì đồng bộ
 * qua state nội bộ + effect, để tránh cascading setState và giữ một nguồn
 * sự thật duy nhất.
 */
export default function FamilyGate({ children }) {
  const qc = useQueryClient();
  const [step, setStep] = useState("pin"); // pin | otp | new | confirm

  const statusQuery = useQuery({
    queryKey: FAMILY_GATE_STATUS_KEY,
    queryFn: async () => {
      const res = await parentPinService.status();
      return res.data.data; // { hasPin, gateActive }
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const hasPin = statusQuery.data?.hasPin ?? false;
  const status = statusQuery.isLoading
    ? "checking"
    : statusQuery.isError
      ? "error"
      : !hasPin || statusQuery.data.gateActive
        ? "open"
        : "locked";

  // Ghi thẳng vào cache react-query khi biết chắc kết quả (vừa mở/khoá
  // xong) - cùng pattern "cancelQueries + setQueryData" đã dùng khắp
  // ParentDashboard.jsx, tránh phải chờ round-trip refetch không cần thiết.
  const writeGateState = (patch) => {
    qc.setQueryData(FAMILY_GATE_STATUS_KEY, (prev) =>
      prev ? { ...prev, ...patch } : prev,
    );
  };

  // Bước nhập PIN chính
  const [pinDigits, setPinDigits] = useState(emptyDigits(4));
  const [pinError, setPinError] = useState("");
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const lockoutTimerRef = useRef(null);
  const pinRefs = useRef([]);
  // Hiệu ứng dùng chung cho mọi bước nhập số (pin/otp/new/confirm): rung +
  // đỏ toàn bộ khi sai, xanh đậm toàn bộ khi server xác nhận đúng.
  const [digitShake, setDigitShake] = useState(false);
  const [digitSuccess, setDigitSuccess] = useState(false);
  const shakeFor = async (ms = 550) => {
    setDigitShake(true);
    await sleep(ms);
    setDigitShake(false);
  };
  const flashSuccess = async (ms = 450) => {
    setDigitSuccess(true);
    await sleep(ms);
    setDigitSuccess(false);
  };

  useEffect(() => () => clearTimeout(lockoutTimerRef.current), []);

  const startLockout = () => {
    setIsLockedOut(true);
    clearTimeout(lockoutTimerRef.current);
    lockoutTimerRef.current = setTimeout(
      () => setIsLockedOut(false),
      LOCKOUT_MINUTES * 60 * 1000,
    );
  };

  // Luồng "Quên mã PIN?" (OTP qua email -> đặt PIN mới -> nhập lại xác nhận)
  const [otpDigits, setOtpDigits] = useState(emptyDigits(6));
  const [otpSending, setOtpSending] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [newPinDigits, setNewPinDigits] = useState(emptyDigits(4));
  const [confirmPinDigits, setConfirmPinDigits] = useState(emptyDigits(4));
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const otpRefs = useRef([]);
  const newPinRefs = useRef([]);
  const confirmPinRefs = useRef([]);

  // Đếm ngược cho nút "Gửi lại mã"
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Một API bất kỳ báo "FAMILY_GATE_REQUIRED" (cookie hết hạn giữa phiên,
  // hoặc bị khoá từ tab khác) -> hiện lại màn hình nhập PIN ngay.
  useEffect(() => {
    const onLocked = () => {
      writeGateState({ gateActive: false });
      setStep("pin");
    };
    window.addEventListener("family-gate:locked", onLocked);
    return () => window.removeEventListener("family-gate:locked", onLocked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự khoá lại nếu rời tab quá lâu - phòng trường hợp đưa thiết bị cho con
  // ngay khi dashboard đang mở, không đợi cookie hết hạn tự nhiên.
  useEffect(() => {
    if (status !== "open" || !hasPin) return;
    let hiddenAt = null;
    const onVisibility = async () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt && Date.now() - hiddenAt > INACTIVITY_RELOCK_MS) {
        try {
          await parentPinService.lockGate();
        } catch {
          // Không sao - vẫn khoá ở giao diện dù gọi API thất bại.
        }
        writeGateState({ gateActive: false });
        setStep("pin");
        toast("Đã tự khoá lại trang gia đình do rời khỏi tab", { icon: "🔒" });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, hasPin]);

  const resetForgotState = () => {
    setStep("pin");
    setOtpDigits(emptyDigits(6));
    setNewPinDigits(emptyDigits(4));
    setConfirmPinDigits(emptyDigits(4));
    setPinError("");
    setDigitShake(false);
    setDigitSuccess(false);
  };

  const submitPin = async (pinOverride) => {
    const pin = pinOverride ?? pinDigits.join("");
    if (pin.length < 4 || pinSubmitting) return;
    setPinSubmitting(true);
    setPinError("");
    try {
      await parentPinService.unlockGate(pin);
      await flashSuccess();
      writeGateState({ hasPin: true, gateActive: true });
      setPinDigits(emptyDigits(4));
    } catch (err) {
      const data = err.response?.data;
      setPinError(data?.message || "Mã PIN không đúng.");
      await shakeFor();
      if (data?.data?.code === "LOCKED_OUT") startLockout();
      setPinDigits(emptyDigits(4));
      requestAnimationFrame(() => pinRefs.current[0]?.focus());
    } finally {
      setPinSubmitting(false);
    }
  };

  const sendOtp = async () => {
    setOtpSending(true);
    setOtpDigits(emptyDigits(6));
    try {
      const res = await parentPinService.sendForgotOtp();
      setMaskedEmail(res.data.data?.maskedEmail || "");
      setResendCooldown(60);
      toast.success("Đã gửi mã OTP tới email của bạn");
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi mã OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const openForgotFlow = () => {
    setPinError("");
    setStep("otp");
    sendOtp();
  };

  const submitOtpStep = async (otpOverride) => {
    const otp = otpOverride ?? otpDigits.join("");
    if (otp.length < 6) {
      setPinError("Vui lòng nhập đủ 6 số.");
      await shakeFor(450);
      return;
    }
    setPinError("");
    setStep("new");
  };

  const submitNewPinStep = async (pinOverride) => {
    const newPin = pinOverride ?? newPinDigits.join("");
    if (!/^[0-9]{4}$/.test(newPin)) {
      setPinError("Mã PIN gồm đúng 4 chữ số.");
      await shakeFor(450);
      return;
    }
    setPinError("");
    setStep("confirm");
  };

  const submitConfirmStep = async (confirmOverride) => {
    const newPin = newPinDigits.join("");
    const confirmPin = confirmOverride ?? confirmPinDigits.join("");
    if (confirmPin.length < 4 || forgotSubmitting) return;
    if (confirmPin !== newPin) {
      setPinError("Hai mã PIN không khớp, thử lại nhé.");
      await shakeFor();
      setConfirmPinDigits(emptyDigits(4));
      requestAnimationFrame(() => confirmPinRefs.current[0]?.focus());
      return;
    }
    setForgotSubmitting(true);
    setPinError("");
    try {
      await parentPinService.resetWithOtp(otpDigits.join(""), newPin);
      await flashSuccess();
      toast.success("Đã đặt lại mã PIN mới");
      writeGateState({ hasPin: true, gateActive: true }); // resetWithOtp cũng đã mở cổng cho phiên hiện tại
      setIsLockedOut(false);
      clearTimeout(lockoutTimerRef.current);
      resetForgotState();
    } catch (err) {
      setPinError(
        err.response?.data?.message || "Không thể lưu mã PIN, thử lại nhé.",
      );
      await shakeFor();
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleManualLock = async () => {
    try {
      await parentPinService.lockGate();
    } catch {
      // Vẫn khoá ở giao diện dù API lỗi - ưu tiên an toàn.
    }
    writeGateState({ gateActive: false });
    setStep("pin");
    setPinDigits(emptyDigits(4));
  };

  /*  Render  */

  if (status === "checking") {
    return (
      <FullScreenLoader
        eyebrow="Đang kiểm tra"
        message="Đang xác minh quyền truy cập khu vực gia đình..."
      />
    );
  }

  if (status === "error") {
    return (
      <div className="pf-overlay">
        <div
          className="pf-confirm pkd-modal"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="pf-confirm-icon danger">
            <AlertTriangle size={18} />
          </div>
          <h3 className="pf-confirm-title">Không thể kết nối</h3>
          <p className="pf-confirm-msg">
            Có lỗi khi kiểm tra quyền truy cập khu vực gia đình. Vui lòng thử
            lại.
          </p>
          <div className="pf-confirm-actions">
            <Link to="/" className="pf-confirm-cancel pf-btn-tactile">
              Về trang chủ
            </Link>
            <button
              className="pf-confirm-ok pf-btn-tactile"
              onClick={() => statusQuery.refetch()}
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "open") {
    return (
      <>
        {hasPin && (
          <button
            type="button"
            className="fg-lock-btn"
            onClick={handleManualLock}
            title="Khoá trang quản lý gia đình ngay"
          >
            <Lock size={13} /> Khoá lại
          </button>
        )}
        {children}
      </>
    );
  }

  // status === "locked"
  const stepsOrder = ["otp", "new", "confirm"];

  return (
    <div className="pf-overlay fg-overlay">
      <div
        className="pf-confirm pkd-modal fg-card"
        role="dialog"
        aria-modal="true"
      >
        {step === "pin" && (
          <>
            <div className="pf-confirm-icon">
              <ShieldCheck size={18} />
            </div>
            <h3 className="pf-confirm-title">Khu vực dành cho phụ huynh</h3>
            <p className="pf-confirm-msg">
              Nhập mã PIN để xem và chỉnh sửa giờ giấc, hạn mức của các bé.
            </p>

            {isLockedOut ? (
              <div className="pkd-lockout-msg">
                <AlertTriangle size={14} /> Đã nhập sai quá {MAX_PIN_ATTEMPTS}{" "}
                lần. Vui lòng thử lại sau ít phút hoặc dùng "Quên mã PIN?".
              </div>
            ) : (
              <>
                <DigitInputs
                  digits={pinDigits}
                  refsArray={pinRefs}
                  hasError={!!pinError}
                  hasSuccess={digitSuccess}
                  shake={digitShake}
                  disabled={pinSubmitting}
                  onChange={setPinDigits}
                  onComplete={submitPin}
                />
                {pinError && (
                  <p className="pf-field-error" style={{ textAlign: "center" }}>
                    {pinError}
                  </p>
                )}
              </>
            )}

            <button
              type="button"
              className="fg-forgot-link"
              onClick={openForgotFlow}
            >
              Quên mã PIN?
            </button>

            <div className="pf-confirm-actions">
              <Link to="/" className="pf-confirm-cancel pf-btn-tactile">
                Về trang chủ
              </Link>
              {!isLockedOut && (
                <button
                  className="pf-confirm-ok pf-btn-tactile"
                  onClick={() => submitPin()}
                  disabled={pinSubmitting}
                >
                  {pinSubmitting ? (
                    <Loader2 size={14} className="pkd-spin" />
                  ) : (
                    "Xác nhận"
                  )}
                </button>
              )}
            </div>
          </>
        )}

        {step !== "pin" && (
          <>
            <div className="pkd-pin-steps">
              {stepsOrder.map((s) => (
                <span
                  key={s}
                  className={`pkd-pin-step-dot ${step === s ? "is-active" : ""}`}
                />
              ))}
            </div>

            {step === "otp" && (
              <>
                <div className="pf-confirm-icon">
                  <Bell size={18} />
                </div>
                <h3 className="pf-confirm-title">Nhập mã OTP</h3>
                <p className="pf-confirm-msg">
                  Mã xác thực đã được gửi tới email của bạn.
                </p>
                <div className="otp-email-mask">
                  {maskedEmail || "email của bạn"}
                </div>
                <DigitInputs
                  digits={otpDigits}
                  refsArray={otpRefs}
                  hasError={!!pinError}
                  shake={digitShake}
                  disabled={otpSending}
                  onChange={setOtpDigits}
                  onComplete={submitOtpStep}
                />
                {pinError && (
                  <p className="pf-field-error" style={{ textAlign: "center" }}>
                    {pinError}
                  </p>
                )}
                <div className="otp-resend">
                  Chưa nhận được mã?
                  <button
                    type="button"
                    disabled={resendCooldown > 0}
                    onClick={sendOtp}
                  >
                    {resendCooldown > 0
                      ? `Gửi lại (${resendCooldown}s)`
                      : "Gửi lại mã"}
                  </button>
                </div>
                <div className="pf-confirm-actions">
                  <button
                    className="pf-confirm-cancel pf-btn-tactile"
                    onClick={resetForgotState}
                  >
                    Huỷ
                  </button>
                  <button
                    className="pf-confirm-ok pf-btn-tactile"
                    onClick={() => submitOtpStep()}
                  >
                    Tiếp tục
                  </button>
                </div>
              </>
            )}

            {step === "new" && (
              <>
                <div className="pf-confirm-icon">
                  <KeyRound size={18} />
                </div>
                <h3 className="pf-confirm-title">Đặt mã PIN mới</h3>
                <p className="pf-confirm-msg">
                  Chọn 4 chữ số dễ nhớ nhưng không quá đơn giản.
                </p>
                <DigitInputs
                  digits={newPinDigits}
                  refsArray={newPinRefs}
                  hasError={!!pinError}
                  shake={digitShake}
                  onChange={setNewPinDigits}
                  onComplete={submitNewPinStep}
                />
                {pinError && (
                  <p className="pf-field-error" style={{ textAlign: "center" }}>
                    {pinError}
                  </p>
                )}
                <div className="pf-confirm-actions">
                  <button
                    className="pf-confirm-cancel pf-btn-tactile"
                    onClick={resetForgotState}
                  >
                    Huỷ
                  </button>
                  <button
                    className="pf-confirm-ok pf-btn-tactile"
                    onClick={() => submitNewPinStep()}
                  >
                    Tiếp tục
                  </button>
                </div>
              </>
            )}

            {step === "confirm" && (
              <>
                <div className="pf-confirm-icon">
                  <Check size={18} />
                </div>
                <h3 className="pf-confirm-title">Nhập lại mã PIN mới</h3>
                <p className="pf-confirm-msg">
                  Xác nhận lại để chắc chắn không gõ nhầm.
                </p>
                <DigitInputs
                  digits={confirmPinDigits}
                  refsArray={confirmPinRefs}
                  hasError={!!pinError}
                  hasSuccess={digitSuccess}
                  shake={digitShake}
                  disabled={forgotSubmitting}
                  onChange={setConfirmPinDigits}
                  onComplete={submitConfirmStep}
                />
                {pinError && (
                  <p className="pf-field-error" style={{ textAlign: "center" }}>
                    {pinError}
                  </p>
                )}
                <div className="pf-confirm-actions">
                  <button
                    className="pf-confirm-cancel pf-btn-tactile"
                    onClick={resetForgotState}
                  >
                    Huỷ
                  </button>
                  <button
                    className="pf-confirm-ok pf-btn-tactile"
                    onClick={() => submitConfirmStep()}
                    disabled={forgotSubmitting}
                  >
                    {forgotSubmitting ? (
                      <Loader2 size={14} className="pkd-spin" />
                    ) : (
                      <>
                        <Check size={14} /> Lưu mã PIN
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
