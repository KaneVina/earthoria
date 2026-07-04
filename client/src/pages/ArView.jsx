import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { arService } from "../services/arService";
import Model3D from "../components/3d/Model3D";
import "../components/assets/css/arview.css";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";

/**
 * Trang xem AR khi khách quét QR trong sách — BẮT BUỘC đăng nhập.
 * Route: /ar/:slug/:code
 *
 * Lưu ý quan trọng: chỉ `code` được dùng để gọi API và tra cứu dữ liệu.
 * `slug` trên URL chỉ để hiển thị tên sách đẹp mắt trong đường dẫn.
 * Nếu `slug` trên URL không khớp với sách thật sự sở hữu `code`, trang
 * sẽ tự điều hướng lại đúng URL chuẩn — không vì vậy mà lộ sách khác,
 * vì dữ liệu trả về luôn được tra theo `code`, không theo `slug`.
 *
 * QUYỀN TRUY CẬP (đã đổi so với bản cũ):
 *   - Chưa đăng nhập (401 từ backend)  -> chuyển sang /login kèm
 *     ?redirect=<url hiện tại> để sau khi login xong tự quay lại đúng
 *     trang AR đang xem, KHÔNG bắt khách quét lại QR.
 *   - Đã đăng nhập nhưng chưa mua sách / đơn chưa giao (403)  -> hiển
 *     thị màn "không có quyền xem", không lộ modelUrl.
 *   - Mã không tồn tại hoặc đã bị vô hiệu hoá (404)  -> hiển thị màn
 *     "không tìm thấy mã".
 *
 * NOTE: phần `specs` / `description` / `funFacts` / `habitatRegion` /
 * `habitatCountries` hiện đang HARDCODE dữ liệu mẫu vì API /ar/:code
 * chưa trả về các field này. Khi backend bổ sung, chỉ cần thay khối
 * FALLBACK_DATA bên dưới bằng field thật từ `res.data.data`.
 *
 * UX flow:
 *   1. "scanning"  — hiệu ứng quét công nghệ chạy qua model vài giây
 *   2. "preview"   — model thu nhỏ ở giữa, 2 panel thông tin hiện đầy
 *                    đủ 2 bên, có 1 nút nổi để phóng to
 *   3. "immersive" — bấm nút phóng to: model animate lớn dần vừa màn
 *                    hình, 2 panel thu gọn lại thành 2 nút tròn nhỏ;
 *                    bấm nút đó để quay lại "preview"
 *   Trong cả "preview" và "immersive", người dùng vẫn kéo/xoay/zoom
 *   model bình thường qua OrbitControls.
 *
 *   Panel phải còn có nút "Xem thêm thông tin": KHÔNG mở modal, mà panel
 *   phải tự "kéo dài" sang trái (đổi width, đè lên vùng model), hiện đầy
 *   đủ thông số dạng lưới + mô tả không giới hạn dòng + "Có thể bạn chưa
 *   biết" + một bản đồ thế giới thật, tô đậm/nhạt theo mật độ phân bố
 *   thật của loài (field `habitatCountries`). Panel trái vẫn giữ nguyên
 *   tên sách + tên con vật, chỉ ẩn phần hướng dẫn kéo/zoom cho đỡ rối.
 */

// ─── BẢN ĐỒ THẾ GIỚI THẬT (ECharts + GeoJSON) ───────────────────────────
// GeoJSON thế giới công khai, tải qua CDN 1 lần rồi cache lại cho cả
// session — không cần tự host file trong dự án. Tên thuộc tính quốc gia
// trong file này là tiếng Anh (VD "Vietnam", "Canada", "Greenland"),
// nên `habitatCountries` bên dưới cũng dùng tên tiếng Anh làm khoá để
// khớp đúng với dữ liệu bản đồ.
const WORLD_MAP_GEO_URL = "https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json";
const WORLD_MAP_NAME = "earthoria-world";

let worldMapRegistered = false;
let worldMapFetchPromise = null;

/**
 * Hook tải + đăng ký bản đồ thế giới vào ECharts đúng 1 lần cho toàn bộ
 * session (nhiều lần mở panel / nhiều con vật khác nhau dùng chung 1
 * bản đồ đã đăng ký, không tải lại). Trả về true khi đã sẵn sàng vẽ.
 */
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

