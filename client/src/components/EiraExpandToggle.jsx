import { Maximize2, Minimize2 } from "lucide-react";
import "./assets/css/EiraChatboxExpand.css";

/**
 * Nút phóng to / thu nhỏ popup chat Eira.
 *
 * Lưu ý: đây chỉ là phóng to kích thước POPUP (#eira-win), không chuyển
 * sang chế độ toàn màn hình. Toàn bộ logic bật/tắt nằm ở component cha
 * (EiraChatbox.jsx) qua 2 props dưới đây - component này chỉ lo phần hiển thị.
 *
 * @param {boolean} expanded - true nếu popup đang ở trạng thái phóng to
 * @param {() => void} onToggle - callback bấm nút, cha tự đảo state
 */
export default function EiraExpandToggle({ expanded, onToggle }) {
  return (
    <button
      type="button"
      className={`eira-close-btn eira-expand-btn${expanded ? " active" : ""}`}
      aria-label={expanded ? "Thu nhỏ khung chat" : "Phóng to khung chat"}
      title={expanded ? "Thu nhỏ khung chat" : "Phóng to khung chat"}
      onClick={onToggle}
    >
      {expanded ? (
        <Minimize2 size={14} strokeWidth={2} />
      ) : (
        <Maximize2 size={14} strokeWidth={2} />
      )}
    </button>
  );
}
