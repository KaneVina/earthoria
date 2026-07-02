import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { arService } from "../services/arService";
import Model3D from "../components/3d/Model3D";
import "../components/assets/css/arview.css";

/**
 * Trang xem AR khi khách quét QR trong sách — BẮT BUỘC đăng nhập.
 * Route: /ar/:slug/:code
 *
 * Lưu ý quan trọng: chỉ `code` được dùng để gọi API và tra cứu dữ liệu.
 * `slug` trên URL chỉ để hiển thị tên sách đẹp mắt trong đường dẫn.
 * Nếu `slug` trên URL không khớp với sách thật sự sở hữu `code`, trang
 * sẽ tự điều hướng lại đúng URL chuẩn — không vì vậy mà lộ sách khác,
 * vì dữ liệu trả về luôn được tra theo `code`, không theo `slug`.
 *
 * QUYỀN TRUY CẬP (đã đổi so với bản cũ):
 *   - Chưa đăng nhập (401 từ backend)  -> chuyển sang /login kèm
 *     ?redirect=<url hiện tại> để sau khi login xong tự quay lại đúng
 *     trang AR đang xem, KHÔNG bắt khách quét lại QR.
 *   - Đã đăng nhập nhưng chưa mua sách / đơn chưa giao (403)  -> hiển
 *     thị màn "không có quyền xem", không lộ modelUrl.
 *   - Mã không tồn tại hoặc đã bị vô hiệu hoá (404)  -> hiển thị màn
 *     "không tìm thấy mã".
 *
 * NOTE: phần `specs` / `description` / `funFacts` hiện đang HARDCODE dữ
 * liệu mẫu vì API /ar/:code chưa trả về các field này. Khi backend bổ
 * sung, chỉ cần thay khối FALLBACK_DATA bên dưới bằng field thật từ
 * `res.data.data`.
 *
 * UX flow:
 *   1. "scanning"  — hiệu ứng quét công nghệ chạy qua model vài giây
 *   2. "preview"   — model thu nhỏ ở giữa, 2 panel thông tin hiện đầy
 *                    đủ 2 bên, có 1 nút nổi để phóng to
 *   3. "immersive" — bấm nút phóng to: model animate lớn dần vừa màn
 *                    hình, 2 panel thu gọn lại thành 2 nút tròn nhỏ;
 *                    bấm nút đó để quay lại "preview"
 *   Trong cả "preview" và "immersive", người dùng vẫn kéo/xoay/zoom
 *   model bình thường qua OrbitControls.
 *   Panel phải còn có nút "Xem thêm thông tin" mở modal chi tiết (nền
 *   phía sau làm mờ), hiển thị đầy đủ thông số + mô tả (không bị giới
 *   hạn 3 dòng như trên mobile) + phần "Có thể bạn chưa biết".
 */

// ─── DỮ LIỆU MẪU (HARDCODE) — thay bằng dữ liệu thật từ API khi sẵn sàng ───
const FALLBACK_DATA = {
  label: "Gấu Bắc Cực",
  modelUrl: "/models/Untitled.glb",
  book: {
    title: "Earthoria — Thế Giới Động Vật",
    slug: "earthoria-the-gioi-dong-vat",
  },
  specs: [
    { label: "Cân nặng", value: "300 - 600 kg" },
    { label: "Chiều cao", value: "1.3 - 1.6 m" },
    { label: "Số lượng còn lại", value: "~26.000 cá thể" },
    { label: "Môi trường sống", value: "Bắc Cực, vùng băng giá" },
    { label: "Tuổi thọ", value: "20 - 30 năm" },
  ],
  description:
    "Gấu Bắc Cực là loài thú ăn thịt trên cạn lớn nhất hành tinh, sở hữu lớp lông trắng dày và lớp mỡ dưới da giúp chịu được cái lạnh khắc nghiệt. Chúng là những thợ săn hải cẩu tài ba, có thể bơi hàng chục km giữa các tảng băng. Biến đổi khí hậu đang khiến môi trường sống của chúng thu hẹp nhanh chóng, đẩy loài này đến gần nguy cơ tuyệt chủng.",
  funFacts: [
    "Da của gấu Bắc Cực thực chất có màu đen — giúp hấp thụ nhiệt mặt trời tốt hơn qua lớp lông trong suốt bên ngoài.",
    "Chúng có thể ngửi thấy mùi hải cẩu từ cách xa hơn 1 km, kể cả khi con mồi ở dưới lớp băng dày.",
    "Bàn chân to bản như mái chèo giúp gấu phân bổ trọng lượng khi di chuyển trên băng mỏng và bơi đường dài.",
  ],
};
// ──────────────────────────────────────────────────────────────────────────

