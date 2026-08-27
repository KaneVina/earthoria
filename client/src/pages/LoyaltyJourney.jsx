import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  Route as RouteIcon,
  TrendingUp,
  Percent,
  Truck,
  KeyRound,
  CheckCircle2,
  Lock,
  MapPin,
  ShoppingBag,
  Gem,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Flag,
  Plane,
  PlaneTakeoff,
  PlaneLanding,
  User,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { loyaltyService } from "../services/loyaltyService";
import { formatPrice } from "../utils/helpers";
import "../components/assets/css/loyaltyJourney.css";

/* ─────────────────────────────────────────────────────────────
   DỮ LIỆU 5 HẠNG
───────────────────────────────────────────────────────────── */
const TIERS_FALLBACK = [
  {
    rank: 1,
    roman: "I",
    code: "HANOI",
    name: "Chùa Một Cột",
    image: "/loyalty/chua-mot-cot.png",
    city: "Hà Nội",
    cityCode: "HAN",
    region: "Miền Bắc",
    spirit: "Khởi nguồn",
    distanceKm: 0,
    minSpend: 0,
    discountPercent: 0,
    maxDiscountPerOrder: 0,
    freeShipThreshold: 300000,
    color: "#4a9e3f",
    colorSoft: "rgba(74,158,63,0.12)",
    tagline: "Khởi hành — mọi hành trình đều bắt đầu từ đây",
  },
  {
    rank: 2,
    roman: "II",
    code: "HUE",
    name: "Cố Đô Huế",
    image: "/loyalty/kinh-thanh-hue.png",
    city: "Huế",
    cityCode: "HUI",
    region: "Bắc Trung Bộ",
    spirit: "Di sản",
    distanceKm: 630,
    minSpend: 3000000,
    discountPercent: 3,
    maxDiscountPerOrder: 100000,
    freeShipThreshold: 200000,
    color: "#2a78d6",
    colorSoft: "rgba(42,120,214,0.12)",
    tagline: "Bước chân đầu tiên vượt khỏi vùng an toàn",
  },
  {
    rank: 3,
    roman: "III",
    code: "DANANG",
    name: "Cầu Rồng",
    image: "/loyalty/cau-rong.png",
    city: "Đà Nẵng",
    cityCode: "DAD",
    region: "Trung Bộ",
    spirit: "Bứt phá",
    distanceKm: 765,
    minSpend: 7000000,
    discountPercent: 5,
    maxDiscountPerOrder: 200000,
    freeShipThreshold: 100000,
    color: "#b8862e",
    colorSoft: "rgba(184,134,46,0.12)",
    tagline: "Vươn mình bứt phá như rồng bay ra biển lớn",
  },
  {
    rank: 4,
    roman: "IV",
    code: "NHATRANG",
    name: "Tháp Bà Ponagar",
    image: "/loyalty/thap-ba-ponagar.png",
    city: "Nha Trang",
    cityCode: "CXR",
    region: "Nam Trung Bộ",
    spirit: "Khám phá",
    distanceKm: 1200,
    minSpend: 15000000,
    discountPercent: 8,
    maxDiscountPerOrder: 350000,
    freeShipThreshold: 0,
    color: "#7a4fb5",
    colorSoft: "rgba(122,79,181,0.12)",
    tagline: "Khám phá vùng đất của tháp cổ và biển xanh",
  },
  {
    rank: 5,
    roman: "V",
    code: "HOCHIMINH",
    name: "Landmark 81",
    image: "/loyalty/landmark-81.png",
    city: "TP. Hồ Chí Minh",
    cityCode: "SGN",
    region: "Miền Nam",
    spirit: "Vươn tới đỉnh cao",
    distanceKm: 1710,
    minSpend: 30000000,
    discountPercent: 12,
    maxDiscountPerOrder: 600000,
    freeShipThreshold: 0,
    color: "#c0392b",
    colorSoft: "rgba(192,57,43,0.12)",
    tagline: "Đỉnh cao — chạm tới nóc nhà của Sài Gòn hoa lệ",
  },
];

const DIST_MIN = TIERS_FALLBACK[0].distanceKm;
const DIST_MAX = TIERS_FALLBACK[TIERS_FALLBACK.length - 1].distanceKm;

const formatArea = (km) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(km)} km`;

// Mã sân bay của Earthoria — điểm khởi hành chung cho chặng bay đầu tiên.
const HUB = { cityCode: "ETR", city: "Earthoria" };

/* Giờ bay/giờ hạ cánh/thời lượng chặng — thuần tượng trưng cho giao diện
   vé máy bay, KHÔNG phải giờ bay thật. Tính xác định (deterministic) từ
   rank + distanceKm để mỗi hạng luôn ra đúng 1 bộ giờ cố định, không đổi
   giữa các lần render. Vận tốc giả định 780km/h — tốc độ hành trình
   trung bình của máy bay thương mại — chỉ để thời lượng chặng trông
   hợp lý so với quãng đường tượng trưng, không cần chính xác tuyệt đối. */
const pad2 = (n) => String(n).padStart(2, "0");
const formatClock = (totalMinutes) => {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
};
const formatDuration = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}g${pad2(m)}` : `${m} phút`;
};

/* ─────────────────────────────────────────────────────────────
   useCountUp — đếm số chạy từ 0 → target khi `active` bật lên.
   easeOutCubic, chỉ chạy 1 lần (không reset khi active tắt lại).
───────────────────────────────────────────────────────────── */
function useCountUp(target, active, duration = 1500) {
  const [value, setValue] = useState(0);
  const doneRef = useRef(false);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active || doneRef.current) return;
    doneRef.current = true;
    let startTs = null;

    const tick = (ts) => {
      if (startTs === null) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      else setValue(target);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [active, target, duration]);

  return value;
}

/* ─────────────────────────────────────────────────────────────
   useReveal — quan sát 1 phần tử, trả về true khi đã lọt vào
   khung nhìn (chỉ bật 1 lần, dùng cho fade/slide-in + đếm số).
───────────────────────────────────────────────────────────── */
function useReveal(threshold = 0.18) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(true);
            observer.disconnect();
          }
        });
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, active];
}

