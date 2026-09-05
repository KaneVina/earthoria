import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  TreeDeciduous,
  ShieldCheck,
  KeyRound,
  Clock,
  AlertTriangle,
  Baby,
  ChevronDown,
  Search,
  Printer,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Link2,
  Check,
} from "lucide-react";

/*
   META & CONTENT DATA
 */
const META = {
  effectiveDate: "05 Tháng 09, 2026",
  updatedDate: "05 Tháng 09, 2026",
  version: "v1.0",
};

const SUMMARY_CARDS = [
  {
    icon: ShieldCheck,
    title: "Kiểm soát toàn diện",
    desc: "Mã PIN riêng, khoá thiết bị tức thời, khung giờ sử dụng và giới hạn thời lượng — mọi quy tắc được xử lý ở máy chủ, không thể lách bằng cách đổi giờ máy hay gỡ cài ứng dụng.",
  },
  {
    icon: TreeDeciduous,
    title: "Trang Trại Tri Thức",
    desc: "Mỗi phút đọc sách và mỗi lượt chơi mini-game của bé hoá thành điểm tri thức, nuôi lớn một cái cây ảo qua 9 cấp độ — cho đến khi trở thành cả một khu rừng.",
  },
  {
    icon: KeyRound,
    title: "Bé không cần tài khoản riêng",
    desc: "Bé truy cập bằng một liên kết riêng gắn với mã token ngẫu nhiên — không mật khẩu, không email — và phụ huynh có thể thu hồi liên kết đó bất cứ lúc nào.",
  },
  {
    icon: Baby,
    title: "Dữ liệu trẻ em được bảo vệ đặc biệt",
    desc: "Chỉ thu thập những gì cần thiết để vận hành tính năng, không quảng cáo, không chia sẻ cho bên thứ ba, tuân theo cam kết bảo vệ trẻ em trong Chính Sách Bảo Mật.",
  },
];

/* Bảng giới hạn hồ sơ trẻ em theo hạng thành viên — khớp maxChildAccounts trong loyaltyTier.js */
const CHILD_TIER_LIMITS = [
  { roman: "I", name: "Chùa Một Cột", limit: 2, color: "#4a9e3f" },
  { roman: "II", name: "Cố Đô Huế", limit: 4, color: "#2a78d6" },
  { roman: "III", name: "Cầu Rồng", limit: 6, color: "#b8862e" },
  { roman: "IV", name: "Tháp Bà Ponagar", limit: 8, color: "#7a4fb5" },
  { roman: "V", name: "Landmark 81", limit: 10, color: "#c0392b" },
];

/* Bảng 9 cấp độ Cây Tri Thức — khớp LEVEL_CONFIG trong gardenConfig.js */
const GARDEN_LEVELS = [
  { level: 1, name: "Hạt Mầm Tri Thức", minXP: 0 },
  { level: 2, name: "Mầm Non Tri Thức", minXP: 150 },
  { level: 3, name: "Cây Con Tri Thức", minXP: 450 },
  { level: 4, name: "Cây Tri Thức Phát Triển", minXP: 1000 },
  { level: 5, name: "Cây Tri Thức Trưởng Thành", minXP: 2000 },
  { level: 6, name: "Cây Tri Thức Nở Hoa", minXP: 3600 },
  { level: 7, name: "Cây Tri Thức Ra Quả", minXP: 5800 },
  { level: 8, name: "Cây Cổ Thụ Tri Thức", minXP: 8800 },
  { level: 9, name: "Khu Rừng Tri Thức", minXP: 13000 },
];

/* Bảng dải sức khoẻ cây — khớp HEALTH_BANDS trong gardenConfig.js */
const HEALTH_BANDS = [
  { key: "healthy", range: "90 – 100", label: "Khoẻ mạnh", color: "#4a9e3f" },
  {
    key: "growing",
    range: "70 – 89",
    label: "Đang phát triển",
    color: "#2a78d6",
  },
  { key: "wilting", range: "40 – 69", label: "Hơi héo", color: "#b8862e" },
  {
    key: "needs_care",
    range: "20 – 39",
    label: "Cần chăm sóc",
    color: "#c0752e",
  },
  { key: "critical", range: "1 – 19", label: "Sắp héo", color: "#c0392b" },
  {
    key: "dead",
    range: "0",
    label: "Đã chết (có thể hồi sinh)",
    color: "#6b6b6b",
  },
];

/* Bảng khoảng giá trị các thông số phụ huynh có thể tuỳ chỉnh — khớp validateSettingsPatch trong childController.js */
const SETTINGS_RANGES = [
  {
    field: "Giới hạn thời lượng sử dụng mỗi ngày",
    def: "60 phút",
    range: "5 – 240 phút",
  },
  {
    field: "Khung giờ được phép sử dụng",
    def: "07:00 – 20:30",
    range: "Tuỳ chỉnh tự do, hỗ trợ khung qua đêm (vd 20:00 → 06:00)",
  },
  {
    field: "Chu kỳ nhắc nghỉ mắt",
    def: "20 phút / lần",
    range: "1 – 180 phút",
  },
  {
    field: "Thời gian nghỉ mắt mỗi lần nhắc",
    def: "20 giây",
    range: "5 – 600 giây",
  },
  {
    field: "Thời điểm nhắc giải lao bắt buộc",
    def: "Sau mỗi 45 phút liên tục",
    range: "5 – 240 phút",
  },
  {
    field: "Thời lượng giải lao bắt buộc",
    def: "10 phút",
    range: "1 – 60 phút",
  },
];

/* Bảng công thức quy đổi điểm tri thức — khớp XP_CONFIG & gardenEngine.js */
const XP_FORMULA = [
  {
    activity: "Đọc sách điện tử",
    formula: "10 điểm tri thức / phút đọc",
    note: "Cộng dồn không giới hạn theo số phút đọc thực tế trong ngày",
  },
  {
    activity: "Hoàn thành 1 lượt mini-game",
    formula: "40 điểm cố định + tối đa 100 điểm thưởng theo điểm số",
    note: "Điểm thưởng = 0,5 × điểm số đạt được, tính tối đa đến mốc 200 điểm số — tối đa 140 điểm tri thức mỗi lượt chơi",
  },
];

/* Bảng nhật ký hành động phụ huynh — khớp enum ChildAuditType trong schema.prisma */
const AUDIT_TYPES = [
  { type: "CHILD_CREATED", desc: "Tạo hồ sơ trẻ em mới" },
  {
    type: "SETTINGS_UPDATE",
    desc: "Cập nhật giờ giấc, quy tắc bảo vệ mắt hoặc thông báo",
  },
  { type: "LOCK", desc: "Khoá thiết bị của bé ngay lập tức" },
  { type: "UNLOCK", desc: "Mở khoá thiết bị (yêu cầu xác thực PIN)" },
  {
    type: "BOOK_VISIBILITY",
    desc: "Bật hoặc ẩn hiển thị một cuốn sách điện tử cụ thể",
  },
  { type: "PARENT_PIN_SET", desc: "Thiết lập mã PIN Phụ Huynh lần đầu" },
  { type: "PARENT_PIN_CHANGED", desc: "Đổi mã PIN Phụ Huynh" },
  {
    type: "PARENT_PIN_RESET",
    desc: "Đặt lại mã PIN Phụ Huynh qua OTP email (quên PIN)",
  },
  {
    type: "KID_LINK_REGENERATED",
    desc: "Tạo lại liên kết riêng của bé, thu hồi liên kết cũ",
  },
  { type: "CHILD_ARCHIVED", desc: "Xoá tạm thời (lưu trữ) hồ sơ trẻ em" },
  {
    type: "CHILD_DELETED",
    desc: "Xoá vĩnh viễn hồ sơ và toàn bộ dữ liệu liên quan",
  },
];

const formatVnd = (n) => `${new Intl.NumberFormat("vi-VN").format(n)}`;

