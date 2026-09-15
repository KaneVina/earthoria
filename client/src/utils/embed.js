export function isEmbeddedInIframe() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    // window.top bị chặn truy cập do khác origin - chắc chắn đang trong iframe
    return true;
  }
}