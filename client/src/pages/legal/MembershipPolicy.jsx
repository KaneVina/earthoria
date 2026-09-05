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
  updatedDate: "05 Tháng 09, 2026",
  version: "v1.1",
};

const TIERS = [
  {
    roman: "I",
    name: "Chùa Một Cột",
    emoji: "🪷",
    city: "Hà Nội",
    minSpend: 0,
    discountPercent: 0,
    maxDiscountPerOrder: 0,
    freeShipThreshold: 300_000,
    maxChildAccounts: 2,
    color: "#4a9e3f",
  },
  {
    roman: "II",
    name: "Cố Đô Huế",
    emoji: "🏯",
    city: "Huế",
    minSpend: 3_000_000,
    discountPercent: 3,
    maxDiscountPerOrder: 100_000,
    freeShipThreshold: 200_000,
    maxChildAccounts: 4,
    color: "#2a78d6",
  },
  {
    roman: "III",
    name: "Cầu Rồng",
    emoji: "🐉",
    city: "Đà Nẵng",
    minSpend: 7_000_000,
    discountPercent: 5,
    maxDiscountPerOrder: 200_000,
    freeShipThreshold: 100_000,
    maxChildAccounts: 6,
    color: "#b8862e",
  },
  {
    roman: "IV",
    name: "Tháp Bà Ponagar",
    emoji: "🏛️",
    city: "Nha Trang",
    minSpend: 15_000_000,
    discountPercent: 8,
    maxDiscountPerOrder: 350_000,
    freeShipThreshold: 0,
    maxChildAccounts: 8,
    color: "#7a4fb5",
  },
  {
    roman: "V",
    name: "Landmark 81",
    emoji: "🏙️",
    city: "TP. Hồ Chí Minh",
    minSpend: 30_000_000,
    discountPercent: 12,
    maxDiscountPerOrder: 600_000,
    freeShipThreshold: 0,
    maxChildAccounts: 10,
    color: "#c0392b",
  },
];

/* Bảng minh hoạ công thức tính tổng thanh toán một đơn hàng — khớp createOrder trong orderController.js */
const ORDER_FORMULA = [
  {
    step: "1. Giá trị sản phẩm (subtotal)",
    formula: "Tổng (giá bán × số lượng) của mọi sản phẩm trong giỏ hàng",
    note: "Dùng giá khuyến mãi (salePrice) nếu sản phẩm đang giảm giá riêng",
  },
  {
    step: "2. Giảm giá theo hạng thành viên",
    formula:
      "% giảm của hạng hiện tại × subtotal, chặn trần theo mức tối đa/đơn của hạng",
    note: "Tự động áp dụng, không cần nhập mã, tính trên hạng tại đúng thời điểm đặt hàng",
  },
  {
    step: "3. Giảm giá theo mã khuyến mãi (nếu có)",
    formula: "Theo cấu hình của từng mã (giảm theo % hoặc số tiền cố định)",
    note: "Cộng dồn với ưu đãi hạng — tổng hai khoản giảm không vượt quá subtotal",
  },
  {
    step: "4. Phí vận chuyển",
    formula:
      "0đ nếu đơn toàn sách điện tử, nhận tại cửa hàng, hoặc giá trị sau giảm ≥ ngưỡng miễn phí ship của hạng — ngược lại tính theo khoảng cách giao hàng",
    note: "Không có toạ độ giao hàng hợp lệ → áp phí mặc định 30.000đ",
  },
  {
    step: "5. Tổng thanh toán (total)",
    formula:
      "Subtotal − (giảm giá hạng + giảm giá mã, đã chặn trần) + phí vận chuyển",
    note: "Đây chính là số tiền được cộng vào chi tiêu tích luỹ khi đơn đạt trạng thái Hoàn Tất",
  },
];

const formatVnd = (n) =>
  n > 0 ? `${new Intl.NumberFormat("vi-VN").format(n)}đ` : "0đ";