const SECTIONS = [
  {
    id: "gioi-thieu",
    num: "01",
    title: "Giới Thiệu Trang Gia Đình & Trang Trại Tri Thức",
    paragraphs: [
      "Trang Gia Đình (đường dẫn /family) là bảng điều khiển dành riêng cho phụ huynh trên Earthoria, cho phép bạn tạo và quản lý hồ sơ cho từng bé trong gia đình, thiết lập giờ giấc sử dụng, bật quy tắc bảo vệ mắt, kiểm soát sách nào bé được đọc, và theo dõi toàn bộ hoạt động của bé qua báo cáo trực quan — tất cả trong một giao diện duy nhất, không cần cài thêm ứng dụng giám sát của bên thứ ba.",
      'Trang Trại Tri Thức (còn gọi là "Vườn Tri Thức" khi bé chỉ có một cây, và "Rừng Tri Thức" khi có nhiều cây) là tính năng học-mà-chơi (gamification) gắn liền với Trang Gia Đình: mỗi phút bé đọc sách điện tử hoặc hoàn thành một mini-game trên Earthoria đều được quy đổi thành điểm tri thức, nuôi lớn một cái cây ảo theo thời gian thực. Bé xem và tương tác với khu vườn của mình tại màn hình riêng khi truy cập bằng liên kết được phụ huynh cấp.',
      'Hai tính năng này được thiết kế để bổ trợ cho nhau: mọi giới hạn và quy tắc mà phụ huynh thiết lập trên Trang Gia Đình (giờ giấc, khoá thiết bị, bảo vệ mắt) đều áp dụng xuyên suốt cho toàn bộ trải nghiệm của bé, bao gồm cả lúc bé đang ở trong Trang Trại Tri Thức — không có "vùng ngoại lệ" nào mà các quy tắc của phụ huynh không chạm tới.',
      "Chính sách này giải thích chi tiết và chính xác cách hai tính năng trên vận hành, dữ liệu nào được thu thập, cơ chế bảo mật cho tài khoản trẻ em, và các quyền kiểm soát mà phụ huynh luôn nắm giữ. Chính sách này là một phần bổ sung, cụ thể hoá cho Chính Sách Bảo Mật và Điều Khoản Dịch Vụ chung của Earthoria — trong trường hợp có mâu thuẫn về nguyên tắc bảo vệ dữ liệu trẻ em, nội dung có lợi hơn cho trẻ em sẽ được ưu tiên áp dụng.",
    ],
  },
  {
    id: "he-sinh-thai",
    num: "02",
    title: "Vị Trí Của Hai Tính Năng Trong Hệ Sinh Thái Earthoria",
    paragraphs: [
      "Trang Gia Đình và Trang Trại Tri Thức không phải là hai sản phẩm rời rạc mà thuộc về Family Studio — bộ phận nội dung dành cho gia đình trong hệ sinh thái sản phẩm của Earthoria, cùng với các bộ phận khác như Game Studio (sản xuất mini-game giáo dục) và Immersive Studio (trải nghiệm AR/AI tương tác). Nội dung mà bé tiếp cận thông qua liên kết riêng — sách điện tử, mini-game, AR — đều là sản phẩm do các bộ phận này cung cấp và đã được đưa vào một trải nghiệm hợp nhất, có kiểm soát của phụ huynh.",
      'Tên gọi "Trang Trại Tri Thức", biểu tượng cây tri thức, cách trình bày khu vườn/khu rừng và toàn bộ giao diện liên quan là tài sản trí tuệ thuộc quyền sở hữu của Earthoria. Việc sao chép cơ chế tính điểm, giao diện hoặc tên gọi của tính năng này cho mục đích khác ngoài phạm vi sử dụng cá nhân, phi thương mại đều không được phép — chi tiết đầy đủ về quyền sở hữu trí tuệ của toàn bộ hệ sinh thái được quy định tại Tuyên Bố Bản Quyền.',
    ],
  },
  {
    id: "pham-vi-ap-dung",
    num: "03",
    title: "Phạm Vi Áp Dụng & Đối Tượng Điều Chỉnh",
    paragraphs: [
      "Chính sách này áp dụng cho: (a) mọi tài khoản khách hàng cá nhân của Earthoria khi sử dụng Trang Gia Đình tại đường dẫn /family; và (b) mọi lượt truy cập vào không gian riêng của trẻ em tại đường dẫn /e-kid/... (bao gồm cả Trang Trại Tri Thức), bất kể người thao tác tại thời điểm đó là chính bé hay phụ huynh đang xem hộ.",
      "Trang Gia Đình chỉ hiển thị cho tài khoản khách hàng cá nhân đã đăng nhập trên Earthoria — đường dẫn /family yêu cầu xác thực và sẽ tự động chuyển hướng về trang đăng nhập nếu chưa đăng nhập. Tính năng này không áp dụng cho hình thức đặt hàng khách vãng lai (guest checkout) và không dành cho tài khoản doanh nghiệp/đối tác bán hàng.",
      "Mỗi tài khoản phụ huynh có thể tạo nhiều hồ sơ trẻ em, nhưng mỗi hồ sơ trẻ em chỉ thuộc về đúng một tài khoản phụ huynh duy nhất tại một thời điểm — hệ thống hiện chưa hỗ trợ chia sẻ quyền quản lý một hồ sơ trẻ em cho nhiều tài khoản phụ huynh khác nhau (ví dụ cha và mẹ dùng hai tài khoản Earthoria riêng biệt).",
    ],
  },
  {
    id: "dieu-kien-tao-ho-so",
    num: "04",
    title: "Điều Kiện & Quy Trình Tạo Hồ Sơ Trẻ Em",
    paragraphs: [
      "Để tạo một hồ sơ trẻ em, phụ huynh thực hiện qua trình hướng dẫn từng bước (wizard) ngay trên /family. Trình hướng dẫn gồm các bước tuần tự: giới thiệu tổng quan về tính năng; thiết lập mã PIN Phụ Huynh (bước này chỉ xuất hiện nếu tài khoản CHƯA từng đặt mã PIN — hệ thống bắt buộc thiết lập PIN trước khi hoàn tất tạo hồ sơ đầu tiên, vì PIN là lớp bảo vệ duy nhất cho các hành động nhạy cảm về sau); xác nhận email tài khoản phụ huynh (nơi mọi thông báo quan trọng như cảnh báo vượt giờ, yêu cầu mở khoá hay đặt lại mã PIN sẽ được gửi đến); nhập thông tin của bé; và cuối cùng là đồng ý điều khoản sử dụng dành riêng cho hồ sơ trẻ em.",
      "Thông tin bắt buộc khi tạo hồ sơ gồm: tên của bé (tối đa 50 ký tự), ngày sinh hợp lệ trong khoảng 0–17 tuổi tại thời điểm tạo hồ sơ, và một biểu tượng đại diện (emoji + màu nền) chọn từ bộ biểu tượng có sẵn. Hệ thống từ chối tạo hồ sơ nếu ngày sinh cho thấy độ tuổi trên 17, hoặc ngày sinh nằm trong tương lai.",
    ],
    list: [
      "Hồ sơ trẻ em không phải là một tài khoản độc lập — bé không có mật khẩu, không có email riêng và không thể tự đăng nhập vào hệ thống bằng bất kỳ hình thức nào",
      "Ngày sinh chỉ được dùng để tính tuổi hiển thị cho phụ huynh và xác định nội dung phù hợp độ tuổi (ví dụ giới hạn độ tuổi khuyến nghị của từng cuốn sách), không được dùng cho mục đích quảng cáo hay chia sẻ ra bên ngoài",
      "Ảnh đại diện của bé trên hồ sơ chỉ là biểu tượng cảm xúc (emoji) và một màu nền do phụ huynh chọn — Earthoria không yêu cầu và không lưu trữ ảnh chụp thật của trẻ em cho tính năng này",
      "Phụ huynh là chủ thể duy nhất chịu trách nhiệm xác nhận thông tin của bé là chính xác khi khai báo, và có thể tạo hồ sơ cho nhiều bé khác nhau trong cùng một gia đình từ cùng một tài khoản",
    ],
  },
  {
    id: "gioi-han-ho-so",
    num: "05",
    title: "Giới Hạn Số Hồ Sơ Trẻ Em Theo Hạng Thành Viên",
    paragraphs: [
      "Để đảm bảo công bằng tài nguyên hệ thống, số lượng hồ sơ trẻ em (đang hoạt động) mà một tài khoản phụ huynh có thể tạo được giới hạn theo Hạng Thành Viên hiện tại của tài khoản đó — hạng thành viên càng cao, số hồ sơ tối đa càng nhiều. Giới hạn được kiểm tra tại thời điểm tạo hồ sơ mới; hồ sơ đã xoá mềm (lưu trữ) không được tính vào số lượng đang hoạt động.",
      "Việc kiểm tra giới hạn được thực hiện trong cùng một giao dịch cơ sở dữ liệu (transaction) với thao tác tạo hồ sơ, nhằm đảm bảo tính chính xác tuyệt đối ngay cả khi phụ huynh thao tác tạo nhiều hồ sơ gần như đồng thời trên nhiều thiết bị.",
    ],
    childLimitTable: true,
    callout: {
      title: "Đạt giới hạn hồ sơ phải làm sao?",
      text: "Nếu tài khoản đã đạt giới hạn hồ sơ trẻ em của hạng hiện tại, hệ thống sẽ báo rõ số hồ sơ tối đa, hạng tiếp theo cần đạt được để mở khoá thêm, và số hồ sơ tối đa của hạng đó. Bạn có thể xem thêm cách tính hạng thành viên tại Chính Sách Hạng Thành Viên.",
    },
  },
  {
    id: "ma-pin",
    num: "06",
    title: "Mã PIN Phụ Huynh: Thiết Lập, Đổi Mã & Xác Thực",
    paragraphs: [
      "Mã PIN Phụ Huynh là một mã số gồm đúng 4 chữ số, được mã hoá một chiều bằng thuật toán bcrypt trước khi lưu trữ — Earthoria không lưu trữ mã PIN dưới dạng văn bản thô và không có cách nào để nhân viên Earthoria xem lại mã PIN đã đặt của bạn, kể cả khi hỗ trợ kỹ thuật.",
      "Mã PIN được yêu cầu tại các thao tác nhạy cảm nhất trên Trang Gia Đình: mở khoá thiết bị đã bị khoá, tạo lại liên kết riêng của bé, và xoá vĩnh viễn một hồ sơ trẻ em. Các thao tác khác (cập nhật giờ giấc, ẩn/hiện sách, khoá thiết bị) không yêu cầu PIN vì đã được bảo vệ bởi chính phiên đăng nhập của phụ huynh trên tài khoản Earthoria.",
      "Lần đầu thiết lập PIN chỉ khả dụng khi tài khoản chưa có PIN nào; sau đó, mọi thay đổi phải đi qua chức năng đổi PIN — yêu cầu xác thực đúng mã PIN cũ trước khi mã mới được lưu lại, nhằm đảm bảo chỉ người đang nắm mã hiện tại mới có quyền thay đổi nó.",
    ],
    list: [
      "Hệ thống giới hạn tối đa 5 lần nhập sai mã PIN liên tiếp; sau lần thứ 5, tài khoản bị tạm khoá chức năng xác thực PIN trong 15 phút để chống dò mã theo kiểu brute-force",
      "Mỗi lần nhập sai, hệ thống báo rõ số lượt thử còn lại trước khi bị khoá tạm thời",
      "Nhập đúng mã PIN sẽ tự động đặt lại bộ đếm số lần nhập sai về 0",
      "Ngoài cơ chế khoá 5 lần sai nói trên, các thao tác liên quan đến PIN (mở khoá, tạo lại liên kết, xoá vĩnh viễn) còn được giới hạn tần suất ở tầng máy chủ — tối đa 15 yêu cầu trong mỗi 10 phút cho mỗi tài khoản — như một lớp phòng thủ độc lập bổ sung chống lạm dụng hệ thống",
    ],
  },
  {
    id: "quen-ma-pin",
    num: "07",
    title: "Khôi Phục Mã PIN Khi Quên",
    paragraphs: [
      'Nếu quên mã PIN, phụ huynh có thể dùng chức năng "Quên mã PIN?" ngay trên Trang Gia Đình để đặt lại mã mới, hoàn toàn không cần liên hệ đội ngũ hỗ trợ. Quy trình được xác thực bằng mã OTP gồm 6 chữ số, gửi tự động về đúng địa chỉ email đã đăng ký của tài khoản đang đăng nhập — Earthoria không cho phép nhập một email khác để nhận OTP, nhằm ngăn chặn việc chiếm quyền thiết lập PIN của người không phải chủ tài khoản.',
      "Mã OTP có hiệu lực trong 10 phút kể từ lúc gửi và tối đa 5 lần nhập sai trước khi phải yêu cầu gửi lại mã mới. Việc so khớp mã OTP được thực hiện bằng thuật toán so sánh an toàn theo thời gian không đổi (timing-safe comparison), giúp hạn chế tối đa nguy cơ bị dò mã qua kênh phụ (side-channel).",
    ],
    list: [
      'Địa chỉ email nhận OTP được che một phần khi hiển thị trên giao diện (ví dụ "n•••••@gmail.com") để tránh lộ toàn bộ địa chỉ email trên màn hình dùng chung',
      "Đặt lại mã PIN thành công sẽ tự động xoá mọi bộ đếm nhập sai và trạng thái khoá tạm thời trước đó, đồng thời được ghi lại trong nhật ký hành động của phụ huynh",
    ],
  },
  {
    id: "lien-ket-rieng",
    num: "08",
    title: "Liên Kết Riêng Của Bé (Kid Link) & Mã QR",
    paragraphs: [
      'Vì trẻ em không có tài khoản đăng nhập riêng, Earthoria dùng một liên kết riêng ("Kid Link") có dạng /e-kid/ten-be/[mã-token] để bé truy cập không gian đọc sách, AR, mini-game và Trang Trại Tri Thức của chính mình. Mã token là một chuỗi ký tự ngẫu nhiên 48 ký tự (24 byte), được sinh bằng bộ tạo số ngẫu nhiên mật mã học — không thể đoán được và không gắn với bất kỳ thông tin cá nhân nào của bé.',
      "Liên kết này hoạt động giống như một tấm vé vào cổng: bất kỳ ai có liên kết đều có thể truy cập không gian của bé mà không cần mật khẩu. Vì vậy, phụ huynh nên xem liên kết này nhạy cảm tương đương một mật khẩu và chỉ chia sẻ trong phạm vi thiết bị của gia đình (máy tính bảng, điện thoại, máy tính dùng chung tại nhà).",
      "Bên cạnh đường dẫn dạng văn bản, Trang Gia Đình còn cung cấp một mã QR tương ứng với liên kết riêng của từng bé, giúp phụ huynh thiết lập nhanh trên thiết bị của con (ví dụ máy tính bảng dùng riêng cho bé) mà không cần gõ tay đường dẫn dài.",
    ],
    list: [
      "Phụ huynh có thể xem liên kết đầy đủ kèm mã QR tại mục quản lý từng hồ sơ trẻ em trên /family",
      'Nếu nghi ngờ liên kết đã bị lộ ra ngoài, phụ huynh có thể bấm "Tạo lại liên kết" bất kỳ lúc nào (yêu cầu xác thực mã PIN) — liên kết cũ sẽ NGAY LẬP TỨC mất hiệu lực và không thể dùng để truy cập được nữa',
      "Mỗi lần tạo lại liên kết đều được ghi vào nhật ký hành động của phụ huynh (audit log) kèm thời điểm thực hiện",
      "Liên kết riêng của bé chỉ cấp quyền xem và tương tác trong phạm vi được phụ huynh cho phép (sách đã bật hiển thị, game, AR, Trang Trại Tri Thức) — không cấp bất kỳ quyền truy cập nào vào tài khoản, đơn hàng hay thông tin thanh toán của phụ huynh",
    ],
  },
  {
    id: "khoa-mo-khoa",
    num: "09",
    title: "Khoá Thiết Bị Tức Thời & Mở Khoá Bằng PIN",
    paragraphs: [
      'Tại bất kỳ thời điểm nào, phụ huynh có thể bấm "Khoá thiết bị" trên /family để ngay lập tức chặn quyền truy cập của bé vào sách, AR, mini-game và Trang Trại Tri Thức — không cần nhập mã PIN cho thao tác khoá. Đây là công cụ phản ứng nhanh cho các tình huống cần dừng ngay việc sử dụng của bé, ví dụ đến giờ ăn cơm hoặc đi ngủ đột xuất.',
      "Khi thiết bị đang bị khoá, bé sẽ thấy màn hình thông báo thân thiện thay vì nội dung, và mọi yêu cầu tải sách/mở AR/vào Trang Trại Tri Thức từ liên kết riêng của bé đều bị máy chủ từ chối với mã lỗi CHILD_LOCKED — việc chặn được thực thi ở phía máy chủ nên không thể vượt qua bằng cách tải lại trang, xoá bộ nhớ đệm hay đổi thiết bị khác.",
    ],
    list: [
      "Chỉ có mở khoá mới yêu cầu xác thực mã PIN Phụ Huynh, nhằm đảm bảo chỉ chính phụ huynh (hoặc người được chia sẻ mã PIN) mới có thể gỡ lệnh khoá",
      "Mọi lượt khoá và mở khoá đều được ghi vào nhật ký hành động kèm thời gian, hiển thị đầy đủ trong mục Báo Cáo trên /family",
    ],
  },
  {
    id: "gio-giac",
    num: "10",
    title:
      "Giờ Giấc Sử Dụng: Khung Giờ Cho Phép & Giới Hạn Thời Lượng Mỗi Ngày",
    paragraphs: [
      "Với mỗi hồ sơ trẻ em, phụ huynh có thể thiết lập hai lớp kiểm soát thời gian độc lập: khung giờ trong ngày được phép sử dụng (mặc định 07:00–20:30, hỗ trợ cả khung giờ qua đêm, ví dụ 20:00 đến 06:00 hôm sau) và tổng thời lượng sử dụng tối đa mỗi ngày (mặc định 60 phút, có thể chỉnh trong khoảng 5–240 phút). Mỗi lớp có thể được bật/tắt độc lập với nhau.",
      "Toàn bộ quy tắc giờ giấc được tính toán và thực thi ở máy chủ theo múi giờ Việt Nam (UTC+7), dựa trên nhật ký phiên hoạt động thực tế lưu trong cơ sở dữ liệu — không dựa vào đồng hồ của thiết bị bé đang dùng. Điều này có nghĩa là bé không thể lách giới hạn bằng cách chỉnh giờ máy, xoá bộ nhớ đệm hoặc gỡ cài lại ứng dụng.",
      "Thời gian sử dụng thực tế được đo bằng các lượt kiểm tra định kỳ (ping) gửi lên máy chủ trong lúc bé đang đọc sách hoặc chơi, chứ không dựa trên thời lượng bé tự khai báo hay ước lượng phía trình duyệt.",
    ],
    list: [
      "Khi hết giờ được phép trong ngày, mọi yêu cầu đọc sách/AR/mini-game/Trang Trại Tri Thức tiếp theo bị từ chối với thông báo và mã lỗi DAILY_LIMIT_REACHED, cho đến khi sang ngày mới theo giờ Việt Nam",
      "Khi ngoài khung giờ cho phép, yêu cầu bị từ chối với mã lỗi OUTSIDE_ALLOWED_WINDOW",
      "Một phiên hoạt động đơn lẻ được giới hạn tối đa 6 giờ để chống trường hợp phiên bị treo (ví dụ bé quên đóng tab) làm sai lệch số phút cộng dồn",
      "Phụ huynh có thể tắt hoàn toàn khung giờ cố định nếu chỉ muốn kiểm soát bằng tổng thời lượng mỗi ngày, hoặc ngược lại",
    ],
  },
  {
    id: "bang-thong-so",
    num: "11",
    title: "Bảng Tổng Hợp Thông Số Có Thể Tuỳ Chỉnh",
    paragraphs: [
      "Để tiện tra cứu, dưới đây là toàn bộ các thông số giờ giấc và bảo vệ mắt mà phụ huynh có thể tuỳ chỉnh cho mỗi hồ sơ trẻ em, kèm giá trị mặc định khi mới tạo hồ sơ và khoảng giá trị hợp lệ mà hệ thống chấp nhận. Mọi giá trị nằm ngoài khoảng cho phép sẽ bị máy chủ từ chối lưu, kể cả khi được gửi trực tiếp qua API.",
    ],
    settingsTable: true,
  },
  {
    id: "bao-ve-mat",
    num: "12",
    title: "Bảo Vệ Mắt: Nhắc Nghỉ Định Kỳ & Giải Lao Bắt Buộc",
    paragraphs: [
      "Earthoria tích hợp sẵn hai cơ chế bảo vệ thị lực cho trẻ em, có thể bật/tắt và tuỳ chỉnh riêng cho từng hồ sơ: nhắc nghỉ mắt định kỳ và giải lao bắt buộc. Cả hai cơ chế đều hoạt động ngay trong lúc bé đang đọc sách hoặc ở Trang Trại Tri Thức, không cần cài thêm phần mềm nào khác trên thiết bị.",
    ],
    list: [
      'Nhắc nghỉ mắt định kỳ: sau mỗi khoảng thời gian tuỳ chỉnh (mặc định 20 phút, có thể đặt 1–180 phút), một lớp phủ toàn màn hình xuất hiện, hướng dẫn bé nhìn ra xa và hít thở trong một khoảng thời gian ngắn (mặc định 20 giây, có thể đặt 5–600 giây), kèm hiệu ứng hình tròn "hít vào – thở ra" để bé dễ làm theo; bé có thể bấm "Đã nghỉ xong, đọc tiếp nào" để quay lại ngay khi hoàn tất',
      "Giải lao bắt buộc: sau một khoảng thời gian sử dụng liên tục (mặc định 45 phút, có thể đặt 5–240 phút), một lớp phủ giải lao xuất hiện và đếm ngược (mặc định 10 phút, có thể đặt 1–60 phút) — khác với lời nhắc nghỉ mắt, lớp phủ giải lao bắt buộc KHÔNG có nút bỏ qua, bé bắt buộc phải đợi hết thời gian đếm ngược mới được tiếp tục sử dụng",
      "Mẹo bảo vệ mắt ngẫu nhiên (ví dụ nhắc giữ khoảng cách với màn hình, nhắc bật đèn phòng, nhắc chớp mắt và uống nước) có thể hiển thị kèm theo lời nhắc nghỉ mắt, tần suất hiển thị tuỳ theo lựa chọn của phụ huynh: mỗi lần mở ứng dụng, theo chu kỳ cố định, hoặc mỗi lần nghỉ mắt",
    ],
  },
  {
    id: "thong-bao",
    num: "13",
    title: "Thông Báo Cho Phụ Huynh",
    paragraphs: [
      "Phụ huynh có thể bật/tắt độc lập hai kênh thông báo (thông báo đẩy trong ứng dụng và email) cùng hai loại sự kiện đáng chú ý: khi bé đã sử dụng vượt quá giới hạn thời lượng trong ngày, và khi bé liên tục bỏ qua các lời nhắc nghỉ mắt. Việc tách riêng kênh và loại sự kiện giúp phụ huynh chỉ nhận đúng những cảnh báo mình thực sự quan tâm, tránh gây phiền nhiễu.",
    ],
    list: [
      "Thông báo đẩy (push) mặc định được bật, còn thông báo qua email mặc định tắt — phụ huynh có thể bật thêm nếu muốn có bản ghi lâu dài trong hộp thư",
      "Địa chỉ email nhận thông báo luôn là email đăng ký của tài khoản phụ huynh — chính là email đã được xác nhận ngay trong bước tạo hồ sơ trẻ em ban đầu",
    ],
  },
  {
    id: "kiem-soat-sach",
    num: "14",
    title: "Kiểm Soát Nội Dung: Hiển Thị/Ẩn Sách Điện Tử Cho Bé",
    paragraphs: [
      "Trên mỗi hồ sơ trẻ em, phụ huynh có toàn quyền bật hoặc tắt hiển thị từng cuốn sách điện tử cụ thể trong tủ sách của bé. Danh sách sách hiển thị trong mục này chỉ bao gồm những đầu sách điện tử mà phụ huynh đã mua thành công (đơn hàng đã thanh toán và ở trạng thái đã giao/hoàn tất) và đã có bản sách điện tử tương tác đang hoạt động trên hệ thống.",
      "Cơ chế kiểm tra quyền sở hữu sách được đồng bộ tuyệt đối giữa Trang Gia Đình và không gian riêng của bé: một cuốn sách chỉ có thể được bật hiển thị nếu phụ huynh thực sự sở hữu nó, đảm bảo bé không bao giờ nhìn thấy hoặc đọc được nội dung nằm ngoài các đơn hàng đã mua — kể cả khi có người cố tình chỉnh sửa yêu cầu gửi lên máy chủ.",
    ],
    list: [
      "Mặc định, mọi sách điện tử đã mua đều được hiển thị cho bé; phụ huynh chủ động ẩn những đầu sách chưa phù hợp nếu muốn",
      "Sách giấy (bản in) đã mua chỉ hiển thị cho phụ huynh để tham khảo, không có công tắc bật/tắt vì bé không thể đọc sách giấy qua thiết bị điện tử ở tính năng này",
      "Mỗi lần bật/tắt hiển thị một cuốn sách đều được ghi vào nhật ký hành động của phụ huynh",
    ],
  },
  {
    id: "cong-thuc-diem",
    num: "15",
    title: "Trang Trại Tri Thức: Nguồn Gốc Điểm Tri Thức & Công Thức Tính",
    paragraphs: [
      "Điểm tri thức (XP) là đơn vị đo lường trung tâm của Trang Trại Tri Thức, được cộng dồn từ hai nguồn hoạt động duy nhất trên nền tảng: thời lượng đọc sách điện tử thực tế và kết quả các lượt hoàn thành mini-game. Không có hình thức nào khác (nạp tiền, mua vật phẩm, chia sẻ mạng xã hội...) có thể mua hoặc quy đổi thành điểm tri thức.",
    ],
    xpTable: true,
    callout: {
      title: 'Vì sao có "ngày hoạt động" và "ngày bỏ lỡ"?',
      text: 'Một ngày (tính theo giờ Việt Nam) được xem là "ngày hoạt động" nếu bé đọc sách tối thiểu 10 phút HOẶC hoàn thành tối thiểu 1 mini-game trong ngày đó. Mục tiêu tối thiểu này chỉ ảnh hưởng đến chuỗi ngày và sức khoẻ của cây (xem mục 17) — bé vẫn nhận điểm tri thức cho mọi phút đọc và mọi lượt chơi, dù có đạt mục tiêu tối thiểu hay không.',
    },
  },
  {
    id: "cap-do-cay",
    num: "16",
    title: "9 Cấp Độ Cây Tri Thức",
    paragraphs: [
      "Khi bé lần đầu mở Trang Trại Tri Thức, hệ thống tự động gieo một cây tri thức đầu tiên ở trạng thái sơ khai. Tổng điểm tri thức tích luỹ (đọc sách cộng mini-game) của cây quyết định cấp độ hiện tại, theo đúng 9 cấp độ trong bảng dưới đây — mỗi cấp độ có tên gọi và mô tả hình ảnh riêng, phản ánh quá trình một hạt mầm lớn dần thành cây trưởng thành.",
      "Khi cây đạt cấp độ cao nhất (Khu Rừng Tri Thức, từ 13.000 điểm), cây được xem là đã trưởng thành hoàn toàn (trạng thái MATURE), sức khoẻ được đặt lại về 100% vĩnh viễn và không còn bị suy giảm dù bé có bỏ lỡ hoạt động, đồng thời hệ thống tự động gieo thêm một cây mới bên cạnh để bé tiếp tục hành trình — đây chính là thời điểm khu vườn của bé chính thức trở thành một khu rừng.",
    ],
    levelTable: true,
  },
  {
    id: "suc-khoe-chuoi-ngay",
    num: "17",
    title: "Sức Khoẻ Cây, Cơ Chế Hồi Sinh & Mốc Chuỗi Ngày",
    paragraphs: [
      "Sức khoẻ của cây (thang điểm 0–100) phản ánh mức độ đều đặn trong thói quen đọc sách và học tập của bé, tách biệt hoàn toàn với cấp độ/điểm tri thức đã đạt được — một cây có thể ở cấp độ cao nhưng sức khoẻ thấp nếu bé gần đây ít hoạt động, và ngược lại.",
      "Vào mỗi ngày hoạt động, sức khoẻ cây tăng thêm 18 điểm (cộng thêm 10 điểm thưởng nếu đúng vào ngày bé đạt một mốc chuỗi ngày), tối đa 100 điểm. Vào mỗi ngày bỏ lỡ (không đạt mục tiêu tối thiểu), chuỗi ngày hiện tại được đặt lại về 0, và sức khoẻ giảm dần theo số ngày bỏ lỡ liên tiếp: giảm 5 điểm ở ngày bỏ lỡ đầu tiên, 8 điểm ở ngày thứ hai, 12 điểm ở ngày thứ ba, và 15 điểm mỗi ngày kể từ ngày thứ tư trở đi.",
      'Nếu sức khoẻ chạm 0, cây chuyển sang trạng thái "đã chết" — nhưng đây không phải là mất mát vĩnh viễn: toàn bộ điểm tri thức và cấp độ đã đạt được của cây vẫn được giữ nguyên. Ngay khi bé quay lại có một ngày hoạt động, cây sẽ hồi sinh về trạng thái sống bình thường và tiếp tục tích luỹ sức khoẻ như trên. Cơ chế này được thiết kế để khuyến khích thói quen đọc đều đặn một cách nhẹ nhàng, không tạo áp lực hay trừng phạt bé bằng cách xoá tiến trình đã đạt được.',
    ],
    healthTable: true,
    list: [
      "Các mốc chuỗi ngày hoạt động liên tục được ăn mừng đặc biệt trên giao diện của bé (kèm hiệu ứng chúc mừng) tại các mốc: 3, 7, 14, 30, 60 và 100 ngày",
      "Toàn bộ tính toán cấp độ, sức khoẻ và chuỗi ngày được thực hiện và lưu trữ ở máy chủ mỗi khi bé (hoặc phụ huynh xem hộ) mở Trang Trại Tri Thức, đảm bảo tính nhất quán và không thể can thiệp từ phía thiết bị",
    ],
  },
  {
    id: "tu-vuon-den-rung",
    num: "18",
    title: "Từ Vườn Đến Rừng Tri Thức",
    paragraphs: [
      'Khi khu vườn chỉ có một cây, giao diện gọi đây là "Vườn Tri Thức". Ngay khi cây đầu tiên trưởng thành hoàn toàn và một cây mới được gieo thêm, giao diện chuyển sang gọi là "Rừng Tri Thức" và hiển thị toàn bộ các cây — cả cây đang lớn lẫn những cây đã trưởng thành — cùng lúc trong một khung cảnh chung, tạo cảm giác thành tựu tích luỹ theo thời gian.',
      "Không có giới hạn cố định về số lượng cây tối đa mà một khu rừng có thể có — mỗi lần một cây đạt cấp độ cao nhất, một cây mới lại được gieo, và quá trình này lặp lại vô thời hạn theo đúng nhịp độ đọc sách và chơi game thực tế của bé.",
    ],
  },
  {
    id: "tro-ly-ai",
    num: "19",
    title: "Trợ Lý AI Eira Trong Không Gian Của Bé",
    paragraphs: [
      "Trợ lý AI Eira của Earthoria cũng xuất hiện trong không gian riêng của bé (bao gồm cả trang Trang Trại Tri Thức) với hình ảnh đại diện và giọng điệu được điều chỉnh thân thiện hơn cho trẻ em so với giao diện dành cho người lớn. Việc thu thập, sử dụng, lưu trữ và xoá dữ liệu hội thoại/giọng nói khi bé tương tác với Eira được quy định chi tiết và đầy đủ tại Chính Sách An Toàn & Minh Bạch AI — bao gồm cam kết không dùng hội thoại của trẻ em cho mục đích quảng cáo và tự động xoá bản ghi âm giọng nói sau 24 giờ.",
    ],
    list: [
      "Việc hiển thị hay ẩn trợ lý AI trong không gian của bé hiện được vận hành mặc định cùng trải nghiệm chung của Earthoria và không có công tắc bật/tắt riêng trên /family tại thời điểm ban hành chính sách này",
      "Nếu phụ huynh có bất kỳ lo ngại nào về việc bé tương tác với AI, vui lòng tham khảo mục kiểm soát và xoá hội thoại tại Chính Sách An Toàn & Minh Bạch AI, hoặc liên hệ đội ngũ hỗ trợ để được tư vấn cụ thể",
    ],
  },
  {
    id: "bao-cao-nhat-ky",
    num: "20",
    title: "Báo Cáo & Nhật Ký Cho Phụ Huynh",
    paragraphs: [
      "Mục Báo Cáo trên /family cung cấp cho phụ huynh một bức tranh đầy đủ về hoạt động của bé: tổng thời lượng sử dụng hôm nay, biểu đồ thời lượng theo từng ngày trong tuần (Thứ 2 đến Chủ nhật theo giờ Việt Nam), và danh sách tối đa 8 phiên đọc gần nhất kèm tên sách và thời lượng cụ thể.",
      "Song song đó, mọi hành động quản trị mà phụ huynh thực hiện trên hồ sơ của bé đều được ghi lại trong một nhật ký hành động (audit log) riêng biệt, hiển thị tối đa 10 mục gần nhất ngay trên bảng điều khiển — mỗi mục đều có thời gian thực hiện chính xác đến từng phút. Bảng dưới đây liệt kê đầy đủ các loại hành động được ghi nhận.",
    ],
    auditTable: true,
    list: [
      "Nhật ký hành động giúp phụ huynh (đặc biệt trong gia đình có nhiều người cùng quản lý một tài khoản) biết chính xác ai đã thay đổi gì và khi nào",
      "Dữ liệu báo cáo chỉ hiển thị cho phụ huynh sở hữu hồ sơ, không chia sẻ cho bất kỳ tài khoản phụ huynh nào khác",
    ],
  },
  {
    id: "rieng-tu-tre-em",
    num: "21",
    title: "Quyền Riêng Tư & Bảo Mật Dữ Liệu Trẻ Em",
    paragraphs: [
      "Dữ liệu được thu thập phục vụ Trang Gia Đình và Trang Trại Tri Thức chỉ giới hạn ở: tên và ngày sinh của bé (do phụ huynh khai báo), biểu tượng đại diện và màu sắc tự chọn, nhật ký thời lượng đọc/chơi gắn với dấu thời gian, tên sách đã đọc, kết quả và điểm số mini-game, các cài đặt giờ giấc/bảo vệ mắt do phụ huynh thiết lập, và mã token của liên kết riêng. Earthoria không yêu cầu và không lưu trữ ảnh chụp thật, số điện thoại, địa chỉ hay bất kỳ giấy tờ tuỳ thân nào của trẻ em cho các tính năng này.",
      "Toàn bộ dữ liệu nêu trên được gắn với tài khoản phụ huynh sở hữu hồ sơ, không được chia sẻ cho bất kỳ bên thứ ba nào ngoài phạm vi vận hành kỹ thuật của Earthoria, không được dùng để hiển thị quảng cáo nhắm mục tiêu, và không được bán dưới bất kỳ hình thức nào — nhất quán với cam kết bảo vệ trẻ em tại Chính Sách Bảo Mật.",
      "Dữ liệu được truyền tải giữa thiết bị và máy chủ Earthoria qua kết nối mã hoá, và mọi thông tin xác thực nhạy cảm (mã PIN, mã OTP) đều được băm/mã hoá một chiều trước khi lưu trữ — chi tiết đầy đủ về hạ tầng bảo mật chung của nền tảng được mô tả tại Chính Sách Bảo Mật.",
    ],
    list: [
      "Mọi yêu cầu truy vấn, chỉnh sửa hoặc xoá dữ liệu của một hồ sơ trẻ em phải được thực hiện bởi chính tài khoản phụ huynh sở hữu hồ sơ đó — hệ thống kiểm tra quyền sở hữu ở mọi thao tác trên máy chủ",
      "Trường hợp phát hiện thông tin trẻ em bị thu thập ngoài quy trình khai báo hợp lệ của phụ huynh, Earthoria sẽ xoá dữ liệu đó ngay khi nhận được thông báo",
      "Để biết đầy đủ các quyền của bạn đối với dữ liệu cá nhân (truy cập, chỉnh sửa, xoá, phản đối xử lý), vui lòng tham khảo mục quyền của người dùng trong Chính Sách Bảo Mật",
    ],
  },
  {
    id: "xoa-ho-so",
    num: "22",
    title: "Xoá Hồ Sơ: Xoá Tạm Thời & Xoá Vĩnh Viễn",
    paragraphs: [
      "Earthoria cung cấp hai mức độ xoá hồ sơ trẻ em, khác nhau hoàn toàn về hậu quả dữ liệu — phụ huynh cần lựa chọn đúng mức độ phù hợp với nhu cầu của mình.",
    ],
    list: [
      '"Xoá hồ sơ" (xoá mềm/lưu trữ): ẩn hồ sơ khỏi danh sách hiển thị và ngừng mọi quyền truy cập, nhưng KHÔNG xoá dữ liệu — lịch sử đọc, điểm tri thức, cây và nhật ký vẫn được lưu giữ. Thao tác này không yêu cầu mã PIN và có thể được xem lại/khôi phục bởi đội ngũ hỗ trợ nếu phụ huynh có nhu cầu',
      '"Xoá vĩnh viễn": xoá hoàn toàn và không thể khôi phục toàn bộ hồ sơ cùng mọi dữ liệu liên quan — quyền hiển thị sách, nhật ký hoạt động, nhật ký hành động, kết quả mini-game, và toàn bộ Trang Trại Tri Thức (mọi cây, cấp độ, chuỗi ngày đã đạt được). Thao tác này bắt buộc phải xác thực đúng mã PIN Phụ Huynh VÀ nhập chính xác tên của bé để xác nhận, nhằm tránh xoá nhầm, đồng thời chịu cùng giới hạn tần suất 15 yêu cầu/10 phút áp dụng cho các thao tác liên quan đến PIN',
      "Một bản ghi xác nhận việc xoá vĩnh viễn được lưu lại trong hệ thống trước khi dữ liệu bị xoá, phục vụ mục đích đối soát nội bộ nếu phát sinh tranh chấp",
    ],
    callout: {
      title: "Cân nhắc trước khi xoá vĩnh viễn",
      text: "Vì tính chất không thể hoàn tác, Earthoria khuyến nghị phụ huynh chỉ chọn xoá vĩnh viễn khi thực sự chắc chắn không còn nhu cầu lưu giữ tiến trình học tập của bé — ví dụ khi ngừng hẳn sử dụng dịch vụ. Với nhu cầu tạm ngừng theo dõi hoặc bé không dùng trong một thời gian, xoá tạm thời (lưu trữ) là lựa chọn an toàn hơn.",
    },
  },
  {
    id: "khieu-nai",
    num: "23",
    title: "Khiếu Nại, Tranh Chấp & Kênh Phản Hồi",
    paragraphs: [
      "Nếu phụ huynh phát hiện dữ liệu hiển thị sai lệch (ví dụ thời lượng đọc không khớp thực tế, một cuốn sách đã mua nhưng không hiện trong danh sách có thể bật hiển thị, hoặc nghi ngờ hồ sơ của con bị truy cập trái phép), vui lòng liên hệ ngay đội ngũ Chăm sóc Khách hàng qua các kênh tại mục cuối trang này hoặc gửi yêu cầu qua hệ thống hỗ trợ (ticket) trên Earthoria để được tra soát.",
      "Earthoria cam kết phản hồi mọi yêu cầu liên quan đến dữ liệu trẻ em với mức ưu tiên cao hơn các yêu cầu hỗ trợ thông thường, và sẽ thông tin lại kết quả xử lý cụ thể qua đúng email đã đăng ký của tài khoản phụ huynh.",
    ],
  },
  {
    id: "gioi-han-trach-nhiem",
    num: "24",
    title: "Giới Hạn Trách Nhiệm & Khuyến Nghị Sử Dụng An Toàn",
    paragraphs: [
      "Trang Gia Đình và Trang Trại Tri Thức là công cụ hỗ trợ phụ huynh quản lý và đồng hành cùng con trong việc sử dụng thiết bị điện tử, không phải là công cụ giám sát thay thế hoàn toàn cho sự đồng hành trực tiếp của phụ huynh. Các quy tắc giờ giấc, khoá thiết bị và bảo vệ mắt được thực thi trong phạm vi ứng dụng Earthoria; Earthoria không thể kiểm soát việc bé sử dụng các ứng dụng, thiết bị hoặc nội dung khác nằm ngoài nền tảng.",
      "Earthoria khuyến nghị phụ huynh: định kỳ xem lại báo cáo hoạt động và nhật ký hành động; giữ mã PIN Phụ Huynh và liên kết riêng của bé ở nơi chỉ những người lớn tin cậy trong gia đình biết; đăng xuất khỏi Trang Gia Đình khi dùng chung thiết bị công cộng; và trò chuyện trực tiếp với bé về thói quen sử dụng thiết bị lành mạnh song song với các công cụ kỹ thuật.",
    ],
    list: [
      "Earthoria không chịu trách nhiệm đối với hậu quả phát sinh từ việc phụ huynh chia sẻ mã PIN hoặc liên kết riêng của bé cho người không có thẩm quyền quản lý",
      "Các mốc thời gian, tỷ lệ quy đổi điểm tri thức và ngưỡng cấp độ trong Trang Trại Tri Thức là thông số vận hành nội bộ nhằm mục đích tạo động lực học tập, không cấu thành cam kết y khoa hay giáo dục cụ thể về mức độ phát triển của trẻ",
      "Việc dùng công cụ khoá/giới hạn giờ giấc không thay thế trách nhiệm giám sát trực tiếp của phụ huynh đối với nội dung và thời lượng sử dụng thiết bị điện tử nói chung của trẻ, kể cả ngoài phạm vi nền tảng Earthoria",
    ],
  },
  {
    id: "thay-doi-chinh-sach",
    num: "25",
    title: "Thay Đổi Chính Sách & Liên Hệ",
    paragraphs: [
      "Earthoria có thể điều chỉnh các thông số vận hành của Trang Gia Đình và Trang Trại Tri Thức (ví dụ tỷ lệ quy đổi điểm tri thức, ngưỡng cấp độ, giới hạn hồ sơ theo hạng thành viên) theo thời gian để cải thiện trải nghiệm và cân bằng hệ thống.",
      "Mọi thay đổi làm giảm quyền lợi hoặc quyền kiểm soát hiện có của phụ huynh sẽ được thông báo trước tối thiểu 14 ngày qua email và banner trên website, theo đúng cam kết minh bạch chung của Earthoria. Phiên bản chính sách hiện hành luôn được công bố công khai tại trang này, kèm số phiên bản và ngày cập nhật gần nhất.",
      "Nếu bạn có thắc mắc về Trang Gia Đình, Trang Trại Tri Thức, hoặc cần hỗ trợ liên quan đến hồ sơ trẻ em, đội ngũ Chăm sóc Khách hàng của Earthoria sẵn sàng hỗ trợ qua các kênh dưới đây.",
    ],
  },
];

