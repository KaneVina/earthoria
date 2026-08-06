import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Cookie,
  Settings2,
  BarChart3,
  Megaphone,
  ShieldCheck,
  Smartphone,
  Globe2,
  Users,
  Database,
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
  ToggleLeft,
  Eye,
  AlertTriangle,
} from "lucide-react";

/* ───────────────────────────────────────────────────────────
   META & CONTENT DATA
───────────────────────────────────────────────────────────── */
const META = {
  effectiveDate: "01 Tháng 01, 2026",
  updatedDate: "15 Tháng 06, 2026",
  version: "v1.6",
};

const SUMMARY_CARDS = [
  {
    icon: ToggleLeft,
    title: "Bạn luôn kiểm soát",
    desc: "Bật hoặc tắt từng nhóm cookie không thiết yếu bất cứ lúc nào trong mục Cài đặt quyền riêng tư.",
  },
  {
    icon: ShieldCheck,
    title: "Không quảng cáo cho trẻ em",
    desc: "Cookie quảng cáo nhắm mục tiêu không bao giờ được đặt cho tài khoản hoặc thiết bị được xác định là trẻ em.",
  },
  {
    icon: Clock,
    title: "Vòng đời rõ ràng",
    desc: "Mỗi loại cookie có thời hạn lưu trữ cụ thể, được liệt kê minh bạch bên dưới — không có cookie \"vĩnh viễn\" ẩn.",
  },
  {
    icon: Eye,
    title: "Minh bạch tuyệt đối",
    desc: "Bảng chi tiết từng cookie, nhà cung cấp và mục đích sử dụng được công khai đầy đủ trong chính sách này.",
  },
];

const COOKIE_TABLE = [
  {
    name: "eh_session",
    provider: "Earthoria",
    purpose: "Duy trì phiên đăng nhập và giỏ hàng của bạn",
    duration: "Phiên làm việc (xóa khi đóng trình duyệt)",
    type: "Cần thiết",
  },
  {
    name: "eh_consent",
    provider: "Earthoria",
    purpose: "Ghi nhớ lựa chọn đồng ý cookie của bạn",
    duration: "12 tháng",
    type: "Cần thiết",
  },
  {
    name: "eh_family_dashboard",
    provider: "Earthoria",
    purpose: "Ghi nhớ hồ sơ trẻ đang được chọn trong Bảng điều khiển gia đình",
    duration: "Phiên làm việc",
    type: "Cần thiết",
  },
  {
    name: "_ga, _gid",
    provider: "Google Analytics",
    purpose: "Thống kê lượt truy cập và hành vi sử dụng ở cấp độ tổng hợp, ẩn danh",
    duration: "Tối đa 13 tháng",
    type: "Phân tích",
  },
  {
    name: "eh_reco_pref",
    provider: "Earthoria",
    purpose: "Ghi nhớ thể loại sách yêu thích để gợi ý nội dung phù hợp",
    duration: "6 tháng",
    type: "Cá nhân hóa",
  },
  {
    name: "fb_pixel, ttq_*",
    provider: "Đối tác quảng cáo",
    purpose: "Đo lường hiệu quả chiến dịch tiếp thị — chỉ đặt khi bạn đồng ý và không dành cho hồ sơ trẻ em",
    duration: "Tối đa 3 tháng",
    type: "Quảng cáo",
  },
];

