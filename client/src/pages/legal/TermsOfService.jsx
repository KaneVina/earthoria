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

/*
   META & CONTENT DATA
 */
const META = {
  effectiveDate: "01 Tháng 01, 2026",
  updatedDate: "04 Tháng 09, 2026",
  version: "v4.0",
  readTime: "24 phút",
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
    title: "Giới Thiệu & Phạm Vi Áp Dụng",
    paragraphs: [
      'Chào mừng bạn đến với Earthoria — nền tảng sách giáo dục kết hợp công nghệ Thực tế tăng cường (AR) và Trí tuệ nhân tạo (AI), được vận hành bởi Công ty TNHH Earthoria Việt Nam ("Earthoria", "chúng tôi", "chúng ta"). Bằng việc truy cập website, ứng dụng di động, hoặc đặt mua bất kỳ sản phẩm nào của Earthoria, bạn — hoặc phụ huynh/người giám hộ hợp pháp của bạn nếu bạn dưới 18 tuổi — xác nhận đã đọc, hiểu rõ và đồng ý bị ràng buộc bởi toàn bộ Điều khoản Dịch vụ này (sau đây gọi là "Điều khoản"), cùng với Chính sách Bảo mật, Chính sách Cookie và mọi phụ lục, hướng dẫn sử dụng được đăng tải kèm theo.',
      "Điều khoản này cấu thành một thỏa thuận có giá trị pháp lý giữa bạn và Earthoria. Nếu bạn không đồng ý với bất kỳ điều khoản nào dưới đây, vui lòng ngừng truy cập và sử dụng dịch vụ của chúng tôi. Việc bạn tiếp tục sử dụng Dịch vụ sau khi Điều khoản được cập nhật đồng nghĩa với việc bạn đã chấp nhận các thay đổi đó, theo trình tự được quy định tại Điều 23 dưới đây.",
      "Trường hợp có bất kỳ điều khoản riêng nào được ký kết trực tiếp giữa bạn và Earthoria (ví dụ: hợp đồng cung cấp sách cho trường học), điều khoản riêng đó sẽ được ưu tiên áp dụng đối với những nội dung có sự khác biệt, còn lại các nội dung không được quy định trong hợp đồng riêng vẫn tuân theo Điều khoản này.",
    ],
    list: [
      "Áp dụng cho website earthoria.vn và toàn bộ các trang con, tên miền phụ liên quan",
      "Áp dụng cho ứng dụng di động Earthoria AR trên nền tảng iOS và Android, cùng mọi bản cập nhật trong tương lai",
      "Áp dụng cho mọi giao dịch mua hàng, dù thực hiện trực tuyến, qua tổng đài, hay tại các điểm bán đối tác chính hãng",
      "Áp dụng cho mọi hình thức tương tác với đội ngũ Chăm sóc Khách hàng, bao gồm email, điện thoại và mạng xã hội chính thức của Earthoria",
    ],
  },
  {
    id: "dinh-nghia",
    num: "02",
    title: "Định Nghĩa Thuật Ngữ",
    paragraphs: [
      "Để thuận tiện cho việc đọc hiểu, các thuật ngữ viết hoa sau đây được sử dụng xuyên suốt văn bản với ý nghĩa thống nhất như dưới đây, trừ khi ngữ cảnh yêu cầu một cách hiểu khác.",
    ],
    list: [
      '"Dịch vụ" — toàn bộ website, ứng dụng di động, Nội dung AR, Trợ lý AI và các dịch vụ hỗ trợ khách hàng do Earthoria cung cấp',
      '"Sản phẩm" — sách in, học cụ đi kèm và các vật phẩm hữu hình khác được Earthoria bán ra thị trường',
      '"Người dùng" — bất kỳ cá nhân nào truy cập hoặc sử dụng Dịch vụ của Earthoria, bao gồm cả người mua hàng và người sử dụng ứng dụng không phát sinh giao dịch',
      '"Nội dung AR" — mô hình 3D, hoạt ảnh, video và âm thanh được kích hoạt khi quét trang sách hợp lệ bằng camera của ứng dụng',
      '"Trợ lý AI" — hệ thống hội thoại bằng giọng nói được tích hợp trong ứng dụng Earthoria, sử dụng công nghệ xử lý ngôn ngữ tự nhiên',
      '"Nội dung do người dùng tạo" (UGC) — đánh giá, bình luận, câu hỏi, hình ảnh hoặc bất kỳ nội dung nào khác do Người dùng chủ động gửi qua Dịch vụ',
      '"Phụ huynh/Người giám hộ" — người chịu trách nhiệm pháp lý đối với Người dùng chưa đủ 18 tuổi theo quy định của pháp luật Việt Nam',
      '"Tài khoản gia đình" — tài khoản do Phụ huynh khởi tạo, trong đó có thể liên kết nhiều hồ sơ trẻ em để quản lý tập trung',
      '"Đối tác vận chuyển" — đơn vị cung cấp dịch vụ logistics độc lập được Earthoria ủy quyền thực hiện giao nhận hàng hóa',
      '"Ngày làm việc" — các ngày từ Thứ Hai đến Thứ Sáu, không bao gồm ngày lễ, Tết theo lịch nghỉ chính thức của Nhà nước Việt Nam',
      '"Sự kiện Bất khả kháng" — sự kiện xảy ra khách quan, không thể lường trước và không thể khắc phục được dù đã áp dụng mọi biện pháp cần thiết trong khả năng cho phép',
      '"Dữ liệu cá nhân" — thông tin dưới dạng ký hiệu, chữ viết, chữ số, hình ảnh, âm thanh gắn liền với một con người cụ thể hoặc giúp xác định một con người cụ thể, theo định nghĩa tại Nghị định 13/2023/NĐ-CP',
    ],
  },
  {
    id: "tai-khoan",
    num: "03",
    title: "Tài Khoản & Điều Kiện Sử Dụng",
    paragraphs: [
      "Để mua hàng hoặc sử dụng đầy đủ tính năng AR/AI, bạn cần tạo một tài khoản Earthoria với thông tin chính xác, đầy đủ và được cập nhật thường xuyên. Tài khoản gắn liền với một gia đình hoặc cá nhân cụ thể và không được chia sẻ cho mục đích thương mại.",
      "Khi đăng ký, bạn cam kết cung cấp họ tên, địa chỉ email, số điện thoại và các thông tin khác một cách trung thực. Earthoria không chịu trách nhiệm đối với bất kỳ hậu quả nào phát sinh từ việc bạn cung cấp thông tin sai lệch hoặc không đầy đủ.",
    ],
    callout: {
      title: "Người dùng dưới 13 tuổi",
      text: "Trẻ em dưới 13 tuổi không được phép tự tạo tài khoản. Mọi hoạt động sử dụng ứng dụng AR/AI của trẻ phải được thực hiện dưới sự giám sát trực tiếp của phụ huynh, thông qua Tài khoản gia đình do phụ huynh quản lý và chịu trách nhiệm.",
    },
    list: [
      "Bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động diễn ra trên tài khoản của mình, kể cả khi hoạt động đó không do chính bạn thực hiện nhưng xuất phát từ việc để lộ thông tin đăng nhập",
      "Một tài khoản chỉ dành cho một gia đình hoặc cá nhân, không được chuyển nhượng, cho thuê hoặc bán lại cho bên thứ ba dưới bất kỳ hình thức nào",
      "Earthoria có quyền yêu cầu xác minh danh tính bằng giấy tờ hợp lệ khi phát hiện dấu hiệu sử dụng bất thường hoặc nghi ngờ gian lận",
      "Bạn phải thông báo ngay cho Earthoria qua kênh hỗ trợ chính thức nếu phát hiện tài khoản bị truy cập trái phép",
      "Earthoria có quyền từ chối đăng ký hoặc yêu cầu bổ sung thông tin đối với các tài khoản có dấu hiệu không hợp lệ",
    ],
  },
  {
    id: "bao-ve-tre-em",
    num: "04",
    title: "Bảo Vệ Trẻ Em & Vai Trò Giám Sát Của Phụ Huynh",
    paragraphs: [
      "Vì phần lớn Người dùng của Earthoria là trẻ em, chúng tôi đặt việc bảo vệ trẻ em làm nguyên tắc trung tâm khi thiết kế sản phẩm, thu thập dữ liệu và vận hành Dịch vụ, phù hợp với tinh thần của Luật Trẻ em 2016 và các văn bản hướng dẫn thi hành.",
      "Phụ huynh/Người giám hộ chịu trách nhiệm quyết định việc con em mình sử dụng Dịch vụ ở mức độ nào, thời lượng ra sao, và có quyền giới hạn hoặc thu hồi quyền truy cập bất kỳ lúc nào thông qua Tài khoản gia đình.",
    ],
    callout: {
      title: "Cam kết của Earthoria đối với trẻ em",
      text: "Earthoria không hiển thị quảng cáo hướng đến trẻ em trong ứng dụng, không yêu cầu trẻ em cung cấp thông tin cá nhân vượt quá mức cần thiết để vận hành tính năng, và không bán hoặc cho thuê dữ liệu của trẻ em cho bên thứ ba vì mục đích thương mại.",
    },
    list: [
      "Ứng dụng khuyến nghị thời lượng sử dụng liên tục không quá 30 phút cho trẻ dưới 8 tuổi và có tính năng nhắc nhở nghỉ ngơi định kỳ",
      "Nội dung AR và phản hồi của Trợ lý AI được kiểm duyệt theo tiêu chuẩn phù hợp lứa tuổi trước khi phát hành",
      "Phụ huynh có thể xem lại lịch sử sử dụng, tắt micro/camera, hoặc xóa hồ sơ của con bất kỳ lúc nào trong phần cài đặt Tài khoản gia đình",
      "Trường hợp phát hiện nội dung không phù hợp trong ứng dụng, vui lòng báo cáo ngay cho Earthoria để được xử lý và gỡ bỏ trong thời gian sớm nhất",
      "Earthoria khuyến khích phụ huynh đồng hành cùng con trong những lần sử dụng đầu tiên để làm quen với các tính năng của sản phẩm",
    ],
  },
  {
    id: "dat-hang",
    num: "05",
    title: "Đặt Hàng, Giá Cả & Thanh Toán",
    paragraphs: [
      "Mọi đơn hàng đặt qua website hoặc ứng dụng đều tuân theo quy trình xác nhận hai bước nhằm hạn chế sai sót trước khi giao dịch được xử lý chính thức. Việc bạn hoàn tất đặt hàng cấu thành một đề nghị giao kết hợp đồng, và hợp đồng chỉ được xác lập khi Earthoria gửi email xác nhận đơn hàng.",
    ],
    list: [
      "Giá hiển thị đã bao gồm thuế VAT, có thể thay đổi mà không cần báo trước nhưng không áp dụng hồi tố cho đơn hàng đã đặt trước thời điểm thay đổi",
      "Earthoria chấp nhận thanh toán qua thẻ tín dụng/ghi nợ, ví điện tử, chuyển khoản ngân hàng và thanh toán khi nhận hàng (COD) tùy khu vực",
      "Đơn hàng chỉ được xác nhận sau khi thanh toán thành công, trừ trường hợp chọn hình thức COD",
      "Earthoria có quyền hủy đơn hàng nếu phát hiện lỗi hiển thị giá, hết hàng ngoài dự kiến hoặc dấu hiệu gian lận, kèm theo hoàn tiền đầy đủ trong mọi trường hợp",
      "Hóa đơn điện tử được xuất theo yêu cầu và gửi qua email đăng ký trong vòng 3 ngày làm việc kể từ khi đơn hàng hoàn tất",
      "Mọi giao dịch được thực hiện bằng đồng Việt Nam (VNĐ), trừ khi có thỏa thuận khác bằng văn bản",
    ],
  },
  {
    id: "van-chuyen",
    num: "06",
    title: "Vận Chuyển & Giao Nhận",
    paragraphs: [
      "Thời gian giao hàng dự kiến từ 2–5 ngày làm việc đối với khu vực nội thành và 3–7 ngày làm việc đối với các khu vực còn lại, tùy thuộc vào Đối tác vận chuyển tại thời điểm giao hàng. Thời gian nêu trên chỉ mang tính chất tham khảo và không cấu thành cam kết ràng buộc về mặt thời hạn.",
    ],
    list: [
      "Miễn phí vận chuyển áp dụng cho đơn hàng từ 500.000đ trở lên trên toàn quốc",
      "Earthoria không chịu trách nhiệm cho sự chậm trễ phát sinh do Sự kiện Bất khả kháng hoặc lỗi từ phía Đối tác vận chuyển nằm ngoài khả năng kiểm soát hợp lý của chúng tôi",
      "Vui lòng kiểm tra tình trạng sản phẩm ngay khi nhận hàng và phản hồi trong vòng 24 giờ nếu phát hiện hư hỏng, thiếu sót hoặc giao sai sản phẩm",
      "Trường hợp giao hàng không thành công do thông tin liên hệ không chính xác hoặc không có người nhận sau 3 lần liên hệ, đơn hàng sẽ được hoàn về kho và chi phí vận chuyển hai chiều có thể được khấu trừ khi hoàn tiền",
      "Bạn có thể theo dõi trạng thái đơn hàng theo thời gian thực thông qua mục 'Đơn hàng của tôi' trên ứng dụng hoặc website",
    ],
  },
  {
    id: "doi-tra",
    num: "07",
    title: "Đổi Trả, Hoàn Tiền & Bảo Hành",
    paragraphs: [
      "Chúng tôi mong muốn mỗi cuốn sách Earthoria mang lại trải nghiệm trọn vẹn cho cả gia đình bạn. Nếu sản phẩm chưa đáp ứng kỳ vọng, chính sách đổi trả dưới đây sẽ giúp bạn an tâm hơn khi mua sắm, phù hợp với quy định tại Luật Bảo vệ quyền lợi người tiêu dùng.",
    ],
    list: [
      "Đổi trả miễn phí trong vòng 30 ngày kể từ ngày nhận hàng nếu sản phẩm còn nguyên vẹn, chưa qua sử dụng và còn đầy đủ mã kích hoạt chưa được kích hoạt",
      "Hoàn tiền được xử lý trong 5–10 ngày làm việc sau khi Earthoria nhận lại sản phẩm hợp lệ và hoàn tất kiểm tra chất lượng",
      "Sản phẩm lỗi do nhà sản xuất được đổi mới hoàn toàn miễn phí trong vòng 12 tháng kể từ ngày mua, không tính phí vận chuyển hai chiều",
      "Mã kích hoạt AR đi kèm mỗi cuốn sách là duy nhất và không thể tái sử dụng sau khi sản phẩm đã được đổi trả hoặc hoàn tiền",
      "Sản phẩm được mua trong các chương trình khuyến mãi đặc biệt có thể áp dụng chính sách đổi trả riêng, được nêu rõ tại thời điểm mua hàng",
      "Chi phí vận chuyển chiều trả hàng do lỗi từ phía Earthoria (giao sai, sản phẩm lỗi) sẽ do Earthoria chi trả; các trường hợp đổi ý sẽ do Người dùng chi trả",
    ],
  },
  {
    id: "khuyen-mai",
    num: "08",
    title: "Chương Trình Khuyến Mãi, Mã Giảm Giá & Thẻ Quà Tặng",
    paragraphs: [
      "Từ thời gian này qua thời gian khác, Earthoria có thể triển khai các chương trình khuyến mãi, mã giảm giá hoặc phát hành thẻ quà tặng. Mỗi chương trình có thể đi kèm điều kiện áp dụng riêng, được công bố cụ thể tại thời điểm triển khai và được xem là một phần bổ sung của Điều khoản này.",
    ],
    list: [
      "Mã giảm giá chỉ áp dụng cho một đơn hàng duy nhất, không quy đổi thành tiền mặt và không cộng dồn với chương trình khuyến mãi khác trừ khi có thông báo riêng",
      "Thẻ quà tặng có giá trị sử dụng trong 12 tháng kể từ ngày phát hành và không được hoàn lại bằng tiền mặt",
      "Earthoria có quyền từ chối áp dụng khuyến mãi hoặc hủy đơn hàng nếu phát hiện hành vi lạm dụng mã giảm giá, tạo tài khoản ảo hoặc gian lận dưới mọi hình thức",
      "Chương trình giới thiệu bạn bè (nếu có) chỉ áp dụng cho các lượt giới thiệu hợp lệ, không phát sinh từ hành vi mua bán tài khoản hoặc mã giới thiệu",
    ],
  },
  {
    id: "don-hang-truong-hoc",
    num: "09",
    title: "Đơn Hàng Dành Cho Trường Học & Tổ Chức Giáo Dục",
    paragraphs: [
      "Earthoria cung cấp chương trình đặt hàng số lượng lớn dành riêng cho trường học, thư viện và các tổ chức giáo dục, với mức giá và điều kiện thanh toán có thể khác biệt so với đơn hàng cá nhân thông thường.",
    ],
    list: [
      "Đơn hàng từ 50 cuốn trở lên được xem xét áp dụng chính sách giá sỉ theo thỏa thuận riêng giữa Earthoria và tổ chức đặt hàng",
      "Tổ chức giáo dục có thể yêu cầu hợp đồng mua bán riêng với điều khoản thanh toán trả sau, phù hợp quy trình tài chính của đơn vị công lập hoặc tư thục",
      "Giấy phép sử dụng Nội dung AR cho mục đích trình chiếu trong lớp học được cấp miễn phí kèm theo đơn hàng, nhưng không bao gồm quyền sao chép hoặc phân phối lại cho bên ngoài tổ chức",
      "Mọi yêu cầu hợp tác, tài trợ sách hoặc chương trình giáo dục cộng đồng vui lòng liên hệ trực tiếp bộ phận Quan hệ Đối tác Giáo dục của Earthoria",
    ],
  },
  {
    id: "ung-dung-ar",
    num: "10",
    title: "Ứng Dụng AR/AI Earthoria — Quy Tắc Sử Dụng",
    paragraphs: [
      "Ứng dụng Earthoria yêu cầu quyền truy cập camera và micro của thiết bị để kích hoạt Nội dung AR và Trợ lý AI. Các quyền này chỉ được sử dụng cho đúng mục đích giáo dục đã công bố và không được sử dụng để theo dõi người dùng ngoài phạm vi phiên sử dụng ứng dụng.",
    ],
    list: [
      "Quyền truy cập camera và micro có thể được thu hồi bất kỳ lúc nào trong phần cài đặt của thiết bị mà không ảnh hưởng đến các tính năng đọc sách cơ bản",
      "Nội dung AR chỉ tương thích với sách Earthoria chính hãng có mã QR hợp lệ đi kèm; sách photo, sách lậu hoặc đã qua chỉnh sửa sẽ không thể kích hoạt tính năng này",
      "Nghiêm cấm sử dụng ứng dụng để quét hoặc sao chép nội dung từ các ấn phẩm không thuộc sở hữu của Earthoria",
      "Ứng dụng cần kết nối internet để tải Nội dung AR lần đầu; sau đó một số nội dung có thể được lưu trữ cục bộ để sử dụng ngoại tuyến",
      "Earthoria khuyến nghị sử dụng ứng dụng trong không gian đủ ánh sáng và có người lớn giám sát đối với trẻ nhỏ để đảm bảo an toàn khi di chuyển theo hướng dẫn tương tác",
    ],
  },
  {
    id: "tro-ly-ai",
    num: "11",
    title: "Trợ Lý AI — Xử Lý Dữ Liệu & Giới Hạn Trách Nhiệm",
    paragraphs: [
      "Trợ lý AI được xây dựng nhằm hỗ trợ trẻ em học tập thông qua hội thoại bằng giọng nói. Do bản chất của công nghệ trí tuệ nhân tạo tạo sinh, phản hồi của Trợ lý AI có thể đôi khi không hoàn toàn chính xác hoặc phù hợp với ngữ cảnh mong muốn.",
    ],
    callout: {
      title: "Lưu ý quan trọng về Trợ lý AI",
      text: "Trợ lý AI được thiết kế riêng cho mục đích giáo dục trẻ em và không lưu trữ vĩnh viễn nội dung hội thoại bằng giọng nói dưới dạng có thể nhận diện danh tính. Chi tiết đầy đủ về cách dữ liệu giọng nói được xử lý được trình bày tại Chính sách Bảo mật của chúng tôi.",
    },
    list: [
      "Trợ lý AI chỉ ghi âm khi được chủ động kích hoạt bằng thao tác của người dùng, không ghi âm liên tục hoặc ở chế độ nền",
      "Nội dung do Trợ lý AI tạo ra không thay thế cho hướng dẫn của giáo viên, phụ huynh hoặc chuyên gia giáo dục, và không nên được xem là nguồn thông tin duy nhất cho các quyết định quan trọng",
      "Earthoria liên tục rà soát và cải thiện chất lượng phản hồi của Trợ lý AI, nhưng không đảm bảo Trợ lý AI sẽ không bao giờ tạo ra nội dung sai lệch hoặc không phù hợp",
      "Nếu phát hiện Trợ lý AI phản hồi nội dung không phù hợp, vui lòng báo cáo ngay qua ứng dụng để đội ngũ kỹ thuật kiểm tra và điều chỉnh",
      "Người dùng không được sử dụng Trợ lý AI để yêu cầu thông tin nằm ngoài phạm vi giáo dục đã công bố, bao gồm nội dung bạo lực, phản cảm hoặc trái pháp luật",
    ],
  },
  {
    id: "so-huu-tri-tue",
    num: "12",
    title: "Quyền Sở Hữu Trí Tuệ",
    paragraphs: [
      "Toàn bộ nội dung trên website, ứng dụng và trong các ấn phẩm sách — bao gồm văn bản, hình minh họa, mô hình 3D, âm thanh, mã nguồn và thiết kế giao diện — là tài sản trí tuệ của Earthoria hoặc được cấp phép sử dụng hợp pháp từ các đối tác sáng tạo, được bảo hộ theo Luật Sở hữu trí tuệ Việt Nam và các điều ước quốc tế liên quan.",
    ],
    list: [
      "Bạn được phép sử dụng nội dung cho mục đích cá nhân, gia đình và giáo dục phi thương mại, ví dụ như trình chiếu trong lớp học hoặc chia sẻ trong phạm vi gia đình",
      "Nghiêm cấm sao chép, phân phối lại, cho thuê, bán lại hoặc thương mại hóa nội dung dưới mọi hình thức khi chưa có sự đồng ý bằng văn bản từ Earthoria",
      'Logo, tên thương hiệu "Earthoria" và toàn bộ hệ thống nhận diện liên quan được bảo hộ độc quyền theo luật sở hữu trí tuệ hiện hành',
      "Mọi phản hồi, ý tưởng hoặc đề xuất bạn gửi cho Earthoria liên quan đến sản phẩm có thể được chúng tôi sử dụng để cải tiến dịch vụ mà không phát sinh nghĩa vụ bồi hoàn, trừ khi có thỏa thuận khác",
      "Nếu bạn cho rằng quyền sở hữu trí tuệ của mình bị xâm phạm bởi nội dung trên nền tảng Earthoria, vui lòng liên hệ theo thông tin tại Điều 25 để được xem xét, xử lý",
    ],
  },
  {
    id: "noi-dung-nguoi-dung",
    num: "13",
    title: "Nội Dung Do Người Dùng Tạo",
    paragraphs: [
      "Earthoria có thể cho phép Người dùng gửi đánh giá sản phẩm, bình luận, câu hỏi hoặc hình ảnh trải nghiệm thông qua ứng dụng và website. Việc gửi Nội dung do người dùng tạo đồng nghĩa với việc bạn xác nhận quyền hợp pháp đối với nội dung đó.",
    ],
    list: [
      "Bằng việc gửi Nội dung do người dùng tạo, bạn cấp cho Earthoria quyền không độc quyền, miễn phí bản quyền để sử dụng, hiển thị và chỉnh sửa nội dung đó nhằm mục đích quảng bá sản phẩm và cải thiện Dịch vụ",
      "Earthoria có quyền kiểm duyệt, chỉnh sửa hoặc gỡ bỏ Nội dung do người dùng tạo mà không cần thông báo trước nếu nội dung vi phạm Điều 14 dưới đây",
      "Không được đăng tải thông tin cá nhân của trẻ em (họ tên đầy đủ, trường học, địa chỉ) trong phần đánh giá công khai nhằm bảo vệ sự an toàn của các em",
      "Earthoria không chịu trách nhiệm về tính chính xác của Nội dung do người dùng tạo và không xác nhận đây là quan điểm chính thức của công ty",
    ],
  },
  {
    id: "hanh-vi-cam",
    num: "14",
    title: "Hành Vi Bị Nghiêm Cấm",
    paragraphs: [
      "Khi sử dụng Dịch vụ, bạn đồng ý không thực hiện bất kỳ hành vi nào dưới đây, nhằm bảo vệ một môi trường an toàn và lành mạnh cho mọi gia đình sử dụng Earthoria.",
    ],
    list: [
      "Giả mạo danh tính hoặc cung cấp thông tin sai lệch khi đăng ký tài khoản",
      "Sử dụng phần mềm tự động (bot) nhằm mua hàng số lượng lớn cho mục đích đầu cơ hoặc thao túng chương trình khuyến mãi",
      "Can thiệp, dịch ngược, giải mã hoặc cố gắng trích xuất mã nguồn của ứng dụng AR/AI",
      "Đăng tải nội dung phản cảm, bạo lực, phân biệt đối xử hoặc không phù hợp với trẻ em vào mục đánh giá sản phẩm hoặc bất kỳ khu vực tương tác nào khác",
      "Sử dụng Dịch vụ cho bất kỳ mục đích nào trái với quy định của pháp luật Việt Nam hoặc xâm phạm quyền của bên thứ ba",
      "Cố ý phát tán mã độc, thực hiện tấn công từ chối dịch vụ hoặc các hành vi khác gây ảnh hưởng đến tính ổn định, bảo mật của hệ thống Earthoria",
      "Sử dụng hình ảnh, giọng nói hoặc thông tin của trẻ em thu được qua ứng dụng cho bất kỳ mục đích nào ngoài phạm vi sử dụng cá nhân, gia đình",
    ],
  },
  {
    id: "bao-mat-du-lieu",
    num: "15",
    title: "Bảo Mật & Bảo Vệ Dữ Liệu Cá Nhân",
    paragraphs: [
      "Earthoria cam kết thu thập, xử lý và lưu trữ Dữ liệu cá nhân của Người dùng phù hợp với Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân và các quy định pháp luật hiện hành khác của Việt Nam. Chi tiết đầy đủ về loại dữ liệu thu thập, mục đích xử lý, thời gian lưu trữ và quyền của chủ thể dữ liệu được trình bày tại Chính sách Bảo mật, là một phần không tách rời của Điều khoản này.",
    ],
    list: [
      "Bạn có quyền yêu cầu truy cập, chỉnh sửa, hạn chế xử lý hoặc yêu cầu xóa Dữ liệu cá nhân của mình hoặc của con em mình theo quy định pháp luật",
      "Đối với dữ liệu của trẻ em, Earthoria chỉ xử lý khi có sự đồng ý của Phụ huynh/Người giám hộ và luôn xử lý ở mức tối thiểu cần thiết để vận hành tính năng",
      "Earthoria áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu khỏi truy cập trái phép, mất mát hoặc rò rỉ",
      "Trong trường hợp xảy ra sự cố lộ, mất Dữ liệu cá nhân có khả năng gây ảnh hưởng đến quyền và lợi ích của Người dùng, Earthoria sẽ thông báo theo thời hạn và trình tự quy định tại pháp luật hiện hành",
      "Mọi yêu cầu liên quan đến quyền dữ liệu cá nhân vui lòng gửi qua địa chỉ email được nêu tại Điều 25",
    ],
  },
  {
    id: "lien-ket-ben-thu-ba",
    num: "16",
    title: "Liên Kết & Dịch Vụ Bên Thứ Ba",
    paragraphs: [
      "Dịch vụ của Earthoria có thể chứa liên kết đến website, ứng dụng hoặc dịch vụ do bên thứ ba vận hành, bao gồm cổng thanh toán, đơn vị vận chuyển và nền tảng mạng xã hội.",
    ],
    list: [
      "Earthoria không kiểm soát và không chịu trách nhiệm về nội dung, chính sách bảo mật hoặc hoạt động của các bên thứ ba này",
      "Việc bạn tương tác với dịch vụ bên thứ ba tuân theo điều khoản và chính sách riêng của bên đó, không thuộc phạm vi điều chỉnh của văn bản này",
      "Earthoria khuyến nghị bạn đọc kỹ điều khoản của bên thứ ba trước khi cung cấp thông tin cá nhân hoặc thực hiện giao dịch với họ",
    ],
  },
  {
    id: "cham-dut",
    num: "17",
    title: "Tạm Ngưng & Chấm Dứt Tài Khoản",
    paragraphs: [
      "Earthoria có quyền tạm ngưng hoặc chấm dứt tài khoản vi phạm nghiêm trọng các điều khoản này, tùy theo mức độ và tính chất của vi phạm được ghi nhận. Bạn cũng có quyền yêu cầu chấm dứt tài khoản của mình bất kỳ lúc nào.",
    ],
    list: [
      "Vi phạm sẽ được thông báo qua email đăng ký trước khi có hành động tạm ngưng, trừ trường hợp khẩn cấp ảnh hưởng đến an toàn của trẻ em hoặc người dùng khác",
      "Bạn có quyền yêu cầu giải trình trong vòng 7 ngày kể từ khi nhận được thông báo",
      "Việc chấm dứt tài khoản không ảnh hưởng đến các quyền lợi đã phát sinh trước đó, ví dụ như đơn hàng đang trong quá trình vận chuyển hoặc yêu cầu bảo hành đang xử lý",
      "Khi tài khoản bị chấm dứt, Dữ liệu cá nhân sẽ được xử lý theo thời hạn lưu trữ quy định tại Chính sách Bảo mật, trừ những dữ liệu pháp luật yêu cầu phải lưu giữ lâu hơn",
      "Để yêu cầu chấm dứt tài khoản, bạn có thể thực hiện trực tiếp trong phần cài đặt ứng dụng hoặc liên hệ đội ngũ hỗ trợ",
    ],
  },
  {
    id: "bat-kha-khang",
    num: "18",
    title: "Sự Kiện Bất Khả Kháng",
    paragraphs: [
      "Earthoria được miễn trừ trách nhiệm đối với việc chậm trễ hoặc không thể thực hiện nghĩa vụ theo Điều khoản này nếu nguyên nhân xuất phát từ Sự kiện Bất khả kháng, bao gồm nhưng không giới hạn ở thiên tai, dịch bệnh, hỏa hoạn, chiến tranh, bạo loạn, thay đổi chính sách pháp luật đột ngột, sự cố hạ tầng viễn thông diện rộng hoặc quyết định của cơ quan nhà nước có thẩm quyền.",
    ],
    list: [
      "Bên bị ảnh hưởng bởi Sự kiện Bất khả kháng phải thông báo cho bên còn lại trong thời gian sớm nhất có thể và áp dụng mọi biện pháp hợp lý để giảm thiểu thiệt hại",
      "Nghĩa vụ bị ảnh hưởng sẽ được tạm hoãn trong thời gian Sự kiện Bất khả kháng diễn ra và được tiếp tục thực hiện ngay khi sự kiện chấm dứt",
      "Nếu Sự kiện Bất khả kháng kéo dài quá 60 ngày liên tục, mỗi bên có quyền chấm dứt giao dịch liên quan mà không phải bồi thường, kèm theo hoàn trả các khoản đã thanh toán tương ứng với phần nghĩa vụ chưa thực hiện",
    ],
  },
  {
    id: "gioi-han-trach-nhiem",
    num: "19",
    title: "Giới Hạn Trách Nhiệm & Miễn Trừ Bảo Đảm",
    paragraphs: [
      'Dịch vụ được cung cấp trên cơ sở "nguyên trạng" và "trong khả năng sẵn có". Trong phạm vi pháp luật cho phép, Earthoria không chịu trách nhiệm cho các thiệt hại gián tiếp, ngẫu nhiên, đặc biệt hoặc hệ quả phát sinh từ việc sử dụng hoặc không thể sử dụng Dịch vụ.',
    ],
    callout: {
      title: "Giới hạn không áp dụng cho một số trường hợp",
      text: "Điều khoản giới hạn trách nhiệm tại mục này không áp dụng đối với thiệt hại do lỗi cố ý hoặc do vi phạm nghiêm trọng nghĩa vụ bảo vệ an toàn trẻ em của Earthoria, cũng như không loại trừ bất kỳ trách nhiệm nào mà pháp luật Việt Nam không cho phép loại trừ.",
    },
    list: [
      "Earthoria không đảm bảo ứng dụng AR hoạt động hoàn hảo trên mọi dòng thiết bị và phiên bản hệ điều hành, do sự đa dạng của thiết bị trên thị trường",
      "Earthoria không đảm bảo Dịch vụ sẽ không bị gián đoạn, không có lỗi hoặc luôn có sẵn tại mọi thời điểm",
      "Trách nhiệm tài chính tối đa của Earthoria trong mọi trường hợp phát sinh từ một đơn hàng được giới hạn ở giá trị đơn hàng liên quan trực tiếp đến khiếu nại đó",
      "Người dùng chịu trách nhiệm sử dụng thiết bị điện tử (điện thoại, máy tính bảng) đúng hướng dẫn của nhà sản xuất thiết bị khi sử dụng ứng dụng Earthoria",
    ],
  },
  {
    id: "boi-thuong",
    num: "20",
    title: "Bồi Thường",
    paragraphs: [
      "Bạn đồng ý bồi thường và giữ Earthoria, đội ngũ nhân viên, người quản lý cùng các đối tác liên quan vô hại trước mọi khiếu nại, tổn thất, trách nhiệm pháp lý hoặc chi phí hợp lý (bao gồm phí luật sư) phát sinh từ việc bạn vi phạm Điều khoản này, vi phạm quyền của bên thứ ba, hoặc sử dụng Dịch vụ sai mục đích đã công bố.",
    ],
  },
  {
    id: "dieu-khoan-chung",
    num: "21",
    title: "Điều Khoản Chung",
    paragraphs: [
      "Các quy định dưới đây áp dụng chung cho toàn bộ Điều khoản này nhằm đảm bảo tính rõ ràng và khả năng thực thi trên thực tế.",
    ],
    list: [
      "Hiệu lực từng phần: Nếu bất kỳ điều khoản nào trong văn bản này bị tuyên vô hiệu hoặc không thể thực thi bởi cơ quan có thẩm quyền, các điều khoản còn lại vẫn giữ nguyên hiệu lực",
      "Từ bỏ quyền: Việc Earthoria không thực hiện ngay một quyền theo Điều khoản này không đồng nghĩa với việc từ bỏ quyền đó trong tương lai",
      "Chuyển nhượng: Bạn không được chuyển nhượng quyền và nghĩa vụ theo Điều khoản này cho bên thứ ba mà không có sự đồng ý trước bằng văn bản của Earthoria; Earthoria có quyền chuyển nhượng trong trường hợp tái cấu trúc, sáp nhập hoặc chuyển nhượng doanh nghiệp",
      "Toàn bộ thỏa thuận: Điều khoản này, cùng Chính sách Bảo mật và các phụ lục liên quan, cấu thành toàn bộ thỏa thuận giữa bạn và Earthoria về việc sử dụng Dịch vụ, thay thế mọi thỏa thuận hoặc trao đổi trước đó về cùng nội dung",
      "Ngôn ngữ: Điều khoản này được soạn thảo bằng tiếng Việt; bản dịch sang ngôn ngữ khác (nếu có) chỉ nhằm mục đích tham khảo, bản tiếng Việt được ưu tiên áp dụng khi có sự khác biệt",
    ],
  },
  {
    id: "thong-bao",
    num: "22",
    title: "Thông Báo & Liên Lạc Điện Tử",
    paragraphs: [
      "Bằng việc tạo tài khoản, bạn đồng ý nhận thông báo từ Earthoria qua phương thức điện tử, bao gồm email, thông báo đẩy (push notification) trên ứng dụng và tin nhắn SMS.",
    ],
    list: [
      "Thông báo giao dịch (xác nhận đơn hàng, cập nhật vận chuyển, thay đổi Điều khoản) được gửi bắt buộc và không thể tắt hoàn toàn",
      "Thông báo tiếp thị, khuyến mãi có thể được tùy chỉnh hoặc hủy đăng ký bất kỳ lúc nào trong phần cài đặt tài khoản hoặc qua liên kết hủy đăng ký trong email",
      "Mọi thông báo pháp lý gửi cho Earthoria phải được thực hiện bằng văn bản qua địa chỉ email hoặc địa chỉ liên hệ được nêu tại Điều 25 để được xem là hợp lệ",
    ],
  },
  {
    id: "thay-doi-dieu-khoan",
    num: "23",
    title: "Thay Đổi Điều Khoản",
    paragraphs: [
      "Chúng tôi có thể cập nhật Điều khoản này theo thời gian để phản ánh thay đổi pháp lý hoặc cải tiến dịch vụ. Phiên bản cập nhật sẽ luôn được đăng tải tại trang này kèm theo ngày hiệu lực mới và số phiên bản tương ứng.",
    ],
    list: [
      "Thay đổi quan trọng ảnh hưởng đến quyền lợi của bạn sẽ được thông báo qua email ít nhất 14 ngày trước khi có hiệu lực",
      "Đối với thay đổi liên quan trực tiếp đến việc xử lý dữ liệu của trẻ em, Earthoria sẽ yêu cầu Phụ huynh xác nhận đồng ý lại nếu pháp luật yêu cầu",
      "Việc tiếp tục sử dụng Dịch vụ sau ngày hiệu lực mới đồng nghĩa với việc bạn đã chấp nhận các điều khoản đã cập nhật; nếu không đồng ý, bạn có quyền ngừng sử dụng và yêu cầu chấm dứt tài khoản trước ngày hiệu lực",
    ],
  },
  {
    id: "luat-ap-dung",
    num: "24",
    title: "Luật Áp Dụng & Giải Quyết Tranh Chấp",
    paragraphs: [
      "Điều khoản này được điều chỉnh và giải thích theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Mọi tranh chấp phát sinh từ hoặc liên quan đến Điều khoản này sẽ được ưu tiên giải quyết thông qua thương lượng thiện chí giữa hai bên.",
    ],
    list: [
      "Trong vòng 30 ngày kể từ khi phát sinh tranh chấp, hai bên sẽ tiến hành trao đổi trực tiếp hoặc qua văn bản nhằm tìm kiếm giải pháp thỏa đáng",
      "Trường hợp không đạt được thỏa thuận sau thời gian thương lượng, tranh chấp sẽ được đưa ra Trung tâm Trọng tài Quốc tế Việt Nam (VIAC) để giải quyết theo quy tắc tố tụng trọng tài hiện hành, hoặc Tòa án có thẩm quyền tại Thành phố Hồ Chí Minh nếu các bên không có thỏa thuận trọng tài",
      "Chi phí giải quyết tranh chấp do bên thua kiện chi trả, trừ khi cơ quan giải quyết tranh chấp có quyết định khác",
      "Đối với Người dùng là người tiêu dùng cá nhân, quyền khiếu nại đến cơ quan bảo vệ người tiêu dùng theo quy định pháp luật vẫn được đảm bảo song song với quyền thương lượng nêu trên",
    ],
  },
  {
    id: "lien-he",
    num: "25",
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
    a: "Trợ lý AI chỉ ghi âm khi được chủ động kích hoạt và không lưu trữ vĩnh viễn nội dung hội thoại dưới dạng có thể nhận diện danh tính. Chi tiết đầy đủ được trình bày trong Chính sách Bảo mật của chúng tôi.",
  },
  {
    q: "Tôi có thể dùng hình ảnh từ sách cho lớp học của mình không?",
    a: "Hoàn toàn được, miễn là cho mục đích giáo dục phi thương mại như trình chiếu trong lớp học. Việc sao chép để bán lại hoặc phân phối thương mại đều không được phép.",
  },
  {
    q: "Điều gì xảy ra nếu tôi vi phạm điều khoản sử dụng?",
    a: "Tùy mức độ vi phạm, tài khoản có thể bị tạm ngưng hoặc chấm dứt sau khi đã được thông báo, trừ trường hợp khẩn cấp liên quan đến an toàn trẻ em. Bạn luôn có quyền giải trình trong vòng 7 ngày.",
  },
  {
    q: "Earthoria có quyền thay đổi giá sau khi tôi đã đặt hàng không?",
    a: "Không. Giá tại thời điểm bạn hoàn tất đơn hàng sẽ được giữ nguyên cho đơn hàng đó, kể cả khi giá niêm yết thay đổi sau này.",
  },
  {
    q: "Trường học của chúng tôi muốn đặt sách số lượng lớn, cần liên hệ thế nào?",
    a: "Với đơn hàng từ 50 cuốn trở lên, vui lòng liên hệ bộ phận Quan hệ Đối tác Giáo dục để nhận báo giá sỉ và điều khoản thanh toán phù hợp với quy trình tài chính của đơn vị bạn.",
  },
  {
    q: "Tôi muốn yêu cầu xóa dữ liệu cá nhân của con mình thì làm sao?",
    a: "Bạn có thể tự thực hiện trong phần cài đặt Tài khoản gia đình, hoặc gửi yêu cầu qua email hỗ trợ. Earthoria sẽ xử lý theo đúng thời hạn quy định tại Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.",
  },
  {
    q: "Nếu ứng dụng ngừng hoạt động, sách giấy của tôi có còn dùng được không?",
    a: "Có. Sách giấy vẫn có thể đọc và sử dụng bình thường như một cuốn sách thông thường. Chỉ riêng phần trải nghiệm AR/AI đi kèm sẽ phụ thuộc vào việc ứng dụng còn được vận hành hay không, và chúng tôi sẽ luôn thông báo trước nếu có kế hoạch ngừng một tính năng.",
  },
];

