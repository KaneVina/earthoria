import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Crown,
  Percent,
  Truck,
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
  TrendingUp,
  Lock,
} from "lucide-react";

const META = {
  effectiveDate: "01 Tháng 01, 2026",
  updatedDate: "23 Tháng 08, 2026",
  version: "v1.0",
};

const TIERS = [
  {
    roman: "I",
    name: "Chùa Một Cột",
    minSpend: 0,
    discountPercent: 0,
    maxDiscountPerOrder: 0,
    freeShipThreshold: 300_000,
    color: "#4a9e3f",
  },
  {
    roman: "II",
    name: "Cố Đô Huế",
    minSpend: 3_000_000,
    discountPercent: 3,
    maxDiscountPerOrder: 100_000,
    freeShipThreshold: 200_000,
    color: "#2a78d6",
  },
  {
    roman: "III",
    name: "Cầu Rồng",
    minSpend: 7_000_000,
    discountPercent: 5,
    maxDiscountPerOrder: 200_000,
    freeShipThreshold: 100_000,
    color: "#b8862e",
  },
  {
    roman: "IV",
    name: "Tháp Bà Ponagar",
    minSpend: 15_000_000,
    discountPercent: 8,
    maxDiscountPerOrder: 350_000,
    freeShipThreshold: 0,
    color: "#7a4fb5",
  },
  {
    roman: "V",
    name: "Landmark 81",
    minSpend: 30_000_000,
    discountPercent: 12,
    maxDiscountPerOrder: 600_000,
    freeShipThreshold: 0,
    color: "#c0392b",
  },
];

const formatVnd = (n) =>
  n > 0 ? `${new Intl.NumberFormat("vi-VN").format(n)}đ` : "0đ";

const SUMMARY_CARDS = [
  {
    icon: TrendingUp,
    title: "5 hạng tích lũy",
    desc: "Từ Chùa Một Cột đến Landmark 81 — hạng của bạn tăng dần theo tổng chi tiêu trọn đời, không bao giờ bị reset.",
  },
  {
    icon: Percent,
    title: "Giảm giá đến 12%",
    desc: "Mỗi đơn hàng được tự động giảm giá theo hạng hiện tại, áp dụng ngay tại bước thanh toán.",
  },
  {
    icon: Truck,
    title: "Miễn phí vận chuyển",
    desc: "Ngưỡng miễn phí ship giảm dần theo hạng — từ Hạng IV trở lên, mọi đơn hàng đều được miễn phí ship.",
  },
  {
    icon: Lock,
    title: "Không bao giờ mất hạng",
    desc: "Hạng thành viên được cộng dồn vĩnh viễn theo lịch sử mua hàng — Earthoria không hạ hạng vì bất kỳ lý do gì.",
  },
];