// ─── TƯƠNG THÍCH NGƯỢC ──────────────────────────────────────────────
// Nếu backend chưa kịp trả `habitatCountries` (tên quốc gia -> mật độ
// 0..1) mà chỉ có `habitatRegion` kiểu cũ, quy đổi tạm sang một vài
// quốc gia đại diện cho vùng đó với mật độ mặc định. Đây chỉ là
// fallback thô — nên ưu tiên bổ sung `habitatCountries` ở API thật để
// có bản đồ chính xác theo mật độ thật của loài.
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
  const densityMap = normalizeHabitatCountries({ habitatCountries, habitatRegion });
  const hasData = Object.keys(densityMap).length > 0;

  // FIX: resize() không tham số khiến ECharts tự đo container bằng
  // getBoundingClientRect() đúng lúc được gọi — nếu đúng lúc đó
  // container đang ở kích thước trung gian (giữa lúc panel phải chạy
  // transition đổi width 0.55s), ECharts sẽ khoá nhầm theo số đo sai
  // đó và không tự sửa lại. Vì thời điểm tải xong GeoJSON (mapReady)
  // khác nhau mỗi lần reload, lỗi này xảy ra không cố định.
  // -> Luôn đo tường minh bằng getBoundingClientRect() và truyền thẳng
  // {width, height} vào resize() để ECharts không tự đoán, cộng thêm 1
  // lần đo "chốt" sau khi transition chắc chắn đã xong hẳn.
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
        const level = pct >= 70 ? "Mật độ cao" : pct >= 35 ? "Mật độ trung bình" : "Mật độ thấp";
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
        roam: "scale",
        scaleLimit: { min: 1, max: 5 },
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

// ─── DỮ LIỆU MẪU (HARDCODE) — thay bằng dữ liệu thật từ API khi sẵn sàng ───
const FALLBACK_DATA = {
  label: "Gấu Bắc Cực",
  modelUrl: "/models/Untitled.glb",
  book: {
    title: "Earthoria — Thế Giới Động Vật",
    slug: "earthoria-the-gioi-dong-vat",
  },
  specs: [
    { label: "Cân nặng", value: "300 - 600 kg" },
    { label: "Chiều cao", value: "1.3 - 1.6 m" },
    { label: "Số lượng còn lại", value: "~26.000 cá thể" },
    { label: "Môi trường sống", value: "Bắc Cực, vùng băng giá" },
    { label: "Tuổi thọ", value: "20 - 30 năm" },
  ],
  description:
    "Gấu Bắc Cực là loài thú ăn thịt trên cạn lớn nhất hành tinh, sở hữu lớp lông trắng dày và lớp mỡ dưới da giúp chịu được cái lạnh khắc nghiệt. Chúng là những thợ săn hải cẩu tài ba, có thể bơi hàng chục km giữa các tảng băng. Biến đổi khí hậu đang khiến môi trường sống của chúng thu hẹp nhanh chóng, đẩy loài này đến gần nguy cơ tuyệt chủng.",
  funFacts: [
    "Da của gấu Bắc Cực thực chất có màu đen — giúp hấp thụ nhiệt mặt trời tốt hơn qua lớp lông trong suốt bên ngoài.",
    "Chúng có thể ngửi thấy mùi hải cẩu từ cách xa hơn 1 km, kể cả khi con mồi ở dưới lớp băng dày.",
    "Bàn chân to bản như mái chèo giúp gấu phân bổ trọng lượng khi di chuyển trên băng mỏng và bơi đường dài.",
  ],
  // Dùng khi chưa có habitatCountries chi tiết (xem REGION_TO_COUNTRIES).
  habitatRegion: "arctic",
  // Dữ liệu mật độ phân bố thật theo quốc gia (0..1) — ưu tiên field
  // này khi backend đã có; càng cao càng đậm màu trên bản đồ.
  habitatCountries: {
    Greenland: 0.9,
    Canada: 0.75,
    Russia: 0.5,
    Norway: 0.35,
    Iceland: 0.15,
  },
};
// ──────────────────────────────────────────────────────────────────────────

const SCAN_DURATION_MS = 2400;

