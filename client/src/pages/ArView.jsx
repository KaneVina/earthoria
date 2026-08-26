import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { arService } from "../services/arService";
import { kidAccessService } from "../services/kidAccessService";
import Model3D from "../components/3d/Model3D";
import "../components/assets/css/arview.css";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";

const WORLD_MAP_GEO_URL =
  "https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json";
const WORLD_MAP_NAME = "earthoria-world";

let worldMapRegistered = false;
let worldMapFetchPromise = null;

function useWorldMapRegistered() {
  const [ready, setReady] = useState(worldMapRegistered);

  useEffect(() => {
    if (worldMapRegistered) {
      setReady(true);
      return;
    }
    if (!worldMapFetchPromise) {
      worldMapFetchPromise = fetch(WORLD_MAP_GEO_URL)
        .then((res) => res.json())
        .then((geoJson) => {
          echarts.registerMap(WORLD_MAP_NAME, geoJson);
          worldMapRegistered = true;
          return true;
        });
    }
    let cancelled = false;
    worldMapFetchPromise.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}

const REGION_TO_COUNTRIES = {
  arctic: ["Greenland", "Canada", "Russia", "Norway", "Iceland"],
  antarctic: ["Antarctica"],
  oceania: ["Australia", "New Zealand", "Papua New Guinea", "Fiji"],
  southAmerica: [
    "Brazil",
    "Argentina",
    "Peru",
    "Colombia",
    "Chile",
    "Venezuela",
    "Ecuador",
    "Bolivia",
  ],
  northAmerica: ["United States", "Canada", "Mexico"],
  africa: [
    "Dem. Rep. Congo",
    "Kenya",
    "Tanzania",
    "South Africa",
    "Nigeria",
    "Egypt",
    "Ethiopia",
    "Mozambique",
    "Namibia",
  ],
  europe: [
    "France",
    "Germany",
    "Spain",
    "Italy",
    "United Kingdom",
    "Poland",
    "Sweden",
    "Finland",
    "Norway",
  ],
  asia: [
    "China",
    "India",
    "Russia",
    "Indonesia",
    "Malaysia",
    "Thailand",
    "Vietnam",
    "Mongolia",
    "Kazakhstan",
    "Japan",
  ],
};

function normalizeHabitatCountries({ habitatCountries, habitatRegion }) {
  if (habitatCountries && Object.keys(habitatCountries).length) {
    return habitatCountries; // { "Greenland": 0.9, "Canada": 0.7, ... } — dữ liệu thật
  }
  const regions = Array.isArray(habitatRegion)
    ? habitatRegion
    : habitatRegion
      ? [habitatRegion]
      : [];
  const map = {};
  regions.forEach((r) => {
    (REGION_TO_COUNTRIES[r] || []).forEach((name) => {
      map[name] = 0.55; // không có số liệu chi tiết -> mật độ trung bình mặc định
    });
  });
  return map;
}

function WorldMapCard({ habitatCountries, habitatRegion }) {
  const mapReady = useWorldMapRegistered();
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  const densityMap = normalizeHabitatCountries({
    habitatCountries,
    habitatRegion,
  });
  const hasData = Object.keys(densityMap).length > 0;

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const resizeChart = () => {
      const instance = chartRef.current?.getEchartsInstance();
      if (!instance) return;
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        instance.resize({ width, height });
      }
    };

    const observer = new ResizeObserver(resizeChart);
    observer.observe(el);
    const settleTimeout = setTimeout(resizeChart, 650);

    return () => {
      observer.disconnect();
      clearTimeout(settleTimeout);
    };
  }, [mapReady]);

  if (!mapReady) {
    return (
      <div className="ar-more-map ar-more-map--loading">
        <span className="ar-more-map__loading-dot" />
        <p className="ar-more-map__empty">Đang tải bản đồ…</p>
      </div>
    );
  }

  const maxValue = Math.max(1, ...Object.values(densityMap));
  const data = Object.entries(densityMap).map(([name, value]) => {
    const intensity = value / maxValue;
    return {
      name,
      value,
      itemStyle:
        intensity > 0.05
          ? {
              borderColor: `rgba(111, 224, 106, ${0.35 + intensity * 0.55})`,
              borderWidth: 0.6 + intensity * 0.6,
              shadowColor: "rgba(111, 224, 106, 0.55)",
              shadowBlur: 4 + intensity * 10,
            }
          : undefined,
    };
  });

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      show: true,
      trigger: "item",
      confine: true,
      backgroundColor: "rgba(10, 14, 12, 0.9)",
      borderColor: "rgba(74, 158, 63, 0.3)",
      borderWidth: 0.5,
      padding: [8, 12],
      textStyle: {
        color: "#faf8f3",
        fontSize: 12,
        fontFamily: '"Be Vietnam Pro", sans-serif',
      },
      formatter: (params) => {
        const value = params.value;
        if (value === undefined || value === null || isNaN(value)) {
          return `<div style="font-weight:500">${params.name}</div>`;
        }
        const pct = Math.round((value / maxValue) * 100);
        const level =
          pct >= 70
            ? "Mật độ cao"
            : pct >= 35
              ? "Mật độ trung bình"
              : "Mật độ thấp";
        return `<div style="font-weight:500;margin-bottom:2px">${params.name}</div>
          <div style="color:#6fe06a;font-size:11px;letter-spacing:.02em">${level} · ${pct}%</div>`;
      },
    },
    visualMap: {
      show: hasData,
      min: 0,
      max: maxValue,
      left: 8,
      bottom: 4,
      itemWidth: 10,
      itemHeight: 70,
      calculable: false,
      text: ["Nhiều", "Ít"],
      textStyle: {
        color: "rgba(244, 241, 234, 0.55)",
        fontSize: 10,
      },
      inRange: {
        color: ["rgba(244, 241, 234, 0.06)", "#3fae55", "#6fe06a"],
      },
    },
    series: [
      {
        type: "map",
        map: WORLD_MAP_NAME,
        roam: true,
        scaleLimit: { min: 0.8, max: 8 },
        selectedMode: false,
        left: "1%",
        right: "1%",
        top: "3%",
        bottom: "22%", // vẫn chừa chỗ cho visualMap "Nhiều/Ít" ở góc dưới trái
        aspectScale: 0.75,
        itemStyle: {
          borderColor: "rgba(244, 241, 234, 0.14)",
          borderWidth: 0.4,
          areaColor: "rgba(244, 241, 234, 0.06)",
        },
        emphasis: {
          itemStyle: {
            areaColor: "rgba(111, 224, 106, 0.5)",
            borderColor: "#6fe06a",
            borderWidth: 1,
          },
          label: { show: false },
        },
        animation: true,
        animationDuration: 700,
        animationEasing: "cubicOut",
        animationDurationUpdate: 500,
        data,
      },
    ],
  };

  return (
    <div className="ar-more-map">
      <div className="ar-more-map__chart" ref={containerRef}>
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: "100%", width: "100%" }}
          notMerge
          lazyUpdate
        />
      </div>
      {!hasData && (
        <p className="ar-more-map__empty">Chưa có dữ liệu phân bố chi tiết.</p>
      )}
    </div>
  );
}