const SECTIONS = [
  {
    id: "tong-quan",
    num: "01",
    title: "Tổng Quan Hệ Thống Hạng Thành Viên",
    paragraphs: [
      "Hệ thống Hạng Thành Viên Earthoria ghi nhận hành trình mua sắm của bạn qua 5 hạng, được thể hiện như 5 chặng vé máy bay đến những công trình biểu tượng của Việt Nam — từ Hạng I (Chùa Một Cột, Hà Nội) đến Hạng V (Landmark 81, TP.HCM). Hạng của bạn được xác định hoàn toàn tự động dựa trên tổng giá trị các đơn hàng đã mua thành công, không yêu cầu đăng ký hay đóng phí thành viên.",
      "Chính sách này áp dụng cho mọi tài khoản khách hàng cá nhân trên website và ứng dụng Earthoria, và có thể được cập nhật định kỳ để phản ánh chương trình ưu đãi mới nhất.",
    ],
  },
  {
    id: "cach-tinh-hang",
    num: "02",
    title: "Cách Tính Hạng & Tổng Chi Tiêu Tích Lũy",
    paragraphs: [
      "Hạng thành viên được tính dựa trên tổng chi tiêu tích lũy trọn đời (lifetime spend) của tài khoản — là tổng giá trị đơn hàng (subtotal, trước phí vận chuyển) của tất cả đơn hàng đã thanh toán thành công.",
    ],
    callout: {
      title: "Đơn hàng nào được tính vào chi tiêu tích lũy?",
      text: 'Chỉ các đơn hàng có trạng thái thanh toán "Đã thanh toán" (PAID) và đang ở một trong các trạng thái: Đã xác nhận, Đang giao, Đã giao hoặc Hoàn tất mới được cộng vào tổng chi tiêu. Đơn hàng bị hủy, hoàn tiền toàn phần, hoặc đang chờ thanh toán sẽ không được tính.',
    },
    list: [
      "Hệ thống tự động đối chiếu lại tổng chi tiêu mỗi khi trạng thái đơn hàng thay đổi — không cần bạn yêu cầu thủ công",
      "Giá trị được cộng dồn là giá trị sản phẩm (subtotal), không bao gồm phí vận chuyển hoặc các khoản giảm giá đã áp dụng trước đó",
      'Bạn có thể xem chính xác tổng chi tiêu và tiến trình lên hạng tiếp theo tại trang "Hành Trình Hạng Thành Viên" trong hồ sơ cá nhân',
    ],
  },
  {
    id: "bang-hang",
    num: "03",
    title: "Bảng 5 Hạng Thành Viên & Quyền Lợi",
    paragraphs: [
      "Dưới đây là toàn bộ 5 hạng thành viên hiện hành cùng ngưỡng chi tiêu mở khóa và quyền lợi tương ứng. Giảm giá được áp dụng tự động trên mỗi đơn hàng và không thể quy đổi thành tiền mặt.",
    ],
    tiersTable: true,
  },
  {
    id: "uu-dai-giam-gia",
    num: "04",
    title: "Ưu Đãi Giảm Giá Theo Đơn Hàng",
    paragraphs: [
      "Từ Hạng II trở lên, mỗi đơn hàng của bạn được tự động giảm giá theo phần trăm quy định của hạng hiện tại, tính trên giá trị sản phẩm (subtotal) trước phí vận chuyển.",
    ],
    list: [
      "Mức giảm được áp dụng tự động ngay tại bước thanh toán — bạn không cần nhập mã hay yêu cầu thủ công",
      "Mỗi hạng có mức giảm tối đa cho một đơn hàng (ví dụ Hạng III giảm 5% nhưng không quá 200.000đ/đơn) nhằm đảm bảo công bằng giữa các đơn hàng giá trị khác nhau",
      'Ưu đãi giảm giá theo hạng không được cộng dồn với mã giảm giá khuyến mãi có ghi chú "không áp dụng cùng ưu đãi khác" — hệ thống sẽ tự động áp dụng mức giảm có lợi hơn cho bạn',
      "Ưu đãi chỉ áp dụng cho đơn hàng thanh toán thành công, không áp dụng hồi tố cho các đơn đã đặt trước khi lên hạng",
    ],
  },
  {
    id: "mien-phi-van-chuyen",
    num: "05",
    title: "Ngưỡng Miễn Phí Vận Chuyển Theo Hạng",
    paragraphs: [
      "Ngưỡng giá trị đơn hàng tối thiểu để được miễn phí vận chuyển giảm dần khi hạng của bạn tăng lên, và được miễn phí hoàn toàn từ Hạng IV.",
    ],
    list: [
      "Hạng I: miễn phí ship cho đơn từ 300.000đ — áp dụng mặc định cho mọi tài khoản mới",
      "Hạng II: miễn phí ship cho đơn từ 200.000đ",
      "Hạng III: miễn phí ship cho đơn từ 100.000đ",
      "Hạng IV & Hạng V: miễn phí vận chuyển cho mọi đơn hàng, không giới hạn giá trị",
      "Ngưỡng miễn phí ship được tính trên giá trị đơn hàng sau khi đã áp dụng giảm giá theo hạng (nếu có)",
    ],
  },
  {
    id: "khong-ha-hang",
    num: "06",
    title: "Nguyên Tắc Không Hạ Hạng & Không Hết Hạn",
    paragraphs: [
      "Khác với nhiều chương trình thành viên tính theo chu kỳ hàng năm, hạng thành viên Earthoria được cộng dồn vĩnh viễn theo tổng chi tiêu trọn đời và không có cơ chế hạ hạng theo thời gian.",
    ],
    callout: {
      title: "Cam kết của Earthoria",
      text: "Một khi bạn đã đạt một hạng thành viên, hạng đó — cùng toàn bộ quyền lợi đi kèm — sẽ được giữ nguyên vĩnh viễn, kể cả khi bạn ngừng mua hàng trong một thời gian dài. Earthoria không áp dụng bất kỳ chính sách hết hạn hay đánh giá lại hạng theo chu kỳ nào.",
    },
    list: [
      "Hạng thành viên không bị ảnh hưởng bởi tần suất mua hàng, chỉ phụ thuộc vào tổng giá trị tích lũy",
      "Trường hợp ngoại lệ duy nhất: nếu một đơn hàng đã được tính vào chi tiêu tích lũy sau đó bị hủy hoặc hoàn tiền toàn phần do gian lận, giá trị đơn hàng đó sẽ được trừ lại khỏi tổng chi tiêu và hạng có thể được điều chỉnh tương ứng",
      "Việc điều chỉnh do gian lận (nếu có) sẽ luôn được thông báo trực tiếp đến email tài khoản của bạn kèm lý do cụ thể",
    ],
  },
  {
    id: "dieu-kien-va-ngoai-le",
    num: "07",
    title: "Điều Kiện Áp Dụng & Ngoại Lệ",
    paragraphs: [
      "Một số trường hợp đặc thù được quy định riêng để đảm bảo tính công bằng của hệ thống hạng thành viên.",
    ],
    list: [
      "Hệ thống hạng thành viên chỉ áp dụng cho tài khoản khách hàng cá nhân đã đăng nhập — không áp dụng cho đơn hàng đặt dưới hình thức khách vãng lai (guest checkout)",
      "Mỗi khách hàng chỉ được sở hữu một tài khoản duy nhất để tích lũy hạng; Earthoria có quyền hợp nhất hoặc vô hiệu hóa các tài khoản trùng lặp được tạo nhằm mục đích trục lợi ưu đãi",
      'Ưu đãi theo hạng không áp dụng cho các sản phẩm đã được đánh dấu "không áp dụng khuyến mãi" trên trang sản phẩm',
      "Earthoria bảo lưu quyền tạm ngưng quyền lợi hạng thành viên đối với tài khoản có dấu hiệu gian lận, lạm dụng hệ thống hoặc vi phạm Điều Khoản Dịch Vụ",
    ],
  },
  {
    id: "thay-doi-chinh-sach",
    num: "08",
    title: "Thay Đổi Chính Sách & Thông Báo",
    paragraphs: [
      "Earthoria có thể điều chỉnh ngưỡng chi tiêu, mức giảm giá hoặc quyền lợi của từng hạng theo thời gian để phù hợp với chiến lược kinh doanh và trải nghiệm khách hàng.",
    ],
    list: [
      "Mọi thay đổi làm giảm quyền lợi hiện có sẽ được thông báo trước tối thiểu 14 ngày qua email và banner trên website, theo đúng cam kết minh bạch chung của Earthoria",
      "Chi tiêu tích lũy và hạng đã đạt được của bạn không bị ảnh hưởng bởi các thay đổi chính sách trong tương lai, trừ khi có thông báo cụ thể khác",
      "Phiên bản chính sách hiện hành luôn được công bố công khai tại trang này, kèm số phiên bản và ngày cập nhật gần nhất",
    ],
  },
  {
    id: "lien-he",
    num: "09",
    title: "Liên Hệ Về Hạng Thành Viên",
    paragraphs: [
      "Nếu bạn có thắc mắc về hạng hiện tại, tổng chi tiêu tích lũy hoặc quyền lợi tương ứng, đội ngũ Chăm sóc Khách hàng của Earthoria sẵn sàng hỗ trợ qua các kênh dưới đây.",
    ],
  },
];

