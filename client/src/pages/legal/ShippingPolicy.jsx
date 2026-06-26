import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  Calendar,
  FileText,
  ChevronDown,
  Search,
  Printer,
  Mail,
  Phone,
  ArrowUp,
  Link2,
  Check,
  Users,
  AlertTriangle,
  ShieldCheck,
  RefreshCcw,
  BadgeCheck,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   META & CONTENT DATA
───────────────────────────────────────────────────────────── */
const META = {
  effectiveDate: "01 Tháng 01, 2026",
  updatedDate: "15 Tháng 06, 2026",
  version: "v2.1",
};

const SUMMARY_CARDS = [
  {
    icon: Truck,
    title: "Giao toàn quốc",
    desc: "Phủ sóng 63 tỉnh thành, giao nhanh nội thành TP.HCM và Hà Nội trong 2–3 ngày.",
  },
  {
    icon: BadgeCheck,
    title: "Miễn phí từ 500k",
    desc: "Đơn hàng từ 500.000đ được miễn phí vận chuyển trên toàn quốc, không cần mã giảm.",
  },
  {
    icon: Package,
    title: "Đóng gói bảo vệ",
    desc: "Sách được đóng gói bằng túi khí và hộp cứng để bảo vệ gáy và bìa khỏi hư hỏng.",
  },
  {
    icon: RefreshCcw,
    title: "Hoàn tiền ship lỗi",
    desc: "Hàng hỏng do vận chuyển được đổi mới miễn phí hoặc hoàn tiền 100% trong 24 giờ.",
  },
];