// ─ DỮ LIỆU MẪU (HARDCODE) — thay bằng dữ liệu thật từ API khi sẵn sàng ─
const FALLBACK_DATA = {
  label: "Cây Đại Thụ Rừng Nhiệt Đới",
  modelUrl: "/models/Untitled.glb",
  book: {
    title: "Khám Phá & Bảo Vệ Hệ Sinh Thái Rừng",
    slug: "kham-pha-bao-ve-he-sinh-thai-rung",
  },
  specs: [
    { label: "Chiều cao", value: "30- 60 m" },
    { label: "Đường kính thân", value: "1- 3 m" },
    { label: "Tuổi thọ", value: "200- 1.000 năm" },
    { label: "Môi trường sống", value: "Rừng nhiệt đới ẩm" },
    { label: "Tầng phân bố", value: "Tầng tán & tầng vượt tán" },
  ],
  description:
    "Cây đại thụ rừng nhiệt đới là trụ cột của hệ sinh thái rừng — cung cấp oxy, hấp thụ carbon và là ngôi nhà cho hàng nghìn loài sinh vật. Bộ rễ khổng lồ giúp chống xói mòn đất, tán lá rộng điều hòa nhiệt độ và độ ẩm cho cả vùng rừng xung quanh. Chính những cây khổng lồ này tạo nên 'mái vòm xanh' bảo vệ toàn bộ tầng rừng bên dưới.",
  funFacts: [
    "Một cây đại thụ trưởng thành có thể hấp thụ tới 22 kg CO₂ mỗi năm và giải phóng đủ oxy cho 2 người thở trong một ngày.",
    "Hệ rễ của cây rừng nhiệt đới kết nối với nhau qua mạng lưới nấm rễ — được gọi là 'Wood Wide Web' — để chia sẻ chất dinh dưỡng và tín hiệu cảnh báo.",
    "Tán của một cây đại thụ có thể che phủ diện tích bằng nửa sân bóng đá, tạo vi khí hậu riêng bên dưới với nhiệt độ thấp hơn 5–8°C so với bên ngoài.",
  ],
  habitatRegion: "southAmerica",
  habitatCountries: {
    Brazil: 0.95,
    "Dem. Rep. Congo": 0.85,
    Indonesia: 0.88,
    Peru: 0.75,
    Colombia: 0.72,
    Malaysia: 0.7,
    Venezuela: 0.65,
    Ecuador: 0.6,
    "Papua New Guinea": 0.58,
    Bolivia: 0.52,
    Cameroon: 0.48,
    "Ivory Coast": 0.4,
    Vietnam: 0.35,
    Thailand: 0.3,
    Myanmar: 0.45,
    Laos: 0.38,
    Cambodia: 0.35,
    Philippines: 0.42,
    Madagascar: 0.5,
  },
};

