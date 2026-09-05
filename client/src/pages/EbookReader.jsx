import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, Lock, SearchX, AlarmClock } from "lucide-react";
import toast from "react-hot-toast";
import { ebookService } from "../services/ebookService";
import { kidAccessService } from "../services/kidAccessService";
import { PreviewOverlay } from "./admin/EbookEditor";
import { useKidRestBreak } from "../hooks/useKidRestBreak";
import { KidRestBreakOverlay } from "../components/kid/KidRestBreakOverlay";
import "../components/assets/css/gameplay.css";
import "../components/assets/css/kidAccess.css";

export default function EbookReader() {
  // :token + :bookSlug chỉ có khi vào từ link riêng của bé
  // (route /e-kid/:slug/:token/ebook/:bookSlug)
  const { slug, bookSlug, token } = useParams();
  const navigate = useNavigate();
  const isKidMode = !!token;
  const effectiveSlug = isKidMode ? bookSlug : slug;

  const [state, setState] = useState({ status: "loading", data: null });
  const book = state.data?.book;

  // Giờ đọc còn lại hôm nay (do ba mẹ thiết lập) — chỉ có ở chế độ đọc
  // riêng của bé. Lấy 1 lần từ hồ sơ bé, rồi cập nhật số phút đã đọc theo
  // mỗi lần ping phiên hoạt động bên dưới.
  const [kidTimeInfo, setKidTimeInfo] = useState(null);
  // Hồ sơ đầy đủ của bé (bao gồm cấu hình nhắc nghỉ mắt/giải lao bắt buộc) —
  // để nhắc nghỉ mắt vẫn chạy được ngay trong lúc bé đang đọc sách, đồng bộ
  // với trang kệ sách (/e-kid/:slug/:token) thay vì chỉ chạy ở đó.
  const [kidChild, setKidChild] = useState(null);
  const saveKidReadingProgress = useCallback(
    (currentPage, totalPages) => {
      if (!isKidMode || !token || !book?.slug || !totalPages) return;
      try {
        const storageKey = `earthoria:kidReading:${token}`;
        const raw = localStorage.getItem(storageKey);
        const map = raw ? JSON.parse(raw) : {};
        map[book.slug] = {
          slug: book.slug,
          title: book.title,
          coverImage: book.coverImage,
          currentPage,
          totalPages,
          updatedAt: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(map));
      } catch {
        // localStorage không khả dụng — bỏ qua, không chặn trải nghiệm đọc
      }
    },
    [isKidMode, token, book],
  );

  // Lấy giới hạn giờ đọc/ngày do ba mẹ đặt + số phút bé đã đọc hôm nay,
  // để hiện icon "giờ đọc còn lại" trên header của trình đọc sách. Đồng
  // thời lưu cả hồ sơ đầy đủ để dùng cho nhắc nghỉ mắt/giải lao bắt buộc.
  useEffect(() => {
    if (!isKidMode || !token) return;
    let cancelled = false;
    kidAccessService
      .getProfile(token)
      .then((res) => {
        if (cancelled) return;
        const child = res.data?.data?.child;
        if (!child) return;
        setKidTimeInfo({
          dailyLimitMinutes: child.dailyLimitMinutes || 0,
          todayMinutes: child.todayMinutes || 0,
        });
        setKidChild(child);
      })
      .catch(() => {
        // Không chặn trải nghiệm đọc nếu không lấy được thông tin giờ đọc
      });
    return () => {
      cancelled = true;
    };
  }, [isKidMode, token]);

  // Nhắc nghỉ mắt định kỳ + giải lao bắt buộc — chạy ngay trong lúc đọc,
  // dùng chung hook/overlay với trang kệ sách (KidAccess) và trang AR.
  const restBreak = useKidRestBreak(
    kidChild,
    isKidMode && state.status === "ready",
    token,
  );

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
          navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, {
            replace: true,
          });
          return;
        }
        if (httpStatus === 403) {
          const errCode = err.response?.data?.code;
          if (errCode === "CHILD_LOCKED") {
            setState({
              status: "restricted",
              data: {
                title: "Thiết bị đang bị khoá",
                message:
                  "Ba mẹ đã tạm khoá thiết bị của bé rồi. Nhờ ba mẹ mở khoá lại nhé!",
              },
            });
            return;
          }
          if (errCode === "DAILY_LIMIT_REACHED") {
            setState({
              status: "restricted",
              data: {
                title: "Hết giờ dùng hôm nay rồi",
                message:
                  "Bé đã dùng hết thời gian hôm nay rồi, hẹn bé ngày mai nhé!",
              },
            });
            return;
          }
          if (errCode === "OUTSIDE_ALLOWED_WINDOW") {
            setState({
              status: "restricted",
              data: {
                title: "Ngoài giờ được phép rồi",
                message:
                  "Bây giờ không phải giờ ba mẹ cho phép bé đọc sách nhé.",
              },
            });
            return;
          }
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

  // Kid mode: ghi nhận phiên đọc thật lên server (server tự tính phút bằng
  // đồng hồ server, không dùng số phút đếm ở client) — để Parent Dashboard có
  // dữ liệu thật và daily limit/khung giờ được áp dụng đúng trong lúc đọc.
  useEffect(() => {
    if (!isKidMode || state.status !== "ready") return;

    let cancelled = false;
    let activityId = null;
    let intervalId = null;

    async function start() {
      try {
        const res = await kidAccessService.startActivity(token, {
          bookId: state.data?.book?.id,
        });
        if (cancelled) return;
        activityId = res.data?.data?.activityId;
        if (!activityId) return;

        intervalId = setInterval(async () => {
          try {
            const pingRes = await kidAccessService.pingActivity(
              token,
              activityId,
            );
            const info = pingRes.data?.data;
            if (typeof info?.todayMinutes === "number") {
              setKidTimeInfo((prev) => ({
                dailyLimitMinutes: prev?.dailyLimitMinutes ?? 0,
                todayMinutes: info.todayMinutes,
              }));
            }
            if (
              info?.locked ||
              info?.limitReached ||
              info?.withinWindow === false
            ) {
              // Báo ngay cho bé biết vì sao bị đưa ra khỏi trang đọc, thay vì
              // chuyển trang lặng lẽ khiến bé không hiểu chuyện gì xảy ra.
              const msg = info?.locked
                ? "Ba mẹ đã khoá thiết bị rồi. Hẹn bé lần sau nhé!"
                : info?.limitReached
                  ? "Bé đã đọc đủ giờ hôm nay rồi, giỏi lắm!"
                  : "Đã ngoài giờ đọc sách ba mẹ cho phép rồi.";
              toast(msg, { icon: <AlarmClock size={16} />, duration: 5000 });
              navigate(`/e-kid/${slug}/${token}`, { replace: true });
            }
          } catch {
            // Bỏ qua lỗi 1 lần ping (vd mất mạng tạm thời) — thử lại ở lần kế tiếp
          }
        }, 45000);
      } catch {
        // Không chặn trải nghiệm đọc chỉ vì việc ghi nhận phiên thất bại
      }
    }

    start();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (activityId)
        kidAccessService.pingActivity(token, activityId).catch(() => {});
    };
  }, [isKidMode, state.status, state.data?.book?.id, token, slug, navigate]);

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

  if (state.status === "restricted") {
    return (
      <main className="gp-view gp-view--center">
        <div className="gp-empty">
          <div className="gp-empty-badge">
            <Lock size={22} />
          </div>
          <span className="gp-eyebrow">Sách điện tử</span>
          <h1>{state.data?.title || "Chưa đọc được sách này"}</h1>
          <p>{state.data?.message || "Nhờ ba mẹ kiểm tra lại nhé!"}</p>
          {isKidMode && (
            <Link
              to={`/e-kid/${slug}/${token}`}
              className="gp-cta"
              style={{ marginTop: 12 }}
            >
              Quay lại tủ sách
            </Link>
          )}
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
          <h1>
            {isKidMode
              ? "Chưa đọc được sách này"
              : "Bạn chưa có quyền đọc sách điện tử này"}
          </h1>
          <p>
            {isKidMode
              ? "Sách điện tử chỉ đọc được khi gia đình đã mua bản điện tử của cuốn sách này. Nhờ ba mẹ kiểm tra lại nhé!"
              : "Sách điện tử chỉ dành cho khách hàng đã mua bản điện tử (ebook) của cuốn sách này. Nếu bạn đã mua, vui lòng kiểm tra lại tài khoản đang đăng nhập hoặc liên hệ với chúng tôi để được hỗ trợ."}
          </p>
          {isKidMode ? (
            <Link
              to={`/e-kid/${slug}/${token}`}
              className="gp-cta"
              style={{ marginTop: 12 }}
            >
              Quay lại tủ sách
            </Link>
          ) : (
            <button
              className="gp-cta"
              style={{ marginTop: 12 }}
              onClick={() => navigate("/")}
            >
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
            <Link
              to={`/e-kid/${slug}/${token}`}
              className="gp-cta"
              style={{ marginTop: 12 }}
            >
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
    <>
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
        onProgress={saveKidReadingProgress}
        onClose={() => navigate(bookUrl)}
        kidTimeInfo={isKidMode ? kidTimeInfo : null}
      />
      {isKidMode && (
        <KidRestBreakOverlay
          showRest={restBreak.showRest}
          showBreak={restBreak.showBreak}
          restLeft={restBreak.restLeft}
          breakLeft={restBreak.breakLeft}
          breathPhase={restBreak.breathPhase}
          eyeTip={restBreak.eyeTip}
          showRestTip={restBreak.showRestTip}
          onDismissRest={restBreak.dismissRest}
        />
      )}
    </>
  );
}