const SECTIONS = [
  {
    id: "cookie-la-gi",
    num: "01",
    title: "Cookie Là Gì & Hoạt Động Như Thế Nào",
    paragraphs: [
      "Cookie là các tệp văn bản nhỏ được lưu trên trình duyệt hoặc thiết bị của bạn khi truy cập website hoặc sử dụng ứng dụng Earthoria. Cookie giúp hệ thống \"ghi nhớ\" bạn giữa các lượt truy cập — ví dụ như giữ sản phẩm trong giỏ hàng hoặc ghi nhớ trạng thái đăng nhập.",
      "Chính sách này áp dụng cho cookie trình duyệt web, cũng như các công nghệ tương tự trên ứng dụng di động như local storage, SDK phân tích và mã định danh thiết bị, được mô tả chi tiết tại Mục 07.",
    ],
  },
  {
    id: "phan-loai",
    num: "02",
    title: "Các Loại Cookie Chúng Tôi Sử Dụng",
    paragraphs: [
      "Chúng tôi phân loại cookie theo mục đích sử dụng để bạn dễ dàng hiểu và kiểm soát. Bảng chi tiết dưới đây liệt kê các cookie cụ thể đang hoạt động trên hệ thống Earthoria.",
    ],
    list: [
      "Cookie cần thiết — bắt buộc để website và ứng dụng hoạt động cơ bản (giỏ hàng, đăng nhập, bảo mật); không thể tắt vì thiếu chúng dịch vụ sẽ không vận hành được",
      "Cookie phân tích — đo lường lượng truy cập và hành vi sử dụng ở dạng tổng hợp, ẩn danh, giúp chúng tôi cải thiện trải nghiệm sản phẩm",
      "Cookie cá nhân hóa — ghi nhớ tùy chọn của bạn như thể loại sách yêu thích, ngôn ngữ hiển thị, hoặc độ tuổi phù hợp để gợi ý nội dung",
      "Cookie quảng cáo/tiếp thị — đo lường hiệu quả chiến dịch quảng cáo; chỉ hoạt động khi bạn chủ động đồng ý và không bao giờ áp dụng cho tài khoản trẻ em",
    ],
    showTable: true,
  },
  {
    id: "ben-thu-ba",
    num: "03",
    title: "Cookie Của Bên Thứ Ba",
    paragraphs: [
      "Một số cookie trên website và ứng dụng của chúng tôi được đặt bởi các nhà cung cấp dịch vụ bên thứ ba mà Earthoria hợp tác. Chúng tôi lựa chọn các đối tác này dựa trên cam kết bảo mật dữ liệu tương đương với tiêu chuẩn của Earthoria.",
    ],
    list: [
      "Google Analytics — phân tích lưu lượng truy cập website ở dạng ẩn danh, đã bật tính năng ẩn địa chỉ IP (IP anonymization)",
      "Cổng thanh toán (VNPay, MoMo, ZaloPay) — cookie phiên giao dịch để xử lý thanh toán an toàn, không dùng cho mục đích tiếp thị",
      "Đối tác quảng cáo (Meta, TikTok, Google Ads) — chỉ được kích hoạt sau khi bạn đồng ý ở nhóm Cookie quảng cáo, và bị chặn hoàn toàn trên các phiên được xác định là trẻ em",
      "Earthoria không kiểm soát chính sách cookie riêng của các bên thứ ba này; bạn có thể tham khảo chính sách bảo mật của từng đối tác để biết thêm chi tiết",
    ],
  },
  {
    id: "muc-dich",
    num: "04",
    title: "Mục Đích Sử Dụng Cookie",
    paragraphs: [
      "Chúng tôi chỉ sử dụng cookie cho các mục đích cụ thể sau — không có mục đích thu thập dữ liệu nào nằm ngoài phạm vi được liệt kê trong Chính sách này.",
    ],
    list: [
      "Đảm bảo website và ứng dụng hoạt động ổn định, an toàn, chống gian lận và tấn công mạng",
      "Ghi nhớ giỏ hàng, trạng thái đăng nhập và hồ sơ trẻ đang chọn trong Bảng điều khiển gia đình",
      "Đo lường hiệu suất trang, phát hiện lỗi và cải thiện tốc độ tải trang",
      "Gợi ý nội dung sách và bài học phù hợp với độ tuổi, chỉ khi phụ huynh chủ động bật cá nhân hóa",
      "Đo lường hiệu quả các chiến dịch tiếp thị mà bạn nhìn thấy, chỉ khi bạn đã đồng ý nhóm cookie quảng cáo",
    ],
  },
  {
    id: "cookie-tre-em",
    num: "05",
    title: "Cookie & Quyền Riêng Tư Của Trẻ Em",
    paragraphs: [
      "Vì đối tượng phục vụ chính của Earthoria bao gồm trẻ em, chúng tôi áp dụng nguyên tắc thận trọng cao nhất đối với cookie trên các phiên sử dụng của trẻ.",
    ],
    callout: {
      title: "Nguyên tắc \"không quảng cáo, không theo dõi\" cho trẻ em",
      text: "Khi một hồ sơ trong Bảng điều khiển gia đình được đánh dấu là trẻ em, hệ thống tự động chặn toàn bộ cookie quảng cáo và giới hạn cookie phân tích ở mức tối thiểu cần thiết để vận hành ứng dụng. Dữ liệu từ các phiên này không bao giờ được dùng để xây dựng hồ sơ quảng cáo.",
    },
    list: [
      "Cookie cá nhân hóa cho hồ sơ trẻ em chỉ ghi nhớ độ tuổi và thể loại sách đã đọc, không thu thập vị trí, thiết bị liên kết hay hành vi ngoài ứng dụng",
      "Phụ huynh có thể xem và xóa toàn bộ dữ liệu cookie liên quan đến hồ sơ trẻ thông qua \"Bảng điều khiển gia đình\"",
      "Earthoria không cho phép bất kỳ đối tác quảng cáo nào đặt cookie theo dõi trên phiên được xác định là trẻ em dưới 13 tuổi",
    ],
  },
  {
    id: "thoi-gian-luu-tru",
    num: "06",
    title: "Thời Gian Lưu Trữ Cookie",
    paragraphs: [
      "Mỗi loại cookie có vòng đời khác nhau tùy theo mục đích sử dụng. Sau thời hạn này, cookie sẽ tự động hết hạn và bị xóa khỏi thiết bị của bạn.",
    ],
    showDataGrid: true,
  },
  {
    id: "cong-nghe-khac",
    num: "07",
    title: "Công Nghệ Theo Dõi Khác",
    paragraphs: [
      "Ngoài cookie trình duyệt truyền thống, Earthoria còn sử dụng một số công nghệ tương tự trên website và ứng dụng di động để đảm bảo trải nghiệm nhất quán.",
    ],
    list: [
      "Local Storage & Session Storage — lưu trữ tạm thời trên trình duyệt cho trạng thái ứng dụng, không đồng bộ giữa các thiết bị",
      "SDK phân tích trong ứng dụng di động — thu thập số liệu sử dụng ẩn danh (như tần suất mở ứng dụng, thời gian phiên) tương tự cookie phân tích trên web",
      "Mã định danh quảng cáo thiết bị (Advertising ID) — chỉ được truy cập khi bạn bật quyền quảng cáo cá nhân hóa trong cài đặt hệ điều hành; luôn bị vô hiệu hóa trên hồ sơ trẻ em",
      "Web beacon / pixel theo dõi trong email — dùng để biết email có được mở hay không; có thể tắt bằng cách chặn tải hình ảnh trong email hoặc hủy đăng ký nhận thư",
    ],
  },
  {
    id: "quan-ly-cookie",
    num: "08",
    title: "Cách Quản Lý & Tắt Cookie",
    paragraphs: [
      "Bạn có nhiều cách để kiểm soát cookie, tùy theo mức độ chi tiết bạn mong muốn. Lưu ý rằng việc tắt cookie cần thiết có thể khiến một số chức năng của website hoặc ứng dụng không hoạt động đúng.",
    ],
    list: [
      "Bảng điều khiển cookie của Earthoria — vào Cài đặt → Quyền riêng tư → Tùy chọn Cookie để bật/tắt từng nhóm (trừ nhóm Cần thiết)",
      "Cài đặt trình duyệt — hầu hết trình duyệt (Chrome, Safari, Firefox, Edge) cho phép chặn hoặc xóa cookie theo từng trang web trong phần Cài đặt quyền riêng tư",
      "Cài đặt quảng cáo cá nhân hóa trên thiết bị di động — tắt \"Cho phép theo dõi\" (iOS) hoặc \"Tắt cá nhân hóa quảng cáo\" (Android) trong cài đặt hệ điều hành",
      "Tín hiệu Do Not Track / Global Privacy Control — Earthoria tôn trọng các tín hiệu này khi trình duyệt của bạn gửi kèm yêu cầu truy cập",
    ],
  },
  {
    id: "ung-dung-di-dong",
    num: "09",
    title: "Cookie Trên Ứng Dụng Di Động & Trải Nghiệm AR",
    paragraphs: [
      "Ứng dụng di động Earthoria sử dụng các công nghệ tương đương cookie để vận hành tính năng AR và Trợ lý AI, nhưng với một số giới hạn bổ sung quan trọng.",
    ],
    list: [
      "Dữ liệu camera dùng cho nhận diện trang sách AR được xử lý hoàn toàn trên thiết bị (on-device) và không liên kết với bất kỳ cookie hay mã định danh quảng cáo nào",
      "Đoạn ghi âm tạm thời cho Trợ lý AI không được gắn với cookie theo dõi hành vi và tuân theo thời hạn lưu trữ riêng tại Chính sách Bảo mật (tối đa 24 giờ)",
      "Cookie/local storage trong ứng dụng chỉ phục vụ mục đích kỹ thuật như đồng bộ tiến độ đọc sách và cài đặt hiển thị",
    ],
  },
  {
    id: "thay-doi-chinh-sach",
    num: "10",
    title: "Thay Đổi Chính Sách Cookie Này",
    paragraphs: [
      "Chúng tôi có thể cập nhật Chính sách Cookie theo thời gian để phản ánh thay đổi về công nghệ, đối tác hoặc quy định pháp luật.",
    ],
    list: [
      "Mọi thay đổi bổ sung nhóm cookie mới (đặc biệt là cookie quảng cáo) sẽ yêu cầu bạn xác nhận đồng ý lại thông qua bảng điều khiển cookie",
      "Phiên bản mới nhất luôn được đăng công khai tại trang này kèm theo ngày cập nhật rõ ràng",
    ],
  },
  {
    id: "lien-he",
    num: "11",
    title: "Liên Hệ Về Cookie & Quyền Riêng Tư",
    paragraphs: [
      "Nếu bạn có câu hỏi về cách Earthoria sử dụng cookie hoặc muốn được hỗ trợ điều chỉnh tùy chọn, Bộ phận Bảo vệ Dữ liệu (DPO) luôn sẵn sàng qua các kênh liên hệ được liệt kê ở cuối trang.",
    ],
  },
];

