import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Wallet,
  QrCode,
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
  ShieldCheck,
  Banknote,
  Lock,
  ReceiptText,
} from "lucide-react";

/*
   META & CONTENT DATA
 */
const META = {
  effectiveDate: "14 Tháng 09, 2026",
  updatedDate: "14 Tháng 09, 2026",
  version: "v1.0",
};

const SUMMARY_CARDS = [
  {
    icon: Wallet,
    title: "4 phương thức",
    desc: "COD, VNPay, Ví MoMo và Chuyển khoản QR - chọn phương thức phù hợp nhất với bạn ở bước thanh toán.",
  },
  {
    icon: Lock,
    title: "Không lưu dữ liệu thẻ",
    desc: "Earthoria không lưu trữ số thẻ hay mã OTP - mọi giao dịch online được xử lý trực tiếp bởi cổng thanh toán đạt chuẩn PCI DSS.",
  },
  {
    icon: Clock,
    title: "Phiên thanh toán 30 phút",
    desc: "Đơn hàng chưa thanh toán online sẽ tự huỷ sau 30 phút để giải phóng kho cho khách hàng khác.",
  },
  {
    icon: ReceiptText,
    title: "Xuất hoá đơn VAT",
    desc: "Yêu cầu xuất hoá đơn giá trị gia tăng ngay tại bước đặt hàng, nhận hoá đơn điện tử qua email đăng ký.",
  },
];

