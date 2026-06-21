import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Scale,
  ShieldCheck,
  Package,
  XCircle,
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
  BookOpen,
  AlertTriangle,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   META & CONTENT DATA
───────────────────────────────────────────────────────────── */
const META = {
  effectiveDate: "01 Tháng 01, 2026",
  updatedDate: "15 Tháng 06, 2026",
  version: "v3.2",
  readTime: "14 phút",
};

const SUMMARY_CARDS = [
  {
    icon: Package,
    title: "Đổi trả linh hoạt",
    desc: "30 ngày hoàn tiền không cần lý do nếu sách chưa qua sử dụng.",
  },
  {
    icon: ShieldCheck,
    title: "Trẻ em được ưu tiên",
    desc: "Ứng dụng AR/AI yêu cầu giám sát của phụ huynh cho trẻ dưới 13 tuổi.",
  },
  {
    icon: BookOpen,
    title: "Nội dung minh bạch",
    desc: "Bản quyền sách thuộc Earthoria — được dùng tự do cho mục đích cá nhân & giáo dục phi thương mại.",
  },
  {
    icon: XCircle,
    title: "Hủy bất cứ lúc nào",
    desc: "Đóng tài khoản miễn phí, không ràng buộc, không phí ẩn.",
  },
];

const SECTIONS = [
  {
    id: "gioi-thieu",
    num: "01",
    title: "Giới Thiệu & Chấp Nhận Điều Khoản",
    paragraphs: [
      'Chào mừng bạn đến với Earthoria — nền tảng sách giáo dục kết hợp công nghệ Thực tế tăng cường (AR) và Trí tuệ nhân tạo (AI), được vận hành bởi Công ty TNHH Earthoria Việt Nam ("Earthoria", "chúng tôi"). Bằng việc truy cập website, ứng dụng di động, hoặc đặt mua bất kỳ sản phẩm nào của Earthoria, bạn — hoặc phụ huynh/người giám hộ hợp pháp của bạn nếu bạn dưới 18 tuổi — xác nhận đã đọc, hiểu và đồng ý bị ràng buộc bởi các Điều khoản Dịch vụ này.',
      "Nếu bạn không đồng ý với bất kỳ điều khoản nào dưới đây, vui lòng ngừng sử dụng dịch vụ của chúng tôi. Việc tiếp tục sử dụng sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp nhận các thay đổi đó.",
    ],
    list: [
      "Áp dụng cho website earthoria.vn và toàn bộ các trang con liên quan",
      "Áp dụng cho ứng dụng di động Earthoria AR trên nền tảng iOS và Android",
      "Áp dụng cho mọi giao dịch mua hàng, dù thực hiện trực tuyến hay tại các điểm bán đối tác chính hãng",
    ],
  },
  {
    id: "dinh-nghia",
    num: "02",
    title: "Định Nghĩa Thuật Ngữ",
    paragraphs: [
      "Để thuận tiện cho việc đọc hiểu, các thuật ngữ viết hoa sau đây được sử dụng xuyên suốt văn bản với ý nghĩa thống nhất như dưới đây.",
    ],
    list: [
      '"Người dùng" — bất kỳ cá nhân nào truy cập hoặc sử dụng Dịch vụ của Earthoria',
      '"Nội dung AR" — mô hình 3D, hoạt ảnh và âm thanh được kích hoạt khi quét trang sách bằng ứng dụng',
      '"Trợ lý AI" — hệ thống hội thoại bằng giọng nói được tích hợp trong ứng dụng Earthoria',
      '"Phụ huynh/Người giám hộ" — người chịu trách nhiệm pháp lý đối với Người dùng chưa đủ 18 tuổi',
    ],
  },
  {
    id: "tai-khoan",
    num: "03",
    title: "Tài Khoản & Điều Kiện Sử Dụng",
    paragraphs: [
      "Để mua hàng hoặc sử dụng đầy đủ tính năng AR/AI, bạn cần tạo một tài khoản Earthoria với thông tin chính xác, đầy đủ và được cập nhật thường xuyên. Tài khoản gắn liền với một gia đình hoặc cá nhân cụ thể và không được chia sẻ cho mục đích thương mại.",
    ],
    callout: {
      title: "Người dùng dưới 13 tuổi",
      text: "Trẻ em dưới 13 tuổi không được phép tự tạo tài khoản. Mọi hoạt động sử dụng ứng dụng AR/AI của trẻ phải được thực hiện dưới sự giám sát trực tiếp của phụ huynh, thông qua tài khoản gia đình do phụ huynh quản lý và chịu trách nhiệm.",
    },
    list: [
      "Bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động diễn ra trên tài khoản của mình",
      "Một tài khoản chỉ dành cho một gia đình hoặc cá nhân, không được chuyển nhượng cho bên thứ ba",
      "Earthoria có quyền yêu cầu xác minh danh tính khi phát hiện dấu hiệu sử dụng bất thường",
    ],
  },
  {
    id: "dat-hang",
    num: "04",
    title: "Đặt Hàng, Giá Cả & Thanh Toán",
    paragraphs: [
      "Mọi đơn hàng đặt qua website hoặc ứng dụng đều tuân theo quy trình xác nhận hai bước nhằm hạn chế sai sót trước khi giao dịch được xử lý chính thức.",
    ],
    list: [
      "Giá hiển thị đã bao gồm thuế VAT, có thể thay đổi mà không cần báo trước nhưng không áp dụng hồi tố cho đơn hàng đã đặt trước thời điểm thay đổi",
      "Earthoria chấp nhận thanh toán qua thẻ tín dụng/ghi nợ, ví điện tử và chuyển khoản ngân hàng",
      "Đơn hàng chỉ được xác nhận sau khi thanh toán thành công, trừ trường hợp chọn hình thức thanh toán khi nhận hàng (COD)",
      "Earthoria có quyền hủy đơn hàng nếu phát hiện lỗi hiển thị giá hoặc dấu hiệu gian lận, kèm theo hoàn tiền đầy đủ trong mọi trường hợp",
    ],
  },
  {
    id: "van-chuyen",
    num: "05",
    title: "Vận Chuyển & Giao Nhận",
    paragraphs: [
      "Thời gian giao hàng dự kiến từ 2–5 ngày làm việc đối với khu vực nội thành và 3–7 ngày làm việc đối với các khu vực còn lại, tùy thuộc vào đơn vị vận chuyển đối tác tại thời điểm giao hàng.",
    ],
    list: [
      "Miễn phí vận chuyển áp dụng cho đơn hàng từ 500.000đ trở lên trên toàn quốc",
      "Earthoria không chịu trách nhiệm cho sự chậm trễ phát sinh do thiên tai, dịch bệnh hoặc các sự kiện bất khả kháng khác",
      "Vui lòng kiểm tra tình trạng sản phẩm ngay khi nhận hàng và phản hồi trong vòng 24 giờ nếu phát hiện hư hỏng",
    ],
  },
  {
    id: "doi-tra",
    num: "06",
    title: "Đổi Trả, Hoàn Tiền & Bảo Hành",
    paragraphs: [
      "Chúng tôi mong muốn mỗi cuốn sách Earthoria mang lại trải nghiệm trọn vẹn cho cả gia đình bạn. Nếu sản phẩm chưa đáp ứng kỳ vọng, chính sách đổi trả dưới đây sẽ giúp bạn an tâm hơn khi mua sắm.",
    ],
    list: [
      "Đổi trả miễn phí trong vòng 30 ngày kể từ ngày nhận hàng nếu sản phẩm còn nguyên vẹn, chưa qua sử dụng",
      "Hoàn tiền được xử lý trong 5–10 ngày làm việc sau khi Earthoria nhận lại sản phẩm hợp lệ",
      "Sản phẩm lỗi do nhà sản xuất được đổi mới hoàn toàn miễn phí trong vòng 12 tháng kể từ ngày mua",
      "Mã kích hoạt AR đi kèm mỗi cuốn sách là duy nhất và không thể tái sử dụng sau khi sản phẩm đã được đổi trả",
    ],
  },
  {
    id: "ung-dung-ar",
    num: "07",
    title: "Ứng Dụng AR/AI Earthoria — Quy Tắc Sử Dụng",
    paragraphs: [
      "Ứng dụng Earthoria yêu cầu quyền truy cập camera và micro của thiết bị để kích hoạt Nội dung AR và Trợ lý AI. Các quyền này chỉ được sử dụng cho đúng mục đích giáo dục đã công bố.",
    ],
    callout: {
      title: "Lưu ý quan trọng về Trợ lý AI",
      text: "Trợ lý AI được thiết kế riêng cho mục đích giáo dục trẻ em và không lưu trữ vĩnh viễn nội dung hội thoại bằng giọng nói. Chi tiết đầy đủ về cách dữ liệu giọng nói được xử lý được trình bày tại Chính sách Bảo mật của chúng tôi.",
    },
    list: [
      "Quyền truy cập camera và micro có thể được thu hồi bất kỳ lúc nào trong phần cài đặt của thiết bị",
      "Nội dung AR chỉ tương thích với sách Earthoria chính hãng có mã QR hợp lệ đi kèm",
      "Nghiêm cấm sử dụng ứng dụng để quét hoặc sao chép nội dung từ các ấn phẩm không thuộc sở hữu của Earthoria",
    ],
  },
  {
    id: "so-huu-tri-tue",
    num: "08",
    title: "Quyền Sở Hữu Trí Tuệ",
    paragraphs: [
      "Toàn bộ nội dung trên website, ứng dụng và trong các ấn phẩm sách — bao gồm văn bản, hình minh họa, mô hình 3D, âm thanh và mã nguồn — là tài sản trí tuệ của Earthoria hoặc được cấp phép sử dụng hợp pháp từ các đối tác sáng tạo.",
    ],
    list: [
      "Bạn được phép sử dụng nội dung cho mục đích cá nhân, gia đình và giáo dục phi thương mại, ví dụ như trình chiếu trong lớp học",
      "Nghiêm cấm sao chép, phân phối lại hoặc thương mại hóa nội dung dưới mọi hình thức khi chưa có sự đồng ý bằng văn bản từ Earthoria",
      'Logo, tên thương hiệu "Earthoria" và toàn bộ hệ thống nhận diện liên quan được bảo hộ độc quyền theo luật sở hữu trí tuệ hiện hành',
    ],
  },
  {
    id: "hanh-vi-cam",
    num: "09",
    title: "Hành Vi Bị Nghiêm Cấm",
    paragraphs: [
      "Khi sử dụng Dịch vụ, bạn đồng ý không thực hiện bất kỳ hành vi nào dưới đây, nhằm bảo vệ một môi trường an toàn và lành mạnh cho mọi gia đình sử dụng Earthoria.",
    ],
    list: [
      "Giả mạo danh tính hoặc cung cấp thông tin sai lệch khi đăng ký tài khoản",
      "Sử dụng phần mềm tự động (bot) nhằm mua hàng số lượng lớn cho mục đích đầu cơ",
      "Can thiệp, dịch ngược hoặc cố gắng trích xuất mã nguồn của ứng dụng AR/AI",
      "Đăng tải nội dung phản cảm, bạo lực hoặc không phù hợp với trẻ em vào mục đánh giá sản phẩm",
      "Sử dụng Dịch vụ cho bất kỳ mục đích nào trái với quy định của pháp luật Việt Nam",
    ],
  },
  {
    id: "cham-dut",
    num: "10",
    title: "Tạm Ngưng & Chấm Dứt Tài Khoản",
    paragraphs: [
      "Earthoria có quyền tạm ngưng hoặc chấm dứt tài khoản vi phạm nghiêm trọng các điều khoản này, tùy theo mức độ và tính chất của vi phạm được ghi nhận.",
    ],
    list: [
      "Vi phạm sẽ được thông báo qua email đăng ký trước khi có hành động tạm ngưng, trừ trường hợp khẩn cấp ảnh hưởng đến an toàn người dùng khác",
      "Bạn có quyền yêu cầu giải trình trong vòng 7 ngày kể từ khi nhận được thông báo",
      "Việc chấm dứt tài khoản không ảnh hưởng đến các quyền lợi đã phát sinh trước đó, ví dụ như đơn hàng đang trong quá trình vận chuyển",
    ],
  },
  {
    id: "gioi-han-trach-nhiem",
    num: "11",
    title: "Giới Hạn Trách Nhiệm & Miễn Trừ Bảo Đảm",
    paragraphs: [
      'Dịch vụ được cung cấp trên cơ sở "nguyên trạng". Trong phạm vi pháp luật cho phép, Earthoria không chịu trách nhiệm cho các thiệt hại gián tiếp, ngẫu nhiên hoặc hệ quả phát sinh từ việc sử dụng hoặc không thể sử dụng Dịch vụ.',
    ],
    list: [
      "Earthoria không đảm bảo ứng dụng AR hoạt động hoàn hảo trên mọi dòng thiết bị và phiên bản hệ điều hành",
      "Trách nhiệm tài chính tối đa của Earthoria trong mọi trường hợp được giới hạn ở giá trị đơn hàng liên quan trực tiếp",
      "Điều khoản này không loại trừ bất kỳ trách nhiệm nào mà pháp luật hiện hành không cho phép loại trừ",
    ],
  },
  {
    id: "boi-thuong",
    num: "12",
    title: "Bồi Thường",
    paragraphs: [
      "Bạn đồng ý bồi thường và giữ Earthoria, đội ngũ nhân viên cùng các đối tác liên quan vô hại trước mọi khiếu nại, tổn thất hoặc chi phí hợp lý phát sinh từ việc bạn vi phạm Điều khoản này hoặc sử dụng Dịch vụ sai mục đích đã công bố.",
    ],
  },
  {
    id: "thay-doi-dieu-khoan",
    num: "13",
    title: "Thay Đổi Điều Khoản",
    paragraphs: [
      "Chúng tôi có thể cập nhật Điều khoản này theo thời gian để phản ánh thay đổi pháp lý hoặc cải tiến dịch vụ. Phiên bản cập nhật sẽ luôn được đăng tải tại trang này kèm theo ngày hiệu lực mới.",
    ],
    list: [
      "Thay đổi quan trọng ảnh hưởng đến quyền lợi của bạn sẽ được thông báo qua email ít nhất 14 ngày trước khi có hiệu lực",
      "Việc tiếp tục sử dụng Dịch vụ sau ngày hiệu lực mới đồng nghĩa với việc bạn đã chấp nhận các điều khoản đã cập nhật",
    ],
  },
  {
    id: "luat-ap-dung",
    num: "14",
    title: "Luật Áp Dụng & Giải Quyết Tranh Chấp",
    paragraphs: [
      "Điều khoản này được điều chỉnh và giải thích theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết thông qua thương lượng thiện chí giữa hai bên.",
    ],
    list: [
      "Trường hợp không đạt được thỏa thuận, tranh chấp sẽ được đưa ra Trung tâm Trọng tài Quốc tế Việt Nam (VIAC) hoặc Tòa án có thẩm quyền tại Thành phố Hồ Chí Minh",
    ],
  },
  {
    id: "lien-he",
    num: "15",
    title: "Liên Hệ",
    paragraphs: [
      "Nếu bạn có bất kỳ câu hỏi nào về Điều khoản Dịch vụ này, đội ngũ Chăm sóc Khách hàng của Earthoria luôn sẵn sàng hỗ trợ qua các kênh liên hệ được liệt kê ở cuối trang.",
    ],
  },
];

