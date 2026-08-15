import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, Lock, SearchX, BookOpen } from "lucide-react";
import { ebookService } from "../services/ebookService";
import { PreviewOverlay } from "./admin/EbookEditor";
import "../components/assets/css/gameplay.css";

export default function EbookReader() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({ status: "loading", data: null });

  useEffect(() => {
    let cancelled = false;

    async function fetchEbook() {
      try {
        const res = await ebookService.readBySlug(slug);
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
  }, [slug, navigate]);

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
          <h1>Bạn chưa có quyền đọc sách điện tử này</h1>
          <p>
            Sách điện tử chỉ dành cho khách hàng đã mua bản điện tử (ebook) của cuốn sách này. Nếu bạn đã mua,
            vui lòng kiểm tra lại tài khoản đang đăng nhập hoặc liên hệ với chúng tôi để được hỗ trợ.
          </p>
          <Link to="/" className="bb-btn bb-btn-primary" style={{ marginTop: 12 }}>
            Về trang chủ
          </Link>
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
        </div>
      </main>
    );
  }

  const { data } = state;
  const bookUrl = data.book?.slug && data.book?.hashId ? `/books/${data.book.slug}/${data.book.hashId}` : "/";

  return (
    <main className="gp-view" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="gp-topbar">
        <Link to={bookUrl} className="gp-back">
          <BookOpen size={14} /> {data.book?.title || "Về trang sách"}
        </Link>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <PreviewOverlay
          pages={Array.isArray(data.pages) ? data.pages : []}
          startIndex={0}
          orientation={data.orientation === "PORTRAIT" ? "PORTRAIT" : "LANDSCAPE"}
          pageNumberPos={{ v: "bottom", h: "center" }}
          showTitleWithPageNumber={false}
          hidePageNumberOnCover={false}
          onClose={() => navigate(bookUrl)}
        />
      </div>
    </main>
  );
}