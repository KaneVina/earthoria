import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Eye,
  KeyRound,
  ChevronDown,
  Search,
  Printer,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  FileText,
  ArrowUp,
  Link2,
  Check,
  Users,
  ShieldAlert,
  Database,
  Cookie,
  Globe2,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   META & CONTENT DATA
───────────────────────────────────────────────────────────── */
const META = {
  effectiveDate: "01 Tháng 01, 2026",
  updatedDate: "15 Tháng 06, 2026",
  version: "v2.4",
  readTime: "16 phút",
};

const SUMMARY_CARDS = [
  {
    icon: Lock,
    title: "Không bao giờ bán dữ liệu",
    desc: "Thông tin của bạn không được bán cho bất kỳ bên thứ ba nào, không có ngoại lệ.",
  },
  {
    icon: ShieldCheck,
    title: "Trẻ em là ưu tiên hàng đầu",
    desc: "Dữ liệu giọng nói của trẻ không được lưu trữ vĩnh viễn hay dùng để quảng cáo.",
  },
  {
    icon: Eye,
    title: "Minh bạch tuyệt đối",
    desc: "Bạn có thể xem, tải xuống hoặc xóa dữ liệu cá nhân của mình bất cứ lúc nào.",
  },
  {
    icon: KeyRound,
    title: "Mã hóa toàn diện",
    desc: "Mọi giao dịch thanh toán được mã hóa theo chuẩn bảo mật PCI-DSS.",
  },
];

