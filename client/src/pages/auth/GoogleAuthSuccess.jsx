import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import FullScreenLoader from "../../components/FullScreenLoader";
import LoginFlameEffect from "../../components/LoginFlameEffect";
import toast from "react-hot-toast";

export default function GoogleAuthSuccess() {
  const navigate = useNavigate();
  const handled = useRef(false); // chặn StrictMode chạy 2 lần
  const [showFlame, setShowFlame] = useState(false);
  const pendingNav = useRef(null);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const goToTarget = (u) => {
      pendingNav.current = ["ADMIN", "STAFF"].includes(u.role)
        ? "/dashboard"
        : "/";
      setShowFlame(true);
    };

    // Nếu App vừa chuyển từ cây route "bảo trì" sang cây route đầy đủ ngay
    // trong lượt refresh() trước đó (setAuth() ở refreshSession làm
    // isStaffOrAdmin bật lên), component này có thể bị unmount/mount lại ở
    // đây lần thứ hai với cùng URL. Lúc đó store đã có sẵn user rồi nên
    // không cần gọi lại /auth/refresh (tránh xoay vòng token + hiện toast
    // chào mừng 2 lần) - chuyển hướng thẳng luôn.
    const already = useAuthStore.getState();
    if (already.isAuthenticated && already.user) {
      goToTarget(already.user);
      return;
    }

    const run = async () => {
      try {
        await authService.refresh();
        const { user } = useAuthStore.getState();
        toast.success(`Chào mừng trở lại, ${user.name}!`);
        goToTarget(user);
      } catch {
        const isAdminPortal =
          new URLSearchParams(window.location.search).get("portal") === "admin";
        toast.error("Đăng nhập Google thất bại");
        navigate(isAdminPortal ? "/admin/login" : "/login", {
          replace: true,
        });
      }
    };

    run();
  }, []);

  const handleFlameComplete = () => {
    if (pendingNav.current) {
      navigate(pendingNav.current, { replace: true });
    }
  };

  return (
    <>
      <FullScreenLoader message="Đang xử lý đăng nhập..." />
      <LoginFlameEffect
        active={showFlame}
        duration={2500}
        onComplete={handleFlameComplete}
      />
    </>
  );
}
