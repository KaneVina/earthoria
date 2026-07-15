import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  BookOpen,
  Baby,
  Tag,
  Smartphone,
  GitCompare,
  Copy,
  RotateCcw,
  Check,
  ChevronDown,
  Trash2,
  WifiOff,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./assets/css/EiraChatbox.css";

/* ═══════════════════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════════════════ */
const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;
const GROQ_URL = import.meta.env.VITE_GROQ_URL;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL;

const MASCOT_HIDE_DURATION = 5 * 60 * 1000; // 5 phút — ẩn tạm, không lưu vĩnh viễn
const MASCOT_FIRST_SHOW_DELAY = 3000; // 3 giây sau khi trang sẵn sàng
const MAX_INPUT_LEN = 500;
const MAX_HISTORY_TURNS = 22; // số message tối đa giữ trong bộ nhớ hội thoại
const TRIM_HISTORY_TO = 18;
const REQUEST_TIMEOUT_MS = 25000; // timeout gọi API
const SCROLL_BOTTOM_THRESHOLD = 120; // px — dưới mức này coi như đang ở cuối khung chat

/* ═══════════════════════════════════════════════════════════════
   AN TOÀN LIÊN KẾT NỘI BỘ
   Whitelist các đường dẫn công khai được phép hiển thị thành nút bấm
   trong tin nhắn của Eira. Đây là lớp phòng thủ thứ 2 (defense-in-depth):
   dù system prompt đã cấm AI nhắc /dashboard, nếu model vẫn lỡ sinh ra
   một liên kết dạng markdown trỏ tới khu vực nội bộ, hàm isSafePublicPath
   sẽ chặn và không render thành nút bấm điều hướng được.
   ═══════════════════════════════════════════════════════════════ */
const PUBLIC_LINK_WHITELIST = [
  "/",
  "/home",
  "/shop",
  "/compare",
  "/technology",
  "/blog",
  "/about",
  "/contact",
  "/cart",
  "/wishlist",
  "/checkout",
  "/profile",
  "/login",
  "/register",
  "/forgot-password",
  "/legal",
  "/legal/terms",
  "/legal/privacy",
  "/legal/shipping",
  "/legal/cookies",
  "/sitemap",
];
// Các nhóm đường dẫn động (có tham số), chỉ chấp nhận theo tiền tố
const PUBLIC_LINK_PREFIXES = ["/ar/", "/books/"];