const SECTIONS = [
  {
    id: "pham-vi",
    num: "01",
    title: "Phạm Vi Áp Dụng",
    paragraphs: [
      "Chính sách này quy định cách Earthoria xử lý thanh toán cho mọi đơn hàng đặt qua website earthoria.vn và ứng dụng Earthoria, bao gồm sách vật lý tích hợp AR, sách điện tử, gói thành viên và các sản phẩm số khác.",
      "Bằng việc hoàn tất thanh toán cho bất kỳ đơn hàng nào, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản dưới đây, cùng với Điều Khoản Dịch Vụ và Chính Sách Trả Hàng & Hoàn Tiền của Earthoria.",
    ],
  },
  {
    id: "phuong-thuc",
    num: "02",
    title: "Các Phương Thức Thanh Toán Được Chấp Nhận",
    paragraphs: [
      "Earthoria hỗ trợ 4 phương thức thanh toán tại bước cuối cùng của quy trình đặt hàng. Một số phương thức có thể không khả dụng tuỳ loại sản phẩm trong giỏ hàng.",
    ],
    list: [
      "Thanh toán khi nhận hàng (COD) - trả tiền mặt trực tiếp cho nhân viên giao hàng khi nhận sản phẩm; chỉ áp dụng cho đơn hàng có ít nhất một sản phẩm vật lý, không áp dụng cho đơn hàng toàn bộ là sách điện tử",
      "VNPay - cổng thanh toán nội địa hỗ trợ thẻ ATM/Napas nội địa, thẻ quốc tế Visa/Mastercard/JCB và ví VNPay",
      "Ví MoMo - thanh toán trực tiếp bằng số dư hoặc liên kết ngân hàng/thẻ trong ứng dụng MoMo",
      "Chuyển khoản QR (BankQR) - quét mã QR chuẩn VietQR bằng ứng dụng của bất kỳ ngân hàng nào tại Việt Nam, hệ thống xác nhận thanh toán tự động",
    ],
    callout: {
      title: "Sách điện tử chỉ thanh toán online",
      text: "Do không có khâu giao nhận vật lý, đơn hàng chỉ gồm sách điện tử bắt buộc thanh toán qua VNPay, MoMo hoặc Chuyển khoản QR. Phương thức COD sẽ tự động ẩn khi giỏ hàng của bạn chỉ có sản phẩm số.",
    },
  },
  {
    id: "quy-trinh-online",
    num: "03",
    title: "Quy Trình Thanh Toán Trực Tuyến",
    paragraphs: [
      "Với VNPay và Ví MoMo, bạn sẽ được chuyển hướng sang trang thanh toán của đối tác ngay sau khi xác nhận đơn hàng. Với Chuyển khoản QR, mã QR hiển thị trực tiếp trên màn hình Earthoria.",
    ],
    list: [
      "Sau khi xác nhận đơn, hệ thống tạo một phiên thanh toán (payment session) gắn liền với đơn hàng và có thời hạn hiệu lực",
      "VNPay/MoMo: bạn hoàn tất thanh toán trên trang của đối tác rồi được chuyển hướng trở lại Earthoria để nhận kết quả",
      "Chuyển khoản QR: quét mã bằng app ngân hàng bất kỳ, hệ thống đối soát và xác nhận đơn tự động trong vòng vài phút sau khi ngân hàng báo có",
      "Trạng thái đơn hàng chỉ chuyển sang Đã thanh toán khi Earthoria nhận được xác nhận hợp lệ (callback/IPN có chữ ký số) trực tiếp từ cổng thanh toán - không dựa trên xác nhận thủ công từ người dùng",
    ],
  },
  {
    id: "het-han-phien",
    num: "04",
    title: "Thời Hạn Phiên Thanh Toán & Tự Huỷ Đơn",
    paragraphs: [
      "Để đảm bảo công bằng về tồn kho giữa các khách hàng, đơn hàng chưa hoàn tất thanh toán trong thời hạn quy định sẽ tự động bị huỷ và hoàn lại kho, mã giảm giá đã áp dụng.",
    ],
    list: [
      "Đơn thanh toán online (VNPay/MoMo/Chuyển khoản QR) chưa từng mở phiên thanh toán: tự huỷ sau 30 phút kể từ lúc đặt hàng",
      "Đơn thanh toán online đã mở phiên nhưng chưa nhận được xác nhận thành công từ cổng thanh toán trong thời hạn phiên: tự chuyển trạng thái Hết hạn và huỷ đơn",
      "Đơn COD: tự huỷ nếu vẫn ở trạng thái Chờ xử lý quá 24 giờ mà chưa được xác nhận giao hàng (thời hạn có thể thay đổi theo khu vực và sẽ được thông báo tại trang đơn hàng)",
      "Khi đơn hàng bị huỷ do hết hạn, số lượng tồn kho và lượt sử dụng mã giảm giá được hoàn lại ngay lập tức để bạn hoặc khách hàng khác có thể đặt lại",
    ],
    callout: {
      title: "Đã chuyển khoản nhưng đơn bị huỷ do hết hạn?",
      text: "Trường hợp hiếm gặp này thường do ngân hàng xử lý chậm hơn thời hạn phiên. Liên hệ ngay bộ phận hỗ trợ kèm biên lai/lịch sử giao dịch - Earthoria đối soát với cổng thanh toán và hoàn tiền 100% trong vòng 5 ngày làm việc nếu xác nhận có giao dịch thành công.",
    },
  },
  {
    id: "phu-phi-cod",
    num: "05",
    title: "Phụ Phí Thu Hộ Với COD",
    paragraphs: [
      "Một số khu vực giao hàng xa hoặc đơn giá trị lớn có thể phát sinh phụ phí thu hộ (COD fee) do đơn vị vận chuyển áp dụng, tách biệt với phí vận chuyển tiêu chuẩn.",
    ],
    list: [
      "Phụ phí thu hộ (nếu có) được hiển thị rõ ràng tại bước xác nhận đơn hàng trước khi bạn hoàn tất đặt hàng - không phát sinh ẩn sau khi đặt hàng",
      "Đơn hàng có giá trị từ 5.000.000đ trở lên khuyến khích thanh toán online (VNPay/MoMo/Chuyển khoản QR) để giảm rủi ro và không phát sinh phụ phí thu hộ",
      "Earthoria có quyền từ chối áp dụng COD cho đơn hàng giá trị lớn bất thường hoặc có dấu hiệu gian lận, và sẽ liên hệ trực tiếp để đề nghị phương thức thanh toán thay thế",
    ],
  },
  {
    id: "bao-mat",
    num: "06",
    title: "Bảo Mật Thanh Toán",
    paragraphs: [
      "An toàn thông tin tài chính của bạn là ưu tiên hàng đầu của Earthoria. Toàn bộ giao dịch online được xử lý qua các đối tác thanh toán được cấp phép hoạt động hợp pháp tại Việt Nam.",
    ],
    list: [
      "Earthoria không thu thập, không lưu trữ số thẻ, ngày hết hạn, CVV/CVC hay mã OTP dưới bất kỳ hình thức nào - toàn bộ thông tin này được nhập trực tiếp trên trang của cổng thanh toán (VNPay, MoMo) đạt chuẩn bảo mật PCI DSS",
      "Kết nối giữa trình duyệt của bạn và hệ thống Earthoria được mã hoá bằng TLS 1.3",
      "Mọi callback/webhook xác nhận thanh toán từ cổng thanh toán đều được xác thực bằng chữ ký số (checksum/signature) trước khi hệ thống ghi nhận là hợp lệ - giao dịch có chữ ký không khớp sẽ bị từ chối và ghi log để rà soát",
      "Earthoria giám sát các dấu hiệu bất thường (nhiều đơn hàng giá trị lớn trong thời gian ngắn, nhiều lần thanh toán thất bại liên tiếp) và có thể tạm giữ đơn hàng để xác minh thêm",
    ],
    callout: {
      title: "Earthoria không bao giờ hỏi mã OTP",
      text: "Nhân viên Earthoria không bao giờ gọi điện, nhắn tin hay email để hỏi mã OTP, mật khẩu hoặc thông tin thẻ của bạn. Nếu nhận được yêu cầu như vậy dưới danh nghĩa Earthoria, vui lòng không cung cấp và báo ngay cho chúng tôi.",
    },
  },
  {
    id: "thanh-toan-that-bai",
    num: "07",
    title: "Thanh Toán Thất Bại & Xử Lý Lỗi",
    paragraphs: [
      "Giao dịch có thể không thành công vì nhiều lý do đến từ ngân hàng, ví điện tử hoặc kết nối mạng. Earthoria xử lý các trường hợp này theo nguyên tắc minh bạch và không giữ tiền của bạn.",
    ],
    list: [
      "Nếu cổng thanh toán báo giao dịch thất bại hoặc bị huỷ, đơn hàng vẫn ở trạng thái Chưa thanh toán và bạn có thể thử lại ngay hoặc chọn phương thức khác trong thời hạn phiên còn lại",
      "Nếu tiền đã bị trừ từ tài khoản/thẻ của bạn nhưng Earthoria hiển thị đơn hàng là chưa thanh toán hoặc thất bại, đây thường là giao dịch đang xử lý phía ngân hàng - vui lòng đợi tối đa 24 giờ trước khi liên hệ hỗ trợ kèm mã đơn hàng và biên lai giao dịch",
      "Trường hợp xác nhận có giao dịch trừ tiền thành công nhưng đơn hàng không được ghi nhận, Earthoria hoàn tiền 100% qua đúng phương thức đã thanh toán trong vòng 5-10 ngày làm việc sau khi đối soát với cổng thanh toán",
      "Bị trừ tiền nhiều lần cho cùng một đơn do lỗi kỹ thuật (double-charge): các giao dịch trùng lặp được hệ thống nhận diện và hoàn tự động, hoặc thủ công sau khi bạn báo cáo, trong vòng 5-10 ngày làm việc",
    ],
  },
  {
    id: "hoan-tien",
    num: "08",
    title: "Hoàn Tiền",
    paragraphs: [
      "Việc hoàn tiền do huỷ đơn, đổi trả hàng hoặc sự cố thanh toán được thực hiện theo đúng phương thức thanh toán ban đầu của đơn hàng. Chi tiết đầy đủ về điều kiện và thời gian đổi trả được quy định tại Chính Sách Trả Hàng & Hoàn Tiền.",
    ],
    list: [
      "VNPay/thẻ qua VNPay: hoàn tiền trong 5-10 ngày làm việc, tuỳ thời gian xử lý của ngân hàng phát hành",
      "Ví MoMo: hoàn tiền trong 1-3 ngày làm việc",
      "Chuyển khoản QR: hoàn về đúng tài khoản ngân hàng đã chuyển khoản, trong 2-5 ngày làm việc",
      "COD (đã thanh toán tiền mặt khi nhận hàng): hoàn qua chuyển khoản ngân hàng đến tài khoản bạn cung cấp, trong 3-5 ngày làm việc",
      "Earthoria không hoàn tiền mặt trực tiếp và không hoàn sang phương thức khác với phương thức đã thanh toán, trừ trường hợp phương thức gốc không còn khả dụng và có thoả thuận riêng bằng văn bản",
    ],
  },
  {
    id: "hoa-don-vat",
    num: "09",
    title: "Hoá Đơn Giá Trị Gia Tăng (VAT)",
    paragraphs: [
      "Earthoria xuất hoá đơn điện tử hợp lệ theo quy định pháp luật Việt Nam cho mọi đơn hàng có yêu cầu, không phân biệt phương thức thanh toán.",
    ],
    list: [
      'Chọn "Yêu cầu xuất hoá đơn (VAT)" và điền đầy đủ thông tin công ty/mã số thuế (nếu xuất cho doanh nghiệp) ngay tại bước đặt hàng, trước khi hoàn tất thanh toán',
      "Hoá đơn điện tử được gửi qua email đăng ký tài khoản trong vòng 3-5 ngày làm việc sau khi đơn hàng được xác nhận thanh toán thành công",
      "Yêu cầu xuất hoá đơn sau khi đơn hàng đã hoàn tất vẫn được hỗ trợ trong vòng 30 ngày kể từ ngày mua, vui lòng liên hệ bộ phận hỗ trợ kèm mã đơn hàng",
      "Thông tin xuất hoá đơn không thể chỉnh sửa sau khi hoá đơn điện tử đã được phát hành theo quy định của cơ quan thuế - vui lòng kiểm tra kỹ trước khi gửi yêu cầu",
    ],
  },
  {
    id: "tien-te-gia",
    num: "10",
    title: "Đơn Vị Tiền Tệ & Giá Hiển Thị",
    paragraphs: [
      "Toàn bộ giá sản phẩm, phí vận chuyển và tổng giá trị đơn hàng trên Earthoria được niêm yết và thanh toán bằng Đồng Việt Nam (VNĐ), đã bao gồm thuế giá trị gia tăng theo quy định hiện hành trừ khi có ghi chú khác.",
    ],
    list: [
      "Khách hàng thanh toán bằng thẻ quốc tế qua VNPay có thể phát sinh chênh lệch tỷ giá hoặc phụ phí chuyển đổi ngoại tệ do ngân hàng phát hành thẻ áp dụng - khoản này nằm ngoài phạm vi kiểm soát của Earthoria",
      "Giá hiển thị tại thời điểm thanh toán là giá cuối cùng áp dụng cho đơn hàng, không thay đổi do biến động giá sau đó",
    ],
  },
  {
    id: "lien-he",
    num: "11",
    title: "Liên Hệ Hỗ Trợ Thanh Toán",
    paragraphs: [
      "Đội ngũ hỗ trợ thanh toán của Earthoria hoạt động từ 8:00 đến 21:00, bảy ngày trong tuần. Khi liên hệ, vui lòng cung cấp mã đơn hàng và ảnh chụp biên lai/lịch sử giao dịch để được xử lý nhanh nhất.",
    ],
  },
];