const SCAN_DURATION_MS = 2400;

export default function ArView() {
  const { slug, code } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({
    status: "loading", // loading | ready | not-found | forbidden
    data: null,
  });

  // "scanning" -> "preview" -> "immersive" (and back)
  const [stage, setStage] = useState("scanning");
  const scanTimeoutRef = useRef(null);

  // Modal "Xem thêm thông tin" — mở/đóng độc lập với stage, chỉ có ý
  // nghĩa khi đang ở "preview" (nút bị ẩn cùng panel ở stage khác).
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (!isDetailOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") setIsDetailOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailOpen]);

  useEffect(() => {
    let cancelled = false;

    async function fetchArCode() {
      try {
        const res = await arService.getArCode(code);
        if (cancelled) return;

        const data = res.data?.data;
        if (!data) {
          setState({ status: "not-found", data: null });
          return;
        }

        // Nếu slug trên URL không khớp sách thật, điều hướng lại URL chuẩn
        // (không reload trang, chỉ sửa lại địa chỉ cho gọn và đúng SEO).
        if (data.book?.slug && data.book.slug !== slug) {
          navigate(`/ar/${data.book.slug}/${code}`, { replace: true });
        }

        // Ghép dữ liệu thật với dữ liệu mẫu cho các field API chưa có
        // (specs / description) để UI luôn có nội dung hiển thị.
        setState({
          status: "ready",
          data: {
            ...FALLBACK_DATA,
            ...data,
            specs: data.specs || FALLBACK_DATA.specs,
            description: data.description || FALLBACK_DATA.description,
            funFacts: data.funFacts || FALLBACK_DATA.funFacts,
          },
        });
      } catch (err) {
        if (cancelled) return;

        const httpStatus = err.response?.status;

        if (httpStatus === 401) {
          // Chưa đăng nhập — không tự động thử quét lại, dẫn thẳng sang
          // trang login kèm redirect để quay lại đúng URL này (bao gồm
          // cả /slug/code) ngay sau khi đăng nhập thành công.
          const currentUrl = `${window.location.pathname}${window.location.search}`;
          navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, {
            replace: true,
          });
          return;
        }

        if (httpStatus === 403) {
          // Đã đăng nhập nhưng không sở hữu sách này (chưa mua / đơn
          // chưa giao) — không tiết lộ modelUrl, hiển thị màn riêng.
          setState({ status: "forbidden", data: null });
          return;
        }

        // 404 hoặc lỗi khác đều coi như "không tìm thấy mã" để không
        // lộ chi tiết lỗi hệ thống ra ngoài.
        setState({ status: "not-found", data: null });
      }
    }

    fetchArCode();
    return () => {
      cancelled = true;
    };
  }, [code, slug, navigate]);

  // Sau khi data sẵn sàng, chạy hiệu ứng quét rồi mới chuyển sang preview
  useEffect(() => {
    if (state.status !== "ready") return;
    setStage("scanning");
    scanTimeoutRef.current = setTimeout(() => {
      setStage("preview");
    }, SCAN_DURATION_MS);
    return () => clearTimeout(scanTimeoutRef.current);
  }, [state.status]);

  if (state.status === "loading") {
    return (
      <main className="ar-view ar-view--center">
        <div className="ar-view__loading" role="status" aria-live="polite">
          <div className="ar-view__spinner" aria-hidden="true" />
          <span className="ar-view__loading-text">
            Đang chuẩn bị mô hình AR…
          </span>
        </div>
      </main>
    );
  }

  if (state.status === "forbidden") {
    return (
      <main className="ar-view ar-view--center">
        <div className="ar-view__empty">
          <div className="ar-view__badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect
                x="5"
                y="11"
                width="14"
                height="9"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M8 11V7.5a4 4 0 0 1 8 0V11"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle cx="12" cy="15.3" r="1.3" fill="currentColor" />
            </svg>
          </div>
          <span className="ar-view__eyebrow">Earthoria AR</span>
          <h1>Bạn chưa có quyền xem mô hình này</h1>
          <p>
            Mô hình 3D này chỉ hiển thị cho khách hàng đã mua và nhận được
            cuốn sách tương ứng. Nếu bạn đã mua sách này, vui lòng kiểm tra
            lại tài khoản đang đăng nhập hoặc liên hệ với chúng tôi để được
            hỗ trợ.
          </p>
        </div>
      </main>
    );
  }

  if (state.status === "not-found") {
    return (
      <main className="ar-view ar-view--center">
        <div className="ar-view__empty">
          <div className="ar-view__badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle
                cx="12"
                cy="12"
                r="8.2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeDasharray="2.4 3.2"
              />
              <path
                d="M14.6 9.4 12.9 13l-3.6 1.7 1.7-3.6 3.6-1.7Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="ar-view__eyebrow">Earthoria AR</span>
          <h1>Không tìm thấy mã này</h1>
          <p>
            Mã AR không tồn tại hoặc đã bị vô hiệu hoá. Vui lòng kiểm tra lại
            trang sách hoặc liên hệ với chúng tôi nếu bạn nghĩ đây là nhầm
            lẫn.
          </p>
        </div>
      </main>
    );
  }

  const { label, modelUrl, book, specs, description, funFacts } = state.data;
  const isScanning = stage === "scanning";
  const isImmersive = stage === "immersive";
  const isPreview = stage === "preview";

  // Model nhỏ khi đang ở chế độ preview, full khi immersive, và gần như
  // ẩn (hơi nhỏ + mờ) trong lúc đang quét để hiệu ứng scan là tâm điểm.
  const scaleMultiplier = isImmersive ? 1 : 0.55;

  return (
    <main className={`ar-view ar-view--${stage}`}>
      {/* Glow nền chuyển động phía sau toàn bộ stage */}
      <div className="ar-view__glow" aria-hidden="true" />

      {/* Mô hình 3D nền, full màn hình; tự thu/phóng theo scaleMultiplier */}
      <div className="ar-view__stage">
        <Model3D
          url={modelUrl}
          height="100%"
          autoRotate
          enableZoom
          minDistance={0.7}
          maxDistance={9}
          scaleMultiplier={scaleMultiplier}
          showTechBackdrop
          techColor="#6fe06a"
        />
      </div>

      {/* ── Hiệu ứng quét công nghệ — chỉ hiện ở stage "scanning" ── */}
      <div
        className={`ar-scan${isScanning ? " is-active" : ""}`}
        aria-hidden="true"
      >
        <div className="ar-scan__frame">
          <span className="ar-scan__corner ar-scan__corner--tl" />
          <span className="ar-scan__corner ar-scan__corner--tr" />
          <span className="ar-scan__corner ar-scan__corner--bl" />
          <span className="ar-scan__corner ar-scan__corner--br" />
          <div className="ar-scan__line" />
          <div className="ar-scan__grid" />
        </div>
        <div className="ar-scan__label">
          <span className="ar-scan__dot" />
          Đang dựng mô hình 3D…
        </div>
      </div>

      {/* Vignette để chữ overlay luôn đọc được dù model sáng/tối */}
      <div className="ar-view__vignette" aria-hidden="true" />

      {/* ── Overlay trái: tên sách nhỏ / tên nhân vật to / hướng dẫn ── */}
      <section
        className={`ar-panel ar-panel--left${
          isImmersive ? " is-collapsed" : ""
        }${isScanning ? " is-hidden" : ""}`}
      >
        <span className="ar-panel__book">{book.title}</span>
        <h1 className="ar-panel__name">{label}</h1>

        <div className="ar-hint">
          <div className="ar-hint__row">
            <svg
              className="ar-hint__icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 12c2.5-4 5.5-6 9-6s6.5 2 9 6c-2.5 4-5.5 6-9 6s-6.5-2-9-6Z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span>Kéo để xoay mô hình</span>
          </div>
          <div className="ar-hint__row">
            <svg
              className="ar-hint__icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.4" />
              <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M11 8.5v5M8.5 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span>Cuộn / chụm hai ngón để phóng to · thu nhỏ</span>
          </div>
        </div>
      </section>

      {/* ── Overlay phải: Đặc điểm + bảng thông số + mô tả ── */}
      <section
        className={`ar-panel ar-panel--right${
          isImmersive ? " is-collapsed" : ""
        }${isScanning ? " is-hidden" : ""}`}
      >
        <span className="ar-panel__eyebrow">Đặc điểm</span>

        <dl className="ar-specs">
          {specs.map((item) => (
            <div className="ar-specs__row" key={item.label}>
              <dt>{item.label}</dt>
              <span className="ar-specs__leader" aria-hidden="true" />
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>

        <p className="ar-panel__desc">{description}</p>

        <button
          type="button"
          className="ar-more-btn"
          onClick={() => setIsDetailOpen(true)}
        >
          <span>Xem thêm thông tin</span>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </section>

      {/* ── Nút điều khiển preview <-> immersive ── */}
      {isPreview && (
        <button
          type="button"
          className="ar-expand-btn"
          onClick={() => setStage("immersive")}
          aria-label="Phóng to mô hình toàn màn hình"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Phóng to mô hình</span>
        </button>
      )}

      {isImmersive && (
        <>
          <button
            type="button"
            className="ar-mini-btn ar-mini-btn--left"
            onClick={() => setStage("preview")}
            aria-label="Hiện thông tin chi tiết"
            title="Hiện thông tin"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 6h16M4 12h10M4 18h7"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="ar-mini-btn ar-mini-btn--right"
            onClick={() => setStage("preview")}
            aria-label="Thu nhỏ mô hình"
            title="Thu nhỏ"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      {/* ── Modal "Xem thêm thông tin": nền phía sau làm mờ (backdrop
          blur), thẻ nổi giữa/đáy màn hình chứa đầy đủ thông số + mô tả
          (không bị line-clamp như trên panel) + phần "Có thể bạn chưa
          biết". Đóng bằng nút X, bấm ra ngoài nền mờ, hoặc phím Esc. ── */}
      {isDetailOpen && (
        <div
          className="ar-detail"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ar-detail-name"
        >
          <div
            className="ar-detail__backdrop"
            onClick={() => setIsDetailOpen(false)}
            aria-hidden="true"
          />
          <div className="ar-detail__sheet">
            <button
              type="button"
              className="ar-detail__close"
              onClick={() => setIsDetailOpen(false)}
              aria-label="Đóng thông tin chi tiết"
              autoFocus
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <span className="ar-panel__book">{book.title}</span>
            <h2 id="ar-detail-name" className="ar-panel__name">
              {label}
            </h2>

            <dl className="ar-detail__specs">
              {specs.map((item) => (
                <div className="ar-detail__spec" key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>

            <p className="ar-panel__desc">{description}</p>

            {Array.isArray(funFacts) && funFacts.length > 0 && (
              <div className="ar-detail__facts">
                <span className="ar-detail__facts-title">
                  Có thể bạn chưa biết
                </span>
                <ul>
                  {funFacts.map((fact, index) => (
                    <li key={index}>{fact}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}