/*
   COMPONENT
 */
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
        <div
          className="legal-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">
          Trang chủ
        </Link>
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
            Những quy định rõ ràng, công bằng để bạn và gia đình yên tâm khám
            phá thế giới Earthoria — từ trang sách đầu tiên đến trải nghiệm AR
            sống động.
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
            <div className="legal-hero-meta-item">
              <BookOpen size={13} />
              Thời gian đọc <strong>{META.readTime}</strong>
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
              <div className="legal-sidebar-card-title">Cần hỗ trợ thêm?</div>
              <p>
                Đội ngũ pháp lý của Earthoria luôn sẵn sàng giải đáp mọi thắc
                mắc của bạn.
              </p>
              <a
                href="mailto:helpdesk.earthoria@gmail.com"
                className="legal-sidebar-card-link"
              >
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
            Vẫn còn thắc mắc?
          </span>
          <h2 className="legal-contact-title reveal">
            Đội ngũ pháp lý của chúng tôi
            <br />
            <em>luôn sẵn sàng lắng nghe</em>
          </h2>
          <div className="legal-contact-grid reveal">
            <a
              href="mailto:helpdesk.earthoria@gmail.com"
              className="legal-contact-item"
            >
              <Mail size={15} />
              helpdesk.earthoria@gmail.com
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