const FAQS = [
  {
    q: "Tôi có thể đổi phương thức thanh toán sau khi đã đặt hàng không?",
    a: "Nếu đơn hàng chưa hoàn tất thanh toán và vẫn trong thời hạn phiên, bạn có thể huỷ và đặt lại với phương thức khác. Nếu đã thanh toán thành công, việc đổi phương thức không còn khả thi - bạn có thể huỷ đơn theo chính sách huỷ đơn rồi đặt lại nếu đơn chưa được xử lý giao hàng.",
  },
  {
    q: "Earthoria có hỗ trợ trả góp qua thẻ tín dụng không?",
    a: "Hiện tại Earthoria chưa hỗ trợ trả góp trực tiếp trên nền tảng. Một số ngân hàng phát hành thẻ tín dụng có thể tự chuyển đổi giao dịch VNPay của bạn thành trả góp sau khi thanh toán - vui lòng liên hệ trực tiếp ngân hàng phát hành thẻ để biết chi tiết và điều kiện áp dụng.",
  },
  {
    q: "Vì sao đơn hàng của tôi bị huỷ dù tôi đã quét mã QR chuyển khoản?",
    a: "Trường hợp này thường xảy ra khi giao dịch được thực hiện sau khi phiên thanh toán 30 phút đã hết hạn, hoặc nội dung chuyển khoản không đúng cú pháp hệ thống yêu cầu nên không đối soát được tự động. Liên hệ hỗ trợ kèm biên lai chuyển khoản để được xác minh và xử lý thủ công.",
  },
  {
    q: "Thanh toán MoMo/VNPay có mất phí giao dịch không?",
    a: "Earthoria không thu thêm bất kỳ khoản phí nào khi bạn thanh toán qua VNPay, MoMo hay Chuyển khoản QR. Một số ngân hàng hoặc ví điện tử có thể áp dụng phí giao dịch riêng theo chính sách của họ - vui lòng kiểm tra với đơn vị phát hành.",
  },
  {
    q: "Tôi có thể thanh toán một phần bằng ví MoMo và phần còn lại bằng COD không?",
    a: "Không. Mỗi đơn hàng chỉ áp dụng một phương thức thanh toán duy nhất cho toàn bộ giá trị đơn hàng. Nếu muốn dùng nhiều phương thức khác nhau, bạn cần tách thành các đơn hàng riêng biệt.",
  },
];