const SECTIONS = [
  {
    id: "pham-vi-giao-hang",
    num: "01",
    title: "Phạm Vi Giao Hàng",
    paragraphs: [
      "Earthoria giao hàng đến toàn bộ 63 tỉnh thành trên lãnh thổ Việt Nam thông qua mạng lưới đơn vị vận chuyển đối tác. Tùy vào địa chỉ nhận hàng, đơn hàng sẽ được phân bổ cho đơn vị phù hợp nhất tại thời điểm đặt hàng.",
    ],
    list: [
      "Nội thành TP. Hồ Chí Minh và Hà Nội — 2 đến 3 ngày làm việc",
      "Các tỉnh thành đồng bằng và đô thị trung tâm — 3 đến 5 ngày làm việc",
      "Vùng sâu, vùng xa, hải đảo — 5 đến 10 ngày làm việc",
      "Hiện tại Earthoria chưa hỗ trợ giao hàng ra nước ngoài",
    ],
  },
  {
    id: "thoi-gian-xu-ly",
    num: "02",
    title: "Thời Gian Xử Lý Đơn Hàng",
    paragraphs: [
      "Sau khi thanh toán được xác nhận, bộ phận kho vận sẽ tiến hành kiểm tra, đóng gói và bàn giao cho đơn vị vận chuyển. Thời gian vận chuyển thực tế được tính từ lúc đơn vị vận chuyển tiếp nhận kiện hàng.",
    ],
    callout: {
      title: "Lưu ý về ngày làm việc",
      text: "Thứ Bảy, Chủ Nhật và các ngày lễ quốc gia không được tính là ngày làm việc. Đơn đặt sau 17:00 trong ngày làm việc cuối tuần sẽ được xử lý vào buổi sáng ngày làm việc kế tiếp.",
    },
    list: [
      "Đơn hàng thanh toán trực tuyến thành công trước 15:00 trong ngày làm việc — xử lý và bàn giao vận chuyển trong ngày",
      "Đơn hàng COD (thanh toán khi nhận hàng) — xử lý trong vòng 1 ngày làm việc kể từ khi đặt hàng",
      "Đơn hàng có sản phẩm pre-order hoặc tạm hết hàng — được thông báo qua email và điều chỉnh thời gian giao riêng",
    ],
  },
  {
    id: "phi-van-chuyen",
    num: "03",
    title: "Phí Vận Chuyển",
    paragraphs: [
      "Phí vận chuyển được tính tự động khi bạn điền địa chỉ nhận hàng tại bước thanh toán, dựa trên khối lượng kiện hàng thực tế và khoảng cách vận chuyển.",
    ],
    list: [
      "Miễn phí vận chuyển cho đơn hàng từ 500.000đ trở lên — áp dụng toàn quốc, tự động trừ khi kết toán",
      "Đơn dưới 500.000đ: phí vận chuyển dao động từ 18.000đ đến 45.000đ tùy khu vực",
      "Giao hỏa tốc nội thành TP.HCM (trong 4 giờ): phụ phí 35.000đ, áp dụng cho đơn đặt trước 14:00 trong ngày làm việc",
      "Vùng sâu, hải đảo và địa bàn đặc biệt: phí vận chuyển sẽ được báo giá riêng qua email trong vòng 2 giờ làm việc sau khi đặt hàng",
    ],
  },
  {
    id: "don-vi-van-chuyen",
    num: "04",
    title: "Đơn Vị Vận Chuyển Đối Tác",
    paragraphs: [
      "Earthoria hợp tác với các đơn vị vận chuyển uy tín tại Việt Nam. Chúng tôi sẽ chủ động chọn đơn vị phù hợp nhất cho từng đơn hàng dựa trên địa chỉ giao và tình trạng dịch vụ tại thời điểm đặt hàng.",
    ],
    list: [
      "Giao Hàng Nhanh (GHN) — ưu tiên cho khu vực nội thành và đơn hỏa tốc",
      "Giao Hàng Tiết Kiệm (GHTK) — phủ rộng khu vực ngoại thành và các tỉnh",
      "J&T Express — hỗ trợ đơn hàng khối lượng lớn (bộ sách từ 3 cuốn trở lên)",
      "Bạn không thể chọn đơn vị vận chuyển cụ thể khi đặt hàng; hệ thống sẽ tự phân bổ tối ưu",
    ],
  },
  {
    id: "theo-doi-don-hang",
    num: "05",
    title: "Theo Dõi Đơn Hàng",
    paragraphs: [
      "Ngay khi đơn vị vận chuyển tiếp nhận kiện hàng, bạn sẽ nhận được email xác nhận kèm mã vận đơn và đường link theo dõi trực tiếp trên trang của đơn vị vận chuyển.",
    ],
    list: [
      "Email theo dõi được gửi trong vòng 2 giờ sau khi kiện hàng được bàn giao cho đơn vị vận chuyển",
      "Trạng thái đơn hàng cũng được cập nhật theo thời gian thực trong mục \"Đơn hàng của tôi\" trên tài khoản Earthoria",
      "Nếu sau 48 giờ bạn chưa nhận được email theo dõi, vui lòng liên hệ bộ phận hỗ trợ qua 1900 6868 hoặc support@earthoria.vn",
    ],
  },
  {
    id: "dong-goi",
    num: "06",
    title: "Tiêu Chuẩn Đóng Gói",
    paragraphs: [
      "Sách Earthoria — đặc biệt là các tập có tích hợp chip NFC và mã QR kích hoạt AR — được đóng gói theo quy trình nhiều lớp để đảm bảo đến tay bạn trong trạng thái hoàn hảo.",
    ],
    list: [
      "Mỗi cuốn sách được bọc màng co nhiệt trước khi cho vào hộp carton cứng có lót mút xốp bảo vệ gáy sách",
      "Đơn hàng có từ 2 cuốn sách trở lên được bổ sung túi khí ngăn sách va chạm với nhau trong quá trình vận chuyển",
      "Mã QR và chip NFC trên bìa sách được dán lớp bảo vệ trong suốt để tránh trầy xước làm giảm khả năng đọc",
      "Góc hộp được gia cường thêm băng dính công nghiệp để chịu lực va đập trong quá trình bốc xếp",
    ],
  },
  {
    id: "hang-hong-that-lac",
    num: "07",
    title: "Hàng Hỏng & Thất Lạc Trong Vận Chuyển",
    paragraphs: [
      "Mặc dù đã có quy trình đóng gói cẩn thận, sự cố trong vận chuyển vẫn có thể xảy ra ngoài tầm kiểm soát của chúng tôi. Earthoria cam kết giải quyết nhanh chóng và không để bạn chịu thiệt thòi.",
    ],
    callout: {
      title: "Quyền lợi của bạn khi nhận hàng lỗi",
      text: "Nếu kiện hàng có dấu hiệu hư hỏng bên ngoài, bạn có quyền từ chối nhận hàng và thông báo ngay cho Earthoria. Chúng tôi sẽ xử lý đổi mới hoặc hoàn tiền 100% trong vòng 24 giờ làm việc kể từ khi nhận được phản hồi của bạn.",
    },
    list: [
      "Hàng hỏng do vận chuyển: chụp ảnh, quay video kiện hàng và liên hệ hỗ trợ trong vòng 24 giờ kể từ khi nhận hàng",
      "Hàng thất lạc: nếu sau thời gian giao dự kiến 3 ngày mà đơn vẫn chưa có cập nhật, Earthoria sẽ chủ động tra cứu và thông báo trong 1 ngày làm việc",
      "Giao sai địa chỉ hoặc sai sản phẩm: đổi miễn phí, Earthoria chịu toàn bộ phí vận chuyển chiều về và chiều đi mới",
    ],
  },
  {
    id: "bat-kha-khang",
    num: "08",
    title: "Trường Hợp Bất Khả Kháng",
    paragraphs: [
      "Earthoria không chịu trách nhiệm cho sự chậm trễ hoặc gián đoạn giao hàng phát sinh từ các nguyên nhân nằm ngoài tầm kiểm soát của cả hai bên, bao gồm nhưng không giới hạn ở:",
    ],
    list: [
      "Thiên tai, bão lũ, hỏa hoạn hoặc các thảm họa tự nhiên khác ảnh hưởng đến tuyến đường vận chuyển",
      "Dịch bệnh hoặc tình trạng khẩn cấp y tế công cộng được cơ quan nhà nước công bố chính thức",
      "Quyết định phong tỏa, giới nghiêm hoặc hạn chế giao thông của cơ quan có thẩm quyền",
      "Trong các trường hợp trên, Earthoria sẽ chủ động thông báo và thỏa thuận phương án xử lý phù hợp với từng đơn hàng",
    ],
  },
  {
    id: "lien-he",
    num: "09",
    title: "Liên Hệ Hỗ Trợ Vận Chuyển",
    paragraphs: [
      "Nếu bạn có bất kỳ vấn đề nào liên quan đến đơn hàng đang trên đường giao, đội ngũ Chăm sóc Khách hàng của Earthoria sẵn sàng hỗ trợ qua các kênh dưới đây trong giờ hành chính (8:00 – 21:00, kể cả cuối tuần).",
    ],
  },
];

