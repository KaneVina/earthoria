import { lazy, Suspense, useEffect, useRef, useState } from "react";
import AdminLayout from "./AdminLayout";

// Lazy load từng tab - tách bundle riêng, chỉ tải khi người dùng bấm vào tab đó.
// Giúp trang tải nhanh hơn thay vì gộp toàn bộ số liệu vào 1 file khổng lồ.
const DashboardOverview = lazy(() => import("./dashboard/DashboardOverview"));
const DashboardUsers = lazy(() => import("./dashboard/DashboardUsers"));
const DashboardSales = lazy(() => import("./dashboard/DashboardSales"));
const DashboardContent = lazy(() => import("./dashboard/DashboardContent"));
const DashboardFamily = lazy(() => import("./dashboard/DashboardFamily"));
const DashboardSupport = lazy(() => import("./dashboard/DashboardSupport"));
const Analytics = lazy(() => import("./Analytics"));

const TABS = [
  { key: "overview", label: "Tổng quan", Component: DashboardOverview },
  { key: "users", label: "Người dùng", Component: DashboardUsers },
  { key: "sales", label: "Kinh doanh", Component: DashboardSales },
  { key: "content", label: "Nội dung", Component: DashboardContent },
  { key: "family", label: "Gia đình", Component: DashboardFamily },
  { key: "support", label: "Hỗ trợ", Component: DashboardSupport },
  { key: "web", label: "Web Analytics", Component: Analytics },
];

function TabFallback() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 0",
        color: "rgba(13,51,48,0.3)",
        fontSize: 13,
      }}
    >
      Đang tải dữ liệu...
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  // Đã từng mở qua tab nào - giữ lại kết quả đã tải (không unmount) khi chuyển qua lại giữa các tab
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(["overview"]));

  const handleTabClick = (key) => {
    setActiveTab(key);
    setVisitedTabs((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  };

  /*  Sliding underline indicator - theo đúng pattern tabbar đã dùng ở trang Sản phẩm  */
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  useEffect(() => {
    const onResize = () => {
      const el = tabRefs.current[activeTab];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeTab]);

  return (
    <AdminLayout>
      {/*  Page header  */}
      <div style={{ marginBottom: 18 }}>
        <p className="a-page-eyebrow">Tổng quan</p>
        <h1 className="a-page-title">
          Dashboard <em>Earthoria</em>
        </h1>
      </div>

      {/*  Tab bar  */}
      <div className="a-tabbar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            ref={(el) => (tabRefs.current[tab.key] = el)}
            className={`a-tab${activeTab === tab.key ? " active" : ""}`}
            onClick={() => handleTabClick(tab.key)}
          >
            {tab.label}
          </button>
        ))}
        <span
          className="a-tab-indicator"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
          }}
        />
      </div>

      {/*  Tab panels - giữ lại (display:none) các tab đã từng mở thay vì unmount,
          tránh gọi lại API mỗi lần người dùng chuyển qua lại giữa các tab  */}
      {TABS.map(({ key, Component }) => {
        if (!visitedTabs.has(key)) return null;
        return (
          <div
            key={key}
            className="a-tab-panel"
            style={{ display: activeTab === key ? "block" : "none" }}
          >
            <Suspense fallback={<TabFallback />}>
              <Component />
            </Suspense>
          </div>
        );
      })}
    </AdminLayout>
  );
}
