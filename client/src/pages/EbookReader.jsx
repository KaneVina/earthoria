import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, Lock, SearchX } from "lucide-react";
import { ebookService } from "../services/ebookService";
import { PreviewOverlay } from "./admin/EbookEditor";
import "../components/assets/css/gameplay.css";

export default function EbookReader() {
  // :token + :bookSlug chỉ có khi vào từ link riêng của bé
  // (route /e-kid/:slug/:token/ebook/:bookSlug)
  const { slug, bookSlug, token } = useParams();
  const navigate = useNavigate();
  const isKidMode = !!token;
  const effectiveSlug = isKidMode ? bookSlug : slug;

  const [state, setState] = useState({ status: "loading", data: null });

  useEffect(() => {
    let cancelled = false;

    async function fetchEbook() {
      try {
        const res = await ebookService.readBySlug(effectiveSlug, token);
        if (cancelled) return;
        const data = res.data?.data;
        if (!data) {
          setState({ status: "not-found", data: null });
          return;
        }
        setState({ status: "ready", data });
      } catch (err) {
        if (cancelled) return;
        const httpStatus = err.response?.status;

        if (httpStatus === 401) {
          // Phiên của bé không có tài khoản để đăng nhập lại — hiện màn
          // hình "không tìm thấy" thân thiện thay vì đá về /login.
          if (isKidMode) {
            setState({ status: "not-found", data: null });
            return;
          }
          const currentUrl = `${window.location.pathname}${window.location.search}`;
          navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
          return;
        }
        if (httpStatus === 403) {
          setState({ status: "forbidden", data: null });
          return;
        }
        setState({ status: "not-found", data: null });
      }
    }

    fetchEbook();
    return () => {
      cancelled = true;
    };
  }, [effectiveSlug, token, isKidMode, navigate]);

  if (state.status === "loading") {
    return (
      <main className="gp-view gp-view--center">
        <div className="gp-loading">
          <Loader2 size={26} className="gp-spin" />
          <span>Đang tải sách điện tử…</span>
        </div>
      </main>
    );
  }

  if (state.status === "forbidden") {
    return (
      <main className="gp-view gp-view--center">
        <div className="gp-empty">
          <div className="gp-empty-badge">
            <Lock size={22} />
          </div>
          <span className="gp-eyebrow">Sách điện tử</span>
          <h1>{isKidMode ? "Chưa đọc được sách này" : "Bạn chưa có quyền đọc sách điện tử này"}</h1>
          <p>
            {isKidMode
              ? "Sách điện tử chỉ đọc được khi gia đình đã mua bản điện tử của cuốn sách này. Nhờ ba mẹ kiểm tra lại nhé!"
              : "Sách điện tử chỉ dành cho khách hàng đã mua bản điện tử (ebook) của cuốn sách này. Nếu bạn đã mua, vui lòng kiểm tra lại tài khoản đang đăng nhập hoặc liên hệ với chúng tôi để được hỗ trợ."}
          </p>
          {isKidMode ? (
            <Link to={`/e-kid/${slug}/${token}`} className="gp-cta" style={{ marginTop: 12 }}>
              Quay lại tủ sách
            </Link>
          ) : (
            <button className="gp-cta" style={{ marginTop: 12 }} onClick={() => navigate("/")}>
              Về trang chủ
            </button>
          )}
        </div>
      </main>
    );
  }

  if (state.status === "not-found") {
    return (
      <main className="gp-view gp-view--center">
        <div className="gp-empty">
          <div className="gp-empty-badge">
            <SearchX size={22} />
          </div>
          <span className="gp-eyebrow">Sách điện tử</span>
          <h1>Không tìm thấy sách điện tử này</h1>
          <p>Sách này chưa có bản điện tử hoặc đường dẫn không còn hiệu lực.</p>
          {isKidMode && (
            <Link to={`/e-kid/${slug}/${token}`} className="gp-cta" style={{ marginTop: 12 }}>
              Quay lại tủ sách
            </Link>
          )}
        </div>
      </main>
    );
  }

  const { data } = state;
  const bookUrl = isKidMode
    ? `/e-kid/${slug}/${token}`
    : data.book?.slug && data.book?.hashId
      ? `/books/${data.book.slug}/${data.book.hashId}`
      : "/";

  return (
    <PreviewOverlay
      pages={Array.isArray(data.pages) ? data.pages : []}
      startIndex={0}
      orientation={data.orientation === "PORTRAIT" ? "PORTRAIT" : "LANDSCAPE"}
      pageNumberPos={{ v: "bottom", h: "center" }}
      showTitleWithPageNumber={false}
      hidePageNumberOnCover={false}
      bookInfo={data.book}
      storageKey={data.id}
      resumeFromStorage
      onClose={() => navigate(bookUrl)}
    />
  );
}