const SECTIONS = [
  {
    id: "tong-quan",
    num: "01",
    title: "Tổng Quan & Cam Kết Của Chúng Tôi",
    paragraphs: [
      "Chính sách Bảo mật này mô tả cách Công ty TNHH Earthoria Việt Nam (\"Earthoria\", \"chúng tôi\") thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân khi bạn sử dụng website, ứng dụng di động và các sản phẩm liên quan của chúng tôi.",
      "Vì đối tượng phục vụ chính của Earthoria bao gồm trẻ em, chúng tôi áp dụng các tiêu chuẩn bảo mật nghiêm ngặt hơn mức yêu cầu pháp lý tối thiểu, đặt sự an toàn của trẻ làm trọng tâm trong mọi quyết định liên quan đến dữ liệu.",
    ],
  },
  {
    id: "thu-thap",
    num: "02",
    title: "Thông Tin Chúng Tôi Thu Thập",
    paragraphs: [
      "Chúng tôi chỉ thu thập những thông tin thực sự cần thiết để vận hành dịch vụ và mang lại trải nghiệm tốt nhất cho gia đình bạn.",
    ],
    list: [
      "Thông tin tài khoản — họ tên, email, số điện thoại và địa chỉ giao hàng của phụ huynh hoặc người mua",
      "Thông tin giao dịch — lịch sử đơn hàng và phương thức thanh toán; Earthoria không lưu trữ số thẻ đầy đủ của bạn",
      "Dữ liệu thiết bị & AR — loại thiết bị, hệ điều hành; hình ảnh camera được xử lý ngay trên thiết bị (on-device) để nhận diện trang sách và không được tải lên máy chủ",
      "Dữ liệu giọng nói AI — đoạn ghi âm tạm thời để Trợ lý AI phản hồi, được tự động xóa trong vòng 24 giờ trừ khi phụ huynh chủ động chọn lưu lại để cá nhân hóa trải nghiệm",
      "Dữ liệu sử dụng — trang đã xem, thời gian tương tác và cookie (xem chi tiết tại Mục 07)",
    ],
  },
  {
    id: "cach-su-dung",
    num: "03",
    title: "Cách Chúng Tôi Sử Dụng Thông Tin",
    paragraphs: [
      "Thông tin được thu thập chỉ phục vụ cho các mục đích cụ thể, minh bạch sau đây — không có mục đích nào nằm ngoài những gì được liệt kê dưới đây.",
    ],
    list: [
      "Xử lý đơn hàng, thanh toán và giao hàng đến đúng địa chỉ của bạn",
      "Cá nhân hóa nội dung học tập theo độ tuổi và sở thích của trẻ, chỉ khi phụ huynh chủ động bật tính năng này",
      "Cải thiện độ chính xác của Trợ lý AI và mô hình nhận diện AR theo thời gian",
      "Gửi thông báo về đơn hàng và các ưu đãi — bạn có thể hủy đăng ký nhận thông báo bất cứ lúc nào",
      "Tuân thủ nghĩa vụ pháp lý và thực hiện các biện pháp phòng chống gian lận",
    ],
  },
  {
    id: "quyen-rieng-tu-tre-em",
    num: "04",
    title: "Quyền Riêng Tư Của Trẻ Em",
    paragraphs: [
      "Đây là mục quan trọng nhất trong Chính sách này. Earthoria được xây dựng dành cho trẻ em, vì vậy chúng tôi cam kết áp dụng các biện pháp bảo vệ cao hơn hẳn mức tối thiểu theo quy định.",
    ],
    callout: {
      title: "Cam kết với phụ huynh",
      text: "Earthoria không cố ý thu thập thông tin cá nhân từ trẻ em dưới 13 tuổi khi chưa có sự đồng ý có thể xác minh của phụ huynh. Mọi tài khoản trẻ em đều được tạo lập và quản lý hoàn toàn thông qua tài khoản của phụ huynh.",
    },
    list: [
      "Phụ huynh có toàn quyền xem, chỉnh sửa hoặc xóa dữ liệu của con mình thông qua mục \"Bảng điều khiển gia đình\"",
      "Earthoria không hiển thị quảng cáo nhắm mục tiêu (targeted ads) cho bất kỳ người dùng nào được xác định là trẻ em",
      "Dữ liệu giọng nói của trẻ không bao giờ được sử dụng cho mục đích quảng cáo dưới bất kỳ hình thức nào",
      "Nếu phát hiện đã thu thập nhầm thông tin trẻ em ngoài quy trình đồng ý của phụ huynh, chúng tôi sẽ xóa dữ liệu ngay khi nhận được thông báo",
    ],
  },
  {
    id: "chia-se",
    num: "05",
    title: "Chia Sẻ Thông Tin Với Bên Thứ Ba",
    paragraphs: [
      "Earthoria không bán thông tin cá nhân của bạn dưới bất kỳ hình thức nào. Chúng tôi chỉ chia sẻ dữ liệu trong những trường hợp cần thiết, có kiểm soát chặt chẽ sau đây.",
    ],
    list: [
      "Đối tác vận chuyển — chỉ nhận thông tin tối thiểu cần thiết để giao hàng đến đúng địa chỉ",
      "Cổng thanh toán đạt chuẩn PCI-DSS — không bao giờ bao gồm dữ liệu liên quan đến trẻ em",
      "Nhà cung cấp hạ tầng xử lý giọng nói AI — theo hợp đồng bảo mật nghiêm ngặt, dữ liệu luôn được ẩn danh hóa trước khi xử lý",
      "Cơ quan nhà nước có thẩm quyền — chỉ khi có yêu cầu hợp pháp theo đúng quy định của pháp luật hiện hành",
    ],
  },
  {
    id: "bao-mat",
    num: "06",
    title: "Bảo Mật Dữ Liệu",
    paragraphs: [
      "Chúng tôi áp dụng nhiều lớp bảo vệ kỹ thuật và quy trình để đảm bảo dữ liệu của bạn luôn được an toàn trước truy cập trái phép.",
    ],
    list: [
      "Mã hóa TLS 1.3 cho toàn bộ dữ liệu truyền tải giữa thiết bị của bạn và máy chủ Earthoria",
      "Mã hóa AES-256 cho dữ liệu nhạy cảm được lưu trữ trong hệ thống",
      "Kiểm tra bảo mật định kỳ được thực hiện bởi đơn vị kiểm toán độc lập bên thứ ba",
      "Phân quyền truy cập nội bộ nghiêm ngặt theo nguyên tắc \"cần biết mới được biết\"",
    ],
  },
  {
    id: "cookie",
    num: "07",
    title: "Cookie & Công Nghệ Theo Dõi",
    paragraphs: [
      "Chúng tôi sử dụng cookie và các công nghệ tương tự để website và ứng dụng hoạt động trơn tru, đồng thời giúp bạn có toàn quyền kiểm soát những gì được theo dõi.",
    ],
    list: [
      "Cookie cần thiết — phục vụ giỏ hàng, đăng nhập; luôn được bật để đảm bảo dịch vụ hoạt động bình thường",
      "Cookie phân tích — giúp chúng tôi hiểu cách cải thiện trải nghiệm; có thể tắt trong phần Cài đặt quyền riêng tư",
      "Cookie cá nhân hóa nội dung — đề xuất sách phù hợp; có thể tắt bất cứ lúc nào mà không ảnh hưởng đến chức năng mua hàng",
    ],
  },
  {
    id: "luu-tru",
    num: "08",
    title: "Thời Gian Lưu Trữ Dữ Liệu",
    paragraphs: [
      "Chúng tôi chỉ lưu trữ dữ liệu trong khoảng thời gian thực sự cần thiết cho từng mục đích cụ thể, sau đó dữ liệu sẽ được xóa hoặc ẩn danh hóa hoàn toàn.",
    ],
    list: [
      "Dữ liệu tài khoản — được lưu trữ cho đến khi bạn chủ động yêu cầu xóa",
      "Dữ liệu giao dịch — lưu trữ 10 năm theo quy định pháp luật về kế toán và thuế",
      "Dữ liệu giọng nói AI tạm thời — tối đa 24 giờ, trừ khi được phụ huynh chủ động lưu lại",
      "Cookie phân tích — tối đa 13 tháng kể từ lần thu thập gần nhất",
    ],
  },
  {
    id: "chuyen-giao-quoc-te",
    num: "09",
    title: "Chuyển Giao Dữ Liệu Quốc Tế",
    paragraphs: [
      "Một số nhà cung cấp hạ tầng kỹ thuật của chúng tôi đặt máy chủ ngoài lãnh thổ Việt Nam. Trong những trường hợp này, Earthoria luôn đảm bảo các biện pháp bảo vệ tương đương thông qua hợp đồng chuyển giao dữ liệu theo chuẩn quốc tế (Standard Contractual Clauses).",
    ],
  },
  {
    id: "quyen-cua-ban",
    num: "10",
    title: "Quyền Của Bạn",
    paragraphs: [
      "Bạn luôn có toàn quyền kiểm soát thông tin cá nhân của mình. Dưới đây là các quyền cụ thể mà bạn có thể thực hiện bất cứ lúc nào.",
    ],
    list: [
      "Quyền truy cập — yêu cầu một bản sao đầy đủ dữ liệu mà chúng tôi đang lưu trữ về bạn",
      "Quyền chỉnh sửa — cập nhật mọi thông tin không chính xác hoặc đã lỗi thời",
      "Quyền xóa — yêu cầu xóa toàn bộ dữ liệu tài khoản khỏi hệ thống của chúng tôi",
      "Quyền phản đối — từ chối việc xử lý dữ liệu cho mục đích tiếp thị bất cứ lúc nào",
      "Quyền khiếu nại — gửi khiếu nại đến cơ quan bảo vệ dữ liệu có thẩm quyền nếu bạn cho rằng quyền của mình bị vi phạm",
    ],
  },
  {
    id: "thay-doi-chinh-sach",
    num: "11",
    title: "Thay Đổi Chính Sách Này",
    paragraphs: [
      "Chúng tôi có thể cập nhật Chính sách Bảo mật này theo thời gian để phản ánh thay đổi pháp lý hoặc cải tiến trong cách chúng tôi bảo vệ dữ liệu của bạn.",
    ],
    list: [
      "Mọi thay đổi quan trọng ảnh hưởng đến quyền lợi của bạn sẽ được thông báo qua email ít nhất 14 ngày trước khi có hiệu lực",
      "Phiên bản mới nhất luôn được đăng tải công khai tại trang này kèm theo ngày cập nhật rõ ràng",
    ],
  },
  {
    id: "lien-he",
    num: "12",
    title: "Liên Hệ & Bộ Phận Bảo Vệ Dữ Liệu",
    paragraphs: [
      "Nếu bạn có bất kỳ câu hỏi nào về cách chúng tôi xử lý dữ liệu cá nhân, Bộ phận Bảo vệ Dữ liệu (DPO) của Earthoria luôn sẵn sàng hỗ trợ qua các kênh liên hệ được liệt kê ở cuối trang.",
    ],
  },
];

