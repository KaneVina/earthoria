import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sprout,
  Flame,
  BookOpen,
  TreeDeciduous,
  Sparkles,
  Heart,
  Gamepad2,
  Lock,
} from "lucide-react";
import { kidAccessService } from "../../services/kidAccessService";
import { useSkyState, DynamicSky, PhaseIcon } from "../../components/KidSky";
import GardenTreeVisual from "../../components/knowledgeGarden/GardenTreeVisual";
import TreeDetailModal from "../../components/knowledgeGarden/TreeDetailModal";
import {
  fmtDurationVi,
  fmtNumberVi,
  fmtDateVi,
  TREE_STATUS_LABEL as STATUS_LABEL,
} from "../../components/knowledgeGarden/gardenHelpers";
import { useKidRestBreak } from "../../hooks/useKidRestBreak";
import { KidRestBreakOverlay } from "../../components/kid/KidRestBreakOverlay";
import "../../components/assets/css/kidAccess.css";
import "../../components/assets/css/knowledgeGarden.css";
import "../../components/assets/css/gardenPage.css";

const POLL_MS = 90_000;

// Thông điệp thân thiện cho từng mã lỗi 403 — dùng chung nội dung với
// EbookReader/ArView để bé thấy đồng nhất dù đang ở màn nào.
const RESTRICTED_COPY = {
  CHILD_LOCKED: {
    title: "Thiết bị đang bị khoá",
    message:
      "Ba mẹ đã tạm khoá thiết bị của bé rồi. Nhờ ba mẹ mở khoá lại nhé!",
  },
  DAILY_LIMIT_REACHED: {
    title: "Hết giờ dùng hôm nay rồi",
    message: "Bé đã dùng hết thời gian hôm nay rồi, hẹn bé ngày mai nhé!",
  },
  OUTSIDE_ALLOWED_WINDOW: {
    title: "Ngoài giờ được phép rồi",
    message: "Bây giờ không phải giờ ba mẹ cho phép bé dùng app nhé.",
  },
};