const FAQS = [
  {
    q: "Tôi có thể thay đổi địa chỉ giao hàng sau khi đặt đơn không?",
    a: 'Có thể, nhưng chỉ khi đơn hàng chưa được bàn giao cho đơn vị vận chuyển. Vui lòng liên hệ 1900 6868 hoặc gửi email đến support@earthoria.vn ngay sau khi đặt hàng. Một khi mã vận đơn đã được tạo, địa chỉ không thể chỉnh sửa và bạn cần đặt lại đơn mới.',
  },
  {
    q: "Đơn hàng của tôi có thể giao vào cuối tuần không?",
    a: "Đối với GHN Hỏa Tốc nội thành TP.HCM và Hà Nội, giao hàng cuối tuần có hỗ trợ (thứ Bảy và Chủ Nhật). Đối với các khu vực khác và dịch vụ tiêu chuẩn, việc giao hàng cuối tuần phụ thuộc vào chính sách của từng đơn vị vận chuyển đối tác tại địa phương.",
  },
  {
    q: "Mã QR và chip NFC trên sách có bị hỏng khi vận chuyển không?",
    a: "Earthoria có quy trình đóng gói đặc biệt cho sách tích hợp AR, bao gồm lớp màng bảo vệ chuyên dụng cho vùng mã QR và chip NFC. Nếu bạn nhận sách mà tính năng AR không hoạt động do lỗi từ vận chuyển, chúng tôi sẽ đổi sách mới miễn phí.",
  },
  {
    q: "Tôi đặt nhiều sản phẩm — có được giao cùng 1 kiện không?",
    a: "Thông thường các sản phẩm trong cùng một đơn hàng sẽ được giao chung một kiện. Nếu một sản phẩm trong đơn tạm hết hàng, Earthoria sẽ hỏi ý kiến bạn về việc chờ đủ hàng giao 1 lần hay giao riêng các sản phẩm có sẵn trước.",
  },
  {
    q: "Tôi có thể yêu cầu giao hàng vào khung giờ cụ thể không?",
    a: "Hiện tại tính năng chọn khung giờ giao hàng chưa được hỗ trợ do phụ thuộc vào lịch trình của từng đơn vị vận chuyển. Tuy nhiên, bạn có thể ghi ghi chú trong phần \"Hướng dẫn giao hàng\" khi đặt đơn để đơn vị vận chuyển nắm thông tin.",
  },
];

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function ShippingPolicy() {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [tocQuery, setTocQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [showTop, setShowTop] = useState(false);
  const sidebarScrollRef = useRef(null);

  /* scroll progress + back-to-top (rAF-throttled) */
  useEffect(() => {
    let ticking = false;
    const update = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight =
        (el.scrollHeight || document.body.scrollHeight) - el.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
      setShowTop(scrollTop > 700);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* scrollspy */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id); }),
      { rootMargin: "-130px 0px -65% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  /* auto-scroll active TOC item into view within sidebar */
  useEffect(() => {
    const container = sidebarScrollRef.current;
    if (!container) return;
    const btn = container.querySelector(`[data-toc-id="${activeId}"]`);
    if (!btn) return;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;
    const btnTop = btn.offsetTop;
    const btnBottom = btnTop + btn.offsetHeight;
    if (btnTop < visibleTop || btnBottom > visibleBottom) {
      container.scrollTo({
        top: btnTop - container.clientHeight / 2 + btn.offsetHeight / 2,
        behavior: "smooth",
      });
    }
  }, [activeId]);

  /* reveal-on-scroll */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleCopyLink = (id) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    }
  };

  const filteredSections = tocQuery
    ? SECTIONS.filter((s) => s.title.toLowerCase().includes(tocQuery.toLowerCase()))
    : SECTIONS;

  return (
    <>
      <style>{`
        /* ══════════════ PROGRESS BAR ══════════════ */
        .legal-progress-rail {
          position: fixed; top: 0; left: 0; right: 0; height: 2px;
          background: rgba(13,43,30,0.06); z-index: 950;
        }
        .legal-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gold), var(--forest-light));
          transition: width 0.1s linear;
        }

        /* ══════════════ HERO ══════════════ */
        .legal-hero {
          position: relative; overflow: hidden;
          background: var(--forest);
          padding: 132px 100px 56px;
        }
        .legal-hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 56px 56px;
        }
        .legal-hero-glow {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 12% 15%, rgba(74,158,63,0.16) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 75%, rgba(45,122,110,0.18) 0%, transparent 50%);
          pointer-events: none;
        }
        .legal-hero-watermark {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Playfair Display', serif;
          font-size: clamp(70px, 11vw, 170px);
          font-weight: 300; color: rgba(255,255,255,0.025);
          white-space: nowrap; pointer-events: none; user-select: none;
          letter-spacing: -0.02em;
        }
        .legal-hero-inner {
          position: relative; z-index: 2;
          max-width: 800px; margin: 0 auto; text-align: center;
        }
        .legal-hero-icon {
          width: 48px; height: 48px; margin: 0 auto 20px;
          border: 0.5px solid rgba(74,158,63,0.35);
          background: rgba(255,255,255,0.04);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold); transform: rotate(45deg);
        }
        .legal-hero-icon svg { transform: rotate(-45deg); }
        .legal-hero-eyebrow {
          display: flex; align-items: center; justify-content: center;
          gap: 14px; margin-bottom: 18px;
        }
        .legal-hero-eyebrow-line { width: 32px; height: 0.5px; background: var(--gold); }
        .legal-hero-eyebrow span:last-child {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 10px; letter-spacing: 0.26em; text-transform: uppercase;
          color: var(--gold); font-weight: 400;
        }
        .legal-hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(34px, 4.6vw, 56px);
          font-weight: 300; line-height: 1.1;
          color: var(--ivory); letter-spacing: -0.01em;
          margin-bottom: 18px;
        }
        .legal-hero-title em { font-style: italic; color: var(--gold); }
        .legal-hero-sub {
          font-size: 14px; line-height: 1.75;
          color: rgba(250,248,243,0.6); font-weight: 300;
          max-width: 620px; margin: 0 auto 30px;
        }
        .legal-hero-meta {
          display: flex; flex-wrap: wrap; justify-content: center;
          gap: 10px; margin-bottom: 30px;
        }
        .legal-hero-meta-item {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 16px;
          border: 0.5px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.03);
          font-size: 11px; color: rgba(250,248,243,0.6);
          font-family: 'Be Vietnam Pro', sans-serif;
        }
        .legal-hero-meta-item svg { color: var(--gold); flex-shrink: 0; }
        .legal-hero-meta-item strong { color: var(--ivory); font-weight: 500; margin-left: 4px; }
        .legal-hero-actions {
          display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap;
        }
        .legal-btn-main, .legal-btn-ghost {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
          padding: 13px 26px; cursor: pointer; border: none;
          display: inline-flex; align-items: center; gap: 10px;
          transition: all 0.3s ease; text-decoration: none;
        }
        .legal-btn-main { background: var(--gold); color: var(--ink); }
        .legal-btn-main:hover { background: var(--gold-light); gap: 16px; }
        .legal-btn-ghost {
          background: rgba(255,255,255,0.06);
          border: 0.5px solid rgba(255,255,255,0.22) !important;
          color: rgba(255,255,255,0.85);
          backdrop-filter: blur(8px);
        }
        .legal-btn-ghost:hover { background: rgba(255,255,255,0.12); }

        /* ══════════════ SUMMARY CARDS ══════════════ */
        .legal-summary {
          background: var(--cream); padding: 64px 100px;
          border-bottom: 0.5px solid var(--border);
        }
        .legal-summary-inner {
          max-width: 1400px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
        }
        .legal-summary-card {
          background: var(--white); border: 0.5px solid var(--border);
          padding: 28px 26px; transition: all 0.4s ease;
        }
        .legal-summary-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-gold);
          box-shadow: 0 20px 44px rgba(13,43,30,0.08);
        }
        .legal-summary-icon {
          width: 40px; height: 40px;
          border: 0.5px solid var(--border-gold);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold); margin-bottom: 18px;
        }
        .legal-summary-card h3 {
          font-family: 'Playfair Display', serif;
          font-size: 17px; font-weight: 400; color: var(--forest); margin-bottom: 8px;
        }
        .legal-summary-card p {
          font-size: 12.5px; line-height: 1.7; color: var(--text-muted); font-weight: 300;
        }

        /* ══════════════ LAYOUT ══════════════ */
        .legal-layout {
          max-width: 1400px; margin: 0 auto;
          padding: 100px 100px 60px;
          display: grid; grid-template-columns: 296px 1fr;
          gap: 72px;
        }

        /* ── Sidebar ── */
        .legal-sidebar-sticky {
          position: sticky; top: 108px;
          max-height: calc(100vh - 128px);
          overflow-y: auto;
          padding-right: 6px; padding-bottom: 8px;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        .legal-sidebar-sticky::-webkit-scrollbar { width: 3px; }
        .legal-sidebar-sticky::-webkit-scrollbar-thumb { background: var(--border-gold); }

        .legal-toc-search {
          display: flex; align-items: center; gap: 10px;
          border: 0.5px solid var(--border);
          padding: 11px 14px; margin-bottom: 24px;
          background: var(--ivory); color: var(--text-muted);
        }
        .legal-toc-search svg { flex-shrink: 0; }
        .legal-toc-search input {
          border: none; outline: none; background: transparent;
          font-family: 'Be Vietnam Pro', sans-serif; font-size: 12.5px;
          color: var(--text-body); width: 100%;
        }
        .legal-toc-search input::placeholder { color: var(--mist); }

        .legal-toc-label {
          font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 14px;
          padding-bottom: 12px; border-bottom: 0.5px solid var(--border);
        }
        .legal-toc-list { display: flex; flex-direction: column; gap: 1px; }
        .legal-toc-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 12px; text-align: left;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 12.5px; color: var(--text-muted); font-weight: 300;
          background: transparent; border: none; border-left: 2px solid transparent;
          cursor: pointer; transition: all 0.25s ease; width: 100%;
        }
        .legal-toc-item:hover { color: var(--forest); background: rgba(74,158,63,0.04); }
        .legal-toc-item.active {
          color: var(--forest); font-weight: 500;
          border-left-color: var(--gold); background: var(--gold-pale);
        }
        .legal-toc-num {
          font-family: 'Playfair Display', serif;
          font-size: 11px; color: var(--gold); flex-shrink: 0;
        }
        .legal-toc-empty {
          font-size: 12px; color: var(--text-muted); padding: 16px 12px; font-style: italic;
        }
        .legal-toc-divider { height: 0.5px; background: var(--border); margin: 18px 0; }

        .legal-sidebar-card {
          margin-top: 28px; padding: 24px;
          background: var(--parchment); border: 0.5px solid var(--border);
        }
        .legal-sidebar-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px; color: var(--forest); margin-bottom: 8px;
        }
        .legal-sidebar-card p {
          font-size: 12px; color: var(--text-muted); line-height: 1.7;
          font-weight: 300; margin-bottom: 14px;
        }
        .legal-sidebar-card-link {
          font-size: 12px; color: var(--gold); text-decoration: none;
          font-weight: 500; letter-spacing: 0.02em;
          border-bottom: 0.5px solid var(--border-gold); padding-bottom: 2px;
        }
        .legal-sidebar-card-link:hover { color: var(--forest-mid); }

        /* ── Content ── */
        .legal-content { min-width: 0; }
        .legal-section {
          padding: 44px 0; border-bottom: 0.5px solid var(--border);
          scroll-margin-top: 110px;
        }
        .legal-section:first-child { padding-top: 0; }
        .legal-section-head {
          display: flex; align-items: baseline; gap: 20px; margin-bottom: 22px;
        }
        .legal-section-num {
          font-family: 'Playfair Display', serif;
          font-size: 14px; color: var(--gold); letter-spacing: 0.06em; flex-shrink: 0;
        }
        .legal-section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 2.4vw, 30px); font-weight: 400;
          color: var(--forest); line-height: 1.25; flex: 1;
        }
        .legal-copy-btn {
          width: 30px; height: 30px; flex-shrink: 0;
          border: 0.5px solid var(--border); background: transparent;
          color: var(--text-muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.25s ease; opacity: 0;
        }
        .legal-section:hover .legal-copy-btn { opacity: 1; }
        .legal-copy-btn:hover { border-color: var(--gold); color: var(--gold); }

        .legal-section-body p {
          font-size: 14px; line-height: 1.9; color: var(--text-muted);
          font-weight: 300; margin-bottom: 16px;
        }
        .legal-section-body ul {
          list-style: none; padding: 0; margin: 18px 0 4px;
          display: flex; flex-direction: column; gap: 13px;
        }
        .legal-section-body li {
          display: flex; gap: 13px; align-items: flex-start;
          font-size: 13.5px; line-height: 1.8; color: var(--text-muted); font-weight: 300;
        }
        .legal-li-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--gold); flex-shrink: 0; margin-top: 8px;
        }

        .legal-callout {
          display: flex; gap: 20px; align-items: flex-start;
          background: linear-gradient(135deg, #0d3330 0%, #1a5c52 100%);
          padding: 28px 30px; margin: 24px 0;
          border-left: 3px solid var(--gold);
        }
        .legal-callout-icon {
          width: 38px; height: 38px; flex-shrink: 0;
          border: 0.5px solid rgba(74,158,63,0.4);
          background: rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
        }
        .legal-callout-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px; color: var(--ivory); margin-bottom: 8px; font-weight: 400;
        }
        .legal-callout p {
          font-size: 13px; line-height: 1.8; color: rgba(250,248,243,0.65);
          font-weight: 300; margin: 0;
        }

        /* ══════════════ FAQ ══════════════ */
        .legal-faq-section { background: var(--cream); padding: 110px 100px; }
        .legal-faq-inner { max-width: 880px; margin: 0 auto; }
        .legal-faq-list { display: flex; flex-direction: column; margin-top: 56px; }
        .legal-faq-item { border-bottom: 0.5px solid var(--border); }
        .legal-faq-item:first-child { border-top: 0.5px solid var(--border); }
        .legal-faq-question {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          gap: 24px; padding: 26px 4px; background: none; border: none;
          cursor: pointer; text-align: left;
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 400; color: var(--forest);
          transition: color 0.25s;
        }
        .legal-faq-question:hover { color: var(--forest-mid); }
        .legal-faq-chevron { color: var(--gold); flex-shrink: 0; transition: transform 0.35s ease; }
        .legal-faq-item.open .legal-faq-chevron { transform: rotate(180deg); }
        .legal-faq-answer {
          max-height: 0; overflow: hidden;
          transition: max-height 0.4s ease, padding 0.4s ease;
        }
        .legal-faq-answer p {
          font-size: 13.5px; line-height: 1.85; color: var(--text-muted);
          font-weight: 300; padding-right: 60px;
        }
        .legal-faq-item.open .legal-faq-answer { max-height: 320px; padding-bottom: 26px; }

        /* ══════════════ CONTACT CTA ══════════════ */
        .legal-contact-section {
          background: var(--forest); padding: 120px 100px;
          text-align: center; position: relative; overflow: hidden;
        }
        .legal-contact-bgtext {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          font-family: 'Playfair Display', serif;
          font-size: clamp(70px, 11vw, 160px); font-weight: 300;
          color: rgba(255,255,255,0.025); white-space: nowrap;
          pointer-events: none; letter-spacing: -0.02em;
        }
        .legal-contact-inner { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; }
        .legal-contact-eyebrow {
          font-size: 10px; letter-spacing: 0.26em; text-transform: uppercase;
          color: var(--gold); display: block; margin-bottom: 24px;
        }
        .legal-contact-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 3.5vw, 46px); font-weight: 300;
          color: var(--ivory); line-height: 1.2; margin-bottom: 48px;
        }
        .legal-contact-title em { font-style: italic; color: var(--gold); }
        .legal-contact-grid {
          display: flex; flex-wrap: wrap; justify-content: center; gap: 14px;
        }
        .legal-contact-item {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 24px;
          border: 0.5px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.04);
          font-size: 13px; color: rgba(250,248,243,0.8);
          text-decoration: none; transition: all 0.3s ease;
        }
        .legal-contact-item:hover { border-color: var(--gold); color: var(--gold); }
        .legal-contact-item svg { color: var(--gold); flex-shrink: 0; }

        /* ══════════════ BACK TO TOP ══════════════ */
        .legal-back-top {
          position: fixed; bottom: 36px; right: 36px; width: 48px; height: 48px;
          background: var(--forest); border: 0.5px solid var(--border-gold);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 850; opacity: 0; transform: translateY(16px);
          transition: all 0.4s ease; color: var(--gold);
        }
        .legal-back-top.visible { opacity: 1; transform: translateY(0); }
        .legal-back-top:hover { background: var(--forest-mid); }

        /* ══════════════ DARK MODE ══════════════ */
        body.dark-mode .legal-summary { background: #161e1a; }
        body.dark-mode .legal-summary-card { background: #1c2822; border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-summary-card h3 { color: #c8d4cc; }
        body.dark-mode .legal-toc-search { background: #1c2822; border-color: rgba(255,255,255,0.08); }
        body.dark-mode .legal-toc-item { color: rgba(180,200,188,0.6); }
        body.dark-mode .legal-toc-item:hover { background: rgba(74,158,63,0.08); }
        body.dark-mode .legal-toc-item.active { background: rgba(74,158,63,0.12); color: #c8d4cc; }
        body.dark-mode .legal-sidebar-card { background: #1c2822; border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-sidebar-card-title { color: #c8d4cc; }
        body.dark-mode .legal-section { border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-section-title { color: #c8d4cc; }
        body.dark-mode .legal-copy-btn { border-color: rgba(255,255,255,0.1); color: rgba(180,200,188,0.5); }
        body.dark-mode .legal-faq-section { background: #161e1a; }
        body.dark-mode .legal-faq-item { border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-faq-question { color: #c8d4cc; }

        /* ══════════════ RESPONSIVE ══════════════ */
        @media (max-width: 1100px) {
          .legal-hero { padding: 132px 40px 56px; }
          .legal-summary, .legal-layout, .legal-faq-section, .legal-contact-section {
            padding-left: 40px; padding-right: 40px;
          }
        }
        @media (max-width: 900px) {
          .legal-summary-inner { grid-template-columns: repeat(2, 1fr); }
          .legal-layout { grid-template-columns: 1fr; gap: 40px; }
          .legal-sidebar-sticky { position: relative; top: auto; max-height: none; overflow: visible; }
        }
        @media (max-width: 600px) {
          .legal-summary-inner { grid-template-columns: 1fr; }
          .legal-hero-actions { flex-direction: column; width: 100%; }
          .legal-btn-main, .legal-btn-ghost { width: 100%; justify-content: center; }
          .legal-faq-answer p { padding-right: 0; }
        }
      `}</style>

      {/* Reading progress */}
      <div className="legal-progress-rail">
        <div className="legal-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">Trang chủ</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Chính sách vận chuyển</span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="legal-hero">
        <div className="legal-hero-grid" />
        <div className="legal-hero-glow" />
        <div className="legal-hero-watermark">EARTHORIA</div>
        <div className="legal-hero-inner">
          <div className="legal-hero-icon">
            <Truck size={22} />
          </div>
          <div className="legal-hero-eyebrow">
            <span className="legal-hero-eyebrow-line" />
            <span>Giao Hàng &amp; Vận Chuyển</span>
            <span className="legal-hero-eyebrow-line" />
          </div>
          <h1 className="legal-hero-title">
            Chính Sách —<br />
            <em>Vận Chuyển</em>
          </h1>
          <p className="legal-hero-sub">
            Từ kho đến tay bạn — mọi thứ cần biết về thời gian giao hàng,
            phí vận chuyển và cam kết bảo vệ kiện hàng của Earthoria.
          </p>
          <div className="legal-hero-meta">
            <div className="legal-hero-meta-item">
              <Calendar size={13} />
              Hiệu lực từ <strong>{META.effectiveDate}</strong>
            </div>
            <div className="legal-hero-meta-item">
              <Clock size={13} />
              Cập nhật <strong>{META.updatedDate}</strong>
            </div>
            <div className="legal-hero-meta-item">
              <FileText size={13} />
              Phiên bản <strong>{META.version}</strong>
            </div>
          </div>
          <div className="legal-hero-actions">
            <button
              className="legal-btn-main"
              onClick={() => scrollToSection(SECTIONS[0].id)}
            >
              Xem chi tiết
              <ChevronDown size={14} />
            </button>
            <button className="legal-btn-ghost" onClick={() => window.print()}>
              <Printer size={14} />
              In / Lưu PDF
            </button>
          </div>
        </div>
      </section>

      {/* ═══ QUICK SUMMARY ═══ */}
      <section className="legal-summary">
        <div className="legal-summary-inner">
          {SUMMARY_CARDS.map((card, i) => (
            <div className={`legal-summary-card reveal reveal-delay-${i + 1}`} key={i}>
              <div className="legal-summary-icon">
                <card.icon size={20} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ MAIN LAYOUT: TOC + CONTENT ═══ */}
      <section className="legal-layout">
        <aside>
          <div className="legal-sidebar-sticky" ref={sidebarScrollRef}>
            <div className="legal-toc-search">
              <Search size={14} />
              <input
                value={tocQuery}
                onChange={(e) => setTocQuery(e.target.value)}
                placeholder="Tìm trong mục lục..."
              />
            </div>
            <div className="legal-toc-label">Mục Lục</div>
            <nav className="legal-toc-list">
              {filteredSections.map((s) => (
                <button
                  key={s.id}
                  data-toc-id={s.id}
                  className={`legal-toc-item ${activeId === s.id ? "active" : ""}`}
                  onClick={() => scrollToSection(s.id)}
                >
                  <span className="legal-toc-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
              {filteredSections.length === 0 && (
                <div className="legal-toc-empty">Không tìm thấy mục nào phù hợp</div>
              )}
            </nav>
            <div className="legal-toc-divider" />
            <button className="legal-toc-item" onClick={() => scrollToSection("faq")}>
              <Users size={14} />
              <span>Câu hỏi thường gặp</span>
            </button>
            <button className="legal-toc-item" onClick={() => scrollToSection("lien-he-card")}>
              <Mail size={14} />
              <span>Liên hệ hỗ trợ</span>
            </button>
            <div className="legal-sidebar-card">
              <div className="legal-sidebar-card-title">Tra cứu đơn hàng</div>
              <p>Kiểm tra trạng thái giao hàng hoặc liên hệ bộ phận hỗ trợ vận chuyển.</p>
              <a href="mailto:support@earthoria.vn" className="legal-sidebar-card-link">
                support@earthoria.vn
              </a>
            </div>
          </div>
        </aside>

        <div className="legal-content">
          {SECTIONS.map((s) => (
            <div key={s.id} id={s.id} className="legal-section reveal">
              <div className="legal-section-head">
                <span className="legal-section-num">{s.num}</span>
                <h2 className="legal-section-title">{s.title}</h2>
                <button
                  className="legal-copy-btn"
                  title="Sao chép liên kết tới mục này"
                  onClick={() => handleCopyLink(s.id)}
                >
                  {copiedId === s.id ? <Check size={13} /> : <Link2 size={13} />}
                </button>
              </div>
              <div className="legal-section-body">
                {s.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
                {s.callout && (
                  <div className="legal-callout">
                    <div className="legal-callout-icon">
                      <AlertTriangle size={17} />
                    </div>
                    <div>
                      <div className="legal-callout-title">{s.callout.title}</div>
                      <p>{s.callout.text}</p>
                    </div>
                  </div>
                )}
                {s.list && (
                  <ul>
                    {s.list.map((item, i) => (
                      <li key={i}>
                        <span className="legal-li-dot" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="legal-faq-section" id="faq">
        <div className="legal-faq-inner">
          <div className="section-header reveal">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line" />
              <span className="section-eyebrow-text">Giải Đáp Nhanh</span>
              <div className="section-eyebrow-line" />
            </div>
            <h2 className="section-title">
              Câu Hỏi <em>Thường Gặp</em>
            </h2>
          </div>
          <div className="legal-faq-list">
            {FAQS.map((f, i) => (
              <div key={i} className={`legal-faq-item ${openFaq === i ? "open" : ""}`}>
                <button
                  className="legal-faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {f.q}
                  <ChevronDown className="legal-faq-chevron" size={18} />
                </button>
                <div className="legal-faq-answer">
                  <p>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CONTACT CTA ═══ */}
      <section className="legal-contact-section" id="lien-he-card">
        <div className="legal-contact-bgtext">EARTHORIA</div>
        <div className="legal-contact-inner">
          <span className="legal-contact-eyebrow reveal">Cần hỗ trợ giao hàng?</span>
          <h2 className="legal-contact-title reveal">
            Đội ngũ hỗ trợ vận chuyển
            <br />
            <em>làm việc 7 ngày trong tuần</em>
          </h2>
          <div className="legal-contact-grid reveal">
            <a href="mailto:support@earthoria.vn" className="legal-contact-item">
              <Mail size={15} />
              support@earthoria.vn
            </a>
            <a href="tel:19006868" className="legal-contact-item">
              <Phone size={15} />
              1900 6868
            </a>
            <span className="legal-contact-item">
              <MapPin size={15} />
              Tầng 12, Tòa nhà Earthoria, Q.1, TP.HCM
            </span>
          </div>
        </div>
      </section>

      {/* ═══ BACK TO TOP ═══ */}
      <button
        className={`legal-back-top ${showTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Lên đầu trang"
      >
        <ArrowUp size={18} />
      </button>
    </>
  );
}