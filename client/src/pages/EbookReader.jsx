import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Lock, SearchX, AlarmClock } from "lucide-react";
import toast from "react-hot-toast";
import { ebookService } from "../services/ebookService";
import { kidAccessService } from "../services/kidAccessService";
import { PreviewOverlay } from "./admin/EbookEditor";
import { useKidRestBreak } from "../hooks/useKidRestBreak";
import { KidRestBreakOverlay } from "../components/kid/KidRestBreakOverlay";
import FullScreenLoader from "../components/FullScreenLoader";
import "../components/assets/css/gameplay.css";
import "../components/assets/css/kidAccess.css";

export default function EbookReader() {
  // :token + :bookSlug chỉ có khi vào từ link riêng của bé
  // (route /e-kid/:slug/:token/ebook/:bookSlug)
  const { slug, bookSlug, token } = useParams();
  const navigate = useNavigate();
  const isKidMode = !!token;
  const effectiveSlug = isKidMode ? bookSlug : slug;

  const ebookQuery = useQuery({
    queryKey: ["ebook-reader", effectiveSlug, token],
    queryFn: () =>
      ebookService
        .readBySlug(effectiveSlug, token)
        .then((res) => res.data?.data ?? null),
    enabled: !!effectiveSlug,
  });
  const book = ebookQuery.data?.book;
  const ebookHttpStatus = ebookQuery.error?.response?.status;
  const ebookErrCode = ebookQuery.error?.response?.data?.code;

  useEffect(() => {
    if (ebookHttpStatus !== 401 || isKidMode) return;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, {
      replace: true,
    });
  }, [ebookHttpStatus, isKidMode, navigate]);

  const restrictedInfo =
    ebookHttpStatus !== 403
      ? null
      : ebookErrCode === "CHILD_LOCKED"
        ? {
            title: "Thiết bị đang bị khoá",
            message:
              "Ba mẹ đã tạm khoá thiết bị của bé rồi. Nhờ ba mẹ mở khoá lại nhé!",
          }
        : ebookErrCode === "DAILY_LIMIT_REACHED"
          ? {
              title: "Hết giờ dùng hôm nay rồi",
              message:
                "Bé đã dùng hết thời gian hôm nay rồi, hẹn bé ngày mai nhé!",
            }
          : ebookErrCode === "OUTSIDE_ALLOWED_WINDOW"
            ? {
                title: "Ngoài giờ được phép rồi",
                message:
                  "Bây giờ không phải giờ ba mẹ cho phép bé đọc sách nhé.",
              }
            : null;

  const status = ebookQuery.isLoading
    ? "loading"
    : ebookHttpStatus === 401
      ? isKidMode
        ? "not-found"
        : "loading" // không phải kid mode: đang chuyển hướng sang /login
      : restrictedInfo
        ? "restricted"
        : ebookHttpStatus === 403
          ? "forbidden"
          : ebookQuery.isError || !ebookQuery.data
            ? "not-found"
            : "ready";

  const profileQuery = useQuery({
    queryKey: ["kid-access-profile", token],
    queryFn: () =>
      kidAccessService.getProfile(token).then((res) => res.data.data.child),
    enabled: isKidMode && !!token,
  });
  const kidChild = profileQuery.data ?? null;

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
        // localStorage không khả dụng - bỏ qua, không chặn trải nghiệm đọc
      }
    },
    [isKidMode, token, book],
  );

  const [pingedTodayMinutes, setPingedTodayMinutes] = useState(null);
  const kidTimeInfo = kidChild
    ? {
        dailyLimitMinutes: kidChild.dailyLimitMinutes || 0,
        todayMinutes: pingedTodayMinutes ?? (kidChild.todayMinutes || 0),
      }
    : null;

  // Nhắc nghỉ mắt định kỳ + giải lao bắt buộc - chạy ngay trong lúc đọc,
  // dùng chung hook/overlay với trang kệ sách (KidAccess) và trang AR.
  const restBreak = useKidRestBreak(
    kidChild,
    isKidMode && status === "ready",
    token,
  );

  // Kid mode
  useEffect(() => {
    if (!isKidMode || status !== "ready") return;

    let cancelled = false;
    let activityId = null;
    let intervalId = null;

    async function start() {
      try {
        const res = await kidAccessService.startActivity(token, {
          bookId: book?.id,
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
              setPingedTodayMinutes(info.todayMinutes);
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
            // Bỏ qua lỗi 1 lần ping (vd mất mạng tạm thời) - thử lại ở lần kế tiếp
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
  }, [isKidMode, status, book?.id, token, slug, navigate]);

  if (status === "loading") {
    return <FullScreenLoader message="Đang tải sách điện tử..." />;
  }

  if (status === "restricted") {
    return (
      <main className="gp-view gp-view--center">
        <div className="gp-empty">
          <div className="gp-empty-badge">
            <Lock size={22} />
          </div>
          <span className="gp-eyebrow">Sách điện tử</span>
          <h1>{restrictedInfo?.title || "Chưa đọc được sách này"}</h1>
          <p>{restrictedInfo?.message || "Nhờ ba mẹ kiểm tra lại nhé!"}</p>
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

  if (status === "forbidden") {
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

  if (status === "not-found") {
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

  const data = ebookQuery.data;
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
