import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  RefreshCcw,
  PackageOpen,
  Clock,
  Calendar,
  FileText,
  ChevronDown,
  Search,
  Printer,
  Mail,
  Phone,
  MapPin,
  ArrowUp,
  Link2,
  Check,
  Users,
  AlertTriangle,
  ShieldCheck,
  Banknote,
  XCircle,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   META & CONTENT DATA
───────────────────────────────────────────────────────────── */
const META = {
  effectiveDate: "01 Tháng 01, 2026",
  updatedDate: "15 Tháng 06, 2026",
  version: "v2.0",
};

const SUMMARY_CARDS = [
  {
    icon: RefreshCcw,
    title: "30 ngày đổi trả",
    desc: "Miễn phí đổi trả trong 30 ngày kể từ ngày nhận hàng nếu sản phẩm còn nguyên vẹn.",
  },
  {
    icon: Banknote,
    title: "Hoàn tiền nhanh",
    desc: "Tiền hoàn trả được xử lý trong 5–10 ngày làm việc sau khi Earthoria nhận lại hàng hợp lệ.",
  },
  {
    icon: ShieldCheck,
    title: "Bảo hành 12 tháng",
    desc: "Sản phẩm lỗi nhà sản xuất được đổi mới hoàn toàn miễn phí trong vòng 12 tháng từ ngày mua.",
  },
  {
    icon: XCircle,
    title: "Không câu hỏi",
    desc: "Trong 7 ngày đầu, bạn có thể trả hàng không cần nêu lý do — chỉ cần hàng còn nguyên seal.",
  },
];

