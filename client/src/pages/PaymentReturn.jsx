import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Check, X, Loader2, ShieldCheck, RefreshCcw } from "lucide-react";
import { paymentService } from "../services/paymentService";
import { useAuthStore } from "../store/authStore";

// Sau khi verify về, đơn có thể ở 3 trạng thái hiển thị:
// - success: đã được IPN xác nhận PAID
// - pending: gateway báo thành công nhưng IPN (nguồn xác nhận chính) chưa kịp xử lý xong — không phải lỗi
// - failed: gateway báo thất bại/huỷ, hoặc phiên đã hết hạn, hoặc dữ liệu không khớp
export default function PaymentReturn({ method }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [state, setState] = useState({
    loading: true,
    success: false,
    pending: false,
    orderId: null,
    message: "",
  });
  const [retrying, setRetrying] = useState(false);
  const [rechecking, setRechecking] = useState(false);

  const methodLabel = method === "vnpay" ? "VNPay" : "MoMo";

  const runVerify = (showLoading) => {
    const qs = location.search.replace(/^\?/, "");
    if (!qs) {
      setState({ loading: false, success: false, pending: false, orderId: null, message: "Thiếu thông tin giao dịch" });
      return;
    }

    if (showLoading) setState((s) => ({ ...s, loading: true }));

    const verify = method === "vnpay" ? paymentService.verifyVnpayReturn : paymentService.verifyMomoReturn;
    return verify(qs)
      .then(({ data }) => {
        const { orderId, success, pending, message } = data.data;
        setState({ loading: false, success: !!success, pending: !!pending, orderId, message: message || data.message });
      })
      .catch((err) => {
        setState({
          loading: false,
          success: false,
          pending: false,
          orderId: null,
          message: err?.response?.data?.message || "Không xác thực được giao dịch",
        });
      });
  };

  useEffect(() => {
    // Chưa đăng nhập (vd token hết hạn trong lúc thanh toán) → cho đăng nhập lại rồi quay về đúng URL này
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    runVerify(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, isAuthenticated]);

  const recheck = async () => {
    setRechecking(true);
    try {
      await runVerify(false);
    } finally {
      setRechecking(false);
    }
  };

  const retryPayment = async () => {
    if (!state.orderId) return;
    setRetrying(true);
    try {
      const create = method === "vnpay" ? paymentService.createVnpayUrl : paymentService.createMomoUrl;
      const { data } = await create(state.orderId);
      window.location.href = data.data.paymentUrl;
    } catch {
      setRetrying(false);
    }
  };

  const showPending = !state.loading && !state.success && state.pending;
  const showFailed = !state.loading && !state.success && !state.pending;

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ivory)",
      }}
    >
      <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: 440 }}>
        {state.loading ? (
          <>
            <Loader2
              size={40}
              style={{ color: "var(--gold)", animation: "spin 0.8s linear infinite", marginBottom: 24 }}
            />
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: 22,
                fontWeight: 400,
                color: "var(--forest)",
                marginBottom: 10,
              }}
            >
              Đang xác nhận thanh toán {methodLabel}…
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 300 }}>
              Vui lòng không tắt trang này.
            </p>
          </>
        ) : (
          <>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: state.success ? "var(--forest)" : showPending ? "var(--gold)" : "#b25450",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              {state.success ? (
                <Check size={30} color="var(--ivory)" strokeWidth={2} />
              ) : showPending ? (
                <Loader2 size={30} color="var(--ivory)" strokeWidth={2} />
              ) : (
                <X size={30} color="var(--ivory)" strokeWidth={2} />
              )}
            </div>

            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: 24,
                fontWeight: 400,
                color: "var(--forest)",
                marginBottom: 10,
              }}
            >
              {state.success
                ? "Thanh toán thành công!"
                : showPending
                ? "Đang chờ xác nhận…"
                : "Thanh toán chưa hoàn tất"}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32, fontWeight: 300 }}>
              {state.success
                ? `Đơn hàng của bạn đã được xác nhận qua ${methodLabel}.`
                : showPending
                ? "Giao dịch đã được gateway ghi nhận, hệ thống đang xác nhận lại — thường chỉ mất vài giây."
                : state.message || `Giao dịch ${methodLabel} không thành công hoặc đã bị huỷ.`}
            </p>

            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              {showPending && (
                <button
                  onClick={recheck}
                  disabled={rechecking}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "var(--gold)",
                    border: "none",
                    padding: "15px 32px",
                    cursor: rechecking ? "not-allowed" : "pointer",
                    opacity: rechecking ? 0.7 : 1,
                    fontFamily: "Be Vietnam Pro, sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--ink)",
                  }}
                >
                  {rechecking ? (
                    <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                  ) : (
                    <RefreshCcw size={14} />
                  )}
                  Kiểm tra lại
                </button>
              )}

              {showFailed && state.orderId && (
                <button
                  onClick={retryPayment}
                  disabled={retrying}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "var(--gold)",
                    border: "none",
                    padding: "15px 32px",
                    cursor: retrying ? "not-allowed" : "pointer",
                    opacity: retrying ? 0.7 : 1,
                    fontFamily: "Be Vietnam Pro, sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--ink)",
                  }}
                >
                  {retrying ? (
                    <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                  ) : (
                    <ShieldCheck size={14} />
                  )}
                  Thanh toán lại
                </button>
              )}

              <Link
                to="/profile"
                state={{ tab: "orders", orderId: state.orderId }}
                style={{ textDecoration: "none" }}
              >
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: state.success ? "var(--forest)" : "transparent",
                    border: state.success ? "none" : "0.5px solid var(--border)",
                    padding: "15px 32px",
                    cursor: "pointer",
                    fontFamily: "Be Vietnam Pro, sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: state.success ? "var(--ivory)" : "var(--text-muted)",
                  }}
                >
                  Xem đơn hàng
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}