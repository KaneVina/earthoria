import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  PlayCircle,
  Trophy,
  RotateCcw,
  ArrowLeft,
  Lock,
  SearchX,
  Info,
  Star,
  Users,
  Gauge,
  BookOpen,
  Layers,
  Search,
  Type,
  Timer,
  HelpCircle,
} from "lucide-react";
import { gameService } from "../services/gameService";
import { getGameDefinition } from "../games/gameRegistry";
import FullScreenLoader from "../components/FullScreenLoader";
import "../components/assets/css/gameplay.css";

// Quy đổi điểm số (thang điểm khác nhau tuỳ loại game, nhưng đều dao động
// quanh mốc ~50–1100) thành 1–3 sao để màn kết thúc trực quan như game thật.
function scoreToStars(score) {
  const s = Number(score) || 0;
  if (s >= 750) return 3;
  if (s >= 450) return 2;
  return 1;
}

// Một dòng nhận xét ngắn kèm sao - cho màn kết quả có cảm giác "game thật"
// thay vì chỉ hiện một con số trơ trọi.
function scoreToGrade(score) {
  const s = Number(score) || 0;
  if (s >= 750) return "Xuất sắc lắm, bé thật giỏi!";
  if (s >= 450) return "Khá tốt, cố thêm chút nữa nhé!";
  return "Hoàn thành rồi, chơi lại để đạt điểm cao hơn nhé!";
}

const DIFFICULTY_META = {
  EASY: { label: "Dễ", cls: "easy" },
  MEDIUM: { label: "Trung bình", cls: "medium" },
  HARD: { label: "Khó", cls: "hard" },
};

// Ba chặng của một lượt chơi - dùng cho thanh tiến trình trong HUD.
const STEPS = [
  { key: "intro", label: "Giới thiệu" },
  { key: "playing", label: "Đang chơi" },
  { key: "finished", label: "Kết quả" },
];

// Tóm tắt "độ lớn" của trò chơi theo từng loại (số cặp/từ/câu hỏi/giới hạn giờ...)
// để người chơi biết trước mình sắp thử thách gì, không cần thêm dữ liệu backend mới.
function getPlayStats(gameType, config) {
  if (!config) return [];
  switch (gameType) {
    case "MEMORY_MATCH":
    case "MATCH_PAIRS":
      return config.pairs?.length
        ? [{ icon: Layers, label: `${config.pairs.length} cặp` }]
        : [];
    case "WORD_SEARCH":
      return config.words?.length
        ? [{ icon: Search, label: `${config.words.length} từ cần tìm` }]
        : [];
    case "LETTER_HUNT": {
      const stats = [];
      if (config.secretWord) {
        stats.push({
          icon: Type,
          label: `${config.secretWord.replace(/\s/g, "").length} chữ cái`,
        });
      }
      if (config.timeLimitSeconds) {
        stats.push({
          icon: Timer,
          label: `${config.timeLimitSeconds}s giới hạn`,
        });
      }
      return stats;
    }
    case "QUIZ_CHOICE":
      return config.questions?.length
        ? [{ icon: HelpCircle, label: `${config.questions.length} câu hỏi` }]
        : [];
    default:
      return [];
  }
}

// Thanh tiến trình gọn trong HUD - 1 track + nhãn bước hiện tại,
// thay cho 3 chấm rời rạc trước đây.
function GpHudProgress({ stage }) {
  const idx = Math.max(
    0,
    STEPS.findIndex((s) => s.key === stage),
  );
  const pct = ((idx + 1) / STEPS.length) * 100;
  return (
    <div className="gp-hud-progress" aria-label="Tiến trình trò chơi">
      <span className="gp-hud-progress-step">
        Bước {idx + 1}/{STEPS.length}
      </span>
      <span className="gp-hud-progress-track">
        <span className="gp-hud-progress-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="gp-hud-progress-label">{STEPS[idx].label}</span>
    </div>
  );
}

// Huy chương xếp hạng (top 3) hiển thị dạng bục nhận giải thay vì
// danh sách phẳng - trực quan hơn cho phần thi đấu/so tài.
function PodiumItem({ rank, entry }) {
  return (
    <div className={`gp-podium-item gp-podium-item--${rank}`}>
      <span className="gp-podium-medal">{rank}</span>
      {entry.avatarEmoji && (
        <span className="gp-podium-avatar">{entry.avatarEmoji}</span>
      )}
      <span className="gp-podium-name">{entry.displayName}</span>
      <span className="gp-podium-score">{entry.score}đ</span>
    </div>
  );
}

