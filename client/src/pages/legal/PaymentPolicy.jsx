import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Wallet,
  Clock,
  Calendar,
  FileText,
  ChevronDown,
  Search,
  Printer,
  Mail,
  Phone,
  MapPin,
  Link2,
  Check,
  Users,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Scale,
} from "lucide-react";

/*
   META & CONTENT DATA
 */
const META = {
  effectiveDate: "14 Tháng 09, 2026",
  updatedDate: "14 Tháng 09, 2026",
  version: "v2.0",
};

const SUMMARY_CARDS = [
  {
    icon: Wallet,
    title: "4 phương thức",
    desc: "COD, VNPay, Ví MoMo và Chuyển khoản QR - mỗi đơn hàng chỉ áp dụng đúng một phương thức duy nhất cho toàn bộ giá trị.",
  },
  {
    icon: Lock,
    title: "Không lưu dữ liệu thẻ",
    desc: "Earthoria không thu thập, không lưu số thẻ hay mã OTP - toàn bộ được xử lý trực tiếp bởi cổng thanh toán đạt chuẩn PCI DSS.",
  },
  {
    icon: Clock,
    title: "Phiên 15 phút",
    desc: "Phiên thanh toán đã mở có hiệu lực đúng 15 phút; đơn chưa mở phiên tự huỷ sau 30 phút - hoàn kho ngay lập tức.",
  },
  {
    icon: Scale,
    title: "Ràng buộc pháp lý rõ ràng",
    desc: "Tuân thủ Luật Bảo vệ quyền lợi người tiêu dùng, Luật Giao dịch điện tử và quy định hiện hành về thanh toán, hoá đơn điện tử.",
  },
];

