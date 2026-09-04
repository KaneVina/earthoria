import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  Sparkles,
  Database,
  ShieldCheck,
  SlidersHorizontal,
  Mic,
  Volume2,
  AlertTriangle,
  Stethoscope,
  Trash2,
  Ban,
  Users,
  Baby,
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
  BookOpen,
} from "lucide-react";

/*
   META & CONTENT DATA
 */
const META = {
  effectiveDate: "04 Tháng 09, 2026",
  updatedDate: "04 Tháng 09, 2026",
  version: "v1.0",
};

const SUMMARY_CARDS = [
  {
    icon: Sparkles,
    title: "Minh bạch tuyệt đối",
    desc: "Chúng tôi giải thích rõ Eira AI là gì, dữ liệu nào được dùng và AI có thể sai ở đâu — không thuật ngữ mập mờ.",
  },
  {
    icon: Database,
    title: "Chỉ dùng dữ liệu thật",
    desc: "AI chỉ trả lời dựa trên dữ liệu sách, giá, tồn kho và đơn hàng lấy trực tiếp từ hệ thống tại thời điểm hỏi — không tự bịa số liệu.",
  },
  {
    icon: Baby,
    title: "Trẻ em được bảo vệ đặc biệt",
    desc: "Giọng nói và hội thoại của trẻ không dùng cho quảng cáo, được xóa tự động và luôn nằm dưới sự giám sát của phụ huynh.",
  },
  {
    icon: SlidersHorizontal,
    title: "Bạn luôn kiểm soát",
    desc: "Xóa hội thoại, tắt giọng đọc, hoặc yêu cầu hỗ trợ từ nhân viên thật bất cứ lúc nào — không bắt buộc phải qua AI.",
  },
];

const AI_DATA_TABLE = [
  {
    name: "Nội dung tin nhắn bạn gửi",
    source: "Bạn nhập trực tiếp",
    purpose: "Hiểu câu hỏi để tạo phản hồi phù hợp",
    scope: "Chỉ trong phiên chat hiện tại",
  },
  {
    name: "Lịch sử hội thoại gần đây",
    source: "Phiên chat hiện tại",
    purpose: "Giữ mạch trò chuyện tự nhiên, không hỏi lại thông tin đã cho",
    scope: "Tối đa 18 tin nhắn gần nhất, tự động cắt bớt phần cũ",
  },
  {
    name: "Dữ liệu sách thời gian thực",
    source: "Cơ sở dữ liệu Earthoria",
    purpose: "Gợi ý sách, so sánh, trả lời câu hỏi nội dung/độ tuổi phù hợp",
    scope:
      "Tên, giá, tồn kho, danh mục, độ tuổi, chủ đề, tóm tắt do Earthoria biên soạn",
  },
  {
    name: "Mã giảm giá đang hoạt động",
    source: "Cơ sở dữ liệu Earthoria",
    purpose: "Kiểm tra và xem trước số tiền được giảm",
    scope: "Chỉ mã đang còn hiệu lực tại thời điểm hỏi",
  },
  {
    name: "Đơn hàng của bạn",
    source: "Tài khoản đã đăng nhập",
    purpose: "Tra cứu trạng thái đơn khi bạn hỏi",
    scope:
      "Chỉ đơn hàng của chính bạn, tối đa 50 đơn gần nhất — không bao giờ truy cập đơn của người khác",
  },
  {
    name: "Tên & email tài khoản",
    source: "Tài khoản đã đăng nhập",
    purpose: "Tạo phiếu hỗ trợ khi chuyển tiếp yêu cầu cho nhân viên thật",
    scope: "Chỉ dùng khi bạn yêu cầu chuyển tiếp/khiếu nại",
  },
];