const SECTIONS = [
  {
    id: "dieu-kien-doi-tra",
    num: "01",
    title: "Điều Kiện Đổi Trả Hợp Lệ",
    paragraphs: [
      "Earthoria chấp nhận yêu cầu đổi trả khi sản phẩm đáp ứng đồng thời các điều kiện dưới đây. Vui lòng kiểm tra kỹ trước khi gửi yêu cầu để đảm bảo được xử lý nhanh nhất.",
    ],
    list: [
      "Yêu cầu được gửi trong vòng 30 ngày kể từ ngày ký nhận hàng từ đơn vị vận chuyển",
      "Sản phẩm còn nguyên vẹn, chưa qua sử dụng — bìa sách không bị xước, gáy không bị gãy, trang sách không có dấu viết",
      "Còn đầy đủ phụ kiện đi kèm: thẻ kích hoạt AR, hộp đựng và hóa đơn mua hàng gốc",
      "Mã QR và chip NFC trên bìa sách chưa được kích hoạt trên bất kỳ tài khoản nào",
      "Sản phẩm không thuộc danh mục ngoại lệ được liệt kê tại Mục 06",
    ],
  },
  {
    id: "trong-7-ngay",
    num: "02",
    title: "Đổi Trả Không Cần Lý Do — Trong 7 Ngày",
    paragraphs: [
      "Trong vòng 7 ngày đầu kể từ khi nhận hàng, bạn có thể yêu cầu trả hàng và hoàn tiền 100% mà không cần nêu lý do, miễn là sản phẩm còn nguyên seal và chưa kích hoạt mã AR.",
    ],
    callout: {
      title: "Chính sách 7 ngày an tâm",
      text: "Đây là cam kết mạnh nhất của Earthoria với người mua lần đầu. Nếu vì bất kỳ lý do gì bạn không hài lòng trong 7 ngày đầu — dù chỉ là thay đổi ý định — chúng tôi sẽ hoàn tiền đầy đủ, kể cả phí vận chuyển chiều đi ban đầu.",
    },
    list: [
      "Earthoria chịu toàn bộ phí vận chuyển trả hàng — bạn không mất thêm bất kỳ khoản nào",
      "Tiền hoàn trả được xử lý trong 3–5 ngày làm việc sau khi chúng tôi nhận và kiểm tra hàng",
      "Áp dụng cho tối đa 2 lần trong vòng 12 tháng trên cùng một tài khoản",
    ],
  },
  {
    id: "tu-ngay-8-den-30",
    num: "03",
    title: "Đổi Trả Từ Ngày 8 Đến Ngày 30",
    paragraphs: [
      "Từ ngày thứ 8 đến ngày thứ 30, bạn vẫn có thể đổi trả hàng nhưng cần nêu lý do và sản phẩm phải đáp ứng đầy đủ điều kiện tại Mục 01.",
    ],
    list: [
      "Lý do hợp lệ bao gồm: sách bị lỗi in, nội dung không đúng với mô tả trên website, hoặc nhận sai sản phẩm",
      "Với lý do cá nhân (ví dụ đổi ý, mua nhầm): bạn chịu phí vận chuyển trả hàng chiều về; Earthoria hoàn tiền 100% giá trị sản phẩm",
      "Hàng trả về phải được đóng gói cẩn thận để tránh hư hỏng trong quá trình vận chuyển ngược — thiệt hại phát sinh do đóng gói không đúng sẽ được trừ vào số tiền hoàn trả",
    ],
  },
  {
    id: "san-pham-loi",
    num: "04",
    title: "Sản Phẩm Lỗi & Bảo Hành 12 Tháng",
    paragraphs: [
      "Sản phẩm Earthoria được bảo hành 12 tháng kể từ ngày mua đối với các lỗi phát sinh từ quá trình sản xuất. Earthoria phân biệt rõ lỗi nhà sản xuất và hao mòn tự nhiên do sử dụng.",
    ],
    callout: {
      title: "Lỗi nhà sản xuất được bảo hành",
      text: "Bao gồm: trang sách bị in sai, thiếu trang, chip NFC không hoạt động ngay khi nhận hàng, mã QR không đọc được trên sách mới chưa qua sử dụng, hoặc hộp sách bị biến dạng do lỗi vật liệu — không phải do tác động bên ngoài.",
    },
    list: [
      "Đổi sách mới hoàn toàn miễn phí trong vòng 5 ngày làm việc kể từ khi Earthoria xác nhận lỗi",
      "Earthoria chịu toàn bộ phí vận chuyển chiều về và chiều đi hàng mới",
      "Nếu sản phẩm cùng loại hết hàng, bạn được chọn: chờ tái bản (tối đa 30 ngày) hoặc hoàn tiền 100%",
      "Lỗi do rơi vỡ, ngấm nước, hoặc tác động vật lý bên ngoài không thuộc phạm vi bảo hành",
    ],
  },
  {
    id: "ma-ar-va-nfc",
    num: "05",
    title: "Chính Sách Riêng Cho Mã AR & Chip NFC",
    paragraphs: [
      "Mỗi cuốn sách Earthoria đi kèm một mã kích hoạt AR và chip NFC duy nhất, được liên kết với tài khoản người dùng sau khi kích hoạt lần đầu. Do tính chất kỹ thuật này, áp dụng các quy định riêng sau đây.",
    ],
    list: [
      "Mã AR chưa kích hoạt: sách có thể đổi trả bình thường theo điều kiện tại Mục 01",
      "Mã AR đã kích hoạt: sách không thể đổi trả vì lý do cá nhân — chỉ được đổi nếu có lỗi nhà sản xuất được xác nhận",
      "Nếu mã AR trên sách lỗi kỹ thuật (không kích hoạt được dù chưa từng sử dụng), Earthoria sẽ cấp lại mã mới trong vòng 24 giờ làm việc mà không cần trả lại sách vật lý",
      "Tài khoản AR đã kích hoạt sẽ được chuyển sang sách thay thế nếu đổi hàng theo bảo hành",
    ],
  },
  {
    id: "ngoai-le",
    num: "06",
    title: "Sản Phẩm Không Áp Dụng Đổi Trả",
    paragraphs: [
      "Một số sản phẩm và trường hợp không thuộc phạm vi chính sách đổi trả này. Earthoria sẽ thông báo rõ ràng trên trang sản phẩm trước khi bạn đặt mua.",
    ],
    list: [
      "Sản phẩm mua trong chương trình khuyến mãi clearance (đã ghi rõ \"Không áp dụng đổi trả\" trên trang sản phẩm)",
      "Sách đặt theo yêu cầu riêng hoặc in tên cá nhân hóa theo đơn đặt hàng đặc biệt",
      "Phụ kiện mở rộng như giá đỡ AR, bút NFC đã qua sử dụng hoặc đã tháo seal",
      "Sách bị hư hỏng do người dùng: ướt, rách, có vết viết hoặc dấu hiệu sử dụng rõ ràng",
      "Yêu cầu đổi trả gửi sau ngày thứ 30 kể từ khi nhận hàng",
    ],
  },
  {
    id: "quy-trinh-doi-tra",
    num: "07",
    title: "Quy Trình Thực Hiện Đổi Trả",
    paragraphs: [
      "Toàn bộ quy trình được thiết kế để giải quyết nhanh nhất có thể — thông thường hoàn tất trong vòng 5 đến 10 ngày làm việc kể từ khi bạn gửi yêu cầu.",
    ],
    list: [
      "Bước 1 — Gửi yêu cầu: điền form đổi trả trong mục \"Đơn hàng của tôi\" hoặc email đến support@earthoria.vn kèm ảnh sản phẩm và lý do",
      "Bước 2 — Xác nhận: Earthoria phản hồi trong vòng 1 ngày làm việc, xác nhận hợp lệ và cung cấp mã vận đơn trả hàng miễn phí (nếu áp dụng)",
      "Bước 3 — Gửi hàng: đóng gói cẩn thận và gửi hàng trong vòng 3 ngày kể từ khi nhận mã vận đơn",
      "Bước 4 — Kiểm tra: Earthoria kiểm tra hàng trong vòng 1–2 ngày làm việc sau khi nhận",
      "Bước 5 — Xử lý: hoàn tiền hoặc giao sản phẩm thay thế trong vòng 3–5 ngày làm việc sau kiểm tra",
    ],
  },
  {
    id: "hinh-thuc-hoan-tien",
    num: "08",
    title: "Hình Thức Hoàn Tiền",
    paragraphs: [
      "Tiền hoàn trả sẽ được thực hiện theo đúng phương thức thanh toán ban đầu của đơn hàng. Earthoria không hoàn tiền sang phương thức khác với phương thức đã thanh toán, trừ trường hợp đặc biệt có thỏa thuận riêng.",
    ],
    list: [
      "Thẻ tín dụng / ghi nợ: hoàn tiền trong 5–10 ngày làm việc (tùy ngân hàng phát hành thẻ)",
      "Ví điện tử (MoMo, ZaloPay, VNPay): hoàn tiền trong 1–3 ngày làm việc",
      "Chuyển khoản ngân hàng: hoàn tiền trong 2–5 ngày làm việc",
      "COD (đã trả tiền mặt khi nhận hàng): hoàn tiền qua chuyển khoản ngân hàng vào tài khoản bạn cung cấp, trong 3–5 ngày làm việc",
      "Earthoria không hoàn tiền bằng tiền mặt trực tiếp trong bất kỳ trường hợp nào",
    ],
  },
  {
    id: "lien-he",
    num: "09",
    title: "Liên Hệ Hỗ Trợ Đổi Trả",
    paragraphs: [
      "Nếu bạn cần hỗ trợ hoặc có thắc mắc về quy trình đổi trả, đội ngũ Chăm sóc Khách hàng của Earthoria hoạt động từ 8:00 đến 21:00, bảy ngày trong tuần, sẵn sàng hỗ trợ qua các kênh dưới đây.",
    ],
  },
];