const SUMMARY_CARDS = [
  {
    icon: TrendingUp,
    title: "5 hạng tích lũy",
    desc: "Từ Chùa Một Cột đến Landmark 81 — hạng của bạn tăng dần theo tổng chi tiêu trọn đời, tính lại theo thời gian thực từ đúng các đơn hàng đã hoàn tất.",
  },
  {
    icon: Percent,
    title: "Giảm giá đến 12%",
    desc: "Mỗi đơn hàng được tự động giảm giá theo hạng hiện tại, cộng dồn được với mã giảm giá khuyến mãi, áp dụng ngay tại bước thanh toán.",
  },
  {
    icon: Truck,
    title: "Miễn phí vận chuyển",
    desc: "Ngưỡng miễn phí ship giảm dần theo hạng — từ Hạng IV trở lên, mọi đơn hàng giao tận nơi đều được miễn phí ship.",
  },
  {
    icon: Lock,
    title: "Không có hạn dùng",
    desc: "Hạng thành viên không hết hạn theo chu kỳ và không bị đánh giá lại định kỳ — chỉ phản ánh đúng lịch sử các đơn hàng hợp lệ tại mọi thời điểm.",
  },
];

const SECTIONS = [
  {
    id: "tong-quan",
    num: "01",
    title: "Tổng Quan Hệ Thống Hạng Thành Viên",
    paragraphs: [
      "Hệ thống Hạng Thành Viên Earthoria ghi nhận hành trình mua sắm của bạn qua 5 hạng, được thể hiện như một chuyến bay đi qua những công trình biểu tượng của Việt Nam — khởi hành từ Hạng I (Chùa Một Cột, Hà Nội), qua Cố Đô Huế, Cầu Rồng Đà Nẵng, Tháp Bà Ponagar Nha Trang, và đích đến là Hạng V (Landmark 81, TP.HCM), tổng hành trình biểu trưng khoảng 1.710km. Hạng của bạn được xác định hoàn toàn tự động dựa trên tổng giá trị các đơn hàng đã mua thành công, không yêu cầu đăng ký, không thu phí thành viên và không cần thao tác thủ công nào.",
      "Khác với thẻ thành viên vật lý hay chương trình tính điểm cần đổi thưởng, hạng thành viên Earthoria hoạt động âm thầm phía sau mỗi đơn hàng: ưu đãi giảm giá và ngưỡng miễn phí vận chuyển tự động áp dụng ngay khi bạn đủ điều kiện, không cần nhập mã hay yêu cầu kích hoạt.",
      "Chính sách này áp dụng cho mọi tài khoản khách hàng cá nhân trên website và ứng dụng Earthoria, và có thể được cập nhật định kỳ để phản ánh chương trình ưu đãi mới nhất.",
    ],
  },
  {
    id: "pham-vi-ap-dung",
    num: "02",
    title: "Phạm Vi Áp Dụng",
    paragraphs: [
      "Chính sách này áp dụng cho mọi tài khoản khách hàng cá nhân đã đăng ký và đăng nhập trên Earthoria, không phân biệt phương thức thanh toán (COD, chuyển khoản qua VNPay/MoMo/BankQR, hay thẻ quốc tế qua Stripe) hay hình thức giao hàng đã chọn.",
      "Hạng thành viên không áp dụng cho đơn hàng đặt dưới hình thức khách vãng lai (guest checkout, nếu có), vì hệ thống cần gắn lịch sử chi tiêu với một tài khoản cụ thể để tính toán chính xác.",
    ],
  },
  {
    id: "cach-tinh-hang",
    num: "03",
    title: "Cách Tính Hạng & Chi Tiêu Tích Luỹ Trọn Đời",
    paragraphs: [
      'Hạng thành viên được tính dựa trên tổng chi tiêu tích luỹ trọn đời (lifetime spend) của tài khoản. Đây là tổng số tiền thực tế đã thanh toán (trường "tổng thanh toán" của đơn hàng) — nghĩa là ĐÃ bao gồm phí vận chuyển và ĐÃ được trừ mọi khoản giảm giá (ưu đãi hạng cộng mã khuyến mãi, nếu có) áp dụng cho đơn đó — của tất cả đơn hàng thoả đồng thời hai điều kiện: trạng thái thanh toán là Đã Thanh Toán, và trạng thái đơn hàng là Hoàn Tất.',
      "Việc tính hạng không dựa trên một bộ đếm được lưu sẵn, mà được truy vấn và cộng lại theo thời gian thực mỗi khi hệ thống cần biết hạng của bạn (khi bạn mở trang Hành Trình Hạng Thành Viên, hoặc khi bạn tạo một đơn hàng mới). Nhờ vậy, hạng của bạn luôn phản ánh đúng và tức thời trạng thái mới nhất của toàn bộ lịch sử đơn hàng.",
    ],
    callout: {
      title: "Vì sao giá trị tích luỹ khác giá trị hiển thị trong giỏ hàng?",
      text: "Giá trị được cộng vào chi tiêu tích luỹ là số tiền cuối cùng bạn thực trả — đã trừ giảm giá và cộng phí vận chuyển — chứ không phải giá trị sản phẩm gốc (subtotal) trước khi tính khuyến mãi. Điều này đảm bảo hạng thành viên phản ánh đúng giá trị bạn thực sự đóng góp cho Earthoria, không bị thổi phồng bởi giá gốc trước giảm giá.",
    },
    list: [
      'Đơn hàng bị huỷ, đơn chưa thanh toán, hoặc đơn đang ở các trạng thái trung gian (Đã xác nhận, Đang giao, Đã giao nhưng chưa xác nhận nhận hàng) chưa được cộng vào chi tiêu tích luỹ — xem chi tiết điều kiện "Hoàn Tất" tại mục 04',
      'Bạn có thể xem chính xác tổng chi tiêu hiện tại, hạng đang giữ và tiến trình lên hạng tiếp theo tại trang "Hành Trình Hạng Thành Viên" trong hồ sơ cá nhân',
    ],
  },
  {
    id: "dieu-kien-hoan-tat",
    num: "04",
    title: 'Đơn Hàng Nào Được Tính: Điều Kiện "Hoàn Tất"',
    paragraphs: [
      "Vì hạng thành viên chỉ cộng dồn từ các đơn hàng đã ở trạng thái Hoàn Tất, thời điểm một đơn hàng thực sự được tính vào chi tiêu tích luỹ khác nhau tuỳ loại sản phẩm bạn mua.",
    ],
    list: [
      "Đơn hàng chỉ gồm sách điện tử: tự động chuyển thẳng sang trạng thái Hoàn Tất ngay khi thanh toán thành công, vì không có bước giao hàng vật lý nào cần chờ đợi — chi tiêu được cộng vào hạng của bạn gần như tức thời",
      "Đơn hàng có sách giấy (bản in): trải qua các bước Đã xác nhận → Đang giao → Đã giao, và CHỈ chuyển sang Hoàn Tất sau khi chính bạn bấm xác nhận đã nhận hàng trên trang chi tiết đơn hàng — đây là bước chủ động, Earthoria không tự động đánh dấu hoàn tất chỉ vì đơn vị vận chuyển báo đã giao",
      "Nếu một đơn hàng bị huỷ hoặc được hoàn tiền sau khi đã từng ở trạng thái Hoàn Tất, đơn đó sẽ không còn thoả điều kiện tính chi tiêu và sẽ tự động không còn được cộng vào hạng ở lần tính lại tiếp theo",
    ],
    callout: {
      title: "Mẹo nhỏ",
      text: 'Nếu bạn vừa nhận được một đơn hàng sách giấy nhưng chưa thấy chi tiêu tích luỹ tăng lên, hãy kiểm tra xem bạn đã bấm "Xác nhận đã nhận hàng" trên đơn đó chưa — đây là bước cuối cùng để đơn hàng được tính vào hạng thành viên của bạn.',
    },
  },
  {
    id: "bang-hang",
    num: "05",
    title: "Bảng 5 Hạng Thành Viên & Quyền Lợi",
    paragraphs: [
      "Dưới đây là toàn bộ 5 hạng thành viên hiện hành cùng ngưỡng chi tiêu mở khoá và quyền lợi tương ứng. Giảm giá được áp dụng tự động trên mỗi đơn hàng và không thể quy đổi thành tiền mặt. Cột cuối cùng thể hiện số hồ sơ trẻ em tối đa mà tài khoản có thể tạo trên Trang Gia Đình ở mỗi hạng — xem chi tiết đầy đủ về tính năng này tại Chính Sách Trang Gia Đình & Trang Trại Tri Thức.",
    ],
    tiersTable: true,
  },
  {
    id: "uu-dai-giam-gia",
    num: "06",
    title: "Ưu Đãi Giảm Giá Theo Đơn Hàng",
    paragraphs: [
      "Từ Hạng II trở lên, mỗi đơn hàng của bạn được tự động giảm giá theo phần trăm quy định của hạng hiện tại, tính trên giá trị sản phẩm (subtotal) trước phí vận chuyển. Hạng của bạn dùng để tính ưu đãi là hạng tại đúng thời điểm bạn tạo đơn hàng đó — tức là được tính dựa trên toàn bộ lịch sử chi tiêu trước đơn hàng này, không bao gồm chính đơn hàng đang đặt.",
    ],
    list: [
      "Mức giảm được áp dụng tự động ngay tại bước thanh toán — bạn không cần nhập mã hay yêu cầu thủ công",
      "Mỗi hạng có mức giảm tối đa cho một đơn hàng (ví dụ Hạng III giảm 5% nhưng không quá 200.000đ/đơn) nhằm đảm bảo công bằng giữa các đơn hàng giá trị khác nhau",
      "Ưu đãi chỉ áp dụng cho đơn hàng thanh toán thành công, không áp dụng hồi tố cho các đơn đã đặt trước khi lên hạng",
    ],
  },
  {
    id: "ket-hop-uu-dai",
    num: "07",
    title: "Kết Hợp Ưu Đãi Hạng Với Mã Giảm Giá",
    paragraphs: [
      "Ưu đãi giảm giá theo hạng thành viên và mã giảm giá khuyến mãi (coupon) được CỘNG DỒN với nhau trên cùng một đơn hàng — đây không phải hai ưu đãi loại trừ lẫn nhau. Tổng số tiền được giảm (ưu đãi hạng cộng giá trị mã giảm giá) sẽ không bao giờ vượt quá giá trị sản phẩm (subtotal) của đơn hàng, kể cả khi tổng hai khoản giảm trên lý thuyết lớn hơn giá trị đơn.",
    ],
    list: [
      "Ví dụ: đơn hàng 1.000.000đ, Hạng III giảm 5% (50.000đ) và mã giảm giá giảm thêm 100.000đ — tổng cộng bạn được giảm 150.000đ, còn phải thanh toán 850.000đ cộng phí vận chuyển (nếu có)",
      'Không có cơ chế "chọn ưu đãi có lợi hơn" giữa hạng thành viên và mã giảm giá — cả hai luôn được áp dụng cùng lúc nếu mã giảm giá hợp lệ (còn hiệu lực, chưa hết lượt dùng, đơn hàng đạt giá trị tối thiểu theo yêu cầu của mã)',
    ],
  },
  {
    id: "mien-phi-van-chuyen",
    num: "08",
    title: "Ngưỡng Miễn Phí Vận Chuyển Theo Hạng",
    paragraphs: [
      "Ngưỡng giá trị đơn hàng tối thiểu để được miễn phí vận chuyển giảm dần khi hạng của bạn tăng lên, và được miễn phí hoàn toàn từ Hạng IV. Ngưỡng này được so sánh với giá trị đơn hàng SAU KHI đã trừ toàn bộ giảm giá (cả ưu đãi hạng lẫn mã giảm giá, nếu có) — không phải giá trị sản phẩm gốc.",
    ],
    list: [
      "Hạng I: miễn phí ship cho đơn từ 300.000đ (sau giảm giá) — áp dụng mặc định cho mọi tài khoản mới",
      "Hạng II: miễn phí ship cho đơn từ 200.000đ (sau giảm giá)",
      "Hạng III: miễn phí ship cho đơn từ 100.000đ (sau giảm giá)",
      "Hạng IV & Hạng V: miễn phí vận chuyển cho mọi đơn hàng giao tận nơi, không giới hạn giá trị",
      "Bất kể hạng nào: đơn hàng chỉ gồm sách điện tử luôn miễn phí ship (không có bước giao hàng vật lý), và đơn chọn hình thức nhận tại cửa hàng (pickup) cũng luôn miễn phí ship",
    ],
  },
  {
    id: "cong-thuc-thanh-toan",
    num: "09",
    title: "Công Thức Tính Tổng Thanh Toán Của Một Đơn Hàng",
    paragraphs: [
      "Để bạn dễ đối chiếu số tiền hiển thị lúc thanh toán, dưới đây là trình tự đầy đủ mà hệ thống dùng để tính tổng thanh toán cuối cùng của một đơn hàng — đây cũng chính là số tiền được cộng vào chi tiêu tích luỹ của bạn khi đơn đạt trạng thái Hoàn Tất.",
    ],
    orderFormulaTable: true,
  },
  {
    id: "khoa-uu-dai",
    num: "10",
    title: 'Ưu Đãi Được "Khoá" Tại Thời Điểm Đặt Hàng',
    paragraphs: [
      'Ngay khi một đơn hàng được tạo, hệ thống lưu lại chính xác mã hạng thành viên và số tiền giảm giá theo hạng đã áp dụng cho đơn đó, tách biệt hoàn toàn khỏi hạng hiện tại của tài khoản. Nhờ cơ chế "khoá" này, đơn hàng cũ của bạn sẽ không tự thay đổi số tiền đã giảm dù sau này hạng của bạn tăng lên hay (trong trường hợp hiếm) giảm xuống.',
    ],
    list: [
      "Nếu bạn vừa lên hạng mới nhưng có đơn hàng đang xử lý được tạo trước đó, đơn đó vẫn giữ nguyên mức giảm của hạng cũ tại thời điểm đặt — ưu đãi mới chỉ áp dụng cho các đơn được tạo sau khi lên hạng",
      "Việc lưu vết này cũng giúp đội ngũ Earthoria tra soát chính xác lịch sử ưu đãi của từng đơn hàng khi cần hỗ trợ khiếu nại",
    ],
  },
  {
    id: "ho-so-tre-em",
    num: "11",
    title: "Số Hồ Sơ Trẻ Em Tối Đa Theo Hạng",
    paragraphs: [
      "Ngoài ưu đãi mua sắm, hạng thành viên còn quyết định số lượng hồ sơ trẻ em (đang hoạt động) mà tài khoản có thể tạo trên Trang Gia Đình — từ 2 hồ sơ ở Hạng I đến 10 hồ sơ ở Hạng V, đúng như trong bảng tại mục 05. Đây là quyền lợi duy nhất trong hệ thống hạng thành viên không liên quan trực tiếp đến giá trị đơn hàng, mà liên quan đến tính năng quản lý gia đình của nền tảng.",
      "Toàn bộ chi tiết về cách tạo, quản lý và giới hạn hồ sơ trẻ em được quy định đầy đủ tại Chính Sách Trang Gia Đình & Trang Trại Tri Thức.",
    ],
  },
  {
    id: "tinh-lai-theo-thoi-gian-thuc",
    num: "12",
    title: "Nguyên Tắc Tính Lại Theo Thời Gian Thực",
    paragraphs: [
      "Vì chi tiêu tích luỹ luôn được truy vấn lại theo đúng dữ liệu đơn hàng hiện có (không dựa vào một bộ đếm cố định được cộng dần), hạng thành viên của bạn tại bất kỳ thời điểm nào cũng phản ánh chính xác các đơn hàng ĐANG thoả điều kiện Đã Thanh Toán và Hoàn Tất tính đến thời điểm đó.",
      "Trong đại đa số trường hợp, điều này có nghĩa hạng của bạn chỉ tăng lên theo thời gian khi bạn tiếp tục mua sắm, và không bao giờ tự giảm nếu bạn không thao tác gì thêm. Tuy nhiên, nếu một đơn hàng trước đó từng góp phần vào chi tiêu tích luỹ của bạn sau này được hoàn tiền hoặc chuyển sang trạng thái không còn hợp lệ, giá trị đơn đó sẽ không còn được tính ở lần truy vấn tiếp theo, và hạng có thể được điều chỉnh giảm tương ứng để phản ánh đúng thực tế.",
    ],
    callout: {
      title: "Đây không phải hình phạt",
      text: "Việc điều chỉnh nói trên không phải là một biện pháp trừng phạt hay đánh giá lại định kỳ, mà đơn thuần là hệ quả tự nhiên của cách hệ thống luôn tính hạng dựa trên dữ liệu đơn hàng mới nhất. Trường hợp này rất hiếm gặp trong điều kiện sử dụng bình thường, vì đơn hàng đã hoàn tất hiếm khi bị hoàn tiền toàn phần trở lại.",
    },
  },
  {
    id: "dieu-kien-va-ngoai-le",
    num: "13",
    title: "Điều Kiện Áp Dụng & Giới Hạn",
    paragraphs: [
      "Một số nguyên tắc chung được áp dụng để đảm bảo tính công bằng của hệ thống hạng thành viên cho toàn bộ khách hàng.",
    ],
    list: [
      "Hệ thống hạng thành viên chỉ áp dụng cho tài khoản khách hàng cá nhân đã đăng nhập — không áp dụng cho đơn hàng đặt dưới hình thức khách vãng lai (guest checkout, nếu có)",
      "Mỗi khách hàng nên chỉ sở hữu một tài khoản duy nhất để chi tiêu được cộng dồn chính xác; Earthoria bảo lưu quyền xem xét các tài khoản có dấu hiệu được tạo trùng lặp nhằm mục đích trục lợi ưu đãi",
      "Earthoria bảo lưu quyền tạm ngưng quyền lợi hạng thành viên đối với tài khoản có dấu hiệu gian lận, lạm dụng hệ thống hoặc vi phạm Điều Khoản Dịch Vụ",
    ],
  },
  {
    id: "rieng-tu-du-lieu",
    num: "14",
    title: "Bảo Mật & Quyền Riêng Tư Dữ Liệu Chi Tiêu",
    paragraphs: [
      "Dữ liệu dùng để tính hạng thành viên (lịch sử đơn hàng, giá trị, trạng thái) là dữ liệu giao dịch nội bộ giữa bạn và Earthoria, không được chia sẻ cho bên thứ ba ngoài phạm vi vận hành kỹ thuật của nền tảng và không được dùng để hiển thị quảng cáo nhắm mục tiêu. Chi tiết đầy đủ về cách Earthoria thu thập, sử dụng và bảo vệ dữ liệu cá nhân được quy định tại Chính Sách Bảo Mật.",
    ],
  },
  {
    id: "thay-doi-chinh-sach",
    num: "15",
    title: "Thay Đổi Chính Sách & Thông Báo",
    paragraphs: [
      "Earthoria có thể điều chỉnh ngưỡng chi tiêu, mức giảm giá hoặc quyền lợi của từng hạng theo thời gian để phù hợp với chiến lược kinh doanh và trải nghiệm khách hàng.",
    ],
    list: [
      "Mọi thay đổi làm giảm quyền lợi hiện có sẽ được thông báo trước tối thiểu 14 ngày qua email và banner trên website, theo đúng cam kết minh bạch chung của Earthoria",
      "Chi tiêu tích luỹ và hạng đã đạt được của bạn không bị ảnh hưởng bởi các thay đổi chính sách trong tương lai, trừ khi có thông báo cụ thể khác",
      "Phiên bản chính sách hiện hành luôn được công bố công khai tại trang này, kèm số phiên bản và ngày cập nhật gần nhất",
    ],
  },
  {
    id: "lien-he",
    num: "16",
    title: "Liên Hệ Về Hạng Thành Viên",
    paragraphs: [
      "Nếu bạn có thắc mắc về hạng hiện tại, tổng chi tiêu tích luỹ hoặc quyền lợi tương ứng, đội ngũ Chăm sóc Khách hàng của Earthoria sẵn sàng hỗ trợ qua các kênh dưới đây.",
    ],
  },
];

