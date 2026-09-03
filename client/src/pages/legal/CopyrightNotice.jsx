import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Copyright,
  Layers,
  Sparkles,
  ShieldCheck,
  Ban,
  Flag,
  Clock,
  Calendar,
  FileText,
  ChevronDown,
  Search,
  Printer,
  Mail,
  Phone,
  MapPin,
  Check,
  Link2,
  AlertTriangle,
} from "lucide-react";

const META = {
  effectiveDate: "01 Tháng 01, 2026",
  updatedDate: "04 Tháng 09, 2026",
  version: "v1.0",
};

const SUMMARY_CARDS = [
  {
    icon: ShieldCheck,
    title: "Bảo hộ toàn diện",
    desc: "Tên thương hiệu, logo, giao diện và toàn bộ nội dung số của Earthoria được bảo hộ theo pháp luật sở hữu trí tuệ hiện hành.",
  },
  {
    icon: Layers,
    title: "Trọn hệ sinh thái",
    desc: "Family Studio, Game Studio, Immersive Studio, Knowledge Farm, Kid Mode và trợ lý AI Eira đều là tài sản thương hiệu thuộc Earthoria.",
  },
  {
    icon: Ban,
    title: "Nghiêm cấm sử dụng trái phép",
    desc: "Sao chép, mô phỏng hoặc thương mại hóa logo, tên gọi, giao diện khi chưa có sự đồng ý bằng văn bản đều bị coi là xâm phạm.",
  },
  {
    icon: Flag,
    title: "Quy trình báo cáo minh bạch",
    desc: "Kênh tiếp nhận và xử lý báo cáo vi phạm bản quyền được công bố rõ ràng, phản hồi trong thời gian quy định.",
  },
];

const ECOSYSTEM_BRANDS = [
  {
    name: "Earthoria",
    role: "Thương hiệu mẹ",
    desc: "Tên gọi nền tảng, wordmark chính, hệ thống nhận diện tổng thể (màu sắc, kiểu chữ, bố cục) áp dụng xuyên suốt website, ứng dụng và ấn phẩm.",
  },
  {
    name: "Family Studio",
    role: "Bộ phận nội dung gia đình",
    desc: "Tên gọi, biểu tượng và các cụm nội dung giáo dục — bao gồm Knowledge Farm — hướng đến sự gắn kết giữa cha mẹ và trẻ nhỏ.",
  },
  {
    name: "Knowledge Farm",
    role: "Trực thuộc Family Studio",
    desc: "Tên gọi, biểu tượng và cách trình bày thư viện chủ đề, bài viết mở rộng tri thức đồng hành cùng mỗi cuốn sách.",
  },
  {
    name: "Game Studio",
    role: "Bộ phận trò chơi giáo dục",
    desc: "Tên gọi bộ phận cùng tên riêng, hình ảnh nhân vật và bảng xếp hạng của từng minigame giáo dục gắn liền với sách.",
  },
  {
    name: "Immersive Studio",
    role: "Bộ phận trải nghiệm AR & AI",
    desc: "Tên gọi bộ phận, công nghệ quét mã AR và giao diện trải nghiệm thực tế tăng cường độc quyền của Earthoria.",
  },
  {
    name: "Eira",
    role: "Trợ lý AI",
    desc: "Tên riêng, hình ảnh đại diện, giọng điệu hội thoại và luồng gợi ý cá nhân hóa của trợ lý AI đồng hành cùng trẻ.",
  },
  {
    name: "Kid Mode",
    role: "Chế độ trẻ em",
    desc: "Tên gọi, biểu trưng và toàn bộ giao diện riêng biệt của chế độ trẻ em được bảo vệ bởi PIN phụ huynh.",
  },
];