const FAQS = [
  {
    q: "Bé có cần đăng ký tài khoản hay ghi nhớ mật khẩu để vào Trang Trại Tri Thức không?",
    a: 'Không. Bé truy cập hoàn toàn thông qua liên kết riêng ("Kid Link") do phụ huynh cấp trên /family — liên kết này đã bao gồm mã xác thực nên bé không cần nhập mật khẩu hay bất kỳ thông tin đăng nhập nào.',
  },
  {
    q: "Nếu bé làm lộ liên kết riêng cho bạn bè, tôi phải làm sao?",
    a: 'Vào /family, mở hồ sơ của bé và bấm "Tạo lại liên kết" (yêu cầu xác thực mã PIN). Liên kết cũ sẽ mất hiệu lực ngay lập tức, và một liên kết mới kèm mã QR sẽ được cấp — mọi tiến trình, điểm tri thức và cây trong Trang Trại Tri Thức của bé không bị ảnh hưởng.',
  },
  {
    q: "Cây trong Trang Trại Tri Thức bị chết thì có mất hết điểm và cấp độ đã đạt được không?",
    a: 'Không. Sức khoẻ cây và cấp độ/điểm tri thức là hai chỉ số độc lập. Khi cây "chết" vì bé bỏ lỡ hoạt động nhiều ngày liên tiếp, toàn bộ điểm tri thức đã tích luỹ vẫn được giữ nguyên; chỉ cần bé có một ngày đọc sách hoặc chơi game trở lại, cây sẽ hồi sinh và tiếp tục lớn lên.',
  },
  {
    q: "Giới hạn thời gian sử dụng có bị lách được bằng cách đổi giờ trên thiết bị của bé không?",
    a: "Không. Mọi quy tắc giờ giấc (khung giờ cho phép, giới hạn phút mỗi ngày) được máy chủ Earthoria tính toán dựa trên nhật ký hoạt động thực tế theo múi giờ Việt Nam, hoàn toàn độc lập với đồng hồ hệ thống trên thiết bị của bé.",
  },
  {
    q: "Tôi có thể xem chính xác bé đã đọc sách gì và trong bao lâu không?",
    a: "Có. Mục Báo Cáo trên /family hiển thị tổng thời lượng hôm nay, biểu đồ theo tuần, và danh sách tối đa 8 phiên đọc gần nhất kèm tên sách cụ thể. Mọi thay đổi cài đặt của phụ huynh cũng được ghi lại trong nhật ký hành động riêng, hiển thị 10 mục gần nhất.",
  },
  {
    q: 'Khác nhau giữa "Xoá hồ sơ" và "Xoá vĩnh viễn" là gì?',
    a: '"Xoá hồ sơ" chỉ ẩn hồ sơ đi và giữ nguyên toàn bộ dữ liệu, có thể được đội ngũ hỗ trợ khôi phục lại. "Xoá vĩnh viễn" xoá hoàn toàn và không thể khôi phục, yêu cầu xác thực mã PIN Phụ Huynh và nhập đúng tên của bé để xác nhận.',
  },
  {
    q: "Số hồ sơ trẻ em tôi được tạo có tăng lên khi tôi mua sắm nhiều hơn không?",
    a: "Có. Số hồ sơ trẻ em tối đa được gắn với Hạng Thành Viên hiện tại của tài khoản — hạng càng cao (theo tổng chi tiêu tích luỹ), số hồ sơ tối đa càng nhiều, từ 2 hồ sơ ở Hạng I đến 10 hồ sơ ở Hạng V. Xem chi tiết tại Chính Sách Hạng Thành Viên.",
  },
  {
    q: "Tôi quên mã PIN thì phải làm sao, có cần liên hệ hỗ trợ không?",
    a: 'Không cần. Bấm "Quên mã PIN?" ngay trên Trang Gia Đình, hệ thống sẽ gửi mã OTP 6 chữ số về đúng email đăng ký của tài khoản bạn (có hiệu lực 10 phút, tối đa 5 lần nhập sai). Nhập đúng OTP là có thể đặt mã PIN mới ngay lập tức.',
  },
  {
    q: "Bé có thể tự thiết lập lại giờ giấc hoặc tự mở khoá thiết bị khi bị khoá không?",
    a: "Không. Mọi thay đổi thiết lập giờ giấc, bảo vệ mắt và mọi thao tác mở khoá đều chỉ thực hiện được từ Trang Gia Đình trên tài khoản phụ huynh đã đăng nhập — liên kết riêng của bé không có bất kỳ quyền chỉnh sửa cài đặt nào.",
  },
  {
    q: 'Vì sao có lúc bảng điều khiển gọi là "Vườn Tri Thức", có lúc lại gọi là "Rừng Tri Thức"?',
    a: 'Tên gọi thay đổi theo số lượng cây thực tế của bé: khi chỉ có một cây đang lớn, giao diện gọi là "Vườn Tri Thức"; ngay khi cây đầu tiên trưởng thành hoàn toàn và một cây mới được gieo thêm, không gian đó chính thức trở thành "Rừng Tri Thức" và hiển thị toàn bộ các cây cùng lúc.',
  },
  {
    q: "Giải lao bắt buộc có thể bấm bỏ qua nếu bé đang đọc dở một cuốn sách không?",
    a: "Không. Đây là điểm khác biệt cố ý so với lời nhắc nghỉ mắt thông thường: lớp phủ giải lao bắt buộc không có nút bỏ qua, bé phải đợi hết thời gian đếm ngược (mặc định 10 phút, phụ huynh có thể chỉnh 1–60 phút) mới được tiếp tục sử dụng.",
  },
  {
    q: "Tôi mua thêm sách mới thì bé có tự động thấy trong tủ sách của mình không?",
    a: "Có, nếu bạn chưa từng chủ động ẩn sách đó. Theo mặc định, mọi sách điện tử mới mua đều tự động hiển thị trong tủ sách của bé; bạn chỉ cần vào mục quản lý sách trên /family nếu muốn ẩn bớt một số đầu sách cụ thể.",
  },
  {
    q: "Nếu tôi đổi mã PIN, liên kết riêng của bé hoặc dữ liệu Trang Trại Tri Thức có bị ảnh hưởng không?",
    a: "Không. Mã PIN chỉ bảo vệ các thao tác quản trị của phụ huynh trên /family và hoàn toàn tách biệt với liên kết riêng của bé và dữ liệu Trang Trại Tri Thức. Đổi PIN không làm mất bất kỳ liên kết, điểm tri thức hay tiến trình nào bé đã đạt được.",
  },
];

