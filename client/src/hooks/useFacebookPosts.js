// client/src/hooks/useFacebookPosts.js
// Toàn bộ Facebook API logic — không có gì liên quan đến UI ở đây

const FB_PAGE_ID = import.meta.env.VITE_FB_PAGE_ID;
const FB_TOKEN   = import.meta.env.VITE_FB_TOKEN;
const FB_FIELDS  = "id,message,created_time,full_picture,permalink_url,likes.summary(true),shares";
const FB_LIMIT   = 4;

/**
 * Fetch bài đăng từ Facebook Graph API
 * @returns {Promise<Array>} danh sách posts
 * @throws {Error} nếu thiếu env hoặc API trả lỗi
 */
export async function fetchFacebookPosts() {
  if (!FB_PAGE_ID || !FB_TOKEN) {
    throw new Error(
      "Thiếu VITE_FB_PAGE_ID hoặc VITE_FB_TOKEN trong file client/.env"
    );
  }

  const url =
    `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/posts` +
    `?fields=${encodeURIComponent(FB_FIELDS)}` +
    `&limit=${FB_LIMIT}` +
    `&access_token=${FB_TOKEN}`;

  const res  = await fetch(url);
  const json = await res.json();

  if (json.error) {
    throw new Error(`Facebook API: ${json.error.message}`);
  }

  return json.data ?? [];
}