import { useEffect, useState } from "react";
import FullScreenLoader from "./FullScreenLoader";

const STUCK_AFTER_MS = 8000;

export default function RouteLoader() {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStuck(true), STUCK_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <FullScreenLoader
      message={
        stuck
          ? "Trang tải hơi lâu, có thể do mạng chậm hoặc trang web vừa có bản cập nhật mới. Vui lòng thử tải lại trang."
          : "Đang tải trang..."
      }
    />
  );
}
