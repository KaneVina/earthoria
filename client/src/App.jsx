import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
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
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
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
import Analytics from "./pages/admin/Analytics";
import Maintenance from "./pages/Maintenance";
import Logo3D from "./components/Logo3D";
import ArView from "./pages/ArView";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
const MAINTENANCE_MODE = false;
// const MAINTENANCE_MODE = true;


export default function App() {
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
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/books/:slug/:hashId" element={<BookDetail />} />
          <Route path="/technology" element={<ARGuide />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/legal" element={<LegalHub />} />
          <Route path="/legal/terms" element={<TermsOfService />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="/legal/shipping" element={<ShippingPolicy />} />
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
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/dashboard/products"
          element={
            <AdminRoute>
              <Products />
            </AdminRoute>
          }
        />
        <Route
          path="/dashboard/analytics"
          element={
            <AdminRoute>
              <Analytics />
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
          path="/dashboard/coupons"
          element={
            <AdminRoute>
              <Coupons />
            </AdminRoute>
          }
        />
        <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
        {/* Public AR route — quét QR trong sách, KHÔNG cần đăng nhập */}
        <Route path="/ar/:slug/:code" element={<ArView />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}