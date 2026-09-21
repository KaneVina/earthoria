import { useEffect } from "react";
import { isEmbeddedInIframe } from "../utils/embed";

// Store rất nhỏ: KidBackgroundMusic (singleton, luôn mount ở App.jsx) đăng
// ký setter của nó vào đây lúc mount; các trang không nằm trên cùng cây
// component (vd GamePlay) gọi useKidBgmTrack() để yêu cầu đổi bài đang phát,
// mà không cần kéo React Context vào chỉ cho việc này.
let setActiveTrackKey = null;

// Loại message dùng để bắc cầu qua ranh giới iframe (xem ghi chú dưới).
const BRIDGE_MESSAGE_TYPE = "earthoria:kid-bgm-track";

/**
 * Gọi trong KidBackgroundMusic lúc mount để "mở cổng" nhận yêu cầu đổi bài
 * từ nơi khác. Trả về hàm dọn dẹp, dùng trực tiếp làm return của useEffect.
 */
export function registerKidBgmTrackSetter(setter) {
  setActiveTrackKey = setter;
  return () => {
    setActiveTrackKey = null;
  };
}

function requestTrack(trackKey) {
  if (isEmbeddedInIframe()) {
    // Trang hiện tại đang bị nhúng trong iframe (vd khung chơi game nhúng
    // ngay trong trang ebook - xem QrLiveEmbed trong admin/EbookEditor.jsx).
    // KidBackgroundMusic ở CHÍNH trang bị nhúng này không hề mount (App.jsx
    // chỉ mount nó khi !isEmbedded, để tránh chồng tiếng 2 player), nên
    // player nhạc THẬT đang chạy ở trang cha (window.top). Phải "nhắn" ra
    // ngoài đó bằng postMessage thay vì gọi setter cục bộ (vốn không tồn
    // tại/không có tác dụng gì trong ngữ cảnh này).
    try {
      window.top.postMessage(
        { type: BRIDGE_MESSAGE_TYPE, trackKey },
        window.location.origin,
      );
    } catch {
      // window.top khác origin bị trình duyệt chặn truy cập - bỏ qua, im
      // lặng, không có gì để làm thêm trong trường hợp này.
    }
    return;
  }
  setActiveTrackKey?.(trackKey);
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
  requestTrack("default");
}

/**
 * Yêu cầu KidBackgroundMusic phát bài ứng với `trackKey` ("game", "result"…)
 * trong lúc component gọi hook này còn mounted; tự trả lại nhạc mặc định
 * ("default") khi unmount hoặc khi trackKey chuyển thành falsy. Hoạt động
 * đúng dù component gọi hook đang nằm trên chính trang có player, hay đang
 * chạy trong 1 iframe nhúng của trang đó (vd game nhúng trong ebook).
 */
export function useKidBgmTrack(trackKey) {
  useEffect(() => {
    if (!trackKey) return undefined;
    requestTrack(trackKey);
    return () => {
      requestTrack("default");
    };
  }, [trackKey]);
}

/**
 * Gọi trong chính KidBackgroundMusic (ở trang KHÔNG bị nhúng, nơi có player
 * thật) để lắng nghe yêu cầu đổi bài gửi từ 1 iframe con đang nhúng trên
 * trang đó, thông qua requestTrack() ở trên.
 */
export function useKidBgmTrackBridge(onTrackKey) {
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== BRIDGE_MESSAGE_TYPE) return;
      onTrackKey(event.data.trackKey || "default");
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onTrackKey]);
}