const SECTIONS = [
  {
    id: "gioi-thieu",
    num: "01",
    title: "Giới Thiệu & Phạm Vi Áp Dụng",
    paragraphs: [
      'Earthoria sử dụng trí tuệ nhân tạo (AI) tại nhiều điểm chạm trong trải nghiệm sản phẩm — tiêu biểu là trợ lý ảo Eira AI trong khung chat, tính năng hỏi-đáp bằng giọng nói trong trải nghiệm AR, và các gợi ý cá nhân hóa nội dung sách. Chính sách An toàn & Minh bạch AI ("Chính sách") này giải thích rõ ràng các hệ thống AI đó là gì, cách chúng xử lý dữ liệu, giới hạn thực tế của chúng, và quyền kiểm soát mà bạn luôn có.',
      "Chính sách này bổ sung cho Chính sách Bảo mật và Điều khoản Dịch vụ của Earthoria, không thay thế các tài liệu đó. Trong trường hợp có khác biệt về xử lý dữ liệu cá nhân, Chính sách Bảo mật là tài liệu tham chiếu đầy đủ nhất.",
    ],
  },
  {
    id: "eira-ai-la-gi",
    num: "02",
    title: "Eira AI Là Gì",
    paragraphs: [
      "Eira là trợ lý ảo và cũng là linh vật đại diện của Earthoria, ra mắt ngày 03/06/2026. Khi bạn trò chuyện với Eira trong khung chat hoặc hỏi bằng giọng nói trong trải nghiệm AR, bạn đang tương tác với một hệ thống phần mềm tự động kết hợp mô hình ngôn ngữ để hiểu và tạo câu trả lời, cùng dữ liệu thật lấy trực tiếp từ hệ thống Earthoria tại thời điểm bạn hỏi.",
      "Eira KHÔNG phải là người thật, không có ý thức hay cảm xúc, và không đưa ra quyết định thay bạn. Đây là một công cụ được thiết kế để tư vấn sách, tra cứu tồn kho/đơn hàng/mã giảm giá, và kết nối bạn với nhân viên thật khi cần — luôn hoạt động trong phạm vi các quy tắc an toàn được Earthoria cấu hình sẵn.",
    ],
    list: [
      "Chỉ trả lời dựa trên dữ liệu thật của hệ thống — được lập trình để từ chối tự bịa số liệu giá, tồn kho hay khuyến mãi",
      "Không bao giờ tiết lộ, xác nhận hay mô tả bất kỳ thông tin nào về khu vực quản trị nội bộ (dashboard), dù được hỏi trực tiếp hay hỏi vòng vo",
      "Từ chối trả lời các chủ đề nhạy cảm về chính trị, tôn giáo, chiến tranh, giới tính hay định kiến",
      'Trên hồ sơ trẻ em, Eira chuyển sang giao diện và tông giọng phù hợp lứa tuổi hơn ("Eira dành cho trẻ")',
    ],
    callout: {
      title: "Không phải là con người, không thay thế con người",
      text: "Eira là một công cụ hỗ trợ tự động. Với mọi vấn đề cần sự đồng cảm, phán đoán chuyên môn hoặc trách nhiệm pháp lý, đội ngũ nhân viên thật của Earthoria luôn sẵn sàng tiếp nhận qua các kênh liên hệ chính thức.",
    },
  },
  {
    id: "xu-ly-du-lieu",
    num: "03",
    title: "AI Xử Lý Dữ Liệu Của Bạn Như Thế Nào",
    paragraphs: [
      "Mỗi khi bạn gửi một câu hỏi, hệ thống của Earthoria thực hiện một quy trình gồm nhiều bước để đảm bảo câu trả lời vừa chính xác vừa an toàn, thay vì để mô hình AI tự do trả lời từ trí nhớ của nó.",
    ],
    list: [
      "Bước 1 — Tiếp nhận: tin nhắn của bạn được giới hạn độ dài và làm sạch trước khi xử lý",
      "Bước 2 — Truy xuất dữ liệu thật: hệ thống tự động tra cứu sách, giá, tồn kho, mã giảm giá liên quan trực tiếp từ cơ sở dữ liệu Earthoria tại đúng thời điểm bạn hỏi, không dùng số liệu cũ ghi nhớ sẵn",
      "Bước 3 — Ghép ngữ cảnh: câu hỏi, lịch sử hội thoại gần nhất và dữ liệu vừa truy xuất được ghép lại thành ngữ cảnh gửi cho mô hình ngôn ngữ xử lý",
      "Bước 4 — Gọi công cụ khi cần: nếu cần thông tin chính xác hơn (kiểm tra tồn kho, chi tiết một cuốn sách, trạng thái đơn hàng, áp mã giảm giá, hoặc chuyển tiếp cho nhân viên), mô hình sẽ tự động gọi đúng công cụ nội bộ tương ứng thay vì đoán",
      "Bước 5 — Phản hồi: kết quả được trả về dưới dạng văn bản, có thể đọc thành tiếng nếu bạn bật loa, kèm liên kết điều hướng nếu phù hợp",
    ],
    callout: {
      title: "Cơ chế bảo vệ tích hợp sẵn",
      text: 'Hệ thống được lập trình để không bao giờ đổi các quy tắc an toàn dù người dùng cố tình yêu cầu "bỏ qua hướng dẫn trước đó", giả làm quản trị viên, hay tìm cách khai thác thông tin nội bộ. Một phần hạ tầng xử lý ngôn ngữ tự nhiên được cung cấp bởi đối tác công nghệ, hoạt động theo hợp đồng xử lý dữ liệu (Data Processing Agreement) nghiêm ngặt.',
    },
  },
  {
    id: "du-lieu-tao-phan-hoi",
    num: "04",
    title: "Dữ Liệu Nào Được Dùng Để Tạo Phản Hồi",
    paragraphs: [
      "Bảng dưới đây liệt kê đầy đủ và chính xác những loại dữ liệu mà Eira AI có thể sử dụng để tạo một câu trả lời — không có nguồn dữ liệu nào khác nằm ngoài danh sách này.",
    ],
    showTable: true,
  },
  {
    id: "khong-su-dung",
    num: "05",
    title: "Những Gì AI Không Bao Giờ Được Dùng",
    paragraphs: [
      "Để đảm bảo an toàn và công bằng, một số loại dữ liệu và khu vực hệ thống bị chặn tuyệt đối khỏi phạm vi truy cập của AI, bất kể cách câu hỏi được đặt ra như thế nào.",
    ],
    list: [
      "Dữ liệu, đơn hàng hay thông tin cá nhân của bất kỳ khách hàng nào khác ngoài chính bạn",
      "Bất kỳ đường dẫn, tên trang, cấu trúc dữ liệu hay chi tiết kỹ thuật nào của khu vực quản trị nội bộ (/dashboard)",
      "Mật khẩu, mã xác thực (OTP), hoặc thông tin thanh toán chi tiết như số thẻ ngân hàng",
      "Toàn văn nội dung sách có bản quyền — AI chỉ dùng tóm tắt/chủ đề do Earthoria biên soạn, không phải nguyên văn tác phẩm",
    ],
  },
  {
    id: "giong-noi-ai",
    num: "06",
    title: "Giọng Nói AI (Voice AI) Được Lưu Trữ Bao Lâu",
    paragraphs: [
      "Earthoria sử dụng giọng nói AI theo hai chiều khác nhau, mỗi chiều có nguyên tắc lưu trữ riêng — chúng tôi tách bạch rõ ràng để bạn không nhầm lẫn.",
    ],
    list: [
      "Đọc phản hồi thành tiếng (AI nói cho bạn nghe) — được xử lý cục bộ ngay trên trình duyệt/thiết bị của bạn, không gửi lên máy chủ và không được lưu trữ dưới bất kỳ hình thức nào; bạn có thể bật/tắt bất cứ lúc nào bằng nút loa trong khung chat",
      'Ghi âm giọng nói khi bạn hỏi AI ("bạn/con bạn nói cho AI nghe") — chỉ được kích hoạt khi bạn chủ động nhấn giữ nút micro, không bao giờ tự động lắng nghe liên tục',
      "Đoạn ghi âm được xử lý để nhận diện và tạo phản hồi, sau đó tự động xóa trong vòng tối đa 24 giờ",
      "Ngoại lệ duy nhất: phụ huynh có thể chủ động chọn lưu lại để cá nhân hóa trải nghiệm cho hồ sơ trẻ — việc lưu này luôn cần xác nhận rõ ràng, không mặc định bật",
      "Dữ liệu giọng nói không bao giờ được dùng cho mục đích quảng cáo, và được ẩn danh hóa trước khi xử lý bởi đối tác hạ tầng",
    ],
    showDataGrid: true,
  },
  {
    id: "ai-co-the-sai",
    num: "07",
    title: "AI Có Thể Sai Như Thế Nào",
    paragraphs: [
      "Dù được thiết kế để luôn bám sát dữ liệu thật, AI vẫn là một mô hình xác suất ngôn ngữ và không thể đảm bảo chính xác tuyệt đối trong mọi tình huống. Chúng tôi muốn bạn hiểu rõ những giới hạn này thay vì tin tưởng mù quáng.",
    ],
    list: [
      "AI có thể hiểu sai ý một câu hỏi phức tạp, mơ hồ hoặc viết tắt, dẫn đến câu trả lời lệch trọng tâm",
      "Tóm tắt nội dung/chủ đề sách là bản biên soạn của Earthoria, có thể chưa phản ánh đầy đủ mọi chi tiết của cuốn sách gốc",
      "AI có thể từ chối hoặc trả lời không đầy đủ với các câu hỏi nằm ngoài phạm vi được huấn luyện (chính trị, tôn giáo, y tế chuyên sâu...) — đây là giới hạn có chủ đích, không phải lỗi hệ thống",
      "Trong một số ít trường hợp hiếm gặp, mô hình ngôn ngữ vẫn có thể tạo ra câu trả lời không chính xác (hiện tượng thường gọi là 'ảo giác AI') dù đã có cơ chế chỉ dùng dữ liệu thật",
      "Số liệu về giá, tồn kho hay khuyến mãi hiển thị bởi AI phản ánh đúng thời điểm bạn hỏi và có thể thay đổi sau đó",
    ],
    callout: {
      title: "Luôn xác minh với thông tin quan trọng",
      text: "Với các quyết định quan trọng — đặt hàng số lượng lớn, tranh chấp thanh toán, hoặc bất kỳ điều gì bạn không chắc chắn — hãy xác nhận lại qua trang chi tiết sản phẩm, email helpdesk.earthoria@gmail.com, hoặc yêu cầu Eira chuyển tiếp cho nhân viên thật.",
    },
  },
  {
    id: "khong-thay-the-chuyen-gia",
    num: "08",
    title: "Không Dùng AI Thay Thế Chuyên Gia Trong Các Quyết Định Quan Trọng",
    paragraphs: [
      "Eira AI và các tính năng AI khác của Earthoria được xây dựng để hỗ trợ mua sắm và học tập qua chơi — không được thiết kế, và không nên được sử dụng, để thay thế cho ý kiến của các chuyên gia có chuyên môn trong những quyết định ảnh hưởng thực sự đến sức khỏe, tâm lý hoặc sự phát triển của trẻ.",
    ],
    list: [
      "Gợi ý sách theo độ tuổi/sở thích của AI chỉ mang tính tham khảo, không thay thế đánh giá chuyên môn về khả năng đọc hiểu hay nhu cầu giáo dục đặc biệt của từng trẻ — hãy tham khảo giáo viên hoặc chuyên viên giáo dục khi cần",
      "AI không đưa ra và không nên được hỏi để đưa ra lời khuyên y tế, tâm lý, pháp lý hay tài chính; với các dấu hiệu sức khỏe/tâm lý đáng lo ngại của trẻ, vui lòng liên hệ bác sĩ nhi khoa hoặc chuyên viên tâm lý",
      "Trong tình huống khẩn cấp, luôn liên hệ trực tiếp cơ quan chức năng hoặc dịch vụ cấp cứu — không nhắn tin cho AI để chờ phản hồi",
      "Mọi cam kết hợp đồng, chính sách đổi trả hay quyết định tài chính quan trọng cần được xác nhận bởi nhân viên thật hoặc tài liệu chính thức của Earthoria, không chỉ dựa vào một câu trả lời của AI",
    ],
  },
  {
    id: "quyen-kiem-soat",
    num: "09",
    title: "Quyền Kiểm Soát Của Bạn Đối Với Dữ Liệu AI",
    paragraphs: [
      "Bạn không bị bắt buộc phải sử dụng AI để tiếp cận dịch vụ của Earthoria, và luôn có quyền kiểm soát rõ ràng đối với dữ liệu liên quan đến các tương tác AI của mình.",
    ],
    list: [
      'Xóa toàn bộ hội thoại hiện tại bất cứ lúc nào bằng nút "Xóa hội thoại" trong khung chat',
      "Tắt giọng đọc AI (text-to-speech) bằng nút loa, không ảnh hưởng đến khả năng nhắn tin",
      "Từ chối sử dụng AI và yêu cầu hỗ trợ trực tiếp từ nhân viên thật qua email hoặc hotline bất cứ lúc nào",
      "Yêu cầu Bộ phận Bảo vệ Dữ liệu (DPO) xóa nhật ký hội thoại đã lưu trên hệ thống liên quan đến tài khoản của bạn",
      'Với hồ sơ trẻ em, phụ huynh có toàn quyền xem, giới hạn hoặc tắt tính năng Trợ lý AI thông qua "Bảng điều khiển gia đình"',
    ],
  },
  {
    id: "quy-dinh-noi-dung-ai",
    num: "10",
    title: "Quy Định Đối Với Nội Dung Do AI Tạo Ra",
    paragraphs: [
      "Nội dung do Eira AI hoặc bất kỳ hệ thống AI nào của Earthoria tạo ra phải tuân theo các quy định sau, nhằm đảm bảo tính minh bạch và tránh gây hiểu lầm.",
    ],
    list: [
      "Nội dung AI tạo ra mang tính chất tư vấn/hỗ trợ, không phải cam kết hợp đồng chính thức của Earthoria trừ khi được nhân viên có thẩm quyền xác nhận lại bằng văn bản",
      "AI không được phép, và không được lập trình để tự nhận là con người hoặc giả mạo là nhân viên chính thức của Earthoria",
      "Nội dung liên quan đến sách chỉ dựa trên tóm tắt/chủ đề do Earthoria biên soạn nhằm bảo vệ bản quyền tác phẩm gốc, không công khai toàn văn bất kỳ cuốn sách nào",
      "Nghiêm cấm sao chép, trích dẫn lại phản hồi của AI cho mục đích thương mại của bên thứ ba mà không có sự đồng ý bằng văn bản từ Earthoria",
      "AI được lập trình từ chối tạo nội dung liên quan đến chính trị, tôn giáo, bạo lực, phân biệt đối xử hoặc bất kỳ chủ đề nào không phù hợp với đối tượng người dùng có trẻ em",
      "Người dùng có thể báo cáo bất kỳ phản hồi nào của AI mà họ cho là sai lệch, không phù hợp hoặc gây hiểu lầm qua các kênh liên hệ ở cuối trang này",
    ],
  },
  {
    id: "an-toan-tre-em",
    num: "11",
    title: "An Toàn Trẻ Em Khi Tương Tác Với AI",
    paragraphs: [
      "Vì trẻ em là một phần đối tượng sử dụng chính của Earthoria, mọi tính năng AI đều được thiết kế với nguyên tắc bảo vệ trẻ em ở mức cao nhất, tương tự nguyên tắc áp dụng cho cookie và dữ liệu cá nhân.",
    ],
    list: [
      'Trên hồ sơ được đánh dấu là trẻ em, giao diện chuyển sang phiên bản "Eira dành cho trẻ" với tông giọng và nội dung phù hợp lứa tuổi hơn',
      "Không bao giờ hiển thị quảng cáo hay gợi ý mang tính thương mại ép buộc trong hội thoại với hồ sơ trẻ em",
      "Dữ liệu giọng nói và hội thoại của trẻ không bao giờ được dùng để xây dựng hồ sơ quảng cáo dưới bất kỳ hình thức nào",
      "Phụ huynh luôn có thể xem lại và xóa dữ liệu tương tác AI của con mình thông qua Bảng điều khiển gia đình",
    ],
    callout: {
      title: "Phát hiện nội dung không phù hợp?",
      text: "Nếu bạn phát hiện Eira AI phản hồi điều gì đó không phù hợp trên hồ sơ trẻ em, vui lòng báo ngay cho Bộ phận Bảo vệ Dữ liệu để được xử lý và khắc phục trong thời gian sớm nhất.",
    },
  },
  {
    id: "thay-doi-lien-he",
    num: "12",
    title: "Thay Đổi Chính Sách Này & Liên Hệ",
    paragraphs: [
      "Chúng tôi có thể cập nhật Chính sách An toàn & Minh bạch AI theo thời gian để phản ánh thay đổi về công nghệ, tính năng mới hoặc quy định pháp luật. Phiên bản mới nhất luôn được đăng công khai tại trang này kèm ngày cập nhật rõ ràng, và những thay đổi quan trọng ảnh hưởng đến quyền lợi của bạn sẽ được thông báo trước.",
      "Nếu bạn có câu hỏi về cách Earthoria xây dựng và vận hành các hệ thống AI, hoặc muốn thực hiện bất kỳ quyền nào nêu tại Mục 09, Bộ phận Bảo vệ Dữ liệu (DPO) luôn sẵn sàng hỗ trợ qua các kênh liên hệ được liệt kê ở cuối trang.",
    ],
  },
];

