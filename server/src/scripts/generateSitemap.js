/**
 * Generate sitemap.xml cho toàn bộ URL công khai của Earthoria (trang tĩnh +
 * từng sách đang active trong DB), ghi thẳng vào client/public/sitemap.xml.
 *
 * Chạy: node src/scripts/generateSitemap.js
 * (nên chạy trước mỗi lần deploy client, hoặc đặt cron/GitHub Action tự động
 * chạy định kỳ để sitemap luôn cập nhật sách mới mà không cần deploy lại thủ công)
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { encodeId } = require("../utils/hashids");
const { pingIndexNow } = require("../services/indexNowService");

const prisma = new PrismaClient();

const SITE_URL = process.env.SITE_URL || "https://earthoria.id.vn";
const OUTPUT_PATH = path.join(__dirname, "../../../client/public/sitemap.xml");

// Các trang tĩnh công khai — thêm route mới vào đây khi ra trang mới.
const STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/compare", changefreq: "weekly", priority: "0.6" },
  { path: "/technology", changefreq: "monthly", priority: "0.6" },
  { path: "/ecosystem", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.4" },
  { path: "/trust", changefreq: "monthly", priority: "0.3" },
];

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc, { lastmod, changefreq, priority } = {}) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

async function generateSitemap() {
  console.log("[sitemap] Đang lấy danh sách sách đang active...");
  const books = await prisma.book.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  console.log(`[sitemap] Tìm thấy ${books.length} sách.`);

  const staticUrls = STATIC_ROUTES.map((r) => `${SITE_URL}${r.path}`);
  const bookUrls = books.map(
    (b) => `${SITE_URL}/books/${b.slug}/${encodeId(b.id)}`,
  );

  const entries = [
    ...STATIC_ROUTES.map((r, i) =>
      urlEntry(staticUrls[i], {
        changefreq: r.changefreq,
        priority: r.priority,
      }),
    ),
    ...books.map((b, i) =>
      urlEntry(bookUrls[i], {
        lastmod: b.updatedAt.toISOString().slice(0, 10),
        changefreq: "weekly",
        priority: "0.8",
      }),
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, xml, "utf8");
  console.log(`[sitemap] Đã ghi ${entries.length} URL vào ${OUTPUT_PATH}`);

  // Báo luôn cho Bing/IndexNow biết toàn bộ URL này để crawl lại sớm,
  // thay vì chờ crawl tự nhiên (có thể mất vài ngày).
  await pingIndexNow([...staticUrls, ...bookUrls]);
}

generateSitemap()
  .catch((err) => {
    console.error("[sitemap] Lỗi:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