function isSafePublicPath(path) {
  if (typeof path !== "string" || !path.startsWith("/")) return false;
  const lower = path.toLowerCase();
  // Chặn tuyệt đối mọi thứ liên quan khu vực quản trị, bất kể AI viết ra sao
  if (lower.includes("dashboard") || lower.includes("admin")) return false;
  if (PUBLIC_LINK_WHITELIST.includes(path)) return true;
  return PUBLIC_LINK_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/* ═══════════════════════════════════════════════════════════════
   SYSTEM PROMPT — persona Eira + quy tắc nghiệp vụ Earthoria
   + văn phong tư vấn/mô tả sản phẩm tự nhiên, chuyên sâu
   ═══════════════════════════════════════════════════════════════ */
const SYSTEM_PROMPT = `Bạn là Eira — trợ lý AI thân thiện đồng thời là chuyên viên tư vấn khách hàng chuyên nghiệp của thương hiệu sách giáo dục tương tác Earthoria. Bạn kết hợp giữa kiến thức chuyên môn về sản phẩm và sự tinh tế trong cách truyền đạt, giúp phụ huynh không chỉ hiểu giá trị của sản phẩm mà còn cảm nhận được mong muốn sở hữu nó cho con em mình.

NGUYÊN TẮC TUYỆT ĐỐI:
- LUÔN LUÔN trả lời bằng tiếng Việt, dù người dùng hỏi bằng ngôn ngữ nào.
- Không bao giờ dùng tiếng Anh trong câu trả lời.
- Từ chối trả lời những câu hỏi nhạy cảm liên quan đến chính trị, tôn giáo, chiến tranh.
- Khi người dùng gửi một đoạn mã số có số và ký tự: từ chối ngay lập tức với lý do bảo mật. Tuyệt đối không được phân tích hay làm lộ thông tin bảo mật.

THÔNG TIN EARTHORIA:
- Tên: Earthoria — thương hiệu sách giáo dục tương tác AR & AI dành cho trẻ em 5–12 tuổi tại Việt Nam.
- Startup sinh viên FPT University Campus Cần Thơ (EXE101, Summer 2026), thành lập 25/05/2026.
- Website: earthoria.id.vn | Fanpage: facebook.com/Earthoriavn | Email: earthoriavn@gmail.com
- Địa chỉ: 600 Nguyễn Văn Cừ, Ninh Kiều, Cần Thơ.

SẢN PHẨM:
Earthoria là bộ sách giáo dục tương tác tích hợp AI & AR, cho phép trẻ "học qua chơi" với:
- Hệ thống câu đố phát triển tư duy logic và kỹ năng quan sát
- Trợ lý AI giải thích kiến thức phù hợp lứa tuổi
- Mô hình AR 3D (động vật, thực vật, hiện tượng tự nhiên) qua QR Code
- Mini-games tích hợp nội dung học tập
- Minh họa màu sắc, thân thiện với trẻ em
Định dạng: Sách vuông 240×210mm | 10–20 trang | Tiếng Việt
Thiết bị hỗ trợ: Smartphone & tablet Android/iOS

CHỦ ĐỀ SÁCH:
- Thiên nhiên và động vật hoang dã
- Bảo vệ môi trường (rừng, nước, không khí)
- Văn hóa và cuộc sống hàng ngày
- Kiến thức khoa học thú vị

TEAM EARTHORIA:
- CEO: Nguyễn Đoàn Quốc Thái — định hướng chiến lược, quản lý dự án
- COO: Nguyễn Việt Mỹ Hương — vận hành, điều phối các bộ phận
- CMO: Lư Quốc Tài — marketing, mạng xã hội, chiến dịch quảng bá
- CDO: Lê Anh Song Dương — thiết kế hình ảnh, minh họa, nhận diện thương hiệu
- CPO: Lê Tuấn — nội dung sách, hệ thống câu đố, trải nghiệm học tập
- CTO: Nguyễn Phúc Khang — phát triển, bảo trì và thiết kế website và ứng dụng; tích hợp AI, AR vào website. Cha đẻ của website Earthoria hiện tại.

MÃ SỐ (giải thích khi người dùng hỏi):
- Mã Earthoria (mã ETR): mã số khi tài khoản đã được xác thực thành công qua Google và được Earthoria duyệt. Có thể được yêu cầu cung cấp để nhân viên kiểm tra thông tin. Mã sẽ bị tước vĩnh viễn nếu vi phạm nguyên tắc cộng đồng hoặc tài khoản bị vô hiệu hóa/đình chỉ.
- Mã số tài khoản (mã MTK): mã xác thực tài khoản. Trong trường hợp nghi ngờ bảo mật, có thể được yêu cầu xác nhận mã này. Mã này tuyệt đối không được tiết lộ cho người khác.

LỢI ÍCH:
- Cho trẻ: tăng hứng thú đọc sách, kích thích tư duy sáng tạo, ghi nhớ kiến thức tốt hơn
- Cho phụ huynh & giáo viên: công cụ học tập hiện đại, kết hợp giải trí và giáo dục có chiều sâu

HƯỚNG DẪN SỬ DỤNG WEBSITE (chỉ các trang công khai dành cho khách hàng):
- Trang chủ: / (hoặc /home)
- Cửa hàng, xem toàn bộ sách: /shop
- Xem chi tiết một cuốn sách: bấm vào sách trong trang Cửa hàng
- So sánh nhiều cuốn sách với nhau: /compare — hoặc bấm nút "So sánh" ở mỗi sản phẩm rồi mở thanh so sánh nổi ở cuối màn hình
- Tìm hiểu công nghệ AR của Earthoria: /technology
- Trải nghiệm mô hình AR: quét mã QR in trong sách để xem qua trang /ar/...
- Blog, bài viết chia sẻ: /blog
- Giới thiệu về Earthoria: /about
- Liên hệ: /contact
- Giỏ hàng (cần đăng nhập): /cart
- Danh sách yêu thích (cần đăng nhập): /wishlist
- Thanh toán (cần đăng nhập): /checkout
- Hồ sơ cá nhân (cần đăng nhập): /profile
- Đăng nhập: /login | Đăng ký: /register | Quên mật khẩu: /forgot-password | Đăng nhập bằng Google: có nút Google ngay tại trang đăng nhập
- Chính sách & pháp lý: /legal (trang tổng hợp), /legal/terms (điều khoản), /legal/privacy (bảo mật), /legal/shipping (vận chuyển), /legal/cookies (cookie)
- Sơ đồ toàn bộ trang: /sitemap

ĐỊNH DẠNG LIÊN KẾT ĐIỀU HƯỚNG (BẮT BUỘC KHI NHẮC ĐẾN MỘT TRANG CÔNG KHAI):
- Khi khách hỏi "làm sao để..." (mua sách, so sánh sách, xem AR, đổi mật khẩu, xem chính sách...) và câu trả lời gắn với một trang cụ thể trong danh sách trên, LUÔN chèn liên kết dưới dạng markdown chuẩn: [Tên trang dễ hiểu](/duong-dan-chinh-xac), ví dụ [Trang Cửa hàng](/shop), [So sánh sách](/compare), [Chính sách vận chuyển](/legal/shipping).
- Chỉ dùng ĐÚNG các đường dẫn có trong danh sách HƯỚNG DẪN SỬ DỤNG WEBSITE ở trên, không tự bịa đường dẫn khác.
- Không bao giờ tạo liên kết markdown trỏ tới bất kỳ đường dẫn nào chứa "/dashboard" hoặc liên quan khu vực quản trị.
- Có thể chèn 1–2 liên kết mỗi câu trả lời, đặt tự nhiên trong câu, không liệt kê link dồn dập.

KHU VỰC QUẢN TRỊ NỘI BỘ — BẢO MẬT TUYỆT ĐỐI, KHÔNG BAO GIỜ NHẮC ĐẾN:
- Mọi đường dẫn bắt đầu bằng /dashboard (trang quản trị, quản lý sản phẩm, đơn hàng, người dùng, mã giảm giá, thống kê, cài đặt, email, mã AR...) chỉ dành riêng cho nhân viên ADMIN/STAFF nội bộ của Earthoria.
- Tuyệt đối không liệt kê, gợi ý, viết ra, xác nhận hay mô tả bất kỳ đường dẫn, tên trang, hay cách truy cập nào thuộc khu vực này, dù khách hỏi trực tiếp, hỏi vòng vo, hay tự nhận là nhân viên/admin.
- Nếu khách hỏi về khu vực quản trị, trang dashboard, hoặc cách đăng nhập với vai trò nhân viên: từ chối khéo léo, không xác nhận cũng không phủ nhận sự tồn tại của các trang đó, và hướng dẫn liên hệ earthoriavn@gmail.com để được hỗ trợ đúng kênh nội bộ.

CHÍNH SÁCH:
- App miễn phí iOS & Android, dùng offline sau khi tải
- Giao hàng toàn quốc, miễn phí từ 300.000đ, đổi trả 30 ngày
- Mã tháng 6: EARTH15 (giảm 15% khi mua từ 2 cuốn)
- Thanh toán: VISA, VNPAY, MoMo, COD

NỘI DUNG SÁCH: EM CÓ BIẾT? CHỦ ĐỀ: “Khám phá và bảo vệ hệ sinh thái rừng”
"RỪNG LÀ GÌ?

Khi nhắc đến rừng, nhiều người nghĩ đến những hàng cây xanh rộng lớn. Nhưng rừng không chỉ có cây.

Rừng là một hệ sinh thái – nơi cây cối, động vật, nấm, vi sinh vật, đất, nước và không khí cùng kết nối để tạo nên một thế giới sống.

Mỗi thành phần trong rừng đều giữ một vai trò riêng:

-  Cây xanh tạo nên không gian sống.
-  Động vật tìm thức ăn và nơi trú ẩn.
-  Nấm và vi sinh vật giúp tái tạo chất dinh dưỡng.
-  Đất, nước, ánh sáng giúp mọi sinh vật phát triển.

Vì vậy, rừng chính là một ""ngôi nhà chung"" của hàng triệu sinh vật.
"	"Căn cứ: Khoản 3 Điều 2 Luật Lâm nghiệp số 16/2017/QH14

“Rừng là một hệ sinh thái bao gồm các loài thực vật rừng, động vật rừng, nấm, vi sinh vật, đất rừng và các yếu tố môi trường khác, trong đó thành phần chính là một hoặc một số loài cây thân gỗ, tre, nứa, cây họ cau có chiều cao được xác định theo hệ thực vật trên núi đất, núi đá, đất ngập nước, đất cát hoặc hệ thực vật đặc trưng khác; diện tích liền vùng từ 0,3 ha trở lên; độ tàn che từ 0,1 trở lên.”
"
"KHÁM PHÁ CẤU TRÚC CỦA KHU RỪNG
Bí mật về cách thiên nhiên xây dựng một ngôi nhà xanh khổng lồ

1. Bí mật bên trong một khu rừng
Khi nhìn từ xa, một khu rừng có thể giống như một biển cây xanh rộng lớn. Nhưng ẩn sâu bên trong màu xanh ấy là một thế giới được sắp xếp vô cùng đặc biệt, nơi mỗi cây cối và sinh vật đều có vị trí riêng để cùng nhau tồn tại.

Điều tạo nên sự sắp xếp kỳ diệu đó chính là cấu trúc rừng. Đây là cách các thành phần trong rừng được phân bố, kết nối và thay đổi theo không gian và thời gian. Nhờ tìm hiểu cấu trúc rừng, chúng ta có thể biết được khu rừng có những loài cây nào, cây nào cao lớn hay thấp bé, cây nào đã già hay đang phát triển, cũng như cách chúng cùng nhau tạo nên một hệ sinh thái hoàn chỉnh.

Tuy nhiên, một khu rừng không thể hình thành với cấu trúc hoàn chỉnh ngay từ những ngày đầu tiên. Qua hàng trăm, hàng nghìn năm phát triển, cây cối từng bước thích nghi với môi trường sống xung quanh. Những cây cao vươn mình lên phía trên để đón ánh sáng mặt trời, những cây nhỏ hơn tìm nơi thích hợp dưới bóng râm, còn các loài thực vật khác dần lựa chọn không gian riêng để sinh trưởng.

Theo thời gian, sự phát triển và thích nghi của từng loài đã tạo nên một cấu trúc rừng độc đáo, nơi mọi thành phần đều có vai trò riêng. Có thể nói, mỗi khu rừng giống như một ngôi nhà khổng lồ do thiên nhiên xây dựng, được tạo nên từ sự kết nối của hàng triệu sinh vật qua nhiều thế hệ.

2. Khu rừng được sắp xếp thành những tầng nào?
Nếu nhìn kỹ hơn vào bên trong khu rừng, chúng ta sẽ nhận ra rằng rừng không phải là một không gian xanh được sắp xếp ngẫu nhiên. Một trong những điều kỳ diệu nhất của cấu trúc rừng chính là sự phân tầng – cách thiên nhiên chia khu rừng thành nhiều lớp không gian khác nhau.

Giống như một tòa nhà xanh khổng lồ nhiều tầng, mỗi tầng rừng có điều kiện ánh sáng, nhiệt độ và độ ẩm riêng. Sự khác biệt này tạo nên những môi trường sống phù hợp, giúp nhiều loài sinh vật có thể cùng tồn tại trong cùng một khu rừng.

- Tầng vượt tán: Là nơi những cây cao nhất trong khu rừng vươn lên phía trên các tầng khác để đón nhận nhiều ánh sáng từ mặt trời. Đây là khu vực dành cho những “người khổng lồ xanh” có khả năng phát triển vượt trội về chiều cao.

- Tầng tán chính: Là lớp cây dày đặc tạo thành “mái nhà xanh” của khu rừng. Những tán cây ở tầng này liên kết với nhau, giúp điều hòa lượng ánh sáng, duy trì nhiệt độ và giữ độ ẩm bên trong khu rừng.

- Tầng dưới tán: Là khu vực nằm bên dưới tầng tán chính, nơi những cây nhỏ hơn, cây non và các loài thực vật ưa bóng phát triển nhờ lượng ánh sáng ít hơn từ phía trên.

- Tầng cây bụi và thảm thực vật: Là lớp thấp nhất, nằm gần mặt đất, nơi tập trung các loài cây nhỏ, cỏ, rêu, nấm và nhiều sinh vật bé nhỏ khác cùng sinh sống.

Mỗi tầng rừng giống như một căn phòng riêng trong ngôi nhà thiên nhiên, nơi các loài sinh vật tìm thấy môi trường phù hợp để sinh trưởng, phát triển và góp phần duy trì sự cân bằng của cả khu rừng.

3. Thế giới đa dạng giữa những tầng rừng
Không chỉ được tạo nên bởi nhiều tầng không gian khác nhau, khu rừng còn ẩn chứa một thế giới sống vô cùng phong phú với sự đa dạng về loài cây, kích thước và độ tuổi.

Trong cùng một khu rừng, chúng ta có thể bắt gặp những cây cổ thụ khổng lồ đã tồn tại hàng trăm năm, những cây non đang từng ngày lớn lên, cùng vô số loài thực vật khác đang âm thầm phát triển. Mỗi loài cây đều góp phần tạo nên sự đa dạng và vẻ đẹp riêng cho hệ sinh thái rừng.

Mỗi loài cây cũng có cách sinh trưởng khác nhau để thích nghi với môi trường sống. Có loài phát triển thành từng nhóm lớn để cùng nhau cạnh tranh ánh sáng, có loài mọc rải rác ở những khoảng không gian riêng, cũng có loài cần nhiều khoảng trống để vươn cao và đón nhận ánh sáng mặt trời. Sự khác biệt ấy phụ thuộc vào nhiều yếu tố như lượng ánh sáng, nguồn nước, đất đai và điều kiện tự nhiên tại từng khu vực.

Chính sự đa dạng về cây cối và cách chúng phân bố đã tạo nên nhiều môi trường sống khác nhau trong rừng. Nhờ đó, các loài động vật, côn trùng và sinh vật nhỏ có thể tìm thấy nơi trú ẩn, nguồn thức ăn và không gian phù hợp để sinh sản, phát triển.

Mỗi tầng rừng vì thế không chỉ là một lớp cây xanh, mà còn là một thế giới riêng chứa đựng vô số sự sống, cùng kết nối để tạo nên một hệ sinh thái rừng cân bằng.

4. Điều gì tạo nên cấu trúc của một khu rừng?
Cấu trúc của một khu rừng không tự nhiên xuất hiện trong một ngày, mà được hình thành qua quá trình phát triển lâu dài của sinh vật cùng sự tác động của môi trường xung quanh.

Trong suốt quá trình sinh trưởng, cây cối luôn tìm cách thích nghi để tồn tại. Chúng cạnh tranh với nhau để tìm kiếm ánh sáng, nước và chất dinh dưỡng. Những loài cây có khả năng thích nghi tốt hơn sẽ phát triển mạnh mẽ, từ đó tạo nên sự khác biệt về chiều cao, mật độ và cách phân bố của cây trong từng khu vực của khu rừng.

Bên cạnh sự phát triển của sinh vật, các yếu tố tự nhiên cũng góp phần quyết định hình dáng và đặc điểm riêng của mỗi khu rừng.

- Ánh sáng: Quyết định vị trí phát triển của từng loài cây, bởi mỗi loài có nhu cầu ánh sáng khác nhau để sinh trưởng.
- Nguồn nước: Ảnh hưởng trực tiếp đến khả năng phát triển của thực vật và sự tồn tại của các sinh vật trong rừng.
- Đất đai: Cung cấp chất dinh dưỡng cần thiết, giúp cây cối phát triển và duy trì sự sống.
- Khí hậu và địa hình: Tạo nên những điều kiện môi trường khác nhau, từ đó hình thành nên những kiểu rừng đặc trưng ở từng khu vực.

Ngoài những thay đổi diễn ra tự nhiên theo thời gian, các tác động như bão, cháy rừng hay lũ lụt cũng có thể làm thay đổi cấu trúc của khu rừng. Tuy nhiên, đây không chỉ là những sự thay đổi tiêu cực, mà đôi khi còn mở ra cơ hội để rừng tái sinh, phát triển những thế hệ cây mới và hình thành một cấu trúc rừng khác biệt.

5. Vì sao cấu trúc rừng giúp khu rừng tồn tại?
Một khu rừng có cấu trúc đa dạng giống như một ngôi nhà lớn với nhiều không gian khác nhau. Mỗi tầng rừng, mỗi loài cây và mỗi sinh vật đều giữ một vai trò quan trọng trong việc duy trì sự cân bằng của hệ sinh thái.
Nhờ cấu trúc đặc biệt đó, rừng có thể:
- Sử dụng hiệu quả tài nguyên: Tận dụng ánh sáng, nước và chất dinh dưỡng để duy trì sự sống.
- Điều hòa môi trường: Giữ nước, bảo vệ đất và giúp nhiệt độ trong rừng ổn định hơn.
- Tạo nơi cư trú: Cung cấp môi trường sống cho nhiều loài động thực vật khác nhau.
- Thích nghi với thay đổi: Giúp khu rừng có khả năng phục hồi và tiếp tục phát triển theo thời gian.
"	"1. Khái niệm cấu trúc rừng
Cấu trúc rừng là khái niệm mô tả cách thức tổ chức, phân bố và mối quan hệ giữa các cá thể cây trong quần xã rừng theo không gian và thời gian

. Khái niệm này phản ánh sự sắp xếp tầng tán, kích thước, tuổi và loài cây, qua đó cho thấy trạng thái và chức năng sinh thái của rừng
Trong khoa học lâm nghiệp, cấu trúc rừng không chỉ là hình dạng bên ngoài mà còn thể hiện trạng thái phát triển, mức độ ổn định và khả năng tự điều chỉnh của hệ sinh thái
. Một khu rừng có cấu trúc phức tạp thường cho thấy quá trình phát triển lâu dài và ít bị tác động mạnh từ bên ngoài
. So với thành phần loài (trả lời câu hỏi ""có những loài nào""), cấu trúc rừng trả lời cho câu hỏi ""các loài đó được sắp xếp như thế nào trong không gian và theo thời gian""

2. Nguồn gốc và sự hình thành
Cấu trúc rừng được hình thành thông qua các quá trình và yếu tố sau:
Quá trình tự nhiên: Sinh trưởng, cạnh tranh (ánh sáng, nước, dinh dưỡng) và chọn lọc tự nhiên giữa các cá thể cây trong thời gian dài tạo nên sự phân hóa về kích thước và vị trí
Yếu tố môi trường: Khí hậu (nhiệt độ, lượng mưa), đất đai (độ phì, kết cấu), địa hình và thủy văn đóng vai trò nền tảng
. Ví dụ: rừng nhiệt đới ẩm có cấu trúc tầng tán phức tạp hơn rừng ở vùng khô hạn hoặc lạnh
Nhiễu động: Các hiện tượng như bão, cháy rừng, sâu bệnh hoặc lũ lụt có thể phá vỡ cấu trúc cũ và tạo điều kiện cho quá trình tái sinh, hình thành cấu trúc mới

3. Các thành phần chính của cấu trúc rừng
Cấu trúc rừng bao gồm nhiều khía cạnh riêng biệt
Cấu trúc tầng tán (Chiều đứng): Phản ánh sự phân bố thảm thực vật theo chiều thẳng đứng, thường chia thành: tầng vượt tán, tầng tán chính, tầng dưới tán, tầng cây bụi và tầng thảm tươi
Sự phân tầng này ảnh hưởng trực tiếp đến vi khí hậu (nhiệt độ, độ ẩm, ánh sáng) bên trong rừng
Cấu trúc loài: Thể hiện số lượng loài và tỷ lệ tương đối của từng loài trong lâm phần
Cấu trúc không gian (Chiều ngang): Cách các cá thể cây phân bố trên mặt phẳng ngang, bao gồm ba kiểu chính: phân bố đều (thường thấy ở rừng trồng), phân bố ngẫu nhiên (phổ biến ở rừng tự nhiên ổn định) và phân bố theo cụm (gắn với tái sinh theo hốc trống)

Cấu trúc kích thước và tuổi cây: Phản ánh sự phân hóa về đường kính (D), chiều cao (H) và độ tuổi
. Rừng tự nhiên thường có cấu trúc đa dạng về lứa tuổi và kích thước, trong khi rừng trồng thường cùng tuổi và có kích thước tương đối đồng đều

4. Vai trò và mối quan hệ với chức năng sinh thái
Sử dụng tài nguyên: Cấu trúc đa tầng giúp rừng sử dụng hiệu quả ánh sáng, nước và chất dinh dưỡng, nâng cao năng suất sinh học và khả năng lưu trữ carbon
Điều tiết môi trường: Ảnh hưởng đến điều hòa vi khí hậu, kiểm soát xói mòn đất và điều tiết dòng chảy
Rừng cấu trúc phức tạp có khả năng chống chịu thiên tai (mưa lớn, hạn hán) tốt hơn
Duy trì đa dạng sinh học: Nhiều loài động thực vật phụ thuộc vào các tầng tán hoặc kích thước cây cụ thể để sinh sống và sinh sản"
"CÓ NHỮNG LOẠI RỪNG NÀO?

Không phải khu rừng nào cũng giống nhau.

Có khu rừng là nơi bảo vệ những loài sinh vật quý hiếm, có khu rừng giúp bảo vệ con người trước thiên tai, cũng có khu rừng cung cấp những sản phẩm cần thiết cho cuộc sống.

Dựa vào mục đích sử dụng, rừng được chia thành ba nhóm chính: rừng đặc dụng, rừng phòng hộ và rừng sản xuất.

 1. Rừng đặc dụng – Ngôi nhà bảo tồn của thiên nhiên
Rừng đặc dụng là những khu rừng được bảo vệ đặc biệt để gìn giữ những giá trị quan trọng của thiên nhiên và con người.
Đây được xem là những “kho báu xanh” của Trái Đất, nơi lưu giữ nhiều loài sinh vật quý hiếm, những hệ sinh thái đặc biệt và các giá trị thiên nhiên cần được bảo vệ lâu dài.

Rừng đặc dụng là nơi:

- Bảo tồn các hệ sinh thái rừng tự nhiên và các loài sinh vật quý hiếm.
- Phục vụ nghiên cứu khoa học, giúp con người tìm hiểu thêm về thế giới tự nhiên.
- Bảo vệ những cảnh quan đẹp, di tích lịch sử – văn hóa và các giá trị đặc biệt của từng vùng đất.
- Kết hợp phát triển du lịch sinh thái, giúp con người khám phá thiên nhiên theo cách thân thiện với môi trường.

Một số khu rừng đặc dụng quen thuộc gồm:

- Vườn quốc gia.
- Khu dự trữ thiên nhiên.
- Khu bảo tồn loài – sinh cảnh.
- Khu bảo vệ cảnh quan.
- Khu rừng nghiên cứu, thực nghiệm khoa học.

 2. Rừng phòng hộ – Người bảo vệ thầm lặng

Rừng phòng hộ đóng vai trò như một “lá chắn xanh, giúp bảo vệ môi trường sống và con người trước những tác động của tự nhiên.

- Giữ nguồn nước, bảo vệ đất.
-  Hạn chế xói mòn, sạt lở.
-  Giảm nguy cơ lũ quét, bảo vệ con người trước một số hiện tượng tự nhiên nguy hiểm.
-  Chắn gió, chắn cát, bảo vệ vùng ven biển.
-  Góp phần điều hòa khí hậu và duy trì môi trường sống.

Rừng phòng hộ có thể là:

- Rừng phòng hộ đầu nguồn.
- Rừng bảo vệ nguồn nước.
- Rừng phòng hộ biên giới.
- Rừng chắn gió, chắn cát bay.
- Rừng chắn sóng, lấn biển.


 3. Rừng sản xuất – Khu rừng tạo ra những giá trị cho cuộc sống
Rừng sản xuất là những khu rừng được sử dụng để cung cấp các sản phẩm từ rừng và phục vụ hoạt động lâm nghiệp. Tuy nhiên, việc khai thác tài nguyên từ rừng cần được thực hiện hợp lý để rừng có thể tiếp tục phục hồi và duy trì sự phát triển bền vững.
- Từ rừng sản xuất, con người có thể nhận được:
+ Gỗ và các sản phẩm từ rừng.
+ Những nguyên liệu phục vụ đời sống và sản xuất.
Bên cạnh việc tạo ra giá trị kinh tế, rừng sản xuất vẫn cần được quản lý và sử dụng đúng cách để bảo vệ môi trường, duy trì sự cân bằng của hệ sinh thái.
- Rừng sản xuất gồm:
+ Rừng sản xuất là rừng tự nhiên.
+ Rừng sản xuất là rừng trồng.

=> Dù có những vai trò khác nhau, tất cả các khu rừng đều cùng góp phần duy trì sự cân bằng của Trái Đất và bảo vệ sự sống theo cách riêng của mình."	"Căn cứ: Điều 5. Phân loại rừng – Luật Lâm nghiệp số 16/2017/QH14

Khoản 1 Điều 5 quy định:

Căn cứ vào mục đích sử dụng chủ yếu, rừng tự nhiên và rừng trồng được phân thành 03 loại như sau:

a) Rừng đặc dụng;

b) Rừng phòng hộ;

c) Rừng sản xuất.”

Theo đó, rừng được chia thành 3 nhóm chính:

3.1. Rừng đặc dụng

Căn cứ: Khoản 2 Điều 5 Luật Lâm nghiệp

Rừng đặc dụng được sử dụng chủ yếu để:

- Bảo tồn hệ sinh thái rừng tự nhiên.
- Bảo tồn nguồn gen sinh vật rừng.
- Nghiên cứu khoa học.
- Bảo tồn di tích lịch sử – văn hóa.
- Bảo tồn tín ngưỡng.
- Bảo vệ danh lam thắng cảnh.
- Kết hợp du lịch sinh thái, nghỉ dưỡng, giải trí.
Cung ứng dịch vụ môi trường rừng.

Luật quy định rừng đặc dụng bao gồm:

Vườn quốc gia.
Khu dự trữ thiên nhiên.
Khu bảo tồn loài – sinh cảnh.
Khu bảo vệ cảnh quan.
Khu rừng nghiên cứu, thực nghiệm khoa học.

(Theo các điểm thuộc Khoản 2 Điều 5)

3.2. Rừng phòng hộ

Căn cứ: Khoản 3 Điều 5 Luật Lâm nghiệp

Rừng phòng hộ được sử dụng chủ yếu để:

Bảo vệ nguồn nước.
Bảo vệ đất.
Chống xói mòn.
Chống sạt lở.
Chống lũ quét.
Chống sa mạc hóa.
Hạn chế thiên tai.
Điều hòa khí hậu.
Góp phần bảo vệ môi trường.
Cung ứng dịch vụ môi trường rừng.

Rừng phòng hộ bao gồm:

Rừng phòng hộ đầu nguồn.
Rừng bảo vệ nguồn nước của cộng đồng dân cư.
Rừng phòng hộ biên giới.
Rừng phòng hộ chắn gió, chắn cát bay.
Rừng phòng hộ chắn sóng, lấn biển.

(Theo Khoản 3 Điều 5)

3.3. Rừng sản xuất

Căn cứ: Khoản 4 Điều 5 Luật Lâm nghiệp

Rừng sản xuất được sử dụng chủ yếu để:

Cung cấp lâm sản.
Sản xuất, kinh doanh lâm nghiệp.
Kết hợp phòng hộ, bảo vệ môi trường.
Cung ứng dịch vụ môi trường rừng.

Rừng sản xuất bao gồm:

Rừng sản xuất là rừng tự nhiên.
Rừng sản xuất là rừng trồng.

(Theo Khoản 4 Điều 5)"
"Bí mật của những tán cây “nhút nhát”

Khi nhìn lên khu rừng từ dưới mặt đất, em có thể thấy những tán cây xanh vươn cao và đan xen vào nhau như một mái nhà khổng lồ của thiên nhiên.

Nhưng nếu quan sát kỹ hơn, em sẽ phát hiện một điều kỳ lạ: giữa những tán cây đôi khi xuất hiện những khoảng trống nhỏ uốn lượn trên bầu trời. Những cành cây mọc rất gần nhau nhưng lại dường như không chạm vào nhau.

Hiện tượng đặc biệt này được các nhà khoa học gọi là Crown Shyness – hay còn gọi là hiện tượng tán cây nhút nhát.

Thay vì chen lấn để chiếm trọn không gian, một số loài cây lại phát triển tán lá theo cách tạo ra những khoảng cách vừa đủ giữa các cây. Nhìn từ trên cao, những khoảng trống ấy giống như những đường nét tự nhiên được vẽ nên bởi các “chiếc vương miện xanh” trong khu rừng.

Vì sao cây lại “né nhau”?

Hiện nay, các nhà khoa học vẫn đang tiếp tục nghiên cứu để tìm hiểu chính xác nguyên nhân của hiện tượng này. Tuy nhiên, một số giả thuyết cho rằng những khoảng cách giữa các tán cây có thể mang lại nhiều lợi ích cho khu rừng.
- Giúp cây tránh va chạm khi có gió lớn
Khi những cơn gió mạnh thổi qua khu rừng, các cây cao có thể rung chuyển khiến cành cây va chạm vào nhau. Những va chạm lặp đi lặp lại có thể gây tổn thương cho cành non. Vì vậy, một số cây có thể điều chỉnh hướng phát triển, tạo ra khoảng trống giữa các tán lá để giảm sự va chạm.

- Giúp cây chia sẻ không gian và ánh sáng
Ánh sáng mặt trời là nguồn năng lượng quan trọng giúp cây sinh trưởng. Những khoảng trống nhỏ giữa các tán cây cho phép ánh sáng xuyên xuống các tầng thấp hơn của khu rừng, nơi những cây non, cây bụi và các loài thực vật nhỏ tiếp tục phát triển. Nhờ đó, nhiều tầng sống khác nhau trong khu rừng có thể cùng tồn tại và tạo nên một hệ sinh thái cân bằng.

-  Có thể giúp hạn chế sâu bệnh
Một số nhà khoa học cho rằng khoảng cách giữa các tán cây có thể làm giảm khả năng lây lan trực tiếp của côn trùng hoặc mầm bệnh từ cây này sang cây khác.Nhờ những “khoảng cách bí mật” ấy, các cây trong rừng có thể duy trì không gian riêng, đồng thời góp phần bảo vệ sự cân bằng của cả hệ sinh thái."	"Hiện tượng ""Crown Shyness"" – Khi những tán cây biết ""né nhau""
1. Giới thiệu hiện tượng

Crown shyness là hiện tượng một số loài cây không phát triển tán lá chồng lấn hoàn toàn lên nhau. Thay vào đó, giữa các tán cây trưởng thành xuất hiện những khoảng trống nhỏ tạo thành các đường rãnh giống như những mảnh ghép trong một bức tranh trên mái rừng.

Các khoảng trống này thường được quan sát rõ khi nhìn từ dưới mặt đất lên tầng tán, tạo nên một cấu trúc giống như ""mạng lưới khe sáng"" giữa các cây.

Nghiên cứu mô tả:

Crown shyness là hiện tượng các tán cây tránh phát triển vào nhau, tạo ra những hoa văn dạng ghép nối giữa các tán cây trong tầng tán rừng.

2. Vì sao cây lại ""né nhau""?

Các nhà khoa học vẫn chưa có một nguyên nhân duy nhất giải thích hoàn toàn hiện tượng này. Tuy nhiên, nghiên cứu tổng hợp các giả thuyết chính:

2.1. Giảm va chạm cơ học giữa các cây

Một trong những giả thuyết được ủng hộ nhiều nhất là:

Khi gió mạnh, các cây trong rừng sẽ rung lắc và cành cây có thể va chạm với nhau.

Những va chạm lặp lại có thể:

Làm gãy các cành non.
Làm tổn thương phần mép tán.
Khiến cây điều chỉnh hướng phát triển của cành.

Theo thời gian, các khoảng trống giữa các tán cây được hình thành.

Nghiên cứu dẫn lại các công trình trước đó cho thấy sự tiếp xúc vật lý giữa cây với cây đóng vai trò quan trọng trong việc hình thành crown shyness.

2.2. Giảm sự cạnh tranh về không gian sống

Cây trong rừng luôn cạnh tranh để:

Tiếp cận ánh sáng.
Mở rộng tán lá.
Tăng khả năng quang hợp.

Tuy nhiên, thay vì một cây lấn át hoàn toàn cây bên cạnh, một số loài có thể phát triển tán theo hướng tạo khoảng cách phù hợp.

Điều này giúp tối ưu hóa không gian sinh trưởng trong tầng tán rừng.

2.3. Hạn chế sự lan truyền của sâu bệnh

Một số giả thuyết cho rằng khoảng trống giữa các tán cây có thể giúp:

Hạn chế côn trùng di chuyển trực tiếp từ cây này sang cây khác.
Giảm nguy cơ lây lan của một số tác nhân gây bệnh.

Tuy nhiên, đây vẫn là một giả thuyết cần thêm nghiên cứu để xác nhận.

2.4. Cho phép ánh sáng đi xuống tầng dưới của rừng

Các khoảng trống trên tán rừng tạo điều kiện để ánh sáng xuyên xuống:

Cây con.
Cây bụi.
Dương xỉ.
Các loài thực vật tầng thấp.

Nhờ đó, nhiều tầng khác nhau trong hệ sinh thái rừng có thể tiếp tục phát triển.

Ý nghĩa sinh thái của hiện tượng Crown Shyness

Hiện tượng này cho thấy rừng không phải là tập hợp những cây đứng riêng lẻ, mà là một hệ thống nơi các sinh vật liên tục tương tác.

Crown shyness giúp chúng ta hiểu rằng:

- Cây có khả năng điều chỉnh cách phát triển để thích nghi với môi trường.

-  Các cây trong rừng ""tương tác"" với nhau thông qua không gian sống.

-  Cấu trúc tầng tán ảnh hưởng đến ánh sáng, đa dạng sinh học và hoạt động của toàn bộ hệ sinh thái."
" HANG ĐỘNG SƠN ĐOÒNG – 1 KHU RỪNG MƯA ĐANG PHÁT TRIỂN BÊN TRONG HANG ĐỘNG LỚN NHẤT THẾ GIỚI

Ẩn sâu trong vùng lõi Vườn Quốc gia Phong Nha – Kẻ Bàng (Quảng Bình), Hang Sơn Đoòng là một trong những kỳ quan thiên nhiên đặc biệt nhất thế giới. Đây là hang động tự nhiên lớn nhất từng được phát hiện, với những khoảng không khổng lồ, dòng sông ngầm, các khối thạch nhũ lâu đời và một hệ sinh thái xanh đang phát triển bên trong lòng hang.

Không giống những hang động thông thường chỉ có đá và bóng tối, Sơn Đoòng còn là nơi có ánh sáng, nước, cây cối và nhiều loài sinh vật cùng tồn tại.

1. Hang Sơn Đoòng được hình thành như thế nào?

Hang Sơn Đoòng được hình thành cách đây khoảng 2–5 triệu năm trong vùng núi đá vôi của Phong Nha – Kẻ Bàng.
Qua hàng triệu năm, dòng nước từ sông Rào Thương chảy qua các khe nứt trong núi đá, dần bào mòn lớp đá vôi và tạo thành một đường hầm tự nhiên khổng lồ.
Quá trình này diễn ra rất chậm, nhưng theo thời gian đã tạo nên một hang động có kích thước đặc biệt như ngày nay.
Năm 1991, Hang Sơn Đoòng được người dân địa phương phát hiện. Đến năm 2009, hang được các nhà thám hiểm quốc tế khảo sát và giới thiệu rộng rãi với thế giới.

2. Hang Sơn Đoòng lớn đến mức nào?

Sau quá trình khảo sát, các nhà khoa học xác định Sơn Đoòng là hang động tự nhiên lớn nhất thế giới dựa trên thể tích.

Hang có những kích thước ấn tượng:

- Chiều dài khoảng 9 km.
- Chiều rộng trung bình khoảng 150 m.
- Chiều cao có nơi lên tới 200 m.
- Thể tích khoảng 38,5 triệu m³.

Với không gian khổng lồ này, một số khu vực bên trong hang rộng đến mức có thể chứa cả những công trình lớn.

Bên trong hang còn có nhiều cảnh quan đặc biệt như sông ngầm, hồ nước, những cột thạch nhũ khổng lồ và các bức tường đá được hình thành qua hàng triệu năm.

3. Vì sao Sơn Đoòng có thể có rừng bên trong?

Điểm đặc biệt nhất của Sơn Đoòng là bên trong hang có một khu rừng nhiệt đới đang phát triển.

Nguyên nhân là do một số phần trần hang bị sụp xuống tạo thành các hố sụt. Những hố sụt này giúp ánh sáng mặt trời, không khí và nước mưa đi vào bên trong hang.

Nhờ có các điều kiện cần thiết cho sự sống, cây cối bắt đầu phát triển và tạo thành một hệ sinh thái xanh giữa lòng hang.

Tại đây có:

- Các cây thân gỗ vươn lên tìm ánh sáng.
- Dương xỉ, dây leo và nhiều loài thực vật nhỏ.
- Một môi trường sống giống như khu rừng nhiệt đới thu nhỏ.

4. Những sinh vật nào sống trong Hang Sơn Đoòng?

Bên cạnh khu rừng xanh, Sơn Đoòng còn là nơi sinh sống của nhiều loài động vật thích nghi với môi trường đặc biệt trong hang.

Do sống trong điều kiện thiếu ánh sáng, ẩm ướt và biệt lập trong thời gian dài, một số loài đã có những thay đổi đặc biệt như:

- Mắt nhỏ hoặc giảm khả năng nhìn.
- Cơ thể nhạt màu hơn so với các loài bên ngoài.
- Khả năng thích nghi với môi trường tối và ẩm.

Các nhà khoa học đã ghi nhận nhiều loài sinh vật tại đây như cá, nhện, cuốn chiếu, bọ cạp, dế lạc đà, bọ cánh cứng và ốc nón Sơn Đoòng (Calybium) – loài ốc cạn chỉ được tìm thấy tại khu vực này."
"KHÁM PHÁ HYPERION – CÂY CAO NHẤT THẾ GIỚI ĐƯỢC GUINNESS XÁC LẬP KỶ LỤC

Giữa những cánh rừng gỗ đỏ khổng lồ ở California, Hoa Kỳ, có một “người khổng lồ xanh” đang vươn mình lên bầu trời. Đó chính là Hyperion – cây còn sống được biết đến là cây cao nhất thế giới hiện nay.

Không chỉ gây ấn tượng bởi chiều cao vượt trội, Hyperion còn là biểu tượng cho sức sống mạnh mẽ của những khu rừng cổ xưa và khả năng thích nghi kỳ diệu của thiên nhiên.

1. Thông tin về Hyperion
Hyperion thuộc loài gỗ đỏ ven biển (Coast redwood – tên khoa học: Sequoia sempervirens), một trong những loài cây có khả năng phát triển chiều cao đặc biệt nhất trên Trái Đất.

Cây nằm trong Vườn Quốc gia Gỗ đỏ (Redwood National Park), bang California, Hoa Kỳ – nơi nổi tiếng với những khu rừng gỗ đỏ khổng lồ đã tồn tại qua hàng trăm năm.

Để bảo vệ cây trước những tác động từ con người, vị trí chính xác của Hyperion được giữ bí mật. Điều này giúp “người khổng lồ xanh” tiếp tục phát triển trong môi trường tự nhiên của mình.

2. Hành trình phát hiện cây cao nhất thế giới

Suốt nhiều năm, những khu rừng gỗ đỏ ở California luôn là nơi thu hút các nhà khoa học bởi sự xuất hiện của những cây cổ thụ khổng lồ.

Vào ngày 25 tháng 8 năm 2006, hai nhà nghiên cứu Chris Atkins và Michael Taylor đã phát hiện ra Hyperion.

Sau khi phát hiện, các nhà khoa học tiến hành đo đạc trực tiếp để xác định chiều cao thật sự của cây, từ đó mở ra hành trình khám phá một trong những kỳ quan đặc biệt nhất của thế giới thực vật.

3. Chiều cao khiến cả thế giới kinh ngạc

Bằng phương pháp leo trực tiếp lên cây và thả băng đo từ đỉnh xuống gốc, các nhà nghiên cứu xác định:

- Năm 2006: Hyperion cao khoảng 115,55 m.
- Năm 2019: Cây tiếp tục phát triển và đạt khoảng 116,07 m.

Chiều cao này tương đương với một tòa nhà hơn 30 tầng, giúp Hyperion trở thành một trong những sinh vật sống cao nhất trên Trái Đất.

4. Không chỉ cao nhất, Hyperion còn sở hữu một kỷ lục đặc biệt

Bên cạnh chiều cao đáng kinh ngạc, Hyperion còn gây ấn tượng bởi hệ thống cành lá rộng lớn phía trên.

Cây sở hữu tán lá sâu nhất thế giới, được tính từ đỉnh ngọn cây xuống đến nơi bắt đầu xuất hiện lá, với độ sâu khoảng 90,9 m.

Điều này cho thấy Hyperion không chỉ là một thân cây khổng lồ vươn lên bầu trời, mà còn là một “ngôi nhà xanh” trên cao, cung cấp không gian sống cho nhiều sinh vật trong khu rừng.

5. Những con số ấn tượng về Hyperion

- Chiều cao: Khoảng 116,07 m.
- Đường kính thân cây: Khoảng 4,94 m.
- Tuổi đời ước tính: Khoảng 600–800 năm tuổi.
- Khối lượng khô trên mặt đất: Khoảng 209 tấn mét (tương đương khoảng 230 tấn Mỹ).

🌎 Câu chuyện về nơi Hyperion sinh sống

Điều đặc biệt là Hyperion không phát triển trên vùng đất bằng phẳng giàu dinh dưỡng như nhiều cây gỗ đỏ khác, mà lại vươn cao trên một sườn đồi.
Khu vực xung quanh Hyperion từng trải qua nhiều thay đổi do hoạt động khai thác trong quá khứ. Khoảng 96% diện tích rừng gỗ đỏ nguyên sinh xung quanh khu vực này đã từng bị mất đi, khiến những cây gỗ đỏ còn tồn tại như Hyperion trở nên vô cùng quý giá."
"VÌ SAO RỪNG QUAN TRỌNG?

Rừng không chỉ là nơi có những hàng cây xanh cao lớn. Đó còn là một thế giới sống rộng lớn, nơi cây cối, động vật và nhiều sinh vật khác cùng sinh sống, kết nối và phụ thuộc lẫn nhau.

Mỗi khu rừng giống như một ngôi nhà chung của thiên nhiên, mang lại nhiều lợi ích quan trọng cho Trái Đất và con người.

1. Rừng là ngôi nhà của sự sống

Trong rừng có rất nhiều thành phần tự nhiên cùng chung sống và tạo nên một hệ sinh thái cân bằng:

- Thực vật rừng: Gồm các loài cây thân gỗ, tre, nứa, cây họ cau và nhiều loài thực vật khác, tạo nên cấu trúc và màu xanh đặc trưng của khu rừng.
- Động vật rừng: Là nơi các loài sinh vật tìm kiếm thức ăn, nơi trú ẩn và môi trường phù hợp để sinh trưởng, sinh sản.
- Nấm và vi sinh vật: Dù rất nhỏ bé nhưng giữ vai trò quan trọng trong việc phân hủy chất hữu cơ, tái tạo chất dinh dưỡng và giúp đất rừng luôn màu mỡ.
- Đất, nước, ánh sáng và không khí: Cung cấp những điều kiện cần thiết để các sinh vật trong rừng có thể tồn tại và phát triển.

→ Tất cả cùng kết nối với nhau để tạo nên một khu rừng đa dạng, cân bằng và tràn đầy sức sống.
2. Rừng giúp bảo vệ hành tinh xanh

Không chỉ là nơi sinh sống của muôn loài, rừng còn là một người bảo vệ thầm lặng của Trái Đất.

Rừng giúp:

- Bảo vệ nguồn nước: Rừng giữ nước trong đất, duy trì dòng chảy tự nhiên và góp phần bảo vệ các nguồn nước quan trọng.
- Bảo vệ đất: Hệ thống rễ cây giúp giữ đất, hạn chế xói mòn và giảm nguy cơ đất bị suy thoái.
- Giảm tác động của thiên tai: Những khu rừng khỏe mạnh góp phần hạn chế ảnh hưởng của xói mòn, sạt lở và một số hiện tượng thời tiết cực đoan.
- Điều hòa khí hậu: Rừng hấp thụ carbon, giúp điều hòa nhiệt độ, duy trì độ ẩm và tạo nên môi trường sống ổn định.

→ Nhờ những vai trò này, rừng góp phần duy trì sự cân bằng của môi trường và bảo vệ hành tinh xanh.

3. Rừng mang lại nhiều giá trị cho con người

Từ xa xưa, con người đã gắn bó với rừng và sử dụng những giá trị mà rừng mang lại trong cuộc sống.

Rừng cung cấp:

- Các sản phẩm từ rừng: Như gỗ và nhiều loại nguyên liệu tự nhiên khác phục vụ đời sống và sản xuất.
- Nguồn tài nguyên cho hoạt động lâm nghiệp: Giúp tạo ra những giá trị kinh tế khi được khai thác và sử dụng hợp lý.
- Những giá trị môi trường quan trọng: Góp phần mang lại không khí trong lành, bảo vệ nguồn nước và duy trì môi trường sống ổn định.

→ Tuy nhiên, để những giá trị này tồn tại lâu dài, con người cần sử dụng tài nguyên rừng một cách hợp lý, bảo vệ rừng và cùng xây dựng một tương lai phát triển bền vững."	"5.1. Rừng là một hệ sinh thái có giá trị sinh học cao
Căn cứ: Khoản 3 Điều 2 Luật Lâm nghiệp – Giải thích từ ngữ

Luật Lâm nghiệp quy định:

“Rừng là một hệ sinh thái bao gồm các loài thực vật rừng, động vật rừng, nấm, vi sinh vật, đất rừng và các yếu tố môi trường khác, trong đó thành phần chính là một hoặc một số loài cây thân gỗ, tre, nứa, cây họ cau…”

Theo quy định này, rừng không chỉ đơn thuần là nơi có nhiều cây xanh mà là một hệ sinh thái hoàn chỉnh, nơi nhiều thành phần tự nhiên cùng tồn tại, liên kết và phụ thuộc lẫn nhau.

Rừng bao gồm:

Thực vật rừng: các loài cây thân gỗ, tre, nứa, cây họ cau và các loài thực vật khác.
Động vật rừng: các loài sinh vật sống trong môi trường rừng.
Nấm và vi sinh vật: những thành phần quan trọng tham gia vào quá trình duy trì hệ sinh thái.
Đất rừng và các yếu tố môi trường khác: tạo nên điều kiện sống cho các loài sinh vật.

→ Như vậy, một trong những vai trò quan trọng nhất của rừng là duy trì sự tồn tại và cân bằng của hệ sinh thái, tạo nên môi trường sống cho nhiều loài sinh vật.

5.2. Rừng có giá trị về môi trường
Căn cứ: Khoản 12 Điều 2 Luật Lâm nghiệp – Giải thích từ ngữ

Luật Lâm nghiệp quy định:

“Giá trị rừng là tổng giá trị các yếu tố cấu thành hệ sinh thái rừng và các giá trị môi trường rừng tại một thời điểm, trên một diện tích rừng xác định.”

Theo quy định này, giá trị của rừng không chỉ nằm ở cây gỗ hay các sản phẩm có thể khai thác, mà còn bao gồm toàn bộ các yếu tố tạo nên hệ sinh thái rừng và các giá trị môi trường mà rừng mang lại.

Điều này cho thấy rừng có vai trò:

Duy trì các yếu tố tự nhiên trong hệ sinh thái.
Bảo tồn các thành phần sinh học.
Cung cấp các giá trị môi trường gắn với hệ sinh thái rừng.

→ Rừng là một tài nguyên tự nhiên có giá trị tổng hợp, bao gồm cả giá trị sinh thái, môi trường và sử dụng.

5.3. Rừng có chức năng bảo vệ môi trường, bảo vệ đất, nước và hạn chế thiên tai
Căn cứ: Khoản 3 Điều 5 Luật Lâm nghiệp – Rừng phòng hộ

Theo Luật Lâm nghiệp, rừng phòng hộ được sử dụng chủ yếu để:

Bảo vệ nguồn nước.
Bảo vệ đất.
Chống xói mòn.
Hạn chế thiên tai.
Điều hòa khí hậu.
Bảo vệ môi trường.
Cung ứng dịch vụ môi trường rừng.

Từ quy định trên có thể thấy rừng đóng vai trò như một hệ thống bảo vệ tự nhiên, giúp duy trì các điều kiện môi trường cần thiết.

Cụ thể:

Bảo vệ nguồn nước: rừng góp phần duy trì và bảo vệ các nguồn nước tự nhiên.
Bảo vệ đất: hệ sinh thái rừng giúp giữ đất, hạn chế các tác động gây suy thoái đất.
Chống xói mòn: rừng giúp bảo vệ bề mặt đất trước các tác động tự nhiên.
Hạn chế thiên tai: rừng phòng hộ có chức năng góp phần giảm tác động của một số hiện tượng thiên nhiên.
Điều hòa khí hậu: rừng được Luật Lâm nghiệp xác định là một trong những giá trị của hệ sinh thái cần được bảo vệ.

→ Vì vậy, rừng giữ vai trò quan trọng trong việc bảo vệ môi trường sống và duy trì sự ổn định của hệ sinh thái tự nhiên.

5.4. Rừng cung cấp tài nguyên và tạo ra giá trị kinh tế
Căn cứ: Khoản 11 Điều 2 Luật Lâm nghiệp – Giải thích từ ngữ

Luật quy định:

“Quyền sử dụng rừng là quyền của chủ rừng được khai thác công dụng, hưởng hoa lợi, lợi tức từ rừng.”

Bên cạnh đó, theo Khoản 4 Điều 5 Luật Lâm nghiệp, rừng sản xuất được sử dụng chủ yếu để:

Cung cấp lâm sản.
Sản xuất, kinh doanh lâm nghiệp.
Kết hợp phòng hộ, bảo vệ môi trường.
Cung ứng dịch vụ môi trường rừng.

Như vậy, rừng không chỉ có giá trị về mặt sinh thái mà còn mang lại các giá trị sử dụng cho con người thông qua:

Cung cấp các sản phẩm từ rừng.
Tạo nguồn lợi kinh tế từ hoạt động lâm nghiệp.
Mang lại lợi ích từ việc sử dụng các giá trị của rừng theo quy định pháp luật.

→ Rừng là nguồn tài nguyên có giá trị lâu dài, vừa phục vụ phát triển kinh tế, vừa gắn với trách nhiệm bảo vệ và phát triển bền vững."

GIẢNG VIÊN: Lê Vũ Duy
Lecturer · FPT University Can Tho
Giảng viên phụ trách môn Experiential Entrepreneurship, người trực tiếp hướng dẫn nhóm trong toàn bộ hành trình xây dựng Earthoria từ ý tưởng đến sản phẩm hoàn chỉnh. Đội ngũ Earthoira trân trọng cảm ơn thầy.


CÁCH TƯ VẤN VÀ VĂN PHONG:
- Giới thiệu bản thân là Eira, nhân viên tư vấn của Earthoria, ngay từ lời chào đầu tiên.
- Phong cách thân thiện, dùng emoji nhẹ nhàng 🌿, chuyên nghiệp và gần gũi.
- Xưng hô và đặt câu hỏi theo cách người Việt thật sự nói khi tư vấn khách hàng, không dịch word-by-word. Ví dụ: thay vì "Con của bạn có bao nhiêu tuổi?" hãy hỏi "Bé nhà mình năm nay mấy tuổi rồi ạ?" hoặc "Không biết bé nhà mình bao nhiêu tuổi để mình gợi ý sách phù hợp ạ?". Dùng các từ đệm tự nhiên như "ạ", "nhé", "mình", "bé nhà mình" thay vì "bạn", "con của bạn" nghe xa cách và máy móc.
- Hỏi tuổi bé và sở thích trước khi gợi ý sách phù hợp, theo cách nói tự nhiên như trên (ví dụ: "Bé nhà mình mấy tuổi rồi ạ, có thích chủ đề gì đặc biệt không — động vật, khoa học hay nghệ thuật ạ?")
- Nhắc mã EARTH15 khi khách hỏi mua từ 2 cuốn trở lên.
- Với câu hỏi thông tin nhanh (giá, chính sách, giờ hoạt động...): trả lời ngắn gọn dưới 120 từ, có thể dùng bullet points.
- Với câu tư vấn/mô tả sâu một sản phẩm cụ thể theo hướng thuyết phục: trình bày dạng văn xuôi tự nhiên, không dùng bullet, không dùng ký hiệu định dạng như **, *, #, -, không dùng dấu gạch dài (—); thể hiện chiều sâu hiểu biết về giáo dục trẻ em, lồng ghép ngắn gọn giá trị hoặc triết lý thiết kế sản phẩm thay vì chỉ liệt kê thông tin một chiều; đa dạng hóa cách mở đầu câu/đoạn và độ dài câu để tránh nhịp điệu máy móc; dùng ngôn ngữ thận trọng ("có thể", "thường thì") khi không chắc chắn tuyệt đối; kết thúc bằng một lời cảm ơn chân thành vì khách đã quan tâm đến Earthoria.
- Luôn phản hồi như đang trực tiếp trò chuyện với khách hàng, không tạo văn bản dạng mẫu hay kịch bản cố định.
- Tuyệt đối từ chối câu hỏi liên quan đến giới tính, định kiến, chính trị và tôn giáo
- Nếu không biết thông tin, hướng dẫn liên hệ earthoriavn@gmail.com`;

const SUGGESTIONS = [
  { Icon: BookOpen, label: "Sách bán chạy nhất?" },
  { Icon: Baby, label: "Tư vấn bé 7 tuổi" },
  { Icon: Tag, label: "Mã giảm giá?" },
  { Icon: Smartphone, label: "App dùng thế nào?" },
  { Icon: GitCompare, label: "So sánh 2 cuốn sách" },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function nowTime() {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtText(raw) {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      `<code style="background:rgba(0,0,0,0.07);padding:2px 5px;border-radius:4px;font-size:12.5px;font-family:monospace">$1</code>`,
    )
    .replace(/\n/g, "<br>");
}

/**
 * Tách nội dung tin nhắn thành các đoạn text xen kẽ với liên kết markdown
 * dạng [Nhãn](/duong-dan). Dùng để render liên kết nội bộ thành nút bấm
 * điều hướng thật (react-router) thay vì chữ hoặc thẻ <a> tải lại trang.
 */
function parseMessageTokens(raw) {
  const linkRegex = /\[([^\]]+)\]\((\/[^\s)]*)\)/g;
  const tokens = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", content: raw.slice(lastIndex, match.index) });
    }
    tokens.push({ type: "link", label: match[1], path: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < raw.length) {
    tokens.push({ type: "text", content: raw.slice(lastIndex) });
  }
  return tokens;
}

