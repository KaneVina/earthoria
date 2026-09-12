import { lazy, Suspense, useEffect, useRef, useState } from "react";
import AdminLayout from "./AdminLayout";
import { AdminSkeletonLines } from "../../components/skeletons/SkeletonAdmin";

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

// Suspense fallback khi đang tải mã (JS chunk) của 1 tab dashboard - phỏng
// theo bố cục chung của mọi tab (hàng thẻ KPI + 2 khối biểu đồ) thay vì chỉ
// hiện chữ "Đang tải dữ liệu..." trơ trọi.
function TabFallback() {
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="a-chart-card" style={{ padding: "16px 18px" }}>
            <AdminSkeletonLines lines={2} />
          </div>
        ))}
      </div>
      <div className="a-chart-grid-2">
        <div className="a-chart-card">
          <AdminSkeletonLines lines={5} />
        </div>
        <div className="a-chart-card">
          <AdminSkeletonLines lines={5} />
        </div>
      </div>
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
