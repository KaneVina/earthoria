import { useEffect, useState } from "react";

const STORAGE_KEY = "earthoria:kid-bgm";
const DEFAULT_VOLUME = 55;

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { muted: false, volume: DEFAULT_VOLUME };
    const parsed = JSON.parse(raw);
    const volume = Number(parsed.volume);
    return {
      muted: Boolean(parsed.muted),
      volume: Number.isFinite(volume)
        ? Math.min(100, Math.max(0, volume))
        : DEFAULT_VOLUME,
    };
  } catch {
    return { muted: false, volume: DEFAULT_VOLUME };
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage có thể bị chặn (chế độ ẩn danh...) - bỏ qua, không chặn nhạc
  }
}

let currentPrefs = loadPrefs();
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(currentPrefs));
}

/**
 * Đọc tuỳ chọn âm lượng/tắt tiếng hiện tại (không subscribe) - dùng ở nơi
 * chỉ cần đọc 1 lần lúc khởi tạo (vd giá trị ban đầu của player).
 */
export function getBgmPrefs() {
  return currentPrefs;
}

/**
 * Cập nhật 1 phần hoặc toàn bộ tuỳ chọn, lưu vào localStorage và báo cho
 * mọi nơi đang subscribe (kể cả KidBackgroundMusic đang giữ player thật)
 * để áp dụng ngay lập tức.
 */
export function setBgmPrefs(partial) {
  currentPrefs = { ...currentPrefs, ...partial };
  savePrefs(currentPrefs);
  notify();
  return currentPrefs;
}

/**
 * Hook dùng ở bất kỳ component nào cần đọc VÀ điều khiển âm lượng/tắt
 * tiếng nhạc nền (vd card "Nhạc Nền" trong tab Cài Đặt Hệ Thống của
 * Profile, hoặc chính KidBackgroundMusic). Trả về [prefs, setBgmPrefs] -
 * mọi lần gọi setBgmPrefs từ bất kỳ đâu đều làm toàn bộ nơi dùng hook này
 * re-render với giá trị mới nhất.
 */
export function useBgmPrefs() {
  const [prefs, setPrefs] = useState(currentPrefs);

  useEffect(() => {
    listeners.add(setPrefs);
    // Đồng bộ lại ngay khi mount, phòng trường hợp giá trị đã đổi ở nơi
    // khác giữa lúc component này được tạo và effect này chạy.
    setPrefs(currentPrefs);
    return () => {
      listeners.delete(setPrefs);
    };
  }, []);

  return [prefs, setBgmPrefs];
}
