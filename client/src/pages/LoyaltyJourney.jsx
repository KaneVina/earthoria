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
  Users,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { loyaltyService } from "../services/loyaltyService";
import { formatPrice } from "../utils/helpers";
import "../components/assets/css/loyaltyJourney.css";

const TIERS_FALLBACK = [
  {
    rank: 1,
    roman: "I",
    code: "HANOI",
    name: "Chùa Một Cột",
    emoji: "🪷",
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
    maxChildAccounts: 2,
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
    maxChildAccounts: 4,
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
    maxChildAccounts: 6,
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
    maxChildAccounts: 8,
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
    maxChildAccounts: 10,
    color: "#c0392b",
    colorSoft: "rgba(192,57,43,0.12)",
    tagline: "Đỉnh cao — chạm tới nóc nhà của Sài Gòn hoa lệ",
  },
];

const DIST_MIN = TIERS_FALLBACK[0].distanceKm;
const DIST_MAX = TIERS_FALLBACK[TIERS_FALLBACK.length - 1].distanceKm;

const formatArea = (km) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(km)} km`;
const HUB = { cityCode: "ETR", city: "Earthoria" };
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

/* COMPONENT CHÍNH  */
export default function LoyaltyJourney() {
  const { isAuthenticated, user } = useAuthStore();
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
      {/*   BREADCRUMB   */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">
          Trang chủ
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Hạng Thành Viên</span>
      </div>

      {/*   HERO   */}
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
            Năm hạng — năm vùng đất — một hành trình đi dọc Việt Nam - mỗi đơn
            hàngtiến thêm một bước trên hành trình khám phá Việt Nam.
          </p>

          <div className="lj-hero-actions">
            <button
              type="button"
              className="lj-btn-primary"
              onClick={scrollToJourney}
            >
              <PlaneTakeoff size={15} />
              Khám Phá Hành Trình
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

      {/* PASSPORT STRIP*/}
      <PassportStrip
        isAuthenticated={isAuthenticated}
        loading={profileLoading}
        loyaltyProfile={loyaltyProfile}
        onLocate={scrollToStop}
      />

      <section className="lj-journey" id="lj-journey">
        <div className="lj-journey-inner">
          <div
            className="lj-section-head reveal"
            style={{ textAlign: "center" }}
          >
            <span className="lj-eyebrow">Sổ Vé Hành Trình</span>
            <h2 className="lj-section-title">
              Năm Dấu Ấn, <em>Một Hành Trình</em>
            </h2>
            <p className="lj-section-sub">
              Từ Bắc vào Nam, mỗi lần nâng hạng là một lần bạn đặt chân đến một
              vùng đất mới. Mỗi đơn hàng hoàn tất đưa bạn tiến thêm một bước
              trên hành trình, mở ra một dấu ấn mới và những đặc quyền lớn hơn
              tại Earthoria.
            </p>
          </div>

          <div className="lj-track">
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

      {/*   STATS STRIP   */}
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
            <div className="lj-stat-label">Dấu chân hành trình</div>
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
          <div className="lj-stat-item reveal">
            <Users size={20} />
            <div className="lj-stat-value">2 → 10</div>
            <div className="lj-stat-label">Tài khoản trẻ em (E-Kid)</div>
            <div className="lj-stat-sub">
              Hạng {tiers[0]?.roman} mở {tiers[0]?.maxChildAccounts} · Hạng{" "}
              {tiers[tiers.length - 1]?.roman} mở đủ{" "}
              {tiers[tiers.length - 1]?.maxChildAccounts}
            </div>
          </div>
        </div>
      </section>

      <SectionSeam variant="stats-steps" />

      {/*   3 BƯỚC VẬN HÀNH   */}
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

      {/*   CTA CUỐI TRANG   */}
      <FinalCta
        isAuthenticated={isAuthenticated}
        loyaltyProfile={loyaltyProfile}
      />
    </>
  );
}

/*PASSPORT STRIP*/
const VN_SHAPE_PATH =
  "M 15.0,38.9 C 15.3,38.9 16.9,39.7 17.8,38.6 C 18.7,37.5 21.2,30.3 22.9,29.7 C 24.6,29.1 30.2,32.8 31.7,33.8 " +
  "C 33.2,34.8 34.4,38.0 35.6,37.8 C 36.8,37.6 40.6,33.2 41.4,32.1 C 42.2,31.0 41.8,28.6 42.5,28.9 C 43.2,29.2 " +
  "46.3,34.2 47.2,34.2 C 48.1,34.2 48.6,28.9 49.8,29.2 C 51.0,29.5 56.2,36.3 57.5,36.3 C 58.8,36.3 60.0,29.9 " +
  "60.8,28.9 C 61.6,27.9 63.7,27.9 64.1,28.1 C 64.5,28.3 64.1,30.1 64.4,30.6 C 64.7,31.1 65.9,32.2 66.8,31.9 " +
  "C 67.7,31.6 70.5,28.2 71.5,27.8 C 72.5,27.4 74.3,28.9 75.1,28.6 C 75.9,28.3 78.0,26.4 78.2,25.6 C 78.4,24.8 " +
  "76.1,22.5 76.7,21.6 C 77.3,20.7 82.0,18.3 83.2,17.9 C 84.4,17.5 86.1,18.5 86.8,18.1 C 87.5,17.7 87.9,14.6 " +
  "88.8,14.9 C 89.7,15.2 94.0,19.6 94.7,20.5 C 95.4,21.4 94.2,22.3 94.6,22.6 C 95.0,22.9 97.0,22.2 97.9,22.7 " +
  "C 98.8,23.2 100.5,26.2 101.7,26.4 C 102.9,26.6 106.8,24.4 107.9,24.5 C 109.0,24.6 110.1,27.5 111.2,27.6 C " +
  "112.3,27.7 115.3,25.4 116.8,25.6 C 118.3,25.8 123.2,27.9 123.8,28.9 C 124.4,29.9 122.1,33.6 121.5,34.2 C 120.9,34.8 " +
  "119.3,33.6 118.8,33.9 C 118.3,34.2 117.8,36.4 117.7,37.1 C 117.6,37.8 117.3,39.5 117.6,40.1 C 117.9,40.7 120.2,40.7 " +
  "120.6,41.8 C 121.0,42.9 120.4,48.6 120.6,49.4 C 120.8,50.2 121.4,48.1 122.3,48.2 C 123.2,48.3 127.6,49.6 128.4,49.9 " +
  "C 129.2,50.2 129.3,50.7 129.3,51.0 C 129.3,51.3 127.6,52.1 128.0,52.7 C 128.4,53.3 132.2,55.4 133.0,55.6 C " +
  "133.8,55.8 134.4,54.4 134.8,54.7 C 135.2,55.0 135.7,58.0 136.2,58.2 C 136.7,58.4 138.1,56.7 138.6,56.7 C 139.1,56.7 " +
  "139.3,58.5 140.4,58.5 C 141.5,58.5 146.2,56.6 147.7,56.9 C 149.2,57.2 152.8,60.4 153.1,61.0 C 153.4,61.6 150.8,62.3 " +
  "150.3,62.2 C 149.8,62.1 149.7,60.1 149.2,59.8 C 148.7,59.5 146.3,59.6 145.8,60.0 C 145.3,60.4 145.7,62.5 145.3,62.9 " +
  "C 144.9,63.3 142.7,62.7 142.3,63.0 C 141.9,63.3 142.2,65.3 142.0,65.5 C 141.8,65.7 141.1,64.4 140.4,64.4 C " +
  "139.7,64.4 136.9,64.7 136.4,65.7 C 135.9,66.7 136.7,71.7 136.0,72.7 C 135.3,73.7 131.6,74.1 130.8,74.2 C 130.0,74.3 " +
  "129.3,74.0 129.4,73.7 C 129.5,73.4 131.5,72.0 131.3,71.8 C 131.1,71.6 127.9,72.1 127.6,72.4 C 127.3,72.7 128.9,73.9 " +
  "128.5,74.0 C 128.1,74.1 124.8,72.8 124.6,72.9 C 124.4,73.0 126.6,74.9 126.6,74.9 C 126.6,74.9 124.7,73.0 124.5,73.2 " +
  "C 124.3,73.4 125.0,76.3 124.8,76.7 C 124.6,77.1 123.0,76.2 122.6,76.4 C 122.2,76.6 121.6,77.6 121.7,78.1 C " +
  "121.8,78.6 123.4,80.3 123.3,80.5 C 123.2,80.7 121.4,79.8 120.8,80.1 C 120.2,80.4 118.4,81.9 118.0,83.2 C 117.6,84.5 " +
  "118.4,90.2 117.8,91.3 C 117.2,92.4 114.0,91.7 112.8,92.5 C 111.6,93.3 109.3,97.2 108.2,98.0 C 107.1,98.8 104.5,97.3 " +
  "103.5,98.8 C 102.5,100.3 100.8,109.1 100.2,110.7 C 99.6,112.3 98.6,112.0 98.5,112.1 C 98.4,112.2 99.3,111.2 " +
  "99.6,111.4 C 99.9,111.6 101.1,112.6 100.6,113.8 C 100.1,115.0 95.7,119.8 95.6,121.4 C 95.5,123.0 98.6,125.2 " +
  "99.4,126.8 C 100.2,128.4 101.5,134.3 102.0,135.1 C 102.5,135.9 102.1,132.9 103.3,133.8 C 104.5,134.7 110.3,141.7 " +
  "111.7,142.7 C 113.1,143.7 114.1,141.7 114.7,142.2 C 115.3,142.7 116.7,145.8 116.7,146.6 C 116.7,147.4 115.2,147.8 " +
  "115.0,148.5 C 114.8,149.2 115.1,151.4 115.4,152.3 C 115.7,153.2 114.7,152.9 117.7,156.1 C 120.7,159.3 138.5,176.1 " +
  "140.8,178.7 C 143.1,181.3 136.1,177.3 137.1,178.0 C 138.1,178.7 147.8,184.0 149.0,184.8 C 150.2,185.6 147.2,185.2 " +
  "146.9,185.0 C 146.6,184.8 146.3,182.8 146.3,183.0 C 146.3,183.2 146.6,186.1 146.9,186.5 C 147.2,186.9 148.6,186.7 " +
  "148.9,186.5 C 149.2,186.3 148.7,185.0 149.0,184.8 C 149.3,184.6 151.1,184.8 151.5,185.2 C 151.9,185.6 151.5,187.7 " +
  "152.0,188.1 C 152.5,188.5 155.2,188.0 155.5,188.4 C 155.8,188.8 153.9,191.2 154.3,191.4 C 154.7,191.6 158.3,190.1 " +
  "158.6,190.1 C 158.9,190.1 156.9,191.1 156.8,191.6 C 156.7,192.1 156.5,192.9 157.6,194.6 C 158.7,196.3 165.4,204.2 " +
  "166.3,205.7 C 167.2,207.2 164.7,206.5 165.2,206.7 C 165.7,206.9 169.3,207.0 170.2,207.6 C 171.1,208.2 172.7,211.0 " +
  "172.9,211.8 C 173.1,212.6 172.3,213.8 171.9,214.1 C 171.5,214.4 169.6,214.4 169.6,214.4 C 169.6,214.4 171.1,213.2 " +
  "171.9,214.4 C 172.7,215.6 175.7,223.2 176.1,224.8 C 176.5,226.4 175.0,225.7 175.6,228.0 C 176.2,230.3 180.5,241.9 " +
  "181.1,244.3 C 181.7,246.7 181.1,247.7 181.0,247.7 C 180.9,247.7 180.2,244.3 180.0,244.3 C 179.8,244.3 179.1,246.9 " +
  "179.2,248.0 C 179.3,249.1 180.9,253.0 180.9,253.3 C 180.9,253.6 178.8,250.7 178.9,250.9 C 179.0,251.1 181.8,254.2 " +
  "182.0,254.8 C 182.2,255.4 180.8,256.2 180.5,256.1 C 180.2,256.0 180.1,254.1 179.9,254.1 C 179.7,254.1 179.1,256.0 " +
  "179.2,256.4 C 179.3,256.8 181.0,256.9 181.1,257.2 C 181.2,257.5 179.9,258.9 180.0,259.2 C 180.1,259.5 181.5,259.4 " +
  "181.6,259.8 C 181.7,260.2 180.8,261.7 181.1,262.6 C 181.4,263.5 183.7,266.3 183.9,266.9 C 184.1,267.5 182.6,267.4 " +
  "182.7,267.5 C 182.8,267.6 184.9,267.8 184.9,268.1 C 184.9,268.4 182.6,269.6 182.6,270.4 C 182.6,271.2 184.8,273.8 " +
  "185.0,274.5 C 185.2,275.2 184.5,276.7 184.3,276.6 C 184.1,276.5 183.9,274.0 183.6,273.7 C 183.3,273.4 182.0,274.3 " +
  "181.9,274.2 C 181.8,274.1 183.1,273.5 183.1,273.1 C 183.1,272.7 182.8,270.6 182.3,270.8 C 181.8,271.0 178.7,273.7 " +
  "178.7,274.9 C 178.7,276.1 182.0,280.6 181.9,281.2 C 181.8,281.8 177.7,279.6 177.5,279.8 C 177.3,280.0 179.7,282.0 " +
  "179.9,282.8 C 180.1,283.6 179.8,286.3 179.5,286.8 C 179.2,287.3 177.6,286.4 177.8,287.2 C 178.0,288.0 180.7,292.4 " +
  "180.8,293.1 C 180.9,293.8 179.3,293.4 179.0,293.1 C 178.7,292.8 178.5,290.2 178.3,290.3 C 178.1,290.4 177.0,293.9 " +
  "177.0,294.2 C 177.0,294.5 178.4,292.9 178.7,293.2 C 179.0,293.5 179.9,295.8 179.7,296.7 C 179.5,297.6 178.0,300.2 " +
  "177.3,300.7 C 176.6,301.2 174.5,300.6 174.2,301.2 C 173.9,301.8 175.2,305.0 174.6,305.7 C 174.0,306.4 170.2,306.2 " +
  "169.3,306.8 C 168.4,307.4 168.2,309.9 167.5,310.4 C 166.8,310.9 164.5,309.9 163.3,310.6 C 162.1,311.3 159.1,315.7 " +
  "157.9,316.4 C 156.7,317.1 153.8,315.8 153.0,316.4 C 152.2,317.0 151.6,321.0 150.9,321.6 C 150.2,322.2 149.2,320.6 " +
  "147.1,321.5 C 145.0,322.4 135.6,328.5 133.7,329.3 C 131.8,330.1 132.0,327.8 131.5,328.0 C 131.0,328.2 130.1,330.6 " +
  "129.8,330.8 C 129.5,331.0 128.9,329.6 129.1,329.3 C 129.3,329.0 131.4,328.6 131.3,328.3 C 131.2,328.0 128.9,327.6 " +
  "128.4,327.2 C 127.9,326.8 127.7,324.6 127.5,324.6 C 127.3,324.6 127.1,327.2 126.9,327.3 C 126.7,327.4 125.9,325.1 " +
  "125.9,325.3 C 125.9,325.5 127.3,328.2 127.2,328.7 C 127.1,329.2 125.2,329.7 124.9,329.4 C 124.6,329.1 124.9,326.6 " +
  "124.9,326.5 C 124.9,326.4 124.9,328.4 124.6,328.6 C 124.3,328.8 122.2,327.9 122.0,328.3 C 121.8,328.7 122.7,331.3 " +
  "122.6,331.7 C 122.5,332.1 120.8,331.6 120.8,331.8 C 120.8,332.0 122.8,333.0 122.7,333.1 C 122.6,333.2 120.3,332.5 " +
  "120.3,332.7 C 120.3,332.9 122.6,334.3 122.9,334.8 C 123.2,335.3 122.9,336.0 122.5,336.5 C 122.1,337.0 120.3,339.1 " +
  "119.4,339.2 C 118.5,339.3 114.9,337.6 115.0,337.7 C 115.1,337.8 119.4,339.6 120.0,340.2 C 120.6,340.8 120.4,342.4 " +
  "119.9,342.6 C 119.4,342.8 116.3,342.1 115.7,341.7 C 115.1,341.3 114.2,338.8 114.5,339.3 C 114.8,339.8 117.9,344.6 " +
  "118.1,345.8 C 118.3,347.0 116.8,348.7 116.2,349.2 C 115.6,349.7 114.4,350.3 113.2,349.8 C 112.0,349.3 107.2,345.6 " +
  "106.6,345.0 C 106.0,344.4 108.4,345.1 108.0,344.5 C 107.6,343.9 103.3,339.8 103.0,339.8 C 102.7,339.8 104.7,343.3 " +
  "105.7,344.4 C 106.7,345.5 111.0,347.9 111.5,348.7 C 112.0,349.5 110.5,350.7 110.2,350.8 C 109.9,350.9 109.2,349.4 " +
  "109.1,349.7 C 109.0,350.0 110.8,352.3 109.0,353.5 C 107.2,354.7 96.5,358.1 93.9,359.9 C 91.3,361.7 89.1,366.7 " +
  "87.5,368.2 C 85.9,369.7 81.7,372.0 80.4,372.6 C 79.1,373.2 77.6,373.2 76.9,373.1 C 76.2,373.0 74.7,371.7 74.7,371.5 " +
  "C 74.7,371.3 76.8,371.3 77.0,371.1 C 77.2,370.9 76.2,369.9 76.5,369.5 C 76.8,369.1 79.1,367.8 79.1,367.5 C " +
  "79.1,367.2 76.3,370.3 76.3,367.3 C 76.3,364.3 78.1,345.4 79.0,342.1 C 79.9,338.8 83.6,340.4 83.9,339.7 C 84.2,339.0 " +
  "81.8,336.5 81.2,336.1 C 80.6,335.7 79.4,336.8 78.7,336.4 C 78.0,336.0 76.3,333.2 75.5,333.0 C 74.7,332.8 73.0,335.6 " +
  "72.1,335.0 C 71.2,334.4 68.6,329.0 68.3,328.3 C 68.0,327.6 69.6,329.1 70.0,328.8 C 70.4,328.5 70.8,326.0 71.8,325.7 " +
  "C 72.8,325.4 76.9,326.5 78.3,325.9 C 79.7,325.3 83.2,322.2 83.6,321.1 C 84.0,320.0 82.0,317.6 82.0,316.9 C " +
  "82.0,316.2 83.9,315.3 84.0,315.3 C 84.1,315.3 82.4,316.2 83.0,316.5 C 83.6,316.8 88.2,318.3 89.2,318.1 C 90.2,317.9 " +
  "90.2,315.5 91.4,315.0 C 92.6,314.5 98.2,313.3 99.4,313.6 C 100.6,313.9 100.7,317.1 101.1,317.7 C 101.5,318.3 " +
  "102.8,318.4 103.1,318.2 C 103.4,318.0 102.6,316.2 103.3,316.3 C 104.0,316.4 108.5,319.4 109.0,319.4 C 109.5,319.4 " +
  "107.8,317.2 107.8,316.4 C 107.8,315.6 109.7,314.2 108.9,313.1 C 108.1,312.0 102.2,308.6 101.4,307.5 C 100.6,306.4 " +
  "102.4,304.7 102.3,303.7 C 102.2,302.7 100.2,300.1 100.2,299.4 C 100.2,298.7 101.5,298.1 101.9,298.0 C 102.3,297.9 " +
  "103.1,299.1 103.5,298.8 C 103.9,298.5 103.7,295.7 105.1,295.6 C 106.5,295.5 114.0,298.7 115.1,298.1 C 116.2,297.5 " +
  "113.4,291.7 114.1,290.8 C 114.8,289.9 120.2,291.2 121.3,290.9 C 122.4,290.6 122.2,288.5 123.0,288.2 C 123.8,287.9 " +
  "126.6,288.6 127.7,288.0 C 128.8,287.4 131.2,283.7 132.2,283.0 C 133.2,282.3 135.2,281.9 135.8,282.1 C 136.4,282.3 " +
  "136.9,284.4 137.5,284.4 C 138.1,284.4 139.9,283.0 140.4,281.7 C 140.9,280.4 141.5,275.4 141.3,273.7 C 141.1,272.0 " +
  "139.0,269.3 139.1,267.3 C 139.2,265.3 142.0,258.9 142.4,257.2 C 142.8,255.5 142.6,254.5 142.1,253.3 C 141.6,252.1 " +
  "138.8,248.2 138.3,246.8 C 137.8,245.4 138.4,242.5 138.1,241.9 C 137.8,241.3 136.4,241.8 136.1,241.5 C 135.8,241.2 " +
  "135.0,240.9 135.6,239.1 C 136.2,237.3 140.3,228.8 140.8,226.8 C 141.3,224.8 139.5,223.4 139.6,222.7 C 139.7,222.0 " +
  "141.6,221.3 141.5,220.7 C 141.4,220.1 138.6,218.0 138.7,217.5 C 138.8,217.0 141.9,217.6 142.3,216.4 C 142.7,215.2 " +
  "143.0,209.0 142.3,207.7 C 141.6,206.4 137.8,206.6 136.7,205.7 C 135.6,204.8 133.3,200.8 132.8,199.8 C 132.3,198.8 " +
  "132.3,198.0 132.9,197.5 C 133.5,197.0 136.8,196.3 137.4,195.6 C 138.0,194.9 138.5,191.8 138.3,191.4 C 138.1,191.0 " +
  "136.3,192.4 135.5,192.2 C 134.7,192.0 132.2,190.2 131.5,189.5 C 130.8,188.8 130.4,186.4 129.9,186.0 C 129.4,185.6 " +
  "127.8,186.9 127.2,186.2 C 126.6,185.5 125.2,180.7 124.6,180.4 C 124.0,180.1 122.3,183.3 121.8,183.6 C 121.3,183.9 " +
  "120.5,183.1 120.3,182.6 C 120.1,182.1 120.4,180.1 120.1,179.4 C 119.8,178.7 117.7,177.9 117.4,176.7 C 117.1,175.5 " +
  "117.6,170.1 117.3,169.2 C 117.0,168.3 115.5,170.3 114.8,169.5 C 114.1,168.7 112.1,162.9 111.6,162.2 C 111.1,161.5 " +
  "110.8,163.5 110.4,163.5 C 110.0,163.5 109.4,163.1 108.0,161.9 C 106.6,160.7 100.3,154.8 98.8,153.2 C 97.3,151.6 " +
  "95.8,149.1 95.5,148.2 C 95.2,147.3 96.6,146.3 96.3,145.4 C 96.0,144.5 93.6,140.8 92.8,140.3 C 92.0,139.8 90.4,141.5 " +
  "89.9,141.3 C 89.4,141.1 89.5,139.3 89.0,138.8 C 88.5,138.3 86.2,137.8 85.6,137.3 C 85.0,136.8 83.7,135.3 83.7,134.4 " +
  "C 83.7,133.5 85.8,130.5 85.9,129.7 C 86.0,128.9 85.8,128.4 84.5,127.9 C 83.2,127.4 78.0,127.3 75.3,125.9 C " +
  "72.6,124.5 64.7,117.7 62.3,116.2 C 59.9,114.7 55.4,114.6 55.2,113.7 C 55.0,112.8 60.4,110.0 60.9,108.9 C 61.4,107.8 " +
  "58.9,105.1 59.7,104.5 C 60.5,103.9 66.3,103.8 67.7,104.0 C 69.1,104.2 69.9,106.6 71.1,106.3 C 72.3,106.0 76.6,102.8 " +
  "77.4,101.9 C 78.2,101.0 77.2,99.6 77.7,98.7 C 78.2,97.8 81.8,95.5 81.2,94.6 C 80.6,93.7 73.5,91.8 72.4,91.0 " +
  "C 71.3,90.2 72.1,88.6 72.4,88.1 C 72.7,87.6 74.7,87.3 74.8,87.0 C 74.9,86.7 74.2,85.3 73.5,85.4 C 72.8,85.5 " +
  "69.9,87.8 69.1,87.9 C 68.3,88.0 66.4,87.1 66.9,86.2 C 67.4,85.3 72.7,81.5 73.0,80.7 C 73.3,79.9 70.7,80.4 " +
  "69.7,79.7 C 68.7,79.0 66.0,75.4 64.9,74.6 C 63.8,73.8 61.9,73.1 60.6,73.3 C 59.3,73.5 55.0,75.1 53.8,76.0 " +
  "C 52.6,76.9 51.8,80.8 50.8,80.9 C 49.8,81.0 46.5,77.3 45.7,76.9 C 44.9,76.5 44.9,78.1 43.9,77.9 C 42.9,77.7 " +
  "38.8,76.5 37.5,75.2 C 36.2,73.9 33.7,68.2 32.8,67.1 C 31.9,66.0 30.4,66.5 30.4,66.3 C 30.4,66.1 32.1,65.9 " +
  "32.5,65.3 C 32.9,64.7 33.6,62.1 33.5,61.7 C 33.4,61.3 31.7,62.7 31.8,62.3 C 31.9,61.9 34.4,59.4 34.7,58.5 " +
  "C 35.0,57.6 34.6,55.0 34.3,54.7 C 34.0,54.4 32.5,56.0 32.1,55.7 C 31.7,55.4 31.2,52.4 31.0,52.3 C 30.8,52.2 " +
  "31.2,54.3 30.8,54.9 C 30.4,55.5 27.9,57.4 27.3,56.9 C 26.7,56.4 27.4,52.7 25.9,50.5 C 24.4,48.3 16.3,40.3 " +
  "15.0,38.9 C 13.7,37.5 14.7,38.9 15.0,38.9 Z";

const HALONG_PATH =
  "M 126.7,75.9 C 126.7,75.9 126.7,75.5 126.7,75.6 C 126.7,75.7 126.8,76.3 126.9,76.4 C 127.0,76.5 127.3,76.1 " +
  "127.4,76.1 C 127.5,76.1 127.4,76.4 127.4,76.4 C 127.4,76.4 127.6,76.0 127.7,76.0 C 127.8,76.0 128.2,76.6 128.2,76.6 " +
  "C 128.2,76.6 128.0,76.1 128.0,76.0 C 128.0,75.9 128.5,75.9 128.6,76.0 C 128.7,76.1 128.9,77.1 128.9,77.2 C " +
  "128.9,77.3 129.0,76.7 129.0,76.7 C 129.0,76.7 129.2,77.2 129.3,77.2 C 129.4,77.2 129.5,76.9 129.6,76.9 C 129.7,76.9 " +
  "130.2,77.3 130.2,77.4 C 130.2,77.5 129.6,77.3 129.6,77.4 C 129.6,77.5 130.2,78.0 130.2,78.1 C 130.2,78.2 129.8,78.1 " +
  "129.8,78.1 C 129.8,78.1 129.8,77.8 129.8,77.8 C 129.8,77.8 129.8,78.1 129.7,78.0 C 129.6,77.9 129.1,77.0 129.1,77.0 " +
  "C 129.1,77.0 129.5,77.8 129.5,77.9 C 129.5,78.0 129.1,77.9 129.1,77.9 C 129.1,77.9 129.1,78.0 129.1,78.0 C " +
  "129.1,78.0 129.3,77.9 129.3,77.9 C 129.3,77.9 129.5,78.0 129.5,78.0 C 129.5,78.0 129.3,78.2 129.3,78.2 C 129.3,78.2 " +
  "129.4,78.0 129.4,78.0 C 129.4,78.0 129.2,78.0 129.2,78.0 C 129.2,78.0 129.2,78.1 129.2,78.1 C 129.2,78.1 128.9,78.0 " +
  "128.9,78.0 C 128.9,78.0 128.8,78.3 128.8,78.3 C 128.8,78.3 129.2,78.4 129.2,78.4 C 129.2,78.4 129.0,78.5 128.9,78.4 " +
  "C 128.8,78.3 128.6,77.8 128.6,77.8 C 128.6,77.8 128.9,78.7 129.0,78.8 C 129.1,78.9 129.1,78.7 129.2,78.7 C " +
  "129.3,78.7 129.5,78.8 129.5,78.8 C 129.5,78.8 129.3,79.1 129.3,79.1 C 129.3,79.1 129.3,78.9 129.3,78.9 C 129.3,78.9 " +
  "129.1,78.7 129.1,78.8 C 129.1,78.9 129.0,79.6 129.0,79.6 C 129.0,79.6 128.7,79.2 128.7,79.2 C 128.7,79.2 128.7,79.5 " +
  "128.6,79.5 C 128.5,79.5 128.2,79.4 128.2,79.3 C 128.2,79.2 128.3,78.9 128.2,78.8 C 128.1,78.7 127.7,78.7 127.7,78.8 " +
  "C 127.7,78.9 127.9,79.4 127.8,79.3 C 127.7,79.2 126.9,77.9 126.7,77.7 C 126.5,77.5 126.0,77.7 125.9,77.6 C " +
  "125.8,77.5 125.7,77.2 125.8,77.1 C 125.9,77.0 126.5,77.0 126.5,76.9 C 126.5,76.8 126.1,76.6 126.1,76.5 C 126.1,76.4 " +
  "126.4,76.4 126.5,76.4 C 126.6,76.4 126.6,76.9 126.6,76.8 C 126.6,76.7 126.7,76.0 126.7,75.9 C 126.7,75.8 126.7,75.9 " +
  "126.7,75.9 Z";

const PHU_QUOC_PATH =
  "M 60.0,329.5 C 60.0,329.9 60.2,331.8 60.0,332.6 C 59.8,333.4 58.6,336.0 58.5,336.5 C 58.4,337.0 59.1,336.6 " +
  "59.1,336.8 C 59.1,337.0 58.8,337.6 58.8,337.8 C 58.8,338.0 59.3,338.4 59.3,338.4 C 59.3,338.4 58.7,338.1 58.6,338.1 " +
  "C 58.5,338.1 58.5,338.4 58.4,338.3 C 58.3,338.2 58.1,338.0 57.9,337.3 C 57.7,336.6 57.1,333.3 56.9,332.6 C " +
  "56.7,331.9 56.3,331.7 56.1,331.5 C 55.9,331.3 55.1,331.4 54.9,331.2 C 54.7,331.0 54.3,329.9 54.2,329.7 C 54.1,329.5 " +
  "54.1,329.4 54.4,329.4 C 54.7,329.4 56.1,329.9 56.4,329.8 C 56.7,329.7 56.8,328.9 56.9,328.8 C 57.0,328.7 57.2,328.7 " +
  "57.3,328.6 C 57.4,328.5 57.4,328.0 57.5,327.9 C 57.6,327.8 57.7,327.4 58.0,327.6 C 58.3,327.8 59.8,329.3 60.0,329.5 " +
  "C 60.2,329.7 60.0,329.1 60.0,329.5 Z";

const CON_DAO_PATH =
  "M 119.0,368.9 C 119.1,368.8 119.7,368.4 119.8,368.4 C 119.9,368.4 120.1,368.6 120.1,368.6 C 120.1,368.6 119.8,368.5 " +
  "119.8,368.6 C 119.8,368.7 120.0,369.0 120.0,369.1 C 120.0,369.2 119.4,369.4 119.4,369.5 C 119.4,369.6 119.9,370.1 " +
  "119.9,370.1 C 119.9,370.1 119.6,369.9 119.4,369.9 C 119.2,369.9 118.7,370.2 118.6,370.4 C 118.5,370.6 118.9,371.3 " +
  "118.8,371.4 C 118.7,371.5 118.2,371.3 118.0,371.2 C 117.8,371.1 117.4,370.8 117.5,370.5 C 117.6,370.2 118.8,369.1 " +
  "119.0,368.9 C 119.2,368.7 118.9,369.0 119.0,368.9 Z";

const TIER_BAND_Y = {
  HANOI: [0, 95],
  HUE: [95, 190],
  DANANG: [190, 258],
  NHATRANG: [258, 305],
  HOCHIMINH: [305, 388],
};

const PROVINCES_34 = [
  // Miền Bắc — Hạng I (Chùa Một Cột)
  { name: "Điện Biên", x: 35.3, y: 63.3, tier: "HANOI" },
  { name: "Lai Châu", x: 45.8, y: 39.1, tier: "HANOI" },
  { name: "Lào Cai", x: 67.4, y: 46.1, tier: "HANOI" },
  { name: "Sơn La", x: 56.0, y: 64.7, tier: "HANOI" },
  { name: "Tuyên Quang", x: 83.7, y: 41.3, tier: "HANOI" },
  { name: "Cao Bằng", x: 110.6, y: 32.3, tier: "HANOI" },
  { name: "Lạng Sơn", x: 122.2, y: 52.2, tier: "HANOI" },
  { name: "Thái Nguyên", x: 100.9, y: 52.2, tier: "HANOI" },
  { name: "Phú Thọ", x: 91.8, y: 69.1, tier: "HANOI" },
  { name: "Quảng Ninh", x: 129.7, y: 73.9, tier: "HANOI" },
  { name: "Hải Phòng", x: 116.2, y: 75.1, tier: "HANOI" },
  { name: "Bắc Ninh", x: 107.8, y: 67.1, tier: "HANOI" },
  { name: "Hà Nội", x: 101.1, y: 72.0, tier: "HANOI" },
  { name: "Hưng Yên", x: 109.2, y: 83.6, tier: "HANOI" },
  { name: "Ninh Bình", x: 105.0, y: 87.2, tier: "HANOI" },
  // Bắc Trung Bộ — Hạng II (Cố Đô Huế)
  { name: "Thanh Hóa", x: 99.5, y: 101.5, tier: "HUE" },
  { name: "Nghệ An", x: 97.4, y: 128.8, tier: "HUE" },
  { name: "Hà Tĩnh", x: 102.3, y: 137.0, tier: "HUE" },
  { name: "Quảng Trị", x: 124.3, y: 165.7, tier: "HUE" },
  { name: "TP Huế", x: 141.5, y: 182.4, tier: "HUE" },
  // Trung Bộ — Hạng III (Cầu Rồng)
  { name: "Đà Nẵng", x: 159.2, y: 198.3, tier: "DANANG" },
  { name: "Quảng Ngãi", x: 160.3, y: 224.9, tier: "DANANG" },
  { name: "Gia Lai", x: 165.0, y: 245.0, tier: "DANANG" },
  // Nam Trung Bộ — Hạng IV (Tháp Bà Ponagar)
  { name: "Đắk Lắk", x: 167.3, y: 268.4, tier: "NHATRANG" },
  { name: "Khánh Hòa", x: 176.6, y: 292.6, tier: "NHATRANG" },
  { name: "Lâm Đồng", x: 151.0, y: 299.8, tier: "NHATRANG" },
  // Miền Nam — Hạng V (Landmark 81)
  { name: "Tây Ninh", x: 110.4, y: 316.8, tier: "HOCHIMINH" },
  { name: "Đồng Nai", x: 124.6, y: 308.5, tier: "HOCHIMINH" },
  { name: "TP.HCM", x: 123.2, y: 321.6, tier: "HOCHIMINH" },
  { name: "An Giang", x: 87.2, y: 333.7, tier: "HOCHIMINH" },
  { name: "Đồng Tháp", x: 104.6, y: 328.8, tier: "HOCHIMINH" },
  { name: "Cần Thơ", x: 98.5, y: 343.3, tier: "HOCHIMINH" },
  { name: "Vĩnh Long", x: 109.9, y: 335.1, tier: "HOCHIMINH" },
  { name: "Cà Mau", x: 91.6, y: 357.1, tier: "HOCHIMINH" },
];

const SEA_INSETS = [
  {
    name: "Hoàng Sa",
    tier: "DANANG", // Trực thuộc TP Đà Nẵng
    box: { x: 196, y: 178, w: 30, h: 30 },
    leaderFrom: { x: 159.2, y: 198.3 }, // Đà Nẵng
    dots: [
      { x: 207, y: 200.6 },
      { x: 216.8, y: 187.6 },
      { x: 210.9, y: 191.9 },
      { x: 214.3, y: 199.4 },
    ],
  },
  {
    name: "Trường Sa",
    tier: "NHATRANG", // Trực thuộc tỉnh Khánh Hòa
    box: { x: 196, y: 268, w: 32, h: 34 },
    leaderFrom: { x: 176.6, y: 292.6 }, // Khánh Hòa
    dots: [
      { x: 222.9, y: 296.6 },
      { x: 201.4, y: 274.2 },
      { x: 220.1, y: 291.1 },
      { x: 216.1, y: 280.0 },
      { x: 214.5, y: 287.8 },
      { x: 213.9, y: 276.1 },
    ],
  },
];

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
        viewBox="0 0 230 388"
        className="lj-vnmap-svg"
        role="img"
        aria-label="Bản đồ 34 tỉnh thành Việt Nam theo vùng hạng thành viên, kèm Hoàng Sa và Trường Sa"
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
        {SEA_INSETS.map((inset) => {
          const t = tierByCode[inset.tier];
          const active = t && (t.unlocked || t.isCurrent);
          const color = active ? t.color : "#9aa39c";
          return (
            <g
              key={inset.name}
              className={`lj-vnmap-sea ${active ? "is-active" : ""}`}
            >
              {inset.dots.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r="1.6" fill={color} />
              ))}
              <title>
                {`Quần đảo ${inset.name}`}
                {active ? " — đã mở khóa" : " — chưa mở khóa"}
              </title>
            </g>
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
              <div className="lj-passport-label">
                Hộ chiếu hành trình của bạn
              </div>
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
                  <div className="lj-passport-label">
                    Hộ chiếu hành trình của bạn
                  </div>
                  <div className="lj-passport-tiername">
                    Hạng {tier.roman} · {tier.name}
                  </div>
                </div>
              </div>
              <div className="lj-passport-spend">
                Đã chi tiêu <strong>{formatPrice(spend)}</strong>
              </div>
            </div>

            <div className="lj-passport-stamps-label">
              <Compass size={10} />
              Các Chặng Đã Ghé Qua
            </div>
            <div className="lj-passport-stamps-row">
              <div
                className="lj-passport-stamps"
                role="list"
                aria-label="Các hạng đã ghé qua"
              >
                {tiers.map((t) => {
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
                      }}
                      title={`Hạng ${t.roman} · ${t.name} — ${statusText}`}
                    >
                      <span className="lj-stamp-ring" aria-hidden="true" />
                      <span className="lj-stamp-imgwrap">
                        <img
                          src={t.image}
                          alt=""
                          className="lj-stamp-img"
                          aria-hidden="true"
                        />
                      </span>
                      {(t.unlocked || t.isCurrent) && (
                        <span className="lj-stamp-check" aria-hidden="true">
                          <CheckCircle2 size={9} />
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              <button
                type="button"
                className="lj-passport-locate"
                onClick={() => onLocate(tier.code)}
              >
                <MapPin size={13} />
                Xem vị trí của bạn trên hành trình
              </button>
            </div>

            <div
              className="lj-passport-hero"
              style={{
                "--tier-color": tier.color,
                "--tier-color-soft": tier.colorSoft,
              }}
            >
              <img
                src={tier.image}
                alt={tier.name}
                className="lj-passport-hero-img"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextSibling.style.display = "flex";
                }}
              />
              <span
                className="lj-passport-hero-img-fallback"
                style={{ display: "none" }}
              >
                {tier.roman}
              </span>
              <div className="lj-passport-hero-info">
                <div className="lj-passport-hero-name">
                  Hạng {tier.roman} · {tier.name}
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
              </div>
            </div>
          </div>

          <PassportVietnamMap tiers={tiers} />
        </div>
      </div>
    </div>
  );
}

/* SECTION SEAM  */
function SectionSeam({ variant }) {
  return (
    <div className={`lj-seam lj-seam-${variant}`} aria-hidden="true">
      <span className="lj-seam-line" />
      <span className="lj-seam-dot" />
    </div>
  );
}

/*RACK CURVE  */
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

/*STEP CARD */
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

/* RANK STOP (1 tấm vé trên hành trình)          */
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
  // Hạng liền kề ngay phía trên hạng hiện tại — "sắp mở khóa" (gần trong tầm
  // tay) thay vì "chưa mở khóa" chung chung như các hạng còn xa phía sau.
  const isNextUp = isLocked && loyaltyProfile?.nextTier?.code === tier.code;
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

  const from = prevTier
    ? { cityCode: prevTier.cityCode, city: prevTier.city }
    : HUB;
  const flightNo = `ETR-${String(tier.rank).padStart(3, "0")}`;
  const gate = String.fromCharCode(64 + tier.rank); // A, B, C, D, E
  const seat = `${tier.rank}${side === "left" ? "A" : "F"}`;
  const pnr = `EAR${tier.rank}${gate}${flightNo.slice(-2)}X`;
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
      <TrackCurve color="var(--tier-color)" opacity={0.55} />

      <div className="lj-row-ghost" aria-hidden="true">
        {tier.roman}
      </div>
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

      {/*   VÉ MÁY BAY (boarding pass)   */}
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
            <span className={`lj-card-badge ${isNextUp ? "is-upcoming" : "is-locked"}`}>
              {isNextUp ? (
                <>
                  <Sparkles size={11} /> Sắp mở khóa
                </>
              ) : (
                <>
                  <Lock size={11} /> Chưa mở khóa
                </>
              )}
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
              className="lj-card-name-icon"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextSibling.style.display = "inline";
              }}
            />
            <span
              className="lj-card-name-emoji"
              aria-hidden="true"
              style={{ display: "none" }}
            >
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
            <div className="lj-card-area-label">Dấu chân hành trình</div>
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
            <li>
              <Users size={14} />
              <span>
                Mở khóa tối đa <strong>{tier.maxChildAccounts}</strong> tài khoản trẻ em (E-Kid)
              </span>
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

/*          CTA CUỐI TRANG          */
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