const FAQS = [
  {
    q: "Nếu tôi tắt hết cookie, tôi có còn mua sắm được không?",
    a: "Bạn vẫn có thể duyệt và mua hàng bình thường vì cookie Cần thiết luôn được bật để đảm bảo giỏ hàng và thanh toán hoạt động. Tuy nhiên, tắt cookie Cá nhân hóa có thể khiến các gợi ý sách không còn phù hợp với sở thích của bạn.",
  },
  {
    q: "Làm sao để biết một cookie có đang theo dõi hồ sơ trẻ em của tôi không?",
    a: 'Vào "Bảng điều khiển gia đình" → chọn hồ sơ trẻ → mục "Dữ liệu & Cookie" để xem chính xác những cookie đang hoạt động trên hồ sơ đó. Theo mặc định, mọi cookie quảng cáo đều bị chặn trên hồ sơ trẻ em.',
  },
  {
    q: "Tôi đã đồng ý cookie quảng cáo rồi, giờ muốn đổi ý thì sao?",
    a: 'Bạn có thể rút lại sự đồng ý bất cứ lúc nào tại Cài đặt → Quyền riêng tư → Tùy chọn Cookie. Cookie quảng cáo hiện có sẽ hết hạn tự nhiên hoặc bị xóa trong vòng 24 giờ sau khi bạn tắt.',
  },
  {
    q: "Cookie phân tích có thu thập tên hoặc email của tôi không?",
    a: "Không. Cookie phân tích chỉ ghi nhận hành vi sử dụng ở dạng số liệu tổng hợp và ẩn danh (như số trang đã xem), không gắn với tên, email hay thông tin định danh cá nhân khác.",
  },
  {
    q: "Tôi dùng nhiều thiết bị — tùy chọn cookie có đồng bộ không?",
    a: "Tùy chọn cookie được lưu theo từng trình duyệt và thiết bị riêng biệt. Nếu bạn đăng nhập tài khoản trên thiết bị mới, bạn sẽ được hỏi lại về tùy chọn cookie cho thiết bị đó.",
  },
];