const SECTIONS = [
  {
    id: "tong-quan",
    num: "01",
    title: "Tổng Quan & Phạm Vi Áp Dụng",
    paragraphs: [
      'Tuyên bố Bản quyền này ("Tuyên bố") quy định quyền sở hữu trí tuệ của Earthoria đối với tên thương hiệu, logo, hệ sinh thái sản phẩm và toàn bộ nội dung được hiển thị trên website, ứng dụng di động và các ấn phẩm liên quan (gọi chung là "Nền tảng"). Tuyên bố áp dụng cho mọi cá nhân, tổ chức truy cập hoặc sử dụng Nền tảng, bao gồm khách vãng lai, khách hàng đã đăng ký, đối tác kinh doanh và các bên thứ ba khác.',
      "Tuyên bố này là một phần không tách rời của Điều Khoản Dịch Vụ Earthoria và cần được đọc cùng với mục Quyền Sở Hữu Trí Tuệ tại tài liệu đó. Trong trường hợp có mâu thuẫn về nội dung liên quan đến thương hiệu và tài sản trí tuệ, Tuyên bố này được ưu tiên áp dụng.",
    ],
  },
  {
    id: "ten-thuong-hieu",
    num: "02",
    title: "Tên Thương Hiệu & Nhãn Hiệu",
    paragraphs: [
      'Tên gọi "Earthoria", cùng các biến thể chữ viết, khẩu hiệu (tagline) và tên miền chính thức (earthoria.vercel.app, earthoria.id.vn và các tên miền phụ liên quan) là nhãn hiệu thuộc quyền sở hữu của đội ngũ vận hành Earthoria. Việc sử dụng tên thương hiệu trong tên miền, tài khoản mạng xã hội, ứng dụng của bên thứ ba hoặc bất kỳ hình thức nào có khả năng gây nhầm lẫn về nguồn gốc đều bị nghiêm cấm nếu chưa có sự chấp thuận bằng văn bản.',
    ],
    list: [
      'Không đăng ký tên miền, tài khoản mạng xã hội hoặc ứng dụng có chứa từ "Earthoria" hoặc các biến thể gây nhầm lẫn nhằm mục đích thương mại',
      "Không sử dụng tên thương hiệu trong quảng cáo, từ khóa tìm kiếm trả phí hoặc nội dung tiếp thị mà không nêu rõ mối quan hệ thực tế với Earthoria",
      "Việc nhắc đến tên thương hiệu trong bài viết báo chí, đánh giá sản phẩm mang tính khách quan, phi thương mại không thuộc phạm vi hạn chế của mục này",
    ],
  },
  {
    id: "logo-nhan-dien",
    num: "03",
    title: "Logo & Bộ Nhận Diện Thị Giác",
    paragraphs: [
      "Toàn bộ logo, biểu trưng, biểu tượng ứng dụng, bảng màu thương hiệu (rừng xanh, vàng đồng, ngà voi), kiểu chữ Playfair Display và Be Vietnam Pro khi kết hợp theo bố cục đặc trưng, cùng các hoạ tiết trang trí xuất hiện trên Nền tảng đều cấu thành bộ nhận diện thương hiệu (trade dress) độc quyền của Earthoria.",
    ],
    callout: {
      title: "Không tự ý chỉnh sửa logo",
      text: "Logo Earthoria dưới mọi phiên bản (logo ngang, logo dọc, logo rút gọn, logo dành cho nền tối) không được thay đổi màu sắc, tỷ lệ, hiệu ứng hoặc kết hợp với biểu tượng khác khi chưa có sự cho phép bằng văn bản từ Earthoria, kể cả trong tài liệu hợp tác hoặc bài viết truyền thông.",
    },
    list: [
      "Đối tác truyền thông, nhà bán lẻ liên kết có thể sử dụng logo gốc, không chỉnh sửa, kèm theo văn bản chấp thuận hợp tác cụ thể",
      "Nghiêm cấm sử dụng logo hoặc bộ nhận diện để tạo sản phẩm, giao diện, hoặc dịch vụ có khả năng gây nhầm lẫn là sản phẩm chính thức của Earthoria",
      "Mọi yêu cầu sử dụng logo cho mục đích báo chí, học thuật hoặc phi lợi nhuận vui lòng liên hệ qua kênh tại Mục 10",
    ],
  },
  {
    id: "he-sinh-thai",
    num: "04",
    title: "Hệ Sinh Thái Thương Hiệu Con",
    paragraphs: [
      "Earthoria được vận hành như một hệ sinh thái gồm nhiều bộ phận và sản phẩm con, mỗi bộ phận mang tên gọi, biểu tượng và bản sắc hình ảnh riêng nhưng đều là tài sản trí tuệ thuộc quyền sở hữu chung của Earthoria. Bảng dưới đây liệt kê các thành phần chính của hệ sinh thái tại thời điểm ban hành Tuyên bố này.",
    ],
    ecosystemTable: true,
  },
  {
    id: "noi-dung-bao-ho",
    num: "05",
    title: "Nội Dung, Mã Nguồn & Tài Sản Số Được Bảo Hộ",
    paragraphs: [
      "Ngoài tên gọi và hình ảnh thương hiệu, Earthoria còn sở hữu hoặc được cấp phép hợp pháp đối với nhiều loại tài sản trí tuệ khác cấu thành nên trải nghiệm sản phẩm.",
    ],
    list: [
      "Mã nguồn website, ứng dụng di động, hệ thống quản trị và máy chủ hậu đài (backend), bao gồm kiến trúc cơ sở dữ liệu và luồng xử lý nghiệp vụ",
      "Thiết kế giao diện người dùng (UI) và trải nghiệm người dùng (UX), bao gồm bố cục trang, hoạt ảnh chuyển động và các thành phần tương tác đặc trưng",
      "Nội dung biên tập gốc: mô tả sản phẩm, bài viết Knowledge Farm, kịch bản trò chơi giáo dục và nội dung hội thoại của trợ lý AI Eira",
      "Tài sản đồ họa và đa phương tiện: hình minh họa, mô hình 3D và hiệu ứng thực tế tăng cường (AR), âm thanh, biểu tượng hạng thành viên",
      "Thuật toán, luồng tính điểm và cơ chế vận hành của hệ thống Hạng Thành Viên, hệ thống thưởng tương tác và các cơ chế gamification khác",
    ],
  },
  {
    id: "noi-dung-ben-thu-ba",
    num: "06",
    title: "Nội Dung Của Bên Thứ Ba & Thành Phần Mã Nguồn Mở",
    paragraphs: [
      "Earthoria tôn trọng quyền sở hữu trí tuệ của bên thứ ba và minh bạch về các thành phần không thuộc quyền sở hữu độc quyền của mình.",
    ],
    list: [
      "Tên các hạng trong hệ thống Hạng Thành Viên (Chùa Một Cột, Cố Đô Huế, Cầu Rồng, Tháp Bà Ponagar, Landmark 81) lấy cảm hứng từ các danh lam thắng cảnh của Việt Nam — bản thân địa danh không thuộc quyền sở hữu riêng của Earthoria, tuy nhiên cách đặt tên, thứ tự, biểu tượng và màu sắc gắn với từng hạng là cách trình bày sáng tạo thuộc về Earthoria",
      "Nội dung sách, minh họa hoặc học liệu do các nhà xuất bản, tác giả hoặc đối tác sáng tạo cung cấp được sử dụng theo thỏa thuận cấp phép riêng và vẫn thuộc quyền sở hữu của bên cấp phép, trừ khi có thỏa thuận chuyển nhượng khác",
      "Nền tảng có sử dụng các thư viện, khung phần mềm mã nguồn mở của bên thứ ba; các thành phần này được sử dụng theo đúng giấy phép phát hành tương ứng và không thuộc phạm vi Tuyên bố này",
      "Nội dung do người dùng tạo ra (đánh giá sản phẩm, bình luận) thuộc quyền của người đăng, đồng thời người đăng cấp cho Earthoria quyền sử dụng phi độc quyền để vận hành và quảng bá Nền tảng",
    ],
  },
  {
    id: "pham-vi-su-dung",
    num: "07",
    title: "Phạm Vi Sử Dụng Được Cho Phép",
    paragraphs: [
      "Earthoria khuyến khích việc chia sẻ và lan tỏa nội dung trong phạm vi hợp lý, phục vụ mục đích cá nhân, giáo dục và phi thương mại.",
    ],
    list: [
      "Được phép chụp ảnh, quay video màn hình để chia sẻ trải nghiệm cá nhân trên mạng xã hội, kèm ghi nguồn Earthoria khi phù hợp",
      "Được phép sử dụng hình ảnh sản phẩm cho mục đích giáo dục phi thương mại, ví dụ trình chiếu trong lớp học hoặc bài thu hoạch của học sinh",
      "Không được trích xuất, đóng gói lại hoặc phân phối mã nguồn, dữ liệu sản phẩm dưới bất kỳ hình thức thương mại nào",
      "Không được sử dụng tên thương hiệu, logo hoặc giao diện Earthoria để phát triển sản phẩm, dịch vụ cạnh tranh hoặc gây nhầm lẫn cho người tiêu dùng",
    ],
  },
  {
    id: "hanh-vi-xam-pham",
    num: "08",
    title: "Hành Vi Xâm Phạm Bị Nghiêm Cấm",
    paragraphs: [
      "Các hành vi dưới đây, dù thực hiện trực tiếp hay gián tiếp, đều bị coi là xâm phạm quyền sở hữu trí tuệ của Earthoria và có thể bị xử lý theo quy định pháp luật.",
    ],
    list: [
      "Sao chép, làm giả hoặc mô phỏng logo, tên thương hiệu, giao diện hoặc bộ nhận diện của Earthoria nhằm mục đích thương mại hoặc gây nhầm lẫn",
      "Sử dụng kỹ thuật dịch ngược (reverse engineering), cạo dữ liệu (scraping) tự động hoặc truy cập trái phép nhằm sao chép mã nguồn, cơ sở dữ liệu sản phẩm",
      "Đăng ký nhãn hiệu, kiểu dáng công nghiệp hoặc tên miền trùng hoặc gây nhầm lẫn với các tên gọi thuộc hệ sinh thái Earthoria",
      "Sử dụng tên gọi hoặc hình ảnh của Eira, Kid Mode hoặc bất kỳ thương hiệu con nào để xây dựng sản phẩm hướng đến trẻ em mà không có sự cho phép",
      "Phân phối lại, bán hoặc cấp phép thứ cấp nội dung, tài sản đồ họa của Earthoria dưới danh nghĩa của bên thứ ba",
    ],
  },
  {
    id: "quy-trinh-bao-cao",
    num: "09",
    title: "Quy Trình Báo Cáo & Xử Lý Vi Phạm Bản Quyền",
    paragraphs: [
      "Earthoria xử lý mọi báo cáo vi phạm bản quyền một cách nghiêm túc, dựa trên nguyên tắc thiện chí, minh bạch và có đối chứng hai chiều.",
    ],
    callout: {
      title: "Cách gửi báo cáo vi phạm",
      text: "Gửi email đến địa chỉ tại Mục 10, kèm mô tả cụ thể nội dung nghi vi phạm, đường dẫn hoặc vị trí xuất hiện, tài sản trí tuệ bị ảnh hưởng và thông tin liên hệ của người báo cáo. Earthoria phản hồi xác nhận trong vòng 3 ngày làm việc và hoàn tất xem xét trong tối đa 14 ngày làm việc.",
    },
    list: [
      "Trường hợp xác nhận có vi phạm, Earthoria sẽ yêu cầu gỡ bỏ, chỉnh sửa nội dung hoặc áp dụng biện pháp xử lý phù hợp với tính chất và mức độ vi phạm",
      "Bên bị cho là vi phạm có quyền phản hồi, cung cấp bằng chứng hoặc giải trình trước khi biện pháp xử lý cuối cùng được áp dụng",
      "Đối với vi phạm nghiêm trọng hoặc tái diễn, Earthoria bảo lưu quyền áp dụng các biện pháp pháp lý theo quy định của pháp luật sở hữu trí tuệ Việt Nam và các điều ước quốc tế liên quan",
      "Báo cáo sai sự thật, nhằm mục đích cạnh tranh không lành mạnh có thể bị từ chối xem xét và ghi nhận lại để phòng ngừa lạm dụng quy trình",
    ],
  },
  {
    id: "thay-doi-lien-he",
    num: "10",
    title: "Thay Đổi Tuyên Bố & Liên Hệ",
    paragraphs: [
      "Earthoria có thể cập nhật Tuyên bố này theo thời gian để phản ánh sự phát triển của hệ sinh thái sản phẩm và các yêu cầu pháp lý mới. Mọi thay đổi làm giảm quyền lợi của người dùng liên quan sẽ được thông báo trước tối thiểu 14 ngày qua email và banner trên website, theo đúng cam kết minh bạch chung của Earthoria. Phiên bản hiện hành luôn được công bố công khai tại trang này kèm số phiên bản và ngày cập nhật gần nhất.",
      "Mọi thắc mắc về quyền sở hữu trí tuệ, yêu cầu cấp phép sử dụng thương hiệu hoặc báo cáo vi phạm bản quyền, vui lòng liên hệ đội ngũ Earthoria qua các kênh dưới đây.",
    ],
  },
];

