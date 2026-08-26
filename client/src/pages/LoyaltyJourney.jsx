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
   DỮ LIỆU 5 HẠNG — mirror 1:1 từ server/src/utils/loyaltyTier.js
   (LOYALTY_TIERS). Dùng làm placeholderData cho query /loyalty/tiers
   để trang render đẹp ngay lập tức, rồi tự đối chiếu lại với API.
   Mỗi hạng giờ là 1 CHẶNG BAY tới 1 công trình biểu tượng Việt Nam,
   trình bày dưới dạng vé máy bay (boarding pass) trên hành trình.
───────────────────────────────────────────────────────────── */
const TIERS_FALLBACK = [
  {
    rank: 1,
    roman: "I",
    code: "HANOI",
    name: "Chùa Một Cột",
    emoji: "🪷",
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
    name: "Cố Đô Huế – Đại Nội",
    emoji: "🏯",
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
    emoji: "🐉",
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
    emoji: "🏛️",
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
    emoji: "🏙️",
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
            Năm hạng thành viên, năm tấm vé đến những công trình biểu tượng
            của Việt Nam — mỗi đơn hàng bạn hoàn tất đưa bạn cất cánh gần
            hơn một chặng, đến khi chạm đỉnh Landmark 81.
          </p>

          <div className="lj-hero-actions">
            <button type="button" className="lj-btn-primary" onClick={scrollToJourney}>
              <PlaneTakeoff size={15} />
              Khám Phá 5 Chặng Bay
            </button>
            {!isAuthenticated && (
              <Link to="/login" className="lj-btn-ghost">
                Đăng Nhập Để Bắt Đầu
              </Link>
            )}
          </div>

          <button type="button" className="lj-scroll-cue" onClick={scrollToJourney}>
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
          <div className="lj-section-head reveal" style={{ textAlign: "center" }}>
            <span className="lj-eyebrow">Sổ Vé Hành Trình</span>
            <h2 className="lj-section-title">
              Năm Tấm Vé, <em>Một Hành Trình</em>
            </h2>
            <p className="lj-section-sub">
              Từ Earthoria đến đỉnh Landmark 81 — mỗi hạng là một tấm vé máy
              bay tới một công trình biểu tượng có thật của Việt Nam, được
              kể lại thành hành trình thành viên của riêng bạn.
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
            công. Hạng thành viên không bao giờ bị hạ — chỉ tăng dần theo
            tổng chi tiêu trọn đời của bạn tại Earthoria.
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
              Tối đa {formatPrice(tiers[tiers.length - 1]?.maxDiscountPerOrder)}/đơn
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
            style={{ width: "100%", maxWidth: "220px", height: "6px", marginTop: "12px" }}
          />
        </div>
      </div>
    );
  }

  const { tier, isMaxTier, amountToNext, progressPercent, nextTier, spend } =
    loyaltyProfile;

  return (
    <div className="lj-passport-wrap">
      <div className="lj-passport-strip reveal" style={{ "--tier-color": tier.color }}>
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
                style={{ width: `${progressPercent}%`, background: tier.color }}
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
function RankStop({ tier, prevTier, isLast, index, loyaltyProfile, passengerName }) {
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

  return (
    <div
      id={`hang-${tier.code}`}
      ref={ref}
      className={`lj-row lj-row-${side}${active ? " in" : ""}${isCurrent ? " is-current" : ""}`}
      style={{ "--tier-color": tier.color, "--tier-color-soft": tier.colorSoft }}
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
          {(isUnlocked || (isCurrent && loyaltyProfile?.isMaxTier)) && isLast && (
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
            </div>
            <div className="lj-ticket-path" aria-hidden="true">
              <span className="lj-ticket-path-line" />
              <span className="lj-ticket-path-plane">
                <Plane size={14} />
              </span>
            </div>
            <div className="lj-ticket-point lj-ticket-point-end">
              <span className="lj-ticket-code">{tier.cityCode}</span>
              <span className="lj-ticket-city">{tier.city}</span>
            </div>
          </div>

          <h3 className="lj-card-name">
            <span className="lj-card-name-emoji" aria-hidden="true">
              {tier.emoji}
            </span>
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
              <span className="lj-ticket-field-value">{gate}{tier.rank}</span>
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
            <div className="lj-card-area-label">Quãng đường bay tượng trưng</div>
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
            {(isUnlocked || (isCurrent && loyaltyProfile?.isMaxTier)) && isLast && (
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
                Chi thêm <strong>{formatPrice(loyaltyProfile.amountToNext)}</strong>{" "}
                để hoàn tất chặng này, cất cánh sang{" "}
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
                Mở khóa từ tổng chi tiêu <strong>{formatPrice(tier.minSpend)}</strong>
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