const SON_DOONG_DATA = {
  label: "Hang Sơn Đoòng",
  modelUrl: "/models/Untitled.glb", // TODO: thay model 3D thật của Sơn Đoòng khi có
  book: {
    title: "Khám Phá & Bảo Vệ Hệ Sinh Thái Rừng",
    slug: "kham-pha-va-bao-ve-he-sinh-thai-rung",
  },
  specs: [
    { label: "Chiều dài", value: "~9 km (khoang chính ~5 km)" },
    { label: "Chiều cao trần hang", value: "~200 m (chỗ cao nhất)" },
    { label: "Chiều rộng", value: "~150 m" },
    { label: "Thể tích", value: "~38,5 triệu m³" },
    { label: "Vị trí", value: "VQG Phong Nha - Kẻ Bàng, Quảng Bình" },
    { label: "Tuổi hang", value: "~2-5 triệu năm" },
    { label: "Năm phát hiện lối vào", value: "1990 (Hồ Khanh)" },
    { label: "Năm khảo sát chính thức", value: "2009" },
  ],
  description:
    "Sơn Đoòng là hang động tự nhiên lớn nhất thế giới đã được biết đến, ẩn mình sâu trong lòng núi đá vôi của Vườn quốc gia Phong Nha - Kẻ Bàng. Được hình thành bởi dòng nước ngầm bào mòn đá vôi qua hàng triệu năm, hang có kích thước lớn đến mức có thể chứa trọn cả một tòa nhà 40 tầng bên trong lòng nó. Điều đặc biệt nhất là ở hai vị trí trần hang từng bị sụp đổ, ánh sáng mặt trời lọt xuống tạo thành các 'giếng trời' khổng lồ, đủ để nuôi dưỡng cả một khu rừng nhiệt đới nguyên sinh mọc lên ngay bên trong hang, với những thân cây cao tới vài chục mét vươn lên đón nắng. Nhờ hệ sinh thái độc đáo và cảnh quan hùng vĩ hiếm có, Sơn Đoòng được coi là một trong những kỳ quan thiên nhiên ấn tượng nhất hành tinh và niềm tự hào của người Việt Nam.",
  funFacts: [
    "Sơn Đoòng đủ rộng để chứa trọn một tòa nhà chọc trời 40 tầng ngay trong lòng hang mà vẫn còn khoảng trống.",
    "Bên trong hang có một khu rừng nguyên sinh thực thụ mọc lên từ hai hố sụt 'giếng trời', được các nhà thám hiểm đặt tên là 'Vườn Địa Đàng' (Garden of Edam).",
    "Hang có khí hậu riêng biệt: mây và sương mù có thể hình thành ngay bên trong lòng hang do sự chênh lệch nhiệt độ giữa không khí trong và ngoài hang.",
    "Sơn Đoòng sở hữu một dòng sông ngầm chảy xuyên suốt chiều dài hang, cùng những cột thạch nhũ cao tới 70 mét — được xem là cao nhất thế giới trong các hang động đã biết.",
    "Hang được đặt tên theo bản Đoòng, ngôi làng nhỏ gần đó nơi những người dân địa phương sinh sống, và tên gọi 'Sơn Đoòng' nghĩa là 'núi của bản Đoòng'.",
  ],
  habitatRegion: "asia",
  habitatCountries: {
    Vietnam: 1,
  },
};