export default function ArView() {
  const { slug, code } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({
    status: "loading", // loading | ready | not-found | forbidden
    data: null,
  });

  // "scanning" -> "preview" -> "immersive" (and back)
  const [stage, setStage] = useState("scanning");
  const scanTimeoutRef = useRef(null);

  // Panel phải "kéo dài" hiện đầy đủ thông tin — chỉ có ý nghĩa khi đang
  // ở "preview" (nút mở nó bị ẩn cùng panel ở stage khác).
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") setIsExpanded(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  // Phòng hờ: nếu rời khỏi "preview" bằng đường nào đó, thu gọn lại
  // panel phải để lần sau quay lại "preview" không bị kẹt ở trạng thái mở.
  useEffect(() => {
    if (stage !== "preview") setIsExpanded(false);
  }, [stage]);

  useEffect(() => {
    let cancelled = false;

    async function fetchArCode() {
      try {
        const res = await arService.getArCode(code);
        if (cancelled) return;

        const data = res.data?.data;
        if (!data) {
          setState({ status: "not-found", data: null });
          return;
        }

        // Nếu slug trên URL không khớp sách thật, điều hướng lại URL chuẩn
        // (không reload trang, chỉ sửa lại địa chỉ cho gọn và đúng SEO).
        if (data.book?.slug && data.book.slug !== slug) {
          navigate(`/ar/${data.book.slug}/${code}`, { replace: true });
        }

        // Ghép dữ liệu thật với dữ liệu mẫu cho các field API chưa có
        // (specs / description / habitatCountries) để UI luôn có nội
        // dung hiển thị.
        setState({
          status: "ready",
          data: {
            ...FALLBACK_DATA,
            ...data,
            specs: data.specs || FALLBACK_DATA.specs,
            description: data.description || FALLBACK_DATA.description,
            funFacts: data.funFacts || FALLBACK_DATA.funFacts,
            habitatRegion: data.habitatRegion || FALLBACK_DATA.habitatRegion,
            habitatCountries:
              data.habitatCountries || FALLBACK_DATA.habitatCountries,
          },
        });
      } catch (err) {
        if (cancelled) return;

        const httpStatus = err.response?.status;

        if (httpStatus === 401) {
          // Chưa đăng nhập — không tự động thử quét lại, dẫn thẳng sang
          // trang login kèm redirect để quay lại đúng URL này (bao gồm
          // cả /slug/code) ngay sau khi đăng nhập thành công.
          const currentUrl = `${window.location.pathname}${window.location.search}`;
          navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, {
            replace: true,
          });
          return;
        }

        if (httpStatus === 403) {
          // Đã đăng nhập nhưng không sở hữu sách này (chưa mua / đơn
          // chưa giao) — không tiết lộ modelUrl, hiển thị màn riêng.
          setState({ status: "forbidden", data: null });
          return;
        }

        // 404 hoặc lỗi khác đều coi như "không tìm thấy mã" để không
        // lộ chi tiết lỗi hệ thống ra ngoài.
        setState({ status: "not-found", data: null });
      }
    }

    fetchArCode();
    return () => {
      cancelled = true;
    };
  }, [code, slug, navigate]);

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

  if (state.status === "forbidden") {
    return (
      <main className="ar-view ar-view--center">
        <div className="ar-view__empty">
          <div className="ar-view__badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            Mô hình 3D này chỉ hiển thị cho khách hàng đã mua và nhận được
            cuốn sách tương ứng. Nếu bạn đã mua sách này, vui lòng kiểm tra
            lại tài khoản đang đăng nhập hoặc liên hệ với chúng tôi để được
            hỗ trợ.
          </p>
        </div>
      </main>
    );
  }

  if (state.status === "not-found") {
    return (
      <main className="ar-view ar-view--center">
        <div className="ar-view__empty">
          <div className="ar-view__badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            trang sách hoặc liên hệ với chúng tôi nếu bạn nghĩ đây là nhầm
            lẫn.
          </p>
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

      {/* ── Hiệu ứng quét công nghệ — chỉ hiện ở stage "scanning" ── */}
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

      {/* ── Overlay trái: tên sách nhỏ / tên nhân vật to / hướng dẫn ──
          Khi panel phải "kéo dài" (isExpanded), phần hướng dẫn kéo/zoom
          bị ẩn cho đỡ rối, nhưng tên sách + tên con vật luôn còn. ── */}
      <section
        className={`ar-panel ar-panel--left${
          isImmersive ? " is-collapsed" : ""
        }${isScanning ? " is-hidden" : ""}${
          isExpanded ? " is-info-expanded" : ""
        }`}
      >
        <span className="ar-panel__book">{book.title}</span>
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
              <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.4" />
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
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.4" />
              <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M11 8.5v5M8.5 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span>Cuộn / chụm hai ngón để phóng to · thu nhỏ</span>
          </div>
        </div>
      </section>

      {/* ── Overlay phải: bình thường hiện gọn Đặc điểm + bảng thông số
          rút gọn + mô tả + nút "Xem thêm thông tin". Bấm nút đó, panel
          tự kéo dài sang trái (đổi width, đè lên vùng model) và đổi
          sang nội dung đầy đủ: bản đồ vùng sinh sống + bảng thông số
          dạng lưới + mô tả trọn vẹn + "Có thể bạn chưa biết". ── */}
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
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

      {/* ── Nút điều khiển preview <-> immersive — ẩn khi panel phải
          đang kéo dài để khỏi đè lên phần thông tin ── */}
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
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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