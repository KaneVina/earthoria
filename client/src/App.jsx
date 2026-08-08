import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { authService } from "./services/authService";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import BookDetail from "./pages/BookDetail";
import Cart from "./pages/Cart";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AboutUs from "./pages/AboutUs";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/product/Products";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/user/Users";
import UserCreate from "./pages/admin/user/UserCreate";
import Coupons from "./pages/admin/Coupons";
import GoogleAuthSuccess from "./pages/auth/GoogleAuthSuccess";
import CustomCursor from "./components/CustomCursor";
import ARGuide from "./pages/ARGuide";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import Blog from "./pages/Blog";
import ScrollToTop from "./components/ScrollToTop";
import ForgotPassword from "./pages/auth/ForgotPassword";
import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import ShippingPolicy from "./pages/legal/ShippingPolicy";
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
import InventoryImport from "./pages/admin/product/InventoryImport";
import FullScreenLoader from "./components/FullScreenLoader";
import ProductCreate from "./pages/admin/product/ProductCreate";
import ArCodeDetail from "./pages/admin/ArCodeDetail";
import Compare from "./pages/Compare";
import FloatingCompareBar from "./components/FloatingCompareBar";
import ParentDashboard from "./pages/ParentDashboard";
import KidAccess from "./pages/kid/KidAccess";

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
// Khởi động trang bảo trì
// const MAINTENANCE_MODE = false;
const MAINTENANCE_MODE = true;

export default function App() {
  const { setAuth, setAuthChecked, authChecked } = useAuthStore();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loaderTimer = setTimeout(() => {
      if (!cancelled) setShowLoader(true);
    }, 300);

    authService
      .refresh()
      .catch(() => {
      })
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

  if (MAINTENANCE_MODE) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Maintenance />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      {/* <EarthoriaSecurity /> */}
      <ScrollToTop />
      <CustomCursor />
      <EiraChatbox />
      <FloatingCompareBar />
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
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/legal" element={<LegalHub />} />
          <Route path="/legal/terms" element={<TermsOfService />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="/legal/shipping" element={<ShippingPolicy />} />
          <Route path="/legal/cookies" element={<CookiePolicy />} />
          <Route path="/sitemap" element={<Sitemap />} />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent-dashboard"
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
        <Route path="/dashboard/emails" element={<Emails />} />
        <Route
          path="/dashboard/products"
          element={
            <AdminRoute>
              <Products />
            </AdminRoute>
          }
        />
        <Route
          path="/dashboard/products/inventory-import"
          element={
            <AdminRoute>
              <InventoryImport />
            </AdminRoute>
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
          path="/dashboard/products/new"
          element={
            <AdminRoute>
              <ProductCreate />
            </AdminRoute>
          }
        />
        <Route
          path="/dashboard/products/:id"
          element={
            <AdminRoute>
              <ProductDetail />
            </AdminRoute>
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
          path="/dashboard/orders"
          element={
            <AdminRoute>
              <Orders />
            </AdminRoute>
          }
        />
        <Route
          path="/dashboard/users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
        <Route
          path="/dashboard/users/new"
          element={
            <AdminRoute>
              <UserCreate />
            </AdminRoute>
          }
        />
        <Route
          path="/dashboard/coupons"
          element={
            <AdminRoute>
              <Coupons />
            </AdminRoute>
          }
        />
        <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
        <Route path="/ar/:slug/:code" element={<ArView />} />
        <Route path="/e-kid/:slug/:token" element={<KidAccess />} />
      </Routes>
    </BrowserRouter>
  );
}