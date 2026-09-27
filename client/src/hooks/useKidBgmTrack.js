import { useEffect } from "react";
import { isEmbeddedInIframe } from "../utils/embed";

let setActiveTrackRequest = null;

// Loại message dùng để bắc cầu qua ranh giới iframe (xem ghi chú dưới).
const BRIDGE_MESSAGE_TYPE = "earthoria:kid-bgm-track";

/**
 * Chuẩn hoá 1 yêu cầu đổi bài về đúng 1 dạng object gọn, dùng làm dữ liệu
 * lưu trong state của KidBackgroundMusic lẫn làm khoá so sánh dependency
 * (qua JSON.stringify) - tránh việc object reference đổi mỗi lần re-render
 * khiến nhạc bị nạp lại không cần thiết. Chấp nhận:
 *  - chuỗi preset cũ ("default"/"game"/"result"...)
 *  - { videoId }        1 video YouTube tuỳ ý (ebook dán link)
 *  - { audioUrl }       1 file audio tải lên (ebook)
 *  - { silent: true }   tắt hẳn nhạc nền ở nơi gọi (khác hẳn null: null =
 *    "không yêu cầu gì, giữ nguyên bài đang phát", silent = "chủ động im
 *    lặng")
 * Trả về null nếu không phải yêu cầu hợp lệ nào ở trên.
 */
export function normalizeBgmTrackRequest(request) {
  if (!request) return null;
  if (typeof request === "string") return { kind: "preset", key: request };
  if (request.silent) return { kind: "silent" };
  if (request.videoId) return { kind: "video", videoId: request.videoId };
  if (request.audioUrl) return { kind: "audio", audioUrl: request.audioUrl };
  return null;
}

/**
 * Gọi trong KidBackgroundMusic lúc mount để "mở cổng" nhận yêu cầu đổi bài
 * từ nơi khác. Trả về hàm dọn dẹp, dùng trực tiếp làm return của useEffect.
 */
export function registerKidBgmTrackSetter(setter) {
  setActiveTrackRequest = setter;
  return () => {
    setActiveTrackRequest = null;
  };
}

function requestTrack(normalized) {
  if (isEmbeddedInIframe()) {
    try {
      window.top.postMessage(
        { type: BRIDGE_MESSAGE_TYPE, track: normalized },
        window.location.origin,
      );
    } catch {
      // window.top khác origin bị trình duyệt chặn truy cập - bỏ qua, im
      // lặng, không có gì để làm thêm trong trường hợp này.
    }
    return;
  }
  setActiveTrackRequest?.(normalized);
}

/**
 * Trả nhạc nền về mặc định ngay lập tức. Dùng ở phía TẠO RA 1 khung nhúng
 * game (vd QrLiveEmbed) để tự dọn dẹp lúc gỡ khung đó khỏi trang (lật qua
 * trang sách khác, đổi sách...) - đáng tin cậy hơn nhiều so với việc trông
 * chờ code dọn dẹp CHẠY BÊN TRONG iframe kịp thực thi: trình duyệt huỷ ngay
 * ngữ cảnh JS của iframe khi phần tử bị gỡ khỏi DOM, không đảm bảo cleanup
 * effect bên trong (postMessage ra ngoài) có kịp chạy hay không. Gọi hàm
 * này ở component NGOÀI iframe (chỗ tạo ra thẻ <iframe>) thì luôn chắc ăn,
 * vì đó là unmount bình thường của chính cây React đang chứa nó.
 */
export function resetKidBgmTrack() {
  requestTrack(normalizeBgmTrackRequest("default"));
}

/**
 * Yêu cầu KidBackgroundMusic phát bài ứng với `trackRequest` trong lúc
 * component gọi hook này còn mounted; tự trả lại nhạc mặc định ("default")
 * khi unmount hoặc khi trackRequest chuyển thành falsy. Hoạt động đúng dù
 * component gọi hook đang nằm trên chính trang có player, hay đang chạy
 * trong 1 iframe nhúng của trang đó (vd game nhúng trong ebook).
 *
 * `trackRequest` chấp nhận preset string ("game", "result"...) như trước,
 * hoặc object { videoId } / { audioUrl } / { silent: true } - xem
 * normalizeBgmTrackRequest(). Truyền null/undefined = không yêu cầu gì.
 */
export function useKidBgmTrack(trackRequest) {
  const normalized = normalizeBgmTrackRequest(trackRequest);
  const depKey = normalized ? JSON.stringify(normalized) : "";

  useEffect(() => {
    if (!normalized) return undefined;
    requestTrack(normalized);
    return () => {
      requestTrack(normalizeBgmTrackRequest("default"));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);
}

/**
 * Gọi trong chính KidBackgroundMusic (ở trang KHÔNG bị nhúng, nơi có player
 * thật) để lắng nghe yêu cầu đổi bài gửi từ 1 iframe con đang nhúng trên
 * trang đó, thông qua requestTrack() ở trên.
 */
export function useKidBgmTrackBridge(onTrackRequest) {
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== BRIDGE_MESSAGE_TYPE) return;
      onTrackRequest(event.data.track || normalizeBgmTrackRequest("default"));
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onTrackRequest]);
}
