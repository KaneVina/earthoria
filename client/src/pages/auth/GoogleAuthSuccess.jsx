import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import FullScreenLoader from "../../components/FullScreenLoader";
import LoginFlameEffect from "../../components/LoginFlameEffect";
import toast from "react-hot-toast";

export default function GoogleAuthSuccess() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const handled = useRef(false); // chặn StrictMode chạy 2 lần
  const [showFlame, setShowFlame] = useState(false);
  const pendingNav = useRef(null);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const run = async () => {
      try {
        await authService.refresh();
        const { user } = useAuthStore.getState();
        toast.success(`Chào mừng trở lại, ${user.name}!`);

        pendingNav.current = user.role === "ADMIN" ? "/dashboard" : "/";
        setShowFlame(true);
      } catch (err) {
        toast.error("Đăng nhập Google thất bại");
        navigate("/login", { replace: true });
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
