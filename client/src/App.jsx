import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "./store/authStore";
import { authService } from "./services/authService";
import { settingsService } from "./services/settingsService";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import BookDetail from "./pages/BookDetail";
import Cart from "./pages/CartPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AboutUs from "./pages/AboutUs";
import Ecosystem from "./pages/Ecosystem";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/product/Products";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/user/Users";
import UserCreate from "./pages/admin/user/UserCreate";
import Coupons from "./pages/admin/Coupons";
import Reviews from "./pages/admin/Reviews";
import GoogleAuthSuccess from "./pages/auth/GoogleAuthSuccess";
import CustomCursor from "./components/CustomCursor";
import ARGuide from "./pages/ARGuide";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import LoyaltyJourney from "./pages/LoyaltyJourney";
import Blog from "./pages/Blog";
import ScrollToTop from "./components/ScrollToTop";
import ForgotPassword from "./pages/auth/ForgotPassword";
import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import ShippingPolicy from "./pages/legal/ShippingPolicy";
import ReturnPolicy from "./pages/legal/ReturnPolicy";
import MembershipPolicy from "./pages/legal/MembershipPolicy";
import LegalHub from "./pages/legal/LegalHub";
import Sitemap from "./pages/Sitemap";
import EiraChatbox from "./components/EiraChatbox";
import Wishlist from "./pages/Wishlist";
import EarthoriaSecurity from "./components/Earthoriasecurity";
import ContactPage from "./pages/ContactPage";
import Maintenance from "./pages/Maintenance";
import Logo3D from "./components/Logo3D";
import ArView from "./pages/ArView";
import CookiePolicy from "./pages/legal/CookiePolicy";
import Emails from "./pages/admin/Emails";
import ProductDetail from "./pages/admin/product/ProductDetail";
import ArCodeManager from "./pages/admin/ArCodeManager";
import Settings from "./pages/admin/Settings";
import AdminProfile from "./pages/admin/AdminProfile";
import InventoryImport from "./pages/admin/product/InventoryImport";
import FullScreenLoader from "./components/FullScreenLoader";
import PromoBanner from "./components/PromoBanner";
import ProductCreate from "./pages/admin/product/ProductCreate";
import ArCodeDetail from "./pages/admin/ArCodeDetail";
import Compare from "./pages/Compare";
import FloatingCompareBar from "./components/FloatingCompareBar";
import ParentDashboard from "./pages/ParentDashboard";
import KidAccess from "./pages/kid/KidAccess";
import GardenPage from "./pages/kid/GardenPage";
import Tickets from "./pages/admin/Tickets";
import PaymentReturn from "./pages/PaymentReturn";
import GameManager from "./pages/admin/GameManager";
import FlyingWishlistHeart from "./components/FlyingWishlistHeart";
import GameDetail from "./pages/admin/GameDetail";
import GamePlay from "./pages/GamePlay";
import EbookReader from "./pages/EbookReader";
import EbookManager from "./pages/admin/EbookManager";
import EbookEditor from "./pages/admin/EbookEditor";
import StatusPage from "./pages/StatusPage"

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
  const { setAuth, setAuthChecked, authChecked, user, isAuthenticated } =
    useAuthStore();
  const [showLoader, setShowLoader] = useState(false);

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

    const loaderTimer = setTimeout(() => {
      if (!cancelled) setShowLoader(true);
    }, 300);
    authService
      .refresh({ silent: true })
      .catch(() => {})
      .finally(() => {
        clearTimeout(loaderTimer);
        if (cancelled) return;
        setAuthChecked();
      });

    return () => {
      cancelled = true;
      clearTimeout(loaderTimer);
    };
  }, []);

  if (!authChecked) {
    return showLoader ? (
      <FullScreenLoader message="Đang khôi phục phiên làm việc..." />
    ) : null;
  }

  if (maintenanceActive && !isAdminUser) {
    return (
      <BrowserRouter>
        <EarthoriaSecurity />
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
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
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <EarthoriaSecurity />
      <ScrollToTop />
      <CustomCursor />
      <HomeOnlyPromoBanner />
      <EiraChatbox />
      <FloatingCompareBar />
      <FlyingWishlistHeart />
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
          <Route path="/legal/terms" element={<TermsOfService />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="/legal/shipping" element={<ShippingPolicy />} />
          <Route path="/legal/cookies" element={<CookiePolicy />} />
          <Route path="/legal/returns" element={<ReturnPolicy />} />
          <Route path="/legal/membership" element={<MembershipPolicy />} />
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
    </BrowserRouter>
  );
}