let msgIdCounter = 0;
function makeMsg(role, text, isError = false) {
  return { id: ++msgIdCounter, role, text, isError, time: nowTime() };
}

/** Gọi fetch kèm timeout, tránh treo UI vô thời hạn khi mạng chập chờn */
function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

/* ═══════════════════════════════════════════════════════════════
   ActionButtons
   ═══════════════════════════════════════════════════════════════ */
function ActionButtons({ msg, onRegenerate }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(msg.text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = msg.text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* im lặng bỏ qua nếu clipboard bị chặn quyền */
    }
  };

  return (
    <div className="em-actions">
      <button
        type="button"
        className={`em-action-btn${copied ? " copied" : ""}`}
        title={copied ? "Đã sao chép!" : "Sao chép"}
        onClick={handleCopy}
        aria-label="Sao chép tin nhắn"
      >
        {copied ? (
          <Check size={12} strokeWidth={2.5} />
        ) : (
          <Copy size={12} strokeWidth={2} />
        )}
      </button>

      {msg.role === "bot" && !msg.isError && onRegenerate && (
        <button
          type="button"
          className="em-action-btn"
          title="Hỏi lại"
          onClick={onRegenerate}
          aria-label="Hỏi lại câu này"
        >
          <RotateCcw size={12} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MessageBody — render text xen kẽ nút liên kết điều hướng nội bộ
   ═══════════════════════════════════════════════════════════════ */
function MessageBody({ text, onNavigateAway }) {
  const navigate = useNavigate();
  const tokens = parseMessageTokens(text);

  const handleLinkClick = (path) => {
    navigate(path);
    onNavigateAway?.();
  };

  return (
    <div className="em-bubble">
      {tokens.map((tok, i) => {
        if (tok.type === "link") {
          if (isSafePublicPath(tok.path)) {
            return (
              <button
                type="button"
                key={i}
                className="em-link-btn"
                onClick={() => handleLinkClick(tok.path)}
              >
                {tok.label}
                <ArrowUpRight size={12} strokeWidth={2.5} />
              </button>
            );
          }
          // Đường dẫn không nằm trong whitelist công khai — hiển thị dạng
          // chữ thường, không cho bấm, tuyệt đối không điều hướng được.
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: fmtText(tok.label) }}
            />
          );
        }
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: fmtText(tok.content) }}
          />
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BotMessage / UserMessage
   ═══════════════════════════════════════════════════════════════ */
function BotMessage({ msg, onRegenerate, onNavigateAway }) {
  return (
    <div className={`em bot${msg.isError ? " em-error" : ""}`}>
      <div className="em-label-row">
        <div className="em-av">
          <img src="/eira/avatar.png" alt="" />
        </div>
        <span className="em-name">Eira</span>
      </div>
      <div className="em-content-row">
        {msg.isError && (
          <WifiOff size={13} className="em-error-icon" aria-hidden="true" />
        )}
        <MessageBody text={msg.text} onNavigateAway={onNavigateAway} />
        <ActionButtons msg={msg} onRegenerate={onRegenerate} />
      </div>
      <div className="em-time">{msg.time}</div>
    </div>
  );
}

function UserMessage({ msg }) {
  const safe = msg.text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return (
    <div className="em user">
      <div className="em-label-row">
        <span className="em-name">Bạn</span>
      </div>
      <div className="em-content-row">
        <div className="em-bubble" dangerouslySetInnerHTML={{ __html: safe }} />
        <ActionButtons msg={msg} />
      </div>
      <div className="em-time">{msg.time}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN UI
   ═══════════════════════════════════════════════════════════════ */
function EiraUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [suggHidden, setSuggHidden] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [configError, setConfigError] = useState(null);

  /* Mascot: chỉ ẩn TẠM THỜI 5 phút khi người dùng bấm X, không lưu localStorage */
  const [promoVisible, setPromoVisible] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const msgsWrapRef = useRef(null);
  const msgsEndRef = useRef(null);
  const inpRef = useRef(null);
  const historyRef = useRef([]);
  const lastUserMsgRef = useRef("");
  const isOpenRef = useRef(false);
  const mascotTimeoutRef = useRef(null);

  /* ── Kéo-thả bong bóng FAB ── */
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fabRef = useRef(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
    rect: null,
  });
  const suppressClickRef = useRef(false);

  const DRAG_THRESHOLD = 4; // px — dưới ngưỡng này tính là "click" chứ không phải "kéo"

  /* Kiểm tra cấu hình môi trường ngay khi mount, tránh lỗi im lặng khó chẩn đoán */
  useEffect(() => {
    if (!GROQ_KEY || !GROQ_URL || !GROQ_MODEL) {
      setConfigError(
        "Thiếu cấu hình kết nối AI (VITE_GROQ_KEY / VITE_GROQ_URL / VITE_GROQ_MODEL). Vui lòng kiểm tra file .env.",
      );
    }
  }, []);

  const handleFabPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return; // chỉ chuột trái / chạm chính
    if (e.target.closest?.(".eira-fab-mascot-close")) return;

    const fab = fabRef.current;
    if (!fab) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      baseX: dragPos.x,
      baseY: dragPos.y,
      rect: fab.getBoundingClientRect(),
    };
    fab.setPointerCapture?.(e.pointerId);
  };

  const handleFabPointerMove = (e) => {
    const ds = dragRef.current;
    if (!ds.active) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;

    if (!ds.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      ds.moved = true;
      setIsDragging(true);
    }

    const margin = 6;
    const { rect } = ds;
    const minLeft = margin;
    const maxLeft = window.innerWidth - rect.width - margin;
    const minTop = margin;
    const maxTop = window.innerHeight - rect.height - margin;

    const clampedLeft = Math.min(Math.max(rect.left + dx, minLeft), maxLeft);
    const clampedTop = Math.min(Math.max(rect.top + dy, minTop), maxTop);

    setDragPos({
      x: ds.baseX + (clampedLeft - rect.left),
      y: ds.baseY + (clampedTop - rect.top),
    });
  };

  const endFabDrag = (e) => {
    const ds = dragRef.current;
    if (!ds.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
    try {
      fabRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    if (ds.moved) {
      suppressClickRef.current = true;
    }
  };

  const handleFabClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setIsOpen((v) => !v);
  };

  /* Show promo lần đầu, và mỗi khi promoDismissed quay lại false (hết 5 phút ẩn) */
  useEffect(() => {
    if (promoDismissed || isOpen) return;
    const t = setTimeout(() => setPromoVisible(true), MASCOT_FIRST_SHOW_DELAY);
    return () => clearTimeout(t);
  }, [promoDismissed, isOpen]);

  useEffect(() => {
    if (isOpen) setPromoVisible(false);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (mascotTimeoutRef.current) clearTimeout(mascotTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  /* Tự động cuộn xuống cuối khi có tin nhắn mới hoặc đang gõ,
     nhưng chỉ khi người dùng đang thực sự ở gần cuối khung chat */
  useEffect(() => {
    const wrap = msgsWrapRef.current;
    if (!wrap) return;
    const distFromBottom =
      wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight;
    if (distFromBottom < SCROLL_BOTTOM_THRESHOLD * 2) {
      msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  /* Theo dõi vị trí cuộn để hiện nút "xuống cuối" khi người dùng cuộn lên xem lại lịch sử */
  useEffect(() => {
    const wrap = msgsWrapRef.current;
    if (!wrap) return;
    const onScroll = () => {
      const distFromBottom =
        wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight;
      setShowScrollBtn(distFromBottom > SCROLL_BOTTOM_THRESHOLD);
    };
    wrap.addEventListener("scroll", onScroll, { passive: true });
    return () => wrap.removeEventListener("scroll", onScroll);
  }, [isOpen]);

  const scrollToBottom = () => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) setTimeout(() => inpRef.current?.focus(), 380);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (!isOpen) return;
      const win = document.getElementById("eira-win");
      const fab = document.getElementById("eira-fab");
      if (!win?.contains(e.target) && !fab?.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  /* Core send */
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim().slice(0, MAX_INPUT_LEN);
      if (!trimmed || isBusy) return;

      if (configError) {
        setMessages((prev) => [...prev, makeMsg("bot", configError, true)]);
        return;
      }

      setIsBusy(true);
      setSuggHidden(true);
      setInput("");
      lastUserMsgRef.current = trimmed;

      if (inpRef.current) inpRef.current.style.height = "auto";

      setMessages((prev) => [...prev, makeMsg("user", trimmed)]);
      historyRef.current.push({ role: "user", content: trimmed });
      setIsTyping(true);

      try {
        const res = await fetchWithTimeout(
          GROQ_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GROQ_KEY}`,
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...historyRef.current,
              ],
              temperature: 0.72,
              max_tokens: 380,
              top_p: 0.88,
            }),
          },
          REQUEST_TIMEOUT_MS,
        );

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content?.trim() || null;
        if (!reply) throw new Error("Không nhận được phản hồi từ AI");

        historyRef.current.push({ role: "assistant", content: reply });
        if (historyRef.current.length > MAX_HISTORY_TURNS)
          historyRef.current = historyRef.current.slice(-TRIM_HISTORY_TO);

        setIsTyping(false);
        setMessages((prev) => [...prev, makeMsg("bot", reply)]);
        if (!isOpenRef.current) setUnreadCount((c) => c + 1);
      } catch (err) {
        setIsTyping(false);

        const isAbort = err.name === "AbortError";
        const isQuota =
          err.message?.includes("quota") || err.message?.includes("429");
        const isKey =
          err.message?.includes("API key") || err.message?.includes("400");
        const isNetwork =
          err instanceof TypeError && err.message?.includes("fetch");

        const errMsg = isAbort
          ? "Kết nối đang mất nhiều thời gian hơn bình thường ⏳ Bạn thử lại giúp mình nhé!"
          : isNetwork
            ? "Không thể kết nối mạng lúc này 📶 Vui lòng kiểm tra kết nối Internet và thử lại."
            : isQuota
              ? "Mình đang bị quá tải một chút 😅 Thử lại sau vài giây nhé!"
              : isKey
                ? "Hệ thống AI đang gặp sự cố cấu hình. Vui lòng liên hệ earthoriavn@gmail.com để được hỗ trợ."
                : `Có lỗi xảy ra, bạn thử lại giúp mình nhé! (${err.message})`;

        historyRef.current.pop();
        setMessages((prev) => [...prev, makeMsg("bot", errMsg, true)]);
      } finally {
        setIsBusy(false);
        setTimeout(() => inpRef.current?.focus(), 0);
      }
    },
    [isBusy, configError],
  );

  const handleRegenerate = useCallback(() => {
    if (!lastUserMsgRef.current || isBusy) return;
    if (historyRef.current.length >= 2)
      historyRef.current = historyRef.current.slice(0, -1);
    setMessages((prev) => {
      const lastBot = [...prev].reverse().findIndex((m) => m.role === "bot");
      if (lastBot === -1) return prev;
      return prev.filter((_, i) => i !== prev.length - 1 - lastBot);
    });
    sendMessage(lastUserMsgRef.current);
  }, [isBusy, sendMessage]);

  /* Xóa toàn bộ hội thoại hiện tại, bắt đầu lại từ đầu */
  const handleClearChat = useCallback(() => {
    if (isBusy) return;
    setMessages([]);
    historyRef.current = [];
    lastUserMsgRef.current = "";
    setSuggHidden(false);
  }, [isBusy]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value.slice(0, MAX_INPUT_LEN));
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  const dismissPromo = (e) => {
    e.stopPropagation();
    e.preventDefault();
    suppressClickRef.current = true;

    setPromoVisible(false);
    setPromoDismissed(true);

    if (mascotTimeoutRef.current) clearTimeout(mascotTimeoutRef.current);
    mascotTimeoutRef.current = setTimeout(() => {
      setPromoDismissed(false);
      mascotTimeoutRef.current = null;
    }, MASCOT_HIDE_DURATION);
  };

  const showMascot = promoVisible && !promoDismissed && !isOpen;
  const nearLimit = input.length >= MAX_INPUT_LEN - 40;

  return (
    <div
      id="eira-root"
      className={isDragging ? "dragging" : ""}
      style={{ "--drag-x": `${dragPos.x}px`, "--drag-y": `${dragPos.y}px` }}
    >
      {/* ── FAB ── */}
      <button
        type="button"
        id="eira-fab"
        ref={fabRef}
        className={`${isOpen ? "fab-open" : ""} ${isDragging ? "dragging" : ""} ${unreadCount > 0 && !isOpen ? "has-badge" : ""} ${showMascot ? "mascot" : ""}`.trim()}
        aria-label={
          showMascot
            ? "Eira đang vẫy chào — bấm để mở chat"
            : unreadCount > 0 && !isOpen
              ? `Chat với Eira, ${unreadCount} tin nhắn mới chưa đọc`
              : "Chat với Eira (giữ và kéo để di chuyển)"
        }
        onClick={handleFabClick}
        onPointerDown={handleFabPointerDown}
        onPointerMove={handleFabPointerMove}
        onPointerUp={endFabDrag}
        onPointerCancel={endFabDrag}
      >
        {showMascot ? (
          <>
            <div className="eira-fab-mascot-glow" aria-hidden="true" />
            <span className="eira-firefly eira-firefly-1" aria-hidden="true" />
            <span className="eira-firefly eira-firefly-2" aria-hidden="true" />
            <span className="eira-firefly eira-firefly-3" aria-hidden="true" />
            <span className="eira-firefly eira-firefly-4" aria-hidden="true" />
            <span className="eira-firefly eira-firefly-5" aria-hidden="true" />
            <img
              className="eira-fab-mascot-img"
              src="/eira/eira-sayhi.png"
              alt="Eira vẫy chào"
              draggable="false"
            />
            <span
              className="eira-fab-mascot-close"
              role="button"
              tabIndex={0}
              aria-label="Ẩn linh vật, tự hiện lại sau 5 phút"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={dismissPromo}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") dismissPromo(e);
              }}
            >
              <X size={11} />
            </span>
          </>
        ) : (
          <>
            <div
              className={`eira-online-dot${isOpen || unreadCount > 0 ? " hidden" : ""}`}
            />
            {unreadCount > 0 && !isOpen && (
              <span key={unreadCount} className="eira-badge" aria-hidden="true">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="eira-fab-icon eira-ico-open">
              <MessageCircle size={22} />
            </span>
            <span className="eira-fab-icon eira-ico-close">
              <X size={20} />
            </span>
          </>
        )}
      </button>

      {/* ── Chat Window ── */}
      <div
        id="eira-win"
        className={isOpen ? "win-open" : ""}
        role="dialog"
        aria-modal="true"
        aria-label="Eira - Trợ lý Earthoria"
      >
        <div id="eira-hdr">
          <div className="eira-avatar">
            <div className="eira-avatar-inner">
              <img src="/eira/avatar.png" alt="" />
            </div>
            <div className="eira-av-online" />
          </div>
          <div className="eira-hdr-info">
            <div className="eira-hdr-name">Eira</div>
            <div className="eira-hdr-sub">Trực tuyến · Hỗ trợ 24/7</div>
          </div>
          <div className="eira-hdr-actions">
            {messages.length > 0 && (
              <button
                type="button"
                className="eira-close-btn"
                aria-label="Xóa hội thoại"
                title="Xóa hội thoại"
                onClick={handleClearChat}
                disabled={isBusy}
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              type="button"
              className="eira-close-btn"
              aria-label="Đóng khung chat"
              onClick={() => setIsOpen(false)}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div id="eira-msgs" ref={msgsWrapRef} aria-live="polite">
          <div className="eira-welcome">
            Xin chào! Mình là <strong>Eira</strong> 🌿 — trợ lý ảo của
            Earthoria.
            <br />
            Mình có thể tư vấn sách AR, so sánh sản phẩm và giải đáp mọi thắc
            mắc!
          </div>

          {messages.map((msg, idx) =>
            msg.role === "user" ? (
              <UserMessage key={msg.id} msg={msg} />
            ) : (
              <BotMessage
                key={msg.id}
                msg={msg}
                onRegenerate={
                  idx === messages.length - 1 ? handleRegenerate : null
                }
                onNavigateAway={() => setIsOpen(false)}
              />
            ),
          )}

          {isTyping && (
            <div className="eira-typing">
              <div className="typing-label-row">
                <div className="em-av">
                  <img src="/eira/avatar.png" alt="" />
                </div>
                <span className="em-name" style={{ color: "#0d3330" }}>
                  Eira
                </span>
              </div>
              <div className="typing-bubble">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={msgsEndRef} />
        </div>

        {/* Nút cuộn xuống cuối — hiện khi người dùng cuộn lên xem lại lịch sử */}
        {showScrollBtn && (
          <button
            type="button"
            id="eira-scroll-btn"
            aria-label="Cuộn xuống tin nhắn mới nhất"
            onClick={scrollToBottom}
          >
            <ChevronDown size={16} strokeWidth={2.5} />
          </button>
        )}

        <div id="eira-sugg" className={suggHidden ? "hidden" : ""}>
          {SUGGESTIONS.map(({ Icon, label }) => (
            <button
              type="button"
              key={label}
              className="eira-chip"
              onClick={() => sendMessage(label)}
            >
              <Icon size={12} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        <div id="eira-input-wrap">
          <div id="eira-input-row">
            <textarea
              id="eira-inp"
              ref={inpRef}
              placeholder="Nhắn tin với Eira..."
              rows={1}
              maxLength={MAX_INPUT_LEN}
              value={input}
              onInput={handleInput}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Nhập tin nhắn"
            />
            <button
              type="button"
              id="eira-send"
              aria-label="Gửi tin nhắn"
              disabled={isBusy || !input.trim()}
              onClick={() => sendMessage(input)}
            >
              <Send size={15} strokeWidth={2} />
            </button>
          </div>
          {nearLimit && (
            <div id="eira-char-count" role="status">
              {input.length}/{MAX_INPUT_LEN}
            </div>
          )}
        </div>

        <div id="eira-foot">
          <div className="eira-foot-dot" />
          Powered by Earthoria
        </div>
      </div>
    </div>
  );
}

export default function EiraChatbox() {
  return <EiraUI />;
}