const FAQS = [
  {
    q: "App AR có luôn lắng nghe giọng nói của con tôi không?",
    a: "Không. Trợ lý AI chỉ kích hoạt ghi âm khi bạn hoặc con bạn chủ động nhấn giữ nút trò chuyện. Đoạn ghi âm được xử lý để phản hồi rồi tự động xóa trong vòng 24 giờ.",
  },
  {
    q: "Làm sao tôi xóa dữ liệu tài khoản của con mình?",
    a: 'Vào "Bảng điều khiển gia đình" trong ứng dụng, chọn Cài đặt → Quyền riêng tư → Xóa dữ liệu, hoặc gửi yêu cầu trực tiếp đến địa chỉ legal@earthoria.vn để được hỗ trợ.',
  },
  {
    q: "Earthoria có chia sẻ dữ liệu camera không?",
    a: "Không. Toàn bộ dữ liệu camera được xử lý hoàn toàn trên thiết bị của bạn (on-device) để nhận diện trang sách và không bao giờ được tải lên máy chủ của chúng tôi.",
  },
  {
    q: "Tôi có thể tải xuống dữ liệu cá nhân của mình không?",
    a: 'Có. Bạn có thể yêu cầu xuất toàn bộ dữ liệu cá nhân định dạng có thể đọc được thông qua mục "Quyền riêng tư" trong tài khoản, hoặc liên hệ trực tiếp với chúng tôi.',
  },
  {
    q: "Dữ liệu thanh toán của tôi được lưu trữ ở đâu?",
    a: "Dữ liệu thanh toán được xử lý hoàn toàn bởi cổng thanh toán đối tác đạt chuẩn bảo mật PCI-DSS. Earthoria không lưu trữ số thẻ đầy đủ của bạn trên hệ thống của mình.",
  },
];

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function PrivacyPolicy() {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [tocQuery, setTocQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [showTop, setShowTop] = useState(false);
  const sidebarScrollRef = useRef(null);

  /* scroll progress + back-to-top visibility (rAF-throttled to avoid
     excessive re-renders, which can cause sticky-element paint glitches) */
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

  /* scrollspy for sidebar TOC */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "-130px 0px -65% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

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

  /* keep the active TOC item visible inside the (now independently
     scrollable) sidebar panel as scrollspy updates activeId */
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
        .legal-btn-main {
          background: var(--gold); color: var(--ink);
        }
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
          background: var(--cream);
          padding: 64px 100px;
          border-bottom: 0.5px solid var(--border);
        }
        .legal-summary-inner {
          max-width: 1400px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .legal-summary-card {
          background: var(--white);
          border: 0.5px solid var(--border);
          padding: 28px 26px;
          transition: all 0.4s ease;
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
          font-size: 17px; font-weight: 400; color: var(--forest);
          margin-bottom: 8px;
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

        /* ══════════════ CONTENT ══════════════ */
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
          font-size: 14px; color: var(--gold); letter-spacing: 0.06em;
          flex-shrink: 0;
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

        /* ══════════════ DATA TABLE-LIKE GRID (privacy specific) ══════════════ */
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
        body.dark-mode .legal-data-grid { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-data-cell { background: #161e1a; }
        body.dark-mode .legal-data-cell-val { color: #c8d4cc; }
        body.dark-mode .legal-faq-section { background: #161e1a; }
        body.dark-mode .legal-faq-item { border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-faq-question { color: #c8d4cc; }

        /* ══════════════ RESPONSIVE ══════════════ */
        @media (max-width: 1100px) {
          .legal-hero { padding: 150px 40px 80px; }
          .legal-summary, .legal-layout, .legal-faq-section, .legal-contact-section {
            padding-left: 40px; padding-right: 40px;
          }
        }
        @media (max-width: 900px) {
          .legal-summary-inner { grid-template-columns: repeat(2, 1fr); }
          .legal-layout { grid-template-columns: 1fr; gap: 40px; }
          .legal-sidebar-sticky { position: relative; top: auto; max-height: none; overflow: visible; }
          .legal-hero-meta { gap: 8px; }
          .legal-data-grid { grid-template-columns: 1fr; }
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
        <span className="breadcrumb-current">Chính sách bảo mật</span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="legal-hero">
        <div className="legal-hero-grid" />
        <div className="legal-hero-glow" />
        <div className="legal-hero-watermark">EARTHORIA</div>
        <div className="legal-hero-inner">
          <div className="legal-hero-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="legal-hero-eyebrow">
            <span className="legal-hero-eyebrow-line" />
            <span>Pháp Lý &amp; Quyền Riêng Tư</span>
            <span className="legal-hero-eyebrow-line" />
          </div>
          <h1 className="legal-hero-title">
            Chính Sách —<br />
            <em>Bảo Mật</em>
          </h1>
          <p className="legal-hero-sub">
            Sự tin tưởng của gia đình bạn là nền tảng của Earthoria — đây là
            cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn,
            giải thích rõ ràng, không thuật ngữ rối rắm.
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
              Bắt đầu đọc
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
              <div className="legal-sidebar-card-title">Bộ phận Bảo vệ Dữ liệu</div>
              <p>
                Có câu hỏi về cách dữ liệu của bạn được xử lý? Liên hệ trực
                tiếp với DPO của chúng tôi.
              </p>
              <a href="mailto:legal@earthoria.vn" className="legal-sidebar-card-link">
                legal@earthoria.vn
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
                {s.paragraphs?.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {s.callout && (
                  <div className="legal-callout">
                    <div className="legal-callout-icon">
                      <ShieldAlert size={17} />
                    </div>
                    <div>
                      <div className="legal-callout-title">{s.callout.title}</div>
                      <p>{s.callout.text}</p>
                    </div>
                  </div>
                )}
                {s.id === "luu-tru" && (
                  <div className="legal-data-grid">
                    <div className="legal-data-cell">
                      <span className="legal-data-cell-label">
                        <Database size={11} style={{ marginRight: 5, verticalAlign: -1 }} />
                        Dữ liệu tài khoản
                      </span>
                      <span className="legal-data-cell-val">Đến khi bạn yêu cầu xóa</span>
                    </div>
                    <div className="legal-data-cell">
                      <span className="legal-data-cell-label">
                        <FileText size={11} style={{ marginRight: 5, verticalAlign: -1 }} />
                        Dữ liệu giao dịch
                      </span>
                      <span className="legal-data-cell-val">10 năm (quy định kế toán)</span>
                    </div>
                    <div className="legal-data-cell">
                      <span className="legal-data-cell-label">
                        <Clock size={11} style={{ marginRight: 5, verticalAlign: -1 }} />
                        Dữ liệu giọng nói AI
                      </span>
                      <span className="legal-data-cell-val">Tối đa 24 giờ</span>
                    </div>
                    <div className="legal-data-cell">
                      <span className="legal-data-cell-label">
                        <Cookie size={11} style={{ marginRight: 5, verticalAlign: -1 }} />
                        Cookie phân tích
                      </span>
                      <span className="legal-data-cell-val">Tối đa 13 tháng</span>
                    </div>
                  </div>
                )}
                {s.id === "chuyen-giao-quoc-te" && (
                  <div className="legal-callout" style={{ marginTop: 0 }}>
                    <div className="legal-callout-icon">
                      <Globe2 size={17} />
                    </div>
                    <div>
                      <div className="legal-callout-title">Tiêu chuẩn bảo vệ tương đương</div>
                      <p>
                        Dù dữ liệu được xử lý ở đâu, mức độ bảo vệ áp dụng cho
                        bạn luôn tương đương với những gì được cam kết trong
                        Chính sách này.
                      </p>
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
          <span className="legal-contact-eyebrow reveal">Vẫn còn thắc mắc?</span>
          <h2 className="legal-contact-title reveal">
            Bộ phận Bảo vệ Dữ liệu
            <br />
            <em>luôn sẵn sàng lắng nghe</em>
          </h2>
          <div className="legal-contact-grid reveal">
            <a href="mailto:legal@earthoria.vn" className="legal-contact-item">
              <Mail size={15} />
              legal@earthoria.vn
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