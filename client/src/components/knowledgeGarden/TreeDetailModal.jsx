import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Heart,
  Flame,
  BookOpen,
  Gamepad2,
  Sparkles,
  Sprout,
} from "lucide-react";
import GardenTreeVisual from "./GardenTreeVisual";
import {
  fmtDurationVi,
  fmtNumberVi,
  fmtDateVi,
  TREE_STATUS_LABEL,
} from "./gardenHelpers";

const STATUS_ACCENT_VAR = {
  ALIVE: "var(--kid-green)",
  MATURE: "var(--kid-yellow)",
  DEAD: "var(--kid-ink-soft)",
};

export default function TreeDetailModal({ tree, streak, onClose }) {
  const open = !!tree;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="kg-modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="kg-modal"
            style={{ "--kg-modal-accent": STATUS_ACCENT_VAR[tree.status] }}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={`Chi tiết ${tree?.level?.name || "cây"}`}
          >
            <button
              type="button"
              className="kg-modal-close"
              onClick={onClose}
              aria-label="Đóng"
            >
              <X size={16} />
            </button>

            <div className="kg-modal-visual">
              <GardenTreeVisual
                level={tree.level.level}
                health={tree.health}
                healthBandKey={tree.healthBand.key}
                status={tree.status}
                size={112}
                animated={tree.status === "ALIVE"}
              />
            </div>

            <span
              className={`kg-modal-status kg-status--${tree.status.toLowerCase()}`}
            >
              {TREE_STATUS_LABEL[tree.status]}
            </span>
            <h3 className="kg-modal-title">{tree.level.name}</h3>
            <p className="kg-modal-desc">{tree.level.description}</p>

            {tree.status === "ALIVE" && (
              <div className="kg-modal-stat-row">
                <Heart size={14} />
                <span>Sức khoẻ</span>
                <strong>{tree.health}%</strong>
                <span className="kg-modal-stat-sub">
                  · {tree.healthBand.label}
                </span>
              </div>
            )}

            {!tree.isMaxLevel && tree.status === "ALIVE" && (
              <div className="kg-modal-progress">
                <div className="kg-progress-track">
                  <motion.div
                    className="kg-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${tree.progressPercent}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="kg-modal-progress-label">
                  Còn {fmtNumberVi(tree.xpToNextLevel)} điểm tri thức để thành{" "}
                  <strong>{tree.nextLevel?.name}</strong>
                </span>
              </div>
            )}

            <div className="kg-modal-grid">
              {tree.status === "ALIVE" && (
                <div className="kg-modal-cell">
                  <Flame size={15} />
                  <span>Chuỗi học</span>
                  <strong>{streak} ngày</strong>
                </div>
              )}
              <div className="kg-modal-cell">
                <BookOpen size={15} />
                <span>Thời gian đọc</span>
                <strong>{fmtDurationVi(tree.readingMinutes)}</strong>
              </div>
              <div className="kg-modal-cell">
                <Gamepad2 size={15} />
                <span>Game XP</span>
                <strong>{fmtNumberVi(tree.gameXp)}</strong>
              </div>
              <div className="kg-modal-cell">
                <Sprout size={15} />
                <span>Ngày trồng</span>
                <strong>{fmtDateVi(tree.plantedAt)}</strong>
              </div>
              {tree.maturedAt && (
                <div className="kg-modal-cell">
                  <Sparkles size={15} />
                  <span>Ngày trưởng thành</span>
                  <strong>{fmtDateVi(tree.maturedAt)}</strong>
                </div>
              )}
            </div>

            {tree.status === "DEAD" && (
              <p className="kg-modal-revive-tip">
                Cây của con đang nghỉ. Cùng đọc thêm vài trang để khu vườn xanh
                trở lại nhé! 🌱
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