const FAQS = [
  {
    q: "Tôi có được dùng logo Earthoria trong bài viết đánh giá sản phẩm không?",
    a: "Có. Bạn được phép sử dụng logo gốc, không chỉnh sửa, trong các bài viết đánh giá, tin tức mang tính khách quan và phi thương mại, miễn là không tạo cảm giác bài viết là nội dung chính thức từ Earthoria.",
  },
  {
    q: '"Family Studio", "Game Studio" hay "Eira" có phải là công ty riêng không?',
    a: "Không. Đây là tên gọi các bộ phận và sản phẩm con trong cùng hệ sinh thái Earthoria, không phải pháp nhân độc lập. Tất cả đều thuộc quyền sở hữu và vận hành chung của Earthoria.",
  },
  {
    q: "Tên các hạng thành viên như Landmark 81 có phải là tài sản riêng của Earthoria không?",
    a: "Bản thân các địa danh là tài sản văn hóa chung của Việt Nam, không thuộc sở hữu riêng của Earthoria. Tuy nhiên, cách lựa chọn, sắp xếp thứ tự và gắn biểu tượng, màu sắc cho từng hạng trong hệ thống là cách trình bày sáng tạo thuộc về Earthoria.",
  },
  {
    q: "Tôi phát hiện một website khác sao chép giao diện Earthoria, tôi nên làm gì?",
    a: "Vui lòng gửi báo cáo theo hướng dẫn tại Mục 09, kèm đường dẫn cụ thể và mô tả điểm tương đồng. Đội ngũ Earthoria sẽ xác minh và phản hồi trong vòng 3 ngày làm việc.",
  },
  {
    q: "Giáo viên có thể trình chiếu nội dung Earthoria trong lớp học không?",
    a: "Có. Nội dung được phép sử dụng cho mục đích giáo dục phi thương mại như trình chiếu trong lớp học hoặc bài thu hoạch, miễn là không thương mại hóa hoặc phân phối lại dưới danh nghĩa khác.",
  },
  {
    q: "Tôi muốn hợp tác truyền thông và sử dụng logo Earthoria, cần làm gì?",
    a: "Vui lòng liên hệ đội ngũ Earthoria qua email tại Mục 10 để nhận bộ nhận diện chính thức cùng hướng dẫn sử dụng, kèm văn bản chấp thuận hợp tác cụ thể cho từng chiến dịch.",
  },
];