/*
   COMPONENT
 */
export default function FamilyPolicy() {
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
          font-weight: 300; max-width: 640px; margin: 0 auto 30px;
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
          width: 100%; border-collapse: collapse; min-width: 520px;
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
        <span className="breadcrumb-current">
          Chính sách Trang Gia Đình &amp; Trang Trại Tri Thức
        </span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="legal-hero">
        <div className="legal-hero-grid" />
        <div className="legal-hero-glow" />
        <div className="legal-hero-watermark">EARTHORIA</div>
        <div className="legal-hero-inner">
          <div className="legal-hero-icon">
            <Users size={22} />
          </div>
          <div className="legal-hero-eyebrow">
            <span className="legal-hero-eyebrow-line" />
            <span>Gia Đình &amp; Trẻ Em</span>
            <span className="legal-hero-eyebrow-line" />
          </div>
          <h1 className="legal-hero-title">
            Chính Sách —<br />
            <em>Trang Gia Đình &amp; Trang Trại Tri Thức</em>
          </h1>
          <p className="legal-hero-sub">
            Cách phụ huynh quản lý hồ sơ, giờ giấc và nội dung cho con qua
            /family, và cách mỗi trang sách bé đọc lớn lên thành một cây tri
            thức trong Trang Trại Tri Thức.
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
              <div className="legal-sidebar-card-title">Đến Trang Gia Đình</div>
              <p>
                Quản lý hồ sơ, giờ giấc và Trang Trại Tri Thức của con ngay tại
                /family.
              </p>
              <Link to="/family" className="legal-sidebar-card-link">
                Mở Trang Gia Đình
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

                {s.childLimitTable && (
                  <div className="legal-tiers-table-wrap">
                    <table className="legal-tiers-table">
                      <thead>
                        <tr>
                          <th>Hạng thành viên</th>
                          <th>Số hồ sơ trẻ em tối đa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CHILD_TIER_LIMITS.map((t) => (
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
                              <strong>{t.limit}</strong> hồ sơ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {s.levelTable && (
                  <div className="legal-tiers-table-wrap">
                    <table className="legal-tiers-table">
                      <thead>
                        <tr>
                          <th>Cấp độ</th>
                          <th>Tên gọi</th>
                          <th>Ngưỡng điểm tri thức</th>
                        </tr>
                      </thead>
                      <tbody>
                        {GARDEN_LEVELS.map((lv) => (
                          <tr key={lv.level}>
                            <td>
                              <strong>Cấp {lv.level}</strong>
                            </td>
                            <td className="legal-tiers-tier-name">{lv.name}</td>
                            <td>
                              {lv.minXP === 0 ? (
                                "Mặc định khi gieo cây"
                              ) : (
                                <>
                                  từ <strong>{formatVnd(lv.minXP)}</strong> điểm
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {s.healthTable && (
                  <div className="legal-tiers-table-wrap">
                    <table className="legal-tiers-table">
                      <thead>
                        <tr>
                          <th>Sức khoẻ cây</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {HEALTH_BANDS.map((h) => (
                          <tr key={h.key}>
                            <td>
                              <div className="legal-tiers-tier-cell">
                                <span
                                  className="legal-tiers-dot"
                                  style={{ background: h.color }}
                                />
                                {h.range}
                              </div>
                            </td>
                            <td className="legal-tiers-tier-name">{h.label}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {s.settingsTable && (
                  <div className="legal-tiers-table-wrap">
                    <table className="legal-tiers-table">
                      <thead>
                        <tr>
                          <th>Thiết lập</th>
                          <th>Mặc định</th>
                          <th>Khoảng cho phép</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SETTINGS_RANGES.map((r) => (
                          <tr key={r.field}>
                            <td className="legal-tiers-tier-name">{r.field}</td>
                            <td>
                              <strong>{r.def}</strong>
                            </td>
                            <td>{r.range}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {s.xpTable && (
                  <div className="legal-tiers-table-wrap">
                    <table className="legal-tiers-table">
                      <thead>
                        <tr>
                          <th>Hoạt động</th>
                          <th>Công thức quy đổi</th>
                          <th>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {XP_FORMULA.map((x) => (
                          <tr key={x.activity}>
                            <td className="legal-tiers-tier-name">
                              {x.activity}
                            </td>
                            <td>
                              <strong>{x.formula}</strong>
                            </td>
                            <td>{x.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {s.auditTable && (
                  <div className="legal-tiers-table-wrap">
                    <table className="legal-tiers-table">
                      <thead>
                        <tr>
                          <th>Loại hành động</th>
                          <th>Mô tả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {AUDIT_TYPES.map((a) => (
                          <tr key={a.type}>
                            <td>
                              <strong>{a.type}</strong>
                            </td>
                            <td>{a.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

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
            Cần hỗ trợ về Trang Gia Đình?
          </span>
          <h2 className="legal-contact-title reveal">
            Đội ngũ Earthoria
            <br />
            <em>sẵn sàng giải đáp</em>
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