/* ───────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function CookiePolicy() {
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

  const typeToClass = (type) => {
    switch (type) {
      case "Cần thiết": return "necessary";
      case "Phân tích": return "analytics";
      case "Cá nhân hóa": return "personalization";
      case "Quảng cáo": return "marketing";
      default: return "necessary";
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

        /* ══════════════ COOKIE TABLE ══════════════ */
        .legal-cookie-table-wrap {
          margin: 24px 0; border: 0.5px solid var(--border);
          overflow-x: auto;
        }
        .legal-cookie-table {
          width: 100%; border-collapse: collapse; min-width: 640px;
        }
        .legal-cookie-table thead th {
          text-align: left; font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--gold); background: var(--parchment);
          padding: 13px 16px; border-bottom: 0.5px solid var(--border);
          font-weight: 500;
        }
        .legal-cookie-table tbody td {
          padding: 14px 16px; font-size: 12.5px; color: var(--text-muted);
          font-weight: 300; line-height: 1.6;
          border-bottom: 0.5px solid var(--border); vertical-align: top;
        }
        .legal-cookie-table tbody tr:last-child td { border-bottom: none; }
        .legal-cookie-table tbody tr:hover { background: rgba(74,158,63,0.03); }
        .legal-cookie-table td.mono {
          font-family: 'Be Vietnam Pro', sans-serif; color: var(--forest);
          font-weight: 500; white-space: nowrap;
        }
        .legal-cookie-badge {
          display: inline-flex; align-items: center; padding: 3px 10px;
          font-size: 10px; letter-spacing: 0.04em; white-space: nowrap;
          font-family: 'Be Vietnam Pro', sans-serif; font-weight: 500;
        }
        .legal-cookie-badge.necessary { background: var(--gold-pale); color: var(--gold); }
        .legal-cookie-badge.analytics { background: rgba(45,122,110,0.12); color: #1a5c52; }
        .legal-cookie-badge.personalization { background: rgba(74,158,63,0.12); color: #2d5c1a; }
        .legal-cookie-badge.marketing { background: rgba(180,90,50,0.12); color: #a8522b; }

        /* ══════════════ DATA GRID (retention) ══════════════ */
        .legal-data-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: var(--border);
          border: 0.5px solid var(--border); margin: 24px 0;
        }
        .legal-data-cell {
          background: var(--ivory); padding: 18px 20px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .legal-data-cell-label {
          font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--gold); font-family: 'Be Vietnam Pro', sans-serif;
        }
        .legal-data-cell-val {
          font-size: 13px; color: var(--forest); font-weight: 400;
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
        body.dark-mode .legal-cookie-table-wrap { border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-cookie-table thead th { background: #1c2822; }
        body.dark-mode .legal-cookie-table tbody td { border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-cookie-table td.mono { color: #c8d4cc; }
        body.dark-mode .legal-data-grid { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-data-cell { background: #161e1a; }
        body.dark-mode .legal-data-cell-val { color: #c8d4cc; }
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
          .legal-data-grid { grid-template-columns: 1fr; }
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
        <span className="breadcrumb-current">Chính sách Cookie</span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="legal-hero">
        <div className="legal-hero-grid" />
        <div className="legal-hero-glow" />
        <div className="legal-hero-watermark">EARTHORIA</div>
        <div className="legal-hero-inner">
          <div className="legal-hero-icon">
            <Cookie size={22} />
          </div>
          <div className="legal-hero-eyebrow">
            <span className="legal-hero-eyebrow-line" />
            <span>Pháp Lý &amp; Quyền Riêng Tư</span>
            <span className="legal-hero-eyebrow-line" />
          </div>
          <h1 className="legal-hero-title">
            Chính Sách —<br />
            <em>Cookie</em>
          </h1>
          <p className="legal-hero-sub">
            Cookie giúp Earthoria vận hành mượt mà và cá nhân hóa trải nghiệm
            đọc sách của gia đình bạn — đây là toàn bộ những gì chúng tôi sử
            dụng, vì sao, trong bao lâu, và cách bạn kiểm soát chúng.
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
              Bắt đầu đọc <ChevronDown size={14} />
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
              <div className="legal-sidebar-card-title">Tùy chọn Cookie</div>
              <p>Điều chỉnh nhóm cookie bạn cho phép trực tiếp trong tài khoản của bạn.</p>
              <a href="mailto:helpdesk.earthoria@gmail.com" className="legal-sidebar-card-link">
                helpdesk.earthoria@gmail.com
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
                    <div className="legal-callout-icon"><ShieldCheck size={17} /></div>
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

                {s.showTable && (
                  <div className="legal-cookie-table-wrap">
                    <table className="legal-cookie-table">
                      <thead>
                        <tr>
                          <th>Tên cookie</th>
                          <th>Nhà cung cấp</th>
                          <th>Mục đích</th>
                          <th>Thời hạn</th>
                          <th>Loại</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COOKIE_TABLE.map((c, i) => (
                          <tr key={i}>
                            <td className="mono">{c.name}</td>
                            <td>{c.provider}</td>
                            <td>{c.purpose}</td>
                            <td>{c.duration}</td>
                            <td>
                              <span className={`legal-cookie-badge ${typeToClass(c.type)}`}>
                                {c.type}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {s.showDataGrid && (
                  <div className="legal-data-grid">
                    <div className="legal-data-cell">
                      <span className="legal-data-cell-label">
                        <Database size={11} style={{ marginRight: 5, verticalAlign: -1 }} />
                        Cookie cần thiết
                      </span>
                      <span className="legal-data-cell-val">Phiên làm việc đến 12 tháng</span>
                    </div>
                    <div className="legal-data-cell">
                      <span className="legal-data-cell-label">
                        <BarChart3 size={11} style={{ marginRight: 5, verticalAlign: -1 }} />
                        Cookie phân tích
                      </span>
                      <span className="legal-data-cell-val">Tối đa 13 tháng</span>
                    </div>
                    <div className="legal-data-cell">
                      <span className="legal-data-cell-label">
                        <Settings2 size={11} style={{ marginRight: 5, verticalAlign: -1 }} />
                        Cookie cá nhân hóa
                      </span>
                      <span className="legal-data-cell-val">Tối đa 6 tháng</span>
                    </div>
                    <div className="legal-data-cell">
                      <span className="legal-data-cell-label">
                        <Megaphone size={11} style={{ marginRight: 5, verticalAlign: -1 }} />
                        Cookie quảng cáo
                      </span>
                      <span className="legal-data-cell-val">Tối đa 3 tháng</span>
                    </div>
                  </div>
                )}

                {s.id === "cookie-tre-em" && (
                  <div className="legal-callout" style={{ marginTop: 0 }}>
                    <div className="legal-callout-icon"><AlertTriangle size={17} /></div>
                    <div>
                      <div className="legal-callout-title">Phát hiện sai sót?</div>
                      <p>
                        Nếu bạn phát hiện cookie quảng cáo xuất hiện trên hồ sơ
                        được đánh dấu trẻ em, vui lòng báo ngay cho Bộ phận
                        Bảo vệ Dữ liệu để được xử lý và khắc phục trong vòng
                        24 giờ.
                      </p>
                    </div>
                  </div>
                )}

                {s.id === "ung-dung-di-dong" && (
                  <div className="legal-callout" style={{ marginTop: 0 }}>
                    <div className="legal-callout-icon"><Smartphone size={17} /></div>
                    <div>
                      <div className="legal-callout-title">Tách biệt hoàn toàn với dữ liệu AR</div>
                      <p>
                        Trải nghiệm AR và Trợ lý AI được thiết kế để không phụ
                        thuộc vào cookie theo dõi hành vi hay quảng cáo, dù
                        bạn có bật hay tắt các nhóm cookie khác.
                      </p>
                    </div>
                  </div>
                )}

                {s.id === "ben-thu-ba" && (
                  <div className="legal-callout" style={{ marginTop: 0 }}>
                    <div className="legal-callout-icon"><Globe2 size={17} /></div>
                    <div>
                      <div className="legal-callout-title">Hợp đồng bảo mật với đối tác</div>
                      <p>
                        Mọi bên thứ ba đặt cookie trên hệ thống Earthoria đều
                        ký hợp đồng xử lý dữ liệu (Data Processing Agreement)
                        cam kết không sử dụng dữ liệu ngoài phạm vi được ủy
                        quyền.
                      </p>
                    </div>
                  </div>
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
          <span className="legal-contact-eyebrow reveal">Vẫn còn thắc mắc?</span>
          <h2 className="legal-contact-title reveal">
            Bộ phận Bảo vệ Dữ liệu
            <br />
            <em>luôn sẵn sàng lắng nghe</em>
          </h2>
          <div className="legal-contact-grid reveal">
            <a href="mailto:helpdesk.earthoria@gmail.com" className="legal-contact-item">
              <Mail size={15} />helpdesk.earthoria@gmail.com
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
    </>
  );
}