const FAQS = [
  {
    q: "Tổng chi tiêu để lên hạng được tính từ khi nào?",
    a: "Tổng chi tiêu được tính từ đơn hàng thành công đầu tiên trên tài khoản của bạn — không giới hạn theo năm hay theo chu kỳ. Toàn bộ lịch sử mua hàng hợp lệ đều được cộng dồn.",
  },
  {
    q: "Tôi vừa lên hạng mới — đơn hàng đang xử lý có được áp dụng ưu đãi mới không?",
    a: "Ưu đãi theo hạng được tính tại thời điểm bạn tạo đơn hàng, không áp dụng hồi tố cho đơn đã đặt trước đó. Đơn hàng mới tạo sau khi lên hạng sẽ tự động nhận ưu đãi của hạng mới.",
  },
  {
    q: "Tôi có thể xem chính xác mình còn thiếu bao nhiêu để lên hạng tiếp theo không?",
    a: 'Có. Trang "Hành Trình Hạng Thành Viên" trong hồ sơ cá nhân hiển thị tổng chi tiêu hiện tại, hạng đang giữ, và số tiền cụ thể còn thiếu để đạt hạng kế tiếp, kèm thanh tiến trình trực quan.',
  },
  {
    q: "Ưu đãi giảm giá theo hạng có dùng chung được với mã giảm giá khuyến mãi khác không?",
    a: 'Tùy chương trình khuyến mãi. Nếu mã khuyến mãi ghi rõ "không áp dụng cùng ưu đãi khác", hệ thống sẽ tự động chọn mức giảm có lợi hơn cho bạn giữa hai ưu đãi, không cộng dồn cả hai.',
  },
  {
    q: "Tôi mua hàng nhiều nhưng đơn bị hủy — có bị trừ hạng không?",
    a: "Đơn hàng bị hủy hoặc chưa thanh toán thành công không được tính vào chi tiêu tích lũy ngay từ đầu, nên không ảnh hưởng đến hạng. Hạng chỉ bị điều chỉnh trong trường hợp đơn đã tính chi tiêu sau đó bị hoàn tiền toàn phần do gian lận.",
  },
  {
    q: "Đạt Hạng V (Landmark 81) rồi thì có ưu đãi nào cao hơn nữa không?",
    a: "Hạng V hiện là hạng cao nhất trong hệ thống với mức giảm 12% mỗi đơn (tối đa 600.000đ) và miễn phí vận chuyển toàn bộ. Earthoria có thể giới thiệu các hạng hoặc đặc quyền mới trong tương lai và sẽ luôn thông báo trước đến thành viên Hạng V.",
  },
];