const FAQS = [
  {
    q: "Tôi có thể đổi sang cuốn sách khác thay vì hoàn tiền không?",
    a: "Có. Khi gửi yêu cầu đổi trả, bạn có thể chọn \"Đổi sang sản phẩm khác\" thay vì hoàn tiền. Nếu sản phẩm thay thế có giá cao hơn, bạn chỉ cần thanh toán phần chênh lệch. Nếu thấp hơn, Earthoria hoàn lại phần còn lại.",
  },
  {
    q: "Mã AR của tôi đã kích hoạt rồi — sách có lỗi in thì làm sao?",
    a: "Lỗi in là lỗi nhà sản xuất và được bảo hành đầy đủ dù mã AR đã kích hoạt. Earthoria sẽ gửi sách mới và chuyển quyền truy cập AR sang sách mới trong vòng 24 giờ kể từ khi nhận được sách cũ.",
  },
  {
    q: "Tôi mua hàng từ đại lý ủy quyền — có được đổi trả qua Earthoria không?",
    a: "Hàng mua từ đại lý ủy quyền được đổi trả theo chính sách của đại lý đó. Tuy nhiên, với lỗi nhà sản xuất trong vòng bảo hành 12 tháng, bạn có thể liên hệ trực tiếp Earthoria để được xử lý theo kênh bảo hành chính hãng.",
  },
  {
    q: "Tôi quên giữ hóa đơn — có đổi trả được không?",
    a: "Hóa đơn điện tử từ email xác nhận đơn hàng có giá trị tương đương hóa đơn vật lý. Nếu không còn email, cung cấp mã đơn hàng hoặc số điện thoại đăng ký tài khoản — đội hỗ trợ sẽ tra cứu lịch sử mua hàng của bạn.",
  },
  {
    q: "Sau 30 ngày sách bị lỗi nhà sản xuất thì có được bảo hành không?",
    a: "Có. Bảo hành lỗi nhà sản xuất áp dụng trong toàn bộ 12 tháng từ ngày mua, độc lập với chính sách đổi trả 30 ngày. Sau 30 ngày bạn không thể đổi trả vì lý do cá nhân, nhưng vẫn được đổi mới miễn phí nếu xác nhận là lỗi sản xuất.",
  },
];

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function ReturnPolicy() {
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
      const scrollHeight = (el.scrollHeight || document.body.scrollHeight) - el.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
      setShowTop(scrollTop > 700);
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { window.requestAnimationFrame(update); ticking = true; } };
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
        .legal-progress-rail {
          position: fixed; top: 0; left: 0; right: 0; height: 2px;
          background: rgba(13,43,30,0.06); z-index: 950;
        }
        .legal-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gold), var(--forest-light));
          transition: width 0.1s linear;
        }
        .legal-hero {
          position: relative; overflow: hidden;
          background: var(--forest); padding: 132px 100px 56px;
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
          font-size: clamp(70px, 11vw, 170px); font-weight: 300;
          color: rgba(255,255,255,0.025); white-space: nowrap;
          pointer-events: none; user-select: none; letter-spacing: -0.02em;
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
          font-size: clamp(34px, 4.6vw, 56px); font-weight: 300; line-height: 1.1;
          color: var(--ivory); letter-spacing: -0.01em; margin-bottom: 18px;
        }
        .legal-hero-title em { font-style: italic; color: var(--gold); }
        .legal-hero-sub {
          font-size: 14px; line-height: 1.75; color: rgba(250,248,243,0.6);
          font-weight: 300; max-width: 620px; margin: 0 auto 30px;
        }
        .legal-hero-meta {
          display: flex; flex-wrap: wrap; justify-content: center;
          gap: 10px; margin-bottom: 30px;
        }
        .legal-hero-meta-item {
          display: flex; align-items: center; gap: 9px; padding: 9px 16px;
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
          color: rgba(255,255,255,0.85); backdrop-filter: blur(8px);
        }
        .legal-btn-ghost:hover { background: rgba(255,255,255,0.12); }

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
          transform: translateY(-4px); border-color: var(--border-gold);
          box-shadow: 0 20px 44px rgba(13,43,30,0.08);
        }
        .legal-summary-icon {
          width: 40px; height: 40px; border: 0.5px solid var(--border-gold);
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

        .legal-layout {
          max-width: 1400px; margin: 0 auto;
          padding: 100px 100px 60px;
          display: grid; grid-template-columns: 296px 1fr; gap: 72px;
        }
        .legal-sidebar-sticky {
          position: sticky; top: 108px;
          max-height: calc(100vh - 128px); overflow-y: auto;
          padding-right: 6px; padding-bottom: 8px;
          transform: translateZ(0); backface-visibility: hidden;
        }
        .legal-sidebar-sticky::-webkit-scrollbar { width: 3px; }
        .legal-sidebar-sticky::-webkit-scrollbar-thumb { background: var(--border-gold); }
        .legal-toc-search {
          display: flex; align-items: center; gap: 10px;
          border: 0.5px solid var(--border); padding: 11px 14px; margin-bottom: 24px;
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
          padding: 28px 30px; margin: 24px 0; border-left: 3px solid var(--gold);
        }
        .legal-callout-icon {
          width: 38px; height: 38px; flex-shrink: 0;
          border: 0.5px solid rgba(74,158,63,0.4);
          background: rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center; color: var(--gold);
        }
        .legal-callout-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px; color: var(--ivory); margin-bottom: 8px; font-weight: 400;
        }
        .legal-callout p {
          font-size: 13px; line-height: 1.8; color: rgba(250,248,243,0.65);
          font-weight: 300; margin: 0;
        }

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
          font-size: 18px; font-weight: 400; color: var(--forest); transition: color 0.25s;
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
        .legal-contact-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; }
        .legal-contact-item {
          display: flex; align-items: center; gap: 10px; padding: 14px 24px;
          border: 0.5px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.04);
          font-size: 13px; color: rgba(250,248,243,0.8);
          text-decoration: none; transition: all 0.3s ease;
        }
        .legal-contact-item:hover { border-color: var(--gold); color: var(--gold); }
        .legal-contact-item svg { color: var(--gold); flex-shrink: 0; }

        .legal-back-top {
          position: fixed; bottom: 36px; right: 36px; width: 48px; height: 48px;
          background: var(--forest); border: 0.5px solid var(--border-gold);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 850; opacity: 0; transform: translateY(16px);
          transition: all 0.4s ease; color: var(--gold);
        }
        .legal-back-top.visible { opacity: 1; transform: translateY(0); }
        .legal-back-top:hover { background: var(--forest-mid); }

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

      <div className="legal-progress-rail">
        <div className="legal-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">Trang chủ</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/legal" className="breadcrumb-item">Pháp lý</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Chính sách trả hàng & hoàn tiền</span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="legal-hero">
        <div className="legal-hero-grid" />
        <div className="legal-hero-glow" />
        <div className="legal-hero-watermark">EARTHORIA</div>
        <div className="legal-hero-inner">
          <div className="legal-hero-icon">
            <PackageOpen size={22} />
          </div>
          <div className="legal-hero-eyebrow">
            <span className="legal-hero-eyebrow-line" />
            <span>Đổi Trả &amp; Hoàn Tiền</span>
            <span className="legal-hero-eyebrow-line" />
          </div>
          <h1 className="legal-hero-title">
            Chính Sách —<br />
            <em>Trả Hàng & Hoàn Tiền</em>
          </h1>
          <p className="legal-hero-sub">
            Mua sắm an tâm với chính sách đổi trả 30 ngày, bảo hành 12 tháng
            và cam kết hoàn tiền minh bạch — không điều kiện ẩn.
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
            <button className="legal-btn-main" onClick={() => scrollToSection(SECTIONS[0].id)}>
              Xem chi tiết <ChevronDown size={14} />
            </button>
            <button className="legal-btn-ghost" onClick={() => window.print()}>
              <Printer size={14} /> In / Lưu PDF
            </button>
          </div>
        </div>
      </section>

      {/* ═══ SUMMARY ═══ */}
      <section className="legal-summary">
        <div className="legal-summary-inner">
          {SUMMARY_CARDS.map((card, i) => (
            <div className={`legal-summary-card reveal reveal-delay-${i + 1}`} key={i}>
              <div className="legal-summary-icon"><card.icon size={20} /></div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ LAYOUT ═══ */}
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
              <Users size={14} /><span>Câu hỏi thường gặp</span>
            </button>
            <button className="legal-toc-item" onClick={() => scrollToSection("lien-he-card")}>
              <Mail size={14} /><span>Liên hệ hỗ trợ</span>
            </button>
            <div className="legal-sidebar-card">
              <div className="legal-sidebar-card-title">Gửi yêu cầu đổi trả</div>
              <p>Liên hệ trực tiếp để được hỗ trợ nhanh nhất — chúng tôi phản hồi trong 1 ngày làm việc.</p>
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
                    <div className="legal-callout-icon"><AlertTriangle size={17} /></div>
                    <div>
                      <div className="legal-callout-title">{s.callout.title}</div>
                      <p>{s.callout.text}</p>
                    </div>
                  </div>
                )}
                {s.list && (
                  <ul>
                    {s.list.map((item, i) => (
                      <li key={i}><span className="legal-li-dot" /><span>{item}</span></li>
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
            <h2 className="section-title">Câu Hỏi <em>Thường Gặp</em></h2>
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
                <div className="legal-faq-answer"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CONTACT CTA ═══ */}
      <section className="legal-contact-section" id="lien-he-card">
        <div className="legal-contact-bgtext">EARTHORIA</div>
        <div className="legal-contact-inner">
          <span className="legal-contact-eyebrow reveal">Cần hỗ trợ đổi trả?</span>
          <h2 className="legal-contact-title reveal">
            Chúng tôi giải quyết<br />
            <em>trong 1 ngày làm việc</em>
          </h2>
          <div className="legal-contact-grid reveal">
            <a href="mailto:support@earthoria.vn" className="legal-contact-item">
              <Mail size={15} />support@earthoria.vn
            </a>
            <a href="tel:19006868" className="legal-contact-item">
              <Phone size={15} />1900 6868
            </a>
            <span className="legal-contact-item">
              <MapPin size={15} />Tầng 12, Tòa nhà Earthoria, Q.1, TP.HCM
            </span>
          </div>
        </div>
      </section>

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