export default function CopyrightNotice() {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [tocQuery, setTocQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const sidebarScrollRef = useRef(null);

  /* scroll progress (rAF-throttled) */
  useEffect(() => {
    let ticking = false;
    const update = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight =
        (el.scrollHeight || document.body.scrollHeight) - el.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
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

        .legal-eco-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;
          margin: 24px 0 8px;
        }
        .legal-eco-card {
          border: 0.5px solid var(--border); background: var(--white);
          padding: 22px 24px; transition: all 0.3s ease;
        }
        .legal-eco-card:hover { border-color: var(--border-gold); transform: translateY(-2px); }
        .legal-eco-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px; gap: 10px;
        }
        .legal-eco-name {
          font-family: 'Playfair Display', serif;
          font-size: 16.5px; color: var(--forest); font-weight: 500;
        }
        .legal-eco-role {
          font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--gold); white-space: nowrap; flex-shrink: 0;
        }
        .legal-eco-desc {
          font-size: 12.5px; line-height: 1.75; color: var(--text-muted); font-weight: 300;
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
        body.dark-mode .legal-eco-card { background: #1c2822; border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-eco-name { color: #c8d4cc; }
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
          .legal-eco-grid { grid-template-columns: 1fr; }
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
        <span className="breadcrumb-current">Tuyên bố bản quyền</span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="legal-hero">
        <div className="legal-hero-grid" />
        <div className="legal-hero-glow" />
        <div className="legal-hero-watermark">EARTHORIA</div>
        <div className="legal-hero-inner">
          <div className="legal-hero-icon">
            <Copyright size={22} />
          </div>
          <div className="legal-hero-eyebrow">
            <span className="legal-hero-eyebrow-line" />
            <span>Sở Hữu Trí Tuệ</span>
            <span className="legal-hero-eyebrow-line" />
          </div>
          <h1 className="legal-hero-title">
            Tuyên Bố —<br />
            <em>Bản Quyền &amp; Thương Hiệu</em>
          </h1>
          <p className="legal-hero-sub">
            Quyền sở hữu của Earthoria đối với tên thương hiệu, logo, hệ sinh
            thái sản phẩm và toàn bộ nội dung số — được công bố minh bạch, đầy
            đủ và dễ tra cứu.
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
              <Sparkles size={14} />
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
              <div className="legal-sidebar-card-title">
                Điều Khoản liên quan
              </div>
              <p>
                Xem thêm quy định về quyền sở hữu trí tuệ trong Điều Khoản Dịch
                Vụ Earthoria.
              </p>
              <Link to="/legal/terms" className="legal-sidebar-card-link">
                Điều Khoản Dịch Vụ
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
                {s.ecosystemTable && (
                  <div className="legal-eco-grid">
                    {ECOSYSTEM_BRANDS.map((b) => (
                      <div className="legal-eco-card" key={b.name}>
                        <div className="legal-eco-head">
                          <span className="legal-eco-name">{b.name}</span>
                          <span className="legal-eco-role">{b.role}</span>
                        </div>
                        <p className="legal-eco-desc">{b.desc}</p>
                      </div>
                    ))}
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
            Cần hỗ trợ về bản quyền &amp; thương hiệu?
          </span>
          <h2 className="legal-contact-title reveal">
            Đội ngũ Earthoria
            <br />
            <em>sẵn sàng giải đáp</em>
          </h2>
          <div className="legal-contact-grid reveal">
            <a href="mailto:legal@earthoria.vn" className="legal-contact-item">
              <Mail size={15} />
              legal@earthoria.vn
            </a>
            <a href="tel:0849324423" className="legal-contact-item">
              <Phone size={15} />
              0849 324 423
            </a>
            <span className="legal-contact-item">
              <MapPin size={15} />
              600 Nguyễn Văn Cừ Nối Dài, An Bình, Cần Thơ
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
