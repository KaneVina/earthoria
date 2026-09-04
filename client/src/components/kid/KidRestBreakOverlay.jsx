import { Eye, Wind, Sparkles } from "lucide-react";
import { fmtClock } from "../../hooks/useKidRestBreak";

const BREATH_PHASES = ["Hít vào thật sâu…", "Thở ra thật chậm…"];

export function KidRestBreakOverlay({
  showRest,
  showBreak,
  restLeft,
  breakLeft,
  breathPhase,
  eyeTip,
  showRestTip,
  onDismissRest,
}) {
  return (
    <>
      {showRest && !showBreak && (
        <div className="kid-overlay">
          <div className="kid-overlay-card">
            <div className="kid-breathe">
              <span className="kid-breathe-ring" />
              <span className="kid-breathe-ring d2" />
              <span className="kid-breathe-ring d3" />
              <span className="kid-breathe-core">
                <Eye
                  size={16}
                  className="kid-breathe-icon"
                  aria-hidden="true"
                />
                <span className="kid-breathe-count">{restLeft}</span>
                <span className="kid-breathe-unit">giây</span>
              </span>
            </div>
            <span className="kid-breathe-phase">
              {BREATH_PHASES[breathPhase]}
            </span>
            <h2 className="kid-overlay-title">Cho mắt nghỉ ngơi nào!</h2>
            <p className="kid-overlay-text">
              Bé hãy nhìn ra xa và hít thở thật sâu trong giây lát nhé.
            </p>
            {showRestTip && (
              <div className="kid-overlay-tip">
                <Sparkles size={14} /> {eyeTip}
              </div>
            )}
            <div>
              <button
                type="button"
                className="kid-overlay-skip"
                onClick={onDismissRest}
              >
                Đã nghỉ xong, đọc tiếp nào →
              </button>
            </div>
          </div>
        </div>
      )}

      {showBreak && (
        <div className="kid-overlay is-break">
          <div className="kid-overlay-card">
            <div className="kid-breathe">
              <span className="kid-breathe-ring" />
              <span className="kid-breathe-ring d2" />
              <span className="kid-breathe-ring d3" />
              <span className="kid-breathe-core">
                <Wind
                  size={16}
                  className="kid-breathe-icon"
                  aria-hidden="true"
                />
                <span className="kid-breathe-count">{fmtClock(breakLeft)}</span>
                <span className="kid-breathe-unit">còn lại</span>
              </span>
            </div>
            <span className="kid-breathe-phase">
              {BREATH_PHASES[breathPhase]}
            </span>
            <h2 className="kid-overlay-title">Giờ giải lao rồi!</h2>
            <p className="kid-overlay-text">
              Bé đã đọc miệt mài rồi đó — đứng dậy vươn vai, uống nước, rồi quay
              lại đọc tiếp nhé!
            </p>
          </div>
        </div>
      )}
    </>
  );
}
