import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Model3D from "../components/3d/Model3D";
import "../components/assets/css/arview.css";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

/**
 * Trang public cho người quét QR trong sách — KHÔNG cần đăng nhập.
 * Route: /ar/:slug/:code
 *
 * Lưu ý quan trọng: chỉ `code` được dùng để gọi API và tra cứu dữ liệu.
 * `slug` trên URL chỉ để hiển thị tên sách đẹp mắt trong đường dẫn.
 * Nếu `slug` trên URL không khớp với sách thật sự sở hữu `code`, trang
 * sẽ tự điều hướng lại đúng URL chuẩn — không vì vậy mà lộ sách khác,
 * vì dữ liệu trả về luôn được tra theo `code`, không theo `slug`.
 *
 * NOTE: phần `specs` / `description` hiện đang HARDCODE dữ liệu mẫu vì
 * API /ar/:code chưa trả về các field này. Khi backend bổ sung, chỉ cần
 * thay khối FALLBACK_DATA bên dưới bằng field thật từ `res.data.data`.
 */

// ─── DỮ LIỆU MẪU (HARDCODE) — thay bằng dữ liệu thật từ API khi sẵn sàng ───
const FALLBACK_DATA = {
  label: "Voi Châu Phi",
  modelUrl: "/models/Untitled.glb",
  book: {
    title: "Earthoria — Thế Giới Động Vật",
    slug: "earthoria-the-gioi-dong-vat",
  },
  specs: [
    { label: "Cân nặng", value: "4 - 7 tấn" },
    { label: "Chiều cao", value: "3 - 4 m" },
    { label: "Số lượng còn lại", value: "~415.000 cá thể" },
    { label: "Môi trường sống", value: "Xavan, rừng thưa Châu Phi" },
    { label: "Tuổi thọ", value: "60 - 70 năm" },
  ],
  description:
    "Voi Châu Phi là loài động vật trên cạn lớn nhất hành tinh, nổi bật với đôi tai to bản và cặp ngà dài. Chúng sống theo bầy đàn mẫu hệ, có trí nhớ và khả năng giao tiếp xã hội phức tạp. Hiện loài này đang đối mặt với nguy cơ tuyệt chủng do mất môi trường sống và nạn săn bắt trộm ngà voi.",
};
// ──────────────────────────────────────────────────────────────────────────

export default function ArView() {
  const { slug, code } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({
    status: "loading", // loading | ready | not-found
    data: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchArCode() {
      try {
        const res = await axios.get(`${API_BASE}/ar/${code}`);
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
          },
        });
      } catch {
        if (!cancelled) setState({ status: "not-found", data: null });
      }
    }

    fetchArCode();
    return () => {
      cancelled = true;
    };
  }, [code, slug, navigate]);

  if (state.status === "loading") {
    return (
      <main className="ar-view ar-view--center">
        <div className="ar-view__spinner" aria-label="Đang tải" />
      </main>
    );
  }

  if (state.status === "not-found") {
    return (
      <main className="ar-view ar-view--center">
        <div className="ar-view__empty">
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

  const { label, modelUrl, book, specs, description } = state.data;

  return (
    <main className="ar-view">
      {/* Mô hình 3D nền, full màn hình */}
      <div className="ar-view__stage">
        <Model3D
          url={modelUrl}
          height="100%"
          autoRotate
          enableZoom
          minDistance={0.7}
          maxDistance={9}
        />
      </div>

      {/* Vignette để chữ overlay luôn đọc được dù model sáng/tối */}
      <div className="ar-view__vignette" aria-hidden="true" />

      {/* ── Overlay trái: tên sách nhỏ / tên nhân vật to / hướng dẫn ── */}
      <section className="ar-panel ar-panel--left">
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
      <section className="ar-panel ar-panel--right">
        <span className="ar-panel__eyebrow">Đặc điểm</span>

        <dl className="ar-specs">
          {specs.map((item) => (
            <div className="ar-specs__row" key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>

        <p className="ar-panel__desc">{description}</p>
      </section>
    </main>
  );
}