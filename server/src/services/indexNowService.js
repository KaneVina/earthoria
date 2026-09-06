/**
 * IndexNow — API miễn phí, không cần đăng ký tài khoản, để báo cho
 * Bing/Yandex (và qua đó là ChatGPT Search, dùng hạ tầng crawl của Bing)
 * biết có URL mới/thay đổi cần crawl lại ngay, thay vì chờ crawl tự nhiên
 * (có thể mất vài ngày).
 *
 * Cách hoạt động: cần 1 file key.txt public ở root domain để Bing xác minh
 * bạn thật sự sở hữu domain (không ai giả mạo ping hộ site người khác).
 *
 * Setup 1 lần:
 * 1. Thêm INDEXNOW_KEY vào file .env của server (chuỗi hex ngẫu nhiên, tự
 *    generate bằng: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
 * 2. Tạo file client/public/<INDEXNOW_KEY>.txt với nội dung CHÍNH LÀ giá trị key đó.
 * 3. Deploy client để file key.txt truy cập được tại
 *    https://earthoria.id.vn/<INDEXNOW_KEY>.txt
 */
const SITE_URL = process.env.SITE_URL || "https://earthoria.id.vn";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * @param {string[]} urls - danh sách URL đầy đủ (https://...) cần báo index lại
 */
async function pingIndexNow(urls) {
  if (!INDEXNOW_KEY) {
    console.warn(
      "[indexNow] Bỏ qua: chưa cấu hình INDEXNOW_KEY trong .env. " +
        "Xem hướng dẫn setup ở đầu file server/src/services/indexNowService.js",
    );
    return { skipped: true };
  }
  if (!urls?.length) return { skipped: true };

  const host = new URL(SITE_URL).host;

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });

    // IndexNow trả 200/202 khi thành công, không có response body đáng kể.
    if (res.ok || res.status === 202) {
      console.log(
        `[indexNow] Đã báo ${urls.length} URL cho Bing/IndexNow (status ${res.status}).`,
      );
      return { success: true, status: res.status };
    }

    const text = await res.text().catch(() => "");
    console.error(
      `[indexNow] Lỗi khi ping (status ${res.status}):`,
      text.slice(0, 300),
    );
    return { success: false, status: res.status };
  } catch (err) {
    console.error("[indexNow] Lỗi mạng khi ping:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { pingIndexNow };