/*
   COMPONENT
 */
export default function PaymentPolicy() {
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
          font-size: 15px; color: var(--gold); margin-bottom: 6px;
        }
        .legal-callout p {
          font-size: 13px; line-height: 1.8; color: rgba(250,248,243,0.85);
          font-weight: 300; margin: 0;
        }

        .legal-faq-section { background: var(--white); padding: 100px; }
        .legal-faq-inner { max-width: 880px; margin: 0 auto; }
        .legal-faq-list { margin-top: 48px; }
        .legal-faq-item { border-bottom: 0.5px solid var(--border); }
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
        <span className="breadcrumb-current">Chính sách thanh toán</span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="legal-hero">
        <div className="legal-hero-grid" />
        <div className="legal-hero-glow" />
        <div className="legal-hero-watermark">EARTHORIA</div>
        <div className="legal-hero-inner">
          <div className="legal-hero-icon">
            <CreditCard size={22} />
          </div>
          <div className="legal-hero-eyebrow">
            <span className="legal-hero-eyebrow-line" />
            <span>Thanh Toán</span>
            <span className="legal-hero-eyebrow-line" />
          </div>
          <h1 className="legal-hero-title">
            Chính Sách -<br />
            <em>Thanh Toán</em>
          </h1>
          <p className="legal-hero-sub">
            Minh bạch về phương thức, bảo mật và thời hạn xử lý cho mọi giao
            dịch trên Earthoria - từ COD, VNPay, MoMo đến Chuyển khoản QR.
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
              <div className="legal-sidebar-card-title">
                Gặp sự cố thanh toán?
              </div>
              <p>
                Gửi mã đơn hàng và biên lai giao dịch để được hỗ trợ nhanh nhất
                - phản hồi trong 1 ngày làm việc.
              </p>
              <a
                href="mailto:thanhtoan@earthoria.vn"
                className="legal-sidebar-card-link"
              >
                thanhtoan@earthoria.vn
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
            Cần hỗ trợ thanh toán?
          </span>
          <h2 className="legal-contact-title reveal">
            Chúng tôi giải quyết
            <br />
            <em>trong 1 ngày làm việc</em>
          </h2>
          <div className="legal-contact-grid reveal">
            <a
              href="mailto:thanhtoan@earthoria.vn"
              className="legal-contact-item"
            >
              <Mail size={15} />
              thanhtoan@earthoria.vn
            </a>
            <a href="tel:19006868" className="legal-contact-item">
              <Phone size={15} />
              0849324423
            </a>
            <span className="legal-contact-item">
              <MapPin size={15} />
              600 Nguyễn Văn Cừ Nối Dài, An Bình, Cần Thơ 900000
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
