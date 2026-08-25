import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, Flame, BookOpen, Gamepad2, TreeDeciduous, Sparkles, Heart } from "lucide-react";
import { kidAccessService } from "../../services/kidAccessService";
import GardenTreeVisual from "./GardenTreeVisual";
import TreeDetailModal from "./TreeDetailModal";
import { fmtDurationVi, fmtNumberVi } from "./gardenHelpers";
import "../assets/css/knowledgeGarden.css";

const POLL_MS = 90_000;

export default function KnowledgeGarden({ token }) {
  const [status, setStatus] = useState("loading");
  const [data, setData] = useState(null);
  const [selectedTreeId, setSelectedTreeId] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const prevSnapshotRef = useRef(null);

  const fetchGarden = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) return;
      if (!silent) setStatus((s) => (s === "ok" ? s : "loading"));
      try {
        const res = await kidAccessService.getGarden(token);
        const payload = res.data.data;
        setData(payload);
        setStatus("ok");

        const prev = prevSnapshotRef.current;
        const newLevel = payload.activeTree.level.level;
        const newStreak = payload.garden.currentStreak;
        if (prev) {
          if (newLevel > prev.level) {
            setCelebrate(`${payload.activeTree.level.name}! 🎉`);
          } else if (newStreak > prev.streak && payload.streakMilestones.includes(newStreak)) {
            setCelebrate(`Chuỗi ${newStreak} ngày! 🔥`);
          }
        }
        prevSnapshotRef.current = { level: newLevel, streak: newStreak };
      } catch {
        if (!silent) setStatus((s) => (s === "ok" ? s : "error"));
      }
    },
    [token],
  );

  useEffect(() => {
    fetchGarden();
  }, [fetchGarden]);

  useEffect(() => {
    if (!celebrate) return;
    const id = setTimeout(() => setCelebrate(null), 2600);
    return () => clearTimeout(id);
  }, [celebrate]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchGarden({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") fetchGarden({ silent: true });
    }, POLL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(id);
    };
  }, [fetchGarden]);

  const scrollToShelf = useCallback(() => {
    document.querySelector(".kid-shelf")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const selectedTree = useMemo(
    () => data?.trees.find((t) => t.id === selectedTreeId) || null,
    [data, selectedTreeId],
  );

  if (status === "loading") {
    return (
      <section className="kg-root kg-skeleton" aria-hidden="true">
        <div className="kg-skeleton-line kg-skeleton-line--title" />
        <div className="kg-skeleton-row">
          <div className="kg-skeleton-chip" />
          <div className="kg-skeleton-chip" />
          <div className="kg-skeleton-chip" />
        </div>
        <div className="kg-skeleton-card" />
      </section>
    );
  }

  if (status === "error" || !data) return null;

  const { garden, activeTree, trees } = data;
  const isFreshStart = trees.length === 1 && activeTree.knowledgeXp === 0 && activeTree.status === "ALIVE";
  const isWiltingActive =
    activeTree.status === "ALIVE" &&
    (activeTree.healthBand.key === "needs_care" || activeTree.healthBand.key === "critical");

  return (
    <section className="kg-root" aria-label="Vườn Tri Thức">
      <header className="kg-header">
        <span className="kg-header-badge">
          <Sprout size={15} /> Vườn Tri Thức
        </span>
        <p className="kg-header-tagline">Mỗi ngày một chút, khu vườn của con lại lớn hơn.</p>
        <p className="kg-header-sub">Đọc sách • Học tập • Chơi game • Nuôi dưỡng cây</p>
      </header>

      {isFreshStart ? (
        <div className="kg-empty">
          <span className="kg-empty-emoji" aria-hidden="true">🌱</span>
          <div className="kg-empty-title">Con chưa có cây nào.</div>
          <p className="kg-empty-text">Đọc cuốn sách đầu tiên để gieo hạt cho Vườn Tri Thức nhé!</p>
          <button type="button" className="kg-cta-btn" onClick={scrollToShelf}>
            Đọc sách
          </button>
        </div>
      ) : (
        <>
          <div className="kg-stats-row">
            <div className="kg-stat-chip">
              <Flame size={14} />
              <span>{garden.currentStreak} ngày</span>
            </div>
            <div className="kg-stat-chip">
              <BookOpen size={14} />
              <span>{fmtDurationVi(activeTree.readingMinutes)}</span>
            </div>
            <div className="kg-stat-chip">
              <Gamepad2 size={14} />
              <span>{fmtNumberVi(activeTree.gameXp)} XP</span>
            </div>
            <div className="kg-stat-chip">
              <TreeDeciduous size={14} />
              <span>{trees.length} cây</span>
            </div>
          </div>

          {!garden.todayActive && (
            <div className="kg-banner kg-banner--nudge">
              <Sparkles size={15} />
              <div>
                <strong>Cây đang chờ con!</strong>
                <span>Hãy đọc vài trang sách hoặc hoàn thành một trò chơi để chăm cây hôm nay.</span>
              </div>
            </div>
          )}

          {isWiltingActive && (
            <div className="kg-banner kg-banner--warning">
              <Heart size={15} />
              <div>
                <strong>Cây đang hơi héo 🌿</strong>
                <span>Con chỉ cần học một chút hôm nay để giúp cây khoẻ lại.</span>
              </div>
            </div>
          )}

          {activeTree.status === "DEAD" && (
            <div className="kg-banner kg-banner--warning">
              <Heart size={15} />
              <div>
                <strong>Cây của con đang nghỉ.</strong>
                <span>Cùng chăm sóc để khu vườn xanh trở lại nhé!</span>
              </div>
            </div>
          )}

          <div className="kg-current-card">
            <div className="kg-current-visual">
              <GardenTreeVisual
                level={activeTree.level.level}
                health={activeTree.health}
                healthBandKey={activeTree.healthBand.key}
                status={activeTree.status}
                size={100}
                animated
              />
            </div>
            <div className="kg-current-info">
              <span className="kg-current-eyebrow">Cây của hôm nay</span>
              <h3 className="kg-current-name">{activeTree.level.name}</h3>

              {!activeTree.isMaxLevel ? (
                <>
                  <div className="kg-progress-track">
                    <motion.div
                      className="kg-progress-fill"
                      initial={false}
                      animate={{ width: `${activeTree.progressPercent}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span className="kg-current-hint">
                    Chỉ còn {Math.max(0, 100 - activeTree.progressPercent)}% để thành{" "}
                    <strong>{activeTree.nextLevel?.name}</strong>!
                  </span>
                </>
              ) : (
                <span className="kg-current-hint">Đã đạt cấp cao nhất — tuyệt vời! 🏆</span>
              )}

              <button type="button" className="kg-cta-btn kg-cta-btn--sm" onClick={scrollToShelf}>
                Đọc tiếp để chăm cây
              </button>
            </div>
          </div>

          <div className="kg-garden-scene">
            <span className="kg-garden-deco kg-garden-deco--flower1" aria-hidden="true" />
            <span className="kg-garden-deco kg-garden-deco--flower2" aria-hidden="true" />
            <span className="kg-garden-deco kg-garden-deco--rock" aria-hidden="true" />
            <span className="kg-garden-deco kg-garden-deco--firefly" aria-hidden="true" />
            <div className="kg-garden-trees">
              {trees.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={`kg-garden-tree-btn${t.id === activeTree.id ? " is-active" : ""}`}
                  onClick={() => setSelectedTreeId(t.id)}
                  aria-label={`Xem chi tiết ${t.level.name}${t.id === activeTree.id ? " — cây đang trồng" : ""}`}
                >
                  <GardenTreeVisual
                    level={t.level.level}
                    health={t.health}
                    healthBandKey={t.healthBand.key}
                    status={t.status}
                    size={56}
                    animated={t.id === activeTree.id && t.status === "ALIVE"}
                  />
                </button>
              ))}
            </div>
          </div>

          {garden.forestUnlocked && (
            <p className="kg-forest-note">
              🌲 Rừng Tri Thức đã mở — mỗi lần có cây trưởng thành, một cây mới lại được trồng thêm!
            </p>
          )}
        </>
      )}

      <AnimatePresence>
        {celebrate && (
          <motion.div
            className="kg-celebrate"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {celebrate}
          </motion.div>
        )}
      </AnimatePresence>

      <TreeDetailModal tree={selectedTree} streak={garden.currentStreak} onClose={() => setSelectedTreeId(null)} />
    </section>
  );
}