const FAQS = [
  {
    q: "Tôi có thể trả sách nếu con tôi không thích nội dung không?",
    a: "Có. Bạn có thể đổi trả miễn phí trong vòng 30 ngày kể từ ngày nhận hàng, miễn là sản phẩm còn nguyên vẹn và chưa qua sử dụng. Mã AR đi kèm sẽ không thể kích hoạt lại sau khi đổi trả.",
  },
  {
    q: "Ứng dụng AR có thu thập dữ liệu giọng nói của con tôi không?",
    a: "Trợ lý AI chỉ ghi âm khi được chủ động kích hoạt và không lưu trữ vĩnh viễn nội dung hội thoại. Chi tiết đầy đủ được trình bày trong Chính sách Bảo mật của chúng tôi.",
  },
  {
    q: "Tôi có thể dùng hình ảnh từ sách cho lớp học của mình không?",
    a: "Hoàn toàn được, miễn là cho mục đích giáo dục phi thương mại. Việc sao chép để bán lại hoặc phân phối thương mại đều không được phép.",
  },
  {
    q: "Điều gì xảy ra nếu tôi vi phạm điều khoản sử dụng?",
    a: "Tùy mức độ vi phạm, tài khoản có thể bị tạm ngưng hoặc chấm dứt sau khi đã được thông báo, trừ trường hợp khẩn cấp. Bạn luôn có quyền giải trình trong vòng 7 ngày.",
  },
  {
    q: "Earthoria có quyền thay đổi giá sau khi tôi đã đặt hàng không?",
    a: "Không. Giá tại thời điểm bạn hoàn tất đơn hàng sẽ được giữ nguyên cho đơn hàng đó, kể cả khi giá niêm yết thay đổi sau này.",
  },
];

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function TermsOfService() {
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
        <span className="breadcrumb-current">Điều khoản dịch vụ</span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="legal-hero">
        <div className="legal-hero-grid" />
        <div className="legal-hero-glow" />
        <div className="legal-hero-watermark">EARTHORIA</div>
        <div className="legal-hero-inner">
          <div className="legal-hero-icon">
            <Scale size={22} />
          </div>
          <div className="legal-hero-eyebrow">
            <span className="legal-hero-eyebrow-line" />
            <span>Pháp Lý &amp; Cam Kết</span>
            <span className="legal-hero-eyebrow-line" />
          </div>
          <h1 className="legal-hero-title">
            Điều Khoản —<br />
            <em>Dịch Vụ</em>
          </h1>
          <p className="legal-hero-sub">
            Những quy định rõ ràng, công bằng để bạn và gia đình yên tâm
            khám phá thế giới Earthoria — từ trang sách đầu tiên đến trải
            nghiệm AR sống động.
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
              <div className="legal-sidebar-card-title">Cần hỗ trợ thêm?</div>
              <p>
                Đội ngũ pháp lý của Earthoria luôn sẵn sàng giải đáp mọi thắc
                mắc của bạn.
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
          <span className="legal-contact-eyebrow reveal">Vẫn còn thắc mắc?</span>
          <h2 className="legal-contact-title reveal">
            Đội ngũ pháp lý của chúng tôi
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