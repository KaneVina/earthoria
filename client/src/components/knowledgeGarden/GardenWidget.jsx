import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, Flame, X } from "lucide-react";
import { kidAccessService } from "../../services/kidAccessService";
import GardenTreeVisual from "./GardenTreeVisual";
import "../assets/css/knowledgeGarden.css";

const POLL_MS = 5_000; // giảm từ 90s xuống 5s để phát hiện khóa/giới hạn gần như ngay lập tức
const DISMISS_KEY_PREFIX = "kid-garden-widget-dismissed:";

export default function GardenWidget({ token, slug }) {
  const [dismissed, setDismissed] = useState(true); // mặc định ẩn cho tới khi đọc xong localStorage
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    try {
      const saved = localStorage.getItem(`${DISMISS_KEY_PREFIX}${token}`);
      setDismissed(saved === "1");
    } catch {
      setDismissed(false);
    }
  }, [token]);

  // queryKey ["kid-garden", token] dùng chung với GardenPage.jsx (trang Vườn
  // Tri Thức đầy đủ) - trước đây mỗi nơi tự useState + useEffect riêng,
  // không cache, nên widget này và trang Vườn Tri Thức luôn fetch lại từ
  // đầu dù đang hiển thị cùng 1 dữ liệu.
  const gardenQuery = useQuery({
    queryKey: ["kid-garden", token],
    queryFn: () => kidAccessService.getGarden(token).then((r) => r.data.data),
    enabled: !!token,
    staleTime: POLL_MS,
    refetchInterval: POLL_MS,
    retry: false,
  });
  const data = gardenQuery.data ?? null;

  const goToGarden = useCallback(() => {
    navigate(`/e-kid/${slug}/${token}/garden`);
  }, [navigate, slug, token]);

  const handleDismiss = useCallback(
    (e) => {
      e.stopPropagation();
      setDismissed(true);
      try {
        localStorage.setItem(`${DISMISS_KEY_PREFIX}${token}`, "1");
      } catch {
        /* localStorage có thể bị chặn - bỏ qua, chỉ ẩn cho phiên hiện tại */
      }
    },
    [token],
  );

  if (dismissed || gardenQuery.isError || !data) return null;

  const { garden, activeTree } = data;
  const isFreshStart =
    data.trees.length === 1 &&
    activeTree.knowledgeXp === 0 &&
    activeTree.status === "ALIVE";
  const isWiltingActive =
    activeTree.status === "ALIVE" &&
    (activeTree.healthBand.key === "needs_care" ||
      activeTree.healthBand.key === "critical");

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="kgw-fab-wrap"
        initial={{ opacity: 0, y: -12, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.9 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <button
          type="button"
          className="kgw-fab-close"
          onClick={handleDismiss}
          aria-label="Ẩn widget Vườn Tri Thức"
        >
          <X size={12} />
        </button>

        <motion.button
          type="button"
          className={`kgw-fab${isWiltingActive ? " kgw-fab--warning" : ""}`}
          onClick={goToGarden}
          whileTap={{ scale: 0.96 }}
          aria-label="Mở Vườn Tri Thức để xem chi tiết"
        >
          <div className="kgw-fab-avatar">
            <GardenTreeVisual
              level={activeTree.level.level}
              health={activeTree.health}
              healthBandKey={activeTree.healthBand.key}
              status={activeTree.status}
              size={34}
              animated={activeTree.status === "ALIVE"}
            />
            {garden.currentStreak > 0 && (
              <span className="kgw-fab-streak">
                <Flame size={9} /> {garden.currentStreak}
              </span>
            )}
          </div>

          <div className="kgw-fab-body">
            <span className="kgw-fab-badge">
              <Sprout size={10} /> Vườn Tri Thức
            </span>
            {isFreshStart ? (
              <span className="kgw-fab-title">Gieo hạt đầu tiên nhé! 🌱</span>
            ) : (
              <>
                <span className="kgw-fab-title">{activeTree.level.name}</span>
                {!activeTree.isMaxLevel && (
                  <div className="kgw-progress-track kgw-fab-progress">
                    <div
                      className="kgw-progress-fill"
                      style={{ width: `${activeTree.progressPercent}%` }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </motion.button>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