/* ════════════════════════ COMPONENT CHÍNH ════════════════════════ */
export default function LoyaltyJourney() {
  const { isAuthenticated, user } = useAuthStore();

  /* reveal-on-scroll cho các khối tĩnh (hero sub, steps, cta...) —
     giữ đúng quy ước sitewide: class .reveal + IntersectionObserver
     toàn trang, y hệt LegalHub/Sitemap. */
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

  const { data: tiers = TIERS_FALLBACK } = useQuery({
    queryKey: ["loyalty-tiers"],
    queryFn: () => loyaltyService.getTiers().then((r) => r.data.data),
    placeholderData: TIERS_FALLBACK,
    staleTime: 5 * 60 * 1000,
  });

  const { data: loyaltyProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["loyalty-profile"],
    queryFn: () => loyaltyService.getMyProfile().then((r) => r.data.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const scrollToStop = useCallback((code) => {
    const el = document.getElementById(`hang-${code}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const scrollToJourney = useCallback(() => {
    document
      .getElementById("lj-journey")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      {/* ═══ BREADCRUMB ═══ */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">
          Trang chủ
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Hạng Thành Viên</span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="lj-hero">
        <div className="lj-hero-grid" />
        <div className="lj-hero-glow-a" />
        <div className="lj-hero-glow-b" />
        <div className="lj-hero-watermark">EARTHORIA</div>
        <span className="lj-dust lj-dust-a" />
        <span className="lj-dust lj-dust-b" />
        <span className="lj-dust lj-dust-c" />

        <div className="lj-hero-inner">
          <div className="lj-hero-badge">
            <span className="lj-hero-badge-dot" />
            <span>Hệ Thống Hạng Thành Viên Earthoria</span>
          </div>

          <h1 className="lj-hero-title">
            Hành Trình
            <br />
            Hạng <em>Thành Viên</em>
          </h1>

          <p className="lj-hero-sub">
            Năm hạng thành viên, năm tấm vé đến những công trình biểu tượng của
            Việt Nam — mỗi đơn hàng bạn hoàn tất đưa bạn cất cánh gần hơn một
            chặng, đến khi chạm đỉnh Landmark 81.
          </p>

          <div className="lj-hero-actions">
            <button
              type="button"
              className="lj-btn-primary"
              onClick={scrollToJourney}
            >
              <PlaneTakeoff size={15} />
              Khám Phá 5 Chặng Bay
            </button>
            {!isAuthenticated && (
              <Link to="/login" className="lj-btn-ghost">
                Đăng Nhập Để Bắt Đầu
              </Link>
            )}
          </div>

          <button
            type="button"
            className="lj-scroll-cue"
            onClick={scrollToJourney}
          >
            <span>Cuộn để khám phá</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </section>

      {/* ═══ PASSPORT STRIP — hộ chiếu / trạng thái của bạn.
           Đây chính là điểm nối giữa Hero và Stats: nó nổi đè lên mép
           dưới Hero (overlap âm) trong khi nền Hero đang mờ dần sang
           màu sáng phía sau, nên card không "cắt" đột ngột mà như đang
           trôi trên đường chuyển màu. ═══ */}
      <PassportStrip
        isAuthenticated={isAuthenticated}
        loading={profileLoading}
        loyaltyProfile={loyaltyProfile}
        onLocate={scrollToStop}
      />

      {/* ═══ CUNG ĐƯỜNG HÀNH TRÌNH — dời lên ngay sau Hero/Passport vì đây
           là nội dung chính của trang, thay vì để tít dưới Stats/Steps. ═══ */}
      <section className="lj-journey" id="lj-journey">
        <div className="lj-journey-inner">
          <div
            className="lj-section-head reveal"
            style={{ textAlign: "center" }}
          >
            <span className="lj-eyebrow">Sổ Vé Hành Trình</span>
            <h2 className="lj-section-title">
              Năm Tấm Vé, <em>Một Hành Trình</em>
            </h2>
            <p className="lj-section-sub">
              Từ Earthoria đến đỉnh Landmark 81 — mỗi hạng là một tấm vé máy bay
              tới một công trình biểu tượng có thật của Việt Nam, được kể lại
              thành hành trình thành viên của riêng bạn.
            </p>
          </div>

          <div className="lj-track">
            {/* Không còn 1 đường dùng chung cho cả track (kiểu pattern nền lặp
                lại theo chu kỳ cố định sẽ "trôi" tự do, không biết seal nằm ở
                đâu). Giờ MỖI cap/row tự vẽ đoạn "đường" của chính nó (2 viền
                liền nét + 1 vạch giữa đứt nét, như đường xe chạy) bằng SVG,
                co giãn đúng theo chiều cao thật nên luôn đi qua đúng tâm seal
                dù card cao thấp khác nhau, và mỗi đoạn nhận đúng 1 màu của
                hạng đó qua var(--tier-color) — không phải 1 màu vàng chung
                chung nữa. 2 đoạn đầu/cuối (trước hạng I, sau hạng V) dùng
                var(--lj-route-gold) — tông đồng cổ trầm, không phải vàng
                sáng var(--lj-gold-true) của nút/badge (dùng màu chói cho 1
                đường trang trí dài dễ bị "phèn", nên tách riêng 1 tông
                trầm hơn chỉ dành cho hệ thống đường đi). */}
            <div className="lj-track-cap lj-track-cap-start">
              <TrackCurve
                color="var(--lj-route-gold)"
                opacity={0.42}
                fade="in"
              />
              <span className="lj-track-cap-mark">
                <span className="lj-track-cap-icon">
                  <Flag size={13} />
                </span>
                <span>Khởi hành</span>
              </span>
            </div>

            {tiers.map((tier, i) => (
              <RankStop
                key={tier.code}
                tier={tier}
                prevTier={i === 0 ? null : tiers[i - 1]}
                isLast={i === tiers.length - 1}
                index={i}
                loyaltyProfile={isAuthenticated ? loyaltyProfile : null}
                passengerName={isAuthenticated ? user?.name : null}
              />
            ))}

            <div className="lj-track-cap lj-track-cap-end">
              <TrackCurve
                color="var(--lj-route-gold)"
                opacity={0.42}
                fade="out"
              />
              <span className="lj-track-cap-mark">
                <span className="lj-track-cap-icon">
                  <Gem size={13} />
                </span>
                <span>Đích đến</span>
              </span>
            </div>
          </div>

          <p className="lj-journey-note reveal">
            <Sparkles size={13} />
            Chi tiêu được tính trên các đơn hàng đã thanh toán và giao thành
            công. Hạng thành viên không bao giờ bị hạ — chỉ tăng dần theo tổng
            chi tiêu trọn đời của bạn tại Earthoria.
          </p>
        </div>
      </section>

      <SectionSeam variant="journey-stats" />

      {/* ═══ STATS STRIP ═══ */}
      <section className="lj-stats">
        <div className="lj-stats-inner">
          <div className="lj-stat-item reveal">
            <RouteIcon size={20} />
            <div className="lj-stat-value">5</div>
            <div className="lj-stat-label">Hạng thành viên</div>
            <div className="lj-stat-sub">
              {tiers[0]?.name} → {tiers[tiers.length - 1]?.name}
            </div>
          </div>
          <div className="lj-stat-item reveal">
            <Plane size={20} />
            <div className="lj-stat-value">0 → 1.710 km</div>
            <div className="lj-stat-label">Quãng đường bay tượng trưng</div>
            <div className="lj-stat-sub">Từ Hà Nội đến TP.HCM</div>
          </div>
          <div className="lj-stat-item reveal">
            <Percent size={20} />
            <div className="lj-stat-value">Đến 12%</div>
            <div className="lj-stat-label">Giảm giá mỗi đơn hàng</div>
            <div className="lj-stat-sub">
              Tối đa {formatPrice(tiers[tiers.length - 1]?.maxDiscountPerOrder)}
              /đơn
            </div>
          </div>
          <div className="lj-stat-item reveal">
            <Truck size={20} />
            <div className="lj-stat-value">Từ Hạng IV</div>
            <div className="lj-stat-label">Miễn phí vận chuyển toàn phần</div>
            <div className="lj-stat-sub">Không giới hạn giá trị đơn</div>
          </div>
        </div>
      </section>

      <SectionSeam variant="stats-steps" />

      {/* ═══ 3 BƯỚC VẬN HÀNH ═══ */}
      <section className="lj-steps">
        <div className="lj-steps-inner">
          <div className="lj-section-head reveal">
            <span className="lj-eyebrow">Vận Hành Đơn Giản</span>
            <h2 className="lj-section-title">
              Ba Bước Để <em>Nâng Hạng</em>
            </h2>
          </div>
          <div className="lj-steps-grid">
            <StepCard
              icon={ShoppingBag}
              index="01"
              title="Mua Sắm & Tích Lũy"
              desc="Mọi đơn hàng thanh toán và giao thành công đều được cộng dồn vào tổng chi tiêu trọn đời của bạn tại Earthoria."
              tag="Không giới hạn số đơn"
            />
            <StepCard
              icon={TrendingUp}
              index="02"
              title="Tự Động Nâng Hạng"
              desc="Khi tổng chi tiêu chạm ngưỡng của một vùng đất mới, hạng thành viên được nâng ngay — không cần đăng ký hay chờ duyệt."
              tag="Tự động 100%"
            />
            <StepCard
              icon={Gem}
              index="03"
              title="Nhận Đặc Quyền Ngay"
              desc="Ưu đãi giảm giá và miễn phí vận chuyển áp dụng tự động cho đơn hàng tiếp theo, ngay khi bạn bước sang hạng mới."
              tag="Áp dụng ngay lập tức"
            />
          </div>
        </div>
      </section>

      <SectionSeam variant="steps-cta" />

      {/* ═══ CTA CUỐI TRANG ═══ */}
      <FinalCta
        isAuthenticated={isAuthenticated}
        loyaltyProfile={loyaltyProfile}
      />
    </>
  );
}

/* ════════════════════════ PASSPORT STRIP ════════════════════════ */

/* Đường viền Việt Nam DỰNG TỪ DỮ LIỆU ĐỊA LÝ THẬT — gói npm
   @geo-maps/countries-land-1km (Natural Earth 1km, public domain), lấy
   đúng polygon đất liền Việt Nam (1767 điểm gốc), đơn giản hoá còn 181
   điểm bằng thuật toán Ramer–Douglas–Peucker (giữ hình dạng, bỏ điểm dư
   thừa), chiếu lng/lat vào viewBox 200×520 rồi làm mượt nhẹ bằng
   Catmull-Rom → Bezier. Đây mới là hình dạng thật (đủ các vịnh, các
   ngón sông Cửu Long, mũi Cà Mau...), không còn là ước lượng vẽ tay. */
const VN_SHAPE_PATH =
  "M 15.0,43.7 C 15.3,43.6 16.8,44.8 17.8,43.2 C 18.7,41.7 20.7,30.9 22.9,30.8 C 25.0,30.7 33.3,42.4 35.6,42.2 C 38.0,42.1 41.1,30.2 42.5,29.6 C 43.9,29.0 46.3,37.1 47.2,37.1 C 48.1,37.2" +
  "48.6,29.8 49.8,30.2 C 51.0,30.5 56.2,40.1 57.6,40.1 C 58.9,40.0 60.1,31.1 60.9,29.7 C 61.7,28.3 63.5,28.1 64.2,28.6 C 64.9,29.1 66.0,33.9 66.8,33.8 C 67.7,33.8 70.6,28.7 71.6,28.1 C 72.6,27.6" +
  "74.4,29.7 75.2,29.3 C 76.0,29.0 78.1,26.3 78.3,25.1 C 78.5,23.9 75.5,21.2 76.8,19.4 C 78.1,17.6 86.8,9.8 88.9,10.0 C 91.1,10.2 93.2,18.9 94.7,20.9 C 96.2,22.8 100.2,25.8 101.8,26.1 C 103.4,26.5" +
  "106.9,23.3 108.0,23.5 C 109.2,23.7 110.2,27.6 111.3,27.8 C 112.4,28.0 115.4,24.8 116.9,25.1 C 118.4,25.3 123.8,27.7 123.9,29.6 C 124.0,31.6 118.2,37.8 117.8,41.2 C 117.4,44.7 119.4,56.3 120.7,58.5 C 122.0,60.6" +
  "127.6,58.5 128.5,59.1 C 129.3,59.7 127.3,62.2 128.1,63.1 C 128.9,63.9 133.9,65.0 134.9,66.0 C 135.9,66.9 134.8,70.5 136.3,70.8 C 137.9,71.2 145.8,68.5 147.8,68.9 C 149.8,69.4 153.4,74.2 153.2,74.7 C 152.9,75.3" +
  "147.2,72.6 145.9,73.3 C 144.5,74.1 143.2,80.1 142.1,81.1 C 140.9,82.0 137.2,80.1 136.5,81.3 C 135.8,82.6 137.5,90.0 136.1,91.2 C 134.7,92.4 125.8,91.0 124.6,91.4 C 123.5,91.8 126.7,94.2 126.7,94.3 C 126.7,94.4" +
  "124.8,91.6 124.6,91.9 C 124.4,92.2 125.3,95.9 124.9,96.7 C 124.6,97.6 122.0,98.1 121.8,98.7 C 121.6,99.4 123.9,101.3 123.4,102.2 C 123.0,103.0 118.8,104.1 118.1,105.9 C 117.5,107.7 119.7,114.6 117.9,117.2 C 116.2,119.8" +
  "105.9,124.3 103.6,127.8 C 101.2,131.3 98.9,144.0 98.6,146.5 C 98.2,149.0 101.0,147.3 100.6,148.8 C 100.3,150.4 95.5,156.0 95.7,159.5 C 95.8,163.1 99.8,175.2 102.0,178.7 C 104.3,182.2 112.8,185.2 114.7,188.7 C 116.6,192.3" +
  "114.7,202.1 117.8,208.2 C 121.0,214.3 138.5,236.2 140.9,239.9 C 143.2,243.6 136.3,237.9 137.2,239.0 C 138.2,240.0 148.0,247.6 149.1,248.4 C 150.2,249.2 146.7,245.6 146.5,245.9 C 146.2,246.2 146.3,250.5 147.0,250.9 C 147.6,251.3" +
  "151.0,248.8 151.6,249.1 C 152.2,249.3 151.6,252.6 152.1,253.1 C 152.6,253.7 155.4,253.0 155.7,253.5 C 155.9,254.1 154.1,257.4 154.4,257.7 C 154.8,258.0 158.3,255.4 158.7,255.9 C 159.1,256.5 156.9,259.4 157.7,262.2 C 158.5,265.0" +
  "163.8,277.0 165.4,279.2 C 166.9,281.4 169.4,279.5 170.4,280.4 C 171.3,281.3 173.1,285.2 173.0,286.4 C 172.9,287.5 169.9,289.6 169.8,290.0 C 169.7,290.4 171.2,288.2 172.0,290.0 C 172.8,291.7 175.1,299.6 176.2,304.6 C 177.3,309.6" +
  "180.6,327.2 181.2,332.0 C 181.8,336.8 181.3,343.4 181.1,344.5 C 180.8,345.6 178.9,341.0 179.0,341.2 C 179.2,341.5 182.1,345.8 182.1,346.7 C 182.1,347.6 179.0,346.7 179.4,348.9 C 179.7,351.2 184.6,363.0 185.0,365.4 C 185.4,367.7" +
  "182.8,367.1 182.7,368.5 C 182.6,370.0 184.5,377.2 184.4,377.2 C 184.4,377.3 183.1,369.4 182.4,369.1 C 181.7,368.8 178.9,373.1 178.8,374.9 C 178.8,376.7 182.2,382.9 182.0,383.7 C 181.9,384.5 177.8,379.7 177.7,381.7 C 177.5,383.7" +
  "180.9,398.6 181.0,400.4 C 181.0,402.2 178.9,396.3 178.4,396.5 C 178.0,396.7 177.1,401.5 177.2,402.0 C 177.2,402.5 178.5,400.1 178.8,400.6 C 179.2,401.0 180.4,404.2 179.8,405.6 C 179.3,406.9 174.9,410.3 174.3,411.8 C 173.7,413.3" +
  "176.1,416.5 174.8,418.1 C 173.5,419.7 165.4,423.2 163.4,425.0 C 161.4,426.8 159.2,432.1 158.0,433.1 C 156.8,434.1 154.0,432.3 153.1,433.2 C 152.3,434.0 153.8,438.0 151.0,440.5 C 148.2,442.9 132.2,452.2 129.9,453.3 C 127.5,454.4" +
  "131.6,450.8 131.4,449.8 C 131.1,448.8 128.1,444.6 127.6,444.7 C 127.1,444.8 127.6,449.6 127.2,450.4 C 126.9,451.1 125.3,451.7 125.0,451.3 C 124.7,451.0 125.3,447.6 125.0,447.4 C 124.6,447.2 122.4,448.7 122.1,449.8 C 121.9,450.9" +
  "123.0,455.9 122.8,456.6 C 122.6,457.4 120.4,455.4 120.4,455.9 C 120.4,456.5 122.7,460.3 122.6,461.4 C 122.5,462.5 120.4,465.0 119.5,465.2 C 118.6,465.4 115.0,462.4 115.1,463.0 C 115.1,463.6 120.0,469.7 119.9,470.0 C 119.9,470.2" +
  "114.8,464.7 114.6,465.2 C 114.4,465.7 118.0,472.7 118.2,474.4 C 118.4,476.0 116.9,478.5 116.3,479.2 C 115.7,479.9 114.8,481.5 113.3,480.0 C 111.7,478.4 103.2,466.1 103.0,466.0 C 102.8,465.8 110.8,476.1 111.6,478.4 C 112.3,480.7" +
  "111.2,483.4 109.1,485.2 C 107.0,487.1 97.4,490.9 94.0,494.1 C 90.5,497.3 82.8,510.0 80.5,512.0 C 78.2,514.0 74.9,511.4 74.7,510.5 C 74.5,509.6 78.9,505.5 79.1,504.8 C 79.3,504.1 76.3,508.8 76.3,504.5 C 76.3,500.3" +
  "78.1,473.9 79.0,469.2 C 79.9,464.6 84.4,467.4 84.0,465.8 C 83.5,464.3 77.0,457.2 75.5,456.4 C 74.1,455.6 73.0,460.1 72.1,459.3 C 71.3,458.5 67.6,451.4 68.4,449.8 C 69.1,448.3 76.5,447.7 78.4,446.5 C 80.2,445.2" +
  "83.2,441.2 83.7,439.7 C 84.1,438.2 82.0,434.9 82.1,433.9 C 82.1,432.9 83.2,431.3 84.1,431.5 C 85.0,431.7 88.4,435.6 89.2,435.5 C 90.1,435.5 90.2,431.9 91.4,431.2 C 92.7,430.4 98.3,428.7 99.5,429.2 C 100.7,429.6" +
  "100.1,433.9 101.2,434.9 C 102.4,435.9 108.2,438.2 109.1,437.4 C 110.0,436.6 109.9,430.5 109.0,428.5 C 108.1,426.5 102.6,422.9 101.5,420.6 C 100.5,418.3 99.8,411.2 100.2,409.3 C 100.7,407.3 103.4,404.2 105.2,404.0 C 107.0,403.8" +
  "114.1,408.3 115.1,407.5 C 116.2,406.7 113.5,398.4 114.2,397.2 C 115.0,396.0 119.2,398.7 121.4,397.4 C 123.6,396.1 130.4,387.4 132.3,386.3 C 134.3,385.2 136.6,388.4 137.6,388.2 C 138.6,388.0 140.4,387.3 140.5,384.4 C 140.7,381.6" +
  "139.0,369.0 139.2,364.2 C 139.4,359.4 142.7,349.3 142.2,344.6 C 141.8,339.8 135.8,329.1 135.7,324.6 C 135.5,320.2 140.2,310.5 140.9,307.4 C 141.6,304.3 141.9,300.4 141.6,298.9 C 141.4,297.3 138.7,295.1 138.8,294.4 C 138.9,293.6" +
  "141.9,294.5 142.4,292.9 C 142.8,291.2 143.1,282.3 142.4,280.5 C 141.8,278.7 137.9,279.2 136.8,277.9 C 135.6,276.5 132.7,272.0 132.9,269.5 C 133.0,267.1 139.1,260.0 138.4,257.7 C 137.8,255.4 128.9,252.3 127.2,250.4 C 125.6,248.6" +
  "125.5,243.0 124.7,242.3 C 123.9,241.7 121.2,247.3 120.4,245.4 C 119.5,243.5 120.0,231.6 117.4,226.6 C 114.8,221.7 101.8,209.0 98.9,204.1 C 95.9,199.2 93.9,188.0 92.8,186.0 C 91.7,184.0 90.8,187.9 90.0,187.4 C 89.1,186.9" +
  "86.3,184.1 85.7,181.9 C 85.0,179.6 85.8,170.5 84.5,168.6 C 83.3,166.6 78.9,168.1 75.4,165.7 C 71.8,163.4 57.0,151.5 55.3,148.6 C 53.5,145.8 60.4,143.5 60.9,142.0 C 61.5,140.4 58.5,136.2 59.7,135.8 C 61.0,135.4" +
  "69.0,138.7 71.1,138.3 C 73.3,137.8 76.3,134.1 77.5,132.1 C 78.7,130.2 81.9,123.7 81.3,121.8 C 80.7,120.0 73.4,118.4 72.4,116.8 C 71.5,115.3 73.9,109.5 73.5,108.9 C 73.1,108.4 70.0,112.4 69.2,112.5 C 68.4,112.7" +
  "66.5,111.3 66.9,110.0 C 67.4,108.8 73.8,104.5 73.0,102.4 C 72.3,100.2 62.9,92.7 60.6,91.9 C 58.3,91.1 55.0,94.5 53.8,95.8 C 52.6,97.0 52.7,102.7 50.8,102.6 C 48.8,102.5 40.0,97.1 37.5,94.6 C 35.1,92.2" +
  "30.8,85.6 30.4,82.2 C 30.0,78.7 34.1,67.7 34.3,65.9 C 34.5,64.1 32.5,67.8 32.1,67.3 C 31.7,66.9 31.6,62.3 31.0,62.5 C 30.5,62.6 27.9,69.2 27.3,68.9 C 26.7,68.6 27.4,63.0 25.9,59.9 C 24.4,56.9" +
  "16.3,45.6 15.0,43.7 C 13.7,41.7 14.7,43.7 15.0,43.7 Z";

/* 3 cụm đảo lớn trang trí thêm, tách polygon từ cùng bộ dữ liệu — không
   bắt buộc để nhận ra hình dáng đất nước nhưng thêm vào cho chân thực:
   Vịnh Hạ Long/Cát Bà (Quảng Ninh, vùng Miền Bắc), Phú Quốc & Côn Đảo
   (vùng Miền Nam). */
const HALONG_PATH =
  "M 126.8,95.6 C 126.8,95.6 126.8,95.2 126.8,95.3 C 126.8,95.4 126.9,96.3 126.9,96.3 C 127.0,96.4 127.4,95.9 127.5,95.9 C 127.5,95.9 127.4,96.4 127.5,96.4 C 127.5,96.4 127.7,95.8 127.8,95.8 C 127.9,95.9" +
  "128.2,96.6 128.2,96.6 C 128.3,96.6 128.0,95.9 128.1,95.8 C 128.1,95.7 128.6,95.6 128.7,95.8 C 128.8,96.0 129.0,97.3 129.0,97.5 C 129.0,97.6 129.0,96.7 129.1,96.7 C 129.1,96.7 129.3,97.4 129.4,97.5 C 129.5,97.5" +
  "129.6,97.1 129.7,97.1 C 129.8,97.1 130.2,97.6 130.2,97.7 C 130.3,97.8 129.7,97.6 129.7,97.7 C 129.7,97.8 130.3,98.6 130.3,98.7 C 130.3,98.8 129.9,98.8 129.9,98.7 C 129.8,98.7 129.9,98.3 129.9,98.3 C 129.9,98.3" +
  "129.8,98.8 129.8,98.6 C 129.7,98.5 129.2,97.3 129.2,97.2 C 129.1,97.2 129.6,98.3 129.6,98.4 C 129.7,98.6 129.3,98.4 129.2,98.4 C 129.2,98.5 129.2,98.6 129.2,98.6 C 129.2,98.6 129.4,98.5 129.4,98.5 C 129.5,98.5" +
  "129.6,98.6 129.6,98.6 C 129.6,98.6 129.4,98.8 129.4,98.8 C 129.4,98.8 129.5,98.6 129.5,98.6 C 129.5,98.6 129.4,98.5 129.3,98.5 C 129.3,98.6 129.3,98.8 129.2,98.8 C 129.2,98.8 129.1,98.6 129.0,98.6 C 129.0,98.7" +
  "128.9,98.9 128.9,99.0 C 128.9,99.0 129.2,99.1 129.2,99.1 C 129.3,99.1 129.0,99.3 129.0,99.2 C 128.9,99.1 128.6,98.3 128.6,98.4 C 128.7,98.4 129.0,99.5 129.1,99.7 C 129.2,99.8 129.2,99.5 129.2,99.6 C 129.3,99.6" +
  "129.6,99.7 129.6,99.8 C 129.6,99.8 129.5,100.1 129.4,100.1 C 129.4,100.1 129.4,99.8 129.4,99.8 C 129.4,99.7 129.2,99.5 129.2,99.7 C 129.1,99.8 129.2,100.8 129.1,100.8 C 129.1,100.9 128.8,100.3 128.8,100.3 C 128.7,100.2" +
  "128.8,100.6 128.7,100.6 C 128.7,100.7 128.4,100.6 128.3,100.4 C 128.3,100.3 128.4,99.8 128.3,99.7 C 128.2,99.6 127.9,99.6 127.8,99.7 C 127.8,99.7 128.0,100.6 127.9,100.4 C 127.8,100.2 127.0,98.4 126.8,98.1 C 126.6,97.8" +
  "126.1,98.1 126.0,98.0 C 125.9,97.9 125.8,97.4 125.9,97.3 C 125.9,97.2 126.5,97.2 126.6,97.1 C 126.6,97.0 126.2,96.6 126.2,96.5 C 126.2,96.4 126.6,96.3 126.6,96.4 C 126.7,96.5 126.7,97.0 126.7,96.9 C 126.8,96.9" +
  "126.8,95.8 126.8,95.6 C 126.8,95.5 126.8,95.7 126.8,95.6 Z";

const PHU_QUOC_PATH =
  "M 60.0,451.6 C 60.0,452.1 60.2,454.7 60.0,455.8 C 59.9,457.0 58.7,460.6 58.6,461.3 C 58.5,462.1 59.1,461.6 59.2,461.8 C 59.2,462.0 58.8,462.8 58.9,463.1 C 58.9,463.4 59.4,463.9 59.4,464.0 C 59.3,464.0" +
  "58.8,463.6 58.7,463.5 C 58.6,463.5 58.5,463.9 58.4,463.8 C 58.3,463.7 58.1,463.4 57.9,462.5 C 57.8,461.5 57.2,456.9 56.9,455.9 C 56.7,454.9 56.4,454.6 56.2,454.4 C 55.9,454.1 55.1,454.2 54.9,453.9 C 54.7,453.6" +
  "54.3,452.1 54.3,451.8 C 54.2,451.5 54.1,451.3 54.4,451.3 C 54.7,451.3 56.2,452.0 56.5,451.9 C 56.8,451.8 56.8,450.7 56.9,450.6 C 57.0,450.4 57.3,450.4 57.4,450.3 C 57.5,450.1 57.4,449.4 57.5,449.2 C 57.6,449.1" +
  "57.7,448.5 58.0,448.8 C 58.3,449.1 59.8,451.2 60.0,451.6 C 60.2,451.9 60.0,451.1 60.0,451.6 Z";

const CON_DAO_PATH =
  "M 119.1,506.8 C 119.2,506.7 119.8,506.2 119.9,506.2 C 120.0,506.1 120.2,506.4 120.2,506.4 C 120.2,506.4 119.9,506.3 119.9,506.4 C 119.9,506.5 120.1,507.0 120.1,507.1 C 120.0,507.3 119.5,507.5 119.5,507.6 C 119.5,507.8" +
  "120.0,508.4 120.0,508.5 C 120.0,508.5 119.6,508.2 119.4,508.2 C 119.3,508.3 118.7,508.7 118.7,509.0 C 118.6,509.2 119.0,510.1 118.9,510.3 C 118.9,510.4 118.2,510.2 118.1,510.1 C 117.9,509.9 117.5,509.4 117.6,509.0 C 117.7,508.6" +
  "118.9,507.1 119.1,506.8 C 119.3,506.5 119.0,506.9 119.1,506.8 Z";

/* Dải toạ độ y cho từng "vùng" trên bản đồ, khớp đúng 5 hạng/5 vùng đã
   định nghĩa ở LOYALTY_TIERS phía server (tier.code) — vùng nào ứng
   với hạng đó sẽ tô màu theo tier.color/tier.colorSoft khi mở khoá.
   Ranh giới y lấy theo phân bố thật của toạ độ tỉnh bên dưới. */
const TIER_BAND_Y = {
  HANOI: [0, 120],
  HUE: [120, 250],
  DANANG: [250, 350],
  NHATRANG: [350, 420],
  HOCHIMINH: [420, 520],
};

/* 34 tỉnh, thành sau sáp nhập (Nghị quyết 202/2025/QH15, hiệu lực
   01/07/2025) — toạ độ x,y được chiếu từ lat/lng THẬT của trung tâm
   hành chính mỗi tỉnh, dùng ĐÚNG bounding box (102.144–109.456°E,
   8.589–23.393°N) và phép chiếu của silhouette phía trên, nên vị trí
   từng tỉnh khớp chính xác lên đúng chỗ của nó trên hình dạng thật.
   Mỗi tỉnh gắn với đúng 1 trong 5 vùng/hạng để "sáng lên" cùng lúc với
   vùng của nó khi người dùng lên hạng tương ứng. */
const PROVINCES_34 = [
  // Miền Bắc — Hạng I (Chùa Một Cột)
  { name: "Điện Biên", x: 35.4, y: 77.9, tier: "HANOI" },
  { name: "Lai Châu", x: 45.8, y: 44.0, tier: "HANOI" },
  { name: "Lào Cai", x: 67.5, y: 53.8, tier: "HANOI" },
  { name: "Sơn La", x: 56.1, y: 80.0, tier: "HANOI" },
  { name: "Tuyên Quang", x: 83.7, y: 47.1, tier: "HANOI" },
  { name: "Cao Bằng", x: 110.7, y: 34.5, tier: "HANOI" },
  { name: "Lạng Sơn", x: 122.3, y: 62.3, tier: "HANOI" },
  { name: "Thái Nguyên", x: 100.9, y: 62.3, tier: "HANOI" },
  { name: "Phú Thọ", x: 91.9, y: 86.1, tier: "HANOI" },
  { name: "Quảng Ninh", x: 129.8, y: 92.8, tier: "HANOI" },
  { name: "Hải Phòng", x: 116.3, y: 94.5, tier: "HANOI" },
  { name: "Bắc Ninh", x: 107.9, y: 83.3, tier: "HANOI" },
  { name: "Hà Nội", x: 101.2, y: 90.1, tier: "HANOI" },
  { name: "Hưng Yên", x: 109.3, y: 106.4, tier: "HANOI" },
  { name: "Ninh Bình", x: 105.1, y: 111.5, tier: "HANOI" },
  // Bắc Trung Bộ — Hạng II (Cố Đô Huế)
  { name: "Thanh Hóa", x: 99.5, y: 131.5, tier: "HUE" },
  { name: "Nghệ An", x: 97.4, y: 169.8, tier: "HUE" },
  { name: "Hà Tĩnh", x: 102.3, y: 181.3, tier: "HUE" },
  { name: "Quảng Trị", x: 124.4, y: 221.7, tier: "HUE" },
  { name: "TP Huế", x: 141.6, y: 245.1, tier: "HUE" },
  // Trung Bộ — Hạng III (Cầu Rồng)
  { name: "Đà Nẵng", x: 159.3, y: 267.5, tier: "DANANG" },
  { name: "Quảng Ngãi", x: 160.4, y: 304.8, tier: "DANANG" },
  { name: "Gia Lai", x: 165.1, y: 332.9, tier: "DANANG" },
  // Nam Trung Bộ — Hạng IV (Tháp Bà Ponagar)
  { name: "Đắk Lắk", x: 167.4, y: 365.8, tier: "NHATRANG" },
  { name: "Khánh Hòa", x: 176.7, y: 399.7, tier: "NHATRANG" },
  { name: "Lâm Đồng", x: 151.1, y: 409.9, tier: "NHATRANG" },
  // Miền Nam — Hạng V (Landmark 81)
  { name: "Tây Ninh", x: 110.5, y: 433.6, tier: "HOCHIMINH" },
  { name: "Đồng Nai", x: 124.6, y: 422.1, tier: "HOCHIMINH" },
  { name: "TP.HCM", x: 123.2, y: 440.4, tier: "HOCHIMINH" },
  { name: "An Giang", x: 87.2, y: 457.4, tier: "HOCHIMINH" },
  { name: "Đồng Tháp", x: 104.6, y: 450.6, tier: "HOCHIMINH" },
  { name: "Cần Thơ", x: 98.6, y: 470.9, tier: "HOCHIMINH" },
  { name: "Vĩnh Long", x: 110.0, y: 459.4, tier: "HOCHIMINH" },
  { name: "Cà Mau", x: 91.6, y: 490.3, tier: "HOCHIMINH" },
];

/* Bản đồ Việt Nam thu nhỏ bên trong hộ chiếu — mỗi vùng tô màu nhạt
   theo tier.colorSoft mặc định, sáng hẳn lên đúng màu tier.color ngay
   khi vùng đó (đọc theo tiers[].unlocked/isCurrent) được mở khoá; 34
   chấm tỉnh thành đi kèm cũng đổi từ rỗng sang đặc theo cùng trạng thái. */
function PassportVietnamMap({ tiers }) {
  const tierByCode = Object.fromEntries(tiers.map((t) => [t.code, t]));
  const hanoiActive =
    tierByCode.HANOI &&
    (tierByCode.HANOI.unlocked || tierByCode.HANOI.isCurrent);
  const hcmActive =
    tierByCode.HOCHIMINH &&
    (tierByCode.HOCHIMINH.unlocked || tierByCode.HOCHIMINH.isCurrent);
  return (
    <div className="lj-passport-map">
      <div className="lj-passport-map-label">
        <MapPin size={10} />
        34 Tỉnh Thành
      </div>
      <svg
        viewBox="0 0 200 520"
        className="lj-vnmap-svg"
        role="img"
        aria-label="Bản đồ 34 tỉnh thành Việt Nam theo vùng hạng thành viên"
      >
        <defs>
          <clipPath id="vnmap-shape">
            <path d={VN_SHAPE_PATH} />
          </clipPath>
        </defs>
        {Object.entries(TIER_BAND_Y).map(([code, [y1, y2]]) => {
          const t = tierByCode[code];
          if (!t) return null;
          const active = t.unlocked || t.isCurrent;
          return (
            <rect
              key={code}
              x="0"
              y={y1}
              width="200"
              height={y2 - y1}
              clipPath="url(#vnmap-shape)"
              fill={active ? t.colorSoft : "rgba(150,158,152,0.12)"}
              className="lj-vnmap-band"
            />
          );
        })}
        <path
          d={VN_SHAPE_PATH}
          fill="none"
          stroke="var(--border-gold)"
          strokeWidth="1"
          opacity="0.55"
        />
        {/* Đảo trang trí — Hạ Long/Cát Bà theo màu vùng Miền Bắc,
            Phú Quốc & Côn Đảo theo màu vùng Miền Nam. */}
        <path
          d={HALONG_PATH}
          fill={hanoiActive ? tierByCode.HANOI.color : "#c7cfc9"}
          stroke="#fff"
          strokeWidth="0.4"
        />
        <path
          d={PHU_QUOC_PATH}
          fill={hcmActive ? tierByCode.HOCHIMINH.color : "#c7cfc9"}
          stroke="#fff"
          strokeWidth="0.4"
        />
        <path
          d={CON_DAO_PATH}
          fill={hcmActive ? tierByCode.HOCHIMINH.color : "#c7cfc9"}
          stroke="#fff"
          strokeWidth="0.4"
        />
        {PROVINCES_34.map((p) => {
          const t = tierByCode[p.tier];
          const active = t && (t.unlocked || t.isCurrent);
          return (
            <circle
              key={p.name}
              cx={p.x}
              cy={p.y}
              r={active ? 4 : 2.8}
              fill={active ? t.color : "#c7cfc9"}
              stroke="#fff"
              strokeWidth="0.7"
              className={`lj-vnmap-dot ${active ? "is-active" : ""}`}
            >
              <title>
                {p.name}
                {active ? " — đã mở khóa" : " — chưa mở khóa"}
              </title>
            </circle>
          );
        })}
      </svg>
      <div className="lj-passport-map-legend">
        {tiers.map((t) => (
          <span
            key={t.code}
            className={`lj-vnmap-legend-item ${t.unlocked || t.isCurrent ? "is-active" : ""}`}
          >
            <span
              className="lj-vnmap-legend-dot"
              style={{ background: t.color }}
            />
            {t.region}
          </span>
        ))}
      </div>
    </div>
  );
}

function PassportStrip({ isAuthenticated, loading, loyaltyProfile, onLocate }) {
  if (!isAuthenticated) {
    return (
      <div className="lj-passport-wrap">
        <div className="lj-passport-strip lj-passport-guest reveal">
          <div className="lj-passport-guest-left">
            <span className="lj-passport-guest-icon">
              <MapPin size={17} />
            </span>
            <div>
              <div className="lj-passport-label">Hộ chiếu hạng của bạn</div>
              <div className="lj-passport-guest-text">
                Đăng nhập để xem hạng hiện tại và tiến trình lên hạng tiếp theo
              </div>
            </div>
          </div>
          <Link to="/login" className="lj-btn-ghost lj-btn-sm">
            Đăng Nhập <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !loyaltyProfile) {
    return (
      <div className="lj-passport-wrap">
        <div className="lj-passport-strip reveal">
          <div className="lj-skel" style={{ width: "160px", height: "13px" }} />
          <div
            className="lj-skel"
            style={{
              width: "100%",
              maxWidth: "220px",
              height: "6px",
              marginTop: "12px",
            }}
          />
        </div>
      </div>
    );
  }

  const {
    tier,
    isMaxTier,
    amountToNext,
    progressPercent,
    nextTier,
    spend,
    tiers,
  } = loyaltyProfile;

  return (
    <div className="lj-passport-wrap">
      <div
        className="lj-passport-strip reveal"
        style={{ "--tier-color": tier.color }}
      >
        <div className="lj-passport-body">
          <div className="lj-passport-info">
            <div className="lj-passport-main">
              <div className="lj-passport-left">
                <span className="lj-passport-dot" />
                <div>
                  <div className="lj-passport-label">Hộ chiếu hạng của bạn</div>
                  <div className="lj-passport-tiername">
                    Hạng {tier.roman} · {tier.name}
                  </div>
                </div>
              </div>
              <div className="lj-passport-spend">
                Đã chi tiêu <strong>{formatPrice(spend)}</strong>
              </div>
            </div>

            {/* Dãy con dấu hộ chiếu — mỗi hạng đã ghé qua (kể cả hạng hiện
            tại) được "đóng mộc" bằng vòng tròn kép + số La Mã, cùng ngôn
            ngữ hình ảnh với .lj-seal trên timeline (cùng animation
            ljSpin, cùng font Playfair) để đồng bộ xuyên suốt trang. Hạng
            chưa mở khóa hiện dạng ô trống chờ đóng dấu (viền đứt nét mờ). */}
            <div className="lj-passport-stamps-label">
              <Compass size={10} />
              Các Chặng Đã Ghé Qua
            </div>
            <div
              className="lj-passport-stamps"
              role="list"
              aria-label="Các hạng đã ghé qua"
            >
              {tiers.map((t, i) => {
                const rotations = [-7, 5, -4, 6, -6];
                const state = t.isCurrent
                  ? "is-current"
                  : t.unlocked
                    ? "is-visited"
                    : "is-locked";
                const statusText = t.isCurrent
                  ? "hiện tại"
                  : t.unlocked
                    ? "đã ghé qua"
                    : "chưa mở khóa";
                return (
                  <span
                    key={t.code}
                    role="listitem"
                    className={`lj-stamp ${state}`}
                    style={{
                      "--stamp-color": t.color,
                      "--stamp-color-soft": t.colorSoft,
                      "--stamp-rotate": `${rotations[i % rotations.length]}deg`,
                    }}
                    title={`Hạng ${t.roman} · ${t.name} — ${statusText}`}
                  >
                    <span className="lj-stamp-dash" aria-hidden="true" />
                    <span className="lj-stamp-ring" aria-hidden="true" />
                    <span className="lj-stamp-roman">{t.roman}</span>
                    {(t.unlocked || t.isCurrent) && (
                      <span className="lj-stamp-check" aria-hidden="true">
                        <CheckCircle2 size={9} />
                      </span>
                    )}
                  </span>
                );
              })}
            </div>

            {isMaxTier ? (
              <p className="lj-passport-caption is-max">
                <CheckCircle2 size={13} />
                Hạng cao nhất — cảm ơn bạn đã đồng hành cùng Earthoria!
              </p>
            ) : (
              <>
                <div className="lj-passport-track">
                  <div
                    className="lj-passport-fill"
                    style={{
                      width: `${progressPercent}%`,
                      background: tier.color,
                    }}
                  />
                </div>
                <p className="lj-passport-caption">
                  Còn <strong>{formatPrice(amountToNext)}</strong> để đến{" "}
                  <strong>{nextTier?.name}</strong>
                </p>
              </>
            )}

            <button
              type="button"
              className="lj-passport-locate"
              onClick={() => onLocate(tier.code)}
            >
              <MapPin size={13} />
              Xem vị trí của bạn trên hành trình
            </button>
          </div>

          <PassportVietnamMap tiers={tiers} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════ SECTION SEAM (mối nối giữa các block) ════════════════════════
   Dải mảnh giữa 2 section, làm đúng 2 việc mà bạn yêu cầu cùng lúc:
   1) route line — 1 đoạn chỉ vàng đứt nét + 1 chấm, là "mắt xích" của cùng
      sợi chỉ chạy suốt trang (khớp màu với line trong Journey).
   2) chuyển màu mượt — nền là gradient từ màu section trên sang màu section
      dưới, thay vì cắt cứng giữa 2 mảng màu khác nhau. */
function SectionSeam({ variant }) {
  return (
    <div className={`lj-seam lj-seam-${variant}`} aria-hidden="true">
      <span className="lj-seam-line" />
      <span className="lj-seam-dot" />
    </div>
  );
}

/* ════════════════════════ TRACK CURVE (đoạn đường của 1 row/cap) ════════════════════════
   2 lỗi đã sửa so với bản trước:
   1) SVG là "replaced element" nên position:absolute + top:0/bottom:0 (không
      khai height) KHÔNG co giãn hết chiều cao cha như div thường — chỉ hiện
      đúng 1 đoạn ngắn rồi dừng (đây là lý do đường bị đứt đoạn trong ảnh bạn
      gửi). Sửa bằng cách bọc SVG trong 1 div thường — div đó mới là phần tử
      absolute co giãn top:0/bottom:0, còn SVG bên trong chỉ cần lấp đầy
      100%/100% của div (kích thước cha lúc này đã là số cụ thể, SVG co giãn
      100% hoàn toàn đáng tin cậy).
   2) Đổi cách vẽ "đường" cho mượt hơn: bản 3-nét-kẻ trước dễ nhìn thành 3
      đường ngoằn ngoèo rời rạc ở kích thước nhỏ. Giờ đổi thành 1 dải ruy
      băng được TÔ (fill) rất mờ — thân đường, như bóng đổ nhẹ trên bản đồ
      — cộng 1 vạch đứt nét sắc nét ở giữa (tâm vạch = tâm dải, cũng là tâm
      seal). Dải ruy băng là 1 path KÍN (đi xuống theo viền trái, vòng qua
      viền phải, đi ngược lên) nên khi lặp theo chiều dọc, biên trên/dưới
      của các tile khớp khít nhau — không có đường viền dư ở chỗ nối. */
function TrackCurve({ color, opacity = 0.55, fade }) {
  const fadeClass = fade ? ` lj-track-curve-fade-${fade}` : "";
  return (
    <div className={`lj-track-curve${fadeClass}`} aria-hidden="true">
      <svg viewBox="0 0 60 100" preserveAspectRatio="none">
        <path
          d="M23 0C37 12.5,37 37.5,23 50C9 62.5,9 87.5,23 100L37 100C23 87.5,23 62.5,37 50C51 37.5,51 12.5,37 0Z"
          fill={color}
          stroke="none"
          opacity={opacity * 0.22}
        />
        <path
          d="M30 0C44 12.5,44 37.5,30 50C16 62.5,16 87.5,30 100"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="5 6"
          opacity={opacity}
        />
      </svg>
    </div>
  );
}

/* ════════════════════════ STEP CARD ════════════════════════ */
function StepCard({ icon: Icon, index, title, desc, tag }) {
  const [ref, active] = useReveal();
  return (
    <div ref={ref} className={`lj-step-card${active ? " in" : ""}`}>
      <span className="lj-step-index">{index}</span>
      <span className="lj-step-icon">
        <Icon size={20} />
      </span>
      <h3 className="lj-step-title">{title}</h3>
      <p className="lj-step-desc">{desc}</p>
      {tag && <span className="lj-step-tag">{tag}</span>}
    </div>
  );
}

/* ════════════════════════ RANK STOP (1 tấm vé trên hành trình) ════════════════════════ */
function RankStop({
  tier,
  prevTier,
  isLast,
  index,
  loyaltyProfile,
  passengerName,
}) {
  const [ref, active] = useReveal(0.15);
  const distValue = useCountUp(tier.distanceKm, active);
  const side = index % 2 === 0 ? "left" : "right";

  const relativeSizePercent = Math.max(
    6,
    ((tier.distanceKm - DIST_MIN) / (DIST_MAX - DIST_MIN || 1)) * 100,
  );

  const currentRank = loyaltyProfile?.tier?.rank;
  const isCurrent = loyaltyProfile && loyaltyProfile.tier.code === tier.code;
  const isUnlocked = loyaltyProfile && currentRank >= tier.rank && !isCurrent;
  const isLocked = loyaltyProfile && currentRank < tier.rank;

  /* % đã "đi qua" vùng này — dựa trên chi tiêu thật, không phải % diện
     tích so với hạng khác nữa. Đã qua hẳn (isUnlocked) → 100%, tức đi
     trọn vẹn cả vùng rồi mới sang hạng mới. Chưa tới (isLocked) → 0%,
     chưa đặt chân tới. Đang ở đây (isCurrent) → đúng % tiến độ chi tiêu
     trong chính hạng này. Khách chưa đăng nhập (không có loyaltyProfile)
     → fallback về % diện tích tương đối như bản cũ, vẫn có gì đó để xem. */
  let travelPercent = relativeSizePercent;
  if (isUnlocked) {
    travelPercent = 100;
  } else if (isLocked) {
    travelPercent = 0;
  } else if (isCurrent) {
    travelPercent = loyaltyProfile.isMaxTier
      ? 100
      : Math.min(100, Math.max(0, loyaltyProfile.progressPercent));
  }

  /* Điểm đi/đến của tấm vé — chặng I luôn khởi hành từ hub EARTHORIA
     (ETR), các chặng sau nối tiếp từ chính điểm đến của chặng trước, y
     hệt 1 lịch trình bay nhiều chặng thật. */
  const from = prevTier
    ? { cityCode: prevTier.cityCode, city: prevTier.city }
    : HUB;
  const flightNo = `ETR-${String(tier.rank).padStart(3, "0")}`;
  const gate = String.fromCharCode(64 + tier.rank); // A, B, C, D, E
  const seat = `${tier.rank}${side === "left" ? "A" : "F"}`;
  const pnr = `EAR${tier.rank}${gate}${flightNo.slice(-2)}X`;

  /* Chặng khởi hành cách nhau 3g15 mỗi hạng, bắt đầu từ 05:00 — cho cảm
     giác 1 lịch trình bay cả ngày, hạng cao hơn cất cánh muộn hơn. */
  const depMinutes = 300 + (tier.rank - 1) * 195;
  const durationMinutes = Math.max(
    35,
    Math.round((tier.distanceKm / 780) * 60),
  );
  const depTime = formatClock(depMinutes);
  const arrTime = formatClock(depMinutes + durationMinutes);
  const durationLabel = formatDuration(durationMinutes);

  return (
    <div
      id={`hang-${tier.code}`}
      ref={ref}
      className={`lj-row lj-row-${side}${active ? " in" : ""}${isCurrent ? " is-current" : ""}`}
      style={{
        "--tier-color": tier.color,
        "--tier-color-soft": tier.colorSoft,
      }}
    >
      {/* Nằm ngoài .lj-row-rail (đặt trực tiếp trong .lj-row) để span đúng
          TOÀN BỘ chiều cao đã padding của row — nhờ padding trên/dưới của
          .lj-row bằng nhau (46px/46px) nên mốc y=50% của SVG này trùng khít
          với tâm .lj-row-rail, tức đúng vị trí seal, dù không nằm chung
          element. Đồng thời điểm x=22 ở y=0 và y=100 luôn khớp với biên trên/
          dưới của chính row này, nên nối liền mạch với row kề bên. */}
      <TrackCurve color="var(--tier-color)" opacity={0.55} />

      <div className="lj-row-ghost" aria-hidden="true">
        {tier.roman}
      </div>

      {/* Lấp khoảng trống bên đối diện card bằng nội dung thật thay vì chỉ
          để số La Mã mờ ảo — nhãn "Trạm X/5" + chính tagline phóng to kiểu
          pull-quote báo chí. Cùng ô lưới với ghost (grid-column theo
          .lj-row-left/.lj-row-right bên CSS) nên 2 lớp chồng lên nhau:
          ghost làm nền, waypoint làm nội dung đọc được phía trên. */}
      <div className="lj-row-waypoint">
        <span className="lj-row-waypoint-label">
          <Compass size={11} />
          Chặng {tier.rank}/5
        </span>
        <p className="lj-row-waypoint-quote">{tier.tagline}</p>
      </div>

      <div className="lj-row-rail">
        <div className="lj-seal">
          <span className="lj-seal-ring" />
          {tier.roman}
        </div>
      </div>

      {/* ═══ VÉ MÁY BAY (boarding pass) — coupon chính + cuống vé ═══ */}
      <article className="lj-ticket">
        <span className="lj-card-sheen" aria-hidden="true" />

        <div className="lj-ticket-main">
          <div className="lj-ticket-top">
            <span className="lj-ticket-brand">
              <PlaneTakeoff size={13} />
              EARTHORIA AIRLINES
            </span>
            <span className="lj-ticket-class">Hạng {tier.roman}</span>
          </div>

          {isCurrent && (
            <span className="lj-card-ribbon">
              <Plane size={11} /> Bạn đang trên chuyến bay này
            </span>
          )}
          {isUnlocked && !isLast && (
            <span className="lj-card-badge is-unlocked">
              <CheckCircle2 size={11} /> Đã bay qua
            </span>
          )}
          {(isUnlocked || (isCurrent && loyaltyProfile?.isMaxTier)) &&
            isLast && (
              <span className="lj-card-badge is-unlocked lj-card-badge-success">
                <PlaneLanding size={11} /> Thành công — Đã hạ cánh
              </span>
            )}
          {isLocked && (
            <span className="lj-card-badge is-locked">
              <Lock size={11} /> Chưa mở khóa
            </span>
          )}

          <div className="lj-ticket-route">
            <div className="lj-ticket-point">
              <span className="lj-ticket-code">{from.cityCode}</span>
              <span className="lj-ticket-city">{from.city}</span>
              <span className="lj-ticket-time">{depTime}</span>
            </div>
            <div className="lj-ticket-path" aria-hidden="true">
              <span className="lj-ticket-path-line" />
              <span className="lj-ticket-path-plane">
                <Plane size={14} />
              </span>
              <span className="lj-ticket-path-duration">{durationLabel}</span>
            </div>
            <div className="lj-ticket-point lj-ticket-point-end">
              <span className="lj-ticket-code">{tier.cityCode}</span>
              <span className="lj-ticket-city">{tier.city}</span>
              <span className="lj-ticket-time">{arrTime}</span>
            </div>
          </div>

          <h3 className="lj-card-name">
            <img
              src={tier.image}
              alt=""
              aria-hidden="true"
              className="lj-card-name-img"
            />
            {tier.name}
          </h3>
          <p className="lj-card-tagline">{tier.tagline}</p>

          <div className="lj-ticket-fields">
            <div className="lj-ticket-field">
              <span className="lj-ticket-field-label">
                <User size={10} /> Hành khách
              </span>
              <span className="lj-ticket-field-value">
                {passengerName || "Quý khách Earthoria"}
              </span>
            </div>
            <div className="lj-ticket-field">
              <span className="lj-ticket-field-label">Chuyến bay</span>
              <span className="lj-ticket-field-value">{flightNo}</span>
            </div>
            <div className="lj-ticket-field">
              <span className="lj-ticket-field-label">Cổng</span>
              <span className="lj-ticket-field-value">
                {gate}
                {tier.rank}
              </span>
            </div>
            <div className="lj-ticket-field">
              <span className="lj-ticket-field-label">Ghế</span>
              <span className="lj-ticket-field-value">{seat}</span>
            </div>
          </div>

          <div className="lj-card-divider">
            <span />
          </div>

          <div className="lj-card-area">
            <div className="lj-card-area-label">
              Quãng đường bay tượng trưng
            </div>
            <div className="lj-card-area-value">{formatArea(distValue)}</div>
            <div className="lj-card-area-track">
              <div
                className="lj-card-area-fill"
                style={{ width: active ? `${travelPercent}%` : "0%" }}
              />
            </div>
            {isUnlocked && !isLast && (
              <p className="lj-card-area-caption">
                <CheckCircle2 size={13} />
                Bạn đã hoàn thành trọn vẹn chặng bay này
              </p>
            )}
            {(isUnlocked || (isCurrent && loyaltyProfile?.isMaxTier)) &&
              isLast && (
                <p className="lj-card-area-caption is-max">
                  <PlaneLanding size={13} />
                  Thành công — bạn đã chinh phục toàn bộ hành trình Earthoria!
                </p>
              )}
            {isCurrent && loyaltyProfile.isMaxTier && !isLast && (
              <p className="lj-card-area-caption is-max">
                <CheckCircle2 size={13} />
                Hạng cao nhất — cảm ơn bạn đã đồng hành cùng Earthoria!
              </p>
            )}
            {isCurrent && !loyaltyProfile.isMaxTier && (
              <p className="lj-card-area-caption">
                Chi thêm{" "}
                <strong>{formatPrice(loyaltyProfile.amountToNext)}</strong> để
                hoàn tất chặng này, cất cánh sang{" "}
                <strong>{loyaltyProfile.nextTier?.name}</strong>
              </p>
            )}
          </div>

          <ul className="lj-card-benefits">
            <li>
              <Percent size={14} />
              {tier.discountPercent > 0 ? (
                <span>
                  Giảm <strong>{tier.discountPercent}%</strong> mỗi đơn (tối đa{" "}
                  {formatPrice(tier.maxDiscountPerOrder)})
                </span>
              ) : (
                <span>Chưa có ưu đãi giảm giá trực tiếp</span>
              )}
            </li>
            <li>
              <Truck size={14} />
              {tier.freeShipThreshold > 0 ? (
                <span>
                  Miễn phí ship cho đơn từ{" "}
                  <strong>{formatPrice(tier.freeShipThreshold)}</strong>
                </span>
              ) : (
                <span>Miễn phí vận chuyển mọi đơn hàng</span>
              )}
            </li>
          </ul>

          <div className="lj-card-unlock">
            <KeyRound size={13} />
            {tier.minSpend > 0 ? (
              <span>
                Mở khóa từ tổng chi tiêu{" "}
                <strong>{formatPrice(tier.minSpend)}</strong>
              </span>
            ) : (
              <span>Mặc định ngay khi bạn tạo tài khoản Earthoria</span>
            )}
          </div>
        </div>

        {/* ── Cuống vé (ticket stub) — tách khỏi coupon chính bằng đường
             răng cưa đục lỗ, đúng kiểu vé máy bay giấy thật. ── */}
        <div className="lj-ticket-stub">
          <div className="lj-ticket-stub-top">
            <span className="lj-ticket-stub-roman">{tier.roman}</span>
            <span className="lj-ticket-stub-region">{tier.region}</span>
          </div>
          <div className="lj-ticket-stub-mid">
            <span className="lj-ticket-stub-flight">{flightNo}</span>
            <span className="lj-ticket-stub-seat">Ghế {seat}</span>
          </div>
          <div className="lj-ticket-barcode" aria-hidden="true" />
          <span className="lj-ticket-pnr">{pnr}</span>
        </div>
      </article>
    </div>
  );
}

/* ════════════════════════ CTA CUỐI TRANG ════════════════════════ */
function FinalCta({ isAuthenticated, loyaltyProfile }) {
  let sub =
    "Tạo tài khoản miễn phí và đơn hàng đầu tiên của bạn sẽ được ghi nhận ngay vào hành trình hạng thành viên.";
  let primary = { to: "/register", label: "Đăng Ký Miễn Phí" };
  let secondary = { to: "/shop", label: "Khám Phá Cửa Hàng" };

  if (isAuthenticated && loyaltyProfile) {
    if (loyaltyProfile.isMaxTier) {
      sub =
        "Bạn đã chinh phục toàn bộ hành trình 5 hạng thành viên — cảm ơn bạn đã đồng hành cùng Earthoria.";
      primary = { to: "/shop", label: "Khám Phá Cửa Hàng" };
      secondary = { to: "/profile", label: "Xem Hồ Sơ Của Tôi" };
    } else {
      sub = `Chi thêm ${formatPrice(loyaltyProfile.amountToNext)} để bước sang ${loyaltyProfile.nextTier?.name} — chặng tiếp theo trên hành trình của bạn.`;
      primary = { to: "/shop", label: "Tiếp Tục Mua Sắm" };
      secondary = { to: "/profile", label: "Xem Hồ Sơ Của Tôi" };
    }
  }

  return (
    <section className="lj-cta">
      <div className="lj-cta-watermark">EARTHORIA</div>
      <div className="lj-cta-inner">
        <span className="lj-eyebrow reveal">Bắt Đầu Ngay Hôm Nay</span>
        <h2 className="lj-cta-title reveal">
          Sẵn Sàng Cho <em>Chặng Đầu Tiên?</em>
        </h2>
        <p className="lj-cta-sub reveal">{sub}</p>
        <div className="lj-cta-actions reveal">
          <Link to={primary.to} className="lj-btn-primary">
            {primary.label}
            <ArrowRight size={15} />
          </Link>
          <Link to={secondary.to} className="lj-btn-outline">
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
