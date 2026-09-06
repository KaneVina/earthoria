import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Loader2,
  PlayCircle,
  Trophy,
  RotateCcw,
  ArrowLeft,
  Lock,
  SearchX,
  Info,
  Leaf,
  Sparkles,
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
import "../components/assets/css/gameplay.css";

// Quy đổi điểm số (thang điểm khác nhau tuỳ loại game, nhưng đều dao động
// quanh mốc ~50–1100) thành 1–3 sao để màn kết thúc trực quan như game thật.
function scoreToStars(score) {
  const s = Number(score) || 0;
  if (s >= 750) return 3;
  if (s >= 450) return 2;
  return 1;
}

const DIFFICULTY_META = {
  EASY: { label: "Dễ", cls: "easy" },
  MEDIUM: { label: "Trung bình", cls: "medium" },
  HARD: { label: "Khó", cls: "hard" },
};

// Tóm tắt "độ lớn" của trò chơi theo từng loại (số cặp/từ/câu hỏi/giới hạn giờ...)
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

function GpAmbient() {
  return (
    <div aria-hidden="true">
      <Leaf className="gp-ambient gp-ambient-1" />
      <Sparkles className="gp-ambient gp-ambient-2" />
      <Sparkles className="gp-ambient gp-ambient-3" />
      <Leaf className="gp-ambient gp-ambient-4" />
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
      // Không chặn trải nghiệm nếu ghi điểm lỗi — người chơi vẫn thấy kết quả của mình
    }
  };

  const handleReplay = () => {
    setResult(null);
    setLeaderboard([]);
    setStage("intro");
  };

  if (state.status === "loading") {
    return (
      <main className="gp-view gp-view--center">
        <GpAmbient />
        <div className="gp-loading">
          <Loader2 size={26} className="gp-spin" />
          <span>Đang tải trò chơi…</span>
        </div>
      </main>
    );
  }

  if (state.status === "forbidden") {
    return (
      <main className="gp-view gp-view--center">
        <GpAmbient />
        <div className="gp-empty">
          <div className="gp-empty-badge">
            <Lock size={22} />
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
        <GpAmbient />
        <div className="gp-empty">
          <div className="gp-empty-badge">
            <SearchX size={22} />
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

  return (
    <main className="gp-view">
      <GpAmbient />
      <div className="gp-topbar">
        <Link
          to={
            data.book?.slug && data.book?.hashId
              ? `/books/${data.book.slug}/${data.book.hashId}`
              : "/"
          }
          className="gp-back"
        >
          <ArrowLeft size={14} /> {data.book?.title || "Về trang sách"}
        </Link>
      </div>

      <div className="gp-shell">
        {stage === "intro" && (
          <div className="gp-intro">
            <div className="gp-intro-banner">
              {data.thumbnailUrl ? (
                <img
                  className="gp-intro-banner-img"
                  src={data.thumbnailUrl}
                  alt=""
                />
              ) : (
                <div className="gp-intro-banner-fallback" aria-hidden="true" />
              )}
              <div className="gp-intro-banner-shade" aria-hidden="true" />
              <div className="gp-intro-icon-dock">
                <div className="gp-intro-icon">
                  <Icon size={28} />
                </div>
              </div>
            </div>

            <div className="gp-intro-body">
              <div className="gp-badges-row">
                <span className="gp-eyebrow">{def?.label}</span>
                {DIFFICULTY_META[data.difficulty] && (
                  <span
                    className={`gp-difficulty-badge gp-difficulty-badge--${DIFFICULTY_META[data.difficulty].cls}`}
                  >
                    <Gauge size={11} />
                    {DIFFICULTY_META[data.difficulty].label}
                  </span>
                )}
              </div>

              <h1>{data.title}</h1>

              {data.description && (
                <p className="gp-description">{data.description}</p>
              )}

              {data.book?.title && (
                <Link
                  to={
                    data.book?.slug && data.book?.hashId
                      ? `/books/${data.book.slug}/${data.book.hashId}`
                      : "/"
                  }
                  className="gp-book-chip"
                >
                  {data.book.coverImage ? (
                    <img src={data.book.coverImage} alt="" />
                  ) : (
                    <BookOpen size={13} />
                  )}
                  <span>Trích từ sách "{data.book.title}"</span>
                </Link>
              )}

              {data.instructions && (
                <p className="gp-instructions">{data.instructions}</p>
              )}

              <div className="gp-intro-meta">
                <span className="gp-meta-chip">
                  <Users size={13} /> {data.playCount} người đã chơi
                </span>
                {getPlayStats(data.gameType, data.config).map((s, i) => (
                  <span className="gp-meta-chip" key={i}>
                    <s.icon size={13} /> {s.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="gp-intro-footer">
              <button
                type="button"
                className="gp-cta gp-cta-play"
                onClick={() => setStage("playing")}
              >
                <PlayCircle size={19} /> Bắt đầu chơi
              </button>
            </div>
          </div>
        )}

        {stage === "playing" && Player && (
          <div className="gp-board">
            <div className="gp-board-frame">
              <div className="gp-board-frame-header">
                <span className="gp-board-badge">
                  <Icon size={13} /> {def?.shortLabel || def?.label}
                </span>
                <h2 className="gp-board-title">{data.title}</h2>
              </div>
              <div className="gp-board-screen">
                <Player config={data.config} onFinish={handleFinish} />
              </div>
            </div>
          </div>
        )}

        {stage === "finished" && (
          <div className="gp-finished">
            <div className="gp-stars" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <Star
                  key={n}
                  size={30}
                  className={`gp-star${n <= scoreToStars(result?.score) ? " filled" : ""}`}
                  style={{ animationDelay: `${n * 0.12}s` }}
                />
              ))}
            </div>

            <div className="gp-finished-trophy">
              <Trophy size={30} />
            </div>
            <h1>Hoàn thành! 🎉</h1>
            <div className="gp-score">{result?.score ?? 0} điểm</div>
            {typeof result?.durationSeconds === "number" && (
              <div className="gp-duration">
                Thời gian: {result.durationSeconds}s
              </div>
            )}

            {leaderboard.length > 0 && (
              <div className="gp-leaderboard">
                <div className="gp-leaderboard-head">Bảng xếp hạng</div>
                {leaderboard.slice(0, 5).map((r, i) => (
                  <div className="gp-leaderboard-row" key={r.id}>
                    <span className="gp-leaderboard-rank">{i + 1}</span>
                    <span className="gp-leaderboard-name">
                      {r.avatarEmoji ? `${r.avatarEmoji} ` : ""}
                      {r.displayName}
                    </span>
                    <span className="gp-leaderboard-score">{r.score}đ</span>
                  </div>
                ))}
              </div>
            )}

            <div className="gp-finished-actions">
              <button type="button" className="gp-cta" onClick={handleReplay}>
                <RotateCcw size={16} /> Chơi lại
              </button>
              <Link
                to={
                  data.book?.slug && data.book?.hashId
                    ? `/books/${data.book.slug}/${data.book.hashId}`
                    : "/"
                }
                className="gp-cta gp-cta-ghost"
              >
                <ArrowLeft size={16} /> Về trang sách
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