const FAQS = [
  {
    q: "Eira có phải là người thật đang trả lời tôi không?",
    a: "Không. Eira là một hệ thống phần mềm tự động kết hợp mô hình AI và dữ liệu thật từ hệ thống Earthoria. Với các vấn đề cần sự đồng cảm hoặc phán đoán chuyên môn, bạn có thể yêu cầu Eira chuyển tiếp cho nhân viên thật bất cứ lúc nào.",
  },
  {
    q: "AI có lưu lại toàn bộ cuộc trò chuyện của tôi mãi mãi không?",
    a: 'Không. Lịch sử hội thoại trong một phiên chỉ giữ tối đa 18 tin nhắn gần nhất và tự động cắt bớt phần cũ. Bạn cũng có thể bấm "Xóa hội thoại" để xóa ngay lập tức, hoặc yêu cầu DPO xóa nhật ký đã lưu trên hệ thống.',
  },
  {
    q: "Con tôi trò chuyện với AI có an toàn không?",
    a: 'Có, với nhiều lớp bảo vệ: giao diện "Eira dành cho trẻ" phù hợp lứa tuổi, không quảng cáo, dữ liệu giọng nói không dùng cho mục đích thương mại, tự động xóa trong 24 giờ, và phụ huynh luôn có thể giám sát/tắt tính năng này qua Bảng điều khiển gia đình.',
  },
  {
    q: "AI Earthoria có thể tự ý đặt hàng hoặc thay đổi tài khoản của tôi không?",
    a: "Không. Eira AI chỉ tư vấn, tra cứu thông tin và áp mã giảm giá để bạn xem trước — mọi hành động đặt hàng, thanh toán hay thay đổi tài khoản đều cần chính bạn xác nhận trực tiếp trên giao diện, AI không tự ý thực hiện thay bạn.",
  },
  {
    q: "Làm sao để báo cáo một câu trả lời sai hoặc không phù hợp từ AI?",
    a: "Bạn có thể gửi email trực tiếp tới helpdesk.earthoria@gmail.com kèm ảnh chụp màn hình hoặc mô tả cuộc trò chuyện, hoặc yêu cầu Eira chuyển tiếp yêu cầu tới nhân viên thật ngay trong khung chat. Đội ngũ của chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.",
  },
];