/*
   COMPONENT
 */
export default function MembershipPolicy() {
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
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* scrollspy */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        }),
      { rootMargin: "-130px 0px -65% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
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
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        }),
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
    ? SECTIONS.filter((s) =>
        s.title.toLowerCase().includes(tocQuery.toLowerCase()),
      )
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

        .legal-tiers-table-wrap {
          overflow-x: auto; margin: 24px 0 8px;
          border: 0.5px solid var(--border);
        }
        .legal-tiers-table {
          width: 100%; border-collapse: collapse; min-width: 640px;
          font-family: 'Be Vietnam Pro', sans-serif;
        }
        .legal-tiers-table th {
          text-align: left; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
          font-weight: 500; color: var(--text-muted); background: var(--cream);
          padding: 14px 18px; border-bottom: 0.5px solid var(--border);
        }
        .legal-tiers-table td {
          padding: 16px 18px; font-size: 13px; color: var(--text-muted);
          font-weight: 300; border-bottom: 0.5px solid var(--border);
          vertical-align: middle;
        }
        .legal-tiers-table tr:last-child td { border-bottom: none; }
        .legal-tiers-tier-cell { display: flex; align-items: center; gap: 10px; }
        .legal-tiers-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .legal-tiers-tier-name { color: var(--forest); font-weight: 500; }
        .legal-tiers-table strong { color: var(--forest); font-weight: 500; }

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
        body.dark-mode .legal-tiers-table-wrap { border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-tiers-table th { background: #1c2822; color: rgba(180,200,188,0.6); border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-tiers-table td { color: rgba(180,200,188,0.7); border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-tiers-tier-name, body.dark-mode .legal-tiers-table strong { color: #c8d4cc; }
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
        <div
          className="legal-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">
          Trang chủ
        </Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/legal" className="breadcrumb-item">
          Pháp lý
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Chính sách hạng thành viên</span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="legal-hero">
        <div className="legal-hero-grid" />
        <div className="legal-hero-glow" />
        <div className="legal-hero-watermark">EARTHORIA</div>
        <div className="legal-hero-inner">
          <div className="legal-hero-icon">
            <Crown size={22} />
          </div>
          <div className="legal-hero-eyebrow">
            <span className="legal-hero-eyebrow-line" />
            <span>Ưu Đãi &amp; Đặc Quyền</span>
            <span className="legal-hero-eyebrow-line" />
          </div>
          <h1 className="legal-hero-title">
            Chính Sách —<br />
            <em>Hạng Thành Viên</em>
          </h1>
          <p className="legal-hero-sub">
            Cách hạng thành viên của bạn được xác định, quyền lợi đi kèm mỗi
            hạng, và cam kết cộng dồn vĩnh viễn — không bao giờ hạ hạng.
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
            <div
              className={`legal-summary-card reveal reveal-delay-${i + 1}`}
              key={i}
            >
              <div className="legal-summary-icon">
                <card.icon size={20} />
              </div>
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
                <div className="legal-toc-empty">
                  Không tìm thấy mục nào phù hợp
                </div>
              )}
            </nav>
            <div className="legal-toc-divider" />
            <button
              className="legal-toc-item"
              onClick={() => scrollToSection("faq")}
            >
              <Users size={14} />
              <span>Câu hỏi thường gặp</span>
            </button>
            <button
              className="legal-toc-item"
              onClick={() => scrollToSection("lien-he-card")}
            >
              <Mail size={14} />
              <span>Liên hệ hỗ trợ</span>
            </button>
            <div className="legal-sidebar-card">
              <div className="legal-sidebar-card-title">Xem hạng của bạn</div>
              <p>
                Theo dõi tổng chi tiêu và tiến trình lên hạng tại trang Hành
                Trình Hạng Thành Viên.
              </p>
              <Link to="/loyalty" className="legal-sidebar-card-link">
                Hành Trình Hạng Thành Viên
              </Link>
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
                  {copiedId === s.id ? (
                    <Check size={13} />
                  ) : (
                    <Link2 size={13} />
                  )}
                </button>
              </div>
              <div className="legal-section-body">
                {s.paragraphs?.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {s.callout && (
                  <div className="legal-callout">
                    <div className="legal-callout-icon">
                      <AlertTriangle size={17} />
                    </div>
                    <div>
                      <div className="legal-callout-title">
                        {s.callout.title}
                      </div>
                      <p>{s.callout.text}</p>
                    </div>
                  </div>
                )}
                {s.tiersTable && (
                  <div className="legal-tiers-table-wrap">
                    <table className="legal-tiers-table">
                      <thead>
                        <tr>
                          <th>Hạng</th>
                          <th>Ngưỡng chi tiêu tích lũy</th>
                          <th>Giảm giá mỗi đơn</th>
                          <th>Miễn phí ship</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TIERS.map((t) => (
                          <tr key={t.roman}>
                            <td>
                              <div className="legal-tiers-tier-cell">
                                <span
                                  className="legal-tiers-dot"
                                  style={{ background: t.color }}
                                />
                                <span className="legal-tiers-tier-name">
                                  Hạng {t.roman} · {t.name}
                                </span>
                              </div>
                            </td>
                            <td>
                              {t.minSpend > 0 ? (
                                <>
                                  từ <strong>{formatVnd(t.minSpend)}</strong>
                                </>
                              ) : (
                                <>Mặc định khi tạo tài khoản</>
                              )}
                            </td>
                            <td>
                              {t.discountPercent > 0 ? (
                                <>
                                  <strong>{t.discountPercent}%</strong> (tối đa{" "}
                                  {formatVnd(t.maxDiscountPerOrder)}/đơn)
                                </>
                              ) : (
                                "Chưa có"
                              )}
                            </td>
                            <td>
                              {t.freeShipThreshold > 0 ? (
                                <>
                                  Đơn từ{" "}
                                  <strong>
                                    {formatVnd(t.freeShipThreshold)}
                                  </strong>
                                </>
                              ) : (
                                <strong>Mọi đơn hàng</strong>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
              <div
                key={i}
                className={`legal-faq-item ${openFaq === i ? "open" : ""}`}
              >
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
          <span className="legal-contact-eyebrow reveal">
            Cần hỗ trợ về hạng thành viên?
          </span>
          <h2 className="legal-contact-title reveal">
            Đội ngũ Earthoria
            <br />
            <em>sẵn sàng giải đáp</em>
          </h2>
          <div className="legal-contact-grid reveal">
            <a
              href="mailto:support@earthoria.vn"
              className="legal-contact-item"
            >
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
    </>
  );
}
