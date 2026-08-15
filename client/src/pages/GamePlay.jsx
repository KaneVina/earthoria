import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, PlayCircle, Trophy, RotateCcw, ArrowLeft, Lock, SearchX, Info, Leaf, Sparkles } from "lucide-react";
import { gameService } from "../services/gameService";
import { getGameDefinition } from "../games/gameRegistry";
import "../components/assets/css/gameplay.css";

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
          navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
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
            Trò chơi này chỉ dành cho khách hàng đã mua và nhận được cuốn sách tương ứng. Nếu bạn đã mua sách này,
            vui lòng kiểm tra lại tài khoản đang đăng nhập hoặc liên hệ với chúng tôi để được hỗ trợ.
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
          <p>Mã trò chơi không tồn tại hoặc đã bị vô hiệu hoá. Vui lòng kiểm tra lại trang sách hoặc mã QR.</p>
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
        <Link to={data.book?.slug && data.book?.hashId ? `/books/${data.book.slug}/${data.book.hashId}` : "/"} className="gp-back">
          <ArrowLeft size={14} /> {data.book?.title || "Về trang sách"}
        </Link>
      </div>

      <div className="gp-shell">
        {stage === "intro" && (
          <div className="gp-intro">
            {data.thumbnailUrl && <img className="gp-intro-thumb" src={data.thumbnailUrl} alt="" />}
            <div className="gp-intro-icon">
              <Icon size={26} />
            </div>
            <span className="gp-eyebrow">{def?.label}</span>
            <h1>{data.title}</h1>
            {data.instructions && <p className="gp-instructions">{data.instructions}</p>}
            <button type="button" className="gp-cta" onClick={() => setStage("playing")}>
              <PlayCircle size={18} /> Bắt đầu chơi
            </button>
            <div className="gp-play-count">{data.playCount} người đã chơi trò này</div>
          </div>
        )}

        {stage === "playing" && Player && (
          <div className="gp-board">
            <h2 className="gp-board-title">{data.title}</h2>
            <Player config={data.config} onFinish={handleFinish} />
          </div>
        )}

        {stage === "finished" && (
          <div className="gp-finished">
            <div className="gp-finished-trophy">
              <Trophy size={30} />
            </div>
            <h1>Hoàn thành! 🎉</h1>
            <div className="gp-score">{result?.score ?? 0} điểm</div>
            {typeof result?.durationSeconds === "number" && (
              <div className="gp-duration">Thời gian: {result.durationSeconds}s</div>
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

            <button type="button" className="gp-cta" onClick={handleReplay}>
              <RotateCcw size={16} /> Chơi lại
            </button>
          </div>
        )}
      </div>
    </main>
  );
}