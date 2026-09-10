import { useEffect, useState, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore, hasStoredSessionHint } from "./store/authStore";
import { authService } from "./services/authService";
import { settingsService } from "./services/settingsService";
import Layout from "./components/layout/Layout";
import CustomCursor from "./components/CustomCursor";
import ScrollToTop from "./components/ScrollToTop";
import EarthoriaSecurity from "./components/Earthoriasecurity";
import FloatingCompareBar from "./components/FloatingCompareBar";
import FlyingWishlistHeart from "./components/FlyingWishlistHeart";
import FullScreenLoader from "./components/FullScreenLoader";
import RouteLoader from "./components/RouteLoader";
import PromoBanner from "./components/PromoBanner";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const BookDetail = lazy(() => import("./pages/BookDetail"));
const Cart = lazy(() => import("./pages/CartPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Ecosystem = lazy(() => import("./pages/Ecosystem"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Products = lazy(() => import("./pages/admin/product/Products"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Users = lazy(() => import("./pages/admin/user/Users"));
const UserCreate = lazy(() => import("./pages/admin/user/UserCreate"));
const Coupons = lazy(() => import("./pages/admin/Coupons"));
const Reviews = lazy(() => import("./pages/admin/Reviews"));
const GoogleAuthSuccess = lazy(() => import("./pages/auth/GoogleAuthSuccess"));
const ARGuide = lazy(() => import("./pages/ARGuide"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Profile = lazy(() => import("./pages/Profile"));
const LoyaltyJourney = lazy(() => import("./pages/LoyaltyJourney"));
const Blog = lazy(() => import("./pages/Blog"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const ShippingPolicy = lazy(() => import("./pages/legal/ShippingPolicy"));
const ReturnPolicy = lazy(() => import("./pages/legal/ReturnPolicy"));
const MembershipPolicy = lazy(() => import("./pages/legal/MembershipPolicy"));
const LegalHub = lazy(() => import("./pages/legal/LegalHub"));
const CopyrightNotice = lazy(() => import("./pages/legal/CopyrightNotice"));
const AIPolicy = lazy(() => import("./pages/legal/AIPolicy"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const EiraChatbox = lazy(() => import("./components/EiraChatbox"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Logo3D = lazy(() => import("./components/Logo3D"));
const ArView = lazy(() => import("./pages/ArView"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const FamilyPolicy = lazy(() => import("./pages/legal/FamilyPolicy"));
const Emails = lazy(() => import("./pages/admin/Emails"));
const ProductDetail = lazy(() => import("./pages/admin/product/ProductDetail"));
const ArCodeManager = lazy(() => import("./pages/admin/ArCodeManager"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const InventoryImport = lazy(
  () => import("./pages/admin/product/InventoryImport"),
);
const ProductCreate = lazy(() => import("./pages/admin/product/ProductCreate"));
const ArCodeDetail = lazy(() => import("./pages/admin/ArCodeDetail"));
const Compare = lazy(() => import("./pages/Compare"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const KidAccess = lazy(() => import("./pages/kid/KidAccess"));
const GardenPage = lazy(() => import("./pages/kid/GardenPage"));
const Tickets = lazy(() => import("./pages/admin/Tickets"));
const News = lazy(() => import("./pages/admin/News"));
const PaymentReturn = lazy(() => import("./pages/PaymentReturn"));
const GameManager = lazy(() => import("./pages/admin/GameManager"));
const GameDetail = lazy(() => import("./pages/admin/GameDetail"));
const GamePlay = lazy(() => import("./pages/GamePlay"));
const EbookReader = lazy(() => import("./pages/EbookReader"));
const EbookManager = lazy(() => import("./pages/admin/EbookManager"));
const EbookEditor = lazy(() => import("./pages/admin/EbookEditor"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const TrustCenter = lazy(() => import("./pages/TrustCenter"));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
const StaffOrAdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!["ADMIN", "STAFF"].includes(user?.role))
    return <Navigate to="/" replace />;
  return children;
};
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

function HomeOnlyPromoBanner() {
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "/home";
  if (!isHome) return null;
  return <PromoBanner />;
}

// ==** KHỞI ĐỘNG TRANG BẢO TRÌ **==
// const MAINTENANCE_MODE = false;
const MAINTENANCE_MODE = true;

export default function App() {
  const { setAuthChecked, authChecked, user, isAuthenticated } = useAuthStore();
  const [showLoader, setShowLoader] = useState(false);
  const [loaderStage, setLoaderStage] = useState("normal");

  // Trạng thái bảo trì lấy từ dashboard admin
  const { data: siteSettings } = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: () => settingsService.getPublic().then((r) => r.data.data),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
  });

  // Admin đã đăng nhập thì không bao giờ bị chặn bởi bảo trì (kể cả trang ngoài lẫn dashboard)
  const isAdminUser = isAuthenticated && user?.role === "ADMIN";
  const maintenanceActive =
    MAINTENANCE_MODE || Boolean(siteSettings?.maintenanceActive);

  useEffect(() => {
    let cancelled = false;
    if (!hasStoredSessionHint()) {
      setAuthChecked();
      authService.refresh({ silent: true }).catch(() => {});
      return;
    }

    const loaderTimer = setTimeout(() => {
      if (!cancelled) setShowLoader(true);
    }, 300);

    const slowTimer = setTimeout(() => {
      if (!cancelled) setLoaderStage("slow");
    }, 5000);

    authService
      .refresh({ silent: true })
      .catch(() => {})
      .finally(() => {
        clearTimeout(loaderTimer);
        clearTimeout(slowTimer);
        if (cancelled) return;
        setAuthChecked();
      });

    return () => {
      cancelled = true;
      clearTimeout(loaderTimer);
      clearTimeout(slowTimer);
    };
  }, [setAuthChecked]);

  if (!authChecked) {
    return showLoader ? (
      <FullScreenLoader
        message={
          loaderStage === "slow"
            ? "Máy chủ đang khởi động, vui lòng đợi thêm giây lát..."
            : "Đang khôi phục phiên làm việc..."
        }
      />
    ) : null;
  }

  if (maintenanceActive && !isAdminUser) {
    return (
      <BrowserRouter>
        <EarthoriaSecurity />
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route path="/status" element={<StatusPage />} />
            <Route
              path="*"
              element={
                <Maintenance
                  until={siteSettings?.maintenanceEnd}
                  message={siteSettings?.maintenanceMessage}
                />
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <EarthoriaSecurity />
      <ScrollToTop />
      <CustomCursor />
      <HomeOnlyPromoBanner />
      <Suspense fallback={null}>
        <EiraChatbox />
      </Suspense>
      <FloatingCompareBar />
      <FlyingWishlistHeart />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/books/:slug/:hashId" element={<BookDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/technology" element={<ARGuide />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/ecosystem" element={<Ecosystem />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/legal" element={<LegalHub />} />
            <Route path="/trust" element={<TrustCenter />} />
            <Route path="/legal/terms" element={<TermsOfService />} />
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />
            <Route path="/legal/shipping" element={<ShippingPolicy />} />
            <Route path="/legal/cookies" element={<CookiePolicy />} />
            <Route path="/legal/returns" element={<ReturnPolicy />} />
            <Route path="/legal/membership" element={<MembershipPolicy />} />
            <Route path="/legal/copyright" element={<CopyrightNotice />} />
            <Route path="/legal/ai" element={<AIPolicy />} />
            <Route path="/legal/family" element={<FamilyPolicy />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/loyalty" element={<LoyaltyJourney />} />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/vnpay/return"
              element={<PaymentReturn method="vnpay" />}
            />
            <Route
              path="/payment/momo/return"
              element={<PaymentReturn method="momo" />}
            />
            <Route
              path="/family"
              element={
                <ProtectedRoute>
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>

          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route path="/3d" element={<Logo3D />} />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPassword />
              </GuestRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <StaffOrAdminRoute>
                <Dashboard />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/emails"
            element={
              <StaffOrAdminRoute>
                <Emails />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/tickets"
            element={
              <StaffOrAdminRoute>
                <Tickets />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/news"
            element={
              <StaffOrAdminRoute>
                <News />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/products"
            element={
              <StaffOrAdminRoute>
                <Products />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/products/inventory-import"
            element={
              <StaffOrAdminRoute>
                <InventoryImport />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <AdminRoute>
                <Settings />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <AdminRoute>
                <AdminProfile />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard/products/new"
            element={
              <StaffOrAdminRoute>
                <ProductCreate />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/products/:id"
            element={
              <StaffOrAdminRoute>
                <ProductDetail />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/ar-codes"
            element={
              <AdminRoute>
                <ArCodeManager />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard/ar-codes/new"
            element={
              <AdminRoute>
                <ArCodeDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard/ar-codes/:id"
            element={
              <AdminRoute>
                <ArCodeDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard/games"
            element={
              <StaffOrAdminRoute>
                <GameManager />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/games/new"
            element={
              <StaffOrAdminRoute>
                <GameDetail />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/games/:id"
            element={
              <StaffOrAdminRoute>
                <GameDetail />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/ebooks"
            element={
              <StaffOrAdminRoute>
                <EbookManager />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/ebooks/new"
            element={
              <StaffOrAdminRoute>
                <EbookEditor />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/ebooks/:id"
            element={
              <StaffOrAdminRoute>
                <EbookEditor />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/orders"
            element={
              <StaffOrAdminRoute>
                <Orders />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/users"
            element={
              <StaffOrAdminRoute>
                <Users />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/users/new"
            element={
              <StaffOrAdminRoute>
                <UserCreate />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/coupons"
            element={
              <StaffOrAdminRoute>
                <Coupons />
              </StaffOrAdminRoute>
            }
          />
          <Route
            path="/dashboard/reviews"
            element={
              <StaffOrAdminRoute>
                <Reviews />
              </StaffOrAdminRoute>
            }
          />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
          <Route path="/ar/:slug/:code" element={<ArView />} />
          <Route path="/game/:slug/:code" element={<GamePlay />} />
          <Route path="/ebook/:slug" element={<EbookReader />} />
          <Route path="/e-kid/:slug/:token" element={<KidAccess />} />
          <Route path="/e-kid/:slug/:token/garden" element={<GardenPage />} />
          <Route path="/e-kid/:slug/:token/ar/:code" element={<ArView />} />
          <Route
            path="/e-kid/:slug/:token/ebook/:bookSlug"
            element={<EbookReader />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