/*
   COMPONENT
 */
export default function AIPolicy() {
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

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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

        /* ══════════════ AI DATA TABLE ══════════════ */
        .legal-table-wrap {
          margin: 24px 0; border: 0.5px solid var(--border);
          overflow-x: auto;
        }
        .legal-ai-table {
          width: 100%; border-collapse: collapse; min-width: 720px;
        }
        .legal-ai-table thead th {
          text-align: left; font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--gold); background: var(--parchment);
          padding: 13px 16px; border-bottom: 0.5px solid var(--border);
          font-weight: 500;
        }
        .legal-ai-table tbody td {
          padding: 14px 16px; font-size: 12.5px; color: var(--text-muted);
          font-weight: 300; line-height: 1.6;
          border-bottom: 0.5px solid var(--border); vertical-align: top;
        }
        .legal-ai-table tbody tr:last-child td { border-bottom: none; }
        .legal-ai-table tbody tr:hover { background: rgba(74,158,63,0.03); }
        .legal-ai-table td.mono {
          font-family: 'Be Vietnam Pro', sans-serif; color: var(--forest);
          font-weight: 500;
        }

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
        body.dark-mode .legal-table-wrap { border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-ai-table thead th { background: #1c2822; }
        body.dark-mode .legal-ai-table tbody td { border-color: rgba(255,255,255,0.07); }
        body.dark-mode .legal-ai-table td.mono { color: #c8d4cc; }
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
        <span className="breadcrumb-current">Chính sách AI</span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="legal-hero">
        <div className="legal-hero-grid" />
        <div className="legal-hero-glow" />
        <div className="legal-hero-watermark">EARTHORIA</div>
        <div className="legal-hero-inner">
          <div className="legal-hero-icon">
            <Bot size={22} />
          </div>
          <div className="legal-hero-eyebrow">
            <span className="legal-hero-eyebrow-line" />
            <span>Pháp Lý &amp; Trí Tuệ Nhân Tạo</span>
            <span className="legal-hero-eyebrow-line" />
          </div>
          <h1 className="legal-hero-title">
            Chính Sách —<br />
            <em>An Toàn &amp; Minh Bạch AI</em>
          </h1>
          <p className="legal-hero-sub">
            Eira AI và các tính năng AI khác của Earthoria hoạt động như thế
            nào, dữ liệu nào được sử dụng, AI có thể sai ở đâu, và quyền kiểm
            soát bạn luôn có — được giải thích rõ ràng, không thuật ngữ mập mờ.
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
                Còn thắc mắc về AI?
              </div>
              <p>
                Bộ phận Bảo vệ Dữ liệu sẵn sàng giải thích thêm về cách Eira AI
                vận hành hoặc hỗ trợ thực hiện quyền của bạn.
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
                      {s.id === "khong-thay-the-chuyen-gia" ? (
                        <Stethoscope size={17} />
                      ) : s.id === "an-toan-tre-em" ? (
                        <AlertTriangle size={17} />
                      ) : s.id === "eira-ai-la-gi" ? (
                        <Users size={17} />
                      ) : (
                        <ShieldCheck size={17} />
                      )}
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

                {s.showTable && (
                  <div className="legal-table-wrap">
                    <table className="legal-ai-table">
                      <thead>
                        <tr>
                          <th>Loại dữ liệu</th>
                          <th>Nguồn</th>
                          <th>Mục đích sử dụng</th>
                          <th>Phạm vi / Giới hạn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {AI_DATA_TABLE.map((d, i) => (
                          <tr key={i}>
                            <td className="mono">{d.name}</td>
                            <td>{d.source}</td>
                            <td>{d.purpose}</td>
                            <td>{d.scope}</td>
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
                        <Volume2
                          size={11}
                          style={{ marginRight: 5, verticalAlign: -1 }}
                        />
                        Đọc phản hồi thành tiếng
                      </span>
                      <span className="legal-data-cell-val">
                        Không lưu trữ — xử lý cục bộ trên thiết bị
                      </span>
                    </div>
                    <div className="legal-data-cell">
                      <span className="legal-data-cell-label">
                        <Mic
                          size={11}
                          style={{ marginRight: 5, verticalAlign: -1 }}
                        />
                        Ghi âm giọng nói hỏi AI
                      </span>
                      <span className="legal-data-cell-val">
                        Tối đa 24 giờ, trừ khi phụ huynh chọn lưu
                      </span>
                    </div>
                    <div className="legal-data-cell">
                      <span className="legal-data-cell-label">
                        <FileText
                          size={11}
                          style={{ marginRight: 5, verticalAlign: -1 }}
                        />
                        Lịch sử hội thoại trong phiên
                      </span>
                      <span className="legal-data-cell-val">
                        Tối đa 18 tin nhắn, tự động cắt bớt
                      </span>
                    </div>
                    <div className="legal-data-cell">
                      <span className="legal-data-cell-label">
                        <Database
                          size={11}
                          style={{ marginRight: 5, verticalAlign: -1 }}
                        />
                        Nhật ký hội thoại trên hệ thống
                      </span>
                      <span className="legal-data-cell-val">
                        Theo yêu cầu xóa qua DPO
                      </span>
                    </div>
                  </div>
                )}

                {s.id === "khong-su-dung" && (
                  <div className="legal-callout" style={{ marginTop: 0 }}>
                    <div className="legal-callout-icon">
                      <Ban size={17} />
                    </div>
                    <div>
                      <div className="legal-callout-title">
                        Nguyên tắc "không bao giờ"
                      </div>
                      <p>
                        Các giới hạn này được lập trình cứng vào hệ thống —
                        không thể bị vượt qua bằng cách đặt câu hỏi khéo léo,
                        đóng vai nhân viên/quản trị viên, hay yêu cầu AI "bỏ qua
                        quy tắc trước đó".
                      </p>
                    </div>
                  </div>
                )}

                {s.id === "quyen-kiem-soat" && (
                  <div className="legal-callout" style={{ marginTop: 0 }}>
                    <div className="legal-callout-icon">
                      <Trash2 size={17} />
                    </div>
                    <div>
                      <div className="legal-callout-title">
                        Sử dụng AI luôn là lựa chọn, không phải bắt buộc
                      </div>
                      <p>
                        Mọi tính năng trên Earthoria đều có thể hoàn tất mà
                        không cần trò chuyện với AI — bạn có thể liên hệ nhân
                        viên thật qua email, hotline hoặc trang Liên hệ bất cứ
                        lúc nào.
                      </p>
                    </div>
                  </div>
                )}

                {s.id === "quy-dinh-noi-dung-ai" && (
                  <div className="legal-callout" style={{ marginTop: 0 }}>
                    <div className="legal-callout-icon">
                      <BookOpen size={17} />
                    </div>
                    <div>
                      <div className="legal-callout-title">
                        Bản quyền nội dung sách được bảo vệ
                      </div>
                      <p>
                        AI chỉ sử dụng tóm tắt và chủ đề do đội ngũ biên tập
                        Earthoria biên soạn — không bao giờ tạo ra hay hiển thị
                        toàn văn nội dung có bản quyền của bất kỳ cuốn sách nào.
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
            Bộ phận Bảo vệ Dữ liệu
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
        type="button"
        className={`legal-back-top ${showTop ? "visible" : ""}`}
        aria-label="Cuộn lên đầu trang"
        onClick={scrollToTop}
      >
        <ArrowUp size={18} />
      </button>
    </>
  );
}