const FAQS = [
  {
    q: "Tổng chi tiêu để lên hạng được tính từ khi nào?",
    a: "Tổng chi tiêu được tính từ đơn hàng thành công đầu tiên trên tài khoản của bạn — không giới hạn theo năm hay theo chu kỳ. Toàn bộ lịch sử đơn hàng đã ở trạng thái Hoàn Tất và Đã thanh toán đều được cộng dồn.",
  },
  {
    q: "Chi tiêu tích luỹ tính trên giá trị sản phẩm hay số tiền tôi thực trả?",
    a: "Tính trên số tiền bạn thực trả cho đơn hàng đó — đã bao gồm phí vận chuyển và đã trừ mọi giảm giá (ưu đãi hạng cộng mã khuyến mãi, nếu có). Đây không phải giá trị sản phẩm gốc trước khi giảm giá.",
  },
  {
    q: "Tôi vừa thanh toán đơn hàng sách giấy nhưng chưa thấy chi tiêu tăng lên, vì sao?",
    a: 'Đơn hàng sách giấy chỉ được tính vào chi tiêu tích luỹ sau khi đạt trạng thái Hoàn Tất — tức là sau khi bạn đã nhận hàng và chủ động bấm "Xác nhận đã nhận hàng" trên trang chi tiết đơn. Trước bước này (kể cả khi đơn vị vận chuyển đã báo giao thành công), đơn vẫn chưa được cộng vào hạng.',
  },
  {
    q: "Vậy còn sách điện tử thì sao?",
    a: "Đơn hàng chỉ gồm sách điện tử được tính vào chi tiêu tích luỹ ngay lập tức khi thanh toán thành công, vì không có bước giao hàng vật lý nào cần chờ xác nhận.",
  },
  {
    q: "Ưu đãi giảm giá theo hạng có dùng chung được với mã giảm giá khuyến mãi khác không?",
    a: "Có. Hai ưu đãi này luôn cộng dồn với nhau trên cùng một đơn hàng (không phải chọn cái có lợi hơn), chỉ bị giới hạn ở mức tổng số tiền giảm không vượt quá giá trị sản phẩm của đơn hàng đó.",
  },
  {
    q: "Tôi vừa lên hạng mới — đơn hàng đang xử lý có được áp dụng ưu đãi mới không?",
    a: "Không. Ưu đãi theo hạng được lưu cố định (khoá) tại đúng thời điểm bạn tạo đơn hàng, không áp dụng hồi tố cho đơn đã đặt trước đó. Chỉ đơn hàng mới tạo sau khi lên hạng mới nhận ưu đãi của hạng mới.",
  },
  {
    q: "Tôi có thể xem chính xác mình còn thiếu bao nhiêu để lên hạng tiếp theo không?",
    a: 'Có. Trang "Hành Trình Hạng Thành Viên" trong hồ sơ cá nhân hiển thị tổng chi tiêu hiện tại, hạng đang giữ, và số tiền cụ thể còn thiếu để đạt hạng kế tiếp, kèm thanh tiến trình trực quan.',
  },
  {
    q: "Mua toàn sách điện tử thì có được miễn phí vận chuyển không, bất kể hạng nào?",
    a: "Có. Đơn hàng chỉ gồm sách điện tử luôn được miễn phí vận chuyển ở mọi hạng thành viên, vì không phát sinh chi phí giao hàng vật lý. Tương tự, chọn nhận hàng tại cửa hàng (pickup) cũng luôn miễn phí ship.",
  },
  {
    q: "Tôi mua hàng nhiều nhưng đơn bị hủy — có ảnh hưởng đến hạng không?",
    a: "Đơn hàng bị huỷ hoặc chưa thanh toán thành công không được tính vào chi tiêu tích luỹ ngay từ đầu, nên không ảnh hưởng đến hạng. Trường hợp một đơn đã từng được tính (đã Hoàn Tất) sau đó được hoàn tiền, giá trị đơn đó sẽ không còn được tính ở lần cập nhật tiếp theo và hạng có thể được điều chỉnh cho khớp với dữ liệu mới nhất.",
  },
  {
    q: "Số hồ sơ trẻ em tối đa có tính theo hạng thành viên không?",
    a: "Có. Số hồ sơ trẻ em tối đa trên Trang Gia Đình tăng theo hạng, từ 2 hồ sơ ở Hạng I đến 10 hồ sơ ở Hạng V. Xem chi tiết đầy đủ tại Chính Sách Trang Gia Đình & Trang Trại Tri Thức.",
  },
  {
    q: "Đạt Hạng V (Landmark 81) rồi thì có ưu đãi nào cao hơn nữa không?",
    a: "Hạng V hiện là hạng cao nhất trong hệ thống với mức giảm 12% mỗi đơn (tối đa 600.000đ), miễn phí vận chuyển toàn bộ và giới hạn hồ sơ trẻ em cao nhất (10 hồ sơ). Earthoria có thể giới thiệu các hạng hoặc đặc quyền mới trong tương lai và sẽ luôn thông báo trước đến thành viên Hạng V.",
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
                          <th>Hồ sơ trẻ em tối đa</th>
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
                                  {t.emoji} Hạng {t.roman} · {t.name}
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
                            <td>
                              <strong>{t.maxChildAccounts}</strong> hồ sơ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {s.orderFormulaTable && (
                  <div className="legal-tiers-table-wrap">
                    <table className="legal-tiers-table">
                      <thead>
                        <tr>
                          <th>Bước tính</th>
                          <th>Công thức</th>
                          <th>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ORDER_FORMULA.map((o) => (
                          <tr key={o.step}>
                            <td className="legal-tiers-tier-name">{o.step}</td>
                            <td>
                              <strong>{o.formula}</strong>
                            </td>
                            <td>{o.note}</td>
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