export default function GardenPage() {
  const { slug, token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [data, setData] = useState(null);
  const [restricted, setRestricted] = useState(null);
  const [selectedTreeId, setSelectedTreeId] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const prevSnapshotRef = useRef(null);
  const skyState = useSkyState(); // bầu trời theo giờ thực — đồng bộ với KidAccess

  // Hồ sơ đầy đủ của bé (bao gồm cấu hình nhắc nghỉ mắt/giải lao bắt buộc) —
  // getGarden() ở dưới chỉ trả dữ liệu khu vườn, không có các trường này,
  // nên cần gọi riêng để nhắc nghỉ mắt cũng chạy được ở trang Vườn Tri Thức.
  const [kidChild, setKidChild] = useState(null);
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    kidAccessService
      .getProfile(token)
      .then((res) => {
        if (cancelled) return;
        const child = res.data?.data?.child;
        if (child) setKidChild(child);
      })
      .catch(() => {
        // Không chặn trải nghiệm xem vườn nếu không lấy được hồ sơ bé
      });
    return () => {
      cancelled = true;
    };
  }, [token]);
  const restBreak = useKidRestBreak(kidChild, status === "ok");

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
          } else if (
            newStreak > prev.streak &&
            payload.streakMilestones.includes(newStreak)
          ) {
            setCelebrate(`Chuỗi ${newStreak} ngày! 🔥`);
          }
        }
        prevSnapshotRef.current = { level: newLevel, streak: newStreak };
      } catch (err) {
        const errCode = err?.response?.data?.code;
        if (err?.response?.status === 403 && RESTRICTED_COPY[errCode]) {
          setRestricted(RESTRICTED_COPY[errCode]);
          setStatus("restricted");
          return;
        }
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

  const goBack = useCallback(() => {
    navigate(`/e-kid/${slug}/${token}`);
  }, [navigate, slug, token]);

  const goToShelf = useCallback(() => {
    navigate(`/e-kid/${slug}/${token}`, { state: { scrollToShelf: true } });
  }, [navigate, slug, token]);

  const selectedTree = useMemo(
    () => data?.trees.find((t) => t.id === selectedTreeId) || null,
    [data, selectedTreeId],
  );

  return (
    <div className="kgp-page" data-phase={skyState.phase}>
      <DynamicSky skyState={skyState} minimal />
      <span className="kgp-ground" aria-hidden="true" />

      <div className="kgp-shell">
        <div className="kgp-header">
          <span className="kgp-header-eyebrow">
            <PhaseIcon phase={skyState.phase} size={14} />
            Vườn Tri Thức
          </span>

          <div className="kgp-header-row">
            <button
              type="button"
              className="kgp-back-btn"
              onClick={goBack}
              aria-label="Quay lại"
            >
              <ArrowLeft size={22} />
            </button>

            {status === "ok" && data && (
              <>
                <div className="kgp-header-avatar" aria-hidden="true">
                  {String(data.childName || "?")
                    .trim()
                    .charAt(0)
                    .toUpperCase() || "?"}
                </div>
                <div className="kgp-header-info">
                  <h1 className="kgp-header-name">
                    {data.childName || "Bé yêu"}
                  </h1>
                  <span className="kgp-header-level">
                    <Sprout size={13} />
                    {data.activeTree.level.name}
                  </span>
                </div>
                <div className="kgp-header-stats">
                  <div className="kgp-hud-stat">
                    <Flame size={14} />
                    <span>{data.garden.currentStreak} ngày</span>
                  </div>
                  <div className="kgp-hud-stat">
                    <BookOpen size={14} />
                    <span>{fmtDurationVi(data.activeTree.readingMinutes)}</span>
                  </div>
                  <div className="kgp-hud-stat">
                    <TreeDeciduous size={14} />
                    <span>{data.trees.length} cây</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="kgp-content">
          {status === "loading" && (
            <section
              className="kg-root kgp-root kg-skeleton"
              aria-hidden="true"
            >
              <div className="kg-skeleton-line kg-skeleton-line--title" />
              <div className="kg-skeleton-row">
                <div className="kg-skeleton-chip" />
                <div className="kg-skeleton-chip" />
                <div className="kg-skeleton-chip" />
              </div>
              <div className="kg-skeleton-card" />
            </section>
          )}

          {status === "error" && (
            <div className="kgp-error">
              <p>Không tải được khu vườn. Vui lòng thử lại.</p>
              <button
                type="button"
                className="kg-cta-btn"
                onClick={() => fetchGarden()}
              >
                Thử lại
              </button>
            </div>
          )}

          {status === "restricted" && restricted && (
            <div className="kgp-error">
              <Lock size={22} />
              <p>
                <strong>{restricted.title}</strong>
                <br />
                {restricted.message}
              </p>
              <button type="button" className="kg-cta-btn" onClick={goBack}>
                Quay lại tủ sách
              </button>
            </div>
          )}

          {status === "ok" && data && (
            <>
              <section className="kg-root kgp-root">
                {(() => {
                  const { garden, activeTree, trees } = data;
                  const isFreshStart =
                    trees.length === 1 &&
                    activeTree.knowledgeXp === 0 &&
                    activeTree.status === "ALIVE";
                  const isWiltingActive =
                    activeTree.status === "ALIVE" &&
                    (activeTree.healthBand.key === "needs_care" ||
                      activeTree.healthBand.key === "critical");
                  const emptySlots = Math.max(0, 4 - trees.length);

                  if (isFreshStart) {
                    return (
                      <div className="kg-empty">
                        <span
                          className="kg-empty-deco kg-empty-deco--1"
                          aria-hidden="true"
                        />
                        <span
                          className="kg-empty-deco kg-empty-deco--2"
                          aria-hidden="true"
                        />

                        <div className="kg-empty-pot" aria-hidden="true">
                          <svg
                            viewBox="0 0 120 120"
                            className="kg-empty-seed-svg"
                          >
                            <ellipse
                              className="kg-empty-soil-shadow"
                              cx="60"
                              cy="96"
                              rx="34"
                              ry="7"
                            />
                            <path
                              className="kg-empty-pot-body"
                              d="M34 62 L86 62 L78 100 Q60 106 42 100 Z"
                            />
                            <rect
                              className="kg-empty-pot-rim"
                              x="30"
                              y="54"
                              width="60"
                              height="12"
                              rx="6"
                            />
                            <motion.g
                              initial={{ y: 6, opacity: 0.6 }}
                              animate={{ y: [6, -2, 6], opacity: 1 }}
                              transition={{
                                duration: 3.2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            >
                              <path
                                className="kg-empty-sprout-stem"
                                d="M60 62 C60 48 60 42 60 34"
                              />
                              <path
                                className="kg-empty-sprout-leaf"
                                d="M60 40 C48 36 42 26 46 16 C58 20 62 32 60 40 Z"
                              />
                              <path
                                className="kg-empty-sprout-leaf"
                                d="M60 34 C72 30 78 20 74 10 C62 14 58 26 60 34 Z"
                              />
                            </motion.g>
                            <motion.circle
                              className="kg-empty-sparkle"
                              cx="86"
                              cy="30"
                              r="3"
                              animate={{
                                opacity: [0.2, 1, 0.2],
                                scale: [0.7, 1.15, 0.7],
                              }}
                              transition={{
                                duration: 2.1,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                            <motion.circle
                              className="kg-empty-sparkle"
                              cx="32"
                              cy="22"
                              r="2.2"
                              animate={{
                                opacity: [0.15, 0.9, 0.15],
                                scale: [0.7, 1.1, 0.7],
                              }}
                              transition={{
                                duration: 2.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.5,
                              }}
                            />
                          </svg>
                        </div>

                        <div className="kg-empty-title">
                          Con chưa có cây nào
                        </div>
                        <p className="kg-empty-text">
                          Đọc cuốn sách đầu tiên để gieo hạt cho Trang Trại Tri
                          Thức nhé!
                        </p>

                        <button
                          type="button"
                          className="kg-cta-btn kg-cta-btn--lg"
                          onClick={goToShelf}
                        >
                          <BookOpen size={16} />
                          Đọc sách ngay
                        </button>

                        <div className="kg-empty-steps">
                          <div className="kg-empty-step">
                            <span className="kg-empty-step-icon">
                              <BookOpen size={14} />
                            </span>
                            <span>Đọc &amp; học</span>
                          </div>
                          <span className="kg-empty-step-arrow">→</span>
                          <div className="kg-empty-step">
                            <span className="kg-empty-step-icon">
                              <Sprout size={14} />
                            </span>
                            <span>Gieo hạt</span>
                          </div>
                          <span className="kg-empty-step-arrow">→</span>
                          <div className="kg-empty-step">
                            <span className="kg-empty-step-icon">
                              <TreeDeciduous size={14} />
                            </span>
                            <span>Cây lớn lên</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      {!garden.todayActive && (
                        <div className="kg-banner kg-banner--nudge">
                          <Sparkles size={15} />
                          <div>
                            <strong>Cây đang chờ con!</strong>
                            <span>
                              Hãy đọc vài trang sách hoặc hoàn thành một trò
                              chơi để chăm cây hôm nay.
                            </span>
                          </div>
                        </div>
                      )}

                      {isWiltingActive && (
                        <div className="kg-banner kg-banner--warning">
                          <Heart size={15} />
                          <div>
                            <strong>Cây đang hơi héo 🌿</strong>
                            <span>
                              Con chỉ cần học một chút hôm nay để giúp cây khoẻ
                              lại.
                            </span>
                          </div>
                        </div>
                      )}

                      {activeTree.status === "DEAD" && (
                        <div className="kg-banner kg-banner--warning">
                          <Heart size={15} />
                          <div>
                            <strong>Cây của con đang nghỉ.</strong>
                            <span>
                              Cùng chăm sóc để khu vườn xanh trở lại nhé!
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="kgp-layout">
                        <div className="kgp-layout-main">
                          <div className="kg-current-card kgp-current-card--rich">
                            <div className="kg-current-visual">
                              <GardenTreeVisual
                                level={activeTree.level.level}
                                health={activeTree.health}
                                healthBandKey={activeTree.healthBand.key}
                                status={activeTree.status}
                                size={176}
                                animated
                              />
                            </div>
                            <div className="kgp-current-info-left">
                              <span className="kg-current-eyebrow">
                                Cây của hôm nay
                              </span>
                              <span
                                className={`kgp-current-status kg-status--${activeTree.status.toLowerCase()}`}
                              >
                                {STATUS_LABEL[activeTree.status]}
                              </span>
                              <h3 className="kg-current-name">
                                {activeTree.level.name}
                              </h3>
                              {activeTree.level.description && (
                                <p className="kgp-current-desc">
                                  {activeTree.level.description}
                                </p>
                              )}

                              <button
                                type="button"
                                className="kg-cta-btn kg-cta-btn--sm kgp-current-cta"
                                onClick={goToShelf}
                              >
                                <BookOpen size={14} />
                                Đọc tiếp để chăm cây
                              </button>
                            </div>

                            <div className="kgp-current-info-right">
                              {activeTree.status === "ALIVE" && (
                                <div className="kgp-current-health">
                                  <Heart size={14} />
                                  <span>Sức khoẻ</span>
                                  <strong>{activeTree.health}%</strong>
                                  <span className="kgp-current-health-sub">
                                    · {activeTree.healthBand.label}
                                  </span>
                                </div>
                              )}

                              {!activeTree.isMaxLevel ? (
                                <>
                                  <div className="kg-progress-track">
                                    <motion.div
                                      className="kg-progress-fill"
                                      initial={false}
                                      animate={{
                                        width: `${activeTree.progressPercent}%`,
                                      }}
                                      transition={{
                                        duration: 0.6,
                                        ease: [0.16, 1, 0.3, 1],
                                      }}
                                    />
                                  </div>
                                  <span className="kg-current-hint">
                                    Còn {fmtNumberVi(activeTree.xpToNextLevel)}{" "}
                                    điểm tri thức để thành{" "}
                                    <strong>
                                      {activeTree.nextLevel?.name}
                                    </strong>
                                  </span>
                                </>
                              ) : (
                                <span className="kg-current-hint">
                                  Đã đạt cấp cao nhất — tuyệt vời! 🏆
                                </span>
                              )}

                              <div className="kgp-current-grid">
                                {activeTree.status === "ALIVE" && (
                                  <div className="kgp-current-cell">
                                    <Flame size={15} />
                                    <span>Chuỗi học</span>
                                    <strong>{garden.currentStreak} ngày</strong>
                                  </div>
                                )}
                                <div className="kgp-current-cell">
                                  <BookOpen size={15} />
                                  <span>Thời gian đọc</span>
                                  <strong>
                                    {fmtDurationVi(activeTree.readingMinutes)}
                                  </strong>
                                </div>
                                <div className="kgp-current-cell">
                                  <Gamepad2 size={15} />
                                  <span>Game XP</span>
                                  <strong>
                                    {fmtNumberVi(activeTree.gameXp)}
                                  </strong>
                                </div>
                                <div className="kgp-current-cell">
                                  <Sprout size={15} />
                                  <span>Ngày trồng</span>
                                  <strong>
                                    {fmtDateVi(activeTree.plantedAt)}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="kgp-layout-side">
                          <div className="kg-garden-scene">
                            <span
                              className="kg-garden-deco kg-garden-deco--flower1"
                              aria-hidden="true"
                            />
                            <span
                              className="kg-garden-deco kg-garden-deco--flower2"
                              aria-hidden="true"
                            />
                            <span
                              className="kg-garden-deco kg-garden-deco--rock"
                              aria-hidden="true"
                            />
                            <span
                              className="kg-garden-deco kg-garden-deco--firefly"
                              aria-hidden="true"
                            />
                            <div className="kg-garden-trees">
                              {trees.map((t) => (
                                <button
                                  type="button"
                                  key={t.id}
                                  className={`kg-garden-tree-btn${t.id === activeTree.id ? " is-active" : ""}`}
                                  onClick={() => setSelectedTreeId(t.id)}
                                  aria-label={`Xem chi tiết ${t.level.name}${t.id === activeTree.id ? " — cây đang trồng" : ""}`}
                                >
                                  {t.id === activeTree.id && (
                                    <span className="kg-garden-tree-tag">
                                      Đang trồng
                                    </span>
                                  )}
                                  <GardenTreeVisual
                                    level={t.level.level}
                                    health={t.health}
                                    healthBandKey={t.healthBand.key}
                                    status={t.status}
                                    size={100}
                                    animated={
                                      t.id === activeTree.id &&
                                      t.status === "ALIVE"
                                    }
                                  />
                                </button>
                              ))}
                              {Array.from({ length: emptySlots }).map(
                                (_, i) => (
                                  <div
                                    key={`empty-${i}`}
                                    className="kg-garden-tree-slot kg-garden-tree-slot--empty"
                                    aria-hidden="true"
                                  >
                                    <Sprout size={30} />
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          {garden.forestUnlocked && (
                            <p className="kg-forest-note">
                              🌲 Rừng Tri Thức đã mở — mỗi lần có cây trưởng
                              thành, một cây mới lại được trồng thêm!
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

                <AnimatePresence>
                  {celebrate && (
                    <motion.div
                      className="kg-celebrate"
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                    >
                      {celebrate}
                    </motion.div>
                  )}
                </AnimatePresence>

                <TreeDetailModal
                  tree={selectedTree}
                  streak={data.garden.currentStreak}
                  onClose={() => setSelectedTreeId(null)}
                />
              </section>
            </>
          )}
        </div>
      </div>

      <KidRestBreakOverlay
        showRest={restBreak.showRest}
        showBreak={restBreak.showBreak}
        restLeft={restBreak.restLeft}
        breakLeft={restBreak.breakLeft}
        breathPhase={restBreak.breathPhase}
        eyeTip={restBreak.eyeTip}
        showRestTip={restBreak.showRestTip}
        onDismissRest={restBreak.dismissRest}
      />
    </div>
  );
}