export default function GamePlay() {
  const { slug, code } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({ status: "loading", data: null });
  const [stage, setStage] = useState("intro"); // intro | playing | finished
  const [result, setResult] = useState(null); // { score, durationSeconds }
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchGame() {
      try {
        const res = await gameService.getGame(code);
        if (cancelled) return;
        const data = res.data?.data;
        if (!data) {
          setState({ status: "not-found", data: null });
          return;
        }
        if (data.book?.slug && data.book.slug !== slug) {
          navigate(`/game/${data.book.slug}/${code}`, { replace: true });
        }
        setState({ status: "ready", data });
      } catch (err) {
        if (cancelled) return;
        const httpStatus = err.response?.status;

        if (httpStatus === 401) {
          const currentUrl = `${window.location.pathname}${window.location.search}`;
          navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, {
            replace: true,
          });
          return;
        }
        if (httpStatus === 403) {
          setState({ status: "forbidden", data: null });
          return;
        }
        setState({ status: "not-found", data: null });
      }
    }

    fetchGame();
    return () => {
      cancelled = true;
    };
  }, [code, slug, navigate]);

  const handleFinish = async (score, durationSeconds) => {
    setResult({ score, durationSeconds });
    setStage("finished");
    try {
      await gameService.completeGame(code, { score, durationSeconds });
      const lb = await gameService.getLeaderboard(code);
      setLeaderboard(lb.data?.data || []);
    } catch {
      // Không chặn trải nghiệm nếu ghi điểm lỗi - người chơi vẫn thấy kết quả của mình
    }
  };

  const handleReplay = () => {
    setResult(null);
    setLeaderboard([]);
    setStage("intro");
  };

  if (state.status === "loading") {
    return <FullScreenLoader message="Đang tải trò chơi..." />;
  }

  if (state.status === "forbidden") {
    return (
      <main className="gp-view gp-view--center">
        <div className="gp-empty">
          <div className="gp-empty-badge">
            <Lock size={24} />
          </div>
          <span className="gp-eyebrow">Trò chơi</span>
          <h1>Bạn chưa có quyền chơi trò chơi này</h1>
          <p>
            Trò chơi này chỉ dành cho khách hàng đã mua và nhận được cuốn sách
            tương ứng. Nếu bạn đã mua sách này, vui lòng kiểm tra lại tài khoản
            đang đăng nhập hoặc liên hệ với chúng tôi để được hỗ trợ.
          </p>
        </div>
      </main>
    );
  }

  if (state.status === "not-found") {
    return (
      <main className="gp-view gp-view--center">
        <div className="gp-empty">
          <div className="gp-empty-badge">
            <SearchX size={24} />
          </div>
          <span className="gp-eyebrow">Trò chơi</span>
          <h1>Không tìm thấy trò chơi này</h1>
          <p>
            Mã trò chơi không tồn tại hoặc đã bị vô hiệu hoá. Vui lòng kiểm tra
            lại trang sách hoặc mã QR.
          </p>
        </div>
      </main>
    );
  }

  const { data } = state;
  const def = getGameDefinition(data.gameType);
  const Icon = def?.icon || Info;
  const Player = def?.Player;
  const bookHref =
    data.book?.slug && data.book?.hashId
      ? `/books/${data.book.slug}/${data.book.hashId}`
      : "/";
  const difficultyMeta = DIFFICULTY_META[data.difficulty];
  const playStats = getPlayStats(data.gameType, data.config);
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 5);

  return (
    <main className="gp-view">
      <header className="gp-hud">
        <div className="gp-hud-inner">
          <Link to={bookHref} className="gp-back">
            <ArrowLeft size={14} />{" "}
            <span>{data.book?.title || "Về trang sách"}</span>
          </Link>
          <GpHudProgress stage={stage} />
        </div>
      </header>

      <div className="gp-shell">
        {stage === "intro" && (
          <div className="gp-intro">
            {/* Dải hero rộng toàn chiều ngang - tiêu đề game nằm ngay trên ảnh minh hoạ */}
            <div className="gp-intro-visual">
              {data.thumbnailUrl ? (
                <img src={data.thumbnailUrl} alt="" />
              ) : (
                <div className="gp-intro-visual-fallback" aria-hidden="true">
                  <Icon />
                </div>
              )}
              <div className="gp-intro-hero-content">
                <div className="gp-badges-row">
                  <span className="gp-eyebrow">
                    <Icon size={13} /> {def?.label}
                  </span>
                  {difficultyMeta && (
                    <span
                      className={`gp-difficulty-badge gp-difficulty-badge--${difficultyMeta.cls}`}
                    >
                      <Gauge size={11} />
                      {difficultyMeta.label}
                    </span>
                  )}
                </div>
                <h1>{data.title}</h1>
              </div>
            </div>

            {/* Hàng dưới: nội dung mô tả bên trái (rộng hơn), số liệu + nút chơi bên phải */}
            <div className="gp-intro-grid">
              <div className="gp-intro-panel">
                <div className="gp-description-card">
                  {data.description && (
                    <p className="gp-description">{data.description}</p>
                  )}

                  {data.book?.title && (
                    <Link to={bookHref} className="gp-book-chip">
                      {data.book.coverImage ? (
                        <img src={data.book.coverImage} alt="" />
                      ) : (
                        <BookOpen size={13} />
                      )}
                      <span>Trích từ sách "{data.book.title}"</span>
                    </Link>
                  )}
                </div>

                {data.instructions && (
                  <div className="gp-howto">
                    <div className="gp-howto-icon">
                      <Info size={16} />
                    </div>
                    <div className="gp-howto-body">
                      <span className="gp-howto-label">Cách chơi</span>
                      <p>{data.instructions}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="gp-intro-side">
                <div className="gp-stats-grid">
                  <div className="gp-stat-card gp-stat-card--accent">
                    <span className="gp-stat-card-icon">
                      <Users size={16} />
                    </span>
                    <span>{data.playCount} lượt chơi</span>
                  </div>
                  {playStats.map((s, i) => (
                    <div className="gp-stat-card" key={i}>
                      <span className="gp-stat-card-icon">
                        <s.icon size={16} />
                      </span>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="gp-intro-footer">
                  <button
                    type="button"
                    className="gp-cta gp-cta-play"
                    onClick={() => setStage("playing")}
                  >
                    <PlayCircle size={20} /> Bắt đầu chơi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {stage === "playing" && Player && (
          <div className="gp-arena">
            <div className="gp-arena-top">
              <div className="gp-arena-heading">
                <span className="gp-arena-icon">
                  <Icon size={22} />
                </span>
                <div>
                  <span className="gp-arena-kicker">
                    {def?.shortLabel || def?.label}
                  </span>
                  <h2 className="gp-arena-title">{data.title}</h2>
                </div>
              </div>
              <div className="gp-arena-meta">
                {difficultyMeta && (
                  <span
                    className={`gp-difficulty-badge gp-difficulty-badge--${difficultyMeta.cls}`}
                  >
                    <Gauge size={11} />
                    {difficultyMeta.label}
                  </span>
                )}
              </div>
            </div>
            <div className="gp-arena-surface">
              <span className="gp-corner gp-corner--tl" aria-hidden="true" />
              <span className="gp-corner gp-corner--tr" aria-hidden="true" />
              <span className="gp-corner gp-corner--bl" aria-hidden="true" />
              <span className="gp-corner gp-corner--br" aria-hidden="true" />
              <Player config={data.config} onFinish={handleFinish} />
            </div>
          </div>
        )}

        {stage === "finished" && (
          <div
            className={`gp-finished${leaderboard.length > 0 ? " gp-finished--with-board" : ""}`}
          >
            <div className="gp-finished-hero">
              <div className="gp-stars" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <Star
                    key={n}
                    size={32}
                    className={`gp-star${n <= scoreToStars(result?.score) ? " filled" : ""}`}
                    style={{ animationDelay: `${n * 0.12}s` }}
                  />
                ))}
              </div>

              <div className="gp-finished-trophy">
                <Trophy size={32} />
              </div>
              <h1>Hoàn thành! 🎉</h1>
              <p className="gp-finished-grade">{scoreToGrade(result?.score)}</p>
              <div className="gp-score-block">
                <span className="gp-score">{result?.score ?? 0}</span>
                <span className="gp-score-unit">điểm</span>
              </div>
              {typeof result?.durationSeconds === "number" && (
                <div className="gp-duration">
                  <Timer size={13} /> Thời gian: {result.durationSeconds}s
                </div>
              )}
            </div>

            {leaderboard.length > 0 && (
              <div className="gp-leaderboard">
                <div className="gp-leaderboard-head">
                  <Trophy size={14} /> Bảng xếp hạng
                </div>

                {top3.length > 0 && (
                  <div className="gp-podium">
                    {top3.map((r, i) => (
                      <PodiumItem key={r.id} rank={i + 1} entry={r} />
                    ))}
                  </div>
                )}

                {rest.length > 0 && (
                  <div className="gp-leaderboard-list">
                    {rest.map((r, i) => (
                      <div className="gp-leaderboard-row" key={r.id}>
                        <span className="gp-leaderboard-rank">{i + 4}</span>
                        <span className="gp-leaderboard-name">
                          {r.avatarEmoji ? `${r.avatarEmoji} ` : ""}
                          {r.displayName}
                        </span>
                        <span className="gp-leaderboard-score">{r.score}đ</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="gp-finished-actions">
              <button type="button" className="gp-cta" onClick={handleReplay}>
                <RotateCcw size={16} /> Chơi lại
              </button>
              <Link to={bookHref} className="gp-cta gp-cta-ghost">
                <ArrowLeft size={16} /> Về trang sách
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