// Khoá là `code` lấy từ URL /ar/:slug/:code
const CODE_OVERRIDES = {
  J8HADMYTY5Hi_6KSsj0ci_PzWsyfpC7q: SON_DOONG_DATA,
};

const SCAN_DURATION_MS = 2400;

export default function ArView() {
  // :token chỉ có khi vào từ link riêng của bé (route /e-kid/:slug/:token/ar/:code)
  const { slug, code, token } = useParams();
  const navigate = useNavigate();
  const isKidMode = !!token;

  const [state, setState] = useState({
    status: "loading", // loading | ready | not-found | forbidden | locked
    data: null,
  });

  // "scanning" -> "preview" -> "immersive" (and back)
  const [stage, setStage] = useState("scanning");
  const scanTimeoutRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") setIsExpanded(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  useEffect(() => {
    if (stage !== "preview") setIsExpanded(false);
  }, [stage]);

  useEffect(() => {
    let cancelled = false;

    async function fetchArCode() {
      try {
        const res = await arService.getArCode(code, token);
        if (cancelled) return;

        const data = res.data?.data;
        if (!data) {
          setState({ status: "not-found", data: null });
          return;
        }

        if (data.book?.slug && data.book.slug !== slug) {
          const correctPath = isKidMode
            ? `/e-kid/${data.book.slug}/${token}/ar/${code}`
            : `/ar/${data.book.slug}/${code}`;
          navigate(correctPath, { replace: true });
        }

        const baseData = CODE_OVERRIDES[code] || FALLBACK_DATA;

        setState({
          status: "ready",
          data: {
            ...baseData,
            ...data,
            specs: data.specs || baseData.specs,
            description: data.description || baseData.description,
            funFacts: data.funFacts || baseData.funFacts,
            habitatRegion: data.habitatRegion || baseData.habitatRegion,
            habitatCountries:
              data.habitatCountries || baseData.habitatCountries,
          },
        });
      } catch (err) {
        if (cancelled) return;

        const httpStatus = err.response?.status;

        if (httpStatus === 401) {
          // Phiên của bé không có tài khoản để đăng nhập lại — hiện màn hình
          // "không tìm thấy" thân thiện thay vì đá về /login.
          if (isKidMode) {
            setState({ status: "not-found", data: null });
            return;
          }
          const currentUrl = `${window.location.pathname}${window.location.search}`;
          navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, {
            replace: true,
          });
          return;
        }

        if (httpStatus === 403) {
          const errCode = err.response?.data?.code;
          if (errCode === "CHILD_LOCKED") {
            setState({
              status: "locked",
              data: {
                title: "AR đang bị khoá",
                message: "Ba mẹ đã tạm khoá AR rồi. Nhờ ba mẹ mở khoá lại nhé!",
              },
            });
            return;
          }
          if (errCode === "DAILY_LIMIT_REACHED") {
            setState({
              status: "locked",
              data: {
                title: "Hết giờ dùng hôm nay rồi",
                message: "Bé đã dùng hết thời gian hôm nay rồi, hẹn bé ngày mai nhé!",
              },
            });
            return;
          }
          if (errCode === "OUTSIDE_ALLOWED_WINDOW") {
            setState({
              status: "locked",
              data: {
                title: "Ngoài giờ được phép rồi",
                message: "Bây giờ không phải giờ ba mẹ cho phép bé dùng AR nhé.",
              },
            });
            return;
          }
          setState({ status: "forbidden", data: null });
          return;
        }

        setState({ status: "not-found", data: null });
      }
    }

    fetchArCode();
    return () => {
      cancelled = true;
    };
  }, [code, slug, token, isKidMode, navigate]);

  // Kid mode: ghi nhận phiên xem AR thật lên server (server tự tính phút bằng
  // đồng hồ server, không dùng số phút đếm ở client) — để Parent Dashboard có
  // dữ liệu thật và daily limit/khung giờ được áp dụng đúng trong lúc xem.
  useEffect(() => {
    if (!isKidMode || state.status !== "ready") return;

    let cancelled = false;
    let activityId = null;
    let intervalId = null;

    async function start() {
      try {
        const res = await kidAccessService.startActivity(token, { bookId: state.data?.book?.id });
        if (cancelled) return;
        activityId = res.data?.data?.activityId;
        if (!activityId) return;

        intervalId = setInterval(async () => {
          try {
            const pingRes = await kidAccessService.pingActivity(token, activityId);
            const info = pingRes.data?.data;
            if (info?.locked || info?.limitReached || info?.withinWindow === false) {
              navigate(`/e-kid/${slug}/${token}`, { replace: true });
            }
          } catch {
            // Bỏ qua lỗi 1 lần ping (vd mất mạng tạm thời) — thử lại ở lần kế tiếp
          }
        }, 45000);
      } catch {
        // Không chặn trải nghiệm xem AR chỉ vì việc ghi nhận phiên thất bại
      }
    }

    start();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (activityId) kidAccessService.pingActivity(token, activityId).catch(() => {});
    };
  }, [isKidMode, state.status, state.data?.book?.id, token, slug, navigate]);

  // Sau khi data sẵn sàng, chạy hiệu ứng quét rồi mới chuyển sang preview
  useEffect(() => {
    if (state.status !== "ready") return;
    setStage("scanning");
    scanTimeoutRef.current = setTimeout(() => {
      setStage("preview");
    }, SCAN_DURATION_MS);
    return () => clearTimeout(scanTimeoutRef.current);
  }, [state.status]);

  if (state.status === "loading") {
    return (
      <main className="ar-view ar-view--center">
        <div className="ar-view__loading" role="status" aria-live="polite">
          <div className="ar-view__spinner" aria-hidden="true" />
          <span className="ar-view__loading-text">
            Đang chuẩn bị mô hình AR…
          </span>
        </div>
      </main>
    );
  }

  if (state.status === "locked") {
    return (
      <main className="ar-view ar-view--center">
        <div className="ar-view__empty">
          <div className="ar-view__badge" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="5"
                y="11"
                width="14"
                height="9"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M8 11V7.5a4 4 0 0 1 8 0V11"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle cx="12" cy="15.3" r="1.3" fill="currentColor" />
            </svg>
          </div>
          <span className="ar-view__eyebrow">Earthoria AR</span>
          <h1>{state.data?.title || "AR đang bị khoá"}</h1>
          <p>{state.data?.message || "Ba mẹ đã tạm khoá AR rồi. Nhờ ba mẹ mở khoá lại nhé!"}</p>
          {isKidMode && (
            <Link to={`/e-kid/${slug}/${token}`} className="ar-view__back-link">
              Quay lại tủ sách
            </Link>
          )}
        </div>
      </main>
    );
  }

  if (state.status === "forbidden") {
    return (
      <main className="ar-view ar-view--center">
        <div className="ar-view__empty">
          <div className="ar-view__badge" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="5"
                y="11"
                width="14"
                height="9"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M8 11V7.5a4 4 0 0 1 8 0V11"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle cx="12" cy="15.3" r="1.3" fill="currentColor" />
            </svg>
          </div>
          <span className="ar-view__eyebrow">Earthoria AR</span>
          <h1>Bạn chưa có quyền xem mô hình này</h1>
          <p>
            Mô hình 3D này chỉ hiển thị cho khách hàng đã mua và nhận được cuốn
            sách tương ứng. Nếu bạn đã mua sách này, vui lòng kiểm tra lại tài
            khoản đang đăng nhập hoặc liên hệ với chúng tôi để được hỗ trợ.
          </p>
          {isKidMode && (
            <Link to={`/e-kid/${slug}/${token}`} className="ar-view__back-link">
              Quay lại tủ sách
            </Link>
          )}
        </div>
      </main>
    );
  }

  if (state.status === "not-found") {
    return (
      <main className="ar-view ar-view--center">
        <div className="ar-view__empty">
          <div className="ar-view__badge" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="8.2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeDasharray="2.4 3.2"
              />
              <path
                d="M14.6 9.4 12.9 13l-3.6 1.7 1.7-3.6 3.6-1.7Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="ar-view__eyebrow">Earthoria AR</span>
          <h1>Không tìm thấy mã này</h1>
          <p>
            Mã AR không tồn tại hoặc đã bị vô hiệu hoá. Vui lòng kiểm tra lại
            trang sách hoặc liên hệ với chúng tôi nếu bạn nghĩ đây là nhầm lẫn.
          </p>
          {isKidMode && (
            <Link to={`/e-kid/${slug}/${token}`} className="ar-view__back-link">
              Quay lại tủ sách
            </Link>
          )}
        </div>
      </main>
    );
  }

  const {
    label,
    modelUrl,
    book,
    specs,
    description,
    funFacts,
    habitatRegion,
    habitatCountries,
  } = state.data;
  const isScanning = stage === "scanning";
  const isImmersive = stage === "immersive";
  const isPreview = stage === "preview";

  // Model nhỏ khi đang ở chế độ preview, full khi immersive, và gần như
  // ẩn (hơi nhỏ + mờ) trong lúc đang quét để hiệu ứng scan là tâm điểm.
  const scaleMultiplier = isImmersive ? 1 : 0.55;

  return (
    <main className={`ar-view ar-view--${stage}`}>
      {/* Glow nền chuyển động phía sau toàn bộ stage */}
      <div className="ar-view__glow" aria-hidden="true" />

      {/* Mô hình 3D nền, full màn hình; tự thu/phóng theo scaleMultiplier */}
      <div className="ar-view__stage">
        <Model3D
          url={modelUrl}
          height="100%"
          autoRotate
          enableZoom
          minDistance={0.7}
          maxDistance={9}
          scaleMultiplier={scaleMultiplier}
          showTechBackdrop
          techColor="#6fe06a"
        />
      </div>

      {/*  Hiệu ứng quét công nghệ — chỉ hiện ở stage "scanning"  */}
      <div
        className={`ar-scan${isScanning ? " is-active" : ""}`}
        aria-hidden="true"
      >
        <div className="ar-scan__frame">
          <span className="ar-scan__corner ar-scan__corner--tl" />
          <span className="ar-scan__corner ar-scan__corner--tr" />
          <span className="ar-scan__corner ar-scan__corner--bl" />
          <span className="ar-scan__corner ar-scan__corner--br" />
          <div className="ar-scan__line" />
          <div className="ar-scan__grid" />
        </div>
        <div className="ar-scan__label">
          <span className="ar-scan__dot" />
          Đang dựng mô hình 3D…
        </div>
      </div>

      {/* Vignette để chữ overlay luôn đọc được dù model sáng/tối */}
      <div className="ar-view__vignette" aria-hidden="true" />

      {/*  Overlay trái: tên sách nhỏ / tên nhân vật to / hướng dẫn
          Khi panel phải "kéo dài" (isExpanded), phần hướng dẫn kéo/zoom
          bị ẩn cho đỡ rối, nhưng tên sách + tên con vật luôn còn.  */}
      <section
        className={`ar-panel ar-panel--left${
          isImmersive ? " is-collapsed" : ""
        }${isScanning ? " is-hidden" : ""}${
          isExpanded ? " is-info-expanded" : ""
        }`}
      >
        <span className="ar-panel__book">
          <span className="ar-panel__book-track">{book.title}</span>
        </span>
        <h1 className="ar-panel__name">{label}</h1>

        <div className="ar-hint">
          <div className="ar-hint__row">
            <svg
              className="ar-hint__icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 12c2.5-4 5.5-6 9-6s6.5 2 9 6c-2.5 4-5.5 6-9 6s-6.5-2-9-6Z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle
                cx="12"
                cy="12"
                r="2.6"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            <span>Kéo để xoay mô hình</span>
          </div>
          <div className="ar-hint__row">
            <svg
              className="ar-hint__icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M21 21l-4.3-4.3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M11 8.5v5M8.5 11h5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span>Cuộn / chụm hai ngón để phóng to · thu nhỏ</span>
          </div>
          <div className="ar-hint__row">
            <svg
              className="ar-hint__icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="7.5" cy="12" r="1.3" fill="currentColor" />
              <circle cx="12" cy="12" r="1.3" fill="currentColor" />
              <circle cx="16.5" cy="12" r="1.3" fill="currentColor" />
              <circle
                cx="12"
                cy="12"
                r="8.2"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="1.5 3"
              />
            </svg>
            <span>Chạm 3 lần để dừng · tiếp tục xoay</span>
          </div>
        </div>
      </section>

      <section
        className={`ar-panel ar-panel--right${
          isImmersive ? " is-collapsed" : ""
        }${isScanning ? " is-hidden" : ""}${isExpanded ? " is-expanded" : ""}`}
      >
        {isExpanded ? (
          <>
            <button
              type="button"
              className="ar-more-close"
              onClick={() => setIsExpanded(false)}
              aria-label="Thu gọn thông tin"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="ar-more-content">
              <span className="ar-panel__eyebrow">Thông tin chi tiết</span>

              <span className="ar-more-section-title">Phạm vi sinh sống</span>
              <WorldMapCard
                habitatCountries={habitatCountries}
                habitatRegion={habitatRegion}
              />

              <dl className="ar-more-specs">
                {specs.map((item) => (
                  <div className="ar-more-spec" key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="ar-more-desc">{description}</p>

              {Array.isArray(funFacts) && funFacts.length > 0 && (
                <div className="ar-more-facts">
                  <span className="ar-more-section-title">
                    Có thể bạn chưa biết
                  </span>
                  <ul>
                    {funFacts.map((fact, index) => (
                      <li key={index}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <span className="ar-panel__eyebrow">Đặc điểm</span>

            <dl className="ar-specs">
              {specs.map((item) => (
                <div className="ar-specs__row" key={item.label}>
                  <dt>{item.label}</dt>
                  <span className="ar-specs__leader" aria-hidden="true" />
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>

            <p className="ar-panel__desc">{description}</p>

            <button
              type="button"
              className="ar-more-btn"
              onClick={() => setIsExpanded(true)}
            >
              <span>Xem thêm thông tin</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </section>

      {/*  Nút điều khiển preview <-> immersive — ẩn khi panel phải
          đang kéo dài để khỏi đè lên phần thông tin  */}
      {isPreview && !isExpanded && (
        <button
          type="button"
          className="ar-expand-btn"
          onClick={() => setStage("immersive")}
          aria-label="Phóng to mô hình toàn màn hình"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Phóng to mô hình</span>
        </button>
      )}

      {isImmersive && (
        <>
          <button
            type="button"
            className="ar-mini-btn ar-mini-btn--left"
            onClick={() => setStage("preview")}
            aria-label="Hiện thông tin chi tiết"
            title="Hiện thông tin"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6h16M4 12h10M4 18h7"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="ar-mini-btn ar-mini-btn--right"
            onClick={() => setStage("preview")}
            aria-label="Thu nhỏ mô hình"
            title="Thu nhỏ"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}
    </main>
  );
}