const SECTIONS = [
  {
    id: "pham-vi-rang-buoc",
    num: "01",
    title: "Phạm Vi Áp Dụng & Giá Trị Ràng Buộc",
    paragraphs: [
      'Chính sách Thanh Toán này ("Chính Sách") quy định toàn diện điều kiện, quy trình, quyền và nghĩa vụ liên quan đến việc thanh toán cho mọi Đơn hàng đặt qua website earthoria.vn và ứng dụng di động Earthoria (gọi chung là "Nền Tảng"), do Công ty TNHH Earthoria Việt Nam ("Earthoria", "chúng tôi") vận hành.',
      "Bằng việc chọn một phương thức thanh toán, nhấn nút xác nhận đặt hàng, hoặc thực hiện bất kỳ hành vi chuyển tiền nào cho một Đơn hàng trên Nền Tảng, bạn - hoặc Phụ huynh/Người giám hộ hợp pháp của bạn nếu bạn dưới 18 tuổi theo Mục 04 - xác nhận đã đọc, hiểu rõ và đồng ý bị ràng buộc vô điều kiện bởi toàn bộ nội dung Chính Sách này.",
      "Chính Sách là một phần không tách rời của Điều Khoản Dịch Vụ Earthoria và cần được đọc cùng Chính Sách Trả Hàng & Hoàn Tiền, Chính Sách Bảo Mật và Chính Sách Hạng Thành Viên. Trường hợp có mâu thuẫn về nội dung thanh toán, Chính Sách này được ưu tiên áp dụng so với các tài liệu nêu trên.",
    ],
    list: [
      "Áp dụng cho Đơn hàng sách vật lý tích hợp AR",
      "Áp dụng cho Đơn hàng sách điện tử",
      "Áp dụng cho các khoản thanh toán liên quan đến hạng thành viên và ưu đãi đi kèm",
      "Áp dụng có bổ sung riêng cho Đơn hàng số lượng lớn của trường học/tổ chức giáo dục theo Điều Khoản Dịch Vụ",
    ],
  },
  {
    id: "dinh-nghia",
    num: "02",
    title: "Định Nghĩa Thuật Ngữ",
    paragraphs: [
      "Trừ khi ngữ cảnh yêu cầu khác, các thuật ngữ viết hoa dưới đây được hiểu thống nhất trong toàn bộ Chính Sách này.",
    ],
    list: [
      '"Đơn hàng" - yêu cầu mua sản phẩm được khởi tạo trên Nền Tảng, gắn với một mã đơn hàng hiển thị duy nhất dạng ODE-XXXXXXXXX',
      '"Phiên thanh toán" - khoảng thời gian có hiệu lực của một phiên giao dịch được khởi tạo với Cổng Thanh Toán cho một Đơn hàng cụ thể, gắn với một mã tham chiếu thanh toán (payment reference) duy nhất',
      '"Cổng Thanh Toán" - VNPay, MoMo, và đối tác xử lý chuyển khoản ngân hàng tự động mà Earthoria hợp tác để xử lý giao dịch trực tuyến',
      '"Xác nhận thanh toán chính thức" - thông báo server-to-server (IPN đối với VNPay/MoMo, webhook đối với Chuyển khoản QR) do Cổng Thanh Toán gửi trực tiếp đến hệ thống Earthoria, là căn cứ DUY NHẤT để ghi nhận một Đơn hàng đã thanh toán thành công',
      '"COD" - hình thức thanh toán khi nhận hàng (Cash On Delivery)',
      '"Tài khoản gia đình" - tài khoản do Phụ huynh/Người giám hộ khởi tạo, là chủ thể duy nhất có thẩm quyền thực hiện thanh toán, như định nghĩa tại Điều Khoản Dịch Vụ',
    ],
  },
  {
    id: "co-so-phap-ly",
    num: "03",
    title: "Cơ Sở Pháp Lý",
    paragraphs: [
      "Chính Sách này được xây dựng và vận hành phù hợp với hệ thống pháp luật hiện hành của nước Cộng hoà Xã hội Chủ nghĩa Việt Nam, bao gồm nhưng không giới hạn ở các văn bản sau.",
    ],
    list: [
      "Bộ luật Dân sự 2015",
      "Luật Bảo vệ quyền lợi người tiêu dùng 2023 và văn bản hướng dẫn thi hành",
      "Luật Giao dịch điện tử 2023",
      "Nghị định 52/2013/NĐ-CP về thương mại điện tử, được sửa đổi, bổ sung bởi Nghị định 85/2021/NĐ-CP",
      "Nghị định 101/2012/NĐ-CP về thanh toán không dùng tiền mặt, được sửa đổi, bổ sung bởi Nghị định 80/2016/NĐ-CP và Nghị định 16/2019/NĐ-CP",
      "Nghị định 123/2020/NĐ-CP về hoá đơn, chứng từ",
      "Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân",
    ],
    callout: {
      title: "Ưu tiên áp dụng quy định pháp luật",
      text: "Trường hợp cơ quan nhà nước có thẩm quyền ban hành quy định mới trái với nội dung Chính Sách này, quy định pháp luật được ưu tiên áp dụng và Earthoria sẽ cập nhật Chính Sách trong thời gian sớm nhất có thể.",
    },
  },
  {
    id: "dieu-kien-tham-quyen",
    num: "04",
    title: "Điều Kiện & Thẩm Quyền Thanh Toán",
    paragraphs: [
      "Không phải mọi người dùng Nền Tảng đều có quyền thực hiện thanh toán. Do phần lớn người dùng Earthoria là trẻ em, Chính Sách áp đặt các điều kiện chặt chẽ sau đây nhằm bảo vệ trẻ em và đảm bảo mọi giao dịch được uỷ quyền hợp lệ.",
    ],
    list: [
      "Chỉ chủ Tài khoản gia đình - người đã xác nhận đủ 18 tuổi khi đăng ký - mới có quyền chọn phương thức thanh toán, khởi tạo Phiên thanh toán và hoàn tất giao dịch",
      'Hồ sơ trẻ em được liên kết trong Tài khoản gia đình không có và không được cấp bất kỳ hình thức truy cập nào vào bước thanh toán; trẻ em chỉ có thể gửi "Yêu cầu mua sách" để Phụ huynh xem xét và tự tay hoàn tất thanh toán',
      "Bạn cam kết rằng thẻ, tài khoản ngân hàng hoặc ví điện tử dùng để thanh toán trên Nền Tảng thuộc quyền sở hữu hợp pháp của bạn, hoặc bạn đã được chủ sở hữu uỷ quyền hợp lệ để sử dụng cho giao dịch đó",
      "Earthoria có quyền yêu cầu xác minh bổ sung (đối chiếu thông tin chủ thẻ, xác nhận qua điện thoại đăng ký) trước khi xử lý Đơn hàng nếu phát hiện dấu hiệu bất thường, và có quyền từ chối hoặc tạm giữ giao dịch cho đến khi xác minh hoàn tất",
      "Việc cố ý sử dụng phương tiện thanh toán không thuộc quyền sở hữu hợp pháp, không được uỷ quyền, hoặc có nguồn gốc gian lận là vi phạm nghiêm trọng Chính Sách này và có thể cấu thành hành vi vi phạm pháp luật hình sự Việt Nam",
    ],
  },
  {
    id: "phuong-thuc",
    num: "05",
    title: "Các Phương Thức Thanh Toán Được Chấp Nhận",
    paragraphs: [
      "Earthoria hỗ trợ 4 phương thức thanh toán tại bước cuối cùng của quy trình đặt hàng. Khả dụng của từng phương thức có thể thay đổi theo loại sản phẩm trong giỏ hàng và theo quyết định vận hành của Earthoria.",
    ],
    list: [
      "Thanh toán khi nhận hàng (COD) - trả tiền mặt trực tiếp cho nhân viên giao hàng; chỉ áp dụng cho Đơn hàng có ít nhất một sản phẩm vật lý, không áp dụng cho Đơn hàng toàn bộ là sách điện tử",
      "VNPay - cổng thanh toán nội địa hỗ trợ thẻ ATM/Napas nội địa, thẻ quốc tế Visa/Mastercard/JCB và ví VNPay",
      "Ví MoMo - thanh toán trực tiếp bằng số dư hoặc liên kết ngân hàng/thẻ trong ứng dụng MoMo",
      "Chuyển khoản QR - quét mã QR chuẩn VietQR bằng ứng dụng của bất kỳ ngân hàng nào tại Việt Nam, hệ thống đối soát và xác nhận tự động",
      "Mỗi Đơn hàng chỉ được áp dụng duy nhất MỘT phương thức thanh toán cho toàn bộ giá trị; Nền Tảng không hỗ trợ tách thanh toán một phần theo nhiều phương thức khác nhau trên cùng một Đơn hàng",
      "Earthoria có quyền bổ sung, tạm ngưng hoặc loại bỏ một phương thức thanh toán vào bất kỳ thời điểm nào mà không cần thông báo trước, đặc biệt khi đối tác Cổng Thanh Toán ngừng cung cấp dịch vụ",
    ],
    callout: {
      title: "Sách điện tử chỉ thanh toán online",
      text: "Do không có khâu giao nhận vật lý, Đơn hàng chỉ gồm sách điện tử bắt buộc thanh toán qua VNPay, MoMo hoặc Chuyển khoản QR. Phương thức COD tự động ẩn khi giỏ hàng của bạn chỉ có sản phẩm số.",
    },
  },
  {
    id: "tien-te-gia-thue",
    num: "06",
    title: "Đơn Vị Tiền Tệ, Giá Bán & Thuế",
    paragraphs: [
      "Toàn bộ giá sản phẩm, phí vận chuyển và tổng giá trị Đơn hàng trên Earthoria được niêm yết và thanh toán bằng Đồng Việt Nam (VNĐ), đã bao gồm thuế giá trị gia tăng theo quy định hiện hành trừ khi có ghi chú khác.",
    ],
    list: [
      "Giá hiển thị tại thời điểm hoàn tất thanh toán là giá cuối cùng, ràng buộc cả hai bên, không thay đổi do biến động giá phát sinh sau đó dù tăng hay giảm",
      "Trường hợp phát hiện lỗi hiển thị giá rõ ràng do lỗi kỹ thuật (ví dụ giá 0đ hoặc chênh lệch bất thường so với giá niêm yết thông thường), Earthoria có quyền từ chối xử lý hoặc huỷ Đơn hàng đó kèm hoàn tiền đầy đủ nếu đã thanh toán, mà không phải chịu trách nhiệm bồi thường thêm",
      "Thanh toán bằng thẻ quốc tế qua VNPay có thể phát sinh phụ phí chuyển đổi ngoại tệ do ngân hàng phát hành thẻ áp dụng, nằm ngoài phạm vi kiểm soát và trách nhiệm của Earthoria",
      "Bạn tự chịu trách nhiệm về mọi khoản phí phát sinh từ phía ngân hàng/tổ chức phát hành thẻ hoặc ví điện tử của chính mình (phí giao dịch nước ngoài, phí chuyển đổi ngoại tệ, phí SMS Banking...)",
    ],
  },
  {
    id: "quy-trinh-online",
    num: "07",
    title: "Quy Trình Thanh Toán Trực Tuyến",
    paragraphs: [
      "Với VNPay và Ví MoMo, bạn được chuyển hướng sang trang thanh toán của đối tác ngay sau khi xác nhận đơn hàng. Với Chuyển khoản QR, mã QR hiển thị trực tiếp trên màn hình Earthoria.",
    ],
    list: [
      "Sau khi xác nhận đơn, hệ thống tạo một Phiên thanh toán gắn liền với Đơn hàng và có thời hạn hiệu lực quy định tại Mục 09",
      "Mỗi yêu cầu tạo Phiên thanh toán được gắn một mã định danh duy nhất (Idempotency Key) ở phía hệ thống nhằm ngăn việc bấm nút thanh toán nhiều lần gây tạo trùng phiên hoặc trừ tiền nhiều lần do lỗi mạng hoặc thao tác vô ý",
      "VNPay/MoMo: bạn hoàn tất thanh toán trên trang của đối tác rồi được chuyển hướng trở lại Earthoria để xem kết quả",
      "Chuyển khoản QR: quét mã bằng app ngân hàng bất kỳ, hệ thống đối soát và xác nhận Đơn hàng tự động trong vòng vài phút sau khi ngân hàng báo có",
      "Trạng thái Đơn hàng chỉ chuyển sang Đã thanh toán khi Earthoria nhận được Xác nhận thanh toán chính thức theo Mục 08 - không dựa trên xác nhận thủ công từ người dùng",
    ],
  },
  {
    id: "nguon-xac-nhan",
    num: "08",
    title: "Nguồn Xác Nhận Thanh Toán Chính Thức",
    paragraphs: [
      "Đây là nguyên tắc cốt lõi, ràng buộc xuyên suốt toàn bộ quy trình xử lý thanh toán của Earthoria và không thể bị thay thế bởi bất kỳ hình thức xác nhận nào khác.",
    ],
    list: [
      "Trạng thái Đã thanh toán của một Đơn hàng CHỈ được ghi nhận khi hệ thống Earthoria nhận được thông báo xác nhận hợp lệ, có chữ ký/xác thực đúng, gửi trực tiếp server-to-server (IPN đối với VNPay/MoMo, webhook đối với Chuyển khoản QR) từ Cổng Thanh Toán tương ứng",
      'Màn hình kết quả hiển thị ngay sau khi bạn được Cổng Thanh Toán chuyển hướng về Nền Tảng CHỈ mang tính tham khảo tức thời và KHÔNG phải căn cứ xác nhận cuối cùng; hệ thống có thể hiển thị "đang chờ xác nhận" trong thời gian ngắn trong lúc chờ nguồn xác nhận chính thức',
      "Bất kỳ thông báo, biên lai hay ảnh chụp màn hình nào bạn cung cấp từ ứng dụng ngân hàng/ví điện tử của mình đều KHÔNG tự động cập nhật trạng thái Đơn hàng; các chứng từ này chỉ được dùng làm căn cứ để bộ phận hỗ trợ đối soát thủ công khi có yêu cầu",
      "Mọi callback nhận được với chữ ký không hợp lệ, sai mã đối tác, hoặc sai khoá xác thực webhook đều bị hệ thống từ chối tuyệt đối và ghi log để điều tra, không được dùng làm căn cứ xác nhận thanh toán trong bất kỳ trường hợp nào",
    ],
  },
  {
    id: "het-han-phien",
    num: "09",
    title: "Thời Hạn Phiên Thanh Toán & Tự Động Huỷ Đơn",
    paragraphs: [
      "Để đảm bảo công bằng về tồn kho giữa các khách hàng, Đơn hàng chưa hoàn tất thanh toán trong thời hạn quy định sẽ tự động bị huỷ và hoàn lại kho, lượt sử dụng mã giảm giá.",
    ],
    list: [
      "Đơn hàng thanh toán online (VNPay/MoMo/Chuyển khoản QR) mà bạn CHƯA từng mở Phiên thanh toán (chưa bấm vào cổng thanh toán, chưa hiển thị mã QR lần nào): tự động huỷ sau 30 phút kể từ thời điểm đặt hàng",
      "Ngay khi Phiên thanh toán được mở (URL VNPay/MoMo được tạo, hoặc mã QR được hiển thị), phiên đó có hiệu lực trong đúng 15 phút kể từ thời điểm khởi tạo, không phụ thuộc thời gian bạn còn thao tác trên trang của đối tác",
      "Sau khi Phiên 15 phút hết hạn, MỌI xác nhận thanh toán gửi về sau đó - kể cả có chữ ký hợp lệ và đúng số tiền - đều KHÔNG được hệ thống dùng để tự động đánh dấu Đơn hàng là đã thanh toán, và cần được xử lý thủ công theo Mục 16",
      'Đơn COD tự động huỷ nếu vẫn ở trạng thái "Chờ xử lý" quá 24 giờ kể từ khi đặt hàng mà chưa được xác nhận xử lý (thời hạn có thể được Earthoria điều chỉnh theo từng thời kỳ và khu vực)',
      "Hệ thống quét và xử lý huỷ đơn hết hạn theo chu kỳ định kỳ khoảng mỗi 1 phút; do đó có thể tồn tại một khoảng trễ ngắn giữa thời điểm hết hạn lý thuyết và thời điểm Đơn hàng thực sự chuyển sang trạng thái Đã huỷ",
      "Khi một Đơn hàng bị huỷ do hết hạn, toàn bộ tồn kho đã giữ chỗ và lượt sử dụng mã giảm giá (nếu có) được hoàn lại ngay lập tức; Earthoria không có nghĩa vụ giữ chỗ sản phẩm hoặc ưu đãi cho Đơn hàng đã huỷ",
    ],
    callout: {
      title: "Đã chuyển khoản nhưng đơn bị huỷ do hết hạn?",
      text: "Trường hợp hiếm gặp này thường do ngân hàng xử lý chậm hơn thời hạn phiên. Liên hệ ngay bộ phận hỗ trợ kèm biên lai/lịch sử giao dịch trong vòng 7 ngày - Earthoria đối soát với Cổng Thanh Toán và hoàn tiền 100% trong vòng 5 ngày làm việc nếu xác nhận có giao dịch thành công.",
    },
  },
  {
    id: "doi-soat-noi-dung",
    num: "10",
    title: "Đối Soát Giao Dịch & Nội Dung Chuyển Khoản",
    paragraphs: [
      "Với Chuyển khoản QR, việc đối soát tự động phụ thuộc hoàn toàn vào tính chính xác của nội dung chuyển khoản và số tiền - đây là nghĩa vụ bạn cần tuân thủ nghiêm ngặt.",
    ],
    list: [
      'Nội dung chuyển khoản do hệ thống tự động điền sẵn trong mã QR, luôn chứa mã tham chiếu thanh toán duy nhất của Phiên giao dịch (định dạng bắt đầu bằng "EARTH")',
      "Bạn cam kết giữ nguyên toàn bộ nội dung chuyển khoản khi thực hiện giao dịch bằng ứng dụng ngân hàng của mình; việc chỉnh sửa, rút gọn hoặc xoá một phần nội dung có thể khiến hệ thống không thể tự động nhận diện và đối soát giao dịch của bạn với Đơn hàng tương ứng",
      "Số tiền chuyển khoản/thanh toán phải khớp chính xác với tổng giá trị Đơn hàng hiển thị tại thời điểm thanh toán; giao dịch có số tiền sai lệch (thừa hoặc thiếu) sẽ KHÔNG được tự động xác nhận và được đánh dấu cần đối soát thủ công",
      "Trường hợp bạn chuyển khoản sai số tiền hoặc sai/thiếu nội dung khiến hệ thống không tự đối soát được, vui lòng liên hệ bộ phận hỗ trợ kèm biên lai giao dịch trong vòng 7 ngày kể từ ngày giao dịch để được xử lý thủ công; Earthoria không chịu trách nhiệm cho các khoản chuyển khoản không xác định được nguồn gốc sau thời hạn này do giới hạn tra soát của ngân hàng đối tác",
    ],
  },
  {
    id: "nghia-vu-khach-hang",
    num: "11",
    title: "Nghĩa Vụ Của Khách Hàng Khi Thanh Toán",
    paragraphs: [
      "Khi thực hiện thanh toán trên Nền Tảng, bạn cam kết và có nghĩa vụ tuân thủ đầy đủ các điều sau đây.",
    ],
    list: [
      "Cung cấp thông tin thanh toán chính xác, đầy đủ và trung thực; tự chịu trách nhiệm cho mọi hậu quả phát sinh từ việc cung cấp thông tin sai lệch",
      "Bảo mật tuyệt đối thông tin đăng nhập, mã OTP, mật khẩu giao dịch và thiết bị dùng để thanh toán; không chia sẻ các thông tin này cho bất kỳ bên thứ ba nào, kể cả người tự xưng là nhân viên Earthoria",
      "Hoàn tất thanh toán trong thời hạn Phiên quy định tại Mục 09; Earthoria không có nghĩa vụ bồi thường cho việc Đơn hàng bị huỷ do bạn không hoàn tất thanh toán đúng hạn",
      "Kiểm tra kỹ số tiền, nội dung chuyển khoản và thông tin Đơn hàng trước khi xác nhận giao dịch trên ứng dụng ngân hàng/ví điện tử của mình",
      "Thông báo cho Earthoria trong vòng 24 giờ kể từ khi phát hiện giao dịch bất thường, nghi ngờ gian lận, hoặc bị trừ tiền không do chính bạn thực hiện liên quan đến tài khoản Earthoria",
      "Không sử dụng bất kỳ công cụ, tập lệnh tự động, hoặc phương thức kỹ thuật nào nhằm can thiệp, giả mạo hoặc thao túng quy trình thanh toán, xác nhận giao dịch hoặc đối soát của Nền Tảng",
      "Chịu trách nhiệm về mọi khoản phí, phụ phí phát sinh từ phía ngân hàng, tổ chức phát hành thẻ hoặc ví điện tử của chính mình liên quan đến giao dịch thanh toán trên Nền Tảng",
    ],
    callout: {
      title: "Hậu quả khi vi phạm nghĩa vụ",
      text: "Vi phạm bất kỳ nghĩa vụ nào tại Mục này có thể dẫn đến việc Earthoria từ chối xử lý Đơn hàng, tạm khoá tính năng thanh toán, hoặc chấm dứt Tài khoản gia đình theo Mục 22 - không loại trừ trách nhiệm pháp lý khác theo quy định hiện hành.",
    },
  },
  {
    id: "phu-phi-cod",
    num: "12",
    title: "Phụ Phí Thu Hộ Với COD",
    paragraphs: [
      "Một số khu vực giao hàng xa hoặc Đơn hàng giá trị lớn có thể phát sinh phụ phí thu hộ (COD fee) do đơn vị vận chuyển áp dụng, tách biệt với phí vận chuyển tiêu chuẩn.",
    ],
    list: [
      "Phụ phí thu hộ (nếu có) được hiển thị rõ ràng tại bước xác nhận Đơn hàng trước khi bạn hoàn tất đặt hàng - không phát sinh ẩn sau khi đặt hàng",
      "Đơn hàng có giá trị từ 5.000.000đ trở lên được khuyến khích thanh toán online (VNPay/MoMo/Chuyển khoản QR) để giảm rủi ro và không phát sinh phụ phí thu hộ",
      "Earthoria có quyền từ chối áp dụng COD cho Đơn hàng giá trị lớn bất thường hoặc có dấu hiệu gian lận, và sẽ liên hệ trực tiếp để đề nghị phương thức thanh toán thay thế",
    ],
  },
  {
    id: "uu-dai-hang-thanh-vien",
    num: "13",
    title: "Ưu Đãi, Mã Giảm Giá & Hạng Thành Viên",
    paragraphs: [
      "Nguyên tắc dưới đây bổ sung, không thay thế, các điều khoản khuyến mãi tại Điều Khoản Dịch Vụ và Chính Sách Hạng Thành Viên.",
    ],
    list: [
      "Ưu đãi theo hạng thành viên - tính theo lịch sử chi tiêu các Đơn hàng đã thanh toán thành công - được áp dụng TỰ ĐỘNG vào giỏ hàng, không cần bạn tự nhập mã",
      "Mỗi Đơn hàng chỉ được áp dụng tối đa MỘT mã giảm giá hợp lệ tại cùng thời điểm; mã giảm giá không cộng dồn với mã giảm giá khác trừ khi có thông báo riêng cho một chương trình cụ thể",
      "Ưu đãi hạng thành viên và mã giảm giá (nếu có) được cộng dồn với nhau, nhưng tổng mức giảm của toàn bộ Đơn hàng không vượt quá giá trị tạm tính (subtotal) của Đơn hàng đó",
      "Mã giảm giá không được quy đổi thành tiền mặt, không áp dụng hồi tố cho Đơn hàng đã hoàn tất thanh toán, và tự động mất hiệu lực nếu Đơn hàng bị huỷ hoặc hết hạn thanh toán",
      "Earthoria có toàn quyền từ chối áp dụng ưu đãi, huỷ Đơn hàng hoặc thu hồi ưu đãi đã áp dụng nếu phát hiện hành vi lạm dụng mã giảm giá, tạo tài khoản ảo, hoặc gian lận dưới bất kỳ hình thức nào, mà không cần báo trước",
    ],
  },
  {
    id: "hoa-don-vat",
    num: "14",
    title: "Hoá Đơn Giá Trị Gia Tăng (VAT)",
    paragraphs: [
      "Earthoria xuất hoá đơn điện tử hợp lệ theo quy định pháp luật Việt Nam cho mọi Đơn hàng có yêu cầu, không phân biệt phương thức thanh toán.",
    ],
    list: [
      'Chọn "Yêu cầu xuất hoá đơn (VAT)" và điền đầy đủ thông tin công ty/mã số thuế (nếu xuất cho doanh nghiệp) ngay tại bước đặt hàng, trước khi hoàn tất thanh toán',
      "Hoá đơn điện tử được gửi qua email đăng ký tài khoản trong vòng 3-5 ngày làm việc sau khi Đơn hàng được xác nhận thanh toán thành công",
      "Yêu cầu xuất hoá đơn sau khi Đơn hàng đã hoàn tất vẫn được hỗ trợ trong vòng 30 ngày kể từ ngày mua, vui lòng liên hệ bộ phận hỗ trợ kèm mã đơn hàng",
      "Thông tin xuất hoá đơn không thể chỉnh sửa sau khi hoá đơn điện tử đã được phát hành theo quy định của cơ quan thuế - vui lòng kiểm tra kỹ trước khi gửi yêu cầu",
    ],
  },
  {
    id: "huy-don-thanh-toan",
    num: "15",
    title: "Huỷ Đơn Hàng & Mối Liên Hệ Với Thanh Toán",
    paragraphs: [
      "Việc huỷ Đơn hàng được xử lý khác nhau tuỳ vào Đơn hàng đó đã được thanh toán thành công hay chưa - đây là ranh giới bắt buộc và không có ngoại lệ.",
    ],
    list: [
      "Đơn hàng CHƯA thanh toán thành công (trạng thái Chờ xử lý hoặc Đã xác nhận) có thể được bạn tự huỷ trong mục Đơn hàng của tôi, với điều kiện bắt buộc phải nhập chính xác mã đơn hàng hiển thị và nêu rõ lý do huỷ",
      "Đơn hàng ĐÃ thanh toán thành công KHÔNG THỂ tự huỷ trực tiếp trên Nền Tảng; bạn cần liên hệ bộ phận hỗ trợ để được xử lý theo quy trình yêu cầu hoàn tiền tại Mục 17 và Chính Sách Trả Hàng & Hoàn Tiền, vì việc huỷ ở bước này chỉ hoàn kho/hoàn lượt mã giảm giá chứ không tự động hoàn số tiền đã thu",
      "Earthoria có quyền chủ động huỷ Đơn hàng và hoàn tiền đầy đủ (nếu đã thu tiền) trong các trường hợp: phát hiện lỗi hiển thị giá, hết hàng ngoài dự kiến, nghi ngờ gian lận, hoặc thông tin giao hàng/thanh toán không hợp lệ",
      "Việc huỷ Đơn hàng dù do bạn hay do Earthoria khởi xướng đều không làm phát sinh nghĩa vụ bồi thường thiệt hại nào khác ngoài việc hoàn trả số tiền đã thanh toán tương ứng với phần nghĩa vụ chưa thực hiện",
    ],
  },
  {
    id: "that-bai-tranh-chap",
    num: "16",
    title: "Thanh Toán Thất Bại, Trừ Tiền Trùng & Tranh Chấp Giao Dịch",
    paragraphs: [
      "Giao dịch có thể không thành công vì nhiều lý do đến từ ngân hàng, ví điện tử hoặc kết nối mạng. Earthoria xử lý các trường hợp này theo nguyên tắc minh bạch và không giữ tiền của bạn.",
    ],
    list: [
      "Nếu Cổng Thanh Toán báo giao dịch thất bại hoặc bị huỷ, Đơn hàng vẫn ở trạng thái Chưa thanh toán và bạn có thể thử lại ngay hoặc chọn phương thức khác trong thời hạn Phiên còn lại",
      "Nếu tiền đã bị trừ từ tài khoản/thẻ của bạn nhưng Earthoria hiển thị Đơn hàng là chưa thanh toán hoặc thất bại, đây thường là giao dịch đang xử lý phía ngân hàng - vui lòng đợi tối đa 24 giờ trước khi liên hệ hỗ trợ kèm mã đơn hàng và biên lai giao dịch",
      "Trường hợp xác nhận có giao dịch trừ tiền thành công nhưng Đơn hàng không được ghi nhận, Earthoria hoàn tiền 100% qua đúng phương thức đã thanh toán trong vòng 5-10 ngày làm việc sau khi đối soát với Cổng Thanh Toán",
      "Bị trừ tiền nhiều lần cho cùng một Đơn hàng do lỗi kỹ thuật (double-charge): các giao dịch trùng lặp được hệ thống nhận diện và hoàn tự động, hoặc thủ công sau khi bạn báo cáo, trong vòng 5-10 ngày làm việc",
      "Mọi khiếu nại về giao dịch cần được gửi trong vòng 30 ngày kể từ ngày phát sinh giao dịch, kèm theo biên lai/lịch sử giao dịch từ ngân hàng hoặc ví điện tử; Earthoria có quyền từ chối xử lý khiếu nại gửi sau thời hạn này nếu không còn đủ dữ liệu để đối soát",
    ],
  },
  {
    id: "hoan-tien",
    num: "17",
    title: "Hoàn Tiền",
    paragraphs: [
      "Việc hoàn tiền do huỷ đơn, đổi trả hàng hoặc sự cố thanh toán được thực hiện theo đúng phương thức thanh toán ban đầu của Đơn hàng. Chi tiết đầy đủ về điều kiện và thời gian đổi trả được quy định tại Chính Sách Trả Hàng & Hoàn Tiền.",
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
    id: "phong-chong-gian-lan",
    num: "18",
    title: "Phòng Chống Gian Lận & Bảo Mật Giao Dịch",
    paragraphs: [
      "An toàn tài chính của bạn là ưu tiên hàng đầu. Earthoria áp dụng nhiều lớp kiểm soát và có quyền hành động ngay khi phát hiện dấu hiệu bất thường.",
    ],
    list: [
      "Earthoria giám sát tự động các dấu hiệu gian lận: nhiều Đơn hàng giá trị lớn trong thời gian ngắn, nhiều lần thanh toán thất bại liên tiếp, sử dụng nhiều phương thức thanh toán khác nhau bất thường trên cùng một tài khoản, hoặc thông tin giao hàng không nhất quán với lịch sử tài khoản",
      "Khi phát hiện dấu hiệu bất thường, Earthoria có quyền tạm giữ Đơn hàng để xác minh thêm, yêu cầu bạn cung cấp thông tin bổ sung, từ chối xử lý Đơn hàng, hoặc tạm khoá Tài khoản gia đình cho đến khi xác minh hoàn tất, mà không cấu thành vi phạm nghĩa vụ của Earthoria",
      "Toàn bộ callback/webhook xác nhận thanh toán đều được xác thực bằng chữ ký số hoặc khoá xác thực trước khi được chấp nhận; giao dịch có chữ ký/khoá xác thực sai bị ghi nhận là nghi giả mạo và bị từ chối tuyệt đối",
      "Earthoria KHÔNG BAO GIỜ chủ động liên hệ qua điện thoại, tin nhắn hoặc email để yêu cầu bạn cung cấp mã OTP, mật khẩu, hoặc thông tin đầy đủ của thẻ thanh toán",
      "Earthoria có quyền từ chối áp dụng COD cho các Đơn hàng có giá trị hoặc tần suất bất thường và đề nghị chuyển sang phương thức thanh toán trực tuyến để giảm thiểu rủi ro",
    ],
    callout: {
      title: "Earthoria không bao giờ hỏi mã OTP",
      text: "Mọi yêu cầu cung cấp mã OTP, mật khẩu hoặc thông tin thẻ dưới danh nghĩa Earthoria đều là hành vi giả mạo. Vui lòng không cung cấp và báo ngay cho chúng tôi qua kênh hỗ trợ chính thức.",
    },
  },
  {
    id: "lien-tuc-bao-tri",
    num: "19",
    title: "Tính Liên Tục Của Dịch Vụ Thanh Toán Trong Thời Gian Bảo Trì",
    paragraphs: [
      "Bảo trì hệ thống là hoạt động cần thiết nhưng không được phép làm gián đoạn các giao dịch đã được bạn khởi tạo hợp lệ trước đó.",
    ],
    list: [
      "Trong thời gian Nền Tảng tạm ngừng hoạt động để bảo trì, bạn sẽ không thể khởi tạo Đơn hàng mới hoặc mở Phiên thanh toán mới",
      "Các kênh xác nhận thanh toán chính thức (IPN của VNPay/MoMo) vẫn được duy trì hoạt động trong suốt thời gian bảo trì, đảm bảo các giao dịch đã khởi tạo trước đó vẫn được ghi nhận và xử lý đầy đủ, không bị mất hoặc trì hoãn do bảo trì hệ thống",
      "Earthoria không chịu trách nhiệm cho các gián đoạn phát sinh từ phía Cổng Thanh Toán hoặc hạ tầng mạng nằm ngoài khả năng kiểm soát hợp lý của Earthoria",
    ],
  },
  {
    id: "luu-tru-du-lieu",
    num: "20",
    title: "Lưu Trữ Dữ Liệu Giao Dịch & Bảo Mật Thông Tin",
    paragraphs: [
      "Bảo mật dữ liệu thanh toán được thực hiện theo nguyên tắc tối thiểu hoá dữ liệu lưu trữ trực tiếp trên hệ thống Earthoria.",
    ],
    list: [
      "Earthoria không thu thập và không lưu trữ số thẻ đầy đủ, ngày hết hạn, mã CVV/CVC hay mã OTP dưới bất kỳ hình thức nào; các thông tin này được nhập và xử lý trực tiếp bởi Cổng Thanh Toán đạt chuẩn bảo mật PCI DSS",
      "Dữ liệu giao dịch (lịch sử đơn hàng, số tiền, phương thức, thời điểm thanh toán) được lưu trữ trong 10 năm theo quy định pháp luật về kế toán và thuế hiện hành, kể cả sau khi bạn yêu cầu xoá tài khoản",
      "Kết nối giữa trình duyệt/ứng dụng của bạn và hệ thống Earthoria được mã hoá theo chuẩn TLS 1.3",
      "Chi tiết đầy đủ về cách Earthoria thu thập, sử dụng, chia sẻ và bảo vệ dữ liệu cá nhân liên quan đến giao dịch được quy định tại Chính Sách Bảo Mật, là văn bản không tách rời của Chính Sách này",
    ],
  },
  {
    id: "gioi-han-trach-nhiem",
    num: "21",
    title: "Giới Hạn Trách Nhiệm",
    paragraphs: [
      "Trong phạm vi tối đa mà pháp luật Việt Nam cho phép, trách nhiệm của Earthoria liên quan đến thanh toán được giới hạn như sau.",
    ],
    list: [
      "Earthoria không chịu trách nhiệm cho thiệt hại phát sinh từ lỗi kỹ thuật, gián đoạn hoặc chậm trễ từ phía Cổng Thanh Toán, ngân hàng, hoặc nhà mạng viễn thông nằm ngoài khả năng kiểm soát hợp lý của Earthoria",
      "Earthoria không chịu trách nhiệm cho các khoản phí, phụ phí, chênh lệch tỷ giá do ngân hàng hoặc tổ chức phát hành thẻ/ví điện tử của bạn áp dụng",
      "Earthoria không chịu trách nhiệm cho hậu quả phát sinh từ việc bạn cung cấp sai thông tin thanh toán, chuyển khoản sai nội dung/số tiền, hoặc để lộ thông tin đăng nhập/OTP cho bên thứ ba",
      "Trong mọi trường hợp, tổng trách nhiệm bồi thường của Earthoria liên quan đến một giao dịch thanh toán không vượt quá giá trị thực tế của Đơn hàng liên quan",
    ],
    callout: {
      title: "Ngoại lệ không được giới hạn",
      text: "Giới hạn trách nhiệm tại Mục này không áp dụng đối với thiệt hại do lỗi cố ý hoặc vi phạm nghiêm trọng của Earthoria, và không loại trừ bất kỳ trách nhiệm nào mà pháp luật Việt Nam không cho phép loại trừ.",
    },
  },
  {
    id: "vi-pham-xu-ly",
    num: "22",
    title: "Xử Lý Vi Phạm",
    paragraphs: [
      "Earthoria có quyền áp dụng các biện pháp xử lý tương xứng khi phát hiện hành vi vi phạm liên quan đến thanh toán.",
    ],
    list: [
      "Earthoria có quyền từ chối xử lý Đơn hàng, tạm khoá tính năng thanh toán, hoặc chấm dứt Tài khoản gia đình nếu phát hiện hành vi gian lận thanh toán, sử dụng phương tiện thanh toán không hợp pháp, lạm dụng chính sách hoàn tiền/khuyến mãi, hoặc yêu cầu hoàn tiền gian dối (chargeback) lặp lại không có căn cứ",
      "Trước khi áp dụng biện pháp xử lý, trừ trường hợp khẩn cấp liên quan đến gian lận tài chính hoặc an toàn hệ thống, Earthoria sẽ thông báo qua email đăng ký và tạo cơ hội để bạn giải trình trong vòng 7 ngày",
      "Việc chấm dứt Tài khoản do vi phạm liên quan đến thanh toán không làm phát sinh nghĩa vụ hoàn trả các khoản phí, ưu đãi hoặc quyền lợi thành viên đã sử dụng trước đó",
    ],
  },
  {
    id: "thay-doi-chinh-sach",
    num: "23",
    title: "Thay Đổi Chính Sách",
    paragraphs: [
      "Earthoria có quyền sửa đổi, cập nhật Chính Sách này để phù hợp với quy định pháp luật, đối tác Cổng Thanh Toán mới, hoặc yêu cầu vận hành.",
    ],
    list: [
      "Đối với thay đổi ảnh hưởng đáng kể đến quyền lợi của bạn, Earthoria sẽ thông báo trước tối thiểu 14 ngày qua email đăng ký hoặc thông báo nổi bật trên Nền Tảng",
      "Việc bạn tiếp tục sử dụng tính năng thanh toán sau khi thay đổi có hiệu lực được xem là chấp nhận nội dung đã sửa đổi",
      "Phiên bản Chính Sách áp dụng cho một Đơn hàng là phiên bản có hiệu lực tại thời điểm bạn hoàn tất đặt hàng đó",
    ],
  },
  {
    id: "luat-ap-dung",
    num: "24",
    title: "Luật Áp Dụng & Giải Quyết Tranh Chấp",
    paragraphs: [
      "Chính Sách này được điều chỉnh và giải thích theo pháp luật Việt Nam.",
    ],
    list: [
      "Mọi tranh chấp phát sinh liên quan đến thanh toán trước tiên được giải quyết thông qua thương lượng, hoà giải thiện chí giữa hai bên trong vòng 30 ngày kể từ ngày phát sinh tranh chấp",
      "Trường hợp không đạt được thoả thuận, tranh chấp sẽ được đưa ra giải quyết tại Toà án có thẩm quyền theo quy định của pháp luật Việt Nam",
    ],
  },
  {
    id: "lien-he",
    num: "25",
    title: "Liên Hệ Hỗ Trợ Thanh Toán",
    paragraphs: [
      "Đội ngũ hỗ trợ thanh toán của Earthoria hoạt động từ 8:00 đến 21:00, bảy ngày trong tuần. Khi liên hệ, vui lòng cung cấp mã đơn hàng và ảnh chụp biên lai/lịch sử giao dịch để được xử lý nhanh nhất.",
    ],
  },
];

const FAQS = [
  {
    q: "Tôi có thể đổi phương thức thanh toán sau khi đã đặt hàng không?",
    a: "Nếu Đơn hàng chưa hoàn tất thanh toán và vẫn trong thời hạn Phiên, bạn có thể huỷ và đặt lại với phương thức khác. Nếu đã thanh toán thành công, việc đổi phương thức không còn khả thi - bạn có thể yêu cầu hoàn tiền theo Mục 17 rồi đặt lại nếu Đơn hàng chưa được xử lý giao hàng.",
  },
  {
    q: "Earthoria có hỗ trợ trả góp qua thẻ tín dụng không?",
    a: "Hiện tại Earthoria chưa hỗ trợ trả góp trực tiếp trên Nền Tảng. Một số ngân hàng phát hành thẻ tín dụng có thể tự chuyển đổi giao dịch VNPay của bạn thành trả góp sau khi thanh toán - vui lòng liên hệ trực tiếp ngân hàng phát hành thẻ để biết điều kiện áp dụng.",
  },
  {
    q: "Vì sao đơn hàng của tôi bị huỷ dù tôi đã quét mã QR chuyển khoản?",
    a: "Phiên chuyển khoản QR chỉ có hiệu lực đúng 15 phút kể từ khi mã QR được hiển thị. Trường hợp này thường xảy ra khi giao dịch được thực hiện sau khi Phiên đã hết hạn, hoặc nội dung chuyển khoản không đúng cú pháp hệ thống yêu cầu nên không đối soát được tự động. Liên hệ hỗ trợ kèm biên lai chuyển khoản trong vòng 7 ngày để được xác minh và xử lý thủ công.",
  },
  {
    q: "Thanh toán MoMo/VNPay có mất phí giao dịch không?",
    a: "Earthoria không thu thêm bất kỳ khoản phí nào khi bạn thanh toán qua VNPay, MoMo hay Chuyển khoản QR. Một số ngân hàng hoặc ví điện tử có thể áp dụng phí giao dịch riêng theo chính sách của họ - vui lòng kiểm tra với đơn vị phát hành.",
  },
  {
    q: "Tôi có thể thanh toán một phần bằng ví MoMo và phần còn lại bằng COD không?",
    a: "Không. Theo Mục 05, mỗi Đơn hàng chỉ áp dụng một phương thức thanh toán duy nhất cho toàn bộ giá trị. Nếu muốn dùng nhiều phương thức khác nhau, bạn cần tách thành các Đơn hàng riêng biệt.",
  },
  {
    q: "Con tôi có thể tự thanh toán để mua sách không?",
    a: "Không. Theo Mục 04, chỉ chủ Tài khoản gia đình từ đủ 18 tuổi mới có quyền thực hiện thanh toán. Hồ sơ trẻ em chỉ có thể gửi Yêu cầu mua sách để Phụ huynh xem xét và tự tay hoàn tất thanh toán.",
  },
  {
    q: "Earthoria có bao giờ gọi điện hỏi mã OTP của tôi không?",
    a: "Không bao giờ. Earthoria không chủ động liên hệ qua điện thoại, tin nhắn hay email để hỏi mã OTP, mật khẩu hoặc thông tin thẻ. Nếu nhận được yêu cầu như vậy dưới danh nghĩa Earthoria, vui lòng không cung cấp và báo ngay cho bộ phận hỗ trợ.",
  },
  {
    q: "Đơn hàng của tôi hiển thị đang được xác minh, nghĩa là sao?",
    a: "Hệ thống của Earthoria giám sát các dấu hiệu bất thường trong giao dịch để bảo vệ tài khoản của bạn và ngăn gian lận. Khi phát hiện dấu hiệu cần kiểm tra thêm, Đơn hàng có thể tạm thời được giữ lại để xác minh trước khi xử lý tiếp - đây là biện pháp bảo vệ, không phải lỗi hệ thống, và thường được xử lý trong vòng 24 giờ.",
  },
  {
    q: "Mã giảm giá và ưu đãi hạng thành viên có được cộng dồn không?",
    a: "Có. Ưu đãi hạng thành viên được tự động áp dụng và cộng dồn với một mã giảm giá hợp lệ trong cùng Đơn hàng, nhưng tổng mức giảm không vượt quá giá trị tạm tính của Đơn hàng đó. Mỗi Đơn hàng chỉ dùng được tối đa một mã giảm giá.",
  },
  {
    q: "Tôi có thể dùng thẻ của người khác để thanh toán giúp họ không?",
    a: "Bạn chỉ được sử dụng phương tiện thanh toán thuộc quyền sở hữu hợp pháp của mình hoặc đã được chủ sở hữu uỷ quyền hợp lệ, theo Mục 04. Việc sử dụng thẻ/tài khoản của người khác mà không có sự đồng ý của họ là vi phạm nghiêm trọng và có thể bị xử lý theo Mục 22, không loại trừ trách nhiệm pháp lý khác.",
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
        .legal-faq-item.open .legal-faq-answer { max-height: 360px; padding-bottom: 26px; }

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
            Quy định đầy đủ, chặt chẽ và có giá trị ràng buộc về phương thức,
            quy trình, nghĩa vụ và bảo mật cho mọi giao dịch thanh toán trên
            Earthoria.
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
